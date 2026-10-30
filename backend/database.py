import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import hashlib

DATABASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(DATABASE_DIR, 'sql_app.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def hash_pw(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    detections = relationship("DetectionRecord", back_populates="user", cascade="all, delete-orphan")

class DetectionRecord(Base):
    __tablename__ = "detection_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_image_path = Column(String, nullable=False)
    visualization_image_path = Column(String, nullable=True)
    prediction = Column(String, nullable=False) # 'hazard_detected', 'normal', etc.
    confidence = Column(Float, nullable=False)
    mode = Column(String, default="trained_model")
    visualization_type = Column(String, default="gradcam_or_simulated")
    severity = Column(String, nullable=True) # 'High', 'Medium', 'Low', 'None'
    alarm_recommended = Column(Boolean, default=False)
    alarm_activated = Column(Boolean, default=False)
    model_version = Column(String, default="MobileNetV2-v1.0")
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="detections")

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if default admin user exists
        admin = db.query(User).filter(User.email == "admin@safety.org").first()
        if not admin:
            admin = User(
                email="admin@safety.org",
                full_name="Safety Administrator",
                hashed_password=hash_pw("admin123"),
                role="admin",
                created_at=datetime.datetime.utcnow()
            )
            db.add(admin)
            
        # Also add admin@lab.com alias
        lab_admin = db.query(User).filter(User.email == "admin@lab.com").first()
        if not lab_admin:
            lab_admin = User(
                email="admin@lab.com",
                full_name="Lab Administrator",
                hashed_password=hash_pw("admin123"),
                role="admin",
                created_at=datetime.datetime.utcnow()
            )
            db.add(lab_admin)
            
        db.commit()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
