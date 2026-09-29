@echo off
echo ===================================================
echo   LAUNCHING HOBBY VAULT SERVERS
echo ===================================================
echo.

cd /d "%~dp0"

start "HobbyVault Backend (Port 5000)" cmd /k "cd /d %~dp0server && npm run dev"
start "HobbyVault Frontend (Port 5173)" cmd /k "cd /d %~dp0client && npm run dev"

echo Backend and Frontend have started!
echo Frontend URL: http://localhost:5173
echo.
pause
