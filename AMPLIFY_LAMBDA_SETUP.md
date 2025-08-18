# Amplify Lambda Functions Setup

This document explains how to set up and deploy AWS Lambda functions for both local development and production environments.

## **Architecture Overview**

### **Local Development**
- Express server runs on localhost:5000
- API endpoints: `/api/s3-upload` and `/api/webhook-proxy`
- Uses local AWS credentials and S3 bucket

### **Production**
- AWS Lambda functions handle API requests
- API Gateway provides REST endpoints
- Functions use production AWS credentials and S3 bucket

## **Lambda Functions**

### **1. S3 Upload Function**
- **File**: `amplify/backend/function/s3-upload/src/index.js`
- **Purpose**: Handles file uploads to S3
- **Features**:
  - 50MB file size limit
  - Folder organization by `zoneinfo`
  - Returns clean S3 URLs and presigned URLs
  - CORS support

### **2. Webhook Proxy Function**
- **File**: `amplify/backend/function/webhook-proxy/src/index.js`
- **Purpose**: Proxies requests to Make.com webhooks
- **Features**:
  - Supports file upload and form data webhooks
  - 50MB payload limit
  - CORS support
  - Error handling and logging

## **Setup Instructions**

### **Prerequisites**
1. AWS CLI configured with appropriate credentials
2. IAM role with Lambda execution permissions
3. S3 bucket access permissions

### **Step 1: Install Dependencies**
```bash
# Install dependencies for S3 upload function
cd amplify/backend/function/s3-upload
npm install

# Install dependencies for webhook proxy function
cd ../webhook-proxy
npm install
```

### **Step 2: Deploy Lambda Functions**
```bash
# Make deployment script executable
chmod +x deploy-lambda.sh

# Run deployment script
./deploy-lambda.sh
```

**Note**: Update the script with your AWS account ID and IAM role ARN before running.

### **Step 3: Create API Gateway**
The deployment script will create an API Gateway. You'll need to:
1. Configure CORS settings
2. Set up resource policies
3. Deploy the API to a stage

### **Step 4: Update Frontend URLs**
Update `client/src/lib/webhook-service.ts` with your API Gateway URLs:

```typescript
private static readonly WEBHOOK_PROXY_URL = process.env.NODE_ENV === 'production' 
  ? 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/webhook-proxy'
  : '/api/webhook-proxy';

private static readonly S3_UPLOAD_URL = process.env.NODE_ENV === 'production'
  ? 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/s3-upload'
  : '/api/s3-upload';
```

## **Environment Variables**

### **Lambda Functions**
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=supportingdocuments-storage-2025
```

### **Frontend (VITE_ prefixed)**
```bash
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key
VITE_AWS_S3_BUCKET_NAME=supportingdocuments-storage-2025
```

## **Testing**

### **Local Testing**
```bash
# Start local development server
npm run dev:both

# Test S3 upload endpoint
curl -X POST http://localhost:5000/api/s3-upload \
  -H "Content-Type: application/json" \
  -d '{"fileData": "base64data", "fileName": "test.pdf", "fileType": "application/pdf", "referenceId": "test", "sectionName": "test", "documentName": "test", "zoneinfo": "test"}'

# Test webhook proxy endpoint
curl -X POST http://localhost:5000/api/webhook-proxy \
  -H "Content-Type: application/json" \
  -d '{"webhookType": "file_upload", "webhookData": {"test": "data"}}'
```

### **Production Testing**
Test the Lambda functions through API Gateway endpoints.

## **File Structure**
```
amplify/
├── backend/
│   ├── function/
│   │   ├── s3-upload/
│   │   │   ├── src/
│   │   │   │   └── index.js
│   │   │   └── package.json
│   │   └── webhook-proxy/
│   │       ├── src/
│   │       │   └── index.js
│   │       └── package.json
│   ├── api/
│   │   └── lppmrentals/
│   │       └── api-params.json
│   └── backend-config.json
```

## **Benefits of Lambda Functions**

✅ **Scalability**: Automatic scaling based on demand  
✅ **Cost-effective**: Pay only for execution time  
✅ **Consistency**: Same code runs in dev and production  
✅ **Security**: IAM roles and VPC isolation  
✅ **Monitoring**: CloudWatch logs and metrics  

## **Migration from Netlify Functions**

1. **Remove Netlify dependencies**:
   - Delete `netlify/` folder
   - Remove `netlify.toml`
   - Update build scripts

2. **Update frontend URLs** to point to Lambda functions

3. **Deploy Lambda functions** to AWS

4. **Test thoroughly** in both environments

## **Troubleshooting**

### **Common Issues**
1. **CORS errors**: Ensure API Gateway CORS is configured
2. **Permission denied**: Check IAM roles and policies
3. **Timeout errors**: Increase Lambda function timeout
4. **Memory issues**: Increase Lambda function memory allocation

### **Debugging**
- Check CloudWatch logs for Lambda functions
- Verify API Gateway configuration
- Test endpoints with curl or Postman
- Check AWS credentials and permissions

## **Next Steps**

1. **Deploy Lambda functions** using the deployment script
2. **Create and configure API Gateway**
3. **Update frontend URLs** with production endpoints
4. **Test in production environment**
5. **Remove Netlify dependencies**
6. **Monitor and optimize** Lambda performance
