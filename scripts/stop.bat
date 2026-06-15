@echo off
REM Stop script for ICP on Windows

setlocal enabledelayedexpansion

cd /d "%~dp0\.."

echo Stopping Intelligent Content Processor...

docker-compose down

echo OK - Container stopped
