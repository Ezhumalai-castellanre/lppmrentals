import React from 'react';
import { Button } from '@/components/ui/button';
import { EnhancedPDFGenerator } from '@/lib/pdf-generator-enhanced';
import { Download, Eye } from 'lucide-react';

export function PDFTest() {
  const sampleFormData = {
    application: {
      buildingAddress: "122 East 42nd Street",
      apartmentNumber: "4F",
      moveInDate: "2024-02-01",
      monthlyRent: 3500,
      apartmentType: "1 Bedroom",
      howDidYouHear: "Other",
      howDidYouHearOther: "Social Media Advertisement",
      landlordTenantLegalAction: "yes",
      landlordTenantLegalActionExplanation: "Had a dispute with previous landlord over security deposit in 2022. Case was resolved amicably.",
      brokenLease: "no",
      brokenLeaseExplanation: ""
    },
    applicant: {
      name: "John Michael Smith",
      dob: "1990-05-15",
      ssn: "123-45-6789",
      phone: "(555) 123-4567",
      email: "john.smith@email.com",
      license: "DL123456789",
      licenseState: "NY",
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      lengthAtAddress: "2 years",
      landlordName: "Jane Doe",
      currentRent: 2800,
      reasonForMoving: "Job relocation to Manhattan",
      // Landlord Information
      landlordAddressLine1: "456 Landlord Street",
      landlordAddressLine2: "Apt 2B",
      landlordCity: "New York",
      landlordState: "NY",
      landlordZipCode: "10002",
      landlordPhone: "(555) 987-6543",
      landlordEmail: "jane.doe@landlord.com",
      // Employment & Financial
      employer: "Tech Corp International",
      position: "Senior Software Engineer",
      employmentStart: "2020-01-15",
      income: 85000,
      otherIncome: 5000,
      otherIncomeSource: "Freelance web development",
      // Bank Records - Two accounts
      bankRecords: [
        {
          bankName: "Chase Bank",
          accountType: "Checking",
          accountNumber: "1234567890",
          routingNumber: "021000021",
          balance: "5000.00"
        },
        {
          bankName: "Bank of America",
          accountType: "Savings",
          accountNumber: "0987654321",
          routingNumber: "026009593",
          balance: "15000.00"
        }
      ]
    },
    coApplicant: {
      name: "Jane Elizabeth Smith",
      dob: "1992-08-20",
      ssn: "987-65-4321",
      phone: "(555) 987-6543",
      email: "jane.smith@email.com",
      license: "DL987654321",
      licenseState: "NY",
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      lengthAtAddress: "2 years",
      landlordName: "Jane Doe",
      currentRent: 2800,
      reasonForMoving: "Job relocation to Manhattan",
      // Landlord Information
      landlordAddressLine1: "456 Landlord Street",
      landlordAddressLine2: "Apt 2B",
      landlordCity: "New York",
      landlordState: "NY",
      landlordZipCode: "10002",
      landlordPhone: "(555) 987-6543",
      landlordEmail: "jane.doe@landlord.com",
      // Employment & Financial
      employer: "Design Studio Creative",
      position: "Senior UX Designer",
      employmentStart: "2021-03-10",
      income: 75000,
      otherIncome: 3000,
      otherIncomeSource: "Freelance graphic design",
      // Bank Records - Two accounts
      bankRecords: [
        {
          bankName: "Bank of America",
          accountType: "Savings",
          accountNumber: "0987654321",
          routingNumber: "026009593",
          balance: "8000.00"
        },
        {
          bankName: "Citibank",
          accountType: "Checking",
          accountNumber: "1122334455",
          routingNumber: "021000089",
          balance: "3000.00"
        }
      ]
    },
    guarantor: {
      name: "Robert William Johnson",
      dob: "1965-12-10",
      ssn: "456-78-9012",
      phone: "(555) 456-7890",
      email: "robert.johnson@email.com",
      license: "DL456789012",
      licenseState: "CA",
      address: "456 Oak Avenue",
      city: "Los Angeles",
      state: "CA",
      zip: "90210",
      lengthAtAddress: "10 years",
      landlordName: "Mike Wilson",
      currentRent: 0,
      reasonForMoving: "N/A - Property owner",
      // Landlord Information
      landlordAddressLine1: "789 Oak Street",
      landlordAddressLine2: "",
      landlordCity: "Los Angeles",
      landlordState: "CA",
      landlordZipCode: "90211",
      landlordPhone: "(555) 111-2222",
      landlordEmail: "mike.wilson@landlord.com",
      // Employment & Financial
      employer: "Johnson Enterprises LLC",
      position: "CEO & Founder",
      employmentStart: "2000-01-01",
      income: 200000,
      otherIncome: 50000,
      otherIncomeSource: "Investment returns and consulting",
      // Bank Records - Two accounts
      bankRecords: [
        {
          bankName: "Wells Fargo",
          accountType: "Multiple",
          accountNumber: "5556667777",
          routingNumber: "121000248",
          balance: "50000.00"
        },
        {
          bankName: "Chase Private Client",
          accountType: "Investment",
          accountNumber: "9998887777",
          routingNumber: "021000021",
          balance: "100000.00"
        }
      ]
    },
    signatures: {
      applicant: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      coApplicant: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      guarantor: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    },
    occupants: [
      {
        name: "Baby Emma Smith",
        relationship: "Child",
        dob: "2022-03-15",
        ssn: "",
        age: "2",
        sex: "Female"
      },
      {
        name: "Max Smith",
        relationship: "Pet",
        dob: "2020-06-10",
        ssn: "",
        age: "4",
        sex: "Male"
      }
    ],
    // JSON Payload for reference
    jsonPayload: {
      applicationId: "APP-2024-001",
      submissionDate: "2024-01-15T10:30:00Z",
      status: "Submitted",
      totalApplicants: 3,
      totalOccupants: 2,
      totalBankAccounts: 6,
      processingFee: 150,
      estimatedProcessingTime: "3-5 business days"
    }
  };

  const generateEnhancedPDF = () => {
    try {
      const pdfGenerator = new EnhancedPDFGenerator();
      const pdfData = pdfGenerator.generatePDF(sampleFormData);
      
      // Download the PDF
      const link = document.createElement('a');
      link.href = pdfData;
      link.download = 'complete-rental-application.pdf';
      link.click();
    } catch (error) {
      console.error('Error generating enhanced PDF:', error);
    }
  };

  const previewPDF = () => {
    try {
      const pdfGenerator = new EnhancedPDFGenerator();
      const pdfData = pdfGenerator.generatePDF(sampleFormData);
      
      // Open in new window
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Complete PDF Preview</title></head>
            <body style="margin:0;padding:0;">
              <embed src="${pdfData}" type="application/pdf" width="100%" height="100%">
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Error generating PDF preview:', error);
    }
  };

  const downloadJSON = () => {
    const jsonData = JSON.stringify(sampleFormData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'complete-application-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Complete Application PDF Test</h2>
      <p className="text-gray-600">
        Test the enhanced PDF generator with comprehensive data including all fields, multiple bank accounts, occupants, and JSON payload.
      </p>
      
      <div className="flex gap-4 flex-wrap">
        <Button onClick={generateEnhancedPDF} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Complete PDF
        </Button>
        
        <Button onClick={previewPDF} variant="outline" className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Preview PDF
        </Button>

        <Button onClick={downloadJSON} variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download JSON Data
        </Button>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Complete Test Data Includes:</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>Application Info:</strong> All fields including "Other" source and legal explanations</li>
          <li>• <strong>Primary Applicant:</strong> Complete personal, landlord, employment, and 2 bank accounts</li>
          <li>• <strong>Co-Applicant:</strong> Complete personal, landlord, employment, and 2 bank accounts</li>
          <li>• <strong>Guarantor:</strong> Complete personal, landlord, employment, and 2 bank accounts</li>
          <li>• <strong>Occupants:</strong> Child and pet information</li>
          <li>• <strong>Digital Signatures:</strong> For all three parties</li>
          <li>• <strong>JSON Payload:</strong> Application metadata and processing information</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2 text-blue-900">Data Summary:</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Total Bank Accounts:</strong> 6 (2 per person)</p>
          <p>• <strong>Total Occupants:</strong> 2 (1 child, 1 pet)</p>
          <p>• <strong>Complete Landlord Info:</strong> For all 3 parties</p>
          <p>• <strong>Legal Explanations:</strong> Detailed responses included</p>
          <p>• <strong>Security:</strong> Account numbers masked (last 4 digits only)</p>
        </div>
      </div>
    </div>
  );
} 