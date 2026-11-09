from datetime import datetime, timezone
import time
from typing import Dict, Any


def get_current_datetime(timezone_name: str = "UTC") -> Dict[str, Any]:
    """
    Get current date, time, weekday, timestamps, and formatting.
    """
    now_utc = datetime.now(timezone.utc)
    now_local = datetime.now()

    return {
        "success": True,
        "utc_iso": now_utc.isoformat(),
        "local_iso": now_local.isoformat(),
        "date": now_local.strftime("%Y-%m-%d"),
        "time": now_local.strftime("%H:%M:%S"),
        "day_of_week": now_local.strftime("%A"),
        "timestamp": int(time.time()),
        "readable": now_local.strftime("%A, %B %d, %Y at %I:%M %p")
    }

