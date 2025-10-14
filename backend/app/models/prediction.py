from sqlalchemy import Column, String, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base
from app.database.types import GUID

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    
    # Input data
    symptoms = Column(JSON, nullable=False)  # List of symptoms
    additional_info = Column(Text)  # Free text description
    
    # Prediction results
    predicted_diseases = Column(JSON, nullable=False)  # List of diseases with confidence scores
    confidence_score = Column(Float, nullable=False)  # Overall confidence
    risk_level = Column(String, nullable=False)  # low, medium, high
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="predictions")

    def __repr__(self):
        return f"<Prediction(id={self.id}, user_id={self.user_id}, risk_level={self.risk_level})>"
