from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import StreamingResponse
import io
import zipfile
import ipaddress

router = APIRouter()


def _ip_range(start_ip: str, end_ip: str) -> list[str]:
    start = int(ipaddress.IPv4Address(start_ip))
    end = int(ipaddress.IPv4Address(end_ip))
    if end < start:
        start, end = end, start
    return [str(ipaddress.IPv4Address(i)) for i in range(start, end + 1)]


def _read_labels(file_text: str) -> list[str]:
    return [line.strip() for line in file_text.splitlines() if line.strip()]


def _build_ini_from_template(template_text: str, ip: str) -> str:
    out_lines = []
    for line in template_text.splitlines(keepends=True):
        if line.strip().startswith('S:"Hostname"='):
            ending = "\r\n" if line.endswith("\r\n") else ("\n" if line.endswith("\n") else "")
            out_lines.append(f'S:"Hostname"={ip}{ending}')
        else:
            out_lines.append(line)
    return "".join(out_lines)


@router.post("/securecrt/iprange/preview")
async def securecrt_iprange_preview(
    template: UploadFile = File(...),
    labels: UploadFile = File(...),
    start_ip: str = Form(...),
    end_ip: str = Form(...),
):
    template_text = (await template.read()).decode("utf-8", errors="ignore")
    labels_text = (await labels.read()).decode("utf-8", errors="ignore")
    ip_list = _ip_range(start_ip, end_ip)
    label_list = _read_labels(labels_text)
    if len(label_list) < len(ip_list):
        return {"error": "라벨 개수가 IP 개수보다 적습니다."}

    results = []
    for ip, label in zip(ip_list, label_list):
        safe_label = label.replace(" ", "_")
        out_name = f"{ip}_{safe_label}.ini"
        results.append({"ip": ip, "label": label, "output": out_name})
    return results


@router.post("/securecrt/iprange/generate")
async def securecrt_iprange_generate(
    template: UploadFile = File(...),
    labels: UploadFile = File(...),
    start_ip: str = Form(...),
    end_ip: str = Form(...),
):
    template_text = (await template.read()).decode("utf-8", errors="ignore")
    labels_text = (await labels.read()).decode("utf-8", errors="ignore")
    ip_list = _ip_range(start_ip, end_ip)
    label_list = _read_labels(labels_text)
    if len(label_list) < len(ip_list):
        return {"error": "라벨 개수가 IP 개수보다 적습니다."}

    zip_stream = io.BytesIO()
    with zipfile.ZipFile(zip_stream, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for ip, label in zip(ip_list, label_list):
            safe_label = label.replace(" ", "_")
            out_name = f"{ip}_{safe_label}.ini"
            ini_text = _build_ini_from_template(template_text, ip)
            zf.writestr(out_name, ini_text)

    zip_stream.seek(0)
    return StreamingResponse(
        zip_stream,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=securecrt-sessions.zip"},
    )

