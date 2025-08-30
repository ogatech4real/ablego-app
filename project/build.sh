#!/bin/bash

# Debug information
echo "=== Build Debug Information ==="
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Directory contents:"
ls -la

# Install dependencies
echo "=== Installing dependencies ==="
npm install --legacy-peer-deps

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found!"
    exit 1
fi

# Build the project
echo "=== Building project ==="
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "=== Build successful ==="
    echo "Dist directory contents:"
    ls -la dist/
else
    echo "ERROR: Build failed!"
    exit 1
fi
