import json
from typing import Any, Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..services.meeting_manager import meeting_manager

router = APIRouter()


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
    elif msg_type == "update_shared_context":
        updates = payload.get("sharedContext")
        if isinstance(updates, dict):
            await meeting_manager.update_shared_context(meeting_id, updates, user_id)
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
