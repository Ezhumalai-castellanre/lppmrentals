#!/bin/bash

echo "🚀 Deploying S3 Presign Function to AWS..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS account ID and region
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

# Create S3 policy for presign function
cat > s3-presign-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::supportingdocuments-storage-2025/*"
    }
  ]
}
EOF

# Create and attach S3 policy
aws iam put-role-policy --role-name $ROLE_NAME --policy-name S3PresignAccess --policy-document file://s3-presign-policy.json

# Get role ARN
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

echo "🔐 Using IAM role: $ROLE_ARN"

# Deploy S3 Presign Function
echo "📤 Deploying S3 Presign function..."
aws lambda create-function \
  --function-name lppmrentals-s3-presign \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler index.handler \
  --zip-file fileb://s3-presign-update.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables="{AWS_REGION=$REGION,AWS_S3_BUCKET_NAME=supportingdocuments-storage-2025}" \
  || echo "Function already exists, updating..." && aws lambda update-function-code --function-name lppmrentals-s3-presign --zip-file fileb://s3-presign-update.zip

echo "✅ S3 Presign function deployed!"

# Clean up temporary files
rm -f trust-policy.json s3-presign-policy.json

echo ""
echo "🎉 S3 Presign function deployment complete!"
echo ""
echo "📋 Function details:"
echo "- Name: lppmrentals-s3-presign"
echo "- Handler: index.handler"
echo "- Runtime: nodejs18.x"
echo "- Timeout: 30 seconds"
echo "- Memory: 256 MB"
echo ""
echo "🔗 Next steps:"
echo "1. Create API Gateway endpoint for this function"
echo "2. Update your frontend to use the new endpoint"
echo "3. Test the presigned URL generation"
