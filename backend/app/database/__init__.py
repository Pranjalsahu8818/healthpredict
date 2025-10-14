from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from decouple import config
import asyncio

# Database configuration
# Default to SQLite for local development to avoid external dependencies
DATABASE_URL = config(
    "DATABASE_URL",
    default="sqlite:///./healthpredict.db"
)

# Debug: Print database URL (without credentials)
if DATABASE_URL.startswith("postgresql"):
    print(f"Using PostgreSQL database: {DATABASE_URL[:20]}...")
else:
    print(f"Using database: {DATABASE_URL}")
    print("WARNING: Not using PostgreSQL in production!")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

async def init_db():
    """Initialize database tables"""
    # Import all models to ensure they are registered
    from app.models import user, prediction, disease, symptom
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully")

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
