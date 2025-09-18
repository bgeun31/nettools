# api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .extract_model_serial_hostname import router as extract_router  # ← 점 하나

app = FastAPI(title="NetTools API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extract_router, prefix="")

@app.get("/healthz")
async def health_check():
    return {"status": "ok"}
