@echo off
echo ===================================================
echo   HOBBY VAULT - SETUP AND LAUNCHER
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Installing Server Dependencies...
cd server
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing server packages.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Installing Client Dependencies...
cd ..\client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing client packages.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Starting Backend and Frontend Servers...
cd ..

start "HobbyVault Backend (Port 5000)" cmd /k "cd /d %~dp0server && npm run dev"
start "HobbyVault Frontend (Port 5173)" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ===================================================
echo   Servers are launching!
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:5173
echo ===================================================
echo.
echo You can now open http://localhost:5173 in your browser.
pause
