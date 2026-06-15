#!/bin/bash

# Stop script for ICP on Mac/Linux

set -e

cd "$(dirname "$0")/.."

echo "Stopping Intelligent Content Processor..."

docker-compose down

echo "✓ Container stopped"
