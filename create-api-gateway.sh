#!/bin/bash

echo "🚀 Creating API Gateway for Amplify Functions..."

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

# Create API Gateway
echo "📡 Creating API Gateway..."
API_ID=$(aws apigateway create-rest-api \
  --name "lppmrentals-api" \
  --description "API Gateway for LPPM Rentals Lambda functions" \
  --query 'id' --output text)

if [ $? -eq 0 ]; then
    echo "✅ API Gateway created with ID: $API_ID"
else
    echo "❌ Failed to create API Gateway"
    exit 1
fi

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[?path==`/`].id' --output text)

echo "🔍 Root resource ID: $ROOT_ID"

# Create /api resource
echo "📁 Creating /api resource..."
API_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part "api" \
  --query 'id' --output text)

echo "✅ /api resource created with ID: $API_RESOURCE_ID"

# Create /api/monday-missing-subitems resource
echo "📁 Creating /api/monday-missing-subitems resource..."
MISSING_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $API_RESOURCE_ID \
  --path-part "monday-missing-subitems" \
  --query 'id' --output text)

echo "✅ /api/monday-missing-subitems resource created with ID: $MISSING_RESOURCE_ID"

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

# Create /api/s3-upload resource
echo "📁 Creating /api/s3-upload resource..."
S3_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $API_RESOURCE_ID \
  --path-part "s3-upload" \
  --query 'id' --output text)

echo "✅ /api/s3-upload resource created with ID: $S3_RESOURCE_ID"

# Create POST method for s3-upload
echo "🔗 Creating POST method for s3-upload..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $S3_RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE

# Create OPTIONS method for CORS
echo "🔗 Creating OPTIONS method for CORS..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $S3_RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE

# Create /api/webhook-proxy resource
echo "📁 Creating /api/webhook-proxy resource..."
WEBHOOK_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $API_RESOURCE_ID \
  --path-part "webhook-proxy" \
  --query 'id' --output text)

echo "✅ /api/webhook-proxy resource created with ID: $WEBHOOK_RESOURCE_ID"

# Create POST method for webhook-proxy
echo "🔗 Creating POST method for webhook-proxy..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $WEBHOOK_RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE

# Create OPTIONS method for CORS
echo "🔗 Creating OPTIONS method for CORS..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $WEBHOOK_RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE

# Create /api/monday-units resource
echo "📁 Creating /api/monday-units resource..."
UNITS_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $API_RESOURCE_ID \
  --path-part "monday-units" \
  --query 'id' --output text)

echo "✅ /api/monday-units resource created with ID: $UNITS_RESOURCE_ID"

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

# Create /api/submit-application resource
echo "📁 Creating /api/submit-application resource..."
SUBMIT_RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $API_RESOURCE_ID \
  --path-part "submit-application" \
  --query 'id' --output text)

echo "✅ /api/submit-application resource created with ID: $SUBMIT_RESOURCE_ID"

# Create POST method for submit-application
echo "🔗 Creating POST method for submit-application..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $SUBMIT_RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE

# Create OPTIONS method for CORS
echo "🔗 Creating OPTIONS method for CORS..."
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $SUBMIT_RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE

echo ""
echo "🎉 API Gateway setup complete!"
echo ""
echo "📋 API Gateway ID: $API_ID"
echo "🔗 API Gateway URL: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
echo ""
echo "📁 Endpoints created:"
echo "- GET/POST/OPTIONS /api/monday-missing-subitems"
echo "- POST/OPTIONS /api/s3-upload"
echo "- POST/OPTIONS /api/webhook-proxy"
echo "- GET/POST/OPTIONS /api/monday-units"
echo "- POST/OPTIONS /api/submit-application"
echo ""
echo "📋 Next steps:"
echo "1. Deploy the API Gateway to 'prod' stage"
echo "2. Update your frontend to use the new API Gateway URLs"
echo "3. Test the endpoints"
echo ""
echo "🚀 To deploy the API Gateway, run:"
echo "aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod"
