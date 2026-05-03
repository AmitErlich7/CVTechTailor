"""
Per-user in-memory rate limiter.

Keyed on Firebase UID so limits apply per account, not per IP.
Resets on server restart — acceptable for a small deployment.
"""

from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status

from middleware.auth_middleware import get_current_user

# uid → list of request timestamps within the current window
_tailor_requests: dict = defaultdict(list)
_github_requests: dict = defaultdict(list)

_TAILOR_LIMIT = 10       # max tailoring requests
_TAILOR_WINDOW = timedelta(hours=1)

_GITHUB_LIMIT = 20       # max GitHub imports
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


async def tailor_rate_limit(user_id: str = Depends(get_current_user)) -> str:
    """Dependency: max 10 tailoring requests per user per hour."""
    _check(_tailor_requests, user_id, _TAILOR_LIMIT, _TAILOR_WINDOW, "tailoring requests")
    return user_id


async def github_rate_limit(user_id: str = Depends(get_current_user)) -> str:
    """Dependency: max 20 GitHub imports per user per hour."""
    _check(_github_requests, user_id, _GITHUB_LIMIT, _GITHUB_WINDOW, "GitHub imports")
    return user_id
