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
      howDidYouHear: "Online Advertisement"
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
      employer: "Tech Corp",
      position: "Software Engineer",
      employmentStart: "2020-01-15",
      income: 85000,
      otherIncome: 5000,
      otherIncomeSource: "Freelance work",
      bankName: "Chase Bank",
      accountType: "Checking"
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
      employer: "Design Studio",
      position: "UX Designer",
      employmentStart: "2021-03-10",
      income: 75000,
      otherIncome: 0,
      otherIncomeSource: "",
      bankName: "Bank of America",
      accountType: "Savings"
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
      employer: "Johnson Enterprises",
      position: "CEO",
      employmentStart: "2000-01-01",
      income: 200000,
      otherIncome: 50000,
      otherIncomeSource: "Investment returns",
      bankName: "Wells Fargo",
      accountType: "Multiple"
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

  const previewEnhancedPDF = () => {
    try {
      const pdfGenerator = new EnhancedPDFGenerator();
      const pdfData = pdfGenerator.generatePDF(sampleFormData);
      
      // Open in new window for preview
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Enhanced PDF Preview</title>
              <style>
                body { margin: 0; padding: 20px; background: #f5f5f5; }
                iframe { width: 100%; height: 90vh; border: 1px solid #ddd; border-radius: 8px; }
                h1 { color: #0066cc; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <h1>Enhanced Rental Application PDF Preview</h1>
              <iframe src="${pdfData}"></iframe>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Error previewing enhanced PDF:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Enhanced PDF Generator Test</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Features Demonstrated:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Professional color scheme with blue, gold, and gray</li>
            <li>Enhanced typography with clear hierarchy</li>
            <li>Table-like data organization</li>
            <li>Highlighted important fields (income, rent)</li>
            <li>Styled signature boxes</li>
            <li>Professional header with branding</li>
            <li>Page numbers and headers</li>
            <li>Better spacing and layout</li>
            <li>Step 1 Instructions included</li>
            <li>Fixed "Current Landlord's Name" field</li>
            <li>Improved section headers with proper underlines</li>
            <li>Only 2 Legal Questions shown</li>
            <li>Supporting Documents section removed</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={generateEnhancedPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Download Enhanced PDF
          </Button>
          
          <Button 
            onClick={previewEnhancedPDF}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview Enhanced PDF
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Sample Data Used:</h3>
          <p className="text-blue-800 text-sm">
            This test uses sample data including a primary applicant, co-applicant, guarantor, 
            and one occupant. The PDF will demonstrate all the enhanced UI features including 
            professional styling, better layout, and improved readability.
          </p>
        </div>
      </div>
    </div>
  );
} 