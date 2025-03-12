#!/bin/bash

# Exit on error
set -e

echo "🚀 Building Quick Edits project..."

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required tools
if ! command_exists go; then
  echo "❌ Go is not installed. Please install Go to build the native messaging script."
  exit 1
fi

if ! command_exists npm; then
  echo "❌ npm is not installed. Please install Node.js and npm to build the Chrome extension."
  exit 1
fi

if ! command_exists zip; then
  echo "❌ zip is not installed. Please install zip to create the extension package."
  exit 1
fi

# Build native messaging script
echo "🔨 Building native messaging script..."
cd native-search
go build -o native-search main.go
echo "✅ Native messaging script built successfully!"

# Build Chrome extension
echo "🔨 Building Chrome extension..."
cd ../browser-extension

# Remove console logs
echo "🧹 Removing console logs..."
chmod +x scripts/remove-logs.js
node scripts/remove-logs.js

# Build extension
echo "🏗️ Building extension..."
npm run build

# Create zip file
echo "📦 Creating zip file..."
cd dist
zip -r ../dist.zip *
cd ..

echo "✅ Chrome extension built successfully!"
echo "📁 Extension zip file created at: browser-extension/dist.zip"

# Return to root directory
cd ..

echo "🎉 Build completed successfully!"
echo "📋 Next steps:"
echo "1. Install the native messaging script: ./native-search/native-search setup"
echo "2. Load the Chrome extension from browser-extension/dist or install from browser-extension/dist.zip"  