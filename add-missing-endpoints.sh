#!/bin/bash

echo "🚀 Adding missing API Gateway endpoints for Monday.com functions..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

API_ID="9yo8506w4h"
REGION="us-east-1"

echo "🔧 API Gateway ID: $API_ID"
echo "🌍 Region: $REGION"

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[?path==`/`].id' --output text)

echo "🔍 Root resource ID: $ROOT_ID"

# Create /monday-missing-subitems resource
echo "📁 Creating /monday-missing-subitems resource..."
MISSING_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part "monday-missing-subitems" \
  --query 'id' --output text)

echo "✅ /monday-missing-subitems resource created with ID: $MISSING_RESOURCE_ID"

# Create GET method for monday-missing-subitems
echo "🔗 Creating GET method for monday-missing-subitems..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $MISSING_RESOURCE_ID \
  --http-method GET \
  --authorization-type NONE

# Create POST method for monday-missing-subitems
echo "🔗 Creating POST method for monday-missing-subitems..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $MISSING_RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE

# Create OPTIONS method for CORS
echo "🔗 Creating OPTIONS method for CORS..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $MISSING_RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE

# Create /monday-units resource
echo "📁 Creating /monday-units resource..."
UNITS_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part "monday-units" \
  --query 'id' --output text)

echo "✅ /monday-units resource created with ID: $UNITS_RESOURCE_ID"

# Create GET method for monday-units
echo "🔗 Creating GET method for monday-units..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $UNITS_RESOURCE_ID \
  --http-method GET \
  --authorization-type NONE

# Create POST method for monday-units
echo "🔗 Creating POST method for monday-units..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $UNITS_RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE

# Create OPTIONS method for CORS
echo "🔗 Creating OPTIONS method for CORS..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $UNITS_RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE

echo ""
echo "🎉 Missing endpoints created!"
echo ""
echo "📁 New endpoints:"
echo "- GET/POST/OPTIONS /monday-missing-subitems"
echo "- GET/POST/OPTIONS /monday-units"
echo ""
echo "📋 Next steps:"
echo "1. Deploy the API Gateway to 'prod' stage"
echo "2. Create the missing Lambda functions"
echo "3. Set up integrations between API Gateway and Lambda"
echo ""
echo "🚀 To deploy the API Gateway, run:"
echo "aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod"
