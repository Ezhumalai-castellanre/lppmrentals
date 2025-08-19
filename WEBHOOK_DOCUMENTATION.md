# Webhook Documentation

## Overview

The rental application system uses a single webhook endpoint for all data submissions to Make.com:

**Webhook URL**: `https://hook.us1.make.com/2vu8udpshhdhjkoks8gchub16wjp7cu3`

## Webhook Endpoints

### 1. File Upload Webhook

**Purpose**: Sends individual files immediately upon upload

**Method**: `POST`

**Data Structure**:
```json
{
  "reference_id": "string",
  "file_name": "string", 
  "section_name": "string",
  "document_name": "string",
  "file_base64": "string",
  "application_id": "string"
}
```

**Example**:
```json
{
  "reference_id": "app_1753614017419_dpl49y6le",
  "file_name": "rental-application-2025-07-25.pdf",
  "section_name": "supporting_w9_forms",
  "document_name": "w9_forms",
  "file_base64": "JVBERi0xLjQKJcOkw7zDtsO...",
  "application_id": "app_1753614017419_6mo3fvns7"
}
```

**Triggered When**: User uploads any document in the form

---

### 2. Form Data Webhook

**Purpose**: Sends complete form data without PDF

**Method**: `POST`

**Data Structure**:
```json
{
  "reference_id": "string",
  "application_id": "string",
  "form_data": {
    // Complete form data structure
  },
  "uploaded_files": {
    "section_name": [
      {
        "file_name": "string",
        "file_size": "number",
        "mime_type": "string", 
        "upload_date": "string"
      }
    ]
  },
  "submission_type": "form_data"
}
```

