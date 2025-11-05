import asyncio
import json
from typing import Any, Tuple, Callable, Optional

from ..config import REDIS_URL
from ..storage.redis_client import redis


def _chan(user_id: str) -> str:
    return f"pubsub:magheart:{user_id}"


async def set_latest(user_id: str, data: Any) -> None:
    await redis.set(f"latest_heart_rate:{user_id}", json.dumps(data), ex=120)


async def get_latest(user_id: str) -> Optional[Any]:
    val = await redis.get(f"latest_heart_rate:{user_id}")
    if not val:
        return None
    try:
        return json.loads(val)
    except Exception:
        return None


async def publish(user_id: str, event: Any) -> None:
    await redis.publish(_chan(user_id), json.dumps(event))


async def subscribe(user_id: str) -> Tuple[asyncio.Queue, Callable[[], None]]:
    channel = _chan(user_id)
    pubsub = redis.pubsub()
    await pubsub.subscribe(channel)

    q: asyncio.Queue = asyncio.Queue()
    stop = asyncio.Event()

    async def reader():
        try:
            while not stop.is_set():
                msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if msg and msg.get("type") == "message":
                    payload = msg["data"]
                    try:
                        obj = json.loads(payload)
                    except Exception:
                        obj = {"data": payload}
                    try:
                        q.put_nowait(obj)
                    except asyncio.QueueFull:
                        pass
        finally:
            try:
                await pubsub.unsubscribe(channel)
            finally:
                await pubsub.close()

    task = asyncio.create_task(reader())

    def unsubscribe() -> None:
        stop.set()
        task.cancel()

    return q, unsubscribe


# Ensure REDIS_URL provided (cloud only, no local/memory fallback)
if not (REDIS_URL and (REDIS_URL.startswith("redis://") or REDIS_URL.startswith("rediss://"))):
    raise RuntimeError(
        "REDIS_URL not set or invalid. Put a rediss:// or redis:// URL in backend .env/.env.local."
    )

