# S3 Upload Implementation

## Overview

This implementation replaces the previous system of sending large files as base64 JSON to Make.com webhooks with a more efficient S3-based approach. Files are now uploaded directly to AWS S3, and only the S3 URLs are sent to the webhooks.

## Benefits

1. **No Payload Size Limits**: Files are no longer limited by webhook payload size restrictions
2. **Better Performance**: Faster uploads and reduced bandwidth usage
3. **Cost Effective**: S3 storage is more cost-effective than sending large payloads
4. **Reliability**: S3 provides better reliability and durability
5. **Scalability**: Can handle files of any size

## Architecture

### Flow Diagram
```
Frontend → S3 Upload Function → AWS S3 → Webhook Proxy → Make.com
```

### Components

1. **Frontend (file-upload.tsx)**: Initiates file upload
2. **S3 Upload Function (netlify/functions/s3-upload.js)**: Handles S3 upload server-side
3. **Webhook Service (webhook-service.ts)**: Coordinates S3 upload and webhook calls
4. **Webhook Proxy (netlify/functions/webhook-proxy.js)**: Forwards URLs to Make.com

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET_NAME=lppm-rentals-documents
```

### AWS S3 Bucket Setup

1. Use the existing S3 bucket named `supportingdocuments-storage-2025`
2. Configure CORS for the bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

3. Set up IAM permissions for the bucket:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::lppm-rentals-documents/*"
        }
    ]
}
```

## File Structure

Files are organized in S3 with the following structure using `zoneinfo` (application unique ID) as the main folder:
```
documents/
├── {zoneinfo}/
│   ├── {sectionName}/
│   │   ├── {timestamp}_{filename}
│   │   └── {timestamp}_{filename}
│   └── {sectionName}/
│       └── {timestamp}_{filename}
```

**Key Benefits:**
- **Consistent folder structure**: All files for the same application go into the same `zoneinfo` folder
- **No random folders**: Each application gets exactly one folder based on their unique ID
- **Easy organization**: Files are grouped by application, then by document section

## API Endpoints

### S3 Upload Endpoint
- **URL**: `/api/s3-upload`
- **Method**: POST
- **Max File Size**: 50MB
- **Body**:
```json
{
  "fileData": "base64_encoded_file_data",
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "referenceId": "REF123",
  "sectionName": "financial_documents",
  "documentName": "bank_statement",
  "zoneinfo": "APP_UNIQUE_ID_123"
}
```

### Response
```json
{
  "success": true,
  "url": "https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/documents/REF123/financial_documents/1234567890_document.pdf",
  "presignedUrl": "https://s3.amazonaws.com/...?X-Amz-Algorithm=...",
  "key": "documents/REF123/financial_documents/1234567890_document.pdf",
  "fileName": "document.pdf",
  "fileSize": 1024000
}
```

**URL Options:**
- **`url`**: Clean, permanent S3 URL (recommended for webhook data)
- **`presignedUrl`**: Temporary authenticated URL that expires in 1 hour

## Webhook Data Format

The webhook now receives file metadata and S3 URLs instead of base64 data:

```json
{
  "reference_id": "REF123",
  "file_name": "document.pdf",
  "section_name": "financial_documents",
  "document_name": "bank_statement",
  "s3_url": "https://s3.amazonaws.com/...",
  "s3_key": "documents/APP_UNIQUE_ID_123/financial_documents/1234567890_document.pdf",
  "file_size": 1024000,
  "file_type": "application/pdf",
  "application_id": "APP456",
  "comment_id": "COMM789",
  "uploaded_at": "2024-01-15T10:30:00.000Z"
}
```

## Implementation Details

### Frontend Changes

1. **File Upload Component**: Updated to use `uploadFileToS3AndSendToWebhook`
2. **Webhook Service**: Added new S3 upload method
3. **Error Handling**: Enhanced error handling for S3 uploads

### Backend Changes

1. **S3 Upload Function**: New Netlify function for S3 uploads
2. **Webhook Proxy**: Updated to handle S3 URL format
3. **Configuration**: Added S3 configuration to netlify.toml

## Migration from Old System

The old `sendFileToWebhook` method is still available for backward compatibility, but new uploads use the S3 method. To migrate:

1. Update file upload components to use `uploadFileToS3AndSendToWebhook`
2. Update Make.com webhooks to expect S3 URLs instead of base64 data
3. Configure AWS credentials and S3 bucket

## Security Considerations

1. **Presigned URLs**: S3 URLs expire after 1 hour for security
2. **File Validation**: Files are validated before upload
3. **Access Control**: S3 bucket should have appropriate access controls
4. **Environment Variables**: AWS credentials should be properly secured

## Troubleshooting

### Common Issues

1. **S3 Upload Fails**: Check AWS credentials and bucket permissions
2. **Webhook Fails**: Verify Make.com webhook can handle S3 URL format
3. **File Size Limits**: S3 upload function has 50MB limit (configurable)

### Debugging

Enable console logging to see detailed upload progress:
- S3 upload status
- Webhook call results
- File URLs and keys

## Performance

- **Upload Speed**: Significantly faster for large files
- **Memory Usage**: Reduced memory usage on server
- **Network**: Reduced bandwidth usage
- **Reliability**: Better error handling and retry logic
