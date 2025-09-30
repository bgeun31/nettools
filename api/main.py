# api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .extract_model_serial_hostname import router as extract_router  # ?????섎굹
from .directory_listing import router as dir_router
from .securecrt_hostname import router as securecrt_router
from .securecrt_iprange import router as securecrt_ip_router
from .log_merge import router as log_merge_router
from .log_distribute import router as log_distribute_router
from .lldp_hostname import router as lldp_hostname_router

app = FastAPI(title="NetTools API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://172.16.15.155:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extract_router, prefix="")
app.include_router(dir_router, prefix="")
app.include_router(securecrt_router, prefix="")
app.include_router(securecrt_ip_router, prefix="")
app.include_router(log_merge_router, prefix="")
app.include_router(log_distribute_router, prefix="")
app.include_router(lldp_hostname_router, prefix="")

@app.get("/healthz")
async def health_check():
    return {"status": "ok"}

