# Intelligent Content Processor

This repository hosts an intelligent PDF content processor with:

- PDF upload support (PDF only, max 10 MB)
- Layout-aware markdown extraction from PDF pages
- Document classification into `Resume`, `Professional summary`, or `Other`
- React frontend and Python FastAPI backend
- OpenRouter integration via `OPENROUTER_API_KEY` in `.env`

## Run locally

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open the Vite URL printed in the terminal.

## Notes

- The backend proxies CORS for the frontend during development.
- The `.env` file must contain `OPENROUTER_API_KEY`.
- This implementation uses the OpenRouter model `google/gemma-4-31b-it:free` for classification.
