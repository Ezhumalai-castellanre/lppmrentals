#!/bin/bash

# Netlify Deployment Script
# This script helps prepare and deploy your application to Netlify

echo "🚀 Starting Netlify deployment process..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Make sure to set up environment variables in Netlify dashboard."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run type checking
echo "🔍 Running type check..."
npm run check

# Build the application
echo "🏗️  Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push your code to your Git repository"
    echo "2. Connect your repository to Netlify"
    echo "3. Set up environment variables in Netlify dashboard:"
    echo "   - DATABASE_URL"
    echo "   - ENCRYPTION_KEY"
    echo "   - MONDAY_API_TOKEN"
    echo "   - MONDAY_BOARD_ID"
    echo "4. Deploy!"
    echo ""
    echo "🌐 Your site will be available at: https://your-site-name.netlify.app"
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi 