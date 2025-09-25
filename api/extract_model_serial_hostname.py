# backend/extract_model_serial_hostname.py
from fastapi import APIRouter, UploadFile, File, Form
import pandas as pd
import io
from fastapi.responses import StreamingResponse
import re
import zipfile

router = APIRouter()

# 정규식 패턴 (원래 코드에서 옮김)
patterns = {
    "sysname": [re.compile(r"SysName\s*:\s*(.+)"), re.compile(r'sysName\s+"(\S+)"')],
    "serial": [re.compile(r"Serial#\s*:\s*(.+)"), re.compile(r'Switch\s*:\s*\S+\s+(\S+)')],
    "model": [
        re.compile(r"ModelName\s*:\s*(.+)"),
        re.compile(r"Chassis\s*:\s*(.+)"),
        re.compile(r"System Type\s*:\s*(.+)"),
    ],
    # Image info (EXOS) - capture version numbers only
    "image": [
        # From 'Image :' line in 'show version'
        re.compile(r"(?im)Image\s*:\s.*?\b(\d+(?:\.\d+){1,3})\b"),
        # Fallback to 'Primary ver:' or 'Secondary ver:' numeric version
        re.compile(r"(?im)Primary\s+ver\s*:\s*(\d+(?:\.\d+){1,3})"),
        re.compile(r"(?im)Secondary\s+ver\s*:\s*(\d+(?:\.\d+){1,3})"),
    ],
    "image_selected": [re.compile(r"Image\s*Selected\s*:\s*(\S+)")],
    "image_booted": [re.compile(r"Image\s*Booted\s*:\s*(\S+)")],
    # IP 추출: 로그 본문에서 우선 추출, 실패 시 파일명에서 추출
    "ip": [
        # EXOS 등에서 Mgmt/MGMT/Management가 포함된 라인에서 IP
        re.compile(r"(?i)\b(?:mgmt|management)\b.*?((?:\d{1,3}\.){3}\d{1,3})"),
        # VLAN 표처럼 'IP/Mask' 형태
        re.compile(r"\b((?:\d{1,3}\.){3}\d{1,3})\b\s*/\d{1,2}"),
        # 'IP:' 또는 'Address:' 표기
        re.compile(r"(?i)\b(?:ip(?:v4)?|addr(?:ess)?)\b\s*[:=]\s*((?:\d{1,3}\.){3}\d{1,3})"),
    ],
    "filename": [re.compile(r"^(\d{1,3}(?:\.\d{1,3}){3})_")],
}

def extract_by_patterns(pattern_list, text: str):
    for p in pattern_list:
        m = p.search(text)
        if m:
            return m.group(1).strip()
    return "없음"

@router.post("/extract/json")
async def extract_json(
    files: list[UploadFile] = File(...),
    include_ip: bool = Form(True),
    include_model: bool = Form(True),
    include_serial: bool = Form(True),
    include_hostname: bool = Form(True),
    include_image: bool = Form(True),
    include_image_selected: bool = Form(True),
    include_image_booted: bool = Form(True),
):
    results = []
    for f in files:
        content = (await f.read()).decode("utf-8", errors="ignore")

        sysname = extract_by_patterns(patterns["sysname"], content)
        serial = extract_by_patterns(patterns["serial"], content)
        model = extract_by_patterns(patterns["model"], content)
        image = extract_by_patterns(patterns["image"], content)
        image_selected = extract_by_patterns(patterns["image_selected"], content)
        image_booted = extract_by_patterns(patterns["image_booted"], content)
        ip_addr = extract_by_patterns(patterns["ip"], content)
        if ip_addr == "없음":
            ip_addr = extract_by_patterns(patterns["filename"], f.filename)

        row = {
            "ip": ip_addr,
            "hostname": sysname,
            "serial": serial,
            "model": model,
            "image": image,
            "image_selected": image_selected,
            "image_booted": image_booted,
        }

        # 선택된 항목만 반환
        filtered = {}
        if include_ip:
            filtered["ip"] = row["ip"]
        if include_hostname:
            filtered["hostname"] = row["hostname"]
        if include_serial:
            filtered["serial"] = row["serial"]
        if include_model:
            filtered["model"] = row["model"]
        if include_image:
            filtered["image"] = row["image"]
        if include_image_selected:
            filtered["image_selected"] = row["image_selected"]
        if include_image_booted:
            filtered["image_booted"] = row["image_booted"]
        results.append(filtered)
    return results

