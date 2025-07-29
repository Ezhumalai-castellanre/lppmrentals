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

export class EnhancedPDFGenerator {
  private doc: jsPDF;
  private yPosition: number = 30;
  private readonly pageWidth: number = 210;
  private readonly marginLeft: number = 20; // Reduced margin for more content space
  private readonly marginRight: number = 20;
  private readonly contentWidth: number = 170; // Increased content width
  private readonly primaryColor: number[] = [0, 102, 204]; // Blue
  private readonly secondaryColor: number[] = [51, 51, 51]; // Dark gray
  private readonly accentColor: number[] = [255, 193, 7]; // Gold
  private readonly lightGray: number[] = [245, 245, 245];

  constructor() {
    this.doc = new jsPDF();
    this.setupDocument();
  }

  private setupDocument(): void {
    // Set document properties
    this.doc.setProperties({
      title: 'Liberty Place Rental Application',
      subject: 'Rental Application Form',
      author: 'Liberty Place Property Management',
      creator: 'Liberty Place Application System'
    });
  }

  private addText(text: string, fontSize: number = 10, isBold: boolean = false, color?: number[]): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    if (color) {
      this.doc.setTextColor(color[0], color[1], color[2]);
    } else {
      this.doc.setTextColor(0, 0, 0);
    }
    this.doc.text(text, this.marginLeft, this.yPosition);
    this.yPosition += fontSize * 0.8; // Increased line spacing
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
    this.yPosition += fontSize * 0.8; // Increased line spacing
  }

  private addSection(title: string, withBackground: boolean = false): void {
    this.checkPageBreak();
    
    if (withBackground) {
      // Add background highlight for important sections
      this.doc.setFillColor(this.lightGray[0], this.lightGray[1], this.lightGray[2]);
      this.doc.rect(this.marginLeft - 3, this.yPosition - 3, this.contentWidth + 6, 12, 'F');
    }
    
    // Add section title with accent line
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.text(title, this.marginLeft, this.yPosition);
    
    // Add accent line under title
    this.doc.setFillColor(this.accentColor[0], this.accentColor[1], this.accentColor[2]);
    this.doc.rect(this.marginLeft, this.yPosition + 1, 40, 1, 'F');
    
    this.yPosition += 12; // Consistent spacing after section titles
  }

  private addField(label: string, value: string | number | undefined, highlight: boolean = false): void {
    // Show field even if value is empty, but mark as "Not provided"
    const displayValue = (value !== undefined && value !== null && value !== '') ? String(value) : 'Not provided';
    const fieldText = `${label}: ${displayValue}`;
    
    if (highlight) {
      // Add highlight background
      this.doc.setFillColor(this.accentColor[0], this.accentColor[1], this.accentColor[2]);
      this.doc.rect(this.marginLeft - 3, this.yPosition - 6, this.contentWidth + 6, 8, 'F');
      this.addText(fieldText, 10, true);
    } else {
      this.addText(fieldText, 10);
    }
  }

  private addTableRow(label: string, value: string | number | undefined, highlight: boolean = false): void {
    // Show all fields, even if empty
    const displayValue = (value !== undefined && value !== null && value !== '') ? String(value) : 'Not provided';
    const labelWidth = 85; // Increased label width for better alignment
    const valueStartX = this.marginLeft + labelWidth + 10; // 10px gap between label and value
    const valueWidth = this.contentWidth - labelWidth - 10; // Available width for value
    
    // Add label with proper alignment
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.text(label, this.marginLeft, this.yPosition);
    
    // Add value with proper alignment
    this.doc.setFont('helvetica', 'normal');
    if (highlight) {
      this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    } else if (displayValue === 'Not provided') {
      this.doc.setTextColor(128, 128, 128); // Gray for missing values
    } else {
      this.doc.setTextColor(0, 0, 0);
    }
    
    // Handle long values with text wrapping
    if (displayValue.length > 30) {
      const lines = this.doc.splitTextToSize(displayValue, valueWidth);
      this.doc.text(lines, valueStartX, this.yPosition);
      this.yPosition += (lines.length - 1) * 5; // Adjusted line spacing
    } else {
      this.doc.text(displayValue, valueStartX, this.yPosition);
    }
    
    this.yPosition += 7; // Adjusted row spacing for better readability
  }

  private checkPageBreak(): void {
    if (this.yPosition > 280) { // Increased page break threshold
      this.doc.addPage();
      this.yPosition = 30;
      this.addPageHeader();
    }
  }

  private addPageHeader(): void {
    // Add page number
    const pageCount = this.doc.getNumberOfPages();
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(128, 128, 128);
    this.doc.text(`Page ${pageCount}`, this.pageWidth - 30, 15);
    
    // Add company name in header
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.text('Liberty Place Property Management', this.marginLeft, 15);
  }

  private addHeader(): void {
    // Company logo placeholder (you can add actual logo image)
    this.doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.rect(this.marginLeft, this.yPosition, 25, 18, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('LIBERTY', this.marginLeft + 3, this.yPosition + 7);
    this.doc.text('PLACE', this.marginLeft + 3, this.yPosition + 12);
    
    // Company name
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text("Liberty Place Property Management", this.marginLeft + 35, this.yPosition + 10);
    
    // Address and contact info
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.text("122 East 42nd Street, Suite 1903, New York, NY 10168", this.marginLeft + 35, this.yPosition + 16);
    this.doc.text("Tel: (646) 545-6700 | Fax: (646) 304-2255", this.marginLeft + 35, this.yPosition + 20);
    this.doc.text("Leasing Direct Line: (646) 545-6700", this.marginLeft + 35, this.yPosition + 24);
    
    this.yPosition += 30; // Reduced spacing
    
    // Title with decorative elements
    this.doc.setFillColor(this.accentColor[0], this.accentColor[1], this.accentColor[2]);
    this.doc.rect(this.marginLeft, this.yPosition, this.contentWidth, 12, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text("RENTAL APPLICATION", this.pageWidth / 2, this.yPosition + 8, { align: 'center' });
    
    this.yPosition += 16; // Reduced spacing
    
    // Application ID and date
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Application Date: ${new Date().toLocaleDateString()}`, this.marginLeft, this.yPosition);
    this.doc.text(`Generated: ${new Date().toLocaleString()}`, this.pageWidth - 55, this.yPosition);
    
    this.yPosition += 12; // Reduced spacing
  }

  private addInstructions(): void {
    this.addSection("Application Instructions", true);
    
    const instructions = [
      "Thank you for choosing Liberty Place Property Management for your residential needs.",
      "",
      "IMPORTANT REQUIREMENTS:",
      "• Applicants must show income of 40 TIMES THE MONTHLY RENT (may be combined among applicants)",
      "• Guarantors must show income of 80 TIMES THE MONTHLY RENT (may NOT be combined with applicants)",
      "• $50.00 non-refundable processing fee per adult applicant and guarantor",
      "• Applications must be submitted in full as detailed below",
      "• Only complete applications will be reviewed and considered for tenancy",
      "• Applications will not remove apartments from the market",
      "• Lease signings must be scheduled within three (3) days of approval",
      "",
      "REQUIRED DOCUMENTS:",
      "• Completed and signed application by applicants and guarantors",
      "• $50.00 Non-refundable processing fee per adult applicant and per guarantor",
      "• Driver's License or Photo ID (18 & over)",
      "• Social Security Card",
      "• Financial Statement - First Page (Checking, Savings and/or other assets)",
      "• Previous year tax returns - First Page",
      "• Proof of Employment letter on company letterhead",
      "• Last 4 paystubs (If paid weekly) - or - Last 2 paystubs (if paid bi-weekly)"
    ];
    
    instructions.forEach(instruction => {
      if (instruction === "") {
        this.yPosition += 4; // Reduced spacing for empty lines
      } else if (instruction.startsWith("•")) {
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
        this.doc.text(instruction, this.marginLeft + 5, this.yPosition);
        this.yPosition += 5; // Reduced line spacing
      } else if (instruction.includes(":")) {
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        this.doc.text(instruction, this.marginLeft, this.yPosition);
        this.yPosition += 7; // Reduced spacing
      } else {
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
        this.doc.text(instruction, this.marginLeft, this.yPosition);
        this.yPosition += 5; // Reduced line spacing
      }
    });
    
    this.yPosition += 8; // Reduced spacing
  }

  private addRequirements(): void {
    this.addSection("Application Requirements", true);
    
    const requirements = [
      "• Applicants must show income of 40 TIMES THE MONTHLY RENT",
      "• Guarantors must show income of 80 TIMES THE MONTHLY RENT", 
      "• $50.00 non-refundable processing fee per adult applicant and guarantor",
      "• Applications must be submitted in full"
    ];
    
    requirements.forEach(req => {
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
      this.doc.text(req, this.marginLeft + 5, this.yPosition);
      this.yPosition += 6; // Reduced spacing
    });
    
    this.yPosition += 4; // Reduced spacing
  }

  private addApplicationInfo(data: FormData): void {
    this.checkPageBreak();
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
    
    this.addTableRow("Building Address", data.application?.buildingAddress, true);
    this.addTableRow("Apartment Number", data.application?.apartmentNumber);
    this.addTableRow("Move-in Date", formatDate(data.application?.moveInDate));
    this.addTableRow("Monthly Rent", data.application?.monthlyRent ? `$${data.application.monthlyRent}` : undefined, true);
    this.addTableRow("Apartment Type", data.application?.apartmentType);
    this.addTableRow("How did you hear about us", data.application?.howDidYouHear);
    if (data.application?.howDidYouHear === 'Other' && data.application?.howDidYouHearOther) {
      this.addTableRow("Other Source", data.application?.howDidYouHearOther);
    }
  }

  private addPersonalInfo(title: string, person: any): void {
    this.checkPageBreak();
    this.addSection(title);
    
    // Personal Information subsection
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.text("Personal Information", this.marginLeft, this.yPosition);
    this.yPosition += 8;
    
    this.addTableRow("Full Name", person.name, true);
    this.addTableRow("Date of Birth", person.dob);
    this.addTableRow("Social Security Number", person.ssn);
    this.addTableRow("Phone Number", person.phone);
    this.addTableRow("Email Address", person.email);
    this.addTableRow("Driver's License", person.license);
    this.addTableRow("License State", person.licenseState);
    
    if (person.address || person.city || person.state || person.zip) {
      this.yPosition += 6;
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
      this.doc.text("Current Address", this.marginLeft, this.yPosition);
      this.yPosition += 8;
      
      this.addTableRow("Street Address", person.address);
      this.addTableRow("City", person.city);
      this.addTableRow("State", person.state);
      this.addTableRow("ZIP Code", person.zip);
      this.addTableRow("Length at Address", person.lengthAtAddress);
      this.addTableRow("Current Landlord's Name", person.landlordName);
      this.addTableRow("Current Monthly Rent", person.currentRent ? `$${person.currentRent}` : undefined);
      this.addTableRow("Reason for Moving", person.reasonForMoving);
    }
    
    // Landlord Information subsection
    if (person.landlordName || person.landlordAddressLine1 || person.landlordCity || person.landlordState || person.landlordZipCode || person.landlordPhone || person.landlordEmail) {
      this.yPosition += 6;
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
      this.doc.text("Current Landlord Information", this.marginLeft, this.yPosition);
      this.yPosition += 8;
      
      this.addTableRow("Landlord Name", person.landlordName);
      this.addTableRow("Landlord Address Line 1", person.landlordAddressLine1);
      this.addTableRow("Landlord Address Line 2", person.landlordAddressLine2);
      this.addTableRow("Landlord City", person.landlordCity);
      this.addTableRow("Landlord State", person.landlordState);
      this.addTableRow("Landlord ZIP Code", person.landlordZipCode);
      this.addTableRow("Landlord Phone", person.landlordPhone);
      this.addTableRow("Landlord Email", person.landlordEmail);
    }
    
    this.yPosition += 4;
  }

  private addFinancialInfo(title: string, person: any): void {
    this.checkPageBreak();
    this.addSection(`${title} Financial Information`);
    
    if (!person) {
      this.addText("No financial information provided", 9, false, [150, 150, 150]);
      this.yPosition += 8;
      return;
    }
    
    // Employment Information subsection
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.text("Employment Information", this.marginLeft, this.yPosition);
    this.yPosition += 8;
    
    this.addTableRow("Current Employer", person.employer, true);
    this.addTableRow("Position/Title", person.position);
    this.addTableRow("Employment Start Date", person.employmentStart);
    this.addTableRow("Annual Income", person.income ? `$${person.income.toLocaleString()}` : undefined, true);
    this.addTableRow("Other Income", person.otherIncome ? `$${person.otherIncome.toLocaleString()}` : undefined);
    this.addTableRow("Other Income Source", person.otherIncomeSource);
    
    // Bank Information subsection (simplified)
    if (person.bankRecords && person.bankRecords.length > 0) {
      this.yPosition += 6;
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
      this.doc.text("Bank Information", this.marginLeft, this.yPosition);
      this.yPosition += 8;
      
      person.bankRecords.forEach((bankRecord: any, index: number) => {
        const prefix = person.bankRecords.length > 1 ? `Bank ${index + 1} - ` : '';
        this.addTableRow(`${prefix}Bank Name`, bankRecord.bankName);
        this.addTableRow(`${prefix}Account Type`, bankRecord.accountType);
        
        if (index < person.bankRecords.length - 1) {
          this.yPosition += 4; // Add spacing between multiple bank records
        }
      });
    } else if (person.bankName || person.accountType) {
      this.yPosition += 6;
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
      this.doc.text("Bank Information", this.marginLeft, this.yPosition);
      this.yPosition += 8;
      
      this.addTableRow("Bank Name", person.bankName);
      this.addTableRow("Account Type", person.accountType);
    }
    
    this.yPosition += 4;
  }

  private addLegalDisclaimer(): void {
    this.checkPageBreak();
    this.addSection("PLEASE READ CAREFULLY BEFORE SIGNING");
    
    const disclaimerText = "The Landlord will in no event be bound, nor will possession be given, unless and until a lease executed by the Landlord has been delivered to the Tenant. The applicant and his/her references must be satisfactory to the Landlord. Please be advised that the date on page one of the lease is not your move-in date. Your move-in date will be arranged with you after you have been approved. No representations or agreements by agents, brokers or others are binding on the Landlord or Agent unless included in the written lease proposed to be executed. I hereby warrant that all my representations set forth herein are true. I recognize the truth of the information contained herein is essential. I further represent that I am not renting a room or an apartment under any other name, nor have I ever been dispossessed from any apartment, nor am I now being dispossessed. I represent that I am over 18 years of age. I have been advised that I have the right, under section 8068 of the Fair Credit Reporting Act, to make a written request, directed to the appropriate credit reporting agency, within reasonable time, for a complete and accurate disclosure of the nature and scope of any credit investigation. I understand that upon submission, this application and all related documents become the property of the Landlord, and will not be returned to me under any circumstances. I authorize the Landlord, Agent and credit reporting agency to obtain a consumer credit report on me and to verify any information on this application with regard to my employment history, current and prior tenancies, bank accounts, and all other information that the Landlord deems pertinent to my obtaining residency. I understand that I shall not be permitted to receive or review my application file or my credit consumer report. I authorize banks, financial institutions, landlords, business associates, credit bureaus, attorneys, accountants and other persons or institutions with whom I am acquainted to furnish any and all information regarding myself. This authorization also applies to any update reports which may be ordered as needed. A photocopy or fax of this authorization shall be accepted with the same authority as this original. I will present any other information required by the Landlord or Agent in connection with the lease contemplated herein. I understand that the application fee is non-refundable. The Civil Rights Act of 1968, as amended by the Fair Housing Amendments Act of 1988, prohibits discrimination in the rental of housing based on race, color, religion, sex, handicap, familial status or national origin. The Federal Agency, which administers compliance with this law, is the U.S. Department of Housing and Urban Development.";
    
    // Split text into paragraphs for better readability
    const paragraphs = disclaimerText.split('. ');
    
    this.doc.setFontSize(8); // Reduced font size
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    
    paragraphs.forEach((paragraph, index) => {
      if (paragraph.trim()) {
        // Add period back to the paragraph
        const fullParagraph = index < paragraphs.length - 1 ? paragraph + '.' : paragraph;
        
        // Split long paragraphs into lines with proper alignment
        const lines = this.doc.splitTextToSize(fullParagraph, this.contentWidth - 5);
        this.doc.text(lines, this.marginLeft, this.yPosition);
        this.yPosition += lines.length * 4; // Reduced line spacing for better fit
        
        // Add extra space between paragraphs
        if (index < paragraphs.length - 1) {
          this.yPosition += 2; // Reduced spacing
        }
      }
    });
    
    this.yPosition += 10; // Reduced spacing
  }

  private addSignature(title: string, signature: string): void {
    this.checkPageBreak();
    this.addSection(`${title} Signature`);
    
    // Signature box with proper alignment
    this.doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.setLineWidth(1);
    this.doc.rect(this.marginLeft, this.yPosition, 90, 30, 'S'); // Reduced size
    
    if (signature) {
      try {
        // Add signature image with proper alignment
        this.doc.addImage(signature, 'PNG', this.marginLeft + 5, this.yPosition + 5, 80, 20); // Adjusted size
      } catch (error) {
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'italic');
        this.doc.setTextColor(128, 128, 128);
        this.doc.text("Digital signature provided", this.marginLeft + 10, this.yPosition + 15);
      }
    } else {
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'italic');
      this.doc.setTextColor(128, 128, 128);
      this.doc.text("No signature provided", this.marginLeft + 10, this.yPosition + 15);
    }
    
    this.yPosition += 35; // Reduced spacing
    
    // Date with proper alignment
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text("Date: " + new Date().toLocaleDateString(), this.marginLeft, this.yPosition);
    
    this.yPosition += 10; // Reduced spacing
  }

  private addOccupants(occupants: any[]): void {
    if (!occupants || occupants.length === 0) return;
    
    this.checkPageBreak();
    this.addSection("Other Occupants");
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.text("Additional occupants who will be living in the apartment:", this.marginLeft, this.yPosition);
    this.yPosition += 8;
    
    occupants.forEach((occupant, index) => {
      this.addTableRow("Name", occupant.name);
      this.addTableRow("Relationship", occupant.relationship);
      this.addTableRow("Date of Birth", occupant.dob);
      
      if (index < occupants.length - 1) {
        this.yPosition += 4; // Add spacing between occupants
      }
    });
    
    this.yPosition += 4;
  }

  private addJSONPayload(data: FormData): void {
    if (!data.jsonPayload) return;
    
    this.checkPageBreak();
    this.addSection("Application Metadata");
    
    // JSON Payload subsection
    this.doc.setFontSize(11); // Reduced font size
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.text("Application Processing Information", this.marginLeft, this.yPosition);
    this.yPosition += 10; // Reduced spacing
    
    this.addTableRow("Application ID", data.jsonPayload.applicationId, true);
    this.addTableRow("Submission Date", data.jsonPayload.submissionDate ? new Date(data.jsonPayload.submissionDate).toLocaleString() : undefined);
    this.addTableRow("Status", data.jsonPayload.status);
    this.addTableRow("Total Applicants", data.jsonPayload.totalApplicants);
    this.addTableRow("Total Occupants", data.jsonPayload.totalOccupants);
    this.addTableRow("Total Bank Accounts", data.jsonPayload.totalBankAccounts);
    this.addTableRow("Processing Fee", data.jsonPayload.processingFee ? `$${data.jsonPayload.processingFee}` : undefined);
    this.addTableRow("Estimated Processing Time", data.jsonPayload.estimatedProcessingTime);
    
    this.yPosition += 6; // Reduced spacing
  }

  private addFooter(): void {
    this.checkPageBreak();
    
    // Footer line
    this.doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.marginLeft, this.yPosition, this.pageWidth - this.marginRight, this.yPosition);
    this.yPosition += 4; // Reduced spacing
    
    // Footer text
    this.doc.setFontSize(7); // Reduced font size
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(128, 128, 128);
    this.doc.text("This application was submitted electronically on " + new Date().toLocaleString(), this.marginLeft, this.yPosition);
    this.yPosition += 3; // Reduced spacing
    this.doc.text("Liberty Place Property Management - Rental Application", this.marginLeft, this.yPosition);
    this.yPosition += 3; // Reduced spacing
    this.doc.text("All information is encrypted and secure", this.marginLeft, this.yPosition);
  }

  public generatePDF(formData: FormData): string {
    // Add header
    this.addHeader();
    
    // Add instructions (Step 1 content)
    this.addInstructions();
    
    // Add requirements
    this.addRequirements();
    
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
    
    // Supporting Documents section removed as requested

    // Add occupants section
    this.addOccupants(formData.occupants || []);
    
    // Add JSON payload
    this.addJSONPayload(formData);
    
    // Add legal disclaimer
    this.addLegalDisclaimer();
    
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