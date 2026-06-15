import os
import json
import httpx
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()
# Fallback for when running from within the backend directory
if not os.getenv("OPENROUTER_MODEL"):
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("OPENROUTER_MODEL")
if not MODEL:
    raise RuntimeError("OPENROUTER_MODEL must be set in .env")
OPENROUTER_URL = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1/chat/completions").strip()

def clean_json_response(content: str) -> str:
    """Removes markdown blocks and other noise from LLM JSON response."""
    content = content.strip()
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()
    return content

async def call_llm(prompt: str, system_prompt: str = "You are a helpful assistant.", json_mode: bool = False) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.0,
    }
    
    if json_mode:
        payload["messages"][0]["content"] += " Always respond with valid JSON ONLY. No preamble or explanation."

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(OPENROUTER_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

async def classify_document_ai(markdown: str) -> Dict[str, Any]:
    prompt = (
        "Classify the document below into exactly one of: Resume, Professional summary, Other.\n"
        "Return a JSON object with 'classification' and 'confidence' (0.0 to 1.0).\n\n"
        "Example: {\"classification\": \"Resume\", \"confidence\": 0.95}\n\n"
        "Document:\n" + markdown[:4000]
    )
    
    try:
        content = await call_llm(prompt, system_prompt="You are a document classification assistant.", json_mode=True)
        content = clean_json_response(content)
        result = json.loads(content)
        return {
            "classification": result.get("classification", "Other"),
            "confidence": float(result.get("confidence", 0.5))
        }
    except Exception as e:
        print(f"AI classification failed: {e}")
        return {"classification": "Other", "confidence": 0.0}

async def extract_content_ai(markdown: str, doc_type: str) -> Dict[str, Any]:
    if doc_type == "Resume":
        prompt = (
            "Extract the following fields from the resume markdown as JSON:\n"
            "- full_name\n- email\n- phone_number\n- skills (list)\n- education (list of objects with school, degree, year)\n"
            "- experience (list of objects with company, title, dates, summary)\n\n"
            "Document:\n" + markdown[:4000]
        )
    elif doc_type == "Professional summary":
        prompt = (
            "Extract the following fields from the professional summary markdown as JSON:\n"
            "- full_name\n- current_title\n- key_highlights (list)\n- summary_text\n\n"
            "Document:\n" + markdown[:4000]
        )
    else:
        prompt = (
            "Extract any key-value information from the following document markdown as JSON.\n\n"
            "Document:\n" + markdown[:4000]
        )
        
    try:
        content = await call_llm(prompt, system_prompt="You are a document extraction assistant.", json_mode=True)
        content = clean_json_response(content)
        return json.loads(content)
    except Exception as e:
        print(f"AI extraction failed: {e}")
        return {}
