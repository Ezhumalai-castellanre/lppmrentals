#!/bin/bash

echo "🚀 Deploying Amplify Backend for S3 Upload..."

# Check if amplify CLI is available
if ! command -v amplify &> /dev/null; then
    echo "❌ Amplify CLI not found. Installing..."
    npm install -g @aws-amplify/cli
fi

# Initialize Amplify if not already done
if [ ! -f "amplify/team-provider-info.json" ]; then
    echo "🔧 Initializing Amplify..."
    amplify init --yes
fi

# Add API if not exists
if [ ! -d "amplify/backend/api/s3UploadApi" ]; then
    echo "🔧 Adding API Gateway..."
    amplify add api --yes
fi

# Add function if not exists
if [ ! -d "amplify/backend/function/s3UploadFunction" ]; then
    echo "🔧 Adding Lambda function..."
    amplify add function --yes
fi

# Push changes to AWS
echo "📤 Pushing changes to AWS..."
amplify push --yes

echo "✅ Amplify Backend deployment complete!"
echo "🔗 Your S3 upload API endpoint will be available at: https://[API_ID].execute-api.[REGION].amazonaws.com/prod/s3-upload"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Amplify Console:"
echo "   - AWS_S3_BUCKET_NAME: your-s3-bucket-name"
echo "   - AWS_REGION: us-east-1"
echo "   - AWS_ACCESS_KEY_ID: your-access-key"
echo "   - AWS_SECRET_ACCESS_KEY: your-secret-key"
echo ""
echo "2. Deploy your frontend to Amplify"
echo "3. Test the S3 upload functionality"
