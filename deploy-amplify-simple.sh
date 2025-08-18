#!/bin/bash

echo "🚀 Simple Amplify Backend Deployment for S3 Upload..."

# Check if amplify CLI is available
if ! command -v amplify &> /dev/null; then
    echo "❌ Amplify CLI not found. Installing..."
    npm install -g @aws-amplify/cli
fi

# Remove existing amplify directory to start fresh
if [ -d "amplify" ]; then
    echo "🗑️  Removing existing amplify directory..."
    rm -rf amplify
fi

# Initialize Amplify project
echo "🔧 Initializing new Amplify project..."
amplify init --yes

# Add function
echo "🔧 Adding Lambda function..."
amplify add function --yes

# Add API
echo "🔧 Adding API Gateway..."
amplify add api --yes

# Push changes to AWS
echo "📤 Pushing changes to AWS..."
amplify push --yes

echo "✅ Amplify Backend deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Amplify Console:"
echo "   - AWS_S3_BUCKET_NAME: your-s3-bucket-name"
echo "   - AWS_REGION: us-east-1"
echo "   - AWS_ACCESS_KEY_ID: your-access-key"
echo "   - AWS_SECRET_ACCESS_KEY: your-secret-key"
echo ""
echo "2. Copy your S3 upload code to the generated function"
echo "3. Deploy your frontend to Amplify"
echo "4. Test the S3 upload functionality"
