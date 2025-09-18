from fastapi import FastAPI, UploadFile, File, Response
from fastapi.responses import StreamingResponse, JSONResponse
from typing import List
import io, re, pandas as pd
from openpyxl import Workbook
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NetTools Extract API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],  # 필요 시 "GET","PUT","DELETE" 등 추가
    allow_headers=["*"],
)

# ====== 업로드본 정규식/로직 반영 (:contentReference[oaicite:1]{index=1}) ======
patterns = {
    "sysname": [
        re.compile(r"SysName\s*:\s*(.+)"),
        re.compile(r'sysName\s+"(\S+)"')
    ],
    "serial": [
        re.compile(r"Serial#\s*:\s*(.+)"),
        re.compile(r'Switch\s*:\s*\S+\s+(\S+)')
    ],
    "model": [
        re.compile(r"ModelName\s*:\s*(.+)"),
        re.compile(r"Chassis\s*:\s*(.+)"),
        re.compile(r"System Type\s*:\s*(.+)")
    ],
    "mgmt": [
        re.compile(r'configure vlan \S+_mgmt ipaddress (\d{1,3}(?:\.\d{1,3}){3}) \d{1,3}(\.\d{1,3}){3}', re.IGNORECASE),
        re.compile(r'configure vlan \S+_DATA ipaddress (\d{1,3}(?:\.\d{1,3}){3}) \d{1,3}(?:\.\d{1,3}){3}', re.IGNORECASE),
        re.compile(r'configure vlan \S+_wired ipaddress (\d{1,3}(?:\.\d{1,3}){3}) \d{1,3}(?:\.\d{1,3}){3}', re.IGNORECASE)
    ],
    "image_pattern": [
        re.compile(r'\b(\S+\.xos)\b'),
        re.compile(r'(\d+(?:\.\d+)*\.GA)\s+\(Primary Release\)'),
        re.compile(r'IMG\s*:\s*(.+)')
    ],
    "boot_pattern": [
        re.compile(r'Image Booted:\s*(.+)'),
        re.compile(r'Primary Release')
    ],
    "boot_opt_pattern": [
        re.compile(r"Image Selected:\s*(.+)")
    ],
    "filename": [
        re.compile(r"^(\d{1,3}(?:\.\d{1,3}){3})_")
    ]
}

def extract_by_patterns(pattern_list, content: str) -> str:
    for pattern in pattern_list:
        m = pattern.search(content)
        if m:
            return m.group(1).strip()
    return "없음"

def parse_single_file(name: str, text: str):
    return {
        "source_file": name,
        "hostname": extract_by_patterns(patterns["sysname"], text),
        "ip": extract_by_patterns(patterns["filename"], name),
        "mgmt ip": extract_by_patterns(patterns["mgmt"], text),
        "serial": extract_by_patterns(patterns["serial"], text),
        "model": extract_by_patterns(patterns["model"], text),
        "image": extract_by_patterns(patterns["image_pattern"], text),
        "Image Booted": extract_by_patterns(patterns["boot_pattern"], text),
        "Image Selected": extract_by_patterns(patterns["boot_opt_pattern"], text),
    }

@app.post("/extract/json")
async def extract_json(files: List[UploadFile] = File(...)):
    rows = []
    for f in files:
        content = (await f.read()).decode("utf-8", errors="ignore")
        rows.append(parse_single_file(f.filename, content))
    return JSONResponse(rows)

@app.post("/extract/excel")
async def extract_excel(files: List[UploadFile] = File(...)):
    rows = []
    for f in files:
        content = (await f.read()).decode("utf-8", errors="ignore")
        rows.append(parse_single_file(f.filename, content))

    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="extracted")
    output.seek(0)

    headers = {
        "Content-Disposition": 'attachment; filename="hostname-serial.xlsx"'
    }
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)
