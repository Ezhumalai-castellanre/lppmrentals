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
  private yPosition: number = 40; // Increased to account for 20px padding
  private readonly pageWidth: number = 210;
  private readonly pageHeight: number = 297;
  private readonly marginLeft: number = 20; // Updated to 20px padding
  private readonly marginRight: number = 20; // Updated to 20px padding
  private readonly marginTop: number = 20; // Updated to 20px padding
  private readonly marginBottom: number = 20; // Updated to 20px padding
  private readonly contentWidth: number = 170; // Adjusted for 20px margins (210 - 40)
  private readonly contentHeight: number = 257; // Page height minus top and bottom margins (297 - 40)
  private readonly primaryColor: number[] = [0, 102, 204]; // Blue
  private readonly secondaryColor: number[] = [51, 51, 51]; // Dark gray
  private readonly accentColor: number[] = [255, 193, 7]; // Gold
  private readonly lightGray: number[] = [245, 245, 245];
  private readonly borderColor: number[] = [220, 220, 220]; // Light border

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
    if (color && color.length >= 3) {
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
    const labelWidth = 60; // Increased label width for better alignment with 20px margins
    const valueStartX = this.marginLeft + labelWidth + 8; // Increased gap between label and value to 8px for better spacing
    const valueWidth = this.contentWidth - labelWidth - 8; // Available width for value
    
    // Add subtle row background for better readability
    this.doc.setFillColor(this.lightGray[0], this.lightGray[1], this.lightGray[2]);
    this.doc.rect(this.marginLeft, this.yPosition - 3, this.contentWidth, 10, 'F');
    
    // Add label with proper alignment
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.text(label, this.marginLeft + 2, this.yPosition + 2);
    
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
    if (displayValue.length > 25) {
      const lines = this.doc.splitTextToSize(displayValue, valueWidth);
      this.doc.text(lines, valueStartX, this.yPosition + 2);
      this.yPosition += (lines.length - 1) * 6; // Improved line spacing
    } else {
      this.doc.text(displayValue, valueStartX, this.yPosition + 2);
    }
    
    this.yPosition += 12; // Increased row spacing for better readability with 20px margins
  }

  private checkPageBreak(): void {
    if (this.yPosition > this.pageHeight - this.marginBottom - 30) { // Updated to respect 20px bottom margin
      this.doc.addPage();
      this.yPosition = this.marginTop + 20; // Start with 20px top margin
      this.addPageHeader();
    }
  }

  private addPageHeader(): void {
    // Add page number
    const pageCount = this.doc.getNumberOfPages();
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(128, 128, 128);
    this.doc.text(`Page ${pageCount}`, this.pageWidth - 30, this.marginTop + 10); // Updated position for 20px margin
    
    // Add company name in header
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.text('Liberty Place Property Management', this.marginLeft, this.marginTop + 10); // Updated position for 20px margin
  }

  private addHeader(): void {
    // Company logo from S3
    try {
      // Add the logo image from the provided URL
      this.doc.addImage(
        'https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/image+(1).png',
        'PNG',
        this.marginLeft,
        this.yPosition,
        30,
        20
      );
    } catch (error) {
      // Fallback to text-based logo if image fails to load
      this.doc.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
      this.doc.rect(this.marginLeft, this.yPosition, 25, 18, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('LIBERTY', this.marginLeft + 3, this.yPosition + 7);
      this.doc.text('PLACE', this.marginLeft + 3, this.yPosition + 12);
    }
    
    // Company name
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text("Liberty Place Property Management", this.marginLeft + 40, this.yPosition + 10);
    
    // Address and contact info
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.text("122 East 42nd Street, Suite 1903, New York, NY 10168", this.marginLeft + 40, this.yPosition + 16);
    this.doc.text("Tel: (646) 545-6700 | Fax: (646) 304-2255", this.marginLeft + 40, this.yPosition + 20);
    this.doc.text("Leasing Direct Line: (646) 545-6700", this.marginLeft + 40, this.yPosition + 24);
    
    this.yPosition += 35; // Increased spacing for better 20px padding
    
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
    this.addTableRow("Email Address", person.email);
    this.addTableRow("Phone Number", person.phone);
    const ssnDigits = person?.ssn ? String(person.ssn).replace(/\D/g, '') : '';
    const maskedSSN = ssnDigits ? `***-**-${ssnDigits.slice(-4)}` : undefined;
    this.addTableRow("Social Security Number", maskedSSN);
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
      this.addTableRow("Current Monthly Rent", person.currentRent ? `$${person.currentRent}` : undefined);
      this.addTableRow("Reason for Moving", person.reasonForMoving);
      this.addTableRow("Length at Address", person.lengthAtAddress);
    }
    
    // Landlord Information as separate section with better alignment
    if (person.landlordName || person.landlordAddressLine1 || person.landlordCity || person.landlordZipCode || person.landlordPhone || person.landlordEmail) {
      this.yPosition += 8; // More spacing before landlord section
      
      // Create a separate section for Landlord Information
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
      this.doc.text("Landlord Information", this.marginLeft, this.yPosition);
      
      // Add accent line under landlord section title
      this.doc.setFillColor(this.accentColor[0], this.accentColor[1], this.accentColor[2]);
      this.doc.rect(this.marginLeft, this.yPosition + 1, 50, 1, 'F');
      
      this.yPosition += 12;
      
      // Add landlord information in a table format with better alignment
      const landlordFields = [
        { label: "Current Landlord", value: person.landlordName },
        { label: "Landlord Address Line 1", value: person.landlordAddressLine1 },
        { label: "Landlord Address Line 2", value: person.landlordAddressLine2 },
        { label: "Landlord City", value: person.landlordCity },
        { label: "Landlord State", value: person.landlordState },
        { label: "Landlord ZIP Code", value: person.landlordZipCode },
        { label: "Landlord Phone", value: person.landlordPhone },
        { label: "Landlord Email", value: person.landlordEmail }
      ];
      
      landlordFields.forEach(field => {
        if (field.value) {
          this.addTableRow(field.label, field.value);
        }
      });
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
    
    this.addTableRow("Employment Type", person.employmentType, true);
    this.addTableRow("Employer", person.employer);
    this.addTableRow("Position", person.position);
    this.addTableRow("Employment Start Date", person.employmentStart);
    this.addTableRow("Monthly Income", person.income ? `$${person.income.toLocaleString()}` : undefined, true);
    this.addTableRow("Income Frequency", person.incomeFrequency);
    this.addTableRow("Other Income", person.otherIncome ? `$${person.otherIncome.toLocaleString()}` : undefined);
    this.addTableRow("Other Income Frequency", person.otherIncomeFrequency);
    this.addTableRow("Other Income Source", person.otherIncomeSource);
    this.addTableRow("Credit Score", person.creditScore);
    
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
      const ssnDigits = occupant?.ssn ? String(occupant.ssn).replace(/\D/g, '') : '';
      const maskedSSN = ssnDigits ? `***-**-${ssnDigits.slice(-4)}` : undefined;
      this.addTableRow("Social Security Number", maskedSSN);
      this.addTableRow("Driver's License", occupant.license);
      
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
    // Ensure we have enough space for the footer (at least 60px from bottom)
    const footerHeight = 60;
    const pageHeight = this.doc.internal.pageSize.getHeight();
    const minFooterY = pageHeight - footerHeight;
    
    // Add a page break if we're too close to the bottom
    if (this.yPosition > minFooterY) {
      this.doc.addPage();
      this.yPosition = 40;
    }
    
    // Position footer at the bottom with proper margins
    this.yPosition = Math.max(this.yPosition, minFooterY);
    
    // Footer line
    this.doc.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.marginLeft, this.yPosition, this.pageWidth - this.marginRight, this.yPosition);
    this.yPosition += 8;
    
    // Footer text
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(128, 128, 128);
    this.doc.text("This application was submitted electronically on " + new Date().toLocaleString(), this.marginLeft, this.yPosition);
    this.yPosition += 6;
    this.doc.text("Liberty Place Property Management - Rental Application", this.marginLeft, this.yPosition);
    this.yPosition += 6;
    this.doc.text("All information is encrypted and secure", this.marginLeft, this.yPosition);
    
    // Add page number if there are multiple pages
    const totalPages = this.doc.getNumberOfPages();
    if (totalPages > 1) {
      const currentPage = this.doc.getCurrentPageInfo().pageNumber;
      this.doc.setFontSize(7);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(`Page ${currentPage} of ${totalPages}`, this.pageWidth - this.marginRight - 30, this.yPosition);
    }
  }

  private addComprehensiveFileMapping(formData: FormData): void {
    this.checkPageBreak();
    
    // Section header
    this.addSection("📁 COMPREHENSIVE FILE MAPPING & DOCUMENT INDEX", true);
    
    // Create a structured file mapping table
    const fileCategories = [
      {
        title: "Primary Applicant Documents",
        documents: this.extractDocuments(formData.applicant, 'applicant'),
        icon: "👤"
      },
      {
        title: "Co-Applicant Documents",
        documents: formData.coApplicant ? this.extractDocuments(formData.coApplicant, 'coApplicant') : [],
        icon: "👥"
      },
      {
        title: "Guarantor Documents",
        documents: formData.guarantor ? this.extractDocuments(formData.guarantor, 'guarantor') : [],
        icon: "🛡️"
      },
      {
        title: "Occupant Documents",
        documents: this.extractOccupantDocuments(formData.occupants || []),
        icon: "🏠"
      },
      {
        title: "Supporting Documents",
        documents: this.extractSupportingDocuments(formData),
        icon: "📋"
      }
    ];

    // Render each category
    fileCategories.forEach(category => {
      if (category.documents.length > 0) {
        this.addFileCategory(category.title, category.documents, category.icon);
      }
    });

    // Add file summary
    this.addFileSummary(fileCategories);
  }

  private extractDocuments(person: any, type: string): Array<{name: string, status: string, type: string, details?: string}> {
    const documents: Array<{name: string, status: string, type: string, details?: string}> = [];
    
    if (!person) return documents;

    // Basic identification documents
    if (person.ssn) documents.push({ name: "Social Security Card", status: "✅ Provided", type: "Identification", details: `Last 4 digits: ****${person.ssn.slice(-4)}` });
    if (person.license) documents.push({ name: "Driver's License", status: "✅ Provided", type: "Identification", details: `License #: ${person.license}` });
    if (person.dob) documents.push({ name: "Date of Birth Verification", status: "✅ Provided", type: "Identification", details: `DOB: ${new Date(person.dob).toLocaleDateString()}` });

    // Address documents
    if (person.address) documents.push({ name: "Current Address", status: "✅ Provided", type: "Residence", details: `${person.address}, ${person.city}, ${person.state} ${person.zip}` });
    if (person.landlordName) documents.push({ name: "Landlord Information", status: "✅ Provided", type: "Residence", details: `${person.landlordName} - ${person.landlordPhone || 'No phone'}` });

    // Employment documents
    if (person.employmentType) documents.push({ name: "Employment Type", status: "✅ Provided", type: "Employment", details: person.employmentType });
    if (person.employer) documents.push({ name: "Employer Information", status: "✅ Provided", type: "Employment", details: `${person.employer} - ${person.position || 'No position'}` });
    if (person.income) documents.push({ name: "Income Information", status: "✅ Provided", type: "Financial", details: `$${person.income} ${person.incomeFrequency || 'yearly'}` });

    // Financial documents
    if (person.bankRecords && person.bankRecords.length > 0) {
      person.bankRecords.forEach((record: any, index: number) => {
        documents.push({ 
          name: `Bank Account ${index + 1}`, 
          status: "✅ Provided", 
          type: "Financial", 
          details: `${record.bankName || 'Unknown Bank'} - ${record.accountType || 'Unknown Type'}` 
        });
      });
    }

    // Business documents (for self-employed)
    if (person.employmentType === 'self-employed') {
      if (person.businessName) documents.push({ name: "Business Name", status: "✅ Provided", type: "Business", details: person.businessName });
      if (person.businessType) documents.push({ name: "Business Type", status: "✅ Provided", type: "Business", details: person.businessType });
      if (person.yearsInBusiness) documents.push({ name: "Years in Business", status: "✅ Provided", type: "Business", details: `${person.yearsInBusiness} years` });
    }

    return documents;
  }

  private extractOccupantDocuments(occupants: any[]): Array<{name: string, status: string, type: string, details?: string}> {
    const documents: Array<{name: string, status: string, type: string, details?: string}> = [];
    
    occupants.forEach((occupant, index) => {
      if (occupant.name) {
        documents.push({ 
          name: `Occupant ${index + 1} - ${occupant.name}`, 
          status: "✅ Provided", 
          type: "Residence", 
          details: `Age: ${occupant.age || 'Not specified'}, Relationship: ${occupant.relationship || 'Not specified'}` 
        });
      }
    });

    return documents;
  }

  private extractSupportingDocuments(formData: FormData): Array<{name: string, status: string, type: string, details?: string}> {
    const documents: Array<{name: string, status: string, type: string, details?: string}> = [];
    
    // Application documents
    if (formData.application) {
      if (formData.application.buildingAddress) documents.push({ name: "Building Address", status: "✅ Provided", type: "Property", details: formData.application.buildingAddress });
      if (formData.application.apartmentNumber) documents.push({ name: "Apartment Number", status: "✅ Provided", type: "Property", details: formData.application.apartmentNumber });
      if (formData.application.monthlyRent) documents.push({ name: "Monthly Rent", status: "✅ Provided", type: "Property", details: `$${formData.application.monthlyRent}` });
      if (formData.application.moveInDate) documents.push({ name: "Move-in Date", status: "✅ Provided", type: "Property", details: new Date(formData.application.moveInDate).toLocaleDateString() });
    }

    // Legal questions
    if (formData.jsonPayload) {
      if (formData.jsonPayload.landlordTenantLegalAction) documents.push({ name: "Legal Action History", status: "✅ Provided", type: "Legal", details: formData.jsonPayload.landlordTenantLegalAction });
      if (formData.jsonPayload.brokenLease) documents.push({ name: "Lease History", status: "✅ Provided", type: "Legal", details: formData.jsonPayload.brokenLease });
    }

    return documents;
  }

  private addFileCategory(title: string, documents: Array<{name: string, status: string, type: string, details?: string}>, icon: string) {
    this.checkPageBreak();
    
    // Category header
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.text(`${icon} ${title}`, this.marginLeft, this.yPosition);
    this.yPosition += 8;

    // Add documents in a table format
    documents.forEach((doc, index) => {
      this.checkPageBreak();
      
      // Document row with border
      this.doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]);
      this.doc.setLineWidth(0.1);
      this.doc.rect(this.marginLeft, this.yPosition - 2, this.contentWidth, 12, 'S');
      
      // Document name
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
      this.doc.text(doc.name, this.marginLeft + 2, this.yPosition + 3);
      
      // Status
      this.doc.setFont('helvetica', 'normal');
      if (doc.status.includes('✅')) {
        this.doc.setTextColor(0, 128, 0);
      } else {
        this.doc.setTextColor(255, 0, 0);
      }
      this.doc.text(doc.status, this.marginLeft + 80, this.yPosition + 3);
      
      // Type
      this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
      this.doc.text(doc.type, this.marginLeft + 120, this.yPosition + 3);
      
      // Details (if available)
      if (doc.details) {
        this.doc.setFontSize(7);
        this.doc.setTextColor(128, 128, 128);
        this.doc.text(doc.details, this.marginLeft + 2, this.yPosition + 8);
      }
      
      this.yPosition += 15;
    });
    
    this.yPosition += 5; // Space between categories
  }

  private addFileSummary(categories: any[]): void {
    this.checkPageBreak();
    
    // Summary header
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.accentColor[0], this.accentColor[1], this.accentColor[2]);
    this.doc.text("📊 DOCUMENT SUMMARY", this.marginLeft, this.yPosition);
    this.yPosition += 10;

    // Calculate totals
    const totalDocuments = categories.reduce((sum, cat) => sum + cat.documents.length, 0);
    const providedDocuments = categories.reduce((sum, cat) => sum + cat.documents.filter((d: any) => d.status.includes('✅')).length, 0);
    const missingDocuments = totalDocuments - providedDocuments;

    // Summary table
    this.doc.setFillColor(this.lightGray[0], this.lightGray[1], this.lightGray[2]);
    this.doc.rect(this.marginLeft, this.yPosition, this.contentWidth, 25, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    
    this.doc.text("Total Documents:", this.marginLeft + 5, this.yPosition + 8);
    this.doc.text("Provided:", this.marginLeft + 5, this.yPosition + 16);
    this.doc.text("Missing:", this.marginLeft + 5, this.yPosition + 24);
    
    this.doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.doc.text(totalDocuments.toString(), this.marginLeft + 80, this.yPosition + 8);
    this.doc.text(providedDocuments.toString(), this.marginLeft + 80, this.yPosition + 16);
    this.doc.text(missingDocuments.toString(), this.marginLeft + 80, this.yPosition + 24);
    
    this.yPosition += 30;
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
    this.addPersonalInfo("Primary Applicant", formData.applicant);
    this.addFinancialInfo("Primary Applicant", formData.applicant);
    
    // Add co-applicant information if present
    if (formData.coApplicant && formData.coApplicant.name) {
      this.addPersonalInfo("Co-Applicant 1", formData.coApplicant);
      this.addFinancialInfo("Co-Applicant 1", formData.coApplicant);
    }
    
    // Add guarantor information if present
    if (formData.guarantor && formData.guarantor.name) {
      this.addPersonalInfo("Guarantor 1", formData.guarantor);
      this.addFinancialInfo("Guarantor 1", formData.guarantor);
    }
    
    // Supporting Documents section removed as requested

    // Add occupants section
    this.addOccupants(formData.occupants || []);
    
    // Add comprehensive file mapping and document index
    this.addComprehensiveFileMapping(formData);
    
    // Add JSON payload
    this.addJSONPayload(formData);
    
    // Add legal disclaimer
    this.addLegalDisclaimer();
    
    // Add signatures
    if (formData.signatures.applicant) {
      this.addSignature("Primary Applicant", formData.signatures.applicant);
    }
    
    // Add co-applicant signatures
    if (formData.signatures.coApplicant) {
      this.addSignature("Co-Applicant", formData.signatures.coApplicant);
    }
    
    // Add guarantor signatures
    if (formData.signatures.guarantor) {
      this.addSignature("Guarantor", formData.signatures.guarantor);
    }

    // Add footer
    this.addFooter();
    
    return this.doc.output('datauristring');
  }
} 