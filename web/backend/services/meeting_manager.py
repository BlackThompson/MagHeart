from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import WebSocket, WebSocketDisconnect

from ..storage.meeting_repository import repository as meeting_repository


class MeetingManager:
    """
    Meeting/session manager that keeps WebSocket connections in-memory while
    persisting the canonical meeting state to SQLite via MeetingRepository.
    """

    def __init__(self, repo=meeting_repository) -> None:
        # meetingId -> userId -> list[WebSocket]
        self._connections: Dict[str, Dict[str, List[WebSocket]]] = {}
        self.repo = repo

    # ---- Internal helpers -------------------------------------------------

    def _ensure_connection_bucket(self, meeting_id: str) -> None:
        if meeting_id not in self._connections:
            self._connections[meeting_id] = {}

    # ---- Connection management --------------------------------------------

    async def register_connection(self, meeting_id: str, user_id: str, websocket: WebSocket) -> None:
        """
        Accept a WebSocket and register it under meeting/user.
        This does NOT implicitly join the meeting – client must send join_meeting.
        """
        await websocket.accept()
        self.repo.ensure_meeting(meeting_id)
        self._ensure_connection_bucket(meeting_id)
        self._connections[meeting_id].setdefault(user_id, []).append(websocket)

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
        payload = payload or {}
        payload["status"] = "online"
        self.repo.upsert_participant(meeting_id, user_id, payload)
        await self.broadcast_state(meeting_id)

    async def heartbeat(
        self, meeting_id: str, user_id: str, payload: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Lightweight presence ping: ensure entry exists and bump lastHeartbeat/status.
        """
        payload = payload or {}
        existing = self.repo.get_participant(meeting_id, user_id)
        if existing:
            self.repo.update_participant_status(meeting_id, user_id, "online", payload)
        else:
            payload["status"] = "online"
            self.repo.upsert_participant(meeting_id, user_id, payload)
        await self.broadcast_state(meeting_id)

    async def leave_participant(self, meeting_id: str, user_id: str) -> None:
        """
        Explicit leave: remove participant from the meeting table.
        """
        self.repo.remove_participant(meeting_id, user_id)
        await self.broadcast_state(meeting_id)

    async def update_phase(self, meeting_id: str, phase: str, updated_by: str) -> None:
        """
        Update global meeting phase and broadcast (host-only).
        """
        self.repo.ensure_meeting(meeting_id)
        participant = self.repo.get_participant(meeting_id, updated_by)
        role = participant.get("role") if participant else None
        if role != "host":
            now_str = datetime.now().isoformat()
            warning_event = {
                "type": "phase_change_denied",
                "payload": {
                    "meetingId": meeting_id,
                    "requestedPhase": phase,
                    "updatedBy": updated_by,
                    "reason": "insufficient_permissions",
                    "requiredRole": "host",
                    "timestamp": now_str,
                },
            }
            await self._send_direct(json.dumps(warning_event), meeting_id, updated_by)
            return

        now_str = datetime.now().isoformat()
        self.repo.update_phase(meeting_id, phase, updated_by)
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

    async def update_meeting_state(
        self, meeting_id: str, updates: Dict[str, Any], updated_by: str
    ) -> None:
        """
        Merge updates into the meeting-level shared meeting state and broadcast.
        """
        if not updates:
            return

        self.repo.ensure_meeting(meeting_id)
        meeting_state = self.repo.update_meeting_state(meeting_id, updates, updated_by)
        now_str = datetime.now().isoformat()

        event = {
            "type": "meeting_state_updated",
            "payload": {
                "meetingId": meeting_id,
                "meetingState": meeting_state,
                "updatedBy": updated_by,
                "timestamp": now_str,
            },
        }
        await self.broadcast(json.dumps(event), meeting_id)
        await self.broadcast_state(meeting_id)

    async def end_meeting(self, meeting_id: str, requested_by: str) -> None:
        """
        End the meeting (host only) and broadcast completion event before cleanup.
        """
        participant = self.repo.get_participant(meeting_id, requested_by)
        role = participant.get("role") if participant else None
        if role != "host":
            now_str = datetime.now().isoformat()
            warning_event = {
                "type": "meeting_end_denied",
                "payload": {
                    "meetingId": meeting_id,
                    "requestedBy": requested_by,
                    "reason": "insufficient_permissions",
                    "requiredRole": "host",
                    "timestamp": now_str,
                },
            }
            await self._send_direct(json.dumps(warning_event), meeting_id, requested_by)
            return

        now_str = datetime.now().isoformat()
        event = {
            "type": "meeting_ended",
            "payload": {
                "meetingId": meeting_id,
                "endedBy": requested_by,
                "timestamp": now_str,
            },
        }
        await self.broadcast(json.dumps(event), meeting_id)
        self.repo.delete_meeting(meeting_id)
        self._connections.pop(meeting_id, None)

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
        meeting = self.repo.get_meeting(meeting_id)
        if not meeting:
            return

        now = datetime.now()
        offline_threshold = now - timedelta(seconds=offline_after_seconds)
        hard_remove_threshold = now - timedelta(seconds=hard_remove_after_seconds)

        self.repo.cleanup_participants(meeting_id, offline_threshold, hard_remove_threshold)
        await self.broadcast_state(meeting_id)

    # ---- Broadcast helpers ------------------------------------------------

    async def broadcast_state(self, meeting_id: str) -> None:
        """
        Broadcast the full participants/phase snapshot to everyone in the meeting.
        """
        if meeting_id not in self._connections:
            return

        meeting = self.repo.get_meeting(meeting_id)
        if not meeting:
            return

        participants = {}
        for participant in self.repo.list_participants(meeting_id):
            serialized = dict(participant)
            serialized.pop("payload", None)
            participants[participant["userId"]] = serialized

        state_message = {
            "type": "participants_state",
            "payload": {
                "participants": participants,
                "phase": meeting.get("phase", "lobby"),
                "meetingState": meeting.get("meetingState"),
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

    async def _send_direct(self, message: str, meeting_id: str, user_id: str) -> None:
        """
        Send a raw JSON string to a specific user within a meeting.
        """
        if meeting_id not in self._connections:
            return
        conns = self._connections[meeting_id].get(user_id)
        if not conns:
            return

        for ws in list(conns):
            try:
                await ws.send_text(message)
            except (RuntimeError, WebSocketDisconnect, Exception):
                try:
                    conns.remove(ws)
                except ValueError:
                    pass

        if meeting_id in self._connections and not self._connections[meeting_id].get(user_id):
            self._connections[meeting_id].pop(user_id, None)


meeting_manager = MeetingManager()
