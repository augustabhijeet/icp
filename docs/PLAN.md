# ICP Project Execution Plan

## Requirements Summary

- Single PDF upload at a time; upload history visible to user
- Classification + confidence level on success, errors shown to user
- Results placeholder section below upload
- Docker containerized with FastAPI backend + React frontend
- SQLite database for persistence
- OpenRouter AI integration (google/gemma-4-31b-it:free model)
- Start/stop scripts for Mac, PC, Linux

---

## Part 1: Plan & Documentation

**Objective:** Establish detailed execution plan with clear substeps, tests, and success criteria. Document existing codebase.

**Substeps:**
- [x] Enrich PLAN.md with detailed substeps, tests, and success criteria (this document)
- [x] Create frontend/AGENTS.md documenting existing frontend code structure
- [ ] User reviews and approves plan

**Tests & Success Criteria:**
- Plan document includes detailed substeps for all 10 parts
- Each part has clear test cases and success criteria
- frontend/AGENTS.md accurately describes existing code
- User approval obtained

---

## Part 2: Docker & Scaffolding

**Objective:** Set up Docker infrastructure, FastAPI backend scaffold, start/stop scripts with hello world validation.

**Substeps:**
- [x] Create Dockerfile for containerization (Python 3.11+ with uv package manager)
- [x] Create docker-compose.yml for orchestration
- [x] Update backend/requirements.txt with necessary packages (FastAPI, uvicorn, python-multipart, pdfplumber, httpx, python-dotenv, sqlite3)
- [x] Create scripts/start.sh, scripts/stop.sh, scripts/start.bat, scripts/start.sh (Mac, Linux, Windows variants)
- [x] Add hello world endpoint to backend (/api/hello returning {"message": "Hello World"})
- [ ] Build and test Docker image locally
- [ ] Verify backend runs and serves on localhost:8000
- [ ] Test hello world API call from outside container

**Tests & Success Criteria:**
- Docker image builds without errors
- Container starts successfully
- /api/health returns {"status": "ok"}
- /api/hello returns {"message": "Hello World"}
- Can access backend from host machine at localhost:8000
- Start/stop scripts work on respective OS platforms

---

## Part 3: Static Frontend Serving

**Objective:** Build and serve React frontend statically; display upload dashboard with results placeholder.

**Substeps:**
- [x] Update frontend package.json to include testing deps (vitest, @testing-library/react)
- [x] Add placeholder section to App.tsx for results display (below upload panel, initially hidden)
- [x] Update frontend/src/index.css with styling for results placeholder
- [x] Build frontend: `npm run build` generates dist/
- [x] Update Dockerfile to serve frontend static files at / (use nginx or FastAPI static files)
- [x] Update backend main.py to serve frontend static files at /
- [x] Add CORS middleware to backend (already present)
- [x] Write frontend unit tests for App.tsx component
- [ ] Write integration test: upload form renders, submit button works
- [ ] Test full app at localhost:8000/

**Tests & Success Criteria:**
- Frontend builds without errors to dist/
- App loads at localhost:8000/ showing full dashboard
- Upload panel displays with file input and upload button
- Results placeholder section visible below upload panel
- 80%+ code coverage in frontend unit tests
- Integration test passes: form renders and upload attempt works
- No console errors in browser

---

## Part 4: Authentication (Dummy Credentials)

**Objective:** Add login screen with dummy credentials ("user", "password"); protect dashboard; add logout.

**Substeps:**
- [x] Create frontend/src/components/LoginForm.tsx with username/password inputs
- [x] Update App.tsx to check auth state; redirect to login if not authenticated
- [x] Add auth context/hook for managing login state
- [x] Implement login handler with dummy credential validation
- [x] Add logout button in header (visible only when authenticated)
- [x] Style login form per color scheme (purple buttons)
- [x] Update main.tsx to wrap App in auth provider if needed
- [x] Write unit tests for LoginForm component
- [ ] Write integration test: login with wrong credentials fails, correct credentials succeed
- [ ] Write integration test: logout clears auth and redirects to login

