import base64
import json
import logging
import os
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..config import DATA_DIR
from ..services.meeting_manager import meeting_manager

router = APIRouter()
logger = logging.getLogger(__name__)

_SNAPSHOT_DIR = os.path.join(DATA_DIR, "screenshots")
os.makedirs(_SNAPSHOT_DIR, exist_ok=True)


class SnapshotIn(BaseModel):
    meetingId: str
    userId: str
    imageData: str  # data URL (data:image/png;base64,...)

async def _handle_message(message: Dict[str, Any], meeting_id: str, user_id: str) -> None:
    """
    Normalize inbound messages and dispatch to the meeting manager.
    """
    msg_type = message.get("type")
    payload = message.get("payload") or {}
    payload.setdefault("userId", user_id)

    if msg_type == "join_meeting":
        await meeting_manager.join_participant(meeting_id, user_id, payload)
    elif msg_type in {"heartbeat", "presence"}:
        await meeting_manager.heartbeat(meeting_id, user_id, payload)
    elif msg_type == "leave_meeting":
        await meeting_manager.leave_participant(meeting_id, user_id)
    elif msg_type == "update_phase":
        phase = payload.get("phase")
        if phase:
            await meeting_manager.update_phase(meeting_id, phase, user_id)
    elif msg_type == "update_meeting_state":
        updates = payload.get("meetingState")
        if isinstance(updates, dict):
            await meeting_manager.update_meeting_state(meeting_id, updates, user_id)
    elif msg_type in {"card_hover", "card_select_start", "card_select_cancel"}:
        # Broadcast interaction events to all other participants
        await meeting_manager.broadcast(json.dumps({"type": msg_type, "payload": payload}), meeting_id)
    else:
        await meeting_manager.broadcast(json.dumps({"type": msg_type, "payload": payload}), meeting_id)


@router.websocket("/ws/{meeting_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str, user_id: str):
    await meeting_manager.register_connection(meeting_id, user_id, websocket)

    try:
        while True:
            try:
                raw = await websocket.receive_text()
            except (WebSocketDisconnect, RuntimeError):
                break

            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                # Ignore malformed payloads to keep socket alive
                continue

            await _handle_message(message, meeting_id, user_id)
    finally:
        meeting_manager.unregister_connection(meeting_id, user_id, websocket)
        await meeting_manager.leave_participant(meeting_id, user_id)
        await meeting_manager.cleanup_stale(meeting_id)


def _safe_filename(value: str) -> str:
    return "".join(c for c in value if c.isalnum() or c in ("-", "_")) or "user"


def _decode_data_url(data_url: str) -> bytes:
    if not data_url:
        raise HTTPException(status_code=400, detail="imageData is required")
    if "," not in data_url:
        raise HTTPException(status_code=400, detail="Invalid data URL")
    header, encoded = data_url.split(",", 1)
    if not header.startswith("data:image"):
        raise HTTPException(status_code=400, detail="Only image data URLs are allowed")
    try:
        return base64.b64decode(encoded)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to decode image data: {exc}") from exc


@router.post("/snapshot")
async def save_snapshot(payload: SnapshotIn):
    meeting_id = payload.meetingId.strip()
    user_id = payload.userId.strip()
    image_bytes = _decode_data_url(payload.imageData)

    safe_meeting = _safe_filename(meeting_id)
    safe_user = _safe_filename(user_id)
    filename = f"{safe_meeting}__{safe_user}.png"
    path = os.path.join(_SNAPSHOT_DIR, filename)

    try:
        logger.info("Saving snapshot for meeting=%s user=%s path=%s", safe_meeting, safe_user, path)
        with open(path, "wb") as f:
            f.write(image_bytes)
    except Exception as exc:
        logger.exception("Failed to save snapshot for meeting=%s user=%s path=%s", safe_meeting, safe_user, path)
        raise HTTPException(status_code=500, detail=f"Failed to save snapshot: {exc}") from exc

    url = f"/cocreation/snapshot/{safe_meeting}/{safe_user}"
    return {"ok": True, "path": path, "url": url}


@router.get("/snapshot/{meeting_id}/{user_id}")
async def get_snapshot(meeting_id: str, user_id: str):
    safe_meeting = _safe_filename(meeting_id)
    safe_user = _safe_filename(user_id)
    path = os.path.join(_SNAPSHOT_DIR, f"{safe_meeting}__{safe_user}.png")
    if not os.path.exists(path):
        logger.warning("Snapshot requested but not found: meeting=%s user=%s path=%s", safe_meeting, safe_user, path)
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return FileResponse(path, media_type="image/png")
