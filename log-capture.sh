#!/bin/bash

# Simple Cedar Log Capture
# Usage: ./log-capture.sh

echo "🚀 Starting Cedar with log capture..."

# Create logs directory
mkdir -p logs

# Get timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/cedar_${TIMESTAMP}.log"

echo "📝 Logs will be saved to: $LOG_FILE"
echo "🔄 Starting application... (Press Ctrl+C to stop)"

# Run the application and capture all output
cargo tauri dev 2>&1 | tee "$LOG_FILE" 