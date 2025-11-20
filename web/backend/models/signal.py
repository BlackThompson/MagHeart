from pydantic import BaseModel, Field
from typing import Optional


class HeartRateIn(BaseModel):
    bpm: int = Field(..., ge=20, le=250)
    ts: int = Field(..., description="epoch ms")
    device: Optional[str] = None
