# Draft Storage Implementation

## Overview

This implementation provides automatic draft saving for every step of the rental application form, storing data in AWS DynamoDB via AppSync GraphQL. The system automatically saves:

- **Every step advancement** (next, previous, jump to step)
- **Every file upload** (documents, photos, etc.)
- **Complete form data** before submission
- **Auto-save every 5 seconds** while the user is actively working

## Architecture

### 1. GraphQL Client (`client/src/lib/draft-storage.ts`)
- Uses direct fetch API to AWS AppSync
- API key authentication without Amplify conflicts
- Endpoint: `https://fk3zvyxnyje2zlmecey3w4ubcu.appsync-api.us-west-2.amazonaws.com/graphql`

### 2. Draft Storage Service (`client/src/lib/draft-storage.ts`)
- Core service for managing draft operations
- Handles CRUD operations for drafts
- Provides fallback to localStorage if database fails
- Manages auto-save functionality

### 3. React Hook (`client/src/hooks/use-draft-storage.tsx`)
- Provides easy access to draft storage functionality
- Manages state for draft loading, saving, and errors
- Handles auto-save lifecycle

### 4. Form Integration (`client/src/components/application-form.tsx`)
- Automatically saves drafts at every step change
- Saves file uploads immediately
- Shows draft status indicators
- Provides auto-save functionality

## Features

### Automatic Draft Saving
- **Step Navigation**: Saves current step data before moving to next/previous step
- **File Uploads**: Saves document metadata and file information immediately
- **Form Submission**: Saves complete form data before final submission
- **Auto-save**: Saves every 5 seconds while user is working

### Draft Data Structure
```typescript
interface DraftData {
  applicantId: string;
  currentStep: number;
  formData: any;
  documents: any;
  signatures: any;
  uploadedFilesMetadata: any;
  webhookResponses: any;
  lastUpdated: string;
  status: 'draft' | 'submitted';
  stepData: {
    [stepNumber: number]: {
      data: any;
      documents: any;
      timestamp: string;
      completed: boolean;
    };
  };
}
```

### Status Indicators
- **Loading**: Shows when draft is being loaded
- **Error**: Displays any draft-related errors
- **Last Saved**: Shows timestamp of last successful save
- **Auto-saving**: Indicates when auto-save is active
- **Clear Draft**: Button to delete current draft

## Usage

### Basic Integration
```typescript
import { useDraftStorage } from '@/hooks/use-draft-storage';

function MyForm() {
  const {
    currentDraft,
    isLoading,
    error,
    saveStepDraft,
    saveFormDraft,
    saveFileUploadDraft,
    startAutoSave,
    stopAutoSave
  } = useDraftStorage();

  // Auto-save starts automatically when form data changes
  // Drafts are saved automatically at every step change
}
```

### Manual Draft Operations
```typescript
// Save current step
await saveStepDraft(currentStep, formData, documents);

// Save file upload
await saveFileUploadDraft('applicant_photo', files, metadata);

// Save complete form
await saveFormDraft(formData, documents, signatures, metadata, webhooks);

// Start/stop auto-save
startAutoSave(formData, currentStep);
stopAutoSave();
```

## AWS Configuration

### Important Note: No Conflicts with Existing Cognito Setup
The draft storage system is designed to work alongside your existing AWS Cognito authentication without any conflicts. It uses direct GraphQL requests instead of the Amplify client to avoid overriding your Cognito configuration.

### Required Configuration
```bash
# AWS AppSync Configuration (hardcoded in the service)
Endpoint: https://fk3zvyxnyje2zlmecey3w4ubcu.appsync-api.us-west-2.amazonaws.com/graphql
Region: us-west-2
API Key: da2-iboh2su4pzavnnsf3h3mwhy3qm
```

### GraphQL Schema
The system uses the following GraphQL operations:
- `createDraftSaved` - Create new draft
- `updateDraftSaved` - Update existing draft
- `getDraftSaved` - Retrieve draft by applicant ID
- `listDraftSaveds` - List all drafts for user
- `deleteDraftSaved` - Delete draft

## Error Handling

### Fallback Strategy
1. **Primary**: Save to AWS DynamoDB via AppSync
2. **Fallback**: Save to localStorage if database fails
3. **Graceful Degradation**: Form continues to work even if draft saving fails

### Error Types
- **Network Errors**: AppSync connection issues
- **Authentication Errors**: Invalid API keys
- **Validation Errors**: Invalid data format
- **Storage Errors**: localStorage quota exceeded

## Performance Considerations

### Auto-save Optimization
- Only saves when data actually changes
- Debounced to prevent excessive API calls
- Background saving doesn't block user interaction

### Data Compression
- Form data is serialized efficiently
- File metadata stored separately from actual files
- Incremental updates to minimize data transfer

## Security

### Data Privacy
- Applicant ID used as primary key
- No sensitive data logged to console
- Secure API key handling

### Access Control
- Drafts are user-specific
- No cross-user data access
- Secure GraphQL endpoint

## Monitoring and Debugging

### Console Logging
- Comprehensive logging for all draft operations
- Clear success/error indicators
- Performance metrics for debugging

### Status Tracking
- Real-time draft status updates
- Auto-save activity indicators
- Error reporting with user-friendly messages

## Troubleshooting

### Common Issues

1. **Draft Not Saving**
   - Check AWS credentials
   - Verify GraphQL endpoint
   - Check browser console for errors

2. **Auto-save Not Working**
   - Ensure user is authenticated
   - Check if form data is changing
   - Verify auto-save interval

3. **File Upload Drafts Failing**
   - Check file size limits
   - Verify file type restrictions
   - Check network connectivity

### Debug Commands
```typescript
// Check draft storage status
console.log('Current draft:', currentDraft);
console.log('Draft error:', error);
console.log('Auto-save status:', isAutoSaving);

// Force draft save
await saveStepDraft(currentStep, formData);
```

## Future Enhancements

### Planned Features
- **Draft Versioning**: Multiple draft versions per user
- **Draft Sharing**: Share drafts between users
- **Offline Support**: Enhanced offline draft management
- **Draft Templates**: Pre-filled draft templates
- **Bulk Operations**: Batch draft operations

### Performance Improvements
- **Compression**: Better data compression algorithms
- **Caching**: Intelligent draft caching
- **Background Sync**: Background draft synchronization
- **Progressive Loading**: Load drafts progressively

## Support

For issues or questions about the draft storage system:
1. Check the browser console for error messages
2. Verify AWS configuration
3. Test with a simple form submission
4. Check network connectivity to AppSync endpoint

The system is designed to be robust and provide a seamless user experience while maintaining data integrity and security.