@router.post("/extract/excel")
async def extract_excel(
    files: list[UploadFile] = File(...),
    include_ip: bool = Form(True),
    include_model: bool = Form(True),
    include_serial: bool = Form(True),
    include_hostname: bool = Form(True),
    include_image: bool = Form(True),
    include_image_selected: bool = Form(True),
    include_image_booted: bool = Form(True),
):
    rows = []
    for f in files:
        content = (await f.read()).decode("utf-8", errors="ignore")
        sysname = extract_by_patterns(patterns["sysname"], content)
        serial = extract_by_patterns(patterns["serial"], content)
        model = extract_by_patterns(patterns["model"], content)
        image = extract_by_patterns(patterns["image"], content)
        image_selected = extract_by_patterns(patterns["image_selected"], content)
        image_booted = extract_by_patterns(patterns["image_booted"], content)
        ip_addr = extract_by_patterns(patterns["ip"], content)
        if ip_addr == "없음":
            ip_addr = extract_by_patterns(patterns["filename"], f.filename)
        rows.append({
            "ip": ip_addr,
            "hostname": sysname,
            "serial": serial,
            "model": model,
            "image": image,
            "image_selected": image_selected,
            "image_booted": image_booted,
        })

    df = pd.DataFrame(rows)
    # 열 선택: 체크박스에 따라 필터링
    columns = []
    if include_ip:
        columns.append("ip")
    if include_hostname:
        columns.append("hostname")
    if include_serial:
        columns.append("serial")
    if include_model:
        columns.append("model")
    if include_image:
        columns.append("image")
    if include_image_selected:
        columns.append("image_selected")
    if include_image_booted:
        columns.append("image_booted")

    df = df[columns]
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="extracted")
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=extract.xlsx"},
    )

@router.post("/extract/zip/json")
async def extract_zip_json(
    zip: UploadFile = File(...),
    include_ip: bool = Form(True),
    include_model: bool = Form(True),
    include_serial: bool = Form(True),
    include_hostname: bool = Form(True),
    include_image: bool = Form(True),
    include_image_selected: bool = Form(True),
    include_image_booted: bool = Form(True),
):
    data = await zip.read()
    zf = zipfile.ZipFile(io.BytesIO(data))
    results = []
    for name in zf.namelist():
        if name.endswith("/"):
            continue
        lower = name.lower()
        if not (lower.endswith(".log") or lower.endswith(".txt")):
            continue
        content = zf.read(name).decode("utf-8", errors="ignore")

        sysname = extract_by_patterns(patterns["sysname"], content)
        serial = extract_by_patterns(patterns["serial"], content)
        model = extract_by_patterns(patterns["model"], content)
        image = extract_by_patterns(patterns["image"], content)
        image_selected = extract_by_patterns(patterns["image_selected"], content)
        image_booted = extract_by_patterns(patterns["image_booted"], content)
        ip_addr = extract_by_patterns(patterns["ip"], content)
        if ip_addr == "?�음":
            ip_addr = extract_by_patterns(patterns["filename"], name.split("/")[-1])

        row = {
            "ip": ip_addr,
            "hostname": sysname,
            "serial": serial,
            "model": model,
            "image": image,
            "image_selected": image_selected,
            "image_booted": image_booted,
        }

        filtered = {}
        if include_ip:
            filtered["ip"] = row["ip"]
        if include_hostname:
            filtered["hostname"] = row["hostname"]
        if include_serial:
            filtered["serial"] = row["serial"]
        if include_model:
            filtered["model"] = row["model"]
        if include_image:
            filtered["image"] = row["image"]
        if include_image_selected:
            filtered["image_selected"] = row["image_selected"]
        if include_image_booted:
            filtered["image_booted"] = row["image_booted"]
        results.append(filtered)
    return results


@router.post("/extract/zip/excel")
async def extract_zip_excel(
    zip: UploadFile = File(...),
    include_ip: bool = Form(True),
    include_model: bool = Form(True),
    include_serial: bool = Form(True),
    include_hostname: bool = Form(True),
    include_image: bool = Form(True),
    include_image_selected: bool = Form(True),
    include_image_booted: bool = Form(True),
):
    data = await zip.read()
    zf = zipfile.ZipFile(io.BytesIO(data))
    rows = []
    for name in zf.namelist():
        if name.endswith("/"):
            continue
        lower = name.lower()
        if not (lower.endswith(".log") or lower.endswith(".txt")):
            continue
        content = zf.read(name).decode("utf-8", errors="ignore")

        sysname = extract_by_patterns(patterns["sysname"], content)
        serial = extract_by_patterns(patterns["serial"], content)
        model = extract_by_patterns(patterns["model"], content)
        image = extract_by_patterns(patterns["image"], content)
        image_selected = extract_by_patterns(patterns["image_selected"], content)
        image_booted = extract_by_patterns(patterns["image_booted"], content)
        ip_addr = extract_by_patterns(patterns["ip"], content)
        if ip_addr == "?�음":
            ip_addr = extract_by_patterns(patterns["filename"], name.split("/")[-1])
        rows.append({
            "ip": ip_addr,
            "hostname": sysname,
            "serial": serial,
            "model": model,
            "image": image,
            "image_selected": image_selected,
            "image_booted": image_booted,
        })

    df = pd.DataFrame(rows)
    columns = []
    if include_ip:
        columns.append("ip")
    if include_hostname:
        columns.append("hostname")
    if include_serial:
        columns.append("serial")
    if include_model:
        columns.append("model")
    if include_image:
        columns.append("image")
    if include_image_selected:
        columns.append("image_selected")
    if include_image_booted:
        columns.append("image_booted")

    df = df[columns]
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="extracted")
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=extract.xlsx"},
    )

# moved Directory Listing and SecureCRT endpoints to dedicated modules
