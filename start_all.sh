#!/bin/bash

# Stop on errors
set -e

# Load environment variables from server/.env
if [ -f "server/.env" ]; then
    export $(cat server/.env | grep -v '^#' | xargs)
else
    echo "⚠️  server/.env file not found!"
    echo "   Please copy your .env file to the server/ directory"
    echo "   Run: cp .env server/.env"
    exit 1
fi

# Check if Supabase URL is configured
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set in server/.env file"
    echo "   Please configure your Supabase connection string"
    exit 1
fi

# Run Setup
echo "📦 Running database setup (Supabase PostgreSQL)..."
cd server
node setup_postgres.js
if [ $? -ne 0 ]; then
    echo "❌ Database setup failed. Please check your Supabase credentials."
    exit 1
fi
cd ..

# Start Backend (background)
echo "🚀 Starting Backend Server..."
(cd server && npm run dev:server) &
BACKEND_PID=$!

# Start Frontend (background)
echo "🎨 Starting Frontend Client..."
(cd client && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "✅ All services started!"
echo "   Backend: http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services."

# Trap EXIT to kill background processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" EXIT INT TERM

# Wait for processes
wait
