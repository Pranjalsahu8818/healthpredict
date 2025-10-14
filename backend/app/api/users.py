from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any

from app.database import get_db
from app.models.user import User
from app.services.auth import get_current_active_user

router = APIRouter()

# Pydantic models
class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str
    total_predictions: int

    class Config:
        from_attributes = True

class UpdateProfile(BaseModel):
    name: str = None
    email: str = None

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    
    # Count user's predictions
    from app.models.prediction import Prediction
    total_predictions = db.query(Prediction)\
        .filter(Prediction.user_id == current_user.id)\
        .count()
    
    return UserProfile(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value,
        created_at=current_user.created_at.isoformat(),
        total_predictions=total_predictions
    )

@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    profile_data: UpdateProfile,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    
    # Check if email is already taken by another user
    if profile_data.email and profile_data.email != current_user.email:
        existing_user = db.query(User)\
            .filter(User.email == profile_data.email)\
            .filter(User.id != current_user.id)\
            .first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already taken"
            )
    
    # Update user data
    if profile_data.name is not None:
        current_user.name = profile_data.name
    
    if profile_data.email is not None:
        current_user.email = profile_data.email
    
    db.commit()
    db.refresh(current_user)
    
    # Count user's predictions
    from app.models.prediction import Prediction
    total_predictions = db.query(Prediction)\
        .filter(Prediction.user_id == current_user.id)\
        .count()
    
    return UserProfile(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value,
        created_at=current_user.created_at.isoformat(),
        total_predictions=total_predictions
    )

@router.delete("/account")
async def delete_user_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete current user's account"""
    
    # Delete user's predictions first
    from app.models.prediction import Prediction
    db.query(Prediction).filter(Prediction.user_id == current_user.id).delete()
    
    # Delete user account
    db.delete(current_user)
    db.commit()
    
    return {"message": "Account deleted successfully"}
