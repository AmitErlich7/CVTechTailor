"""
Simple in-memory rate limiter for local use.
Keyed on a fixed local user ID. Resets on server restart.
"""

from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import HTTPException, status

from services.db_service import LOCAL_USER_ID

_tailor_requests: dict = defaultdict(list)
_github_requests: dict = defaultdict(list)

_TAILOR_LIMIT = 10
_TAILOR_WINDOW = timedelta(hours=1)

_GITHUB_LIMIT = 20
_GITHUB_WINDOW = timedelta(hours=1)


def _check(store: dict, uid: str, limit: int, window: timedelta, label: str) -> None:
    now = datetime.utcnow()
    store[uid] = [t for t in store[uid] if now - t < window]
    if len(store[uid]) >= limit:
        minutes = int(window.total_seconds() // 60)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: {limit} {label} per {minutes} minutes. Try again later.",
        )
    store[uid].append(now)


def tailor_rate_limit() -> str:
    _check(_tailor_requests, LOCAL_USER_ID, _TAILOR_LIMIT, _TAILOR_WINDOW, "tailoring requests")
    return LOCAL_USER_ID


def github_rate_limit() -> str:
    _check(_github_requests, LOCAL_USER_ID, _GITHUB_LIMIT, _GITHUB_WINDOW, "GitHub imports")
    return LOCAL_USER_ID
