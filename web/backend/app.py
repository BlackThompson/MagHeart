from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import CORS_ALLOW_ORIGINS
from .routers import signals, cocreation
from .services.arduino_service import get_arduino_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Arduino
    arduino_service = await get_arduino_service()
    if arduino_service.is_connected():
        print("✅ Arduino device connected and ready")
    else:
        print("⚠️  Arduino device not connected (check ARDUINO_ENABLED and ARDUINO_PORT in .env)")
    
    yield
    
    # Shutdown: Disconnect from Arduino
    await arduino_service.disconnect()
    print("🔌 Arduino device disconnected")


app = FastAPI(title="MagHeart Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(signals.router, tags=["signals"])
app.include_router(cocreation.router, prefix="/cocreation", tags=["cocreation"])


@app.get("/")
async def root():
    return {"ok": True, "service": "magheart", "routes": ["/api/heart_rate", "/events"]}


@app.get("/api/arduino/status")
async def arduino_status():
    """Check Arduino connection status"""
    service = await get_arduino_service()
    return {
        "connected": service.is_connected(),
        "enabled": service.enabled,
        "port": service.port,
        "baudrate": service.baudrate
    }
