import asyncio
import csv
import os
from collections import deque
from typing import Optional, Dict, Any

from ..config import DATA_DIR


HEADER = ["ts", "bpm", "device"]


def _csv_path(user_id: str) -> str:
    safe_user = "".join(c for c in user_id if c.isalnum() or c in ("-", "_")) or "default"
    return os.path.join(DATA_DIR, f"{safe_user}.csv")


def _ensure_file(path: str) -> None:
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(HEADER)


def _row_from_record(record: Dict[str, Any]):
    return [
        record.get("ts"),
        record.get("bpm"),
        record.get("device"),
    ]


async def append_heart_rate(user_id: str, record: Dict[str, Any]) -> None:
    path = _csv_path(user_id)

    def _write():
        _ensure_file(path)
        with open(path, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(_row_from_record(record))

    await asyncio.to_thread(_write)


async def read_latest(user_id: str) -> Optional[Dict[str, Any]]:
    path = _csv_path(user_id)
    if not os.path.exists(path):
        return None

    def _read_last() -> Optional[Dict[str, Any]]:
        last_line: Optional[str] = None
        with open(path, "r", newline="") as f:
            # Use deque to grab the last data line efficiently
            dq = deque(f, maxlen=2)  # header + last line
            if not dq:
                return None
            # Remove header if present
            if dq and dq[0].strip().startswith("ts,") and len(dq) == 1:
                return None
            last_line = dq[-1].strip() if dq else None
        if not last_line:
            return None
        parts = next(csv.reader([last_line]))
        try:
            return {
                "ts": int(parts[0]) if parts[0] else None,
                "bpm": int(parts[1]) if parts[1] else None,
                "device": parts[2] or None if len(parts) > 2 else None,
            }
        except Exception:
            return None

    return await asyncio.to_thread(_read_last)
