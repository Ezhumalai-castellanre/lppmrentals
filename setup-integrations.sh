#!/bin/bash

echo "🔗 Setting up Lambda integrations with API Gateway..."

API_ID="fatx1qtgn2"
REGION="us-east-1"
ACCOUNT_ID="818263291471"

# Get resource IDs
echo "🔍 Getting resource IDs..."
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID)

# Extract resource IDs
API_RESOURCE_ID=$(echo $RESOURCES | jq -r '.items[] | select(.pathPart=="api") | .id')
MISSING_RESOURCE_ID=$(echo $RESOURCES | jq -r '.items[] | select(.pathPart=="monday-missing-subitems") | .id')
S3_RESOURCE_ID=$(echo $RESOURCES | jq -r '.items[] | select(.pathPart=="s3-upload") | .id')
WEBHOOK_RESOURCE_ID=$(echo $RESOURCES | jq -r '.items[] | select(.pathPart=="webhook-proxy") | .id')
UNITS_RESOURCE_ID=$(echo $RESOURCES | jq -r '.items[] | select(.pathPart=="monday-units") | .id')
SUBMIT_RESOURCE_ID=$(echo $RESOURCES | jq -r '.items[] | select(.pathPart=="submit-application") | .id')

echo "📁 Resource IDs:"
echo "- /api: $API_RESOURCE_ID"
echo "- /api/monday-missing-subitems: $MISSING_RESOURCE_ID"
echo "- /api/s3-upload: $S3_RESOURCE_ID"
echo "- /api/webhook-proxy: $WEBHOOK_RESOURCE_ID"
echo "- /api/monday-units: $UNITS_RESOURCE_ID"
echo "- /api/submit-application: $SUBMIT_RESOURCE_ID"

# Set up integrations for monday-missing-subitems
echo "🔗 Setting up integration for monday-missing-subitems..."

# GET method integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $MISSING_RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:lppmrentals-monday-missing-subitems/invocations"

# POST method integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $MISSING_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:lppmrentals-monday-missing-subitems/invocations"

# OPTIONS method integration (mock for CORS)
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $MISSING_RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json":"{\"statusCode\": 200}"}'

# Set up integrations for s3-upload
echo "🔗 Setting up integration for s3-upload..."

# POST method integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $S3_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:lppmrentals-s3-upload/invocations"

# OPTIONS method integration (mock for CORS)
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $S3_RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json":"{\"statusCode\": 200}"}'

# Set up integrations for webhook-proxy
echo "🔗 Setting up integration for webhook-proxy..."

# POST method integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $WEBHOOK_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:lppmrentals-webhook-proxy/invocations"

# OPTIONS method integration (mock for CORS)
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $WEBHOOK_RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json":"{\"statusCode\": 200}"}'

# Set up integrations for monday-units
echo "🔗 Setting up integration for monday-units..."

# GET method integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $UNITS_RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:lppmrentals-monday-units/invocations"

# POST method integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $UNITS_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:lppmrentals-monday-units/invocations"

# OPTIONS method integration (mock for CORS)
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $UNITS_RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json":"{\"statusCode\": 200}"}'

# Set up integrations for submit-application
echo "🔗 Setting up integration for submit-application..."

# POST method integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $SUBMIT_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:lppmrentals-submit-application/invocations"

# OPTIONS method integration (mock for CORS)
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $SUBMIT_RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json":"{\"statusCode\": 200}"}'

echo "✅ All integrations set up successfully!"
echo ""
echo "🚀 Now you can deploy the API Gateway:"
echo "aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod"
