@echo off
echo Iniciando backend...
start "Backend" cmd /k "cd /d C:\nueva-carpeta\asistent-sistem\backend && py -3.12 -m uvicorn app.main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Iniciando frontend...
start "Frontend" cmd /k "cd /d C:\nueva-carpeta\asistent-sistem\frontend && npm run dev"

echo.
echo Servidores arrancando...
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
