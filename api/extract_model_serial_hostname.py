# backend/extract_model_serial_hostname.py
from fastapi import APIRouter, UploadFile, File, Form
import pandas as pd
import io
from fastapi.responses import StreamingResponse
import re

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
    include_model: bool = Form(True),
    include_serial: bool = Form(True),
    include_hostname: bool = Form(True),
):
    results = []
    for f in files:
        content = (await f.read()).decode("utf-8", errors="ignore")

        sysname = extract_by_patterns(patterns["sysname"], content)
        serial = extract_by_patterns(patterns["serial"], content)
        model = extract_by_patterns(patterns["model"], content)
        filename = extract_by_patterns(patterns["filename"], f.filename)

        row = {
            "ip": filename,
            "hostname": sysname,
            "serial": serial,
            "model": model,
        }

        # 선택된 항목만 반환 (ip는 항상 포함)
        filtered = {"ip": row["ip"]}
        if include_hostname:
            filtered["hostname"] = row["hostname"]
        if include_serial:
            filtered["serial"] = row["serial"]
        if include_model:
            filtered["model"] = row["model"]
        results.append(filtered)
    return results

@router.post("/extract/excel")
async def extract_excel(
    files: list[UploadFile] = File(...),
    include_model: bool = Form(True),
    include_serial: bool = Form(True),
    include_hostname: bool = Form(True),
):
    rows = []
    for f in files:
        content = (await f.read()).decode("utf-8", errors="ignore")
        sysname = extract_by_patterns(patterns["sysname"], content)
        serial = extract_by_patterns(patterns["serial"], content)
        model = extract_by_patterns(patterns["model"], content)
        filename = extract_by_patterns(patterns["filename"], f.filename)
        rows.append({"ip": filename, "hostname": sysname, "serial": serial, "model": model})

    df = pd.DataFrame(rows)
    # 열 선택: ip는 항상 포함, 나머지는 체크박스에 따라 필터링
    columns = ["ip"]
    if include_hostname:
        columns.append("hostname")
    if include_serial:
        columns.append("serial")
    if include_model:
        columns.append("model")

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
