# Draft System Implementation

This document describes the implementation of a comprehensive draft saving system for the rental application form.

## Overview

The draft system automatically saves application progress to DynamoDB and allows users to resume their application from where they left off. It handles file uploads, webhook responses, and form data across all 13 steps of the application process.

## Features

- **Auto-save**: Automatically saves drafts when navigating between steps
- **File upload tracking**: Stores webhook responses and file metadata
- **Form restoration**: Restores all form data, documents, and signatures
- **Step persistence**: Remembers the current step in the application
- **Manual save**: Users can manually save drafts at any time
- **Draft status**: Shows when the draft was last saved

## Architecture

### Components

1. **DraftService** (`client/src/lib/draft-service.ts`)
   - Handles saving and loading drafts
   - Provides auto-save functionality with debouncing
   - Maps form data to draft structure

2. **Save Draft Function** (`netlify/functions/save-draft.js`)
   - Saves draft data to DynamoDB
   - Handles data compression for large forms
   - Stores webhook responses and file metadata

3. **Get Draft Function** (`netlify/functions/get-draft.js`)
   - Retrieves saved drafts from DynamoDB
   - Transforms data back to form structure
   - Handles missing drafts gracefully

4. **Application Form Integration** (`client/src/components/application-form.tsx`)
   - Auto-loads drafts on component mount
   - Saves drafts on step navigation
   - Saves drafts after file uploads
   - Provides manual save functionality

### Data Structure

The draft system stores data in the following structure:

```typescript
interface DraftData {
  applicantId: string;
  currentStep: number;
  lastSaved: string;
  isComplete: boolean;
  
  // Form data organized by step
  applicationInfo?: { /* Step 1 data */ };
  primaryApplicant?: { /* Step 2 data */ };
  primaryApplicantFinancial?: { /* Step 3 data */ };
  primaryApplicantDocuments?: { /* Step 4 data */ };
  coApplicant?: { /* Step 5 data */ };
  coApplicantFinancial?: { /* Step 6 data */ };
  coApplicantDocuments?: { /* Step 7 data */ };
  otherOccupants?: { /* Step 8 data */ };
  guarantor?: { /* Step 9 data */ };
  guarantorFinancial?: { /* Step 10 data */ };
  guarantorDocuments?: { /* Step 11 data */ };
  signatures?: { /* Step 12 data */ };
  
  // File upload data
  webhookResponses?: Record<string, any>;
  uploadedFilesMetadata?: Record<string, any[]>;
}
```

## Database Schema

### DynamoDB Table: `DraftSaved`

- **Partition Key**: `applicantId` (String)
- **Sort Key**: None
- **Region**: `us-east-1`

### Environment Variables

```bash
VITE_AWS_DYNAMODB_REGION=us-east-1
VITE_AWS_DYNAMODB_ACCESS_KEY_ID=AKIA35BCK6ZHZC4EWVHT
VITE_AWS_DYNAMODB_SECRET_ACCESS_KEY=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
VITE_AWS_DYNAMODB_TABLE_NAME=DraftSaved
```

## File Upload Integration

### Webhook Response Handling

When files are uploaded, the system:

1. Receives webhook response with file URL
2. Updates the `webhookResponses` state
3. Auto-saves the draft with the new file information
4. Stores the file URL for document preview

### Document Storage

Documents are stored with the following structure:

```typescript
documents: {
  applicant: {
    photo_id: [
      {
        filename: "drivers_license.pdf",
        webhookbodyUrl: "https://s3.amazonaws.com/.../file.pdf"
      }
    ]
  }
}
```

## Usage

### Automatic Draft Saving

Drafts are automatically saved when:

- Navigating between steps (next/previous)
- Jumping to a specific step
- File uploads complete successfully
- Form data changes (with debouncing)

### Manual Draft Saving

Users can manually save drafts using the "Save Draft" button in the form navigation.

### Loading Drafts

Drafts are automatically loaded when:

- The application form component mounts
- The user has a valid `applicantId`

## API Endpoints

### Save Draft

```
POST /.netlify/functions/save-draft
```

**Request Body:**
```json
{
  "draftData": DraftData,
  "applicantId": "string",
  "action": "save"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Draft saved successfully",
  "applicantId": "string",
  "savedAt": "2025-01-15T10:45:00.000Z",
  "dataSize": 12345,
  "webhookResponses": {},
  "uploadedFiles": {},
  "documents": {},
  "currentStep": 4
}
```

### Get Draft

```
GET /.netlify/functions/get-draft?applicantId=string
```

**Response:**
```json
{
  "success": true,
  "message": "Draft retrieved successfully",
  "applicantId": "string",
  "lastSaved": "2025-01-15T10:45:00.000Z",
  "currentStep": 4,
  "isComplete": false,
  "formData": {},
  "webhookResponses": {},
  "uploadedFilesMetadata": {},
  "signatures": {},
  "documents": {}
}
```

## Testing

A test page is available at `/test-draft` to verify the draft system functionality:

- Test saving drafts with sample data
- Test loading existing drafts
- View draft data structure
- Verify user authentication and applicant ID

## Error Handling

The system handles various error scenarios:

- **Missing applicant ID**: Shows appropriate error messages
- **Draft save failures**: Displays error notifications
- **Draft load failures**: Gracefully continues with new application
- **Network errors**: Provides user feedback and retry options

## Performance Considerations

- **Data compression**: Large forms are automatically compressed
- **Debounced auto-save**: Prevents excessive API calls
- **Selective data storage**: Only stores essential metadata for large files
- **Efficient restoration**: Restores form state without unnecessary re-renders

## Security

- **User isolation**: Drafts are tied to specific applicant IDs
- **Authentication required**: Only authenticated users can access drafts
- **Data validation**: Input data is validated before storage
- **Secure credentials**: AWS credentials are stored in environment variables

## Future Enhancements

- **Draft versioning**: Support for multiple draft versions
- **Draft sharing**: Allow sharing drafts between users
- **Draft templates**: Pre-filled draft templates for common scenarios
- **Draft analytics**: Track draft completion rates and user behavior
- **Offline support**: Local draft storage for offline usage

## Troubleshooting

### Common Issues

1. **Draft not saving**: Check AWS credentials and DynamoDB permissions
2. **Draft not loading**: Verify applicant ID and user authentication
3. **File uploads not working**: Check webhook URL configuration
4. **Form data not restoring**: Verify draft data structure matches form expectations

### Debug Information

Enable console logging to see detailed draft operations:

```typescript
// Draft saving
console.log('💾 Saving draft data:', draftData);

// Draft loading
console.log('🔍 Loading draft for applicant:', applicantId);

// Webhook responses
console.log('✅ Webhook response received:', response);
```

## Support

For issues or questions about the draft system:

1. Check the console logs for error messages
2. Verify DynamoDB table configuration
3. Test with the `/test-draft` page
4. Review the environment variable configuration
5. Check AWS CloudWatch logs for function errors