**Example**:
```json
{
  "reference_id": "app_1753614017419_dpl49y6le",
  "application_id": "app_1753614017419_6mo3fvns7",
  "form_data": {
    "buildingAddress": "2 Osbourne Terrace - Retail",
    "apartmentNumber": "ST3",
    "moveInDate": "2025-07-28T18:30:00.000Z",
    "monthlyRent": "1500",
    "apartmentType": "STR",
    "howDidYouHear": "Broker",
    "applicantName": "John Doe",
    "applicantDob": "1990-01-01",
    "applicantSsn": "123-45-6789",
    "applicantPhone": "+1-555-123-4567",
    "applicantEmail": "john.doe@example.com",
    "applicantLicense": "DL123456789",
    "applicantLicenseState": "CA",
    "applicantAddress": "456 Current St",
    "applicantCity": "Los Angeles",
    "applicantState": "CA",
    "applicantZip": "90210",
    "applicantLengthAtAddressYears": "2",
    "applicantLengthAtAddressMonths": "6",
    "applicantLandlordName": "Jane Smith",
    "applicantLandlordAddressLine1": "789 Landlord Ave",
    "applicantLandlordAddressLine2": "Suite 100",
    "applicantLandlordCity": "Los Angeles",
    "applicantLandlordState": "CA",
    "applicantLandlordZipCode": "90211",
    "applicantLandlordPhone": "+1-555-987-6543",
    "applicantLandlordEmail": "jane.smith@example.com",
    "applicantCurrentRent": "1200",
    "applicantReasonForMoving": "Job relocation",
    "applicantEmploymentType": "Full-time",
    "applicantEmployerName": "Tech Corp",
    "applicantEmployerAddress": "321 Business Blvd",
    "applicantEmployerCity": "Los Angeles",
    "applicantEmployerState": "CA",
    "applicantEmployerZip": "90212",
    "applicantEmployerPhone": "+1-555-456-7890",
    "applicantPosition": "Software Engineer",
    "applicantStartDate": "2022-01-01",
    "applicantSalary": "80000",
    "applicantBankRecords": [
      {
        "bankName": "Chase Bank",
        "accountNumber": "****1234",
        "accountType": "Checking",
        "balance": "5000"
      }
    ],
    "hasCoApplicant": true,
    "coApplicantName": "Jane Doe",
    "coApplicantRelationship": "Spouse",
    "coApplicantDob": "1992-05-15",
    "coApplicantSsn": "987-65-4321",
    "coApplicantPhone": "+1-555-111-2222",
    "coApplicantEmail": "jane.doe@example.com",
    "coApplicantLicense": "DL987654321",
    "coApplicantLicenseState": "CA",
    "coApplicantAddress": "456 Current St",
    "coApplicantCity": "Los Angeles",
    "coApplicantState": "CA",
    "coApplicantZip": "90210",
    "coApplicantLengthAtAddressYears": "2",
    "coApplicantLengthAtAddressMonths": "6",
    "coApplicantLandlordName": "Jane Smith",
    "coApplicantLandlordAddressLine1": "789 Landlord Ave",
    "coApplicantLandlordAddressLine2": "Suite 100",
    "coApplicantLandlordCity": "Los Angeles",
    "coApplicantLandlordState": "CA",
    "coApplicantLandlordZipCode": "90211",
    "coApplicantLandlordPhone": "+1-555-987-6543",
    "coApplicantLandlordEmail": "jane.smith@example.com",
    "coApplicantCurrentRent": "1200",
    "coApplicantReasonForMoving": "Job relocation",
    "coApplicantEmploymentType": "Full-time",
    "coApplicantEmployerName": "Design Studio",
    "coApplicantEmployerAddress": "654 Creative Way",
    "coApplicantEmployerCity": "Los Angeles",
    "coApplicantEmployerState": "CA",
    "coApplicantEmployerZip": "90213",
    "coApplicantEmployerPhone": "+1-555-333-4444",
    "coApplicantPosition": "UI Designer",
    "coApplicantStartDate": "2021-06-01",
    "coApplicantSalary": "70000",
    "coApplicantBankRecords": [
      {
        "bankName": "Wells Fargo",
        "accountNumber": "****5678",
        "accountType": "Savings",
        "balance": "8000"
      }
    ],
    "hasGuarantor": true,
    "guarantorName": "Bob Smith",
    "guarantorRelationship": "Parent",
    "guarantorDob": "1965-08-20",
    "guarantorSsn": "111-22-3333",
    "guarantorPhone": "+1-555-999-8888",
    "guarantorEmail": "bob.smith@example.com",
    "guarantorAddress": "999 Parent St",
    "guarantorCity": "San Francisco",
    "guarantorState": "CA",
    "guarantorZip": "94102",
    "guarantorLengthAtAddressYears": "10",
    "guarantorLengthAtAddressMonths": "0",
    "guarantorLandlordName": "Homeowner",
    "guarantorLandlordAddressLine1": "999 Parent St",
    "guarantorLandlordAddressLine2": "",
    "guarantorLandlordCity": "San Francisco",
    "guarantorLandlordState": "CA",
    "guarantorLandlordZipCode": "94102",
    "guarantorLandlordPhone": "+1-555-999-8888",
    "guarantorLandlordEmail": "bob.smith@example.com",
    "guarantorCurrentRent": "0",
    "guarantorReasonForMoving": "N/A",
    "guarantorEmploymentType": "Full-time",
    "guarantorEmployerName": "Finance Corp",
    "guarantorEmployerAddress": "888 Finance Ave",
    "guarantorEmployerCity": "San Francisco",
    "guarantorEmployerState": "CA",
    "guarantorEmployerZip": "94103",
    "guarantorEmployerPhone": "+1-555-777-6666",
    "guarantorPosition": "Financial Manager",
    "guarantorStartDate": "2010-01-01",
    "guarantorSalary": "120000",
    "guarantorBankRecords": [
      {
        "bankName": "Bank of America",
        "accountNumber": "****9999",
        "accountType": "Checking",
        "balance": "25000"
      }
    ],
    "otherOccupants": [
      {
        "name": "Baby Doe",
        "relationship": "Child",
        "dob": "2020-03-20",
        "ssn": "444-55-6666",
        "license": "",
        "age": "3",
        "ssnDocument": null,
        "ssnEncryptedDocument": null
      }
    ],
    "landlordTenantLegalAction": "No",
    "landlordTenantLegalActionExplanation": "",
    "brokenLease": "No",
    "brokenLeaseExplanation": "",
    "signatures": {
      "applicant": "SIGNED",
      "coApplicant": "SIGNED",
      "guarantor": "SIGNED"
    },
    "signatureTimestamps": {
      "applicant": "2025-01-27T10:31:19.662Z",
      "coApplicant": "2025-01-27T10:31:19.662Z",
      "guarantor": "2025-01-27T10:31:19.662Z"
    },
    "documents": {
      "supporting_w9_forms": { "count": 1 },
      "supporting_photo_id": { "count": 1 },
      "supporting_social_security": { "count": 1 },
      "supporting_bank_statement": { "count": 1 },
      "supporting_tax_returns": { "count": 1 },
      "supporting_employment_letter": { "count": 1 },
      "supporting_pay_stubs": { "count": 1 },
      "supporting_credit_report": { "count": 1 },
      "coApplicant_w9_forms": { "count": 1 },
      "coApplicant_photo_id": { "count": 1 },
      "coApplicant_social_security": { "count": 1 },
      "coApplicant_bank_statement": { "count": 1 },
      "coApplicant_tax_returns": { "count": 1 },
      "coApplicant_employment_letter": { "count": 1 },
      "coApplicant_pay_stubs": { "count": 1 },
      "coApplicant_credit_report": { "count": 1 },
      "guarantor_w9_forms": { "count": 1 },
      "guarantor_photo_id": { "count": 1 },
      "guarantor_social_security": { "count": 1 },
      "guarantor_bank_statement": { "count": 1 },
      "guarantor_tax_returns": { "count": 1 },
      "guarantor_employment_letter": { "count": 1 },
      "guarantor_pay_stubs": { "count": 1 },
      "guarantor_credit_report": { "count": 1 },
      "other_occupants_identity": { "count": 1 }
    },
    "encryptedDocuments": {
      "supporting_w9_forms": { "count": 1 },
      "supporting_photo_id": { "count": 1 },
      "supporting_social_security": { "count": 1 },
      "supporting_bank_statement": { "count": 1 },
      "supporting_tax_returns": { "count": 1 },
      "supporting_employment_letter": { "count": 1 },
      "supporting_pay_stubs": { "count": 1 },
      "supporting_credit_report": { "count": 1 },
      "coApplicant_w9_forms": { "count": 1 },
      "coApplicant_photo_id": { "count": 1 },
      "coApplicant_social_security": { "count": 1 },
      "coApplicant_bank_statement": { "count": 1 },
      "coApplicant_tax_returns": { "count": 1 },
      "coApplicant_employment_letter": { "count": 1 },
      "coApplicant_pay_stubs": { "count": 1 },
      "coApplicant_credit_report": { "count": 1 },
      "guarantor_w9_forms": { "count": 1 },
      "guarantor_photo_id": { "count": 1 },
      "guarantor_social_security": { "count": 1 },
      "guarantor_bank_statement": { "count": 1 },
      "guarantor_tax_returns": { "count": 1 },
      "guarantor_employment_letter": { "count": 1 },
      "guarantor_pay_stubs": { "count": 1 },
      "guarantor_credit_report": { "count": 1 },
      "other_occupants_identity": { "count": 1 }
    }
  },
  "uploaded_files": {
    "supporting_w9_forms": [
      {
        "file_name": "rental-application-2025-07-23 (1).pdf",
        "file_size": 3708552,
        "mime_type": "application/pdf",
        "upload_date": "2025-07-27T10:31:19.662Z"
      }
    ],
    "supporting_photo_id": [
      {
        "file_name": "rental-application-2025-07-23.pdf",
        "file_size": 3708555,
        "mime_type": "application/pdf",
        "upload_date": "2025-07-27T10:31:23.312Z"
      }
    ]
  },
  "submission_type": "form_data"
}
```

