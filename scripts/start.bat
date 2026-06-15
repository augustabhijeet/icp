@echo off
REM Start script for ICP on Windows

setlocal enabledelayedexpansion

cd /d "%~dp0\.."

echo Starting Intelligent Content Processor...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running. Please start Docker Desktop.
    exit /b 1
)

REM Start the container
docker-compose up -d

echo.
echo OK - Container started
echo OK - App is available at http://localhost:8000
echo.
echo To stop: scripts\stop.bat
echo To view logs: docker-compose logs -f
