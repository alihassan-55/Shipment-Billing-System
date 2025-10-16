@echo off
echo Starting Courier Billing System for Network Testing...
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found_ip
    )
)
:found_ip

echo Your local IP address: %LOCAL_IP%
echo.
echo Frontend will be available at: http://%LOCAL_IP%:3000
echo Backend API will be available at: http://%LOCAL_IP%:3001
echo.
echo Starting services...

REM Start database services
echo Starting database services...
docker-compose up -d

REM Wait a moment for services to start
timeout /t 3 /nobreak > nul

REM Start backend server
echo Starting backend server...
start "Backend Server" cmd /k "cd server && npm run dev:network"

REM Wait a moment for backend to start
timeout /t 5 /nobreak > nul

REM Start frontend server
echo Starting frontend server...
start "Frontend Server" cmd /k "cd client && set VITE_API_TARGET=http://%LOCAL_IP%:3001 && npm run dev:network"

echo.
echo ============================================
echo Network Testing Setup Complete!
echo ============================================
echo Frontend: http://%LOCAL_IP%:3000
echo Backend:  http://%LOCAL_IP%:3001
echo ============================================
echo.
echo Press any key to stop all services...
pause > nul

echo Stopping services...
taskkill /f /im node.exe > nul 2>&1
docker-compose down
echo All services stopped.
