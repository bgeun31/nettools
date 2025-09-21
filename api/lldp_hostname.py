from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List
import io
import os
import re
import pandas as pd
from openpyxl import Workbook

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


def _compile_patterns(pattern_text: str | None) -> List[re.Pattern]:
    if not pattern_text:
        return []
    # support newline/comma separated, allow wildcard '*'
    raw_items = [x.strip() for x in re.split(r"[\n,]", pattern_text) if x.strip()]
    patterns: List[re.Pattern] = []
    for item in raw_items:
        # convert shell-like * to .*
        esc = item
        esc = esc.replace("*", ".*")
        try:
            patterns.append(re.compile(esc))
        except re.error:
            # fallback to literal search
            patterns.append(re.compile(re.escape(item)))
    return patterns


def _match_any(text: str, patterns: List[re.Pattern]) -> bool:
    if not patterns:
        # if no filter provided, accept all
        return True
    return any(p.search(text) for p in patterns)


def _parse_one(content: str, neighbor_patterns: List[re.Pattern], strip_prefix: str) -> list[list[str]]:
    rows: list[list[str]] = []
    sysname_full = _extract_by_patterns(SYSNAME_PATTERNS, content) or ""
    if not sysname_full:
        return rows

    if not _match_any(sysname_full, neighbor_patterns):
        return rows

    sysname_out = sysname_full
    if strip_prefix and sysname_out.startswith(strip_prefix):
        sysname_out = sysname_out[len(strip_prefix):]

    # LLDP table line format (flexible):
    # port   mac           port-id      ...  neighbor
    # capture: (port_num)(mac)(port_id_raw)(neighbor)
    lldp_lines = re.findall(r'^\s*(\d+)\s+([\w:]+)\s+(\S+)\s+\S+\s+\S+\s+(\S+)', content, re.MULTILINE)
    for port_num, mac, port_id_raw, neighbor_full in lldp_lines:
        if not _match_any(neighbor_full, neighbor_patterns):
            continue
        neighbor_name = neighbor_full
        if strip_prefix and neighbor_name.startswith(strip_prefix):
            neighbor_name = neighbor_name[len(strip_prefix):]

        c_match = re.search(r'/(\d+)', port_id_raw)
        c = c_match.group(1) if c_match else port_id_raw
        rows.append([sysname_out, f'P{port_num}', neighbor_name, f'P{c}', '-'])
    return rows


@router.post("/lldp/hostname/preview")
async def lldp_hostname_preview(
    files: List[UploadFile] = File(...),
    pattern: str = Form(""),
    strip_prefix: str = Form(""),
    include_description: bool = Form(False),  # reserved, not used currently
):
    neighbor_patterns = _compile_patterns(pattern)
    all_rows: list[list[str]] = []
    for f in files:
        content = (await f.read()).decode("utf-8", errors="ignore")
        rows = _parse_one(content, neighbor_patterns, strip_prefix)
        if rows:
            all_rows.extend(rows)

    if not all_rows:
        return []

    df = pd.DataFrame(all_rows, columns=["sysName", "Port", "NeighborName", "NeighborPort", "End"])
    df_sorted = df.sort_values(by=["sysName"], key=lambda s: s.map(natural_sort_key))
    return df_sorted.to_dict(orient="records")


@router.post("/lldp/hostname/excel")
async def lldp_hostname_excel(
    files: List[UploadFile] = File(...),
    pattern: str = Form(""),
    strip_prefix: str = Form(""),
    include_description: bool = Form(False),  # reserved
):
    neighbor_patterns = _compile_patterns(pattern)
    all_rows: list[list[str]] = []
    for f in files:
        content = (await f.read()).decode("utf-8", errors="ignore")
        rows = _parse_one(content, neighbor_patterns, strip_prefix)
        if rows:
            all_rows.extend(rows)

    df = pd.DataFrame(all_rows, columns=["sysName", "Port", "NeighborName", "NeighborPort", "End"]) if all_rows else pd.DataFrame(columns=["sysName", "Port", "NeighborName", "NeighborPort", "End"])
    df_sorted = df.sort_values(by=["sysName"], key=lambda s: s.map(natural_sort_key)) if not df.empty else df

    # insert blank line between groups of sysName
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
        headers={"Content-Disposition": "attachment; filename=lldp-hostname.xlsx"},
    )

