# Role-Based Submission Implementation

## Overview

This document describes the implementation of role-based submission system for the LPPM Rentals application form. The system allows different user roles to submit their data to specific DynamoDB tables based on their role.

## Table Structure

### 1. Application Information Table (`app_nyc`)
- **Partition Key**: `appid` (S) - Generated application ID
- **Sort Key**: `zoneinfo` (S) - User's zone information
- **Used by**: Primary Applicant only
- **Contains**: Application form data, reference ID, current step, status, signatures, etc.

### 2. Primary Applicant Table (`applicant_nyc`)
- **Partition Key**: `userId` (S) - User ID
- **Sort Key**: `zoneinfo` (S) - User's zone information
- **Used by**: Primary Applicant only
- **Contains**: Applicant information, occupants, webhook summary, applicant signature

### 3. Co-Applicants Table (`Co-Applicants`)
- **Partition Key**: `userId` (S) - User ID
- **Sort Key**: `zoneinfo` (S) - User's zone information
- **Used by**: Co-Applicants only
- **Contains**: Co-applicant information, occupants, webhook summary, co-applicant signature

### 4. Guarantors Table (`Guarantors_nyc`)
- **Partition Key**: `userId` (S) - User ID
- **Sort Key**: `zoneinfo` (S) - User's zone information
- **Used by**: Guarantors only
- **Contains**: Guarantor information, occupants, webhook summary, guarantor signature

## Role-Based Submission Logic

### Primary Applicant (`userRole === 'applicant'`)
When a Primary Applicant submits their application:

1. **Application Information** → `app_nyc` table
   - Saves application form data
   - Generates unique `appid` as partition key
   - Uses `zoneinfo` as sort key
   - Includes all application metadata, signatures, and webhook responses

2. **Primary Applicant Data** → `applicant_nyc` table
   - Saves applicant-specific information
   - Uses `userId` as partition key
   - Uses `zoneinfo` as sort key
   - Includes applicant signature and webhook summary

### Co-Applicants (`userRole.startsWith('coapplicant')`)
When a Co-Applicant submits their data:

1. **Co-Applicant Data** → `Co-Applicants` table
   - Saves co-applicant-specific information
   - Uses `userId` as partition key
   - Uses `zoneinfo` as sort key
   - Includes co-applicant signature and webhook summary
   - Does NOT save to `app_nyc` or `applicant_nyc` tables

### Guarantors (`userRole.startsWith('guarantor')`)
When a Guarantor submits their data:

1. **Guarantor Data** → `Guarantors_nyc` table
   - Saves guarantor-specific information
   - Uses `userId` as partition key
   - Uses `zoneinfo` as sort key
   - Includes guarantor signature and webhook summary
   - Does NOT save to other tables

## Implementation Details

### Submission Function (`onSubmit`)
The main submission function now includes role-based logic:

```typescript
// Role-based submission logic
if (userRole === 'applicant') {
  // Save to app_nyc and applicant_nyc tables
} else if (userRole && userRole.startsWith('coapplicant')) {
  // Save to Co-Applicants table only
} else if (userRole && userRole.startsWith('guarantor')) {
  // Save to Guarantors_nyc table only
} else {
  // Fallback: save to all tables
}
```

### Draft Saving Function (`saveDraftToDynamoDB`)
The draft saving function also uses the same role-based logic:

```typescript
// Role-based draft saving logic
if (userRole === 'applicant') {
  // Save draft to app_nyc and applicant_nyc tables
} else if (userRole && userRole.startsWith('coapplicant')) {
  // Save draft to Co-Applicants table only
} else if (userRole && userRole.startsWith('guarantor')) {
  // Save draft to Guarantors_nyc table only
} else {
  // Fallback: save to all tables
}
```

## Data Flow

### Primary Applicant Flow
1. User fills out application form
2. On submit/save, data is split into:
   - Application Information → `app_nyc` table
   - Primary Applicant data → `applicant_nyc` table
3. Both tables are updated with the same `zoneinfo` for correlation

### Co-Applicant Flow
1. Co-applicant fills out their specific sections
2. On submit/save, data goes to:
   - Co-applicant data → `Co-Applicants` table
3. Uses their `userId` and `zoneinfo` for identification

### Guarantor Flow
1. Guarantor fills out their specific sections
2. On submit/save, data goes to:
   - Guarantor data → `Guarantors_nyc` table
3. Uses their `userId` and `zoneinfo` for identification

## Key Features

### 1. Role Isolation
- Each role only submits to their designated table(s)
- No cross-contamination of data between roles
- Clean separation of concerns

### 2. Data Correlation
- All tables use `zoneinfo` as sort key for correlation
- Primary applicant's `appid` can be used to link all related data
- Easy to query related data across tables

### 3. Fallback Mechanism
- Unknown roles fall back to saving to all tables
- Ensures data is not lost in edge cases
- Maintains backward compatibility

### 4. Status Tracking
- Each table entry has its own status (`draft` or `submitted`)
- Independent status tracking per role
- Allows partial completion scenarios

## Benefits

1. **Scalability**: Each role's data is stored separately, allowing for better performance
2. **Security**: Role-based access control at the database level
3. **Maintainability**: Clear separation makes it easier to manage and debug
4. **Flexibility**: Easy to add new roles or modify existing ones
5. **Data Integrity**: Each role is responsible for their own data

## Usage Examples

### Primary Applicant Submission
```typescript
// When userRole === 'applicant'
// Data goes to both app_nyc and applicant_nyc tables
// appid is generated for app_nyc table
// userId is used for applicant_nyc table
```

### Co-Applicant Submission
```typescript
// When userRole === 'coapplicant1', 'coapplicant2', etc.
// Data goes to Co-Applicants table only
// Uses specific co-applicant userId
```

### Guarantor Submission
```typescript
// When userRole === 'guarantor1', 'guarantor2', etc.
// Data goes to Guarantors_nyc table only
// Uses specific guarantor userId
```

## Testing

To test the role-based submission:

1. **Primary Applicant**: Login as applicant, fill form, submit → Check `app_nyc` and `applicant_nyc` tables
2. **Co-Applicant**: Login as coapplicant, fill form, submit → Check `Co-Applicants` table only
3. **Guarantor**: Login as guarantor, fill form, submit → Check `Guarantors_nyc` table only

## Monitoring

The system includes comprehensive logging:
- Role detection and table selection
- Save operation results
- Error handling and fallback mechanisms
- Success/failure notifications to users

This implementation ensures that each role's data is properly isolated while maintaining the ability to correlate data across tables when needed.
