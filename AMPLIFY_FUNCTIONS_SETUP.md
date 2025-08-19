# Amplify Functions Setup Guide

## Overview

This guide explains how to set up and deploy Amplify functions to replace the Netlify functions that were causing 404 errors. These functions will handle your business logic directly in AWS Lambda.

## Functions Created

### 1. **monday-missing-subitems** 
- **Purpose**: Retrieves missing subitems from Monday.com for a specific applicant
- **Endpoint**: `/api/monday-missing-subitems?applicantId={id}`
- **Method**: GET, POST
- **Replaces**: `/.netlify/functions/monday-missing-subitems`

### 2. **s3-upload-function**
- **Purpose**: Handles file uploads to S3
- **Endpoint**: `/api/s3-upload`
- **Method**: POST
- **Replaces**: `/.netlify/functions/s3-upload`
- **Features**: 50MB file limit, organized folder structure, presigned URLs

### 3. **webhook-proxy-function**
- **Purpose**: Forwards webhook calls to external services (Make.com)
- **Endpoint**: `/api/webhook-proxy`
- **Method**: POST
- **Replaces**: `/.netlify/functions/webhook-proxy`

### 4. **monday-units-function**
- **Purpose**: Retrieves unit information from Monday.com
- **Endpoint**: `/api/monday-units?propertyId={id}`
- **Method**: GET, POST
- **Replaces**: `/.netlify/functions/monday-units`

### 5. **submit-application-function**
- **Purpose**: Handles rental application submissions
- **Endpoint**: `/api/submit-application`
- **Method**: POST
- **Replaces**: `/.netlify/functions/submit-application`

## Deployment Steps

### Step 1: Install Dependencies
```bash
# Install dependencies for each function
cd amplify/s3-upload-function && npm install && cd ../..
cd amplify/monday-missing-subitems && npm install && cd ../..
cd amplify/webhook-proxy-function && npm install && cd ../..
cd amplify/monday-units-function && npm install && cd ../..
cd amplify/submit-application-function && npm install && cd ../..
```

### Step 2: Deploy Functions
```bash
# Run the deployment script
./deploy-amplify-functions.sh
```

This script will:
- ✅ Install dependencies for all functions
- ✅ Create deployment packages
- ✅ Create IAM roles with proper permissions
- ✅ Deploy all functions to AWS Lambda
- ✅ Set environment variables

### Step 3: Create API Gateway Endpoints

After deploying the functions, you need to create API Gateway endpoints:

1. **Go to AWS API Gateway Console**
2. **Create a new REST API** or use existing
3. **Create resources and methods** for each endpoint:
   - `/api/monday-missing-subitems` → `lppmrentals-monday-missing-subitems`
   - `/api/s3-upload` → `lppmrentals-s3-upload`
   - `/api/webhook-proxy` → `lppmrentals-webhook-proxy`
   - `/api/monday-units` → `lppmrentals-monday-units`
   - `/api/submit-application` → `lppmrentals-submit-application`

### Step 4: Update Frontend URLs

Once API Gateway is set up, update your frontend to use the new endpoints:

```typescript
// OLD (Netlify functions - causing 404 errors)
const response = await fetch('/.netlify/functions/monday-missing-subitems');

// NEW (Amplify functions)
const response = await fetch('/api/monday-missing-subitems');
```

## Environment Variables

The S3 upload function requires these environment variables:
- `AWS_REGION`: Your AWS region (e.g., us-east-1)
- `AWS_S3_BUCKET_NAME`: Your S3 bucket name (default: supportingdocuments-storage-2025)

## Testing

### Test S3 Upload Function
```bash
curl -X POST https://your-api-gateway-url.amazonaws.com/prod/api/s3-upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileData": "SGVsbG8gV29ybGQ=",
    "fileName": "test.txt",
    "fileType": "text/plain",
    "referenceId": "TEST123",
    "sectionName": "test_section",
    "documentName": "test_document",
    "zoneinfo": "test_zone"
  }'
```

### Test Monday Missing Subitems Function
```bash
curl "https://your-api-gateway-url.amazonaws.com/prod/api/monday-missing-subitems?applicantId=123"
```

## Troubleshooting

### Common Issues

1. **Function not found**: Make sure the function was deployed successfully
2. **Permission denied**: Check IAM role permissions
3. **Timeout errors**: Increase function timeout in Lambda console
4. **CORS issues**: Verify CORS headers are set correctly

### Logs

Check CloudWatch logs for each function:
- **S3 Upload**: `/aws/lambda/lppmrentals-s3-upload`
- **Monday Missing Subitems**: `/aws/lambda/lppmrentals-monday-missing-subitems`
- **Webhook Proxy**: `/aws/lambda/lppmrentals-webhook-proxy`
- **Monday Units**: `/aws/lambda/lppmrentals-monday-units`
- **Submit Application**: `/aws/lambda/lppmrentals-submit-application`

## Next Steps

1. **Deploy the functions** using the deployment script
2. **Create API Gateway endpoints** for each function
3. **Update your frontend** to use the new API endpoints
4. **Test each function** to ensure they work correctly
5. **Implement the actual business logic** (replace TODO comments)

## Benefits

✅ **No more 404 errors** - Functions run directly in AWS
✅ **Better performance** - Lambda functions are fast and scalable
✅ **Proper CORS handling** - Built-in CORS support
✅ **Easy debugging** - CloudWatch logs for each function
✅ **Cost effective** - Pay only for what you use
✅ **Scalable** - Automatically scales with demand

## Support

If you encounter issues:
1. Check CloudWatch logs for error details
2. Verify IAM permissions are correct
3. Ensure environment variables are set
4. Test functions individually before integrating
