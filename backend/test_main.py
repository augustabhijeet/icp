import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from unittest.mock import patch, MagicMock
import asyncio

from backend.main import app, get_db
from backend.db import Base
from backend import models

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(autouse=True)
def mock_ai():
    with patch("backend.main.ai") as mock:
        # Create async mocks
        async def mock_classify(*args, **kwargs):
            return {"classification": "Resume", "confidence": 0.99}
        async def mock_extract(*args, **kwargs):
            return {"name": "John Doe"}
        async def mock_call(*args, **kwargs):
            return "4"
            
        mock.classify_document_ai.side_effect = mock_classify
        mock.extract_content_ai.side_effect = mock_extract
        mock.call_llm.side_effect = mock_call
        yield mock

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_hello():
    response = client.get("/api/hello")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}

def test_ai_connectivity():
    response = client.post("/api/ai/test")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_login():
    response = client.post("/api/auth/login", json={"username": "user", "password": "password"})
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["username"] == "user"

def test_login_fail():
    response = client.post("/api/auth/login", json={"username": "user", "password": "wrong"})
    assert response.status_code == 401

def test_list_documents_empty():
    response = client.get("/api/documents")
    assert response.status_code == 200
    assert response.json() == []

def test_upload_and_list():
    # Create a dummy PDF
    pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    
    files = {"file": ("test.pdf", pdf_content, "application/pdf")}
    response = client.post("/api/upload", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.pdf"
    assert data["classification"] == "Resume"
    assert data["confidence"] == 0.99
    assert data["extracted_data"] == {"name": "John Doe"}
    assert "id" in data
    
    # Check if it appears in list
    response = client.get("/api/documents")
    assert response.status_code == 200
    docs = response.json()
    assert len(docs) == 1
    assert docs[0]["id"] == data["id"]

def test_delete_document():
    # Upload first
    pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    files = {"file": ("test.pdf", pdf_content, "application/pdf")}
    upload_response = client.post("/api/upload", files=files)
    doc_id = upload_response.json()["id"]
    
    # Delete
    response = client.delete(f"/api/documents/{doc_id}")
    assert response.status_code == 200
    
    # Verify gone
    response = client.get("/api/documents")
    assert len(response.json()) == 0
