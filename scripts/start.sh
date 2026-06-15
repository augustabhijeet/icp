#!/bin/bash

# Start script for ICP on Mac/Linux

set -e

cd "$(dirname "$0")/.."

echo "Starting Intelligent Content Processor..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Start the container
docker-compose up -d

echo "✓ Container started"
echo "✓ App is available at http://localhost:8000"
echo ""
echo "To stop: ./scripts/stop.sh"
echo "To view logs: docker-compose logs -f"
