import jsPDF from 'jspdf';

interface FormData {
  application: any;
  applicant: any;
  coApplicant?: any;
  guarantor?: any;
  signatures: {
    applicant?: string;
    coApplicant?: string;
    guarantor?: string;
  };
  occupants?: any[];
  jsonPayload?: any; // Added for JSON payload
}

export class ResetPDFGenerator {
  private doc: jsPDF;
  private yPosition: number = 25;
  private readonly pageWidth: number = 210;
  private readonly pageHeight: number = 297;
  private readonly marginLeft: number = 25;
  private readonly marginRight: number = 25;
  private readonly contentWidth: number = 160;
  
  // Clean, professional color scheme
  private readonly primaryColor: number[] = [0, 51, 102]; // Deep blue
  private readonly secondaryColor: number[] = [64, 64, 64]; // Dark gray
  private readonly accentColor: number[] = [0, 102, 204]; // Bright blue
  private readonly lightGray: number[] = [248, 249, 250]; // Very light gray
  private readonly borderColor: number[] = [220, 220, 220]; // Light border

  constructor() {
    this.doc = new jsPDF();
    this.setupDocument();
  }

  private setupDocument(): void {
    this.doc.setProperties({
      title: 'Liberty Place Rental Application',
      subject: 'Rental Application Form',
      author: 'Liberty Place Property Management',
      creator: 'Liberty Place Application System',
      keywords: 'rental, application, property management'
    });
  }

  private addText(text: string, fontSize: number = 10, isBold: boolean = false, color?: number[], x?: number): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    if (color) {
      this.doc.setTextColor(color[0], color[1], color[2]);
    } else {
      this.doc.setTextColor(0, 0, 0);
    }
    
