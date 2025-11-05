from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ALLOW_ORIGINS
from .routers import signals


app = FastAPI(title="MagHeart Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(signals.router, tags=["signals"])


@app.get("/")
async def root():
    return {"ok": True, "service": "magheart", "routes": ["/api/heart_rate", "/events"]}
