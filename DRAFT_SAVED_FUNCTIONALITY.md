# Draft Saved Functionality

This document describes the draft saved functionality implemented for the rental application form using AWS DynamoDB.

## Overview

The application now includes automatic draft saving functionality that allows users to:
- Automatically save their progress every 30 seconds
- Manually save drafts using a "Save Draft" button
- Restore their application from a saved draft when returning
- Continue from where they left off

## AWS Configuration

### DynamoDB Table
- **Table Name**: `DraftSaved`
- **Partition Key**: `applicantId` (String)
- **Region**: `us-east-1`

### AWS Credentials
- **Access Key ID**: `AKIA35BCK6ZHZC4EWVHT`
- **Secret Access Key**: `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`

## Implementation Details

### 1. DynamoDB Service (`client/src/lib/dynamodb-service.ts`)

The DynamoDB service provides the following methods:

- `saveDraft(applicantId, formData, currentStep, isComplete)`: Saves draft data
- `loadDraft(applicantId)`: Loads draft data for a user
- `updateDraft(applicantId, updates)`: Updates existing draft data
- `deleteDraft(applicantId)`: Deletes draft data
- `draftExists(applicantId)`: Checks if draft exists
- `getDraftMetadata(applicantId)`: Gets draft metadata without full form data

### 2. Draft Hook (`client/src/hooks/use-draft.tsx`)

The `useDraft` hook provides:

- **Auto-save functionality**: Saves drafts every 30 seconds when changes are detected
- **Manual save**: Allows users to manually save drafts
- **Draft restoration**: Automatically loads and restores draft data
- **State management**: Tracks loading, saving, and unsaved changes states

### 3. Form Integration (`client/src/components/application-form.tsx`)

The application form has been enhanced with:

- **Auto-save on navigation**: Saves draft when moving between steps
- **Save Draft button**: Manual save button in the navigation
- **Draft restoration banner**: Shows when a draft is loaded
- **Progress tracking**: Shows last saved time

## Features

### Automatic Draft Saving
- Drafts are automatically saved every 30 seconds when changes are detected
- Drafts are saved when navigating between steps
- No user intervention required

### Manual Draft Saving
- Users can manually save drafts using the "Save Draft" button
- Button shows "Saving..." state during save operation
- Success/error notifications are shown

### Draft Restoration
- When a user returns to the application, their draft is automatically loaded
- A banner appears showing the draft was restored
- Users can choose to start fresh or continue with the restored draft

### Data Persistence
The following data is saved in drafts:
- Form data (all form fields)
- Form values (React Hook Form state)
- Signatures
- Documents
- Encrypted documents
- Uploaded documents metadata
- Co-applicant and guarantor flags
- Current step

## Usage

### For Users
1. **Start Application**: Begin filling out the rental application
2. **Auto-save**: Your progress is automatically saved every 30 seconds
3. **Manual Save**: Click "Save Draft" to manually save your progress
4. **Return Later**: When you return, your draft will be automatically restored
5. **Continue**: Pick up exactly where you left off

### For Developers

#### Testing the Integration
```bash
# Run the CLI test
node test-dynamodb-cli.js

# Or visit the test page in the application
# Navigate to /test-dynamodb
```

#### Adding Draft Functionality to Other Forms
```typescript
import { useDraft } from '@/hooks/use-draft';

function MyForm() {
  const {
    isLoading,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    currentDraft,
    loadDraft,
    saveDraft,
    updateFormData,
    deleteDraft,
  } = useDraft({
    autoSaveInterval: 30000, // 30 seconds
    enableAutoSave: true,
    onDraftLoaded: (draft) => {
      // Restore form data from draft
    },
    onDraftSaved: (draft) => {
      // Handle draft saved
    },
  });

  // Use the draft functionality in your form
}
```

## Security Considerations

1. **AWS Credentials**: The AWS credentials are currently hardcoded in the service. In production, these should be managed through environment variables or AWS IAM roles.

2. **Data Encryption**: Sensitive form data is stored in DynamoDB. Consider implementing additional encryption for sensitive fields.

3. **Access Control**: Ensure that users can only access their own drafts by validating the `applicantId`.

## Troubleshooting

### Common Issues

1. **Draft not loading**: Check if the user has a valid `applicantId`
2. **Save failures**: Verify AWS credentials and DynamoDB table permissions
3. **Auto-save not working**: Check if the user is authenticated

### Debugging

1. **Check browser console** for error messages
2. **Use the test page** (`/test-dynamodb`) to verify DynamoDB connectivity
3. **Run CLI test** (`node test-dynamodb-cli.js`) to test AWS credentials

## Future Enhancements

1. **Version Control**: Add versioning to drafts to allow rollback
2. **Conflict Resolution**: Handle concurrent edits from multiple devices
3. **Data Compression**: Compress large form data before storing
4. **Backup Strategy**: Implement backup and recovery procedures
5. **Analytics**: Track draft usage patterns for optimization

## Dependencies

- `@aws-sdk/client-dynamodb`: AWS DynamoDB client
- `@aws-sdk/lib-dynamodb`: DynamoDB document client utilities
- React hooks for state management
- Existing form components and UI library 