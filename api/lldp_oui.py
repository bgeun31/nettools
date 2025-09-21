from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List
import io
import os
import re
import pandas as pd

router = APIRouter()


SYSNAME_PATTERNS = [
    re.compile(r"SysName\s*:\s*(.+)"),
    re.compile(r'sysName\s+"(\S+)"'),
]


def natural_sort_key(text: str):
    parts = re.split(r"(\d+)", text)
    key = []
    for p in parts:
        if p.isdigit():
            key.append(int(p))
        else:
            key.append(p.lower())
    return key


def _extract_by_patterns(patterns: List[re.Pattern], content: str) -> str | None:
    for pat in patterns:
        m = pat.search(content)
        if m:
            return m.group(1).strip()
    return None


def _parse_oui_lines(ouis_text: str | None) -> List[str]:
    if not ouis_text:
        return []
    prefixes: List[str] = []
    for line in ouis_text.splitlines():
        line = line.strip()
        if not line:
            continue
        # extract first 8 hex+colon like pattern from the line
        m = re.search(r"([0-9A-Fa-f]{2}[:\-][0-9A-Fa-f]{2}[:\-][0-9A-Fa-f]{2})", line)
        if m:
            pref = m.group(1).upper().replace('-', ':')
            prefixes.append(pref)
        else:
            # maybe given as 6 hex chars (e.g., 001B21)
            m2 = re.search(r"^[0-9A-Fa-f]{6}$", line)
            if m2:
                s = line.upper()
                prefixes.append(f"{s[0:2]}:{s[2:4]}:{s[4:6]}")
    return prefixes


def _collect_mac_ouis(content: str) -> List[str]:
    # find MAC-like patterns and return OUIs (first 3 bytes)
    macs = re.findall(r"\b([0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5})\b", content)
    ouis: set[str] = set()
    for mac in macs:
        parts = mac.upper().split(':')
        ouis.add(':'.join(parts[:3]))
    return sorted(list(ouis))


def _parse_one(content: str, ouis: List[str], auto_detect: bool, strip_prefix: str) -> list[list[str]]:
    rows: list[list[str]] = []
    sysname_full = _extract_by_patterns(SYSNAME_PATTERNS, content) or "Unknown"
    # LLDP lines: capture port, mac, port_id, neighbor (last token)
    lldp_lines = re.findall(r'^\s*(\d+)\s+([\w:]+)\s+(\S+)\s+\S+\s+\S+\s+(\S+)', content, re.MULTILINE)

    # if auto_detect and no explicit ouis provided, collect from content
    eff_ouis = ouis
    if auto_detect and not eff_ouis:
        eff_ouis = _collect_mac_ouis(content)

    for port_num, mac, port_id_raw, neighbor_full in lldp_lines:
        mac_norm = mac.upper()
        # match prefix
        if eff_ouis and not any(mac_norm.startswith(prefix) for prefix in eff_ouis):
            continue
        neighbor_name = neighbor_full
        if strip_prefix and neighbor_name.startswith(strip_prefix):
            neighbor_name = neighbor_name[len(strip_prefix):]
        c_match = re.search(r'/(\d+)', port_id_raw)
        c = c_match.group(1) if c_match else port_id_raw
        # strip prefix from sysname too, if present
        sysname_out = sysname_full
        if strip_prefix and sysname_out.startswith(strip_prefix):
            sysname_out = sysname_out[len(strip_prefix):]
        rows.append([sysname_out, f'P{port_num}', neighbor_name, f'P{c}', '-'])
    return rows


@router.post("/lldp/oui/preview")
async def lldp_oui_preview(
    files: List[UploadFile] = File(...),
    ouis: str = Form(""),
    auto_detect: bool = Form(True),
    strip_prefix: str = Form("PUSTC_"),
):
    prefix_list = _parse_oui_lines(ouis)
    all_rows: list[list[str]] = []
    for f in files:
        content = (await f.read()).decode("utf-8", errors="ignore")
        rows = _parse_one(content, prefix_list, auto_detect, strip_prefix)
        if rows:
            all_rows.extend(rows)
    if not all_rows:
        return []
    df = pd.DataFrame(all_rows, columns=["sysName", "Port", "NeighborName", "NeighborPort", "End"])  
    df_sorted = df.sort_values(by=["sysName"], key=lambda s: s.map(natural_sort_key))
    return df_sorted.to_dict(orient="records")


@router.post("/lldp/oui/excel")
async def lldp_oui_excel(
    files: List[UploadFile] = File(...),
    ouis: str = Form(""),
    auto_detect: bool = Form(True),
    strip_prefix: str = Form("PUSTC_"),
):
    prefix_list = _parse_oui_lines(ouis)
    all_rows: list[list[str]] = []
    for f in files:
        content = (await f.read()).decode("utf-8", errors="ignore")
        rows = _parse_one(content, prefix_list, auto_detect, strip_prefix)
        if rows:
            all_rows.extend(rows)
    df = pd.DataFrame(all_rows, columns=["sysName", "Port", "NeighborName", "NeighborPort", "End"]) if all_rows else pd.DataFrame(columns=["sysName", "Port", "NeighborName", "NeighborPort", "End"])
    df_sorted = df.sort_values(by=["sysName"], key=lambda s: s.map(natural_sort_key)) if not df.empty else df

    # insert blank line between groups
    final_rows: list[list[str]] = []
    prev = None
    for row in df_sorted.itertuples(index=False):
        current = row.sysName
        if prev is not None and current != prev:
            final_rows.append(["", "", "", "", ""])  
        final_rows.append(list(row))
        prev = current
    out_df = pd.DataFrame(final_rows, columns=["sysName", "Port", "NeighborName", "NeighborPort", "End"]) if final_rows else df_sorted
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine="openpyxl") as writer:
        out_df.to_excel(writer, index=False)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=lldp-oui.xlsx"},
    )

