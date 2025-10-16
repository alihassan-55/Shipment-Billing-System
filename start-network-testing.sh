#!/bin/bash

echo "Starting Courier Billing System for Network Testing..."
echo

# Get local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "Your local IP address: $LOCAL_IP"
echo
echo "Frontend will be available at: http://$LOCAL_IP:3000"
echo "Backend API will be available at: http://$LOCAL_IP:3001"
echo
echo "Starting services..."

# Start database services
echo "Starting database services..."
docker-compose up -d

# Wait for services to start
sleep 3

# Start backend server
echo "Starting backend server..."
cd server && npm run dev:network &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend server
echo "Starting frontend server..."
cd ../client && VITE_API_TARGET=http://$LOCAL_IP:3001 npm run dev:network &
FRONTEND_PID=$!

echo
echo "============================================"
echo "Network Testing Setup Complete!"
echo "============================================"
echo "Frontend: http://$LOCAL_IP:3000"
echo "Backend:  http://$LOCAL_IP:3001"
echo "============================================"
echo
echo "Press Ctrl+C to stop all services..."

# Function to cleanup on exit
cleanup() {
    echo
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    docker-compose down
    echo "All services stopped."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
