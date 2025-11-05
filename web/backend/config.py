import os
try:
    from dotenv import load_dotenv  # type: ignore
    # Project root
    load_dotenv(".env")
    load_dotenv(".env.local", override=True)
    # Backend folder (this file directory)
    _HERE = os.path.dirname(__file__)
    load_dotenv(os.path.join(_HERE, ".env"), override=False)
    load_dotenv(os.path.join(_HERE, ".env.local"), override=True)
except Exception:
    # dotenv is optional
    pass

# Required: Redis URL (use rediss:// for Upstash TCP/TLS)
REDIS_URL = os.getenv("REDIS_URL")
if not REDIS_URL:
    raise RuntimeError(
        "REDIS_URL not set. Put it in .env/.env.local (e.g., rediss://default:<password>@host:port)."
    )

# CSV storage directory
DATA_DIR = os.getenv("MAGHEART_DATA_DIR", "data")
os.makedirs(DATA_DIR, exist_ok=True)

# CORS allowed origins: comma-separated or '*' for all
_cors = os.getenv("CORS_ALLOW_ORIGINS", "*")
if _cors.strip() == "*":
    CORS_ALLOW_ORIGINS = ["*"]
else:
    CORS_ALLOW_ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()]
