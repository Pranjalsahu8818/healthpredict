"""
Test script to verify history data connection
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.models.prediction import Prediction
from app.database import DATABASE_URL

# Create engine and session
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_history_connection():
    """Test if we can retrieve prediction history from database"""
    db = SessionLocal()
    
    try:
        # Count total users
        user_count = db.query(User).count()
        print(f"✓ Total users in database: {user_count}")
        
        # Count total predictions
        prediction_count = db.query(Prediction).count()
        print(f"✓ Total predictions in database: {prediction_count}")
        
        # Get all users and their prediction counts
        users = db.query(User).all()
        print("\n📊 User Prediction Summary:")
        print("-" * 60)
        
        for user in users:
            user_predictions = db.query(Prediction).filter(Prediction.user_id == user.id).count()
            print(f"  • {user.name} ({user.email})")
            print(f"    Role: {user.role.value}")
            print(f"    Predictions: {user_predictions}")
            
            if user_predictions > 0:
                # Show latest prediction
                latest = db.query(Prediction)\
                    .filter(Prediction.user_id == user.id)\
                    .order_by(Prediction.created_at.desc())\
                    .first()
                
                if latest:
                    top_disease = latest.predicted_diseases[0] if latest.predicted_diseases else {}
                    print(f"    Latest: {top_disease.get('disease_name', 'N/A')} ({latest.risk_level} risk)")
            print()
        
        print("=" * 60)
        print("✅ Database connection and history retrieval working!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_history_connection()
