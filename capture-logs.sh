#!/bin/bash

# Cedar Log Capture Script
# This script captures all logs from the Tauri application

echo "🚀 Starting Cedar Log Capture..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Get current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Function to capture logs
capture_logs() {
    echo "📝 Capturing logs to logs/cedar_${TIMESTAMP}.log"
    
    # Start the application and capture all output
    cargo tauri dev 2>&1 | tee "logs/cedar_${TIMESTAMP}.log"
}

# Function to capture only errors
capture_errors() {
    echo "❌ Capturing errors to logs/cedar_errors_${TIMESTAMP}.log"
    
    # Start the application and capture only errors
    cargo tauri dev 2>&1 | grep -E "(error|Error|ERROR|failed|Failed|FAILED)" | tee "logs/cedar_errors_${TIMESTAMP}.log"
}

# Function to capture browser console logs
capture_browser_logs() {
    echo "🌐 Capturing browser console logs..."
    
    # This will be handled by the frontend logging system
    echo "Browser logs will be saved to the project directory automatically"
}

# Function to show log files
show_logs() {
    echo "📁 Available log files:"
    ls -la logs/
    echo ""
    echo "📖 Recent log entries:"
    if [ -f "logs/cedar_${TIMESTAMP}.log" ]; then
        tail -50 "logs/cedar_${TIMESTAMP}.log"
    else
        echo "No log file found for current session"
    fi
}

# Main menu
echo "🔧 Cedar Log Capture Tool"
echo "=========================="
echo "1. Capture all logs"
echo "2. Capture only errors"
echo "3. Show available logs"
echo "4. Exit"
echo ""

read -p "Choose an option (1-4): " choice

case $choice in
    1)
        capture_logs
        ;;
    2)
        capture_errors
        ;;
    3)
        show_logs
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option. Running full log capture..."
        capture_logs
        ;;
esac 