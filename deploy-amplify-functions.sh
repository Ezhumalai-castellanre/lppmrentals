#!/bin/bash

echo "🚀 Deploying Amplify Functions to AWS..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Install dependencies for each function
echo "📦 Installing dependencies for functions..."

cd amplify/s3-upload-function && npm install && cd ../..
cd amplify/monday-missing-subitems && npm install && cd ../..
cd amplify/webhook-proxy-function && npm install && cd ../..
cd amplify/monday-units-function && npm install && cd ../..
cd amplify/submit-application-function && npm install && cd ../..

echo "✅ Dependencies installed"

# Create deployment packages
echo "📦 Creating deployment packages..."

cd amplify/s3-upload-function && zip -r ../../s3-upload-deploy.zip . && cd ../..
cd amplify/monday-missing-subitems && zip -r ../../monday-missing-deploy.zip . && cd ../..
cd amplify/webhook-proxy-function && zip -r ../../webhook-proxy-deploy.zip . && cd ../..
cd amplify/monday-units-function && zip -r ../../monday-units-deploy.zip . && cd ../..
cd amplify/submit-application-function && zip -r ../../submit-app-deploy.zip . && cd ../..

echo "✅ Deployment packages created"

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)

echo "🔧 AWS Account: $ACCOUNT_ID"
echo "🌍 Region: $REGION"

# Create IAM role for Lambda (if it doesn't exist)
ROLE_NAME="lppmrentals-lambda-role"
echo "🔐 Creating IAM role: $ROLE_NAME"

# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://trust-policy.json || echo "Role already exists"

# Attach basic execution policy
aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create S3 policy
cat > s3-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::supportingdocuments-storage-2025/*"
    }
  ]
}
EOF

# Create and attach S3 policy
aws iam put-role-policy --role-name $ROLE_NAME --policy-name S3Access --policy-document file://s3-policy.json

# Get role ARN
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

echo "🔐 Using IAM role: $ROLE_ARN"

# Deploy functions
echo "🚀 Deploying Lambda functions..."

# S3 Upload Function
echo "📤 Deploying S3 Upload function..."
aws lambda create-function \
  --function-name lppmrentals-s3-upload \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler handler.handler \
  --zip-file fileb://s3-upload-deploy.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables="{AWS_REGION=$REGION,AWS_S3_BUCKET_NAME=supportingdocuments-storage-2025}" \
  || echo "Function already exists, updating..." && aws lambda update-function-code --function-name lppmrentals-s3-upload --zip-file fileb://s3-upload-deploy.zip

# Monday Missing Subitems Function
echo "📤 Deploying Monday Missing Subitems function..."
aws lambda create-function \
  --function-name lppmrentals-monday-missing-subitems \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler handler.handler \
  --zip-file fileb://monday-missing-deploy.zip \
  --timeout 30 \
  --memory-size 256 \
  || echo "Function already exists, updating..." && aws lambda update-function-code --function-name lppmrentals-monday-missing-subitems --zip-file fileb://monday-missing-deploy.zip

# Webhook Proxy Function
echo "📤 Deploying Webhook Proxy function..."
aws lambda create-function \
  --function-name lppmrentals-webhook-proxy \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler handler.handler \
  --zip-file fileb://webhook-proxy-deploy.zip \
  --timeout 30 \
  --memory-size 256 \
  || echo "Function already exists, updating..." && aws lambda update-function-code --function-name lppmrentals-webhook-proxy --zip-file fileb://webhook-proxy-deploy.zip

# Monday Units Function
echo "📤 Deploying Monday Units function..."
aws lambda create-function \
  --function-name lppmrentals-monday-units \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler handler.handler \
  --zip-file fileb://monday-units-deploy.zip \
  --timeout 30 \
  --memory-size 256 \
  || echo "Function already exists, updating..." && aws lambda update-function-code --function-name lppmrentals-monday-units --zip-file fileb://monday-units-deploy.zip

# Submit Application Function
echo "📤 Deploying Submit Application function..."
aws lambda create-function \
  --function-name lppmrentals-submit-application \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler handler.handler \
  --zip-file fileb://submit-app-deploy.zip \
  --timeout 30 \
  --memory-size 256 \
  || echo "Function already exists, updating..." && aws lambda update-function-code --function-name lppmrentals-submit-application --zip-file fileb://submit-app-deploy.zip

echo "✅ Lambda functions deployed!"

# Clean up temporary files
rm -f trust-policy.json s3-policy.json
rm -f *.zip

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create API Gateway endpoints for each function"
echo "2. Update your frontend to use the new API Gateway URLs"
echo "3. Test the functions"
echo ""
echo "🔗 Function names:"
echo "- lppmrentals-s3-upload"
echo "- lppmrentals-monday-missing-subitems"
echo "- lppmrentals-webhook-proxy"
echo "- lppmrentals-monday-units"
echo "- lppmrentals-submit-application"
