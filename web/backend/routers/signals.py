from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime, timezone
import asyncio
import json
import logging

from ..models.signal import HeartRateIn
from ..storage.database import append_heart_rate, read_latest
from ..services import signal_service as svc
from ..services.arduino_service import send_heart_rate_to_arduino
from ..services.meeting_manager import meeting_manager

logger = logging.getLogger(__name__)


router = APIRouter()


async def get_user_id(
    x_user_id: Optional[str] = Header(None), userId: Optional[str] = None
):
    return x_user_id or userId or "demo"


async def _broadcast_to_meetings(user_id: str, data: dict) -> None:
    """
    Propagate the latest heart rate to any meeting sessions where the user is present.
    """
    meeting_ids = meeting_manager.repo.list_meetings_for_user(user_id)
    if not meeting_ids:
        return

    # Ensure dictionary copies so downstream mutations don't affect persisted values.
    heart_rate_payload = {**data}
    heart_rate_with_user = {"userId": user_id, **heart_rate_payload}

    for meeting_id in meeting_ids:
        try:
            meeting_manager.repo.update_participant_payload(meeting_id, user_id, {"heartRate": heart_rate_payload})
            message = {
                "type": "heart_rate_update",
                "payload": {**heart_rate_with_user, "meetingId": meeting_id},
            }
            await meeting_manager.broadcast(json.dumps(message), meeting_id)
            await meeting_manager.broadcast_state(meeting_id)
        except Exception as exc:
            logger.warning(
                "Failed to broadcast heart rate to meeting %s for user %s: %s",
                meeting_id,
                user_id,
                exc,
            )


@router.post("/api/heart_rate")
async def post_heart_rate(payload: HeartRateIn, user_id: str = Depends(get_user_id)):
    data = payload.model_dump()
    # Log received heart rate: sample time, user, bpm, device
    sample_dt = datetime.fromtimestamp(payload.ts / 1000.0, tz=timezone.utc)
    msg = f"[HR] ts={sample_dt.isoformat()} user={user_id} bpm={payload.bpm} device={payload.device or '-'}"
    print(msg)
    logger.info(msg)

    await append_heart_rate(user_id, data)
    event = {"id": payload.ts, "type": "hr", "data": data}
    await svc.set_latest(user_id, data)
    await svc.publish(user_id, event)
    await _broadcast_to_meetings(user_id, data)

    # Send heart rate to Arduino device
    try:
        arduino_success = await send_heart_rate_to_arduino(payload.bpm)
        if arduino_success:
            logger.info(
                f"💓 Heart rate {payload.bpm} BPM sent to Arduino for user {user_id}"
            )
    except Exception as e:
        # Don't fail the request if Arduino communication fails
        logger.warning(f"Failed to send heart rate to Arduino: {e}")

    return {
        "ok": True,
        "userId": user_id,
        "received_at": int(datetime.now(timezone.utc).timestamp() * 1000),
    }


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

    headers = {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "text/event-stream",
        "Connection": "keep-alive",
    }
    return StreamingResponse(event_gen(), headers=headers)
