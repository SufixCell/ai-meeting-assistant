@echo off
cd /d "%~dp0"

echo Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8081 "') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8082 "') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 "') do taskkill /F /PID %%a 2>nul

echo Installing Backend Dependencies...
cd /d "%~dp0backend"
call npm install
cd /d "%~dp0"

echo Installing Frontend Dependencies...
call npm install

echo Starting AI Meeting Assistant Backend...
start "AI Meeting Assistant Backend" cmd /k "cd /d ""%~dp0backend"" && node server.js"

echo Starting AI Meeting Assistant Frontend...
call npx expo start --web -p 8082 -c
pause
