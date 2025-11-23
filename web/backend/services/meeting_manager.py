from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import WebSocket, WebSocketDisconnect


class MeetingManager:
    """
    In-memory meeting manager.

    Responsibilities:
    - Maintain a canonical table of meetings and participants.
    - Track WebSocket connections per meeting/user as transport only.
    - Provide helpers for join / heartbeat / leave / phase updates.
    """

    def __init__(self) -> None:
        # meetingId -> userId -> participant dict
        self._participants: Dict[str, Dict[str, Dict[str, Any]]] = {}
        # meetingId -> metadata (phase, sharedContext, createdAt, etc.)
        self._meta: Dict[str, Dict[str, Any]] = {}
        # meetingId -> userId -> list[WebSocket]
        self._connections: Dict[str, Dict[str, List[WebSocket]]] = {}

    # ---- Internal helpers -------------------------------------------------

    def _ensure_meeting(self, meeting_id: str) -> None:
        if meeting_id not in self._participants:
            self._participants[meeting_id] = {}
        if meeting_id not in self._meta:
            now_str = datetime.now().isoformat()
            self._meta[meeting_id] = {"phase": "lobby", "createdAt": now_str, "updatedAt": now_str}
        if meeting_id not in self._connections:
            self._connections[meeting_id] = {}

    def _touch_meeting(self, meeting_id: str) -> None:
        if meeting_id in self._meta:
            self._meta[meeting_id]["updatedAt"] = datetime.now().isoformat()

    # ---- Connection management --------------------------------------------

    async def register_connection(self, meeting_id: str, user_id: str, websocket: WebSocket) -> None:
        """
        Accept a WebSocket and register it under meeting/user.
        This does NOT implicitly join the meeting – client must send join_meeting.
        """
        await websocket.accept()
        self._ensure_meeting(meeting_id)
        self._connections[meeting_id].setdefault(user_id, []).append(websocket)
        self._touch_meeting(meeting_id)

    def unregister_connection(self, meeting_id: str, user_id: str, websocket: WebSocket) -> None:
        """
        Remove a WebSocket from the connections table.

        We deliberately do NOT change participant online/offline state here;
        online status is derived solely from heartbeats / explicit leave and
        evaluated inside cleanup_stale().
        """
        if meeting_id not in self._connections:
            return

        user_conns = self._connections[meeting_id].get(user_id)
        if user_conns and websocket in user_conns:
            user_conns.remove(websocket)
        if user_conns and len(user_conns) == 0:
            del self._connections[meeting_id][user_id]

        # Drop empty meeting connections bucket; participants/meta remain until cleanup_stale
        if not self._connections[meeting_id]:
            del self._connections[meeting_id]

    # ---- Participant / meeting state --------------------------------------

    async def join_participant(self, meeting_id: str, user_id: str, payload: Dict[str, Any]) -> None:
        """
        Create or update a participant entry when a client joins the meeting.
        """
        self._ensure_meeting(meeting_id)
        now_str = datetime.now().isoformat()

        participant = self._participants[meeting_id].get(user_id)
        if not participant:
            participant = {
                "meetingId": meeting_id,
                "userId": user_id,
                "joinedAt": now_str,
            }
            self._participants[meeting_id][user_id] = participant

        participant.update(
            {
                "status": "online",
                "lastHeartbeat": now_str,
            }
        )
        participant.update(payload or {})
        self._touch_meeting(meeting_id)
        await self.broadcast_state(meeting_id)

    async def heartbeat(
        self, meeting_id: str, user_id: str, payload: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Lightweight presence ping: ensure entry exists and bump lastHeartbeat/status.
        """
        self._ensure_meeting(meeting_id)
        now_str = datetime.now().isoformat()

        participant = self._participants[meeting_id].get(user_id)
        if not participant:
            participant = {
                "meetingId": meeting_id,
                "userId": user_id,
                "joinedAt": now_str,
            }
            self._participants[meeting_id][user_id] = participant

        participant["status"] = "online"
        participant["lastHeartbeat"] = now_str
        if payload:
            participant.update(payload)

        self._touch_meeting(meeting_id)
        await self.broadcast_state(meeting_id)

    async def leave_participant(self, meeting_id: str, user_id: str) -> None:
        """
        Explicit leave: remove participant from the meeting table.
        """
        if meeting_id in self._participants and user_id in self._participants[meeting_id]:
            del self._participants[meeting_id][user_id]
            if not self._participants[meeting_id]:
                del self._participants[meeting_id]
                self._meta.pop(meeting_id, None)
                self._connections.pop(meeting_id, None)
        self._touch_meeting(meeting_id)
        await self.broadcast_state(meeting_id)

    async def update_phase(self, meeting_id: str, phase: str, updated_by: str) -> None:
        """
        Update global meeting phase and broadcast.
        """
        self._ensure_meeting(meeting_id)
        now_str = datetime.now().isoformat()
        meta = self._meta[meeting_id]
        meta["phase"] = phase
        meta["phaseUpdatedBy"] = updated_by
        meta["phaseUpdatedAt"] = now_str
        self._touch_meeting(meeting_id)

        event = {
            "type": "phase_changed",
            "payload": {
                "meetingId": meeting_id,
                "phase": phase,
                "updatedBy": updated_by,
                "timestamp": now_str,
            },
        }
        await self.broadcast(json.dumps(event), meeting_id)
        await self.broadcast_state(meeting_id)

    async def update_shared_context(
        self, meeting_id: str, updates: Dict[str, Any], updated_by: str
    ) -> None:
        """
        Merge updates into the meeting-level shared context and broadcast.

        The shared context represents the canonical selections made in the
        Shared Context Setup flow (atmosphere, style, etc.) and the current step.
        """
        if not updates:
            return

        self._ensure_meeting(meeting_id)
        now_str = datetime.now().isoformat()
        meta = self._meta[meeting_id]
        shared_ctx = meta.setdefault("sharedContext", {})
        shared_ctx.update(updates)
        meta["sharedContextUpdatedBy"] = updated_by
        meta["sharedContextUpdatedAt"] = now_str
        self._touch_meeting(meeting_id)

        event = {
            "type": "shared_context_updated",
            "payload": {
                "meetingId": meeting_id,
                "sharedContext": shared_ctx,
                "updatedBy": updated_by,
                "timestamp": now_str,
            },
        }
        await self.broadcast(json.dumps(event), meeting_id)
        await self.broadcast_state(meeting_id)

    async def cleanup_stale(
        self,
        meeting_id: str,
        offline_after_seconds: int = 30,
        hard_remove_after_seconds: int = 300,
    ) -> None:
        """
        Mark users as offline if they have not been seen recently, and
        optionally remove long-gone users from the meeting state.
        """
        if meeting_id not in self._participants:
            return

        now = datetime.now()
        offline_threshold = now - timedelta(seconds=offline_after_seconds)
        hard_remove_threshold = now - timedelta(seconds=hard_remove_after_seconds)

        stale_to_remove: List[str] = []

        for user_id, entry in self._participants[meeting_id].items():
            try:
                last_seen_str = entry.get("lastHeartbeat") or entry.get("lastSeen")
                last_seen = datetime.fromisoformat(last_seen_str) if last_seen_str else datetime.fromtimestamp(0)
            except Exception:
                last_seen = datetime.fromtimestamp(0)

            if last_seen < hard_remove_threshold:
                stale_to_remove.append(user_id)
            elif last_seen < offline_threshold:
                entry["status"] = "offline"

        for user_id in stale_to_remove:
            del self._participants[meeting_id][user_id]

        if meeting_id in self._participants and not self._participants[meeting_id]:
            del self._participants[meeting_id]
            self._meta.pop(meeting_id, None)
            self._connections.pop(meeting_id, None)

        self._touch_meeting(meeting_id)
        await self.broadcast_state(meeting_id)

    # ---- Broadcast helpers ------------------------------------------------

    def _current_phase(self, meeting_id: str) -> str:
        if meeting_id not in self._meta:
            return "lobby"
        return self._meta[meeting_id].get("phase") or "lobby"

    async def broadcast_state(self, meeting_id: str) -> None:
        """
        Broadcast the full participants/phase snapshot to everyone in the meeting.
        """
        if meeting_id not in self._participants or meeting_id not in self._connections:
            return

        state_message = {
            "type": "participants_state",
            "payload": {
                "participants": self._participants[meeting_id],
                "phase": self._current_phase(meeting_id),
                "sharedContext": self._meta[meeting_id].get("sharedContext"),
                "timestamp": datetime.now().isoformat(),
            },
        }
        await self.broadcast(json.dumps(state_message), meeting_id)

    async def broadcast(self, message: str, meeting_id: str) -> None:
        """
        Broadcast a raw JSON string to all active WebSocket connections for this meeting.
        """
        if meeting_id not in self._connections:
            return

        for user_id, conns in list(self._connections[meeting_id].items()):
            for ws in list(conns):
                try:
                    await ws.send_text(message)
                except (RuntimeError, WebSocketDisconnect, Exception):
                    try:
                        conns.remove(ws)
                    except ValueError:
                        pass

            if not conns:
                del self._connections[meeting_id][user_id]


meeting_manager = MeetingManager()
