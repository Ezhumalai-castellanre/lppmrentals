import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import { ResetPDFGenerator } from '@/lib/pdf-generator-reset';

export function PDFResetTest() {
  const generateResetPDF = () => {
    const pdfGenerator = new ResetPDFGenerator();
    
    const testData = {
      application: {
        buildingAddress: "123 Main Street",
        apartmentNumber: "4B",
        moveInDate: new Date('2024-03-15'),
        monthlyRent: 2500,
        apartmentType: "2 Bedroom",
        howDidYouHear: "Street Easy",
        howDidYouHearOther: ""
      },
      applicant: {
        name: "John Doe",
        dob: new Date('1990-05-15'),
        ssn: "123-45-6789",
        phone: "(555) 123-4567",
        email: "john.doe@email.com",
        license: "DL123456789",
        licenseState: "NY",
        address: "456 Current Street",
        city: "New York",
        state: "NY",
        zip: "10001",
        lengthAtAddress: "2 years 3 months",
        landlordName: "Jane Smith",
        currentRent: 2200,
        reasonForMoving: "Looking for a larger apartment",
        employer: "Tech Corp",
        position: "Software Engineer",
        employmentStart: new Date('2020-01-15'),
        income: 85000,
        otherIncome: 5000,
        otherIncomeSource: "Freelance work",
        bankRecords: [
          {
            bankName: "Chase Bank",
            accountType: "Checking",
            accountNumber: "1234567890"
          }
        ]
      },
      coApplicant: {
        name: "Jane Doe",
        dob: new Date('1992-08-20'),
        ssn: "987-65-4321",
        phone: "(555) 987-6543",
        email: "jane.doe@email.com",
        license: "DL987654321",
        licenseState: "NY",
        address: "456 Current Street",
        city: "New York",
        state: "NY",
        zip: "10001",
        lengthAtAddress: "2 years 3 months",
        landlordName: "Jane Smith",
        currentRent: 2200,
        reasonForMoving: "Looking for a larger apartment",
        employer: "Design Studio",
        position: "UI/UX Designer",
        employmentStart: new Date('2019-06-01'),
        income: 75000,
        otherIncome: 0,
        otherIncomeSource: "",
        bankRecords: [
          {
            bankName: "Bank of America",
            accountType: "Savings",
            accountNumber: "0987654321"
          }
        ]
      },
      guarantor: {
        name: "Robert Doe",
        dob: new Date('1965-12-10'),
        ssn: "111-22-3333",
        phone: "(555) 111-2222",
        email: "robert.doe@email.com",
        license: "DL111222333",
        licenseState: "NY",
        address: "789 Guarantor Street",
        city: "New York",
        state: "NY",
        zip: "10002",
        lengthAtAddress: "15 years",
        landlordName: "Self-owned",
        currentRent: 0,
        reasonForMoving: "N/A",
        employer: "Financial Corp",
        position: "Senior Manager",
        employmentStart: new Date('2010-03-01'),
        income: 120000,
        otherIncome: 15000,
        otherIncomeSource: "Investments",
        bankRecords: [
          {
            bankName: "Wells Fargo",
            accountType: "Checking",
            accountNumber: "5556667777"
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
          name: "Baby Doe",
          relationship: "Child",
          dob: new Date('2020-03-15'),
          ssn: "000-00-0000",
          driverLicense: "N/A",
          age: 4,
          sex: "Female"
        }
      ]
    };

    const pdfData = pdfGenerator.generatePDF(testData);
    
    // Download the PDF
    const link = document.createElement('a');
    link.href = pdfData;
    link.download = 'rental-application-reset.pdf';
    link.click();
  };

  const previewResetPDF = () => {
    const pdfGenerator = new ResetPDFGenerator();
    
    const testData = {
      application: {
        buildingAddress: "123 Main Street",
        apartmentNumber: "4B",
        moveInDate: new Date('2024-03-15'),
        monthlyRent: 2500,
        apartmentType: "2 Bedroom",
        howDidYouHear: "Other",
        howDidYouHearOther: "Friend recommendation"
      },
      applicant: {
        name: "John Doe",
        dob: new Date('1990-05-15'),
        ssn: "123-45-6789",
        phone: "(555) 123-4567",
        email: "john.doe@email.com",
        license: "DL123456789",
        licenseState: "NY",
        address: "456 Current Street",
        city: "New York",
        state: "NY",
        zip: "10001",
        lengthAtAddress: "2 years 3 months",
        landlordName: "Jane Smith",
        currentRent: 2200,
        reasonForMoving: "Looking for a larger apartment",
        employer: "Tech Corp",
        position: "Software Engineer",
        employmentStart: new Date('2020-01-15'),
        income: 85000,
        otherIncome: 5000,
        otherIncomeSource: "Freelance work",
        bankRecords: [
          {
            bankName: "Chase Bank",
            accountType: "Checking",
            accountNumber: "1234567890"
          }
        ]
      },
      signatures: {
        applicant: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      },
      occupants: []
    };

    const pdfData = pdfGenerator.generatePDF(testData);
    
    // Open in new window
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Reset PDF Generator Preview</title>
            <style>
              body { margin: 0; padding: 20px; background: #f5f5f5; }
              iframe { width: 100%; height: 90vh; border: 1px solid #ddd; border-radius: 8px; }
            </style>
          </head>
          <body>
            <h2>Reset PDF Generator - Clean Alignment Preview</h2>
            <iframe src="${pdfData}"></iframe>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reset PDF Generator Test</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Reset PDF Features:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>✅ Clean, professional alignment with consistent spacing</li>
            <li>✅ Improved color scheme with deep blue, gray, and accent colors</li>
            <li>✅ Better typography hierarchy and readability</li>
            <li>✅ Proper field row alignment with labels and values</li>
            <li>✅ Subtle borders and visual separation</li>
            <li>✅ Professional header with logo placeholder</li>
            <li>✅ Clean signature boxes with proper styling</li>
            <li>✅ Page headers and footers with company branding</li>
            <li>✅ Automatic page breaks with proper continuation</li>
            <li>✅ Text wrapping for long values</li>
            <li>✅ Highlighted important fields (income, rent)</li>
            <li>✅ Proper handling of missing data ("Not provided")</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={generateResetPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Download Reset PDF
          </Button>
          
          <Button 
            onClick={previewResetPDF}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview Reset PDF
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Key Improvements:</h3>
          <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
            <li><strong>Alignment:</strong> Consistent left alignment with proper spacing</li>
            <li><strong>Colors:</strong> Professional color scheme with better contrast</li>
            <li><strong>Layout:</strong> Clean field rows with proper label/value separation</li>
            <li><strong>Typography:</strong> Improved font sizes and hierarchy</li>
            <li><strong>Spacing:</strong> Better margins and line spacing</li>
            <li><strong>Visual Elements:</strong> Subtle borders and professional styling</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 