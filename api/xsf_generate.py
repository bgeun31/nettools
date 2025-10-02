from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import StreamingResponse
import io
from openpyxl import load_workbook

router = APIRouter()


@router.post("/xsf/generate")
async def generate_xsf(
    excel: UploadFile = File(...),
    sheet: str | None = Form(None),
    filename: str | None = Form(None),
):
    data = await excel.read()
    stream = io.BytesIO(data)
    wb = load_workbook(stream, data_only=True)

    # Choose sheet: specific by name if provided, else first sheet
    if sheet and sheet in wb.sheetnames:
        ws = wb[sheet]
    else:
        ws = wb[wb.sheetnames[0]]

    # Build XSF content: each row as one line, cells concatenated as-is
    lines: list[str] = []
    for row in ws.iter_rows(values_only=True):
        line = ''.join([str(cell) if cell is not None else '' for cell in row])
        lines.append(line)

    content = ("\n".join(lines)).encode("utf-8")

    out_name = (filename or excel.filename or "output").rsplit('.', 1)[0] + ".xsf"
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={out_name}"
        },
    )

