from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.prediction import Prediction
from app.services.auth import get_current_admin_user

router = APIRouter()

# Pydantic models
class UserStats(BaseModel):
    total_users: int
    active_users: int
    new_users_today: int
    new_users_this_week: int

class PredictionStats(BaseModel):
    total_predictions: int
    predictions_today: int
    predictions_this_week: int
    average_confidence: float
    risk_level_distribution: Dict[str, int]

class SystemHealth(BaseModel):
    status: str
    uptime: str
    database_status: str
    ml_model_status: str
    last_updated: datetime

class AdminDashboard(BaseModel):
    user_stats: UserStats
    prediction_stats: PredictionStats
    system_health: SystemHealth
    recent_predictions: List[Dict[str, Any]]

@router.get("/dashboard", response_model=AdminDashboard)
async def get_admin_dashboard(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get admin dashboard data"""
    
    # User statistics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    
    new_users_today = db.query(User).filter(
        func.date(User.created_at) == today
    ).count()
    
    new_users_this_week = db.query(User).filter(
        func.date(User.created_at) >= week_ago
    ).count()
    
    user_stats = UserStats(
        total_users=total_users,
        active_users=active_users,
        new_users_today=new_users_today,
        new_users_this_week=new_users_this_week
    )
    
    # Prediction statistics
    total_predictions = db.query(Prediction).count()
    predictions_today = db.query(Prediction).filter(
        func.date(Prediction.created_at) == today
    ).count()
    
    predictions_this_week = db.query(Prediction).filter(
        func.date(Prediction.created_at) >= week_ago
    ).count()
    
    avg_confidence = db.query(func.avg(Prediction.confidence_score)).scalar() or 0.0
    
    # Risk level distribution
    risk_distribution = db.query(
        Prediction.risk_level,
        func.count(Prediction.id)
    ).group_by(Prediction.risk_level).all()
    
    risk_level_distribution = {risk: count for risk, count in risk_distribution}
    
    prediction_stats = PredictionStats(
        total_predictions=total_predictions,
        predictions_today=predictions_today,
        predictions_this_week=predictions_this_week,
        average_confidence=float(avg_confidence),
        risk_level_distribution=risk_level_distribution
    )
    
    # System health
    system_health = SystemHealth(
        status="healthy",
        uptime="99.9%",
        database_status="connected",
        ml_model_status="loaded",
        last_updated=datetime.utcnow()
    )
    
    # Recent predictions
    recent_predictions = db.query(Prediction)\
        .order_by(desc(Prediction.created_at))\
        .limit(10)\
        .all()
    
    recent_predictions_data = []
    for pred in recent_predictions:
        recent_predictions_data.append({
            "id": str(pred.id),
            "user_id": str(pred.user_id),
            "risk_level": pred.risk_level,
            "confidence_score": pred.confidence_score,
            "created_at": pred.created_at,
            "disease_count": len(pred.predicted_diseases)
        })
    
    return AdminDashboard(
        user_stats=user_stats,
        prediction_stats=prediction_stats,
        system_health=system_health,
        recent_predictions=recent_predictions_data
    )

@router.get("/users", response_model=List[Dict[str, Any]])
async def get_all_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """Get all users with pagination"""
    
    users = db.query(User)\
        .order_by(desc(User.created_at))\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    result = []
    for user in users:
        prediction_count = db.query(Prediction)\
            .filter(Prediction.user_id == user.id)\
            .count()
        
        result.append({
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "prediction_count": prediction_count
        })
    
    return result

@router.get("/users/{user_id}", response_model=Dict[str, Any])
async def get_user_details(
    user_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get detailed user information"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user's predictions
    predictions = db.query(Prediction)\
        .filter(Prediction.user_id == user.id)\
        .order_by(desc(Prediction.created_at))\
        .limit(20)\
        .all()
    
    prediction_data = []
    for pred in predictions:
        prediction_data.append({
            "id": str(pred.id),
            "risk_level": pred.risk_level,
            "confidence_score": pred.confidence_score,
            "created_at": pred.created_at,
            "disease_count": len(pred.predicted_diseases)
        })
    
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "predictions": prediction_data,
        "total_predictions": len(prediction_data)
    }

@router.put("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Toggle user active status"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deactivating themselves
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully",
        "user_id": str(user.id),
        "is_active": user.is_active
    }

@router.get("/predictions", response_model=List[Dict[str, Any]])
async def get_all_predictions(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """Get all predictions with pagination"""
    
    predictions = db.query(Prediction)\
        .order_by(desc(Prediction.created_at))\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    result = []
    for pred in predictions:
        user = db.query(User).filter(User.id == pred.user_id).first()
        result.append({
            "id": str(pred.id),
            "user_id": str(pred.user_id),
            "user_email": user.email if user else "Unknown",
            "user_name": user.name if user else "Unknown",
            "risk_level": pred.risk_level,
            "confidence_score": pred.confidence_score,
            "disease_count": len(pred.predicted_diseases),
            "created_at": pred.created_at
        })
    
    return result

@router.get("/analytics/usage")
async def get_usage_analytics(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    days: int = 30
):
    """Get usage analytics for the specified number of days"""
    
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)
    
    # Daily user registrations
    daily_registrations = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(
        func.date(User.created_at) >= start_date
    ).group_by(
        func.date(User.created_at)
    ).all()
    
    # Daily predictions
    daily_predictions = db.query(
        func.date(Prediction.created_at).label('date'),
        func.count(Prediction.id).label('count')
    ).filter(
        func.date(Prediction.created_at) >= start_date
    ).group_by(
        func.date(Prediction.created_at)
    ).all()
    
    # Most common diseases
    disease_counts = {}
    predictions = db.query(Prediction).filter(
        func.date(Prediction.created_at) >= start_date
    ).all()
    
    for pred in predictions:
        for disease in pred.predicted_diseases:
            disease_name = disease.get('disease_name', 'Unknown')
            disease_counts[disease_name] = disease_counts.get(disease_name, 0) + 1
    
    top_diseases = sorted(disease_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "period_days": days,
        "daily_registrations": [
            {"date": str(date), "count": count}
            for date, count in daily_registrations
        ],
        "daily_predictions": [
            {"date": str(date), "count": count}
            for date, count in daily_predictions
        ],
        "top_diseases": [
            {"disease": disease, "count": count}
            for disease, count in top_diseases
        ]
    }
