# 📄 Document Form Data Structure

## 🔗 Webhook Payload Structure

The rental application form sends the following document-related data to the webhook:

### 📋 Complete Webhook Data Structure

```typescript
{
  // Application Information
  application_id: string,
  reference_id: string,
  
  // Form Data (Complete application data)
  form_data: {
    // ... all form fields
  },
  
  // Document Metadata
  documents: {
    // Raw document metadata
  },
  
  // Encrypted Documents (Metadata only)
  encryptedDocuments: {
    applicant: {
      id: [
        {
          reference_id: string,
          file_name: string,
          section_name: "applicant_id",
          original_size: number,
          mime_type: string,
          upload_date: string
        }
      ],
      ssn: [...],
      w9: [...],
      employmentLetter: [...],
      payStubs: [...],
      taxReturns: [...],
      bankStatements: [...]
    },
    coApplicant: {
      // Same structure as applicant
    },
    guarantor: {
      // Same structure as applicant
    }
  },
  
  // Uploaded Documents (Webhook tracking)
  uploaded_documents: [
    {
      reference_id: string,
      file_name: string,
      section_name: string,
      documents: string
    }
  ],
  
  // Uploaded Files Metadata
  uploaded_files: {
    "applicant_id": [
      {
        file_name: string,
        file_size: number,
        mime_type: string,
        upload_date: string
      }
    ],
    "coapplicant_id": [...],
    "guarantor_id": [...],
    "supporting_photo_id": [...],
    "supporting_social_security": [...],
    // ... other sections
  }
}
```

## 📁 Document Sections

### 1. **Applicant Documents**
- **Section Name**: `applicant_*`
- **Document Types**:
  - `applicant_id` - Driver's License (Photo ID)
  - `applicant_ssn` - Social Security Card
  - `applicant_w9` - W9 Form
  - `applicant_employmentLetter` - Employment Letter
  - `applicant_payStubs` - Pay Stubs (multiple files)
  - `applicant_taxReturns` - Tax Returns (multiple files)
  - `applicant_bankStatements` - Bank Statements (multiple files)

### 2. **Co-Applicant Documents**
- **Section Name**: `coApplicant_*`
- **Document Types**: Same as applicant
- **Condition**: Only included if `hasCoApplicant` is true

### 3. **Guarantor Documents**
- **Section Name**: `guarantor_*`
- **Document Types**: Same as applicant
- **Condition**: Only included if `hasGuarantor` is true

### 4. **Supporting Documents**
- **Section Name**: `supporting_*`
- **Document Types**:
  - `supporting_photo_id` - Driver's License (Photo ID)
  - `supporting_social_security` - Social Security Card
  - `supporting_w9_forms` - W9 Form
  - `supporting_employment_letter` - Employment Letter
  - `supporting_pay_stubs` - Pay Stubs (multiple files)
  - `supporting_tax_returns` - Tax Returns (multiple files)
  - `supporting_bank_statement` - Bank Statements (multiple files)
  - `supporting_accountant_letter` - Accountant Letter
  - `supporting_credit_report` - Credit Report

## 🔐 Document Processing

### File Upload Limits
- **Single File Documents**: 1 file, 50MB max
  - Driver's License, Social Security Card, W9 Form, Employment Letter
- **Multiple File Documents**: 5 files max, 50MB each
  - Pay Stubs, Tax Returns, Bank Statements

### Accepted File Types
- **Images**: `.jpg`, `.jpeg`, `.png`
- **Documents**: `.pdf`

### Encryption
- All uploaded files are encrypted before transmission
- Only metadata is sent to webhook (not the actual encrypted files)
- Files are encrypted using the `EncryptedFile` type

## 📊 Data Tracking

### Uploaded Documents Array
```typescript
uploadedDocuments: {
  reference_id: string,    // Unique identifier
  file_name: string,       // Original filename
  section_name: string,    // Section identifier
  documents: string        // Document type
}[]
```

### Files Metadata
```typescript
uploadedFilesMetadata: {
  [sectionKey]: {
    file_name: string,
    file_size: number,
    mime_type: string,
    upload_date: string
  }[]
}
```

## 🛡️ Safety Features

### Error Handling
- ✅ Array validation before map operations
- ✅ Null/undefined checks for uploadedDocuments
- ✅ Individual document object validation
- ✅ Fallback values for missing properties
- ✅ Comprehensive error logging

### Data Integrity
- ✅ Safe setUploadedDocuments calls
- ✅ Filtered invalid document objects
- ✅ Proper section key generation
- ✅ Consistent data structure

## 🔍 Debug Information

The system provides detailed console logging:

```javascript
// Document processing debug
console.log('🔍 Debug - uploadedDocuments type:', typeof uploadedDocuments);
console.log('🔍 Debug - uploadedDocuments value:', uploadedDocuments);
console.log('🔍 Debug - Processing uploadedDocuments array:', uploadedDocuments);

// Webhook payload debug
console.log('📊 Data Verification:');
console.log('  - Uploaded Documents Count:', uploadedDocuments.length);
console.log('  - Uploaded Files Metadata Keys:', Object.keys(uploadedFilesMetadata));
```

## 📤 Webhook Submission

### Payload Size Monitoring
- Monitors payload size before sending
- Warns if payload exceeds 50MB
- Provides size information in MB

### Success/Failure Handling
- ✅ Success: "Application Submitted & Sent"
- ❌ Failure: "Application Submitted" (with webhook failure note)

## 🎯 Key Features

1. **Comprehensive Document Tracking**: All documents are tracked with unique identifiers
2. **Section-based Organization**: Documents are organized by person and type
3. **Encryption Security**: All files are encrypted before transmission
4. **Metadata Only**: Webhook receives metadata, not actual files
5. **Error Resilience**: Robust error handling prevents crashes
6. **Debug Logging**: Detailed logging for troubleshooting
7. **Size Monitoring**: Payload size monitoring and warnings
8. **Type Safety**: TypeScript interfaces ensure data consistency

## 📝 Example Webhook Payload

```json
{
  "application_id": "app_1703123456789_abc123def",
  "reference_id": "app_1703123456789_xyz789ghi",
  "uploaded_documents": [
    {
      "reference_id": "1703123456789-drivers_license.pdf",
      "file_name": "drivers_license.pdf",
      "section_name": "applicant_id",
      "documents": "id"
    },
    {
      "reference_id": "1703123456790-pay_stubs.pdf",
      "file_name": "pay_stubs.pdf",
      "section_name": "applicant_payStubs",
      "documents": "payStubs"
    }
  ],
  "uploaded_files": {
    "applicant_id": [
      {
        "file_name": "drivers_license.pdf",
        "file_size": 2048576,
        "mime_type": "application/pdf",
        "upload_date": "2023-12-21T10:30:45.123Z"
      }
    ]
  }
}
``` 