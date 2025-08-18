# Fix for Amplify Build Error

## Current Issue
The Amplify build is failing with this error:
```
🛑 No CloudFormation template found at /codebuild/output/src1874746434/src/lppmrentals/amplify/backend/function/s3UploadFunction/s3UploadFunction-cloudformation-template.json
```

## Root Cause
The issue is that Amplify expects a specific file naming convention and structure that we created manually, but it's not properly initialized.

## Solution Options

### Option 1: Use the Simple Deployment Script (Recommended)
```bash
./deploy-amplify-simple.sh
```

This script will:
1. Remove the existing `amplify` directory
2. Initialize a fresh Amplify project
3. Add the Lambda function and API Gateway properly
4. Deploy to AWS

### Option 2: Manual Amplify CLI Setup
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Remove existing amplify directory
rm -rf amplify

# Initialize Amplify project
amplify init --yes

# Add function
amplify add function --yes

# Add API
amplify add api --yes

# Deploy
amplify push --yes
```

### Option 3: Fix Current Configuration
If you want to keep the current files, you need to:

1. **Fix the CloudFormation template names**:
   ```bash
   mv amplify/backend/function/s3UploadFunction/cloudformation-template.json amplify/backend/function/s3UploadFunction/s3UploadFunction-cloudformation-template.json
   mv amplify/backend/api/s3UploadApi/cloudformation-template.json amplify/backend/api/s3UploadApi/s3UploadApi-cloudformation-template.json
   ```

2. **Create proper Amplify configuration files**:
   - `amplify/backend/function/s3UploadFunction/amplify-function-config.json`
   - `amplify/backend/api/s3UploadApi/amplify-api-config.json`

3. **Update the backend-config.json** to match Amplify's expected format

## Recommended Approach
**Use Option 1** (the simple deployment script) because:
- ✅ It creates a proper Amplify project structure
- ✅ All files will have the correct naming convention
- ✅ No manual configuration needed
- ✅ Follows Amplify best practices

## After Deployment
Once the backend is deployed:

1. **Copy your S3 upload code** to the generated Lambda function
2. **Set environment variables** in Amplify Console
3. **Deploy your frontend** to Amplify
4. **Test the S3 upload functionality**

## Environment Variables Needed
- `AWS_S3_BUCKET_NAME`: your-s3-bucket-name
- `AWS_REGION`: us-east-1
- `AWS_ACCESS_KEY_ID`: your-access-key
- `AWS_SECRET_ACCESS_KEY`: your-secret-key

## Next Steps
1. Run `./deploy-amplify-simple.sh`
2. Follow the prompts to configure your project
3. Wait for deployment to complete
4. Set environment variables in Amplify Console
5. Deploy your application

This will resolve the CloudFormation template error and give you a working Amplify backend! 🚀
