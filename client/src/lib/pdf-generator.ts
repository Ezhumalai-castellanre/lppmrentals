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
  occupants?: any[]; // Added for Other Occupants
  jsonPayload?: any; // Added for JSON payload
}

export class PDFGenerator {
  private doc: jsPDF;
  private yPosition: number = 20;
  private readonly pageWidth: number = 210;
  private readonly marginLeft: number = 20;
  private readonly marginRight: number = 20;

  constructor() {
    this.doc = new jsPDF();
  }

  private addText(text: string, fontSize: number = 10, isBold: boolean = false): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    this.doc.text(text, this.marginLeft, this.yPosition);
    this.yPosition += fontSize * 0.7; // Improved line spacing
  }

  private addSection(title: string): void {
    this.checkPageBreak();
    this.yPosition += 8; // Consistent spacing before sections
    this.addText(title, 12, true);
    this.yPosition += 4; // Reduced spacing after section titles
  }

  private addField(label: string, value: string | number | undefined): void {
    if (value !== undefined && value !== null && value !== '') {
      this.addText(`${label}: ${value}`, 10);
    }
  }

  private checkPageBreak(): void {
    if (this.yPosition > 270) {
      this.doc.addPage();
      this.yPosition = 20;
    }
  }

  private addHeader(): void {
    // Company name
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text("Liberty Place Property Management", 105, this.yPosition, { align: 'center' });
    this.yPosition += 8;
    
    // Address and contact info
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text("122 East 42nd Street, Suite 1903, New York, NY 10168", 105, this.yPosition, { align: 'center' });
    this.yPosition += 5;
    this.doc.text("Tel: (646) 545-6700 | Fax: (646) 304-2255", 105, this.yPosition, { align: 'center' });
    this.yPosition += 5;
    this.doc.text("Leasing Direct Line: (646) 545-6700", 105, this.yPosition, { align: 'center' });
    this.yPosition += 10;
    
    // Title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text("RENTAL APPLICATION", 105, this.yPosition, { align: 'center' });
    this.yPosition += 10;
    
    // Decorative line
    this.doc.setDrawColor(0, 102, 204);
    this.doc.setLineWidth(1);
    this.doc.line(this.marginLeft, this.yPosition, this.pageWidth - this.marginRight, this.yPosition);
    this.yPosition += 10;
  }

  private addRequirements(): void {
    this.addSection("Application Requirements");
    this.addText("• Applicants must show income of 40 TIMES THE MONTHLY RENT", 10);
    this.addText("• Guarantors must show income of 80 TIMES THE MONTHLY RENT", 10);
    this.addText("• $50.00 non-refundable processing fee per adult applicant and guarantor", 10);
    this.addText("• Applications must be submitted in full", 10);
  }

  private addApplicationInfo(data: FormData): void {
    this.checkPageBreak();
    this.addSection("Application Information");
    
    this.addField("Application Date", new Date().toLocaleDateString());
    this.addField("Building Address", data.application.buildingAddress);
    this.addField("Apartment Number", data.application.apartmentNumber);
    this.addField("Move-in Date", data.application.moveInDate);
    this.addField("Monthly Rent", `$${data.application.monthlyRent}`);
    this.addField("Apartment Type", data.application.apartmentType);
    this.addField("How did you hear about us", data.application.howDidYouHear);
    if (data.application.howDidYouHear === 'Other' && data.application.howDidYouHearOther) {
      this.addField("Other Source", data.application.howDidYouHearOther);
    }
  }

  private addPersonalInfo(title: string, person: any): void {
    this.checkPageBreak();
    this.addSection(title);
    
    this.addField("Full Name", person.name);
    this.addField("Date of Birth", person.dob);
    this.addField("Social Security Number", person.ssn);
    this.addField("Phone Number", person.phone);
    this.addField("Email Address", person.email);
    this.addField("Driver's License", person.license);
    this.addField("License State", person.licenseState);
    
    if (person.address) {
      this.addText("Address:", 10, true);
      this.addField("Street", person.address);
      this.addField("City", person.city);
      this.addField("State", person.state);
      this.addField("ZIP Code", person.zip);
      this.addField("Length at Address", person.lengthAtAddress);
    }
    
    this.addField("Current Landlord", person.landlordName);
    this.addField("Current Monthly Rent", person.currentRent ? `$${person.currentRent}` : undefined);
    this.addField("Reason for Moving", person.reasonForMoving);
    
    // Landlord Information
    if (person.landlordName || person.landlordAddressLine1 || person.landlordAddressLine2 || person.landlordCity || person.landlordState || person.landlordZipCode || person.landlordPhone || person.landlordEmail) {
      this.addText("Landlord Information:", 10, true);
      this.addField("Landlord Name", person.landlordName);
      this.addField("Landlord Address Line 1", person.landlordAddressLine1);
      this.addField("Landlord Address Line 2", person.landlordAddressLine2);
      this.addField("Landlord City", person.landlordCity);
      this.addField("Landlord State", person.landlordState);
      this.addField("Landlord ZIP Code", person.landlordZipCode);
      this.addField("Landlord Phone", person.landlordPhone);
      this.addField("Landlord Email", person.landlordEmail);
    }
  }

  private addFinancialInfo(title: string, person: any): void {
    this.checkPageBreak();
    this.addSection(`${title} - Employment & Financial Information`);
    
    this.addField("Current Employer", person.employer);
    this.addField("Position/Title", person.position);
    this.addField("Employment Start Date", person.employmentStart);
    this.addField("Annual Income", person.income ? `$${person.income}` : undefined);
    this.addField("Other Income", person.otherIncome ? `$${person.otherIncome}` : undefined);
    this.addField("Other Income Source", person.otherIncomeSource);
    
    // Bank Information (simplified)
    if (person.bankRecords && person.bankRecords.length > 0) {
      this.addText("Bank Information:", 10, true);
      person.bankRecords.forEach((bankRecord: any, index: number) => {
        const prefix = person.bankRecords.length > 1 ? `Bank ${index + 1} - ` : '';
        this.addField(`${prefix}Bank Name`, bankRecord.bankName);
        this.addField(`${prefix}Account Type`, bankRecord.accountType);
      });
    } else {
      this.addField("Bank Name", person.bankName);
      this.addField("Account Type", person.accountType);
    }
  }

  private addLegalQuestions(data: FormData): void {
    // Legal questions removed for privacy and simplification
    return;
  }

  private addSupportingDocuments(data: FormData): void {
    this.checkPageBreak();
    this.addSection("Supporting Documents");
    
    this.addText("The following documents are required for application processing:", 10);
    this.yPosition += 5;
    
    const requiredDocs = [
      "Government-issued Photo ID",
      "Social Security Card",
      "Bank Statement (most recent)",
      "Tax Returns (previous year)",
      "Employment Letter",
      "Pay Stubs (last 2-4)"
    ];
    
    requiredDocs.forEach(doc => {
      this.addText(`• ${doc}`, 9);
    });
    
    this.yPosition += 5;
    this.addText("Additional documents may be required based on employment status.", 9);
    this.addText("$50 processing fee required per adult applicant and guarantor.", 9);
  }

  private addSignature(title: string, signature: string): void {
    this.checkPageBreak();
    this.addSection(`${title} Signature`);
    
    if (signature) {
      try {
        // Add signature image
        this.doc.addImage(signature, 'PNG', this.marginLeft, this.yPosition, 60, 20);
        this.yPosition += 25;
      } catch (error) {
        this.addText("Digital signature provided", 10);
      }
    } else {
      this.addText("No signature provided", 10);
    }
    
    this.addText("Date: " + new Date().toLocaleDateString(), 10);
  }

  private addOccupants(occupants: any[]): void {
    if (!occupants || occupants.length === 0) return;
    
    this.checkPageBreak();
    this.addSection("Other Occupants");
    
    this.addText("Additional occupants who will be living in the apartment:", 10);
    this.yPosition += 4;
    
    occupants.forEach((occupant, index) => {
      this.addField("Name", occupant.name);
      this.addField("Relationship", occupant.relationship);
      this.addField("Date of Birth", occupant.dob);
      
      if (index < occupants.length - 1) {
        this.yPosition += 4; // Add spacing between occupants
      }
    });
    
    this.yPosition += 4;
  }

  private addTermsAndConditions(): void {
    this.checkPageBreak();
    this.addSection("Terms & Conditions / Legal Disclaimer");
    this.addText(
      "The Landlord will in no event be bound, nor will possession be given, unless and until a lease executed by the Landlord has been delivered to the Tenant. The applicant and his/her references must be satisfactory to the Landlord. Please be advised that the date on page one of the lease is not your move-in date. Your move-in date will be arranged with you after you have been approved. No representations or agreements by agents, brokers or others are binding on the Landlord or Agent unless included in the written lease proposed to be executed. I hereby warrant that all my representations set forth herein are true. I recognize the truth of the information contained herein is essential. I further represent that I am not renting a room or an apartment under any other name, nor have I ever been dispossessed from any apartment, nor am I now being dispossessed. I represent that I am over 18 years of age. I have been advised that I have the right, under section 8068 of the Fair Credit Reporting Act, to make a written request, directed to the appropriate credit reporting agency, within reasonable time, for a complete and accurate disclosure of the nature and scope of any credit investigation. I understand that upon submission, this application and all related documents become the property of the Landlord, and will not be returned to me under any circumstances. I authorize the Landlord, Agent and credit reporting agency to obtain a consumer credit report on me and to verify any information on this application with regard to my employment history, current and prior tenancies, bank accounts, and all other information that the Landlord deems pertinent to my obtaining residency. I understand that I shall not be permitted to receive or review my application file or my credit consumer report. I authorize banks, financial institutions, landlords, business associates, credit bureaus, attorneys, accountants and other persons or institutions with whom I am acquainted to furnish any and all information regarding myself. This authorization also applies to any update reports which may be ordered as needed. A photocopy or fax of this authorization shall be accepted with the same authority as this original. I will present any other information required by the Landlord or Agent in connection with the lease contemplated herein. I understand that the application fee is non-refundable. The Civil Rights Act of 1968, as amended by the Fair Housing Amendments Act of 1988, prohibits discrimination in the rental of housing based on race, color, religion, sex, handicap, familial status or national origin. The Federal Agency, which administers compliance with this law, is the U.S. Department of Housing and Urban Development.",
      9
    );
  }

  private addInstructionsAndRequirements(): void {
    this.checkPageBreak();
    this.addSection("LIBERTY PLACE");
    this.addText("122 East 42nd Street, Suite 1903 New York, NY 10168", 10);
    this.addText("Tel: 646.545.6710 Fax: (646) 304-2255 Leasing Direct Line: 646.545.6710", 10);
    this.yPosition += 2;
    this.addText("Thank you for choosing a Liberty Place Property Management apartment.", 10);
    this.yPosition += 2;
    this.addText("Applicants must show income of 40 TIMES THE MONTHLY RENT. (may be combined among applicants)", 10);
    this.addText("Guarantors must show income of 80 TIMES THE MONTHLY RENT. (may NOT be combined with applicants)", 10);
    this.addText("Applications packages must be submitted in full as detailed below. Only complete applications will be reviewed and considered for tenancy.", 10);
    this.addText("Applications will not remove apartments from the market.", 10);
    this.addText("Lease signings must be scheduled within three (3) days of approval or the backup applicant will be considered.", 10);
    this.yPosition += 2;
    this.addText("We look forward to servicing your residential needs.", 10);
    this.yPosition += 2;
    this.addText("YOUR APPLICATION PACKAGE MUST INCLUDE:", 10, true);
    this.addText("Completed and Signed application by applicants and guarantors $50.00 Non-refundable processing fee per adult applicant and per guarantor- Money order or cashier's check", 10);
    this.addText("Driver's License or Photo ID (18 & over) Social Security Card Financial Statement - First Page (Checking, Savings and/or other assets) Previous year tax returns - First Page", 10);
    this.addText("Proof of Employment if you work for a company: 1. Letter on company letterhead including length of employment, salary & position 2. Last 4 paystubs (If paid weekly) - or - Last 2 paystubs (if paid bi-weekly or semi-monthly)", 10);
    this.addText("Proof of Employment if you are self-employed: 1. Previous year 1099 2. Notarized Letter from your accountant on his/her company letterhead verifying: A. Nature of the business B. Length of employment C. Income holdings D. Projected annual income expected for the current year and upcoming year.", 10);
    this.yPosition += 2;
    this.addText("CORPORATE APPLICANTS MUST SUBMIT A SEPARATE APPLICATION ALONG WITH:", 10, true);
    this.addText("$150.00 Non-refundable application fee Corporate officer as a guarantor Information of the company employee that will occupy the apartment Certified Financial Statements Corporate Tax Returns (two (2) most recent consecutive returns)", 10);
  }

  private addJSONPayload(data: FormData): void {
    if (!data.jsonPayload) return;
    
    this.checkPageBreak();
    this.addSection("Application Metadata");
    
    this.addField("Application ID", data.jsonPayload.applicationId);
    this.addField("Submission Date", data.jsonPayload.submissionDate ? new Date(data.jsonPayload.submissionDate).toLocaleString() : undefined);
    this.addField("Status", data.jsonPayload.status);
    this.addField("Total Applicants", data.jsonPayload.totalApplicants);
    this.addField("Total Occupants", data.jsonPayload.totalOccupants);
    this.addField("Total Bank Accounts", data.jsonPayload.totalBankAccounts);
    this.addField("Processing Fee", data.jsonPayload.processingFee ? `$${data.jsonPayload.processingFee}` : undefined);
    this.addField("Estimated Processing Time", data.jsonPayload.estimatedProcessingTime);
  }

  public generatePDF(formData: FormData): string {
    // Add Liberty Place instructions and requirements
    this.addInstructionsAndRequirements();
    // Add header
    this.addHeader();
    
    // Add requirements
    this.addRequirements();
    
    // Add application information
    this.addApplicationInfo(formData);
    
    // Add JSON payload
    this.addJSONPayload(formData);
    
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
    
    // Add supporting documents
    this.addSupportingDocuments(formData);

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

    // Add terms & conditions at the end
    this.addTermsAndConditions();
    
    // Add footer
    this.checkPageBreak();
    this.yPosition += 10;
    this.addText("This application was submitted electronically on " + new Date().toLocaleString(), 8);
    this.addText("Liberty Place Property Management - Rental Application", 8);
    
    return this.doc.output('datauristring');
  }
}
