#!/bin/bash

echo "🚀 Deploying updated webhook proxy function with ID field fix..."

# Navigate to the webhook proxy function directory
cd amplify/backend/function/webhook-proxy

# Check if the function exists
echo "📋 Checking if webhook-proxy function exists..."
aws lambda get-function --function-name webhook-proxy 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Function exists, updating..."
    
    # Create deployment package
    echo "📦 Creating deployment package..."
    zip -r webhook-proxy-update.zip src/ package.json package-lock.json
    
    # Update the function code
    echo "🔄 Updating function code..."
    aws lambda update-function-code \
        --function-name webhook-proxy \
        --zip-file fileb://webhook-proxy-update.zip
    
    if [ $? -eq 0 ]; then
        echo "✅ Webhook proxy function updated successfully!"
        echo "🔍 The ID field should now be included in webhook payloads"
    else
        echo "❌ Failed to update webhook proxy function"
        exit 1
    fi
    
    # Clean up
    rm webhook-proxy-update.zip
    
else
    echo "❌ webhook-proxy function not found. Please check the function name or create it first."
    exit 1
fi

echo "🎉 Deployment complete! Test the missing documents upload to verify the ID field is now included."
