import io
import os
from collections import defaultdict
from typing import Any, Dict, List, Optional

import httpx
import pdfplumber
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

# Import DB and AI modules
try:
    from . import models, db, ai
    from .db import engine, get_db
except ImportError:
    import models, db, ai
    from db import engine, get_db

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

load_dotenv()
# Fallback for when running from within the backend directory
if not os.getenv("OPENROUTER_API_KEY"):
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY must be set in .env")

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf"}
ALLOWED_CONTENT_TYPES = {"application/pdf"}

app = FastAPI(title="Intelligent Content Processor API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE"],
    allow_headers=["*"],
)


# Dependency to get current user (Dummy implementation for now)
async def get_current_user(database: Session = Depends(get_db)):
    user = database.query(models.User).filter(models.User.username == "user").first()
    if not user:
        user = models.User(username="user", password_hash="password") 
        database.add(user)
        database.commit()
        database.refresh(user)
    return user


def normalize_line_key(top: float) -> int:
    return int(round(top / 5.0) * 5)


def pdf_to_markdown(file_bytes: bytes) -> str:
    pages: List[str] = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for number, page in enumerate(pdf.pages, start=1):
            page_header = f"## Page {number}"
            words = page.extract_words()
            if not words:
                text = page.extract_text() or "[no extractable text]"
                pages.append(page_header)
                pages.append(f"- {text}")
                continue

            lines: Dict[int, List[Dict[str, Any]]] = defaultdict(list)
            for word in words:
                line_key = normalize_line_key(word["top"])
                lines[line_key].append(word)

            pages.append(page_header)
            for top_key in sorted(lines):
                group = sorted(lines[top_key], key=lambda item: item["x0"])
                text = " ".join(item["text"] for item in group)
                x0 = min(item["x0"] for item in group)
                y0 = min(item["top"] for item in group)
                x1 = max(item["x1"] for item in group)
                y1 = max(item["bottom"] for item in group)
                width = int(round(x1 - x0))
                height = int(round(y1 - y0))
                pages.append(f"- `{int(x0)},{int(y0)},{width},{height}` {text}")

    return "\n".join(pages)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/hello")
async def hello():
    return {"message": "Hello World"}


@app.post("/api/ai/test")
async def test_ai():
    try:
        response = await ai.call_llm("What is 2+2?")
        return {"response": response, "status": "success"}
    except Exception as e:
        return {"error": str(e), "status": "failed"}


@app.post("/api/auth/login")
async def login(login_data: Dict[str, str], database: Session = Depends(get_db)):
    username = login_data.get("username")
    password = login_data.get("password")
    
    if username == "user" and password == "password":
        user = database.query(models.User).filter(models.User.username == username).first()
        if not user:
            user = models.User(username=username, password_hash=password)
            database.add(user)
            database.commit()
        return {"status": "success", "username": username, "token": "dummy-token"}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")


@app.get("/api/documents")
async def list_documents(
    current_user: models.User = Depends(get_current_user),
    database: Session = Depends(get_db)
):
    docs = database.query(models.Document).filter(
        models.Document.user_id == current_user.id
    ).order_by(models.Document.uploaded_at.desc()).all()
    
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "classification": d.classification,
            "confidence": d.confidence,
            "uploaded_at": d.uploaded_at
        }
        for d in docs
    ]


@app.get("/api/documents/{doc_id}")
async def get_document(
    doc_id: int,
    current_user: models.User = Depends(get_current_user),
    database: Session = Depends(get_db)
):
    doc = database.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return {
        "id": doc.id,
        "filename": doc.filename,
        "classification": doc.classification,
        "confidence": doc.confidence,
        "markdown": doc.markdown,
        "extracted_data": doc.extracted_data,
        "uploaded_at": doc.uploaded_at
    }


@app.post("/api/upload")
@app.post("/api/documents")
async def upload_document(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    database: Session = Depends(get_db)
):
    filename = file.filename or "document.pdf"
    extension = os.path.splitext(filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(400, "Only PDF files are allowed.")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File is larger than 10 MB.")

    try:
        markdown = pdf_to_markdown(content)
    except Exception as exc:
        raise HTTPException(500, f"PDF parsing failed: {exc}")

    # AI Classification
    ai_result = await ai.classify_document_ai(markdown)
    classification = ai_result.get("classification", "Other")
    confidence = ai_result.get("confidence", 0.0)
    
    # AI Extraction
    extracted_data = await ai.extract_content_ai(markdown, classification)
    
    # Store in DB
    new_doc = models.Document(
        user_id=current_user.id,
        filename=filename,
        classification=classification,
        confidence=confidence,
        markdown=markdown,
        extracted_data=extracted_data
    )
    database.add(new_doc)
    database.commit()
    database.refresh(new_doc)
    
    # Add to history
    history_entry = models.UploadHistory(
        user_id=current_user.id,
        document_id=new_doc.id,
        action="UPLOAD"
    )
    database.add(history_entry)
    database.commit()

    return {
        "id": new_doc.id,
        "filename": new_doc.filename,
        "classification": new_doc.classification,
        "markdown": new_doc.markdown,
        "confidence": new_doc.confidence,
        "extracted_data": new_doc.extracted_data
    }


@app.delete("/api/documents/{doc_id}")
async def delete_document(
    doc_id: int,
    current_user: models.User = Depends(get_current_user),
    database: Session = Depends(get_db)
):
    doc = database.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    database.delete(doc)
    database.commit()
    
    return {"message": "Document deleted successfully"}


# Mount static files for frontend
if os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