**Triggered When**: Form is submitted (without PDF)

---

### 3. PDF Generation Webhook

**Purpose**: Sends generated PDF separately

**Method**: `POST`

**Data Structure**:
```json
{
  "reference_id": "string",
  "application_id": "string",
  "file_name": "string",
  "file_base64": "string",
  "submission_type": "pdf_generation"
}
```

**Example**:
```json
{
  "reference_id": "app_1753614017419_dpl49y6le",
  "application_id": "app_1753614017419_6mo3fvns7",
  "file_name": "rental-application-2025-07-27.pdf",
  "file_base64": "JVBERi0xLjQKJcOkw7zDtsO...",
  "submission_type": "pdf_generation"
}
```

**Triggered When**: PDF is generated and sent separately

---

### 4. Combined Submission Webhook

**Purpose**: Sends form data + PDF in single request (preferred method)

**Method**: `POST`

**Data Structure**:
```json
{
  "reference_id": "string",
  "application_id": "string",
  "form_data": {
    // Complete form data structure (same as Form Data Webhook)
  },
  "uploaded_files": {
    // File metadata (same as Form Data Webhook)
  },
  "pdf_base64": "string",
  "pdf_filename": "string",
  "submission_type": "combined_submission"
}
```

**Example**:
```json
{
  "reference_id": "app_1753614017419_dpl49y6le",
  "application_id": "app_1753614017419_6mo3fvns7",
  "form_data": {
    // Complete form data (same structure as above)
  },
  "uploaded_files": {
    // File metadata (same structure as above)
  },
  "pdf_base64": "JVBERi0xLjQKJcOkw7zDtsO...",
  "pdf_filename": "rental-application-2025-07-27.pdf",
  "submission_type": "combined_submission"
}
```

