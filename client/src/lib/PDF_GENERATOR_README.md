# Comprehensive PDF Generator for Rental Applications

This PDF generator creates professional rental application PDFs with proper field mapping, alignment, and 20px padding on every page.

## Features

- **20px Padding**: Consistent 20px margins on all sides of every page
- **Field Mapping**: Maps all fields from your application data structure
- **Proper Alignment**: Professional table-based layout with consistent spacing
- **Page Breaks**: Automatic page breaks with headers on each page
- **Color Coding**: Professional color scheme with highlights for important information
- **Comprehensive Coverage**: Handles all applicant types (primary, co-applicants, guarantors, occupants)
- **Legal Disclaimer**: Includes complete legal text and certification requirements
- **Application Instructions**: Detailed requirements and document checklist

## Files

- `rental-application-pdf.js` - Main PDF generator class for rental applications
- `pdf-generator.ts` - Basic PDF generator class
- `pdf-generator-enhanced.ts` - Enhanced PDF generator with improved styling
- `PDF_GENERATOR_README.md` - This documentation

## Recent Fixes

- ✅ **Fixed co-applicants and guarantors display** - Added debugging and proper data processing
- ✅ **Added complete legal disclaimer** - "PLEASE READ CAREFULLY BEFORE SIGNING" section
- ✅ **Added application instructions** - Complete requirements and document checklist
- ✅ **Fixed header formatting** - Proper address and contact information layout
- ✅ **Added debugging logs** - Console logs to help troubleshoot data issues

## Usage

### Basic Usage

```typescript
import { RentalApplicationPDF } from './rental-application-pdf';

const pdfGenerator = new RentalApplicationPDF();
const pdfDoc = pdfGenerator.generate(applicationData);

// Convert to data URL and download the PDF
const pdfDataUri = pdfDoc.output('dataurlstring');
const link = document.createElement('a');
link.href = pdfDataUri;
link.download = 'rental-application.pdf';
link.click();
```

### Using the Enhanced Generator

```typescript
import { EnhancedPDFGenerator } from './pdf-generator-enhanced';

const pdfGenerator = new EnhancedPDFGenerator();
const pdfDataUri = pdfGenerator.generatePDF(applicationData);
// Download logic...
```

### Testing the Generator

```typescript
import { RentalApplicationPDF } from './rental-application-pdf';

// Test with sample data
const pdfGenerator = new RentalApplicationPDF();
const pdfDoc = pdfGenerator.generate(sampleData);
const pdfDataUri = pdfDoc.output('dataurlstring');
```

## Data Structure

The generator expects data in this format:

```typescript
interface ApplicationData {
  reference_id: string;
  application_id: string;
  form_data: {
    application: {
      buildingAddress: string;
      apartmentNumber: string;
      apartmentType: string;
      monthlyRent: number;
      moveInDate: string;
      howDidYouHear: string;
      howDidYouHearOther: string;
    };
    applicant: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      zip: string;
      dob: string;
      ssn: string;
      license: string;
      licenseState: string;
      lengthAtAddressYears: number;
      lengthAtAddressMonths: number;
      landlordName: string;
      landlordAddressLine1: string;
      landlordAddressLine2: string;
      landlordCity: string;
      landlordState: string;
      landlordZipCode: string;
      landlordPhone: string;
      landlordEmail: string;
      currentRent: number;
      reasonForMoving: string;
      age: number;
      employmentType: string;
      position: string;
      employmentStart: string | null;
      income: string;
      incomeFrequency: string;
      businessName: string;
      businessType: string;
      yearsInBusiness: string;
      otherIncome: string;
      otherIncomeFrequency: string;
      otherIncomeSource: string;
      bankRecords: Array<{
        bankName: string;
        accountType: string;
      }>;
    };
    coApplicants: Array<any>;
    guarantors: Array<any>;
    occupants: Array<any>;
    applicantName: string;
    applicantEmail: string;
    application_id: string;
    applicantId: string;
    zoneinfo: string;
    hasCoApplicant: boolean;
    hasGuarantor: boolean;
  };
}
```

## PDF Structure

The generated PDF includes:

1. **Header**: Company logo, name, and contact information
2. **Application Information**: Basic application details
3. **Application Instructions**: Complete requirements and document checklist
4. **Primary Applicant**: Personal and financial information
5. **Co-Applicants**: Information for each co-applicant
6. **Guarantors**: Information for each guarantor
7. **Occupants**: Additional occupants information
8. **Document Summary**: Summary of all applicants and documents
9. **Legal Disclaimer**: "PLEASE READ CAREFULLY BEFORE SIGNING" section
10. **Footer**: Generation timestamp and company information

## Troubleshooting

### Co-Applicants/Guarantors Not Showing

If co-applicants or guarantors are not displaying:

1. **Check console logs**: The generator now includes debug logging
2. **Verify data structure**: Ensure `coApplicants` and `guarantors` are arrays
3. **Check data format**: Ensure each person object has required fields
4. **Use the main generator**: Use `RentalApplicationPDF` class for comprehensive functionality

### Debug Information

The generator now includes console logging:
- Data structure validation
- Co-applicants processing
- Guarantors processing
- Error handling

## Styling Features

- **Colors**: Professional blue, gray, and gold color scheme
- **Typography**: Consistent font sizes and weights
- **Layout**: Table-based layout with proper spacing
- **Highlights**: Important fields are highlighted
- **Borders**: Subtle borders and background colors for readability

## Page Management

- **Automatic Page Breaks**: Content automatically flows to new pages
- **Page Headers**: Company name and page numbers on each page
- **Consistent Margins**: 20px padding maintained across all pages
- **Content Flow**: Seamless content flow between pages

## Customization

To customize the PDF generator:

1. Modify colors in the constructor
2. Adjust spacing values
3. Add new sections or fields
4. Modify the layout structure

## Dependencies

- `jspdf`: PDF generation library
- TypeScript support for type safety

## Example Output

The generator creates a professional PDF with:
- Company branding and header
- Well-organized sections for each applicant type
- Proper field labels and values
- Professional formatting and colors
- Consistent spacing and alignment
- Page numbers and navigation
- Complete legal disclaimer
- Application instructions and requirements

## Error Handling

- Gracefully handles missing or null values
- Shows "Not provided" for missing information
- Continues processing even with incomplete data
- Maintains PDF structure regardless of data completeness
- Includes debugging information for troubleshooting
