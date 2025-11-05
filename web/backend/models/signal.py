from pydantic import BaseModel, Field
from typing import Optional


class HeartRateIn(BaseModel):
    bpm: int = Field(..., ge=20, le=250)
    ts: int = Field(..., description="epoch ms")
    source: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0, le=1)
    device: Optional[str] = None

