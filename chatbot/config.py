import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)


@lru_cache
def settings() -> dict[str, str]:
    values = {
        "openrouter_api_key": os.getenv("OPENROUTER_API_KEY", ""),
        "tavily_api_key": os.getenv("TAVILY_API_KEY", ""),
        "openrouter_model": os.getenv(
            "OPENROUTER_MODEL", "openrouter/free"
        ),
        "nepse_api_url": os.getenv("NEPSE_API_URL", "http://127.0.0.1:8000"),
    }
    return values