**Triggered When**: Form is submitted with PDF generation

---

## Data Flow

### 1. File Upload Process
```
User uploads file → File Upload Webhook → Make.com receives file
```

### 2. Form Submission Process
```
User submits form → Combined Submission Webhook → Make.com receives form + PDF
```

### 3. Fallback Process (if payload too large)
```
User submits form → Form Data Webhook → PDF Generation Webhook → Make.com receives separately
```

## Field Descriptions

### Application Info
- `buildingAddress`: Building address
- `apartmentNumber`: Apartment/unit number
- `moveInDate`: Planned move-in date (ISO string)
- `monthlyRent`: Monthly rent amount
- `apartmentType`: Type of apartment (1BR, 2BR, etc.)
- `howDidYouHear`: How applicant heard about the property

### Applicant Info
- `applicantName`: Full name
- `applicantDob`: Date of birth (ISO string)
- `applicantSsn`: Social Security Number
- `applicantPhone`: Phone number
- `applicantEmail`: Email address
- `applicantLicense`: Driver's license number
- `applicantLicenseState`: License state
- `applicantAddress`: Current address
- `applicantCity`: Current city
- `applicantState`: Current state
- `applicantZip`: Current zip code

### Employment Info
- `applicantEmploymentType`: Employment type (Full-time, Part-time, etc.)
- `applicantEmployerName`: Employer name
- `applicantEmployerAddress`: Employer address
- `applicantEmployerCity`: Employer city
- `applicantEmployerState`: Employer state
- `applicantEmployerZip`: Employer zip
- `applicantEmployerPhone`: Employer phone
- `applicantPosition`: Job position
- `applicantStartDate`: Employment start date
- `applicantSalary`: Annual salary

### Bank Records
- `applicantBankRecords`: Array of bank account information
  - `bankName`: Bank name
  - `accountNumber`: Masked account number
  - `accountType`: Account type (Checking, Savings)
  - `balance`: Account balance

### Co-Applicant & Guarantor
- Same structure as applicant with `coApplicant` or `guarantor` prefix
- `hasCoApplicant`: Boolean flag
- `hasGuarantor`: Boolean flag

### Documents
- `documents`: Metadata about uploaded documents (count only)
- `encryptedDocuments`: Metadata about encrypted documents (count only)
- `signatures`: Signature status indicators ("SIGNED" or null)
- `signatureTimestamps`: Timestamps of signatures

## Error Handling

### CORS Errors
If CORS errors occur, the system will return:
```json
{
  "success": false,
  "error": "CORS error: Cannot connect to webhook from browser. Try using a browser extension or server-side proxy."
}
```

### Payload Size Errors
If payload is too large (>50MB), the system will:
1. Try to send form data without PDF
2. Send PDF separately if form data succeeds
3. Return error if both fail

### Response Format
All webhook responses follow this format:
```json
{
  "success": true|false,
  "error": "error message if success is false"
}
```

## Testing

### Test Webhook Structure
Use the "Test Webhook Structure" button in the form to send a simplified test payload:

```json
{
  "reference_id": "app_1753603752619_h6828nxmj",
  "application_id": "app_1753603752619_2nlq8iowi",
  "submission_type": "form_data",
  "building_address": "123 Test Street",
  "apartment_number": "Apt 1",
  "applicant_name": "John Doe",
  "applicant_email": "john.doe@example.com",
  "has_co_applicant": true,
  "co_applicant_name": "Jane Doe",
  "has_guarantor": true,
  "guarantor_name": "Bob Smith",
  "applicant_signed": "SIGNED",
  "supporting_documents_count": 8,
  "submission_timestamp": "2024-01-15T..."
}
```

## Make.com Integration

The webhook endpoint `https://hook.us1.make.com/2vu8udpshhdhjkoks8gchub16wjp7cu3` should be configured in Make.com to:

1. **Receive webhook data** from the rental application
2. **Parse the JSON payload** based on `submission_type`
3. **Process form data** and store in database
4. **Handle file uploads** and store files
5. **Generate PDFs** if needed
6. **Send notifications** to relevant parties

## Security Considerations

- All sensitive data (SSN, bank info) is sent in the webhook payload
- Files are sent as base64-encoded strings
- Consider implementing webhook signature verification
- Use HTTPS for all webhook communications
- Implement rate limiting on the webhook endpoint 