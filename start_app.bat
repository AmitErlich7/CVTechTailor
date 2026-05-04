@echo off
echo Starting Resume Tailor...

start "Backend" cmd /k "cd /d %~dp0backend && uvicorn main:app --reload --host 127.0.0.1 --port 8000"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul
start http://localhost:5173
