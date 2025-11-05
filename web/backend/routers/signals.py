from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime, timezone
import asyncio
import json

from ..models.signal import HeartRateIn
from ..storage.database import append_heart_rate, read_latest
from ..services import signal_service as svc


router = APIRouter()


async def get_user_id(x_user_id: Optional[str] = Header(None), userId: Optional[str] = None):
    return x_user_id or userId or "demo"


@router.post("/api/heart_rate")
async def post_heart_rate(payload: HeartRateIn, user_id: str = Depends(get_user_id)):
    data = payload.model_dump()
    await append_heart_rate(user_id, data)
    event = {"id": payload.ts, "type": "hr", "data": data}
    await svc.set_latest(user_id, data)
    await svc.publish(user_id, event)
    return {"ok": True, "userId": user_id, "received_at": int(datetime.now(timezone.utc).timestamp() * 1000)}


@router.get("/events")
async def sse(request: Request, userId: str):
    if not userId:
        raise HTTPException(status_code=400, detail="userId is required")

    async def event_gen():
        try:
            latest_obj = await svc.get_latest(userId)
            latest = json.dumps(latest_obj) if latest_obj else None
            if not latest:
                csv_latest = await read_latest(userId)
                if csv_latest:
                    latest = json.dumps(csv_latest)
            if latest:
                yield f"id: init\nevent: hr\ndata: {latest}\n\n"

            async def heartbeat():
                while True:
                    yield ":keepalive\n\n"
                    await asyncio.sleep(20)

            hb_iter = heartbeat().__anext__()
            q, unsubscribe = await svc.subscribe(userId)
            try:
                while True:
                    if await request.is_disconnected():
                        break
                    try:
                        obj = await asyncio.wait_for(q.get(), timeout=1.0)
                        ev_id = obj.get("id", "")
                        ev_type = obj.get("type", "message")
                        ev_data = json.dumps(obj.get("data"))
                        yield f"id: {ev_id}\nevent: {ev_type}\ndata: {ev_data}\n\n"
                    except asyncio.TimeoutError:
                        try:
                            yield await hb_iter
                            hb_iter = heartbeat().__anext__()
                        except StopAsyncIteration:
                            pass
            finally:
                unsubscribe()
        finally:
            pass

    headers = {"Cache-Control": "no-cache, no-transform", "Content-Type": "text/event-stream", "Connection": "keep-alive"}
    return StreamingResponse(event_gen(), headers=headers)

