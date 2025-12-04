from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional

# Setup SQLAlchemy Base
Base = declarative_base()

# --- SQLAlchemy DB Models (Table Definitions) ---

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Permissions could be a JSON column or separate table
    # For simplicity: list of robot_ids they own
    
class Robot(Base):
    __tablename__ = "robots"

    id = Column(String, primary_key=True, index=True) # e.g. "robot_001"
    owner_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    stream_key = Column(String) # Used as the "password" for RTMP streaming
    is_public_demo = Column(Boolean, default=False) # If True, enables Playroom Queue logic

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True)
    robot_id = Column(String, ForeignKey("robots.id"))
    s3_key = Column(String)
    duration_seconds = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# --- Pydantic Schemas (For API Data Validation) ---

class UserSchema(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True

class RobotSchema(BaseModel):
    id: str
    name: str
    is_public_demo: bool

    class Config:
        from_attributes = True

# --- Database Connection (Placeholder) ---
# In production, use: DATABASE_URL = os.getenv("DATABASE_URL")
# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)