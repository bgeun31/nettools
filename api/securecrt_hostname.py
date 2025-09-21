from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
import io
import zipfile

router = APIRouter()


def _parse_name_ip_list(text: str):
    pairs: list[tuple[str, str]] = []
    for line in text.splitlines():
        parts = line.strip().split()
        if len(parts) >= 2:
            name, ip = parts[0], parts[1]
            pairs.append((name, ip))
    return pairs


def _build_ini_from_template(template_text: str, ip: str) -> str:
    out_lines = []
    for line in template_text.splitlines(keepends=True):
        if line.strip().startswith('S:"Hostname"='):
            # preserve newline style by using existing line ending
            ending = "\r\n" if line.endswith("\r\n") else ("\n" if line.endswith("\n") else "")
            out_lines.append(f'S:"Hostname"={ip}{ending}')
        else:
            out_lines.append(line)
    return "".join(out_lines)


@router.post("/securecrt/hostname/preview")
async def securecrt_hostname_preview(
    template: UploadFile = File(...),
    hostlist: UploadFile = File(...),
):
    template_text = (await template.read()).decode("utf-8", errors="ignore")
    host_text = (await hostlist.read()).decode("utf-8", errors="ignore")
    pairs = _parse_name_ip_list(host_text)
    results = []
    for name, ip in pairs:
        safe_name = name.replace(" ", "_")
        out_name = f"{ip}_{safe_name}.ini"
        results.append({"name": name, "ip": ip, "output": out_name})
    return results


@router.post("/securecrt/hostname/generate")
async def securecrt_hostname_generate(
    template: UploadFile = File(...),
    hostlist: UploadFile = File(...),
):
    template_text = (await template.read()).decode("utf-8", errors="ignore")
    host_text = (await hostlist.read()).decode("utf-8", errors="ignore")
    pairs = _parse_name_ip_list(host_text)

    zip_stream = io.BytesIO()
    with zipfile.ZipFile(zip_stream, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name, ip in pairs:
            safe_name = name.replace(" ", "_")
            out_name = f"{ip}_{safe_name}.ini"
            ini_text = _build_ini_from_template(template_text, ip)
            zf.writestr(out_name, ini_text)

    zip_stream.seek(0)
    return StreamingResponse(
        zip_stream,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=securecrt-sessions.zip"},
    )

