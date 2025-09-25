from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from openpyxl import load_workbook, Workbook
import io
import re
import math

router = APIRouter()


invalid_chars = re.compile(r"[\\/*?:\[\]]")


def _safe_sheet_name(name: str) -> str:
    safe = invalid_chars.sub("", name)[:31]
    return safe or "Sheet"


def _norm_label(v) -> str:
    if v is None:
        return ""
    return str(v).strip()


def _is_number(v) -> bool:
    return isinstance(v, (int, float)) and not (isinstance(v, float) and math.isnan(v))


def _to_number_if_possible(v):
    # Try convert strings like " 1 ", "1.0" to number
    if _is_number(v):
        return float(v)
    if isinstance(v, str):
        s = "".join(v.split())  # remove all whitespace
        if s == "":
            return None
        try:
            return float(s)
        except ValueError:
            return None
    return None


def _equal(v1, v2) -> bool:
    # Treat None/empty as equal only if both are empty-ish
    if v1 in (None, "") and v2 in (None, ""):
        return True

    # Numeric compare if both parseable to numbers (ignoring string/number types)
    n1 = _to_number_if_possible(v1)
    n2 = _to_number_if_possible(v2)
    if n1 is not None and n2 is not None:
        return abs(n1 - n2) < 1e-9

    # Fallback to string compare ignoring ALL whitespace differences
    s1 = "".join(str(v1).split())
    s2 = "".join(str(v2).split())
    return s1 == s2


def _analyze_sheet(ws) -> dict:
    # Build header maps
    row_map: dict[str, int] = {}
    for r in range(2, ws.max_row + 1):
        label = _norm_label(ws.cell(row=r, column=1).value)
        if label:
            # Keep first occurrence
            row_map.setdefault(label, r)

    col_map: dict[str, int] = {}
    for c in range(2, ws.max_column + 1):
        label = _norm_label(ws.cell(row=1, column=c).value)
        if label:
            col_map.setdefault(label, c)

    row_labels = set(row_map.keys())
    col_labels = set(col_map.keys())
    missing_rows = sorted(list(row_labels - col_labels))
    missing_cols = sorted(list(col_labels - row_labels))
    common = sorted(list(row_labels & col_labels))

    mismatch_count = 0
    mismatches: list[tuple[str, str, str, str]] = []
    # Compare symmetry for pairs (A,B) with A < B (avoid double count)
    for i in range(len(common)):
        a = common[i]
        for j in range(i + 1, len(common)):
            b = common[j]
            ra, ca = row_map[a], col_map[a]
            rb, cb = row_map[b], col_map[b]
            v_ab = ws.cell(row=ra, column=cb).value
            v_ba = ws.cell(row=rb, column=ca).value
            if not _equal(v_ab, v_ba):
                mismatch_count += 1
                mismatches.append(
                    (
                        a,
                        b,
                        "" if v_ab is None else str(v_ab),
                        "" if v_ba is None else str(v_ba),
                    )
                )

    return {
        "row_count": len(row_labels),
        "col_count": len(col_labels),
        "missing_rows": missing_rows,
        "missing_cols": missing_cols,
        "common_count": len(common),
        "mismatch_count": mismatch_count,
        "mismatches": mismatches,
    }


@router.post("/excel/compare/preview")
async def excel_compare_preview(excel: UploadFile = File(...)):
    data = await excel.read()
    stream = io.BytesIO(data)
    wb = load_workbook(stream, data_only=True)

    results = []
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        analysis = _analyze_sheet(ws)
        # Emit only mismatches
        for a, b, v_ab, v_ba in analysis["mismatches"]:
            results.append(
                {
                    "sheet": sheet_name,
                    "row_label": a,
                    "col_label": b,
                    "value_row_col": v_ab,
                    "value_col_row": v_ba,
                }
            )
    if not results:
        return [{"message": "불일치 없음"}]
    return results


@router.post("/excel/compare/excel")
async def excel_compare_excel(excel: UploadFile = File(...)):
    data = await excel.read()
    stream = io.BytesIO(data)
    wb_in = load_workbook(stream, data_only=True)

    wb_out = Workbook()
    ws_out = wb_out.active
    ws_out.title = "mismatches"
    ws_out.append(["sheet", "row_label", "col_label", "value[row,col]", "value[col,row]"])

    total = 0
    for sheet_name in wb_in.sheetnames:
        ws = wb_in[sheet_name]
        analysis = _analyze_sheet(ws)
        for a, b, v_ab, v_ba in analysis["mismatches"]:
            ws_out.append([sheet_name, a, b, v_ab, v_ba])
            total += 1

    if total == 0:
        ws_out.append(["불일치 없음", "", "", "", ""])  # No mismatches

    out_stream = io.BytesIO()
    wb_out.save(out_stream)
    out_stream.seek(0)
    return StreamingResponse(
        out_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=excel-compare.xlsx"},
    )
