@echo off
echo ===================================================
echo   HOBBY VAULT - DATABASE SEEDER
echo ===================================================
echo.
cd /d "%~dp0server"
call npm run seed
pause
