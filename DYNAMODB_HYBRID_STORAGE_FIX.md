# DynamoDB Hybrid Storage Solution

## Problem
The application was encountering a `ValidationException: Item size has exceeded the maximum allowed size` error when trying to save draft data to DynamoDB. This happens because DynamoDB has a 400KB limit per item, and the form data including file uploads, webhook responses, signatures, and encrypted documents was exceeding this limit.

## Solution: Hybrid Storage Approach
I've implemented a hybrid storage solution that automatically detects when data exceeds the DynamoDB size limit and stores large data in S3 while keeping only essential metadata and references in DynamoDB.

## How It Works

### 1. Automatic Size Detection
The `saveDraft` method now automatically calculates the size of all data before saving:
```typescript
const sizes = {
  formData: JSON.stringify(cleanFormData).length,
  uploadedFiles: JSON.stringify(cleanUploadedFiles).length,
  webhookResponses: JSON.stringify(cleanWebhookResponses).length,
  signatures: JSON.stringify(cleanSignatures).length,
  encryptedDocuments: JSON.stringify(cleanEncryptedDocuments).length
};

const totalSize = Object.values(sizes).reduce((sum, size) => sum + size, 0);
```

### 2. Hybrid Storage Decision
If the total size exceeds 400KB, the system automatically switches to hybrid storage:
```typescript
if (totalSize > 400 * 1024) {
  console.warn('⚠️ Data exceeds 400KB limit, implementing hybrid storage approach');
  const hybridData = await this.implementHybridStorage({...}, applicantId);
  // Save with hybrid storage
}
```

### 3. Data Separation Strategy
- **Form Data**: Simplified and stored directly in DynamoDB (essential fields only)
- **Uploaded Files**: Full metadata stored in S3, essential metadata kept in DynamoDB
- **Webhook Responses**: Full responses stored in S3, status info kept in DynamoDB
- **Signatures**: Full signature data stored in S3, basic info kept in DynamoDB
- **Encrypted Documents**: Full encrypted content stored in S3, metadata kept in DynamoDB

### 4. S3 Storage Structure
```
s3://bucket-name/
├── uploaded_files/{applicantId}/{referenceId}.json
├── webhook_responses/{applicantId}/{referenceId}.json
├── signatures/{applicantId}/{referenceId}.json
└── encrypted_documents/{applicantId}/{referenceId}.json
```

### 5. DynamoDB Schema Update
The `DraftData` interface now includes storage mode indicators:
```typescript
export interface DraftData {
  // ... existing fields ...
  storage_mode?: 'direct' | 'hybrid'; // Indicates storage method used
  s3_references?: string[]; // S3 URLs for hybrid storage
}
```

## Implementation Details

### Core Methods

#### `implementHybridStorage()`
- Automatically detects large data fields
- Uploads large data to S3 with proper error handling
- Returns simplified data for DynamoDB storage
- Provides fallback to essential metadata if S3 upload fails

#### `simplifyFormDataForDynamoDB()`
- Removes large nested objects from form data
- Keeps essential fields for form functionality
- Ensures data fits within DynamoDB limits

#### `extractEssentialFileMetadata()`
- Keeps only essential file information (name, size, type, S3 key)
- Removes large content data that would exceed limits

#### `retrieveHybridStorageDraft()`
- Automatically detects hybrid storage mode
- Retrieves full data from S3 when needed
- Provides fallback to base data if S3 retrieval fails

### Error Handling

#### S3 Bucket Access Check
```typescript
private async checkS3BucketAccess(): Promise<boolean>
```
- Verifies S3 bucket accessibility before attempting uploads
- Provides clear error messages if bucket is not accessible

#### Graceful Fallback
- If S3 upload fails, system falls back to storing essential metadata only
- If S3 retrieval fails, system provides base data from DynamoDB
- All operations continue to work even if hybrid storage fails

### Testing and Debugging

#### Debug Component
Added comprehensive testing capabilities in `debug-aws-credentials.tsx`:
- **Test Hybrid Storage**: Basic functionality test
- **Test Large Data Save**: Simulates large data that would exceed limits
- **S3 Bucket Access**: Verifies S3 connectivity

#### Test Methods
```typescript
// Test hybrid storage functionality
await dynamoDBUtils.testHybridStorage();

// Test with large data
await dynamoDBUtils.testLargeDataSave();

// Migrate existing data
await dynamoDBUtils.migrateToHybridStorage(referenceId);
```

## Usage

### Automatic Operation
The hybrid storage is completely automatic - no changes needed in existing code:
```typescript
// This will automatically use hybrid storage if data is large
const success = await dynamoDBService.saveDraft(draftData, applicantId);
```

### Manual Migration
For existing large data that needs to be migrated:
```typescript
await dynamoDBUtils.migrateToHybridStorage(referenceId);
```

### Data Retrieval
Data retrieval automatically handles both storage modes:
```typescript
const draft = await dynamoDBService.getDraft(applicantId, referenceId);
// Automatically retrieves full data from S3 if using hybrid storage
```

## Benefits

1. **Automatic**: No code changes required in existing components
2. **Transparent**: Applications work the same way regardless of storage mode
3. **Scalable**: Can handle virtually unlimited data sizes
4. **Cost-Effective**: S3 storage is much cheaper than DynamoDB for large data
5. **Reliable**: Graceful fallback if S3 operations fail
6. **Secure**: Uses existing AWS credentials and permissions

## Configuration

### Required Environment Variables
```bash
VITE_AWS_S3_BUCKET_NAME=supportingdocuments-storage-2025
VITE_AWS_REGION=us-east-1
VITE_AWS_IDENTITY_POOL_ID=us-east-1:317775cf-6015-4ce2-9551-57994672861d
VITE_AWS_USER_POOL_ID=us-east-1_d07c780Tz
```

### S3 Bucket Requirements
- Bucket must exist and be accessible
- Proper CORS configuration for web access
- IAM permissions for the application to read/write

## Monitoring and Debugging

### Console Logs
The system provides comprehensive logging:
- Data size calculations
- Storage mode decisions
- S3 upload/download operations
- Error handling and fallbacks

### Error Types
- **S3 Bucket Not Accessible**: Check bucket permissions and configuration
- **AWS Credentials**: Verify Cognito Identity Pool setup
- **Data Size**: Monitor when hybrid storage is triggered
- **S3 Operations**: Track upload/download success rates

## Future Enhancements

1. **Compression**: Add data compression before S3 storage
2. **Caching**: Implement local caching for frequently accessed data
3. **Batch Operations**: Optimize multiple S3 operations
4. **Metrics**: Add CloudWatch metrics for storage usage
5. **Lifecycle Policies**: Implement S3 lifecycle policies for old data

## Troubleshooting

### Common Issues

#### "S3 bucket not accessible"
- Verify bucket exists and is in the correct region
- Check IAM permissions for the application
- Verify CORS configuration

#### "Failed to get AWS credentials"
- Check Cognito Identity Pool configuration
- Verify user authentication status
- Check environment variable configuration

#### "Hybrid storage test failed"
- Run individual S3 bucket access test
- Check AWS credentials
- Verify DynamoDB table permissions

### Debug Steps
1. Use the debug component to test basic functionality
2. Check console logs for detailed error information
3. Verify S3 bucket accessibility
4. Test AWS credentials
5. Check DynamoDB table permissions

## Conclusion

This hybrid storage solution provides a robust, scalable approach to handling large data in the application while maintaining backward compatibility and automatic operation. The system automatically detects when data exceeds DynamoDB limits and seamlessly switches to S3 storage, ensuring that applications continue to work regardless of data size.
