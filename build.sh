#!/bin/bash

# Capture24 Launcher Build Script
# This script builds both the Node.js server binary and the Go launcher

set -e  # Exit on any error

echo "🔨 Building Capture24 Launcher..."
echo "=================================="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v go >/dev/null 2>&1 || { echo "❌ Go is required but not installed. Aborting." >&2; exit 1; }

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install pkg if not already installed
if ! command -v pkg >/dev/null 2>&1; then
    echo "📦 Installing pkg globally..."
    npm install -g pkg
fi

# Build Node.js server binary
echo "🔨 Building Node.js server binary..."
pkg server.js --targets node18-linux-x64 --output capture24-server

# Install Go dependencies
echo "📦 Installing Go dependencies..."
go mod tidy

# Build Go launcher
echo "🔨 Building Go launcher..."
go build -o capture24-launcher main.go

echo ""
echo "✅ Build complete!"
echo "Run './capture24-launcher' to start the application."