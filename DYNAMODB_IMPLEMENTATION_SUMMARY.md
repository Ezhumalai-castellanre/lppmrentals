# DynamoDB Service Implementation Summary

## What Has Been Implemented

### 1. Updated DynamoDB Service (`client/src/lib/dynamodb-service.ts`)

The DynamoDB service has been completely updated to use `applicantId` as the partition key, with strict validation that it matches the authenticated user's `zoneinfo` attribute value.

#### Key Changes Made:

- **Partition Key Structure**: Changed from composite key to single partition key using `applicantId`
- **ApplicantId Validation**: Added `validateApplicantId()` method that ensures the provided `applicantId` matches the current user's zoneinfo
- **Security Enhancement**: All CRUD operations now validate the applicantId before proceeding
- **Better Error Handling**: Enhanced error messages and logging for debugging
- **Schema Verification**: Service checks and reports on table schema correctness
- **Form Data Cleaning**: Added automatic cleaning to resolve conflicts between `application_id` and `applicantId` fields

#### New Methods Added:

```typescript
// Get the current user's zoneinfo attribute (source of truth)
async getCurrentUserZoneinfo(): Promise<string | null>

// Generate applicantId from zoneinfo (for DynamoDB partition key)
generateApplicantIdFromZoneinfo(zoneinfo: string): string

// Ensure draft data uses current user's zoneinfo (useful for form components)
async ensureDraftDataUsesCurrentZoneinfo(draftData: DraftData): Promise<DraftData>

// Validate that the provided application_id/applicantId matches the authenticated user's zoneinfo
private async validateApplicationId(applicationId: string): Promise<boolean>

// Map application_id from form data to applicantId for DynamoDB
private mapApplicationIdToApplicantId(formData: any): string | null

// Clean form data to ensure application_id and applicantId are consistent
private cleanFormDataForConsistency(formData: any): any

// Retrieve draft data by reference_id (preferred method for form components)
async getDraftByReferenceId(referenceId: string): Promise<DraftData | null>
```

#### Zoneinfo as Source of Truth:

The service now uses **`zoneinfo` as the primary identifier** and generates `applicantId` from it:

1. **`zoneinfo`**: Source of truth from AWS Cognito user attributes
2. **`applicantId`**: Generated from `zoneinfo` for DynamoDB partition key
3. **Automatic Mapping**: All retrieved data automatically uses current user's `zoneinfo`

**Updated Interfaces:**
```typescript
export interface DraftData {
  zoneinfo: string;        // Source of truth - user's zoneinfo value
  applicantId: string;     // Generated from zoneinfo for DynamoDB partition key
  reference_id: string;
  form_data: any;
  // ... other fields
}

export interface FormDataWithApplicationId {
  zoneinfo: string;        // Source of truth - user's zoneinfo value
  application_id: string;  // Form data uses application_id (should match zoneinfo)
  applicantId: string;     // Generated from zoneinfo for DynamoDB partition key
  // ... other fields
}
```

**Usage Examples:**
```typescript
// Get current user's zoneinfo (source of truth)
const zoneinfo = await dynamoDBService.getCurrentUserZoneinfo();
// Returns: "LPPM-20250801-00582"

// Generate applicantId from zoneinfo
const applicantId = dynamoDBService.generateApplicantIdFromZoneinfo(zoneinfo);
// Returns: "LPPM-20250801-00582" (same for now, but allows future transformation)

// Save draft using current user's zoneinfo
await dynamoDBUtils.saveDraftForCurrentUser({
  reference_id: "app_123",
  form_data: { /* form data */ },
  current_step: 1
});
// Automatically sets zoneinfo and applicantId from current user

// Get draft by reference_id (automatically maps to current user's zoneinfo)
const draft = await dynamoDBUtils.getDraftForCurrentUser("app_123");
// Returns draft with current user's zoneinfo, regardless of stored applicantId
```

This ensures that **no matter what data is stored in DynamoDB**, the form will always receive data with the correct, current user's zoneinfo values.

#### Form Data Mapping and Cleaning:

The service now automatically handles the mapping between form data fields:
- **`application_id`**: The current form field containing the LPPM number (e.g., "LPPM-20250801-00582")
- **`applicantId`**: The DynamoDB partition key field

**Automatic Cleaning Process:**
1. Detects if form data has both `application_id` and `applicantId` with conflicting values
2. Removes the conflicting `applicantId` field
3. Sets `applicantId` to match `application_id` for DynamoDB consistency
4. Prioritizes `application_id` as the source of truth

**Example:**
```typescript
// Before cleaning (conflicting data)
{
  application_id: "LPPM-20250801-00582", // Correct, matches user's zoneinfo
  applicantId: "Lppm-20250811-89245"     // Incorrect, doesn't match zoneinfo
}

// After cleaning (consistent data)
{
  application_id: "LPPM-20250801-00582", // Source of truth
  applicantId: "LPPM-20250801-00582"     // Now matches application_id
}
```

#### Updated Methods:

