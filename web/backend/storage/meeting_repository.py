import json
import os
import sqlite3
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional

from ..config import DATA_DIR


def _now_iso() -> str:
    return datetime.now().isoformat()


class MeetingRepository:
    """
    SQLite-backed repository for meeting metadata, participants, and shared state.
    Provides simple CRUD helpers used by the MeetingManager so WebSocket logic
    stays decoupled from persistence concerns.
    """

    def __init__(self, db_path: Optional[str] = None) -> None:
        self.db_path = db_path or os.path.join(DATA_DIR, "meetings.db")
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._lock = threading.Lock()
        self._init_schema()

    def _init_schema(self) -> None:
        with self.conn:
            self.conn.execute(
                """
                CREATE TABLE IF NOT EXISTS meetings (
                  meeting_id TEXT PRIMARY KEY,
                  phase TEXT NOT NULL DEFAULT 'lobby',
                  meeting_state TEXT NOT NULL DEFAULT '{}',
                  created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL,
                  phase_updated_by TEXT,
                  meeting_state_updated_by TEXT
                )
                """
            )
            self.conn.execute(
                """
                CREATE TABLE IF NOT EXISTS participants (
                  meeting_id TEXT NOT NULL,
                  user_id TEXT NOT NULL,
                  role TEXT,
                  status TEXT,
                  last_heartbeat TEXT,
                  joined_at TEXT,
                  payload_json TEXT,
                  PRIMARY KEY (meeting_id, user_id)
                )
                """
            )

    # -- Meetings ------------------------------------------------------------

    def ensure_meeting(self, meeting_id: str) -> None:
        now = _now_iso()
        with self._lock, self.conn:
            self.conn.execute(
                """
                INSERT OR IGNORE INTO meetings (meeting_id, created_at, updated_at)
                VALUES (?, ?, ?)
                """,
                (meeting_id, now, now),
            )

    def get_meeting(self, meeting_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            cur = self.conn.execute(
                "SELECT * FROM meetings WHERE meeting_id = ?",
                (meeting_id,),
            )
            row = cur.fetchone()
        if not row:
            return None
        meeting_state = {}
        try:
            meeting_state = json.loads(row["meeting_state"] or "{}")
        except json.JSONDecodeError:
            meeting_state = {}
        return {
            "meetingId": row["meeting_id"],
            "phase": row["phase"],
            "meetingState": meeting_state,
            "updatedAt": row["updated_at"],
            "createdAt": row["created_at"],
            "phaseUpdatedBy": row["phase_updated_by"],
            "meetingStateUpdatedBy": row["meeting_state_updated_by"],
        }

    def update_phase(self, meeting_id: str, phase: str, updated_by: str) -> None:
        now = _now_iso()
        with self._lock, self.conn:
            self.conn.execute(
                """
                UPDATE meetings
                SET phase = ?, updated_at = ?, phase_updated_by = ?
                WHERE meeting_id = ?
                """,
                (phase, now, updated_by, meeting_id),
            )

    def update_meeting_state(self, meeting_id: str, updates: Dict[str, Any], updated_by: str) -> Dict[str, Any]:
        meeting = self.get_meeting(meeting_id) or {}
        current_state = dict(meeting.get("meetingState") or {})
        current_state.update(updates or {})
        now = _now_iso()
        with self._lock, self.conn:
            self.conn.execute(
                """
                UPDATE meetings
                SET meeting_state = ?, updated_at = ?, meeting_state_updated_by = ?
                WHERE meeting_id = ?
                """,
                (json.dumps(current_state), now, updated_by, meeting_id),
            )
        return current_state

    def delete_meeting(self, meeting_id: str) -> None:
        with self._lock, self.conn:
            self.conn.execute(
                "DELETE FROM participants WHERE meeting_id = ?",
                (meeting_id,),
            )
            self.conn.execute(
                "DELETE FROM meetings WHERE meeting_id = ?",
                (meeting_id,),
            )

    # -- Participants --------------------------------------------------------

    def get_participant(self, meeting_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            cur = self.conn.execute(
                "SELECT * FROM participants WHERE meeting_id = ? AND user_id = ?",
                (meeting_id, user_id),
            )
            row = cur.fetchone()
        if not row:
            return None
        payload = self._deserialize_payload(row["payload_json"])
        return self._merge_participant_row(row, payload)

    def upsert_participant(self, meeting_id: str, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        self.ensure_meeting(meeting_id)
        now = _now_iso()
        existing = self.get_participant(meeting_id, user_id)
        joined_at = existing.get("joinedAt") if existing else now
        role = payload.get("role") or (existing.get("role") if existing else None)
        merged_payload = {**(existing.get("payload", {}) if existing else {}), **payload}
        payload_json = json.dumps(merged_payload)
        with self._lock, self.conn:
            self.conn.execute(
                """
                INSERT INTO participants (meeting_id, user_id, role, status, last_heartbeat, joined_at, payload_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(meeting_id, user_id) DO UPDATE SET
                  role = excluded.role,
                  status = excluded.status,
                  last_heartbeat = excluded.last_heartbeat,
                  joined_at = excluded.joined_at,
                  payload_json = excluded.payload_json
                """,
                (meeting_id, user_id, role, payload.get("status"), now, joined_at, payload_json),
            )
        return {
            "meetingId": meeting_id,
            "userId": user_id,
            "role": role,
            "status": payload.get("status"),
            "lastHeartbeat": now,
            "joinedAt": joined_at,
            "payload": merged_payload,
        }

    def update_participant_status(
        self,
        meeting_id: str,
        user_id: str,
        status: str,
        payload_patch: Optional[Dict[str, Any]] = None,
    ) -> None:
        existing = self.get_participant(meeting_id, user_id)
        if not existing:
            return
        merged_payload = {**existing.get("payload", {}), **(payload_patch or {})}
        payload_json = json.dumps(merged_payload)
        now = _now_iso()
        with self._lock, self.conn:
            self.conn.execute(
                """
                UPDATE participants
                SET status = ?, last_heartbeat = ?, payload_json = ?
                WHERE meeting_id = ? AND user_id = ?
                """,
                (status, now, payload_json, meeting_id, user_id),
            )

    def remove_participant(self, meeting_id: str, user_id: str) -> None:
        with self._lock, self.conn:
            self.conn.execute(
                "DELETE FROM participants WHERE meeting_id = ? AND user_id = ?",
                (meeting_id, user_id),
            )

    def list_participants(self, meeting_id: str) -> List[Dict[str, Any]]:
        with self._lock:
            cur = self.conn.execute(
                "SELECT * FROM participants WHERE meeting_id = ?",
                (meeting_id,),
            )
            rows = cur.fetchall()
        return [self._merge_participant_row(row, self._deserialize_payload(row["payload_json"])) for row in rows]

    def list_meetings_for_user(self, user_id: str) -> List[str]:
        """
        Return the distinct meeting IDs where the given user currently appears.
        """
        with self._lock:
            cur = self.conn.execute(
                "SELECT DISTINCT meeting_id FROM participants WHERE user_id = ?",
                (user_id,),
            )
            rows = cur.fetchall()
        return [row["meeting_id"] for row in rows]

    def update_participant_payload(self, meeting_id: str, user_id: str, payload_patch: Dict[str, Any]) -> None:
        """
        Merge the provided payload patch into the participant's persisted payload.
        """
        if not payload_patch:
            return

        with self._lock, self.conn:
            cur = self.conn.execute(
                "SELECT payload_json FROM participants WHERE meeting_id = ? AND user_id = ?",
                (meeting_id, user_id),
            )
            row = cur.fetchone()
            if not row:
                return

            existing_payload = self._deserialize_payload(row["payload_json"])
            merged_payload = {**existing_payload, **payload_patch}
            payload_json = json.dumps(merged_payload)

            self.conn.execute(
                """
                UPDATE participants
                SET payload_json = ?
                WHERE meeting_id = ? AND user_id = ?
                """,
                (payload_json, meeting_id, user_id),
            )

    def cleanup_participants(
        self,
        meeting_id: str,
        offline_before: datetime,
        remove_before: datetime,
    ) -> None:
        with self._lock:
            cur = self.conn.execute(
                "SELECT * FROM participants WHERE meeting_id = ?",
                (meeting_id,),
            )
            rows = cur.fetchall()
        for row in rows:
            last_seen = (
                self._parse_ts(row["last_heartbeat"])
                or self._parse_ts(row["joined_at"])
                or datetime.fromtimestamp(0)
            )
            if last_seen < remove_before:
                self.remove_participant(meeting_id, row["user_id"])
            elif last_seen < offline_before:
                self.update_participant_status(meeting_id, row["user_id"], "offline")

    # -- Helpers -------------------------------------------------------------

    @staticmethod
    def _deserialize_payload(payload_json: Optional[str]) -> Dict[str, Any]:
        if not payload_json:
            return {}
        try:
            return json.loads(payload_json)
        except json.JSONDecodeError:
            return {}

    @staticmethod
    def _parse_ts(value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None

    @staticmethod
    def _merge_participant_row(row: sqlite3.Row, payload: Dict[str, Any]) -> Dict[str, Any]:
        base = {
            "meetingId": row["meeting_id"],
            "userId": row["user_id"],
            "role": row["role"] or payload.get("role"),
            "status": row["status"],
            "lastHeartbeat": row["last_heartbeat"],
            "joinedAt": row["joined_at"],
        }
        merged = {**payload, **base}
        merged["payload"] = payload
        return merged


repository = MeetingRepository()
