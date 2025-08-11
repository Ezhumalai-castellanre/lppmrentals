# DynamoDB Service Usage Guide

## Overview

The DynamoDB service has been updated to use `applicantId` as the partition key, where the `applicantId` must match the logged-in user's `zoneinfo` attribute value. This ensures data isolation and security between users.

## Table Schema

```json
{
  "TableName": "DraftSaved",
  "KeySchema": [
    {
      "AttributeName": "applicantId",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "applicantId",
      "AttributeType": "S"
    }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

## Key Features

- **Partition Key**: `applicantId` (String) - must match user's zoneinfo value
- **Automatic Validation**: All operations validate that the provided `applicantId` matches the authenticated user's zoneinfo
- **Data Isolation**: Users can only access data associated with their own `applicantId`
- **Automatic Table Creation**: Service will create the table with correct schema if it doesn't exist
- **Form Data Cleaning**: Automatic resolution of conflicts between `application_id` and `applicantId` fields

## Form Data Mapping

The service automatically handles the mapping between form data fields and DynamoDB:

### Field Mapping
- **`application_id`**: Form field containing the LPPM number (e.g., "LPPM-20250801-00582")
- **`applicantId`**: DynamoDB partition key field

### Automatic Conflict Resolution
The service detects and resolves conflicts between these fields:

```typescript
// Example: Conflicting form data
const formData = {
  application_id: "LPPM-20250801-00582", // ✅ Correct, matches user's zoneinfo
  applicantId: "Lppm-20250811-89245"     // ❌ Incorrect, doesn't match zoneinfo
};

// Service automatically cleans this to:
const cleanedData = {
  application_id: "LPPM-20250801-00582", // Source of truth
  applicantId: "LPPM-20250801-00582"     // Now consistent
};
```

### Why This Happens
This conflict typically occurs when:
1. Form data is loaded from a previous draft with outdated `applicantId` values
2. Legacy data uses different field names
3. Data migration between different versions of the application

The service ensures data consistency by prioritizing `application_id` as the source of truth.

## Usage Examples

### Basic Service Usage

```typescript
import { dynamoDBService, dynamoDBUtils } from '@/lib/dynamodb-service';

// Save draft data
const draftData = {
  applicantId: 'LPPM-12345', // Must match user's zoneinfo
  reference_id: 'REF-001',
  form_data: { /* your form data */ },
  current_step: 1,
  last_updated: new Date().toISOString(),
  status: 'draft' as const
};

// Save draft (with validation)
const success = await dynamoDBService.saveDraft(draftData);
```

### Utility Functions (Recommended)

The utility functions automatically use the current user's `applicantId` from their zoneinfo:

```typescript
import { dynamoDBUtils } from '@/lib/dynamodb-service';

// Save draft for current user (no need to specify applicantId)
const draftData = {
  reference_id: 'REF-001',
  form_data: { /* your form data */ },
  current_step: 1,
  last_updated: new Date().toISOString(),
  status: 'draft' as const
};

const success = await dynamoDBUtils.saveDraftForCurrentUser(draftData);

// Get draft for current user
const draft = await dynamoDBUtils.getDraftForCurrentUser('REF-001');

// Mark draft as submitted
const submitted = await dynamoDBUtils.markDraftAsSubmittedForCurrentUser('REF-001');

// Delete draft
const deleted = await dynamoDBUtils.deleteDraftForCurrentUser('REF-001');

// Get all drafts for current user
const allDrafts = await dynamoDBUtils.getAllDraftsForCurrentUser();
```

### Manual ApplicantId Retrieval

```typescript
import { dynamoDBService } from '@/lib/dynamodb-service';

// Get the current user's applicantId from their zoneinfo
const applicantId = await dynamoDBService.getCurrentUserApplicantId();

if (applicantId) {
  console.log('Current user applicantId:', applicantId);
  
  // Use it for manual operations
  const draft = await dynamoDBService.getDraft(applicantId, 'REF-001');
} else {
  console.error('No applicantId available for current user');
}
```

## Data Structure

```typescript
interface DraftData {
  applicantId: string;        // Partition key - must match user's zoneinfo
  reference_id: string;       // Unique reference identifier
  form_data: any;            // Form data (JSON)
  current_step: number;       // Current step in the form
  last_updated: string;       // ISO timestamp
  status: 'draft' | 'submitted';
  uploaded_files_metadata?: any;  // File metadata
  webhook_responses?: any;        // Webhook response data
  signatures?: any;               // Signature data
  encrypted_documents?: any;      // Encrypted document data
}
```

## Security Features

1. **Authentication Required**: All operations require a valid AWS Cognito session
2. **ApplicantId Validation**: The service validates that the `applicantId` matches the authenticated user's zoneinfo
3. **Data Isolation**: Users can only access data with their own `applicantId`
4. **Temporary Credentials**: Uses AWS Cognito Identity Pool for secure, temporary AWS credentials

## Error Handling

The service provides detailed error logging:

```typescript
try {
  const result = await dynamoDBUtils.saveDraftForCurrentUser(draftData);
  if (result) {
    console.log('Draft saved successfully');
  } else {
    console.error('Failed to save draft');
  }
} catch (error) {
  console.error('Error in draft operation:', error);
}
```

Common error scenarios:
- **No Authentication**: User not logged in
- **No Zoneinfo**: User missing zoneinfo attribute
- **ApplicantId Mismatch**: Provided applicantId doesn't match user's zoneinfo
- **Table Not Found**: DynamoDB table doesn't exist
- **Access Denied**: Insufficient AWS permissions

## Environment Variables

Ensure these environment variables are set:

```bash
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=your-user-pool-id
VITE_AWS_IDENTITY_POOL_ID=your-identity-pool-id
VITE_AWS_DYNAMODB_TABLE_NAME=DraftSaved  # Optional, defaults to 'DraftSaved'
```

## Best Practices

1. **Use Utility Functions**: Prefer `dynamoDBUtils.*` functions over direct service calls
2. **Handle Errors Gracefully**: Always check return values and handle errors
3. **Validate Data**: Ensure your data fits within DynamoDB size limits (400KB per item)
4. **Monitor Logs**: The service provides detailed logging for debugging
5. **Test Connection**: Use `dynamoDBService.testConnection()` to verify setup

## Migration Notes

If you're migrating from an existing system:

1. Ensure your DynamoDB table has `applicantId` as the partition key
2. Update any existing code to use the new service methods
3. Verify that user zoneinfo attributes contain the correct applicantId values
4. Test the validation by attempting operations with mismatched applicantIds
