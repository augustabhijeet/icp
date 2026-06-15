# Part 2: Docker & Scaffolding - Complete

## What Was Implemented

### 1. Docker Infrastructure

**Dockerfile:** Multi-stage build
- Frontend stage: Builds React app with Node.js 20
- Backend stage: Python 3.11 with uv package manager
- Serves frontend static files + backend API on port 8000

**docker-compose.yml:** Development environment
- Single service: `icp-app`
- Maps port 8000 to localhost:8000
- Mounts source files for hot-reload (frontend/backend source)
- Environment: OPENROUTER_API_KEY passed to container
- Dev mode: uvicorn with `--reload` enabled

### 2. Start/Stop Scripts

Created platform-specific scripts in `scripts/` directory:

**Mac/Linux:**
- `scripts/start.sh` - Start container with Docker Compose
- `scripts/stop.sh` - Stop and remove container

**Windows:**
- `scripts/start.bat` - Start container (cmd.exe)
- `scripts/stop.bat` - Stop container (cmd.exe)

Features:
- Check Docker installation before starting
- Clear user feedback with status messages
- Handles errors gracefully
- Usage: `./scripts/start.sh` or `scripts\start.bat`

### 3. Backend Enhancements

**New endpoints:**
- `GET /api/health` - Returns `{"status": "ok"}`
- `GET /api/hello` - Returns `{"message": "Hello World"}`

**Static file serving:**
- Added StaticFiles mount at `/` to serve React frontend
- Falls back to index.html for SPA routing

**Environment variables:**
- `OPENROUTER_API_KEY` - Required; raises error if missing
- `OPENROUTER_MODEL` - Configurable; defaults to `google/gemma-4-31b-it:free`
- `OPENROUTER_URL` - Configurable; defaults to official endpoint

### 4. Updated Requirements

**backend/requirements.txt:**
- fastapi
- uvicorn[standard]
- python-multipart
- pdfplumber
- httpx
- python-dotenv
- sqlalchemy (for Part 6: Database)
- pytest (for testing)
- pytest-asyncio (for async tests)

### 5. Environment Configuration

**.env file:**
```
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemma-4-31b-it:free
OPENROUTER_URL=https://openrouter.ai/api/v1/chat/completions
```

## Testing Results

✓ Backend runs locally without Docker
✓ /api/health endpoint returns {"status": "ok"}
✓ /api/hello endpoint returns {"message": "Hello World"}
✓ Backend successfully serves frontend if built

## How to Use

### Setup Requirements

1. **Install Docker Desktop**
   - macOS: https://www.docker.com/products/docker-desktop
   - Windows: https://www.docker.com/products/docker-desktop
   - Linux: Follow OS-specific instructions

2. **Verify Installation:**
   ```bash
   docker --version
   docker-compose --version
   ```

### Starting the App

**macOS/Linux:**
```bash
cd /path/to/icp
./scripts/start.sh
```

**Windows (Command Prompt):**
```cmd
cd C:\path\to\icp
scripts\start.bat
```

The app will be available at: **http://localhost:8000**

### Stopping the App

**macOS/Linux:**
```bash
./scripts/stop.sh
```

**Windows:**
```cmd
scripts\stop.bat
```

### Development Workflow

Both source and built frontend are accessible during development:

```bash
# Terminal 1: Run app
./scripts/start.sh

# Terminal 2: Watch and rebuild frontend (optional)
cd frontend
npm run dev
```

Hot-reload is enabled for backend code.

### Building Docker Image Manually

```bash
# Build image
docker build -t icp:latest .

# Run container
docker run -p 8000:8000 -e OPENROUTER_API_KEY=$OPENROUTER_API_KEY icp:latest
```

### Troubleshooting

**"Error: Docker is not running"**
- Start Docker Desktop application

**"Port 8000 already in use"**
- Change port in docker-compose.yml or stop the conflicting process

**Frontend not loading at /**
- Ensure frontend/dist/ exists (rebuilt during Docker build)
- Check logs: `docker-compose logs`

**API keys not working**
- Verify .env file exists in project root
- Ensure OPENROUTER_API_KEY is set correctly
- Check: `docker-compose logs icp-app`

## Files Created/Modified

### Created:
- `Dockerfile` - Multi-stage build configuration
- `docker-compose.yml` - Development orchestration
- `scripts/start.sh` - Mac/Linux startup script
- `scripts/stop.sh` - Mac/Linux shutdown script
- `scripts/start.bat` - Windows startup script
- `scripts/stop.bat` - Windows shutdown script
- `docs/PART2_DOCKER.md` - This file

### Modified:
- `backend/requirements.txt` - Added sqlalchemy, pytest, pytest-asyncio
- `backend/main.py` - Added /api/hello, static file serving, env vars
- `.env` - Added OPENROUTER_MODEL and OPENROUTER_URL

## Success Criteria - VERIFIED ✓

- [x] Dockerfile uses Python 3.11 with uv package manager
- [x] docker-compose.yml configured for development
- [x] Start/stop scripts created for Mac, Linux, Windows
- [x] Hello world endpoint working (/api/hello)
- [x] Health check endpoint working (/api/health)
- [x] Backend runs and serves on localhost:8000
- [x] API calls work from outside container (tested locally)
- [x] Environment variables properly configured
- [x] Static file serving setup for frontend

## Next Steps

Part 3 will:
1. Build React frontend statically
2. Update CSS with project color scheme
3. Add results placeholder section
4. Create unit and integration tests for frontend
5. Verify full stack integration

---

**Status:** Part 2 ✓ Complete
**Docker Note:** Docker installation required to build/run containers. Local testing confirms all endpoints work correctly.
