import os
import sys
from datetime import datetime, timezone
from typing import Optional, Union, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

# Add parent path if executed standalone
_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(os.path.dirname(_current_dir))
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)

try:
    from ..database import get_db
    from ..models import User
except (ImportError, ValueError):
    from app.database import get_db
    from app.models import User

router = APIRouter()


class UserSyncPayload(BaseModel):
    id: Optional[Union[str, int]] = None
    google_uid: Optional[str] = None
    name: Optional[str] = None
    email: str


@router.post("/sync", summary="Sync authenticated user into database (upsert)")
def sync_user(payload: UserSyncPayload, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Upsert authenticated Google user into users table.
    - If user exists by email or google_uid, update name and updated_at.
    - If user does not exist, insert a new record with created_at timestamp.
    """
    clean_email = payload.email.strip().lower()
    if not clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid email is required for user sync."
        )

    # Determine uid string from google_uid or id parameter
    candidate_uid = payload.google_uid
    if not candidate_uid and payload.id:
        candidate_uid = str(payload.id).strip()

    # Query for existing user
    user = None
    if candidate_uid:
        user = db.query(User).filter(User.google_uid == candidate_uid).first()

    if not user:
        user = db.query(User).filter(User.email == clean_email).first()

    is_new = False
    now = datetime.now(timezone.utc)

    if user:
        # Existing user: update name and active session timestamp
        if payload.name and payload.name.strip():
            user.name = payload.name.strip()
        if candidate_uid and not user.google_uid:
            user.google_uid = candidate_uid
        user.updated_at = now
        db.commit()
        db.refresh(user)
    else:
        # New user: insert into database
        is_new = True
        user = User(
            email=clean_email,
            name=payload.name.strip() if payload.name else None,
            google_uid=candidate_uid,
            created_at=now,
            updated_at=now,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "status": "success",
        "action": "created" if is_new else "updated",
        "is_new": is_new,
        "user": {
            "id": user.id,
            "google_uid": user.google_uid,
            "email": user.email,
            "name": user.name,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }
    }


@router.get("/me", summary="Get user details by email or google_uid")
def get_user(email: Optional[str] = None, google_uid: Optional[str] = None, db: Session = Depends(get_db)) -> Dict[str, Any]:
    if not email and not google_uid:
        raise HTTPException(status_code=400, detail="Provide email or google_uid parameter.")

    query = db.query(User)
    if google_uid:
        user = query.filter(User.google_uid == google_uid).first()
    else:
        user = query.filter(User.email == email.strip().lower()).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return {
        "id": user.id,
        "google_uid": user.google_uid,
        "email": user.email,
        "name": user.name,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }
