# Separate Webhook Implementation

This document explains the implementation of separate webhook submissions for co-applicants and guarantors in the rental application system.

## Overview

The system now supports sending separate webhooks for each role (applicant, co-applicants, and guarantors) instead of a single combined webhook. This allows for better tracking, processing, and handling of individual role submissions.

## Key Features

### 1. Individual Role Webhooks
- **Applicant Webhook**: Sends only applicant data and supporting documents
- **Co-Applicant Webhooks**: Sends individual webhooks for each co-applicant
- **Guarantor Webhooks**: Sends individual webhooks for each guarantor

### 2. Separate Payload Structure
Each webhook contains:
- Application basic information
- Role-specific data (applicant, co-applicant, or guarantor)
- Role-specific uploaded files
- Legal questions and signatures
- Bank information for the specific role

### 3. Enhanced Error Handling
- Individual success/failure tracking for each role
- Detailed error reporting
- Retry logic for failed submissions

## Implementation Details

### WebhookService Methods

#### `sendSeparateWebhooks()`
Sends all webhooks separately for each role:
```typescript
const result = await WebhookService.sendSeparateWebhooks(
  formData,
  referenceId,
  applicationId,
  zoneinfo,
  uploadedFiles
);
```

#### `sendApplicantWebhook()`
Sends webhook for applicant only:
```typescript
const result = await WebhookService.sendApplicantWebhook(
  formData,
  referenceId,
  applicationId,
  zoneinfo,
  uploadedFiles
);
```

#### `sendCoApplicantWebhook()`
Sends webhook for specific co-applicant:
```typescript
const result = await WebhookService.sendCoApplicantWebhook(
  coApplicant,
  coApplicantIndex,
  formData,
  referenceId,
  applicationId,
  zoneinfo,
  uploadedFiles
);
```

#### `sendGuarantorWebhook()`
Sends webhook for specific guarantor:
```typescript
const result = await WebhookService.sendGuarantorWebhook(
  guarantor,
  guarantorIndex,
  formData,
  referenceId,
  applicationId,
  zoneinfo,
  uploadedFiles
);
```

### Payload Structure

Each webhook payload includes:
- `reference_id`: Unique identifier for the application
- `application_id`: Application ID
- `form_data`: Role-specific form data
- `uploaded_files`: Role-specific file metadata
- `submission_type`: Type of submission (`applicant_only`, `coapplicant_only`, `guarantor_only`)

### Response Structure

The `sendSeparateWebhooks()` method returns:
```typescript
{
  success: boolean;
  error?: string;
  results: {
    applicant: { success: boolean; error?: string };
    coApplicants: Array<{ success: boolean; error?: string; index: number }>;
    guarantors: Array<{ success: boolean; error?: string; index: number }>;
  }
}
```

## Usage in Application Form

The application form now uses separate webhooks by default:

```typescript
// In application-form.tsx
const separateWebhookResult = await WebhookService.sendSeparateWebhooks(
  webhookPayload,
  referenceId,
  individualApplicantId,
  user?.zoneinfo,
  uploadedFilesMetadata
);
```

## Testing

A test file is available at `client/src/lib/separate-webhook-test.ts`:

```typescript
import { testSeparateWebhookSubmissions, testIndividualWebhookSubmissions } from './separate-webhook-test';

// Test all separate webhooks
await testSeparateWebhookSubmissions();

// Test individual webhooks
await testIndividualWebhookSubmissions();
```

## Benefits

1. **Better Tracking**: Each role submission can be tracked independently
2. **Improved Processing**: Webhook receivers can process each role separately
3. **Enhanced Error Handling**: Failed submissions for one role don't affect others
4. **Scalability**: Easier to handle large applications with multiple co-applicants/guarantors
5. **Debugging**: Easier to identify which specific role submission failed

## Migration Notes

- The old `sendFormDataToWebhook()` method is still available for backward compatibility
- New applications will use separate webhooks by default
- Existing webhook receivers should be updated to handle the new submission types

## Webhook Endpoints

The webhook proxy will receive requests with the following structure:
```json
{
  "webhookType": "form_data",
  "webhookData": {
    "reference_id": "string",
    "application_id": "string",
    "form_data": { /* role-specific data */ },
    "uploaded_files": { /* role-specific files */ },
    "submission_type": "applicant_only" | "coapplicant_only" | "guarantor_only"
  }
}
```

## Error Handling

- Each webhook submission is tracked independently
- Failed submissions are logged with detailed error information
- The system continues processing other roles even if one fails
- Users receive feedback about which submissions succeeded or failed
