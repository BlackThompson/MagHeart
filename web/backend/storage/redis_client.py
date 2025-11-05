from redis import asyncio as aioredis
from ..config import REDIS_URL


# Single shared async Redis client
redis = aioredis.from_url(REDIS_URL, decode_responses=True)
