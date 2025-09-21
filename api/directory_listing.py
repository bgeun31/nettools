from fastapi import APIRouter, Form
from fastapi.responses import StreamingResponse
import os
import pandas as pd
import io

router = APIRouter()


def _collect_files(base_dir: str, allow_exts: set[str]):
    rows = []
    for root, _dirs, files in os.walk(base_dir):
        for filename in files:
            ext = os.path.splitext(filename)[1].lower()
            if ext in allow_exts:
                file_path = os.path.join(root, filename)
                raw_name = os.path.splitext(filename)[0]
                rows.append({
                    "name": raw_name,
                    "filename": filename,
                    "path": file_path,
                    "ext": ext,
                })
    return rows


@router.post("/dir/list")
async def list_directory(
    directory: str = Form(...),
    include_ini: bool = Form(False),
    include_log: bool = Form(True),
    include_txt: bool = Form(True),
):
    allow_exts = set()
    if include_ini:
        allow_exts.add(".ini")
    if include_log:
        allow_exts.add(".log")
    if include_txt:
        allow_exts.add(".txt")

    rows = _collect_files(directory, allow_exts)
    return rows


@router.post("/dir/list/excel")
async def list_directory_excel(
    directory: str = Form(...),
    include_ini: bool = Form(False),
    include_log: bool = Form(True),
    include_txt: bool = Form(True),
):
    allow_exts = set()
    if include_ini:
        allow_exts.add(".ini")
    if include_log:
        allow_exts.add(".log")
    if include_txt:
        allow_exts.add(".txt")

    rows = _collect_files(directory, allow_exts)
    df = pd.DataFrame(rows)
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="listing")
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=directory-listing.xlsx"},
    )

