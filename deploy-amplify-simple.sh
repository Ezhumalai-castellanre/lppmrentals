#!/bin/bash

echo "🚀 Simple Amplify Backend Deployment for S3 Upload..."

# Check if amplify CLI is available
if ! command -v amplify &> /dev/null; then
    echo "❌ Amplify CLI not found. Installing..."
    npm install -g @aws-amplify/cli
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from your project root."
    exit 1
fi

# Remove existing amplify directory to start fresh
if [ -d "amplify" ]; then
    echo "🗑️  Removing existing amplify directory..."
    rm -rf amplify
fi

# Initialize Amplify project
echo "🔧 Initializing new Amplify project..."
echo "Please answer the following questions:"
echo "- Project name: lppmrentals (or press Enter for default)"
echo "- Environment: prod (or press Enter for default)"
echo "- Default editor: code (or press Enter for default)"
echo "- Type of app: javascript"
echo "- JavaScript framework: react"
echo "- Source Directory Path: client/src"
echo "- Distribution Directory Path: dist/public"
echo "- Build Command: npm run build"
echo "- Start Command: npm run dev"

amplify init

# Add function
echo "🔧 Adding Lambda function..."
echo "Please answer the following questions:"
echo "- Function name: s3UploadFunction"
echo "- Runtime: Node.js 18.x"
echo "- Template: Hello World"
echo "- Advanced settings: No (or customize as needed)"

amplify add function

# Add API
echo "🔧 Adding API Gateway..."
echo "Please answer the following questions:"
echo "- API name: s3UploadApi"
echo "- Type: REST"
echo "- Path: /s3-upload"
echo "- Lambda function: s3UploadFunction"
echo "- Authorization: N (for now)"

amplify add api

# Push changes to AWS
echo "📤 Pushing changes to AWS..."
amplify push

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
echo ""
echo "🔗 Your API endpoint will be available at: https://[API_ID].execute-api.[REGION].amazonaws.com/prod/s3-upload"
