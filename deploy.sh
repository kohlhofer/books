#!/bin/bash

echo "🚀 Building Book Shelf Website..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the website
echo "🔨 Building website..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build successful!"
    echo "📁 Generated files in dist/ directory:"
    ls -la dist/
    
    echo ""
    echo "🌐 To preview locally, run:"
    echo "   npm run dev"
    echo "   Then open http://localhost:8000"
    
    echo ""
    echo "📊 Total books processed:"
    echo "   - Library: $(($(wc -l < books/library.csv) - 1))"
    echo "   - Kindle: $(($(wc -l < books/kindle.csv) - 1))"
    echo "   - Audible: $(($(wc -l < books/audible.csv) - 1))"
    echo "   - Images: $(($(wc -l < books/image1.csv) + $(wc -l < books/image2.csv) + $(wc -l < books/image3.csv) + $(wc -l < books/image4.csv) + $(wc -l < books/image5.csv) + $(wc -l < books/image6.csv) + $(wc -l < books/image7.csv) + $(wc -l < books/image8.csv) + $(wc -l < books/image9.csv) + $(wc -l < books/image10.csv) + $(wc -l < books/image11.csv) + $(wc -l < books/image12.csv) - 12))"
    
else
    echo "❌ Build failed!"
    exit 1
fi 