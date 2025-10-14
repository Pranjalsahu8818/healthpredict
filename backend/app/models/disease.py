from sqlalchemy import Column, String, Text, JSON, Boolean, DateTime
from datetime import datetime
import uuid

from app.database import Base
from app.database.types import GUID

class Disease(Base):
    __tablename__ = "diseases"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text)
    symptoms = Column(JSON)  # List of associated symptoms
    treatments = Column(JSON)  # List of treatments
    prevention = Column(Text)
    severity = Column(String)  # mild, moderate, severe
    category = Column(String)  # infectious, chronic, acute, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Disease(id={self.id}, name={self.name}, severity={self.severity})>"
