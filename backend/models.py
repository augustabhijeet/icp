from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    documents = relationship("Document", back_populates="owner")
    history = relationship("UploadHistory", back_populates="user")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    classification = Column(String)
    confidence = Column(Float)
    extracted_data = Column(JSON)
    markdown = Column(String)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("User", back_populates="documents")
    history = relationship("UploadHistory", back_populates="document", cascade="all, delete-orphan")

class UploadHistory(Base):
    __tablename__ = "upload_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="history")
    document = relationship("Document", back_populates="history")
