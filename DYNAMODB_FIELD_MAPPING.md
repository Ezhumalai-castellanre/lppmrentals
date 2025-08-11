# DynamoDB Field Mapping Documentation

## Overview

This document explains how all fields are automatically mapped and cleaned when retrieving data from DynamoDB to ensure consistency with the current user's `zoneinfo`.

## Field Mapping Strategy

### 1. **Source of Truth: `zoneinfo`**
- **`zoneinfo`**: Primary identifier from AWS Cognito user attributes
- **`applicantId`**: Generated from `zoneinfo` for DynamoDB partition key
- **`application_id`**: Form field that should match `zoneinfo`

### 2. **Automatic Field Mapping**

When any draft data is retrieved from DynamoDB, the following mapping occurs automatically:

```typescript
// Before: Retrieved data with old/conflicting values
{
  zoneinfo: "Lppm-20250811-89245",        // Old value
  applicantId: "Lppm-20250811-89245",     // Old value
  form_data: {
    application_id: "Lppm-20250811-89245", // Old value
    applicantId: "Lppm-20250811-89245",   // Old value
    zoneinfo: "Lppm-20250811-89245"       // Old value
  }
}

// After: Automatically mapped to current user's zoneinfo
{
  zoneinfo: "LPPM-20250801-00582",        // Current user's zoneinfo
  applicantId: "LPPM-20250801-00582",     // Generated from zoneinfo
  form_data: {
    application_id: "LPPM-20250801-00582", // Updated to match zoneinfo
    applicantId: "LPPM-20250801-00582",   // Updated to match zoneinfo
    zoneinfo: "LPPM-20250801-00582"       // Updated to match zoneinfo
  }
}
```

## Methods That Perform Field Mapping

### 1. **`getDraft(applicantId, referenceId)`**
- Retrieves draft by `applicantId` (DynamoDB partition key)
- Automatically maps all fields to current user's `zoneinfo`
- Cleans nested `form_data` for consistency

### 2. **`getDraftByReferenceId(referenceId)`** ⭐ **Preferred Method**
- Searches for drafts by `reference_id` (most flexible)
- Automatically maps all fields to current user's `zoneinfo`
- Handles cases where user had different LPPM numbers before

### 3. **`ensureDraftDataUsesCurrentZoneinfo(draftData)`**
- Utility method to ensure any draft data uses current `zoneinfo`
- Can be called on any draft data object
- Comprehensive field mapping and cleaning

## Field Cleaning Process

### Step 1: Top-Level Field Mapping
```typescript
// Update draft-level fields
draftData.zoneinfo = currentUserZoneinfo;
draftData.applicantId = generateApplicantIdFromZoneinfo(currentUserZoneinfo);
```

### Step 2: Nested Form Data Cleaning
```typescript
// Clean nested form_data
draftData.form_data = cleanFormDataForConsistency(draftData.form_data);

// Ensure all form_data fields use current zoneinfo
draftData.form_data.application_id = currentUserZoneinfo;
draftData.form_data.applicantId = draftData.applicantId;
draftData.form_data.zoneinfo = currentUserZoneinfo;
```

### Step 3: Recursive Cleaning
- If `form_data` contains nested objects, they are recursively cleaned
- All levels of nesting are processed for consistency

## Usage Examples

### Example 1: Get Draft by Reference ID
```typescript
import { dynamoDBUtils } from '@/lib/dynamodb-service';

// This automatically maps all fields to current user's zoneinfo
const draft = await dynamoDBUtils.getDraftForCurrentUser('app_123');

console.log(draft.zoneinfo);        // Always current user's zoneinfo
console.log(draft.applicantId);     // Generated from zoneinfo
console.log(draft.form_data.application_id); // Always matches zoneinfo
```

### Example 2: Manual Field Mapping
```typescript
import { dynamoDBService } from '@/lib/dynamodb-service';

// Get any draft data and ensure it uses current zoneinfo
const draft = await dynamoDBService.getDraftByReferenceId('app_123');
const cleanedDraft = await dynamoDBService.ensureDraftDataUsesCurrentZoneinfo(draft);

// All fields now use current user's zoneinfo
```

### Example 3: Form Data Consistency
```typescript
// When saving form data, ensure consistency
const formData = {
  application_id: "LPPM-20250801-00582",
  // ... other form fields
};

// This automatically sets applicantId and zoneinfo to match application_id
const cleanedFormData = dynamoDBService.cleanFormDataForConsistency(formData);
```

## Benefits

### 1. **Automatic Consistency**
- No manual field mapping required
- All data automatically uses current user's `zoneinfo`
- Eliminates "Application ID mismatch" errors

### 2. **Backward Compatibility**
- Old drafts with different LPPM numbers automatically map to new `zoneinfo`
- No data loss when user's `zoneinfo` changes
- Seamless migration between different LPPM numbers

### 3. **Data Integrity**
- All fields are guaranteed to be consistent
- Nested data is recursively cleaned
- Comprehensive logging for debugging

### 4. **Performance**
- Field mapping happens during retrieval (not during every access)
- Cached results maintain consistency
- Minimal overhead for field mapping

## Debugging

### Console Logs
All field mapping operations are logged with detailed information:

```
🔄 Mapping retrieved draft to use current user's zoneinfo 'LPPM-20250801-00582'
🧹 Cleaning form data in retrieved draft to ensure zoneinfo consistency
🔄 Updating form_data.application_id to current zoneinfo 'LPPM-20250801-00582'
🔄 Updating form_data.applicantId to match draft applicantId 'LPPM-20250801-00582'
🔄 Updating form_data.zoneinfo to current zoneinfo 'LPPM-20250801-00582'
✅ Draft data updated to use current user's zoneinfo. Final state: {...}
```

### Field State Verification
Each mapping operation logs the final state for verification:

```typescript
console.log('✅ Final state:', {
  zoneinfo: draftData.zoneinfo,
  applicantId: draftData.applicantId,
  form_data_zoneinfo: draftData.form_data?.zoneinfo,
  form_data_application_id: draftData.form_data?.application_id,
  form_data_applicantId: draftData.form_data?.applicantId
});
```

## Best Practices

### 1. **Use `getDraftByReferenceId`**
- Most flexible method for retrieving drafts
- Automatically handles field mapping
- Works regardless of stored `applicantId`

### 2. **Always Use Utility Functions**
- `dynamoDBUtils.getDraftForCurrentUser()` for getting drafts
- `dynamoDBUtils.saveDraftForCurrentUser()` for saving drafts
- Automatic zoneinfo handling

### 3. **Trust the Field Mapping**
- Don't manually set `applicantId` or `zoneinfo`
- Let the service handle all field consistency
- Focus on business logic, not data mapping

### 4. **Monitor Logs**
- Watch for field mapping logs during development
- Verify final field states in console output
- Use logs to debug any mapping issues

## Conclusion

The DynamoDB service now provides **comprehensive, automatic field mapping** that ensures all retrieved data consistently uses the current user's `zoneinfo`. This eliminates data inconsistencies and provides a robust foundation for the application.

**Key Takeaway**: All field mapping is automatic - just retrieve data using the utility functions, and all fields will be properly mapped to the current user's `zoneinfo`.
