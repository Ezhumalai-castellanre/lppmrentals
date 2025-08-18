# Converting Netlify Functions to Amplify Functions

## What I've Done

I've successfully converted your Netlify S3 upload function to an Amplify Lambda function. Here's what was created:

### ✅ Amplify Backend Structure
```
amplify/
├── backend/
│   ├── api/s3UploadApi/          # API Gateway configuration
│   │   ├── api-params.json
│   │   ├── cli-inputs.json
│   │   ├── api-metadata.json
│   │   └── build/
│   │       └── cloudformation-template.json
│   └── function/s3UploadFunction/ # Lambda function
│       ├── function-parameters.json
│       ├── package.json
│       ├── src/
│       │   └── index.js          # Your S3 upload logic
│       └── build/
│           ├── cloudformation-template.json
│           ├── index.js
│           └── package.json
├── .config/
│   ├── local-env-info.json
│   └── project-config.json
├── backend-config.json
├── amplify-meta.json
└── team-provider-info.json
```

### ✅ Key Changes Made

1. **Function Structure**: Converted from Netlify function to Lambda function
2. **Handler Signature**: Updated to `exports.handler = async (event, context)`
3. **CORS Handling**: Added proper CORS preflight support
4. **CloudFormation Templates**: Created for API Gateway and Lambda
5. **Build Configuration**: Updated `amplify.yml` to include backend build

## Deployment Steps

### Step 1: Deploy the Backend
```bash
./deploy-amplify-backend.sh
```

This script will:
- Install Amplify CLI if needed
- Initialize Amplify project
- Add API Gateway and Lambda function
- Deploy to AWS

### Step 2: Set Environment Variables
In Amplify Console, set these environment variables:
- `AWS_S3_BUCKET_NAME`: your-s3-bucket-name
- `AWS_REGION`: us-east-1
- `AWS_ACCESS_KEY_ID`: your-access-key
- `AWS_SECRET_ACCESS_KEY`: your-secret-key

### Step 3: Deploy Frontend
Your `amplify.yml` is now configured to:
1. Build the backend (API + Lambda)
2. Build the frontend
3. Deploy both together

## API Endpoint

After deployment, your S3 upload endpoint will be available at:
```
https://[API_ID].execute-api.[REGION].amazonaws.com/prod/s3-upload
```

## Function Comparison

### Netlify Function (Before)
```javascript
// netlify/functions/s3-upload/index.js
exports.handler = async (event, context) => {
  // Your S3 upload logic
};
```

### Amplify Function (After)
```javascript
// amplify/backend/function/s3UploadFunction/src/index.js
exports.handler = async (event, context) => {
  // Same S3 upload logic, adapted for Lambda
};
```

## Benefits of Amplify

✅ **Better AWS Integration**: Native Lambda and API Gateway  
✅ **Scalability**: Automatic scaling with Lambda  
✅ **Cost Effective**: Pay per request  
✅ **Monitoring**: CloudWatch integration  
✅ **CI/CD**: Integrated with Amplify build process  

## Testing

Test your new Amplify function with:
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
5. **Monitor CloudWatch logs** for function execution

## Next Steps

1. Run `./deploy-amplify-backend.sh`
2. Set environment variables in Amplify Console
3. Deploy your application
4. Test the S3 upload functionality
5. Monitor logs and performance

Your S3 upload function is now fully converted to Amplify and ready for deployment! 🚀
