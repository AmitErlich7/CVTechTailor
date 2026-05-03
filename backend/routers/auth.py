"""
Auth router — POST /auth/sync

Called by the frontend immediately after Firebase login.
Syncs the Firebase user into MongoDB:
  - First login  → creates user document
  - Re-login     → updates last_login only
  - Same email, different provider → links providers under one document
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from middleware.auth_middleware import get_current_user
from models.user import UserCreate, UserResponse
from services.mongo_service import (
    add_provider_to_user,
    create_user,
    get_user_by_email,
    get_user_by_firebase_uid,
    update_user_last_login,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/sync", response_model=UserResponse)
async def sync_user(
    user_data: UserCreate,
    firebase_uid: str = Depends(get_current_user),
):
    """
    Sync the authenticated Firebase user into MongoDB.

    The firebase_uid from the verified JWT is authoritative —
    we never trust the value supplied in the request body.
    """
    if user_data.firebase_uid != firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token uid does not match request body",
        )

    # 1. Existing user by firebase_uid
    existing = await get_user_by_firebase_uid(firebase_uid)
    if existing:
        await update_user_last_login(firebase_uid)
        if user_data.provider not in existing.get("provider", []):
            await add_provider_to_user(firebase_uid, user_data.provider)
        doc = await get_user_by_firebase_uid(firebase_uid)
        return UserResponse(**doc)

    # 2. Same email, new provider — link accounts
    existing_by_email = await get_user_by_email(user_data.email)
    if existing_by_email:
        await add_provider_to_user(existing_by_email["firebase_uid"], user_data.provider)
        await update_user_last_login(existing_by_email["firebase_uid"])
        doc = await get_user_by_firebase_uid(existing_by_email["firebase_uid"])
        return UserResponse(**doc)

    # 3. Brand-new user
    now = datetime.utcnow()
    new_user = {
        "firebase_uid": firebase_uid,
        "email": user_data.email,
        "name": user_data.name,
        "avatar": user_data.avatar,
        "provider": [user_data.provider],
        "created_at": now,
        "last_login": now,
    }
    doc = await create_user(new_user)
    logger.info("New user created: %s", firebase_uid)
    return UserResponse(**doc)
