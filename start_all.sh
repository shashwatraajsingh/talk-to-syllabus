#!/bin/bash

# Check if MySQL is running
if ! pgrep -x "mysqld" > /dev/null; then
    echo "⚠️  MySQL does not seem to be connected or running."
    echo "   Ensure MySQL server is up: sudo systemctl start mysql"
    echo "   Continuing anyway..."
fi

# Run Setup
echo "📦 Running database setup (MySQL)..."
node setup_mysql.js
if [ $? -ne 0 ]; then
    echo "❌ Database setup failed. Please check your .env credentials."
    exit 1
fi

# Start Backend (background)
echo "🚀 Starting Backend Server..."
npm run dev:server &
BACKEND_PID=$!

# Start Frontend (foreground)
echo "🎨 Starting Frontend Client..."
npm run dev:client

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
