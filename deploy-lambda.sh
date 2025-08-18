#!/bin/bash

# Deploy Lambda functions to AWS
echo "🚀 Deploying Lambda functions to AWS..."

# Set your AWS region and bucket name
AWS_REGION="us-east-1"
S3_BUCKET="supportingdocuments-storage-2025"
AWS_ACCOUNT_ID="818263291471"

# Create deployment packages
echo "📦 Creating deployment packages..."

# S3 Upload function
cd amplify/backend/function/s3-upload
npm install --production
zip -r ../../../s3-upload.zip .
cd ../../../

# Webhook Proxy function
cd amplify/backend/function/webhook-proxy
npm install --production
zip -r ../../../webhook-proxy.zip .
cd ../../../

# Deploy S3 Upload function
echo "📤 Deploying S3 Upload function..."
aws lambda create-function \
  --function-name s3-upload \
  --runtime nodejs18.x \
  --role arn:aws:iam::${AWS_ACCOUNT_ID}:role/service-role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://s3-upload.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables="{AWS_REGION=$AWS_REGION,AWS_S3_BUCKET_NAME=$S3_BUCKET}" \
  --region $AWS_REGION

# Deploy Webhook Proxy function
echo "📤 Deploying Webhook Proxy function..."
aws lambda create-function \
  --function-name webhook-proxy \
  --runtime nodejs18.x \
  --role arn:aws:iam::${AWS_ACCOUNT_ID}:role/service-role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://webhook-proxy.zip \
  --timeout 60 \
  --memory-size 256 \
  --region $AWS_REGION

# Create API Gateway
echo "🌐 Creating API Gateway..."
aws apigateway create-rest-api \
  --name "lppmrentals-api" \
  --description "API for LPPM Rentals application" \
  --region $AWS_REGION

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "1. Update the API Gateway URLs in webhook-service.ts"
echo "2. Configure CORS and permissions"
echo "3. Test the endpoints"