All existing methods now include applicantId validation:
- `saveDraft()` - Validates applicantId before saving
- `getDraft()` - Validates applicantId before retrieving
- `markAsSubmitted()` - Validates applicantId before updating
- `deleteDraft()` - Validates applicantId before deleting
- `getAllDrafts()` - Validates applicantId before querying

### 2. Utility Functions (`dynamoDBUtils`)

Added convenience functions that automatically use the current user's applicantId:

```typescript
export const dynamoDBUtils = {
  saveDraftForCurrentUser(draftData: Omit<DraftData, 'applicantId'>): Promise<boolean>
  getDraftForCurrentUser(referenceId: string): Promise<DraftData | null>
  markDraftAsSubmittedForCurrentUser(referenceId: string): Promise<boolean>
  deleteDraftForCurrentUser(referenceId: string): Promise<boolean>
  getAllDraftsForCurrentUser(): Promise<DraftData[]>
}
```

### 3. Table Schema

The service now expects and creates tables with this structure:

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

### 4. Enhanced Logging and Debugging

- **Schema Validation**: Service reports on table schema correctness
- **Connection Testing**: Enhanced `testConnection()` method with detailed table information
- **Error Context**: Better error messages for common failure scenarios
- **Size Monitoring**: Data size tracking and truncation for large items

## How It Works

### 1. Authentication Flow

1. User logs in via AWS Cognito
2. User's `zoneinfo` attribute contains their unique `applicantId`
3. DynamoDB service validates all operations against this `applicantId`
4. Data is stored with `applicantId` as the partition key

### 2. Data Isolation

- Each user can only access data with their own `applicantId`
- The service automatically validates this on every operation
- No user can access another user's data, even if they know the applicantId

### 3. Security Features

- **Authentication Required**: All operations require valid AWS Cognito session
- **ApplicantId Validation**: Automatic validation that applicantId matches user's zoneinfo
- **Temporary Credentials**: Uses AWS Cognito Identity Pool for secure access
- **Data Isolation**: Users can only access their own data

## Usage Examples

### Basic Usage (with validation)

```typescript
import { dynamoDBService } from '@/lib/dynamodb-service';

// Save draft - applicantId will be validated against user's zoneinfo
const draftData = {
  applicantId: 'LPPM-12345', // Must match user's zoneinfo
  reference_id: 'REF-001',
  form_data: { /* your data */ },
  current_step: 1,
  last_updated: new Date().toISOString(),
  status: 'draft'
};

const success = await dynamoDBService.saveDraft(draftData);
```

### Recommended Usage (utility functions)

```typescript
import { dynamoDBUtils } from '@/lib/dynamodb-service';

// No need to specify applicantId - automatically uses current user's
const draftData = {
  reference_id: 'REF-001',
  form_data: { /* your data */ },
  current_step: 1,
  last_updated: new Date().toISOString(),
  status: 'draft'
};

const success = await dynamoDBUtils.saveDraftForCurrentUser(draftData);
```

## Migration Notes

### For Existing Users

1. **No Code Changes Required**: Existing components using `user.applicantId` will continue to work
2. **Automatic Validation**: All operations now include security validation
3. **Better Error Handling**: More informative error messages for debugging

### For New Implementations

1. **Use Utility Functions**: Prefer `dynamoDBUtils.*` functions for automatic applicantId handling
2. **Handle Validation Errors**: Check for applicantId mismatch errors
3. **Monitor Logs**: Service provides detailed logging for troubleshooting

## Testing

### Test Script

A comprehensive test script (`test-dynamodb.js`) has been created to verify:
- Table creation with correct schema
- Schema validation
- Basic CRUD operations
- Error handling

### Manual Testing

Use the debug component (`DebugAuth`) to test:
- DynamoDB connection
- Table schema verification
- Authentication flow

## Environment Variables

Ensure these are set in your environment:

```bash
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=your-user-pool-id
VITE_AWS_IDENTITY_POOL_ID=your-identity-pool-id
VITE_AWS_DYNAMODB_TABLE_NAME=DraftSaved  # Optional, defaults to 'DraftSaved'
```

## Benefits of This Implementation

1. **Security**: Users can only access their own data
2. **Simplicity**: Single partition key design is easier to manage
3. **Performance**: Efficient queries using applicantId as partition key
4. **Validation**: Automatic validation prevents data access violations
5. **Maintainability**: Clear separation of concerns and better error handling
6. **Scalability**: Partition key design supports high-volume applications

## Next Steps

1. **Test the Implementation**: Use the test script to verify functionality
2. **Update Components**: Consider migrating to utility functions for cleaner code
3. **Monitor Performance**: Watch DynamoDB metrics for optimization opportunities
4. **Add Indexes**: Consider adding GSIs for additional query patterns if needed

## Support

For issues or questions:
1. Check the detailed logging in the browser console
2. Use the `testConnection()` method to verify table setup
3. Verify user zoneinfo attributes contain correct applicantId values
4. Check AWS credentials and permissions