**Tests & Success Criteria:**
- Login page displays at / when not authenticated
- Wrong credentials show error message
- Correct credentials ("user", "password") allow access to dashboard
- Dashboard only visible when authenticated
- Logout button present in header when authenticated
- Logout clears auth and redirects to login
- All login/logout flows tested and passing
- LocalStorage or context used for session management

---

## Part 5: Database Schema Design

**Objective:** Design and document SQLite schema; get user sign-off.

**Substeps:**
- [x] Design schema with tables: users, documents, upload_history
  - users: id, username (unique), password_hash, created_at
  - documents: id, user_id (FK), filename, classification, confidence, extracted_data (JSON), markdown, uploaded_at
  - upload_history: id, user_id (FK), document_id (FK), action, timestamp
- [x] Document schema as JSON in docs/DATABASE_SCHEMA.json
- [x] Create docs/DATABASE.md explaining schema design, relationships, indexing strategy
- [ ] Get user approval on schema design

**Tests & Success Criteria:**
- Schema supports single uploads per session with full history
- All relationships defined (user_id FKs)
- Confidence level stored for each classification
- Extracted data stored as JSON field
- User approves schema design
- DATABASE.md explains all design decisions

---

## Part 6: Backend API & Database Integration

**Objective:** Add API routes for document CRUD, dashboard state per user; auto-create DB; add backend tests.

**Substeps:**
- [ ] Create database initialization function (creates tables if not exist on startup)
- [ ] Update backend/requirements.txt to add sqlalchemy (optional: for ORM)
- [ ] Add database module: backend/db.py with connection logic
- [ ] Create backend/models.py with User, Document, UploadHistory models
- [ ] Add routes:
  - POST /api/auth/login - authenticate user, return session token
  - POST /api/auth/logout - clear session
  - GET /api/documents - list documents for authenticated user (with pagination)
  - GET /api/documents/{id} - get single document details
  - POST /api/documents - upload new document (store in DB)
  - DELETE /api/documents/{id} - delete document
- [ ] Update POST /api/upload to store results in DB with classification + confidence
- [ ] Add session/token management middleware
- [ ] Create backend unit tests using pytest
  - Test upload stores to DB
  - Test GET /api/documents returns user's docs only
  - Test auth routes
  - Test DB creation on first run
- [ ] Test all routes with different users (isolation)

**Tests & Success Criteria:**
- Database auto-creates on first run
- All CRUD routes functional and tested
- Each user only sees their own documents
- Classification and confidence stored and retrievable
- 80%+ code coverage in backend unit tests
- Pagination works on document list endpoint
- pytest test suite runs completely

---

## Part 7: Frontend-Backend Integration

**Objective:** Connect frontend to backend APIs; persist uploads, auth, history; comprehensive tests.

**Substeps:**
- [ ] Update App.tsx to call backend APIs instead of mocking
- [ ] Create frontend/src/api/client.ts for API communication
- [ ] Implement auth flow: LoginForm calls POST /api/auth/login
- [ ] Store session token in localStorage/context
- [ ] Add Authorization header to all API calls
- [ ] Update upload handler to POST /api/documents with file
- [ ] Fetch and display upload history from GET /api/documents
- [ ] Add delete functionality for historical uploads
- [ ] Handle API errors gracefully (show to user)
- [ ] Create integration tests:
  - Login → Upload → Verify in history → Delete
  - History persists across sessions
  - Logout clears session and redirects
- [ ] Add e2e tests (if using playwright/cypress)
- [ ] Test against live backend

**Tests & Success Criteria:**
- Frontend successfully calls all backend endpoints
- Auth tokens passed correctly to all requests
- Upload saved to DB and appears in history
- History persists after logout/login
- User only sees their own documents
- Delete removes document from history
- Integration tests pass end-to-end
- All API errors handled and shown to user

---

## Part 8: AI Connectivity & Confidence

**Objective:** Implement OpenRouter API integration; test with simple "2+2" math; ensure confidence levels returned.

**Substeps:**
- [ ] Verify .env has OPENROUTER_API_KEY and MODEL = "google/gemma-4-31b-it:free"
- [ ] Create backend/ai.py module for OpenRouter integration
- [ ] Implement simple test endpoint POST /api/ai/test with prompt "What is 2+2?"
- [ ] Create function to extract confidence level from AI response (if provided in response)
- [ ] Modify classification endpoint to return confidence level in response
- [ ] Add fallback local classification if AI fails (keep existing local logic)
- [ ] Test AI connectivity:
  - POST /api/ai/test returns correct math answer
  - Classification returns confidence in 0-100 range
  - Fallback works if API fails
