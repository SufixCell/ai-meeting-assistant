@echo off

echo Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8081 "') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 "') do taskkill /F /PID %%a 2>nul

echo Installing Backend Dependencies...
cd backend
call npm install
cd ..

echo Installing Frontend Dependencies...
call npm install

echo Starting AI Meeting Assistant Backend...
start cmd /k "cd backend && node server.js"

echo Starting AI Meeting Assistant Frontend...
call npm run web
pause
