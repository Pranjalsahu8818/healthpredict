from sqlalchemy import Column, String, Text, JSON, Boolean, DateTime
from datetime import datetime
import uuid

from app.database import Base
from app.database.types import GUID

class Symptom(Base):
    __tablename__ = "symptoms"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text)
    category = Column(String)  # pain, digestive, respiratory, etc.
    severity_levels = Column(JSON)  # mild, moderate, severe
    associated_diseases = Column(JSON)  # List of disease IDs
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Symptom(id={self.id}, name={self.name}, category={self.category})>"
