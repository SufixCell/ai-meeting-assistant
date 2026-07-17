@echo off

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
