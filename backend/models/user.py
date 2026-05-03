from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    firebase_uid: str
    email: EmailStr
    name: str
    avatar: str
    provider: str  # "google"


class UserDocument(BaseModel):
    firebase_uid: str
    email: EmailStr
    name: str
    avatar: str
    provider: List[str]
    created_at: datetime
    last_login: datetime


class UserResponse(BaseModel):
    firebase_uid: str
    email: str
    name: str
    avatar: str
    provider: List[str]
    created_at: datetime
    last_login: datetime
