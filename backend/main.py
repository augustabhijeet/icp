import io
import os
from collections import defaultdict
from typing import Any, Dict, List

import httpx
import pdfplumber
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY must be set in .env")

MODEL = "google/gemini-3.1-flash-lite"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf"}
ALLOWED_CONTENT_TYPES = {"application/pdf"}
OPENROUTER_URL = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1/chat/completions").strip()

app = FastAPI(title="Intelligent Content Processor API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


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


def local_classify_document(markdown: str) -> str:
    text = markdown.lower()
    resume_indicators = [
        "experience",
        "education",
        "skills",
        "work history",
        "certifications",
        "resume",
        "professional experience",
    ]
    summary_indicators = [
        "professional summary",
        "summary",
        "objective",
        "career summary",
        "about me",
    ]

    if any(phrase in text for phrase in resume_indicators):
        return "Resume"
    if any(phrase in text for phrase in summary_indicators):
        return "Professional summary"
    return "Other"


async def classify_document(markdown: str) -> str:
    prompt = (
        "Classify the document below into exactly one of: Resume, Professional summary, Other. "
        "Respond with a single label only.\n\n" + markdown
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "You are a document classification assistant."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.0,
        "max_tokens": 20,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(OPENROUTER_URL, json=payload, headers=headers)
            if response.status_code != 200:
                print(f"OpenRouter call failed: {response.status_code} {response.text}")
                return local_classify_document(markdown)

            data = response.json()
            choice = data.get("choices", [])
            if not choice or not isinstance(choice, list):
                print("OpenRouter returned invalid classification response")
                return local_classify_document(markdown)

            label = choice[0].get("message", {}).get("content", "").strip()
            normalized = label.splitlines()[0].strip()
            if normalized not in {"Resume", "Professional summary", "Other"}:
                return "Other"

            return normalized
    except httpx.RequestError as exc:
        print(f"OpenRouter request failed, falling back to local classification: {exc}")
        return local_classify_document(markdown)
    except ValueError as exc:
        print(f"OpenRouter parsing failed, falling back to local classification: {exc}")
        return local_classify_document(markdown)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
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

    classification = await classify_document(markdown)
    return {
        "filename": filename,
        "classification": classification,
        "markdown": markdown,
    }