- [ ] Create backend test for AI integration (mock OpenRouter if needed)
- [ ] Monitor API costs (google/gemma-4-31b-it:free is free tier)

**Tests & Success Criteria:**
- /api/ai/test returns correct answer with confidence
- Classification endpoint returns {"classification": "...", "confidence": 0-100}
- AI calls are logged
- Fallback to local classification on API failure
- All AI integration tests pass
- No sensitive keys exposed in logs

---

## Part 9: Document Classification & Content Extraction

**Objective:** Use AI to classify documents and extract structured content as JSON; return confidence levels.

**Substeps:**
- [ ] Create extraction prompt template in backend/ai.py for content extraction
  - Request JSON output with key-value pairs of important fields
  - Tailor prompts for Resume vs Professional Summary vs Other
- [ ] Update POST /api/documents endpoint to:
  - Call AI for classification with confidence
  - Call AI for content extraction with confidence
  - Store extracted_data JSON in DB
- [ ] Implement extraction for each doc type:
  - Resume: name, email, phone, experience, education, skills, etc.
  - Professional Summary: title, summary, key highlights, etc.
  - Other: general key-value extraction
- [ ] Add confidence thresholds (e.g., if < 50% confidence, mark as uncertain)
- [ ] Create backend tests:
  - Test classification with sample resumes
  - Test extraction produces valid JSON
  - Test confidence scores are reasonable
- [ ] Test end-to-end: upload PDF → classify → extract → store

**Tests & Success Criteria:**
- Classification returns confidence 0-100
- Content extraction produces valid JSON stored in DB
- Extracted data includes key fields for each doc type
- Confidence levels included in all AI responses
- Sample PDF tests pass with expected classifications/extractions
- No extraction fails; errors gracefully handled
- All data stored and retrievable

---

## Part 10: Results Display

**Objective:** Display classification, confidence, and extracted content in frontend dashboard below upload section.

**Substeps:**
- [ ] Create frontend/src/components/ResultsPanel.tsx to display:
  - Classification label
  - Confidence percentage (visual indicator, e.g., progress bar)
  - Extracted data in tabular or structured format
  - Error message if extraction failed
- [ ] Update App.tsx to show results after successful upload
  - Display confidence as percentage with color coding (green: >80%, yellow: 50-80%, red: <50%)
  - Show extracted JSON in collapsible/expandable format
  - Show markdown preview if applicable
- [ ] Add styling per color scheme
- [ ] Create frontend tests for ResultsPanel component
- [ ] Add integration test: Upload → View results → Verify confidence and data
- [ ] Test results update on new uploads
- [ ] Test error display if extraction fails

**Tests & Success Criteria:**
- ResultsPanel displays classification + confidence visually
- Extracted data visible and readable
- Confidence color-coded (>80% green, 50-80% yellow, <50% red)
- Results update when new upload completes
- Error messages display if AI extraction fails
- All results properly fetched from backend API
- Tests cover success and error cases
- No console errors or warnings

---

## Deployment Checklist

- [ ] Docker image builds and runs locally
- [ ] All 10 parts completed and tested
- [ ] 80%+ code coverage in backend and frontend
- [ ] No console errors in browser or backend logs
- [ ] Database persists across container restarts
- [ ] OpenRouter API key configured
- [ ] Environment variables in .env
- [ ] README.md updated with setup and usage instructions
- [ ] Start/stop scripts tested on target OS platforms
- [ ] Performance acceptable (uploads < 30s, API responses < 5s)

---

## Success Metrics

- [ ] App runs in Docker container
- [ ] Full auth flow works
- [ ] Document uploads persist in database
- [ ] Upload history visible to authenticated user
- [ ] AI classification + confidence returned for each upload
- [ ] Extracted content displayed in frontend
- [ ] User can delete historical uploads
- [ ] All tests passing
- [ ] No security vulnerabilities (no hardcoded secrets, proper auth)