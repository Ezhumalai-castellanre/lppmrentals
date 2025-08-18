#!/bin/bash

echo "🚨 Emergency Amplify Fix - This will resolve the current build error"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from your project root."
    exit 1
fi

echo "🔧 The issue is that Amplify configuration files are manually created and invalid."
echo "🔧 The best solution is to start fresh with proper initialization."
echo ""

# Ask user what they want to do
echo "Choose an option:"
echo "1. Quick fix (try to repair current config)"
echo "2. Clean slate (recommended - remove everything and start fresh)"
echo "3. Exit"
echo ""
read -p "Enter your choice (1, 2, or 3): " choice

case $choice in
    1)
        echo "🔧 Attempting quick fix..."
        echo "⚠️  This may not work completely due to configuration issues."
        
        # Try to fix the current config
        if [ -f "amplify/backend/team-provider-info.json" ]; then
            echo "📝 Updating team-provider-info.json..."
            # Create a minimal working config
            cat > amplify/backend/team-provider-info.json << 'EOF'
{
  "prod": {
    "awscloudformation": {
      "AuthRoleName": "amplify-lppmrentals-prod-123456-authRole",
      "UnauthRoleName": "amplify-lppmrentals-prod-123456-unauthRole",
      "StackName": "amplify-lppmrentals-prod-123456",
      "StackId": "arn:aws:cloudformation:us-east-1:123456789012:stack/amplify-lppmrentals-prod-123456/12345678-1234-1234-1234-123456789012"
    }
  }
}
EOF
        fi
        
        echo "✅ Quick fix attempted. Try deploying again."
        echo "⚠️  If it still fails, use option 2 (clean slate)."
        ;;
    2)
        echo "🗑️  Removing existing amplify directory..."
        rm -rf amplify
        
        echo "🔧 Initializing fresh Amplify project..."
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
        echo ""
        
        amplify init
        
        echo "🔧 Adding Lambda function..."
        echo "Please answer the following questions:"
        echo "- Function name: s3UploadFunction"
        echo "- Runtime: Node.js 18.x"
        echo "- Template: Hello World"
        echo "- Advanced settings: No (or customize as needed)"
        echo ""
        
        amplify add function
        
        echo "🔧 Adding API Gateway..."
        echo "Please answer the following questions:"
        echo "- API name: s3UploadApi"
        echo "- Type: REST"
        echo "- Path: /s3-upload"
        echo "- Lambda function: s3UploadFunction"
        echo "- Authorization: N (for now)"
        echo ""
        
        amplify add api
        
        echo "📤 Pushing changes to AWS..."
        amplify push
        
        echo "✅ Fresh Amplify project created and deployed!"
        echo "🔗 Your API endpoint will be available at: https://[API_ID].execute-api.[REGION].amazonaws.com/prod/s3-upload"
        ;;
    3)
        echo "👋 Exiting without changes."
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1, 2, or 3."
        exit 1
        ;;
esac

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
