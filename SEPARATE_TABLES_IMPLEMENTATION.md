# Separate Tables DynamoDB Implementation

## Overview

This document describes the new DynamoDB structure that separates data into different tables based on the type of information being stored. This replaces the previous single-table approach with a more organized and scalable structure.

## Table Structure

### 1. app_nyc - Application Information
**Purpose**: Stores general application information and metadata

**Schema**:
- **Partition Key**: `appid` (String) - Generated application ID
- **Sort Key**: `zoneinfo` (String) - User's zoneinfo for data isolation

**Data Stored**:
- Application form data
- Current step in the application process
- Status (draft/submitted)
- Uploaded files metadata
- Webhook responses
- Signatures
- Encrypted documents
- Storage mode and S3 references
- Flow type and version information

### 2. applicant_nyc - Primary Applicant Data
**Purpose**: Stores primary applicant specific information

**Schema**:
- **Partition Key**: `userId` (String) - User's ID (same as zoneinfo)
- **Sort Key**: `zoneinfo` (String) - User's zoneinfo for data isolation

**Data Stored**:
- Primary applicant form data
- Occupants information
- Webhook summary for applicant
- Applicant signature
- Status and timestamps

### 3. Co-Applicants - Co-Applicant Data
**Purpose**: Stores co-applicant specific information

**Schema**:
- **Partition Key**: `userId` (String) - User's ID (same as zoneinfo)
- **Sort Key**: `zoneinfo` (String) - User's zoneinfo for data isolation

**Data Stored**:
- Co-applicant form data
- Co-applicant occupants information
- Webhook summary for co-applicant
- Co-applicant signature
- Status and timestamps

### 4. Guarantors_nyc - Guarantor Data
**Purpose**: Stores guarantor specific information

**Schema**:
- **Partition Key**: `userId` (String) - User's ID (same as zoneinfo)
- **Sort Key**: `zoneinfo` (String) - User's zoneinfo for data isolation

**Data Stored**:
- Guarantor form data
- Guarantor occupants information
- Webhook summary for guarantor
- Guarantor signature
- Status and timestamps

## Implementation Files

### 1. Table Creation Script
**File**: `setup-dynamodb-separate-tables.js`

This script creates all four tables with the correct schema and configuration.

**Usage**:
```bash
node setup-dynamodb-separate-tables.js
```

### 2. New DynamoDB Service
**File**: `client/src/lib/dynamodb-separate-tables-service.ts`

This service provides methods to interact with the separate tables structure.

**Key Features**:
- Automatic authentication and credential management
- Data validation and security
- Separate methods for each table type
- Utility functions for common operations

**Usage Example**:
```typescript
import { dynamoDBSeparateTablesUtils } from './lib/dynamodb-separate-tables-service';

// Save application data
await dynamoDBSeparateTablesUtils.saveApplicationData({
  application_info: formData,
  current_step: 1,
  status: 'draft'
});

// Save applicant data
await dynamoDBSeparateTablesUtils.saveApplicantData({
  applicant_info: applicantFormData,
  occupants: occupantsData,
  webhookSummary: webhookData,
  signature: signatureData,
  status: 'draft'
});
```

### 3. Migration Script
**File**: `migrate-to-separate-tables.js`

This script migrates data from the old single table structure to the new separate tables.

**Usage**:
```bash
node migrate-to-separate-tables.js
```

### 4. Amplify Backend Configuration
**File**: `amplify/backend.ts`

Updated to include the new DynamoDB tables with proper IAM permissions for Lambda functions.

## Data Flow

### 1. Application Creation
1. Generate unique `appid` for the application
2. Store general application information in `app_nyc` table
3. Store primary applicant data in `applicant_nyc` table
4. If co-applicant exists, store in `Co-Applicants` table
5. If guarantor exists, store in `Guarantors_nyc` table

### 2. Data Retrieval
1. Query `app_nyc` table by `appid` and `zoneinfo` for application info
2. Query `applicant_nyc` table by `userId` and `zoneinfo` for applicant data
3. Query `Co-Applicants` table by `userId` and `zoneinfo` for co-applicant data
4. Query `Guarantors_nyc` table by `userId` and `zoneinfo` for guarantor data

### 3. Data Updates
1. Update specific table based on the type of data being modified
2. Maintain data consistency across related tables
3. Update timestamps for tracking changes

## Security Features

### 1. Data Isolation
- All tables use `zoneinfo` as part of the key structure
- Users can only access data associated with their own `zoneinfo`
- Automatic validation ensures data security

### 2. Authentication
- Uses AWS Cognito Identity Pool for temporary credentials
- Automatic token validation and refresh
- Secure access to DynamoDB resources

### 3. Access Control
- IAM policies restrict access to specific tables
- Lambda functions have appropriate permissions
- No cross-user data access possible

## Benefits of Separate Tables

### 1. Better Organization
- Clear separation of concerns
- Easier to understand data structure
- Simplified queries for specific data types

### 2. Improved Performance
- Smaller table sizes for faster queries
- Better indexing strategies
- Reduced scan operations

### 3. Enhanced Scalability
- Independent scaling of different data types
- Better resource utilization
- Easier maintenance and updates

### 4. Data Integrity
- Type-specific validation
- Clearer data relationships
- Better error handling

## Migration Process

### 1. Pre-Migration
1. Ensure all new tables are created
2. Backup existing data
3. Test the new service in a development environment

### 2. Migration
1. Run the migration script
2. Verify data integrity
3. Test all functionality

### 3. Post-Migration
1. Update application code to use new service
2. Deploy updated code
3. Monitor for any issues
4. Remove old table when confident

## Usage Guidelines

### 1. Application Data
- Use `app_nyc` table for general application information
- Generate unique `appid` for each application
- Store metadata and configuration data here

### 2. Applicant Data
- Use `applicant_nyc` table for primary applicant information
- Store personal, contact, employment, and income data
- Include occupants and signature information

### 3. Co-Applicant Data
- Use `Co-Applicants` table for co-applicant information
- Only create records when co-applicant data exists
- Follow same structure as applicant data

### 4. Guarantor Data
- Use `Guarantors_nyc` table for guarantor information
- Only create records when guarantor data exists
- Include all required guarantor information

## Error Handling

### 1. Common Errors
- Authentication failures
- Table not found errors
- Data validation errors
- Network connectivity issues

### 2. Error Recovery
- Automatic retry mechanisms
- Graceful degradation
- User-friendly error messages
- Logging for debugging

## Monitoring and Maintenance

### 1. Monitoring
- Track table performance metrics
- Monitor error rates
- Watch for data consistency issues
- Monitor authentication success rates

### 2. Maintenance
- Regular data cleanup
- Performance optimization
- Security updates
- Backup verification

## Future Enhancements

### 1. Additional Tables
- Consider adding tables for specific data types
- Implement table versioning
- Add audit logging tables

### 2. Performance Improvements
- Implement caching strategies
- Add read replicas
- Optimize query patterns

### 3. Security Enhancements
- Implement field-level encryption
- Add data masking
- Enhanced audit trails

## Conclusion

The separate tables structure provides a more organized, scalable, and maintainable approach to storing application data. It improves data organization, enhances security, and provides better performance characteristics while maintaining data integrity and user isolation.
