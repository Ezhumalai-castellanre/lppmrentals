#!/bin/bash

echo "🚀 Setting up AWS Configuration for LPPM Rentals"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create client .env file
echo "📝 Creating client/.env file..."

cat > client/.env << 'EOF'
# AWS Cognito Configuration for Client-side
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=us-east-1_d07c780Tz
VITE_AWS_USER_POOL_CLIENT_ID=dodlhbfd06i8u5t9kl6lkk6a0
VITE_AWS_IDENTITY_POOL_ID=us-east-1:317775cf-6015-4ce2-9551-57994672861d
VITE_AWS_COGNITO_DOMAIN=your-cognito-domain.auth.us-east-1.amazoncognito.com
VITE_REDIRECT_SIGN_IN=http://localhost:5173/
VITE_REDIRECT_SIGN_OUT=http://localhost:5173/

# DynamoDB Configuration
VITE_AWS_DYNAMODB_TABLE_NAME=DraftSaved

# Monday.com API Configuration
VITE_MONDAY_API_TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUzOTcyMTg4NCwiYWFpIjoxMSwidWlkIjo3ODE3NzU4NCwiaWFkIjoiMjAyNS0wNy0xNlQxMjowMDowOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NTUxNjQ0NSwicmduIjoidXNlMSJ9.s43_kjRmv-QaZ92LYdRlEvrq9CYqxKhh3XXpR-8nhKU
VITE_MONDAY_BOARD_ID=9769934634
VITE_MONDAY_DOCUMENTS_BOARD_ID=9602025981

# S3 Configuration
VITE_AWS_S3_BUCKET_NAME=supportingdocuments-storage-2025
EOF

echo "✅ Created client/.env file"

# Update .gitignore to include .env files
if ! grep -q "\.env" .gitignore; then
    echo "" >> .gitignore
    echo "# Environment files" >> .gitignore
    echo ".env" >> .gitignore
    echo "client/.env" >> .gitignore
    echo "✅ Updated .gitignore to exclude .env files"
else
    echo "✅ .gitignore already configured for .env files"
fi

echo ""
echo "🔧 Next Steps:"
echo "1. Edit client/.env and update the following values:"
echo "   - VITE_AWS_COGNITO_DOMAIN: Your actual Cognito domain"
echo "   - VITE_MONDAY_API_TOKEN: Your actual Monday.com API token (if different)"
echo ""
echo "2. Restart your development server:"
echo "   npm run dev"
echo ""
echo "3. Check the browser console for AWS configuration logs"
echo ""
echo "✅ Setup complete! Your app should now work with AWS Cognito and DynamoDB."
