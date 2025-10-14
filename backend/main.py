from fastapi import FastAPI, HTTPException, Depends, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from decouple import config

from app.api import auth, predictions, admin, users, contact
from app.database import init_db
from app.models.user import User
from app.services.auth import get_current_user

# Initialize FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="HealthPredict API",
    description="AI-powered disease prediction platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Allow all for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=False,  # Set to False when using wildcard
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Expose all headers
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(contact.router, prefix="/contact", tags=["Contact"])

@app.get("/")
async def root():
    return {
        "message": "HealthPredict API",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

# Ensure CORS preflight always succeeds during development
@app.options("/{rest_of_path:path}")
async def cors_preflight(rest_of_path: str):
    return Response(status_code=200)

# Protected route example
@app.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    return {
        "message": f"Hello {current_user.name}!",
        "user_id": current_user.id,
        "role": current_user.role
    }

if __name__ == "__main__":
    print("=" * 70)
    print("🚀 HealthPredict Backend Server Starting...")
    print("=" * 70)
    print("📍 API URL: http://127.0.0.1:8000")
    print("📍 API Docs: http://127.0.0.1:8000/docs")
    print("📍 Health Check: http://127.0.0.1:8000/health")
    print("=" * 70)
    print("✅ CORS enabled for all origins (development mode)")
    print("✅ ML models will load automatically")
    print("=" * 70)
    print()
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
