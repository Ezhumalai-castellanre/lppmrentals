# Zoneinfo and User Attributes Mapping

## Overview

This document explains how user login information, including `zoneinfo`, is mapped to form submissions and file uploads in the rental application system.

## User Login Flow

### 1. Authentication Process
- Users log in via AWS Cognito through the `useAuth` hook
- User attributes are fetched from Cognito, including:
  - `email` (required, verified)
  - `family_name` (required)
  - `given_name` (optional)
  - `name` (optional)
  - `phone_number` (optional)
  - `sub` (Cognito user ID, required)
  - `zoneinfo` (optional, can be custom or standard attribute)

### 2. User Context Storage
The `User` interface in `use-auth.tsx` now includes:
```typescript
interface User {
  id: string;
  email: string;
  username: string;
  applicantId?: string;
  zoneinfo?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
}
```

## Form Integration

### 1. User Info Display
- A user information card is displayed at the top of the application form
- Shows all user attributes including `zoneinfo`
- Helps users verify their login information

### 2. Form Data Mapping
- User attributes are automatically included in form submissions
- `zoneinfo` and other user data are sent with the webhook payload

## File Upload Integration

### 1. File Upload Payload
When files are uploaded, the webhook payload includes:
```typescript
interface FileUploadWebhookData {
  reference_id: string;
  file_name: string;
  section_name: string;
  document_name: string;
  file_base64: string;
  application_id: string;
  applicant_id?: string;
  zoneinfo?: string;
  user_email?: string;
  user_name?: string;
  user_given_name?: string;
  user_family_name?: string;
  user_phone_number?: string;
}
```

### 2. Form Data Payload
When form data is submitted, the webhook payload includes:
```typescript
interface FormDataWebhookData {
  reference_id: string;
  application_id: string;
  applicant_id?: string;
  zoneinfo?: string;
  user_email?: string;
  user_name?: string;
  user_given_name?: string;
  user_family_name?: string;
  user_phone_number?: string;
  form_data: any;
  uploaded_files: { ... };
  submission_type: 'form_data';
}
```

## Component Integration

### 1. FileUpload Component
- Accepts `userAttributes` prop
- Passes user info to webhook service
- Includes zoneinfo in file upload payload

### 2. SupportingDocuments Component
- Receives user attributes from ApplicationForm
- Passes them to FileUpload components
- Ensures all document uploads include user context

### 3. ApplicationForm Component
- Uses `useAuth` hook to get user info
- Displays user information card
- Passes user attributes to all child components
- Includes user data in form submissions

## Debugging

### Console Logging
- User attributes are logged when user logs in
- File uploads include user context in logs
- Form submissions show user data in payload

### User Info Display
- Visual confirmation of user attributes
- Shows zoneinfo and other user data
- Helps verify correct user context

## Usage Examples

### 1. Accessing User Info
```typescript
const { user } = useAuth();
console.log('User zoneinfo:', user?.zoneinfo);
console.log('User email:', user?.email);
```

### 2. File Upload with User Context
```typescript
<FileUpload
  userAttributes={{
    zoneinfo: user?.zoneinfo,
    email: user?.email,
    name: user?.name,
    // ... other attributes
  }}
  // ... other props
/>
```

### 3. Form Submission with User Data
```typescript
await WebhookService.sendFormDataToWebhook(
  formData,
  referenceId,
  applicationId,
  applicantId,
  {
    zoneinfo: user?.zoneinfo,
    email: user?.email,
    // ... other user attributes
  }
);
```

## Benefits

1. **User Context**: All submissions include user identification
2. **Zone-based Processing**: zoneinfo can be used for region-specific logic
3. **Audit Trail**: Complete user context for all uploads and submissions
4. **Debugging**: Easy to trace submissions back to specific users
5. **Data Integrity**: Ensures user data consistency across the application

## Future Enhancements

1. **Zone-based Validation**: Use zoneinfo for region-specific document requirements
2. **User Preferences**: Store user preferences based on zoneinfo
3. **Analytics**: Track user behavior by zone
4. **Custom Workflows**: Implement zone-specific application workflows 