# Rental Application Form Data - Step-by-Step Breakdown

Based on the form structure with 13 steps (0-12), here's how the JSON data is organized by step:

## Step 0: Instructions
*No form data - just instructions page*

## Step 1: Application Info
```json
{
  "buildingAddress": "East 30th Street",
  "apartmentNumber": "12A",
  "moveInDate": "2025-08-11T18:30:00.000Z",
  "monthlyRent": 4300,
  "apartmentType": "STD",
  "howDidYouHear": "Building Sign"
}
```

## Step 2: Primary Applicant
```json
{
  "applicantName": "Ezhumalai Perumal",
  "applicantDob": "2025-07-31T18:30:00.000Z",
  "applicantSsn": "455455433",
  "applicantPhone": "+17806980137",
  "applicantEmail": "ezhumalaisanjay05@gmail.com",
  "applicantLicense": "45544",
  "applicantLicenseState": "TN",
  "applicantAddress": "Kallakurichi",
  "applicantCity": "Franklin",
  "applicantState": "TN",
  "applicantZip": "60620",
  "applicantLengthAtAddressYears": 54,
  "applicantLengthAtAddressMonths": 5,
  "applicantLandlordName": "sanajy",
  "applicantLandlordAddressLine1": "Kallakurichi",
  "applicantLandlordAddressLine2": "raja stree",
  "applicantLandlordCity": "Franklin",
  "applicantLandlordState": "TN",
  "applicantLandlordZipCode": "60620",
  "applicantLandlordPhone": "8754305360",
  "applicantLandlordEmail": "ezhumalaisanjay05@gmail.com",
  "applicantCurrentRent": 45654,
  "applicantReasonForMoving": "test"
}
```

## Step 3: Financial Info (Primary Applicant)
```json
{
  "applicantEmploymentType": "salaried",
  "applicantPosition": "developer",
  "applicantStartDate": null,
  "bankInformation": {
    "applicant": {
      "bankRecords": [
        {
          "bankName": "HDFC",
          "accountType": "savings"
        }
      ],
      "totalBankRecords": 1,
      "hasBankRecords": true
    }
  }
}
```

## Step 4: Supporting Documents (Primary Applicant)
```json
{
  "documents": {
    "applicant": {
      "photo_id": [
        {
          "filename": "drivers_license_john_doe.pdf",
          "webhookbodyUrl": "https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/LPPM-20250115-12345/drivers_license_john_doe.pdf"
        }
      ]
    }
  }
}
```

## Step 5: Co-Applicant
```json
{
  "hasCoApplicant": true,
  "coApplicantName": "Ezhumalai Perumal",
  "coApplicantRelationship": "partner",
  "coApplicantDob": "2025-08-06T18:30:00.000Z",
  "coApplicantSsn": "456544554",
  "coApplicantPhone": "+17806980137",
  "coApplicantEmail": "ezhumalaisanjay05@gmail.com",
  "coApplicantLicense": "445544",
  "coApplicantLicenseState": "TN",
  "coApplicantCity": "Jackson",
  "coApplicantState": "TN",
  "coApplicantZip": "60620",
  "coApplicantLengthAtAddressYears": 4,
  "coApplicantLengthAtAddressMonths": 4,
  "coApplicantLandlordName": "sanjay",
  "coApplicantLandlordAddressLine1": "Kallakurichi, raja stree",
  "coApplicantLandlordAddressLine2": "raja stree",
  "coApplicantLandlordCity": "Johnson City",
  "coApplicantLandlordState": "TN",
  "coApplicantLandlordZipCode": "60620",
  "coApplicantLandlordPhone": "8754305360",
  "coApplicantLandlordEmail": "ezhumalaisanjay05@gmail.com",
  "coApplicantCurrentRent": 4554,
  "coApplicantReasonForMoving": "yeys"
}
```

## Step 6: Co-Applicant Financial
```json
{
  "coApplicantEmploymentType": "salaried",
  "coApplicantPosition": "devloepr",
  "coApplicantStartDate": null,
  "bankInformation": {
    "coApplicant": {
      "bankRecords": [
        {
          "bankName": "HDFC",
          "accountType": "savings"
        }
      ],
      "totalBankRecords": 1,
      "hasBankRecords": true
    }
  }
}
```

## Step 7: Co-Applicant Documents
```json
{
  "documents": {
    "coApplicant": {
      "photo_id": [
        {
          "filename": "drivers_license_john_doe.pdf",
          "webhookbodyUrl": "https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/LPPM-20250115-12345/drivers_license_john_doe.pdf"
        }
      ]
    }
  }
}
```

