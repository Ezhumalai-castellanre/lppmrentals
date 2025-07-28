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
      landlordTenantLegalActionExplanation: "Had a dispute with previous landlord over security deposit",
      brokenLease: "no",
      brokenLeaseExplanation: ""
    },
    applicant: {
      name: "John Smith",
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
      reasonForMoving: "Job relocation",
      // Landlord Information
      landlordAddressLine1: "456 Landlord Street",
      landlordAddressLine2: "Apt 2B",
      landlordCity: "New York",
      landlordState: "NY",
      landlordZipCode: "10002",
      landlordPhone: "(555) 987-6543",
      landlordEmail: "jane.doe@landlord.com",
      // Employment & Financial
      employer: "Tech Corp",
      position: "Software Engineer",
      employmentStart: "2020-01-15",
      income: 85000,
      otherIncome: 5000,
      otherIncomeSource: "Freelance work",
      // Bank Records
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
      name: "Jane Smith",
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
      reasonForMoving: "Job relocation",
      // Landlord Information
      landlordAddressLine1: "456 Landlord Street",
      landlordAddressLine2: "Apt 2B",
      landlordCity: "New York",
      landlordState: "NY",
      landlordZipCode: "10002",
      landlordPhone: "(555) 987-6543",
      landlordEmail: "jane.doe@landlord.com",
      // Employment & Financial
      employer: "Design Studio",
      position: "UX Designer",
      employmentStart: "2021-03-10",
      income: 75000,
      otherIncome: 0,
      otherIncomeSource: "",
      // Bank Records
      bankRecords: [
        {
          bankName: "Bank of America",
          accountType: "Savings",
          accountNumber: "0987654321",
          routingNumber: "026009593",
          balance: "8000.00"
        }
      ]
    },
    guarantor: {
      name: "Robert Johnson",
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
      reasonForMoving: "N/A",
      // Landlord Information
      landlordAddressLine1: "789 Oak Street",
      landlordAddressLine2: "",
      landlordCity: "Los Angeles",
      landlordState: "CA",
      landlordZipCode: "90211",
      landlordPhone: "(555) 111-2222",
      landlordEmail: "mike.wilson@landlord.com",
      // Employment & Financial
      employer: "Johnson Enterprises",
      position: "CEO",
      employmentStart: "2000-01-01",
      income: 200000,
      otherIncome: 50000,
      otherIncomeSource: "Investment returns",
      // Bank Records
      bankRecords: [
        {
          bankName: "Wells Fargo",
          accountType: "Multiple",
          accountNumber: "5556667777",
          routingNumber: "121000248",
          balance: "50000.00"
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
        name: "Baby Smith",
        relationship: "Child",
        dob: "2022-03-15",
        ssn: "",
        age: "2",
        sex: "Female"
      }
    ]
  };

  const generateEnhancedPDF = () => {
    try {
      const pdfGenerator = new EnhancedPDFGenerator();
      const pdfData = pdfGenerator.generatePDF(sampleFormData);
      
      // Download the PDF
      const link = document.createElement('a');
      link.href = pdfData;
      link.download = 'enhanced-rental-application.pdf';
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
            <head><title>PDF Preview</title></head>
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

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">PDF Generator Test</h2>
      <p className="text-gray-600">
        Test the enhanced PDF generator with sample data including all new fields.
      </p>
      
      <div className="flex gap-4">
        <Button onClick={generateEnhancedPDF} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Enhanced PDF
        </Button>
        
        <Button onClick={previewPDF} variant="outline" className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Preview PDF
        </Button>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Test Data Includes:</h3>
        <ul className="text-sm space-y-1">
          <li>• Application info with "Other" source and explanation</li>
          <li>• Complete landlord information for all parties</li>
          <li>• Multiple bank records with account numbers and balances</li>
          <li>• Legal questions with explanations</li>
          <li>• All personal and financial information</li>
        </ul>
      </div>
    </div>
  );
} 