    const xPos = x || this.marginLeft;
    this.doc.text(text, xPos, this.yPosition);
    this.yPosition += fontSize * 0.6;
  }

  private addCenteredText(text: string, fontSize: number = 10, isBold: boolean = false, color?: number[]): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    if (color) {
      this.doc.setTextColor(color[0], color[1], color[2]);
    } else {
      this.doc.setTextColor(0, 0, 0);
    }
    
    this.doc.text(text, this.pageWidth / 2, this.yPosition, { align: 'center' });
    this.yPosition += fontSize * 0.6;
  }

  private addSection(title: string, withBorder: boolean = true): void {
    this.yPosition += 8;
    
    if (withBorder) {
      // Add subtle border
      this.doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.marginLeft, this.yPosition - 2, this.pageWidth - this.marginRight, this.yPosition - 2);
    }
    
    // Section title
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.text(title, this.marginLeft, this.yPosition);
    this.yPosition += 8;
  }

  private addFieldRow(label: string, value: any, highlight: boolean = false): void {
    const displayValue = (value !== undefined && value !== null && value !== '') ? String(value) : 'Not provided';
    const labelWidth = 70;
    const valueWidth = this.contentWidth - labelWidth - 10;
    
    // Label
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.text(label, this.marginLeft, this.yPosition);
    
    // Value
    this.doc.setFont('helvetica', 'normal');
    if (highlight) {
      this.doc.setTextColor(this.accentColor[0], this.accentColor[1], this.accentColor[2]);
    } else if (displayValue === 'Not provided') {
      this.doc.setTextColor(150, 150, 150);
    } else {
      this.doc.setTextColor(0, 0, 0);
    }
    
    // Handle long values with text wrapping
    if (displayValue.length > 30) {
      const lines = this.doc.splitTextToSize(displayValue, valueWidth);
      this.doc.text(lines, this.marginLeft + labelWidth + 10, this.yPosition);
      this.yPosition += (lines.length - 1) * 4;
    } else {
      this.doc.text(displayValue, this.marginLeft + labelWidth + 10, this.yPosition);
    }
    
    this.yPosition += 6;
  }

  private addHeader(): void {
    // Company name and logo area
    this.doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.rect(this.marginLeft, this.yPosition, 30, 20, 'F');
    
    // Logo text
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('LIBERTY', this.marginLeft + 5, this.yPosition + 8);
    this.doc.text('PLACE', this.marginLeft + 5, this.yPosition + 13);
    
    // Company name
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text("Liberty Place Property Management", this.marginLeft + 40, this.yPosition + 12);
    
    // Contact info
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.text("122 East 42nd Street, Suite 1903", this.marginLeft + 40, this.yPosition + 18);
    this.doc.text("New York, NY 10168", this.marginLeft + 40, this.yPosition + 22);
    this.doc.text("Tel: (646) 545-6700 | Fax: (646) 304-2255", this.marginLeft + 40, this.yPosition + 26);
    
    this.yPosition += 35;
    
    // Title bar
    this.doc.setFillColor(this.accentColor[0], this.accentColor[1], this.accentColor[2]);
    this.doc.rect(this.marginLeft, this.yPosition, this.contentWidth, 12, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text("RENTAL APPLICATION", this.pageWidth / 2, this.yPosition + 8, { align: 'center' });
    
    this.yPosition += 18;
    
    // Application info
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Application Date: ${new Date().toLocaleDateString()}`, this.marginLeft, this.yPosition);
    this.doc.text(`Generated: ${new Date().toLocaleString()}`, this.pageWidth - 60, this.yPosition);
    
    this.yPosition += 12;
  }

  private addApplicationInfo(data: FormData): void {
    this.addSection("Application Information");
    
    const formatDate = (dateValue: any): string => {
      if (!dateValue) return 'Not provided';
      try {
        const date = new Date(dateValue);
        return date.toLocaleDateString();
      } catch {
        return 'Invalid date';
      }
    };
    
    this.addFieldRow("Building Address", data.application?.buildingAddress);
    this.addFieldRow("Apartment Number", data.application?.apartmentNumber);
    this.addFieldRow("Move-in Date", formatDate(data.application?.moveInDate));
    this.addFieldRow("Monthly Rent", data.application?.monthlyRent ? `$${data.application.monthlyRent}` : undefined, true);
    this.addFieldRow("Apartment Type", data.application?.apartmentType);
    this.addFieldRow("How Did You Hear", data.application?.howDidYouHear);
    if (data.application?.howDidYouHear === 'Other' && data.application?.howDidYouHearOther) {
      this.addFieldRow("Other Source", data.application?.howDidYouHearOther);
    }
  }

  private addPersonalInfo(title: string, person: any): void {
    this.checkPageBreak();
    this.addSection(title);
    
    if (!person || !person.name) {
      this.addText("No information provided", 9, false, [150, 150, 150]);
      this.yPosition += 8;
      return;
    }
    
    this.addFieldRow("Full Name", person.name, true);
    this.addFieldRow("Date of Birth", person.dob ? new Date(person.dob).toLocaleDateString() : undefined);
    this.addFieldRow("Social Security Number", person.ssn);
    this.addFieldRow("Phone Number", person.phone);
    this.addFieldRow("Email Address", person.email);
    this.addFieldRow("Driver's License", person.license);
    this.addFieldRow("License State", person.licenseState);
    
    // Address section
    if (person.address) {
      this.yPosition += 4;
      this.addText("Current Address:", 9, true);
      this.yPosition += 4;
      this.addFieldRow("Street Address", person.address);
      this.addFieldRow("City", person.city);
      this.addFieldRow("State", person.state);
      this.addFieldRow("ZIP Code", person.zip);
      this.addFieldRow("Length at Address", person.lengthAtAddress);
      this.addFieldRow("Current Landlord", person.landlordName);
      this.addFieldRow("Current Monthly Rent", person.currentRent ? `$${person.currentRent}` : undefined);
      this.addFieldRow("Reason for Moving", person.reasonForMoving);
    }
    
    // Landlord Information section
    if (person.landlordName || person.landlordAddressLine1 || person.landlordAddressLine2 || person.landlordCity || person.landlordState || person.landlordZipCode || person.landlordPhone || person.landlordEmail) {
      this.yPosition += 4;
      this.addText("Landlord Information:", 9, true);
      this.yPosition += 4;
      this.addFieldRow("Landlord Name", person.landlordName);
      this.addFieldRow("Landlord Address Line 1", person.landlordAddressLine1);
      this.addFieldRow("Landlord Address Line 2", person.landlordAddressLine2);
      this.addFieldRow("Landlord City", person.landlordCity);
      this.addFieldRow("Landlord State", person.landlordState);
      this.addFieldRow("Landlord ZIP Code", person.landlordZipCode);
      this.addFieldRow("Landlord Phone", person.landlordPhone);
      this.addFieldRow("Landlord Email", person.landlordEmail);
    }
  }

  private addFinancialInfo(title: string, person: any): void {
    this.checkPageBreak();
    this.addSection(`${title} Financial Information`);
    
    if (!person) {
      this.addText("No financial information provided", 9, false, [150, 150, 150]);
      this.yPosition += 8;
      return;
    }
    
    this.addFieldRow("Employer", person.employer);
    this.addFieldRow("Position", person.position);
    this.addFieldRow("Employment Start Date", person.employmentStart ? new Date(person.employmentStart).toLocaleDateString() : undefined);
    this.addFieldRow("Monthly Income", person.income ? `$${person.income}` : undefined, true);
    this.addFieldRow("Other Income", person.otherIncome ? `$${person.otherIncome}` : undefined);
    this.addFieldRow("Other Income Source", person.otherIncomeSource);
    
    // Bank information
    if (person.bankRecords && person.bankRecords.length > 0) {
      this.yPosition += 4;
      this.addText("Bank Information:", 9, true);
      this.yPosition += 4;
      
      person.bankRecords.forEach((bank: any, index: number) => {
        const prefix = person.bankRecords.length > 1 ? `Bank ${index + 1} - ` : '';
        this.addFieldRow(`${prefix}Bank Name`, bank.bankName);
        this.addFieldRow(`${prefix}Account Type`, bank.accountType);
        this.addFieldRow(`${prefix}Account Number (Last 4)`, bank.accountNumber ? '***' + bank.accountNumber.slice(-4) : undefined);
        this.addFieldRow(`${prefix}Routing Number`, bank.routingNumber);
        this.addFieldRow(`${prefix}Balance`, bank.balance ? `$${bank.balance}` : undefined);
      });
    } else if (person.bankName || person.accountType || person.accountNumber || person.routingNumber || person.balance) {
      this.yPosition += 4;
      this.addText("Bank Information:", 9, true);
      this.yPosition += 4;
      
      this.addFieldRow("Bank Name", person.bankName);
      this.addFieldRow("Account Type", person.accountType);
      this.addFieldRow("Account Number (Last 4)", person.accountNumber ? '***' + person.accountNumber.slice(-4) : undefined);
      this.addFieldRow("Routing Number", person.routingNumber);
      this.addFieldRow("Balance", person.balance ? `$${person.balance}` : undefined);
    }
  }

  private addLegalQuestions(data: FormData): void {
    this.checkPageBreak();
    this.addSection("Legal Questions");
    
    this.addFieldRow("Have you ever been in landlord/tenant legal action?", data.application?.landlordTenantLegalAction || "Not specified");
    if (data.application?.landlordTenantLegalAction === 'yes' && data.application?.landlordTenantLegalActionExplanation) {
      this.addFieldRow("Legal Action Details", data.application?.landlordTenantLegalActionExplanation);
    }
    
    this.addFieldRow("Have you ever broken a lease?", data.application?.brokenLease || "Not specified");
    if (data.application?.brokenLease === 'yes' && data.application?.brokenLeaseExplanation) {
      this.addFieldRow("Broken Lease Details", data.application?.brokenLeaseExplanation);
    }
  }

  private addOccupants(occupants: any[]): void {
    if (!occupants || occupants.length === 0) return;
    
    this.checkPageBreak();
    this.addSection("Other Occupants");
    
    occupants.forEach((occupant, index) => {
      if (occupant.name) {
        this.addText(`Occupant ${index + 1}:`, 9, true);
        this.yPosition += 4;
        this.addFieldRow("Name", occupant.name);
        this.addFieldRow("Relationship", occupant.relationship);
        this.addFieldRow("Date of Birth", occupant.dob ? new Date(occupant.dob).toLocaleDateString() : undefined);
        this.addFieldRow("Social Security Number", occupant.ssn);
        this.addFieldRow("Driver's License", occupant.driverLicense);
        this.addFieldRow("Age", occupant.age);
        this.addFieldRow("Sex", occupant.sex);
        this.yPosition += 4;
      }
    });
  }

  private addSignature(title: string, signature: string): void {
    this.checkPageBreak();
    this.addSection(`${title} Signature`);
    
    // Signature box
    this.doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]);
    this.doc.setLineWidth(1);
    this.doc.rect(this.marginLeft, this.yPosition, 100, 25, 'S');
    
    if (signature) {
      try {
        this.doc.addImage(signature, 'PNG', this.marginLeft + 5, this.yPosition + 5, 90, 15);
      } catch (error) {
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'italic');
        this.doc.setTextColor(150, 150, 150);
        this.doc.text("Digital signature provided", this.marginLeft + 10, this.yPosition + 12);
      }
    } else {
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'italic');
      this.doc.setTextColor(150, 150, 150);
      this.doc.text("No signature provided", this.marginLeft + 10, this.yPosition + 12);
    }
    
    this.yPosition += 30;
    
    // Date
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text("Date: " + new Date().toLocaleDateString(), this.marginLeft, this.yPosition);
    this.yPosition += 12;
  }

  private addFooter(): void {
    this.checkPageBreak();
    this.yPosition += 10;
    
    // Footer line
    this.doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.marginLeft, this.yPosition, this.pageWidth - this.marginRight, this.yPosition);
    this.yPosition += 8;
    
    // Footer text
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.text("Liberty Place Property Management - Rental Application", this.pageWidth / 2, this.yPosition, { align: 'center' });
    this.doc.text("This document was generated electronically", this.pageWidth / 2, this.yPosition + 4, { align: 'center' });
  }

  private checkPageBreak(): void {
    if (this.yPosition > 270) {
      this.doc.addPage();
      this.yPosition = 25;
      this.addPageHeader();
    }
  }

  private addPageHeader(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    // Page number
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.text(`Page ${pageCount}`, this.pageWidth - 35, 15);
    
    // Company name
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.text('Liberty Place Property Management', this.marginLeft, 15);
  }

  private addJSONPayload(data: FormData): void {
    if (!data.jsonPayload) return;
    
    this.checkPageBreak();
    this.addSection("Application Metadata");
    
    this.addFieldRow("Application ID", data.jsonPayload.applicationId, true);
    this.addFieldRow("Submission Date", data.jsonPayload.submissionDate ? new Date(data.jsonPayload.submissionDate).toLocaleString() : undefined);
    this.addFieldRow("Status", data.jsonPayload.status);
    this.addFieldRow("Total Applicants", data.jsonPayload.totalApplicants);
    this.addFieldRow("Total Occupants", data.jsonPayload.totalOccupants);
    this.addFieldRow("Total Bank Accounts", data.jsonPayload.totalBankAccounts);
    this.addFieldRow("Processing Fee", data.jsonPayload.processingFee ? `$${data.jsonPayload.processingFee}` : undefined);
    this.addFieldRow("Estimated Processing Time", data.jsonPayload.estimatedProcessingTime);
  }

  public generatePDF(formData: FormData): string {
    // Reset position
    this.yPosition = 25;
    
    // Add header
    this.addHeader();
    
    // Add application information
    this.addApplicationInfo(formData);
    
    // Add primary applicant information
    this.addPersonalInfo("Primary Applicant Information", formData.applicant);
    this.addFinancialInfo("Primary Applicant", formData.applicant);
    
    // Add co-applicant information if present
    if (formData.coApplicant && formData.coApplicant.name) {
      this.addPersonalInfo("Co-Applicant Information", formData.coApplicant);
      this.addFinancialInfo("Co-Applicant", formData.coApplicant);
    }
    
    // Add guarantor information if present
    if (formData.guarantor && formData.guarantor.name) {
      this.addPersonalInfo("Guarantor Information", formData.guarantor);
      this.addFinancialInfo("Guarantor", formData.guarantor);
    }
    
    // Add legal questions
    this.addLegalQuestions(formData);

    // Add JSON payload
    this.addJSONPayload(formData);
    
    // Add occupants section
    this.addOccupants(formData.occupants || []);
    
    // Add signatures
    if (formData.signatures.applicant) {
      this.addSignature("Primary Applicant", formData.signatures.applicant);
    }
    
    if (formData.signatures.coApplicant) {
      this.addSignature("Co-Applicant", formData.signatures.coApplicant);
    }
    
    if (formData.signatures.guarantor) {
      this.addSignature("Guarantor", formData.signatures.guarantor);
    }
    
    // Add footer
    this.addFooter();
    
    return this.doc.output('datauristring');
  }
} 