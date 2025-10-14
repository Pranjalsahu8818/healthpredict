from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.prediction import Prediction
from app.services.auth import get_current_active_user
from app.services.report_generator import generate_prediction_report, generate_report_filename

# Try to use advanced ML service, fallback to basic if not available
try:
    from app.services.ml_advanced import AdvancedMLService as MLPredictionService
except ImportError:
    from app.services.ml import MLPredictionService

router = APIRouter()

# Pydantic models
class SymptomInput(BaseModel):
    name: str
    severity: str  # mild, moderate, severe
    duration: str  # hours, days, weeks, months

class PredictionRequest(BaseModel):
    symptoms: List[SymptomInput]
    additional_info: str = ""
    age: int = None
    gender: str = None
    medical_history: List[str] = []

class DiseasePrediction(BaseModel):
    disease_name: str
    confidence_score: float
    description: str
    severity: str
    recommended_actions: List[str]

class PredictionResponse(BaseModel):
    id: str
    predicted_diseases: List[DiseasePrediction]
    overall_confidence: float
    risk_level: str
    created_at: datetime
    disclaimer: str

    class Config:
        from_attributes = True

@router.post("/predict", response_model=PredictionResponse)
async def predict_disease(
    request: PredictionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Predict diseases based on symptoms"""
    
    try:
        # Initialize ML service
        ml_service = MLPredictionService()
        
        # Prepare input data
        symptoms_data = [
            {
                "name": symptom.name,
                "severity": symptom.severity,
                "duration": symptom.duration
            }
            for symptom in request.symptoms
        ]
        
        # Get predictions from ML service
        predictions = await ml_service.predict_diseases(
            symptoms=symptoms_data,
            additional_info=request.additional_info,
            age=request.age,
            gender=request.gender,
            medical_history=request.medical_history
        )
        
        # Calculate overall confidence and risk level
        overall_confidence = max([p["confidence_score"] for p in predictions]) if predictions else 0.0
        risk_level = "high" if overall_confidence > 0.7 else "medium" if overall_confidence > 0.4 else "low"
        
        # Save prediction to database
        prediction = Prediction(
            user_id=current_user.id,
            symptoms=symptoms_data,
            additional_info=request.additional_info,
            predicted_diseases=predictions,
            confidence_score=overall_confidence,
            risk_level=risk_level
        )
        
        db.add(prediction)
        db.commit()
        db.refresh(prediction)
        
        # Format response
        disease_predictions = [
            DiseasePrediction(
                disease_name=p["disease_name"],
                confidence_score=p["confidence_score"],
                description=p.get("description", ""),
                severity=p.get("severity", "unknown"),
                recommended_actions=p.get("recommended_actions", [])
            )
            for p in predictions
        ]
        
        return PredictionResponse(
            id=str(prediction.id),
            predicted_diseases=disease_predictions,
            overall_confidence=overall_confidence,
            risk_level=risk_level,
            created_at=prediction.created_at,
            disclaimer="This prediction is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns."
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@router.get("/history", response_model=List[PredictionResponse])
async def get_prediction_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    limit: int = 10,
    offset: int = 0
):
    """Get user's prediction history"""
    
    predictions = db.query(Prediction)\
        .filter(Prediction.user_id == current_user.id)\
        .order_by(Prediction.created_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    result = []
    for prediction in predictions:
        disease_predictions = [
            DiseasePrediction(
                disease_name=p["disease_name"],
                confidence_score=p["confidence_score"],
                description=p.get("description", ""),
                severity=p.get("severity", "unknown"),
                recommended_actions=p.get("recommended_actions", [])
            )
            for p in prediction.predicted_diseases
        ]
        
        result.append(PredictionResponse(
            id=str(prediction.id),
            predicted_diseases=disease_predictions,
            overall_confidence=prediction.confidence_score,
            risk_level=prediction.risk_level,
            created_at=prediction.created_at,
            disclaimer="This prediction is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns."
        ))
    
    return result

@router.get("/{prediction_id}/download-report")
async def download_prediction_report(
    prediction_id: str,
    auth: str = None,
    db: Session = Depends(get_db)
):
    """
    Download a professional PDF report for a specific prediction
    """
    # Verify auth token from query parameter
    if not auth:
        print("✗ No auth token provided")
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        from app.services.auth import verify_token
        print(f"✓ Verifying token for prediction {prediction_id}")
        email = verify_token(auth)
        if not email:
            print("✗ Token verification failed - invalid token")
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        
        print(f"✓ Token verified for email: {email}")
        current_user = db.query(User).filter(User.email == email).first()
        if not current_user:
            print(f"✗ User not found for email: {email}")
            raise HTTPException(status_code=401, detail="User not found")
        
        print(f"✓ User authenticated: {current_user.name}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"✗ Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    # Get the prediction
    prediction = db.query(Prediction).filter(
        Prediction.id == prediction_id,
        Prediction.user_id == current_user.id
    ).first()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found"
        )
    
    # Prepare prediction data for report
    try:
        # Safely extract disease name
        disease_name = 'Unknown'
        if prediction.predicted_diseases and len(prediction.predicted_diseases) > 0:
            if isinstance(prediction.predicted_diseases[0], dict):
                disease_name = prediction.predicted_diseases[0].get('disease_name', 'Unknown')
            else:
                disease_name = str(prediction.predicted_diseases[0])
        
        # Safely extract symptoms
        symptoms = []
        if prediction.symptoms:
            if isinstance(prediction.symptoms, list):
                for s in prediction.symptoms:
                    if isinstance(s, dict):
                        symptoms.append(s.get('name', str(s)))
                    else:
                        symptoms.append(str(s))
        
        # Generate recommendations based on risk level
        recommendations = []
        risk_level = str(prediction.risk_level).lower() if prediction.risk_level else 'unknown'
        
        if risk_level == 'high':
            recommendations = [
                'Consult with a healthcare professional immediately',
                'Schedule a comprehensive medical examination',
                'Monitor your symptoms closely and keep a health diary',
                'Follow prescribed treatment plans strictly',
                'Maintain regular follow-up appointments'
            ]
        elif risk_level == 'medium':
            recommendations = [
                'Schedule a medical consultation soon',
                'Monitor your symptoms regularly',
                'Maintain a healthy lifestyle',
                'Consider preventive measures',
                'Keep track of any health changes'
            ]
        else:  # low or unknown
            recommendations = [
                'Continue maintaining a healthy lifestyle',
                'Schedule regular health check-ups',
                'Stay aware of any new symptoms',
                'Maintain preventive care practices',
                'Monitor for any changes in your health'
            ]
        
        prediction_data = {
            'id': str(prediction.id),
            'disease': disease_name,
            'confidence': float(prediction.confidence_score) if prediction.confidence_score else 0.0,
            'risk_level': str(prediction.risk_level) if prediction.risk_level else 'Unknown',
            'created_at': prediction.created_at.strftime('%Y-%m-%d %H:%M:%S') if prediction.created_at else datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'symptoms': symptoms,
            'health_metrics': {},  # Can be populated from additional_info if needed
            'recommendations': recommendations
        }
        
        print(f"✓ Prediction data prepared successfully")
        
    except Exception as e:
        print(f"✗ Error preparing prediction data: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error preparing data: {str(e)}")
    
    # Prepare user data
    user_data = {
        'name': current_user.name,
        'email': current_user.email
    }
    
    # Generate PDF report
    try:
        print(f"✓ Generating PDF report for prediction {prediction_id}")
        print(f"✓ User: {current_user.name} ({current_user.email})")
        
        pdf_buffer = generate_prediction_report(prediction_data, user_data)
        pdf_bytes = pdf_buffer.read()
        
        filename = generate_report_filename(current_user.name, str(prediction.id))
        
        print(f"✓ PDF generated successfully: {filename}")
        print(f"✓ PDF size: {len(pdf_bytes)} bytes")
        
        # Return PDF as downloadable file with proper headers
        from fastapi.responses import Response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
                "Cache-Control": "no-cache",
            }
        )
    except Exception as e:
        import traceback
        print(f"✗ ERROR generating PDF report: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )

@router.get("/{prediction_id}", response_model=PredictionResponse)
async def get_prediction(
    prediction_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific prediction by ID"""
    
    prediction = db.query(Prediction)\
        .filter(Prediction.id == prediction_id)\
        .filter(Prediction.user_id == current_user.id)\
        .first()
    
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found"
        )
    
    disease_predictions = [
        DiseasePrediction(
            disease_name=p["disease_name"],
            confidence_score=p["confidence_score"],
            description=p.get("description", ""),
            severity=p.get("severity", "unknown"),
            recommended_actions=p.get("recommended_actions", [])
        )
        for p in prediction.predicted_diseases
    ]
    
    return PredictionResponse(
        id=str(prediction.id),
        predicted_diseases=disease_predictions,
        overall_confidence=prediction.confidence_score,
        risk_level=prediction.risk_level,
        created_at=prediction.created_at,
        disclaimer="This prediction is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns."
    )

class PredictionStats(BaseModel):
    total_predictions: int
    predictions_this_month: int
    high_risk_alerts: int
    recent_predictions: List[Dict[str, Any]]

@router.get("/stats/summary", response_model=PredictionStats)
async def get_prediction_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's prediction statistics"""
    
    # Total predictions
    total_predictions = db.query(func.count(Prediction.id))\
        .filter(Prediction.user_id == current_user.id)\
        .scalar()
    
    # Predictions this month
    now = datetime.utcnow()
    first_day_of_month = datetime(now.year, now.month, 1)
    predictions_this_month = db.query(func.count(Prediction.id))\
        .filter(Prediction.user_id == current_user.id)\
        .filter(Prediction.created_at >= first_day_of_month)\
        .scalar()
    
    # High risk alerts (predictions with high risk level)
    high_risk_alerts = db.query(func.count(Prediction.id))\
        .filter(Prediction.user_id == current_user.id)\
        .filter(Prediction.risk_level == "high")\
        .scalar()
    
    # Recent predictions (last 5)
    recent_predictions_query = db.query(Prediction)\
        .filter(Prediction.user_id == current_user.id)\
        .order_by(Prediction.created_at.desc())\
        .limit(5)\
        .all()
    
    recent_predictions = []
    for pred in recent_predictions_query:
        # Get the top disease from predictions
        top_disease = pred.predicted_diseases[0] if pred.predicted_diseases else {"disease_name": "Unknown"}
        recent_predictions.append({
            "id": str(pred.id),
            "disease": top_disease.get("disease_name", "Unknown"),
            "risk": pred.risk_level,
            "confidence": pred.confidence_score,
            "date": pred.created_at.isoformat()
        })
    
    return PredictionStats(
        total_predictions=total_predictions or 0,
        predictions_this_month=predictions_this_month or 0,
        high_risk_alerts=high_risk_alerts or 0,
        recent_predictions=recent_predictions
    )