## Step 8: Other Occupants
```json
{
  "otherOccupants": [
    {
      "name": "sanjay",
      "relationship": "sd",
      "dob": "2025-08-05T18:30:00.000Z",
      "ssn": "345434543",
      "license": "34543",
      "age": 0,
      "ssnDocument": null,
      "ssnEncryptedDocument": null
    }
  ],
  "documents": {
    "otherOccupants": {
      "social_security1": [
        {
          "filename": "ssn_card_john_doe.pdf",
          "webhookbodyUrl": "https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/LPPM-20250115-12345/ssn_card_john_doe.pdf"
        }
      ],
      "social_security2": [
        {
          "filename": "ssn_card_john_doe.pdf",
          "webhookbodyUrl": "https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/LPPM-20250115-12345/ssn_card_john_doe.pdf"
        }
      ]
    }
  }
}
```

## Step 9: Guarantor
```json
{
  "hasGuarantor": true,
  "guarantorName": "Ezhumalai Sanjay",
  "guarantorRelationship": "partner",
  "guarantorDob": "2025-08-05T18:30:00.000Z",
  "guarantorSsn": "345434543",
  "guarantorPhone": "+18754305360",
  "guarantorEmail": "ezhumalaisanjay05@gmail.com",
  "guarantorLicense": "454334",
  "guarantorLicenseState": "TN",
  "guarantorAddress": "Kallakurichi, raja stree",
  "guarantorCity": "Murfreesboro",
  "guarantorState": "TN",
  "guarantorZip": "60620",
  "guarantorLengthAtAddressYears": 4,
  "guarantorLengthAtAddressMonths": 4,
  "guarantorLandlordName": "sanjay",
  "guarantorLandlordAddressLine1": "Kallakurichi, raja stree",
  "guarantorLandlordAddressLine2": "raja stree",
  "guarantorLandlordCity": "Murfreesboro",
  "guarantorLandlordState": "TN",
  "guarantorLandlordZipCode": "60620",
  "guarantorLandlordPhone": "8754305360",
  "guarantorLandlordEmail": "ezhumalaisanjay05@gmail.com",
  "guarantorCurrentRent": 454,
  "guarantorReasonForMoving": "tets"
}
```

## Step 10: Guarantor Financial
```json
{
  "guarantorEmploymentType": "salaried",
  "guarantorPosition": "dev",
  "guarantorStartDate": null,
  "bankInformation": {
    "guarantor": {
      "bankRecords": [
        {
          "bankName": "HDFC",
          "accountType": "savings"
        }
      ],
      "totalBankRecords": 1,
      "hasBankRecords": true
    }
  }
}
```

## Step 11: Guarantor Documents
```json
{
  "documents": {
    "guarantor": {
      "photo_id": [
        {
          "filename": "drivers_license_john_doe.pdf",
          "webhookbodyUrl": "https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/LPPM-20250115-12345/drivers_license_john_doe.pdf"
        }
      ]
    }
  }
}
```

## Step 12: Digital Signatures
```json
{
  "signatures": {
    "applicant": "SIGNED",
    "coApplicant": "SIGNED",
    "guarantor": "SIGNED"
  },
  "signatureTimestamps": {
    "applicant": "2025-08-08T08:39:28.566Z",
    "coApplicant": "2025-08-08T08:39:32.083Z",
    "guarantor": "2025-08-08T08:39:37.104Z"
  }
}
```

## Summary of Form Structure:

1. **Step 0**: Instructions (no data)
2. **Step 1**: Application Info (building, apartment, move-in date, rent)
3. **Step 2**: Primary Applicant (personal info, address, landlord info)
4. **Step 3**: Primary Applicant Financial (employment, bank info)
5. **Step 4**: Primary Applicant Documents (photo ID, etc.)
6. **Step 5**: Co-Applicant (personal info, address, landlord info)
7. **Step 6**: Co-Applicant Financial (employment, bank info)
8. **Step 7**: Co-Applicant Documents (photo ID, etc.)
9. **Step 8**: Other Occupants (additional people living in unit)
10. **Step 9**: Guarantor (personal info, address, landlord info)
11. **Step 10**: Guarantor Financial (employment, bank info)
12. **Step 11**: Guarantor Documents (photo ID, etc.)
13. **Step 12**: Digital Signatures (all parties sign)

## Conditional Steps:
- Steps 6-7 (Co-Applicant) are only available if `hasCoApplicant: true`
- Steps 10-11 (Guarantor) are only available if `hasGuarantor: true`
- Step 8 (Other Occupants) is always available but may be empty
