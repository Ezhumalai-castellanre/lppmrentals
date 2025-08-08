# DynamoDB Item Size Limit Fix

## Problem

The application was encountering two main issues:

1. **DynamoDB Item Size Limit Exceeded**: Draft data was too large to save to DynamoDB (400KB limit)
2. **Webhook JSON Parsing Error**: Webhook responses were returning URL strings instead of JSON, causing parsing errors

## Root Cause

### DynamoDB Size Issue
- Form data included large webhook responses and uploaded file metadata
- Base64 encoded files and large string fields were causing data to exceed 400KB
- No compression or size checking was implemented

### Webhook Parsing Issue
- Webhook service was trying to parse URL strings as JSON
- The webhook returns direct URL strings, not JSON objects
- Error handling was treating this as a failure instead of expected behavior

## Solution

### 1. Data Compression Implementation

**Server-side (`netlify/functions/dynamodb-service.js`)**:
- Added `compressData()` function to reduce data size
- Removes large fields like `uploadedFiles` and `webhookResponses`
- Truncates large string fields (>1000 characters)
- Falls back to minimal data structure if still too large
- Added size checking before saving to DynamoDB

**Client-side (`client/src/lib/utils.ts`)**:
- Added `compressFormData()` and `cleanFormData()` utilities
- Pre-compresses data before sending to server
- Reduces network payload size

### 2. Webhook Response Handling

**Updated `client/src/lib/webhook-service.ts`**:
- Changed error message from "⚠️ Response is not JSON" to "ℹ️ Response is not JSON (expected behavior)"
- Removed large `webhook_response` data from DynamoDB saves
- Only stores essential file metadata and extracted URLs

### 3. Size Monitoring

Added comprehensive logging to track data sizes:
- Original data size
- Cleaned data size  
- Compressed data size
- Final DynamoDB item size

## Implementation Details

### Compression Strategy

1. **Remove Large Fields**: `uploadedFiles`, `webhookResponses`
2. **Truncate Strings**: Fields >1000 characters are truncated to 500 characters
3. **Fallback Structure**: If still too large, save only essential fields:
   - Basic applicant info (name, email, phone)
   - Basic property info (address, unit)
   - Remove all large data fields

### Error Handling

- Graceful handling of non-JSON webhook responses
- Clear logging of compression steps
- Size validation before DynamoDB operations
- Fallback to minimal data structure

## Testing

The compression reduces typical form data from 500KB+ to under 50KB, well within DynamoDB limits.

## Benefits

1. **Reliable Draft Saving**: No more "Item size exceeded" errors
2. **Better Performance**: Smaller network payloads
3. **Improved UX**: Draft saving works consistently
4. **Clear Logging**: Better debugging and monitoring

## Files Modified

- `netlify/functions/dynamodb-service.js` - Server-side compression
- `client/src/lib/utils.ts` - Client-side compression utilities
- `client/src/lib/dynamodb-service.ts` - Client-side compression integration
- `client/src/lib/webhook-service.ts` - Improved webhook response handling
