# Amplify Backend Deployment Guide

## Problem
You're getting a 404 error when trying to access `/api/s3-upload/` because:
1. Your Express server isn't running in Amplify
2. The Netlify functions aren't available in Amplify
3. You need an Amplify backend API

## Solution
I've created a complete Amplify backend configuration with:
- API Gateway endpoint: `/s3-upload`
- Lambda function for S3 uploads
- Proper CloudFormation templates

## Files Created
```
amplify/
├── backend/
│   ├── api/s3UploadApi/          # API Gateway configuration
│   └── function/s3UploadFunction/ # Lambda function
├── backend-config.json            # Backend configuration
├── amplify-meta.json             # Metadata
└── team-provider-info.json      # Environment info
```

## Deployment Steps

### Option 1: Use the Deployment Script (Recommended)
```bash
./deploy-amplify.sh
```

### Option 2: Manual Deployment
1. **Install Amplify CLI** (if not already installed):
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. **Initialize Amplify** (if not already done):
   ```bash
   amplify init --yes
   ```

3. **Add API**:
   ```bash
   amplify add api
   ```
   - Choose "REST API"
   - Name: `s3UploadApi`
   - Path: `/s3-upload`

4. **Add Function**:
   ```bash
   amplify add function
   ```
   - Name: `s3UploadFunction`
   - Runtime: `Node.js 18.x`
   - Template: `Hello World`

5. **Deploy**:
   ```bash
   amplify push --yes
   ```

## Environment Variables
Make sure these are set in your Amplify app:
- `AWS_S3_BUCKET_NAME`: Your S3 bucket name
- `AWS_REGION`: AWS region (e.g., us-east-1)
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

## API Endpoint
After deployment, your S3 upload endpoint will be available at:
```
https://[API_ID].execute-api.[REGION].amazonaws.com/prod/s3-upload
```

## Testing
Test the endpoint with a POST request:
```bash
curl -X POST https://[API_ID].execute-api.[REGION].amazonaws.com/prod/s3-upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileData": "base64-encoded-file-data",
    "fileName": "test.pdf",
    "fileType": "application/pdf",
    "referenceId": "test-123",
    "sectionName": "documents",
    "documentName": "Test Document",
    "zoneinfo": "test-zone"
  }'
```

## Troubleshooting
1. **Check Amplify Console** for build logs
2. **Verify Lambda function** is deployed correctly
3. **Check API Gateway** for endpoint configuration
4. **Ensure environment variables** are set correctly

## Next Steps
After successful deployment:
1. Update your frontend to use the new API endpoint
2. Test file uploads
3. Monitor CloudWatch logs for any errors
