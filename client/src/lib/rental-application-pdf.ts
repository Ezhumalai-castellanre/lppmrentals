// rental-application-pdf.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  extractSignaturesForPDF, 
  processSignatureData, 
  getSignatureDisplayText,
  type SignatureData 
} from "./signature-utils";

export class RentalApplicationPDF {
    doc: jsPDF;
    currentY: number;
    pageWidth: number;
    marginLeft: number;
    marginRight: number;
    marginBottom: number;
    contentWidth: number;

    constructor() {
        this.currentY = 40;
        this.doc = new jsPDF({ unit: "px", format: "a4" });
        this.pageWidth = this.doc.internal.pageSize.getWidth(); // Get actual A4 width
        this.marginLeft = 30; // Increased for better left margin
        this.marginRight = 30; // Increased for better right margin
        this.marginBottom = 30;
        this.contentWidth = this.pageWidth - this.marginLeft - this.marginRight;
    }

    addHeader() {
        // Company logo placeholder - Perfectly positioned
        const logoRectX = this.marginLeft;
        const logoRectY = this.currentY;
        const logoRectWidth = 32; // Slightly larger for better proportions
        const logoRectHeight = 22; // Slightly taller for better proportions

        this.doc.setFillColor(0, 102, 204);
        this.doc.rect(logoRectX, logoRectY, logoRectWidth, logoRectHeight, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(8); // Perfect font size for logo
        this.doc.setFont("helvetica", "bold");
        this.doc.text('LIBERTY', logoRectX + 5, logoRectY + 9); // Perfectly centered in logo
        this.doc.text('PLACE', logoRectX + 5, logoRectY + 16); // Perfectly centered in logo
        
        // Company name - Perfectly aligned with logo
        const companyNameX = this.marginLeft + logoRectWidth + 18; // Perfect spacing after logo
        this.doc.setTextColor(0, 102, 204);
        this.doc.setFontSize(18); // Perfect size for company name
        this.doc.setFont("helvetica", "bold");
        this.doc.text("Liberty Place Property Management", companyNameX, this.currentY + 13); // Perfect vertical alignment
        
        // Address and contact info - Perfectly aligned with company name
        this.doc.setFontSize(9); // Perfect size for contact info
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(51, 51, 51);
        
        // Perfectly aligned address and contact lines
        this.doc.text("122 East 42nd Street, Suite 1903", companyNameX, this.currentY + 22);
        this.doc.text("New York, NY 10168", companyNameX, this.currentY + 30);
        this.doc.text("Tel: (646) 545-6700 | Fax: (646) 304-2255", companyNameX, this.currentY + 38);
        this.doc.text("Leasing Direct Line: (646) 545-6700", companyNameX, this.currentY + 46);
        
        this.currentY += 52; // Perfect spacing after contact info
        
        // Title with decorative elements - Perfectly centered
        this.doc.setFillColor(255, 193, 7); // Vibrant yellow
        const titleRectHeight = 20; // Perfect height for visual impact
        this.doc.rect(this.marginLeft, this.currentY, this.contentWidth, titleRectHeight, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(16); // Perfect title font size
        this.doc.setFont("helvetica", "bold");
        // Perfectly center the title both horizontally and vertically
        this.doc.text("RENTAL APPLICATION", this.pageWidth / 2, this.currentY + titleRectHeight / 2 + 5, { align: 'center' });
        this.currentY += titleRectHeight + 22; // Perfect spacing after title bar
        
        // Application ID and date - Perfectly aligned
        this.doc.setTextColor(51, 51, 51);
        this.doc.setFontSize(10); // Perfect date font size
        this.doc.setFont("helvetica", "normal");
        // Left date - perfectly aligned with left margin
        this.doc.text(`Application Date: ${new Date().toLocaleDateString()}`, this.marginLeft, this.currentY);
        // Right date - perfectly aligned with right margin
        this.doc.text(`Generated: ${new Date().toLocaleString()}`, this.pageWidth - this.marginRight, this.currentY, { align: 'right' });
        this.currentY += 28; // Perfect spacing after date info
    }

    /**
     * Check if we need to add a page break and add one if necessary
     */
    checkPageBreak(requiredHeight: number = 100) {
        const pageHeight = this.doc.internal.pageSize.getHeight();
        // Use marginBottom for better control of last page spacing
        if (this.currentY + requiredHeight > pageHeight - this.marginBottom) {
            this.doc.addPage();
            this.currentY = 40;
            return true;
        }
        return false;
    }

    addSectionTitle(title: string) {
        // Check if we need a page break before adding a new section
        this.checkPageBreak(60); // Increased required height
        
        this.currentY += 18; // Perfect spacing before section titles
        
        const titleWidth = this.contentWidth;
        const titleHeight = 24; // Perfect height for visual impact
        
        // Background rectangle with perfect positioning
        this.doc.setFillColor(240, 248, 255); // Light blue background
        this.doc.rect(this.marginLeft, this.currentY - 10, titleWidth, titleHeight, 'F');
        
        // Border with perfect positioning
        this.doc.setDrawColor(0, 102, 204);
        this.doc.setLineWidth(1); // Perfect border thickness
        this.doc.rect(this.marginLeft, this.currentY - 10, titleWidth, titleHeight, 'S');
        
        // Title text with perfect positioning
        this.doc.setFontSize(14); // Perfect section title font size
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(0, 102, 204);
        this.doc.text(title, this.marginLeft + 15, this.currentY + 9); // Perfectly positioned text
        
        this.currentY += titleHeight + 18; // Perfect spacing after title
    }

    addKeyValueTable(data: any, exclude: string[] = [], title?: string) {
        if (!data)
            return;
            
        // Create a mapping of field names to display names
        const fieldMappings: { [key: string]: string } = {
            name: "Full Name",
            email: "Email Address",
            phone: "Phone Number",
            dob: "Date of Birth",
            ssn: "Social Security Number",
            license: "Driver's License",
            licenseState: "License State",
            address: "Street Address",
            city: "City",
            state: "State",
            zip: "ZIP Code",
            lengthAtAddress: "Length at Address",
            lengthAtAddressYears: "Length at Address (Years)",
            lengthAtAddressMonths: "Length at Address (Months)",
            currentRent: "Current Monthly Rent",
            reasonForMoving: "Reason for Moving",
            landlordName: "Current Landlord",
            landlordAddressLine1: "Landlord Address Line 1",
            landlordAddressLine2: "Landlord Address Line 2",
            landlordCity: "Landlord City",
            landlordState: "Landlord State",
            landlordZipCode: "Landlord ZIP Code",
            landlordPhone: "Landlord Phone",
            landlordEmail: "Landlord Email",
            employmentType: "Employment Type",
            position: "Position",
            employmentStart: "Employment Start Date",
            income: "Monthly Income",
            incomeFrequency: "Income Frequency",
            otherIncome: "Other Income",
            otherIncomeFrequency: "Other Income Frequency",
            otherIncomeSource: "Other Income Source",
            businessName: "Business Name",
            businessType: "Business Type",
            yearsInBusiness: "Years in Business",
            relationship: "Relationship",
            age: "Age",
            buildingAddress: "Building Address",
            apartmentNumber: "Apartment Number",
            apartmentType: "Apartment Type",
            monthlyRent: "Monthly Rent",
            howDidYouHear: "How Did You Hear",
            moveInDate: "Move-in Date",
            employer: "Employer",
            coApplicantPosition: "Position",
            coApplicantStartDate: "Employment Start Date",
            coApplicantSalary: "Salary",
            coApplicantIncomeFrequency: "Income Frequency",
            coApplicantOtherIncome: "Other Income",
            coApplicantOtherIncomeSource: "Other Income Source",
            coApplicantBankRecords: "Bank Records",
            coApplicantEmployer: "Employer"
        };

        const body = Object.entries(data)
            .filter(([key, val]) => {
            if (exclude.includes(key))
                return false;
            if (typeof val === "object" && val !== null)
                return false;
                if (val === null || val === undefined || val === "" || val === "empty" || val === "undefined")
                return false;
            return true;
        })
            .map(([key, val]) => {
            let displayValue = val;
            // Format dates properly
                if (['dob', 'employmentStart', 'moveInDate', 'coApplicantStartDate'].includes(key)) {
                try {
                        const date = new Date(val as string | number | Date);
                    if (!isNaN(date.getTime())) {
                        displayValue = date.toLocaleDateString();
                    }
                }
                catch (e) {
                        // Keep original value if parsing fails
                }
            }
            // Format income values
                if (['income', 'otherIncome', 'monthlyRent', 'currentRent', 'coApplicantSalary', 'coApplicantOtherIncome'].includes(key)) {
                if (typeof val === 'number' || !isNaN(Number(val))) {
                    displayValue = `$${Number(val).toLocaleString()}`;
                }
            }
                // Calculate age from date of birth (if dob exists)
            if (key === 'age' && data.dob) {
                try {
                    const dob = new Date(data.dob);
                    if (!isNaN(dob.getTime())) {
                        const today = new Date();
                            let age = today.getFullYear() - dob.getFullYear();
                        const monthDiff = today.getMonth() - dob.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                                age--;
                        }
                            displayValue = age > 0 ? `${age} years old` : 'Less than 1 year old';
                        } else {
                            displayValue = "[Invalid Date]";
                        }
                    } catch (e) {
                        displayValue = "[Error Calculating Age]";
                    }
                }
                
            return [
                fieldMappings[key] || this.toLabel(key),
                    String(displayValue),
            ];
        });

        if (!body.length)
            return;

        if (title) {
            this.doc.setFontSize(12); // Larger subtitle font
            this.doc.setFont("helvetica", "bold");
            this.doc.setTextColor(51, 51, 51);
            this.doc.text(title, this.marginLeft, this.currentY);
            this.currentY += 18; // Increased spacing after subtitle
        }

        // Calculate better column widths for professional alignment
        const fieldColumnWidth = 180; // Increased width for field names
        const valueColumnWidth = this.contentWidth - fieldColumnWidth - 15; // Better spacing

        autoTable(this.doc, {
            startY: this.currentY,
            head: [], // No headers
            body,
            margin: { left: this.marginLeft, right: this.marginRight },
            styles: { 
                fontSize: 10, // Larger table font
                cellPadding: 8, // Increased padding
                lineWidth: 0.8, // Thicker lines for better visibility
                lineColor: [180, 180, 180], // Better line color
                textColor: [51, 51, 51]
            },
            headStyles: { 
                fillColor: [0, 102, 204], 
                textColor: [255, 255, 255],
                fontSize: 11, // Larger head font
                fontStyle: 'bold',
                cellPadding: 9 // Increased head padding
            },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            columnStyles: {
                0: { 
                    cellWidth: fieldColumnWidth, 
                    fontStyle: 'bold',
                    cellPadding: 8
                },
                1: { 
                    cellWidth: valueColumnWidth,
                    cellPadding: 8
                }
            },
            // Ensure grid lines are visible
            tableWidth: 'auto',
            showFoot: 'lastPage',
            showHead: 'firstPage'
        });
        
        // Fix the linter error by using proper table positioning
        this.currentY = (this.doc as any).lastAutoTable?.finalY + 25 || this.currentY + 100;
    }

    addBankTable(banks: any[] | undefined, title = "Bank Records") {
        if (!banks?.length)
            return;
            
        this.doc.setFontSize(12); // Larger title font
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(51, 51, 51);
        this.doc.text(title, this.marginLeft, this.currentY);
        this.currentY += 18; // Increased spacing after title
        
        const body = banks.map((b) => [b.bankName || "N/A", b.accountType || "N/A"]);
        
        const fieldColumnWidth = 180; // Consistent with main tables
        const valueColumnWidth = this.contentWidth - fieldColumnWidth - 15;
        
        autoTable(this.doc, {
            startY: this.currentY,
            head: [], // No headers
            body,
            margin: { left: this.marginLeft, right: this.marginRight },
            styles: { 
                fontSize: 10, 
                cellPadding: 8,
                lineWidth: 0.8, // Consistent with main tables
                lineColor: [180, 180, 180], // Consistent with main tables
                textColor: [51, 51, 51]
            },
            headStyles: { 
                fillColor: [51, 51, 51], 
                textColor: [255, 255, 255],
                fontSize: 11,
                fontStyle: 'bold',
                cellPadding: 9
            },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            columnStyles: {
                0: { 
                    cellWidth: fieldColumnWidth,
                    cellPadding: 8
                },
                1: { 
                    cellWidth: valueColumnWidth,
                    cellPadding: 8
                }
            },
            // Ensure grid lines are visible
            tableWidth: 'auto',
            showFoot: 'lastPage',
            showHead: 'firstPage'
        });
        
        // Fix the linter error by using proper table positioning
        this.currentY = (this.doc as any).lastAutoTable?.finalY + 25 || this.currentY + 100;
    }

    addInstructions() {
        this.addSectionTitle("Application Instructions");
        
        const instructions = [
            "Thank you for choosing a Liberty Place Property Management apartment.",
            "",
            "IMPORTANT REQUIREMENTS:",
            "• Applicants must show income of 40 TIMES THE MONTHLY RENT (may be combined among applicants)",
            "• Guarantors must show income of 80 TIMES THE MONTHLY RENT (may NOT be combined with applicants)",
            "• Application packages must be submitted in full as detailed below",
            "• Only complete applications will be reviewed and considered for tenancy",
            "• Applications will not remove apartments from the market",
            "• Lease signings must be scheduled within three (3) days of approval or the backup applicant will be considered",
            "",
            "We look forward to servicing your residential needs.",
            "",
            "YOUR APPLICATION PACKAGE MUST INCLUDE:",
            "• Completed and Signed application by applicants and guarantors",
            "• Driver's License or Photo ID (18 & over)",
            "• Social Security Card",
            "• Financial Statement First Page (Checking, Savings and/or other assets)",
            "• Previous year tax returns First Page",
            "",
            "Proof of Employment if you work for a company:",
            "• Letter on company letterhead From current employer including length of employment, salary & position",
            "• Last 4 paystubs (If paid weekly) - or - Last 2 paystubs (if paid every weeks or semi-monthly)",
            "",
            "Proof of Employment if you are self-employed:",
            "• Previous year 1099",
            "• Notarized Letter from your accountant on his/her company letterhead verifying:",
            "  A. Nature of the business",
            "  B. Length of employment",
            "  C. Income holdings",
            "  D. Projected annual income expected for the current year and upcoming year.",
            "",
            "CORPORATE APPLICANTS MUST SUBMIT A SEPARATE APPLICATION ALONG WITH:",
            "• $150.00 Non-refundable application fee",
            "• Corporate officer as a guarantor",
            "• Information of the company employee that will occupy the apartment",
            "• Certified Financial Statements",
            "• Corporate Tax Returns (two (2) most recent consecutive returns)"
        ];

        instructions.forEach(instruction => {
            if (instruction === "") {
                this.currentY += 10; // Better spacing for empty lines
            }
            else if (instruction.startsWith("•")) {
                this.doc.setFontSize(9); // Larger font for list items
                this.doc.setFont("helvetica", "normal");
                this.doc.setTextColor(51, 51, 51);
                this.doc.text(instruction, this.marginLeft + 12, this.currentY); // Better indent alignment
                this.currentY += 14; // Better spacing between bullet points
            }
            else if (instruction.includes(":")) {
                this.doc.setFontSize(11); // Larger font for sub-headers
                this.doc.setFont("helvetica", "bold");
                this.doc.setTextColor(0, 102, 204);
                this.doc.text(instruction, this.marginLeft, this.currentY);
                this.currentY += 18; // Better spacing after section headers
            }
            else {
                this.doc.setFontSize(9); // Larger font for regular text
                this.doc.setFont("helvetica", "normal");
                this.doc.setTextColor(51, 51, 51);
                this.doc.text(instruction, this.marginLeft, this.currentY);
                this.currentY += 14; // Better spacing for regular text
            }
        });
        
        this.currentY += 25; // Better final spacing
    }

    addApplicantInfo(applicant: any) {
        this.addSectionTitle("Primary Applicant Information");
        
        // Define fields to exclude from Personal Information
        const personalExclude = ["bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "employmentType", "position", "employmentStart", "income", "incomeFrequency", "otherIncome", "otherIncomeFrequency", "otherIncomeSource", "businessName", "businessType", "yearsInBusiness", "ssn", "license", "dob", "age"];
        
        // Personal Information
        this.addKeyValueTable(applicant, personalExclude, "Personal Information");
        
        // Address Information
        const addressData = { ...applicant };
        if (applicant.lengthAtAddressYears !== undefined || applicant.lengthAtAddressMonths !== undefined) {
            const years = applicant.lengthAtAddressYears || 0;
            const months = applicant.lengthAtAddressMonths || 0;
            if (years > 0 || months > 0) {
                if (years > 0 && months > 0) {
                    addressData.lengthAtAddress = `${years} years, ${months} months`;
                }
                else if (years > 0) {
                    addressData.lengthAtAddress = `${years} years`;
                }
                else if (months > 0) {
                    addressData.lengthAtAddress = `${months} months`;
                }
                else {
                    addressData.lengthAtAddress = "Less than 1 month";
                }
            }
            else {
                addressData.lengthAtAddress = "Not provided";
            }
        }
        else {
            addressData.lengthAtAddress = "Not provided";
        }
        this.addKeyValueTable(addressData, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "lengthAtAddressYears", "lengthAtAddressMonths", "age"], "Current Address");
        
        // Landlord Information
        const landlordExclude = ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "age"];
        this.addKeyValueTable(applicant, landlordExclude, "Landlord Information");
        
        // Employment Information
        const employmentExclude = ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "age"];
        this.addKeyValueTable(applicant, employmentExclude, "Primary Applicant Financial Information");
        
        // Business Information
        const businessExclude = ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "employmentType", "position", "employmentStart", "income", "incomeFrequency", "otherIncome", "otherIncomeFrequency", "otherIncomeSource", "age"];
        this.addKeyValueTable(applicant, businessExclude, "Business Information");
        
        // Bank Records
        this.addBankTable(applicant?.bankRecords, "Bank Information");
    }
    
    addCoApplicantInfo(coApplicant: any, index: number) {
        this.addSectionTitle(`Co-Applicant ${index + 1} Information`);
        
        // Define fields to exclude from Personal Information for co-applicants
        const personalExclude = ["bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "employmentType", "position", "employmentStart", "income", "incomeFrequency", "otherIncome", "otherIncomeFrequency", "otherIncomeSource", "businessName", "businessType", "yearsInBusiness", "ssn", "license", "dob", "age"];
        
        // Personal Information
        this.addKeyValueTable(coApplicant, personalExclude, "Personal Information");
        
        // Address Information
        const addressData = { ...coApplicant };
        if (coApplicant.lengthAtAddressYears !== undefined || coApplicant.lengthAtAddressMonths !== undefined) {
            const years = coApplicant.lengthAtAddressYears || 0;
            const months = coApplicant.lengthAtAddressMonths || 0;
            if (years > 0 || months > 0) {
                if (years > 0 && months > 0) {
                    addressData.lengthAtAddress = `${years} years, ${months} months`;
                }
                else if (years > 0) {
                    addressData.lengthAtAddress = `${years} years`;
                }
                else if (months > 0) {
                    addressData.lengthAtAddress = `${months} months`;
                }
                else {
                    addressData.lengthAtAddress = "Less than 1 month";
                }
            }
            else {
                addressData.lengthAtAddress = "Not provided";
            }
        }
        else {
            addressData.lengthAtAddress = "Not provided";
        }
        this.addKeyValueTable(addressData, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "lengthAtAddressYears", "lengthAtAddressMonths", "age"], "Current Address");
        
        // Landlord Information
        const landlordExclude = ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "age"];
        this.addKeyValueTable(coApplicant, landlordExclude, "Landlord Information");
        
        // Employment Information
        const employmentExclude = ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "age"];
        this.addKeyValueTable(coApplicant, employmentExclude, `Co-Applicant ${index + 1} Financial Information`);
        
        // Business Information
        const businessExclude = ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "employmentType", "position", "employmentStart", "income", "incomeFrequency", "otherIncome", "otherIncomeFrequency", "otherIncomeSource", "age"];
        this.addKeyValueTable(coApplicant, businessExclude, "Business Information");
        
        // Bank Records
        this.addBankTable(coApplicant.bankRecords, `Co-Applicant ${index + 1} Bank Information`);
    }
    
    addGuarantorInfo(guarantor: any, index: number) {
        this.addSectionTitle(`Guarantor ${index + 1} Information`);
        
        // Define fields to exclude from Personal Information for guarantors
        const personalExclude = ["bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "employmentType", "position", "employmentStart", "income", "incomeFrequency", "otherIncome", "otherIncomeFrequency", "otherIncomeSource", "businessName", "businessType", "yearsInBusiness", "ssn", "license", "dob", "age"];
        
        // Personal Information
        this.addKeyValueTable(guarantor, personalExclude, "Personal Information");
        
        // Address Information
        const addressData = { ...guarantor };
        if (guarantor.lengthAtAddressYears !== undefined || guarantor.lengthAtAddressMonths !== undefined) {
            const years = guarantor.lengthAtAddressYears || 0;
            const months = guarantor.lengthAtAddressMonths || 0;
            if (years > 0 || months > 0) {
                if (years > 0 && months > 0) {
                    addressData.lengthAtAddress = `${years} years, ${months} months`;
                }
                else if (years > 0) {
                    addressData.lengthAtAddress = `${years} years`;
                }
                else if (months > 0) {
                    addressData.lengthAtAddress = `${months} months`;
                }
                else {
                    addressData.lengthAtAddress = "Less than 1 month";
                }
            }
            else {
                addressData.lengthAtAddress = "Not provided";
            }
        }
        else {
            addressData.lengthAtAddress = "Not provided";
        }
        this.addKeyValueTable(addressData, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "lengthAtAddressYears", "lengthAtAddressMonths", "age"], "Current Address");
        
        // Landlord Information
        const landlordExclude = ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "age"];
        this.addKeyValueTable(guarantor, landlordExclude, "Landlord Information");
        
        // Employment Information
        const employmentExclude = ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "age"];
        this.addKeyValueTable(guarantor, employmentExclude, `Guarantor ${index + 1} Financial Information`);
        
        // Business Information
        const businessExclude = ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "employmentType", "position", "employmentStart", "income", "incomeFrequency", "otherIncome", "otherIncomeFrequency", "otherIncomeSource", "age"];
        this.addKeyValueTable(guarantor, businessExclude, "Business Information");
        
        // Bank Records
        this.addBankTable(guarantor.bankRecords, `Guarantor ${index + 1} Bank Information`);
    }
    
    addOccupants(occupants: any[]) {
        if (!occupants?.length)
            return;
        this.addSectionTitle("Other Occupants");
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(51, 51, 51);
        this.doc.text("Additional occupants who will be living in the apartment:", this.marginLeft, this.currentY);
        this.currentY += 18; // Better spacing
        occupants.forEach((o, idx) => {
            // For occupants, you might want to hide SSN, License, DOB, Age as well
            const occupantExclude = ["ssn", "license", "dob", "age"];
            this.addKeyValueTable(o, occupantExclude, `Occupant ${idx + 1} Information`);
        });
    }

    /**
     * Attempts to add a base64 image signature to the PDF.
     * If not a valid image, it falls back to displaying a text message.
     * @param signatureData The base64 string (e.g., data:image/png;base64,...) or text signature.
     * @param x The x-coordinate for the image.
     * @param y The y-coordinate for the image.
     * @param maxWidth The maximum width for the image.
     * @param maxHeight The maximum height for the image.
     * @returns The height of the added content (image or text).
     */
    addSignatureImageOrText(signatureData: any, x: number, y: number, maxWidth: number, maxHeight: number): number {
        const processedSignature = processSignatureData(signatureData);
        
        if (processedSignature.type === 'image' && processedSignature.data) {
            try {
                const imgType = processedSignature.data.substring(processedSignature.data.indexOf('/') + 1, processedSignature.data.indexOf(';'));
                const imgData = processedSignature.data.split(',')[1];

                if (imgData && imgType) {
                    // Use the full dimensions provided for better signature quality
                    const width = maxWidth;
                    const height = maxHeight;
                    
                    console.log('🔍 Adding signature image:', { width, height, imgType, x, y });
                    
                    // Add the image with proper positioning
                    this.doc.addImage(imgData, imgType.toUpperCase(), x, y, width, height);
                    
                    // Better border around signature for professional appearance
                    this.doc.setDrawColor(80, 80, 80); // Darker border
                    this.doc.setLineWidth(1.5); // Thicker border
                    this.doc.rect(x - 2, y - 2, width + 4, height + 4, 'S'); // Border around signature
                    
                    return height + 10; // Return height plus small padding
                }
            } catch (error) {
                console.error('🔍 Error adding signature image:', error);
                // Fallback to text if image adding fails
            }
        }
        
        // Better signature line for missing signatures
        this.doc.setDrawColor(80, 80, 80); // Darker line color
        this.doc.setLineWidth(2); // Much thicker line for better visibility
        this.doc.line(x, y + 25, x + maxWidth, y + 25); // Better positioned line
        
        // Better text display for missing signatures
        this.doc.setFontSize(11); // Larger font
        this.doc.setFont("helvetica", "italic");
        this.doc.setTextColor(100, 100, 100); // Darker text color
        this.doc.text(processedSignature.displayText, x, y + 15); // Better positioned text
        
        return 40; // Better height for signature line and text
    }

    addSignatures(data: any) {
        // Check page break before starting signatures section
        this.checkPageBreak(200); // Ensure enough space for signatures
        
        this.addSectionTitle("PLEASE READ CAREFULLY BEFORE SIGNING");
        const disclaimerText = "The Landlord shall not be bound by any lease, nor will possession of the premises be delivered to the Tenant, until a written lease agreement is executed by the Landlord and delivered to the Tenant. Approval of this application remains at Landlord's discretion until a lease agreement is fully executed. Please be advised that the date on page one of the lease is your move-in date and also denotes the lease commencement date. No representations or agreements by agents, brokers or others shall be binding upon the Landlord or its Agent unless those representations or agreements are set forth in the written lease agreement executed by both Landlord and Tenant.";
        
        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(51, 51, 51);
        const lines = this.doc.splitTextToSize(disclaimerText, this.contentWidth);
        this.doc.text(lines, this.marginLeft, this.currentY);
        this.currentY += lines.length * 12 + 15;

        // Certification & Consents section
        this.doc.setFontSize(11); // Larger font for better readability
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(0, 102, 204);
        this.doc.text("Certification & Consents", this.marginLeft, this.currentY);
        this.currentY += 10; // Better spacing after title

        const certificationText = "By signing this application electronically, I consent to the use of electronic records and digital signatures in connection with this application and any resulting lease agreement. I agree that my electronic signature is legally binding and has the same effect as a handwritten signature. I hereby warrant that all my representations and information provided in this application are true, accurate, and complete to the best of my knowledge. I recognize the truth of the information contained herein is essential and I acknowledge that any false or misleading information may result in the rejection of my application or rescission of the offer prior to possession or, if a lease has been executed and/or possession delivered, may constitute a material breach and provide grounds to commence appropriate legal proceedings to terminate the tenancy, as permitted by law. I further represent that I am not renting a room or an apartment under any other name, nor have I ever been dispossessed or evicted from any residence, nor am I now being dispossessed nor currently being evicted. I represent that I am over at least 18 years of age. I acknowledge and consent that my Social Security number and any other personal identifying information collected in this application may be used for tenant screening and will be maintained in confidence and protected against unauthorized disclosure in accordance with New York General Business Law and related privacy laws. I have been advised that I have the right, under the Fair Credit Reporting Act, to make a written request, directed to the appropriate credit reporting agency, within reasonable time, for a complete and accurate disclosure of the nature and scope of any credit investigation. I understand that upon submission, this application and all related documents become the property of the Landlord, and will not be returned to me under any circumstances regardless of whether my application is approved or denied. I consent to and authorize the Landlord, Agent and any designated screening or credit reporting agency to obtain a consumer credit report on me and to conduct any necessary background checks, to the extent permitted by law. I further authorize the Landlord and Agent to verify any and all information provided in this application with regard to my employment history, current and prior tenancies, bank accounts, and all other information that the Landlord deems pertinent to evaluating my leasing application. I authorize the designated screening company to contact my current and previous landlords, employers and references, if necessary. I understand that I shall not be permitted to receive or review my application file or my credit consumer report, and the Landlord and Agent are not obligated to provide me with copies of my application file or any consumer report obtained in the screening process, and that I may obtain my credit report from the credit reporting agency or as otherwise provided by law. I authorize banks, financial institutions, landlords, employers, business associates, credit bureaus, attorneys, accountants and other persons or institutions with whom I am acquainted and that may have information about me to furnish any and all information regarding myself. This authorization also applies to any updated reports which may be ordered as needed. A photocopy or fax of this authorization or an electronic copy (including any electronic signature) shall be accepted with the same authority as this original. I will provide any additional information required by the Landlord or Agent in connection with this application or any prospective lease contemplated herein. I understand that the application fee is non-refundable.";
        
        // Check page break before adding long certification text
        this.checkPageBreak(300); // Ensure enough space for certification text
        
        this.doc.setFontSize(9); // Better font size for readability
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(51, 51, 51);
        
        // Split text into properly sized lines with better margins and ensure complete display
        const certLines = this.doc.splitTextToSize(certificationText, this.contentWidth - 30); // Increased margin for better readability
        this.doc.text(certLines, this.marginLeft + 15, this.currentY); // Increased left margin for better indentation
        this.currentY += certLines.length * 12 + 20; // Better spacing after certification text

        const civilRightsText = "The Civil Rights Act of 1968, as amended by the Fair Housing Amendments Act of 1988, prohibits discrimination in the rental of housing based on race, color, religion, gender, disability, familial status, lawful source of income (including housing vouchers and public assistance) or national origin. The Federal Agency, which administers compliance with this law, is the U.S. Department of Housing and Urban Development.";
        
        // Check page break before civil rights text
        this.checkPageBreak(100); // Ensure enough space for civil rights text
        
        const civilRightsLines = this.doc.splitTextToSize(civilRightsText, this.contentWidth - 30); // Increased margin for consistency
        this.doc.text(civilRightsLines, this.marginLeft + 15, this.currentY); // Increased left margin for consistency
        this.currentY += civilRightsLines.length * 12 + 25; // Better spacing after civil rights text

        // Check page break before signatures section
        this.checkPageBreak(150); // Ensure enough space for signatures
        
        // Now add the signatures section
        this.addSectionTitle("Signatures");
        
        // Process signatures with proper image handling
        this.processSignatures(data);
    }

    /**
     * Process and display signatures with proper image handling
     */
    processSignatures(data: any) {
        console.log('🔍 processSignatures - Starting signature processing');
        console.log('🔍 processSignatures - Raw data:', data);
        console.log('🔍 processSignatures - Raw signatures:', data.signatures);
        
        let currentY = this.currentY;
        const leftX = this.marginLeft; // All signatures on left side
        const signatureWidth = 200; // Full width for left-aligned layout
        const signatureHeight = 50; // Good height for signature display
        const rowSpacing = 60; // Reduced spacing for single column
        const labelSpacing = 18; // Space between label and signature

        // Primary Applicant - Left aligned
        console.log('🔍 Adding Primary Applicant signature');
        const primaryName = data.applicant?.name || 'Primary Applicant';
        
        this.doc.setFontSize(12);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(51, 51, 51);
        this.doc.text(`Primary Applicant: ${primaryName}`, leftX, currentY);
        currentY += labelSpacing;

        // Direct access to applicant signature
        const applicantSignature = data.signatures?.applicant;
        console.log('🔍 Primary Applicant signature:', applicantSignature ? 'EXISTS' : 'MISSING');
        
        if (applicantSignature) {
            console.log('🔍 Primary Applicant signature found, adding image');
            const height = this.addSignatureImageOrText(applicantSignature, leftX, currentY, signatureWidth, signatureHeight);
            currentY += height + 15;
        } else {
            console.log('🔍 No Primary Applicant signature, adding line');
            this.doc.setDrawColor(51, 51, 51);
            this.doc.setLineWidth(1.5);
            this.doc.line(leftX, currentY, leftX + signatureWidth, currentY);
            currentY += 25;
        }
        
        currentY += rowSpacing;

        // Co-Applicants - All left aligned
        if (data.coApplicants && data.coApplicants.length > 0) {
            console.log(`🔍 Processing ${data.coApplicants.length} co-applicants`);
            console.log('🔍 Raw co-applicant signatures:', data.signatures?.coApplicants);
            
            data.coApplicants.forEach((co: any, index: number) => {
                // Check page break before adding each signature
                if (currentY > 700) { // If we're getting close to bottom
                    console.log('🔍 Page break needed, adding new page');
                    this.doc.addPage();
                    currentY = 40; // Reset to top of new page
                }
                
                console.log(`🔍 Processing Co-Applicant ${index + 1}: ${co.name}`);
                
                // Add label - all left aligned
                this.doc.setFontSize(12);
                this.doc.setFont("helvetica", "bold");
                this.doc.setTextColor(51, 51, 51);
                this.doc.text(`Co-Applicant ${index + 1}: ${co.name || 'N/A'}`, leftX, currentY);
                currentY += labelSpacing;

                // Direct access to co-applicant signature
                const signature = data.signatures?.coApplicants?.[index] || data.signatures?.coApplicants?.[index.toString()];
                console.log(`🔍 Co-Applicant ${index + 1} signature:`, signature ? 'EXISTS' : 'MISSING', 'Index:', index, 'Raw access:', !!data.signatures?.coApplicants?.[index]);
                
                if (signature) {
                    console.log(`🔍 Adding signature image for Co-Applicant ${index + 1}`);
                    const height = this.addSignatureImageOrText(signature, leftX, currentY, signatureWidth, signatureHeight);
                    currentY += height + 15;
                } else {
                    console.log(`🔍 Adding signature line for Co-Applicant ${index + 1}`);
                    this.doc.setDrawColor(51, 51, 51);
                    this.doc.setLineWidth(1.5);
                    this.doc.line(leftX, currentY, leftX + signatureWidth, currentY);
                    currentY += 25;
                }
                
                currentY += rowSpacing; // Always add spacing after each signature
            });
        }

        // Guarantors - All left aligned
        if (data.guarantors && data.guarantors.length > 0) {
            console.log(`🔍 Processing ${data.guarantors.length} guarantors`);
            console.log('🔍 Raw guarantor signatures:', data.signatures?.guarantors);
            
            data.guarantors.forEach((g: any, index: number) => {
                // Check page break before adding each signature
                if (currentY > 700) { // If we're getting close to bottom
                    console.log('🔍 Page break needed, adding new page');
                    this.doc.addPage();
                    currentY = 40; // Reset to top of new page
                }
                
                console.log(`🔍 Processing Guarantor ${index + 1}: ${g.name}`);
                
                // Add label - all left aligned
                this.doc.setFontSize(12);
                this.doc.setFont("helvetica", "bold");
                this.doc.setTextColor(51, 51, 51);
                this.doc.text(`Guarantor ${index + 1}: ${g.name || 'N/A'}`, leftX, currentY);
                currentY += labelSpacing;

                // Direct access to guarantor signature
                const signature = data.signatures?.guarantors?.[index] || data.signatures?.guarantors?.[index.toString()];
                console.log(`🔍 Guarantor ${index + 1} signature:`, signature ? 'EXISTS' : 'MISSING', 'Index:', index, 'Raw access:', !!data.signatures?.guarantors?.[index]);
                
                if (signature) {
                    console.log(`🔍 Adding signature image for Guarantor ${index + 1}`);
                    const height = this.addSignatureImageOrText(signature, leftX, currentY, signatureWidth, signatureHeight);
                    currentY += height + 15;
                } else {
                    console.log(`🔍 Adding signature line for Guarantor ${index + 1}`);
                    this.doc.setDrawColor(51, 51, 51);
                    this.doc.setLineWidth(1.5);
                    this.doc.line(leftX, currentY, leftX + signatureWidth, currentY);
                    currentY += 25;
                }
                
                currentY += rowSpacing; // Always add spacing after each signature
            });
        }

        console.log('🔍 processSignatures - Finished processing all signatures');
        console.log('🔍 processSignatures - Final Y position:', currentY);
        this.currentY = currentY + 30;
    }

    addFooter() {
        // Add a page break if we're too close to the bottom
        if (this.currentY > 750) {
            this.doc.addPage();
            this.currentY = 40;
        }
        
        this.doc.setDrawColor(0, 102, 204);
        this.doc.setLineWidth(0.5);
        this.doc.line(this.marginLeft, this.currentY, this.pageWidth - this.marginRight, this.currentY);
        this.currentY += 15;
        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(128, 128, 128);
        this.doc.text("This application was submitted electronically on " + new Date().toLocaleString(), this.marginLeft, this.currentY);
        this.currentY += 10;
        this.doc.text("Liberty Place Property Management - Rental Application", this.marginLeft, this.currentY);
        this.currentY += 10;
        this.doc.text("All information is encrypted and secure", this.marginLeft, this.currentY);
    }

    toLabel(str: string): string {
        return str
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .replace(/^./, (s: string) => s.toUpperCase());
    }

    // Updated to work with actual data structure
    generate(data: any) {
        console.log('Generating PDF with data:', data);
        
        // Handle the actual data structure: [{ form_data: {...} }]
        let formData;
        if (Array.isArray(data) && data.length > 0 && data[0].form_data) {
            formData = data[0].form_data;
            console.log('Extracted form_data from array structure');
        }
        else if (data.form_data) {
            formData = data.form_data;
            console.log('Extracted form_data from object structure');
        }
        else {
            formData = data;
            console.log('Using data directly');
        }
        
        console.log('Final formData:', formData);
        console.log('Co-applicants count:', formData.coApplicants?.length || 0);
        console.log('Guarantors count:', formData.guarantors?.length || 0);
        console.log('Co-applicants data:', formData.coApplicants);
        console.log('Guarantors data:', formData.guarantors);
        console.log('Signatures data:', formData.signatures);
        
        // Reset currentY for new document
        this.currentY = 40;
        
        // 1. Header
        this.addHeader();
        
        // 2. Instructions
        this.addInstructions();
        
        // 3. Application Info
        this.addSectionTitle("Application Information");
        this.addKeyValueTable(formData.application);
        
        // 4. Primary Applicant (use applicant data if available)
        if (formData.applicant) {
            console.log('Processing primary applicant from applicant data...');
            this.addApplicantInfo(formData.applicant);
        }
        else if (formData.coApplicants && formData.coApplicants.length > 0) {
            console.log('No applicant data, using first co-applicant as primary...');
            this.addApplicantInfo(formData.coApplicants[0]);
        }
        else {
            console.log('No applicant data found');
            this.addSectionTitle("Primary Applicant Information");
            this.doc.setFontSize(10);
            this.doc.setFont("helvetica", "normal");
            this.doc.setTextColor(128, 128, 128);
            this.doc.text("No applicant information provided", this.marginLeft, this.currentY);
            this.currentY += 20;
        }
        
        // 5. All Co-Applicants (process all, starting from index 0)
        if (formData.coApplicants && formData.coApplicants.length > 0) {
            console.log('Processing all co-applicants...');
            console.log('Total co-applicants found:', formData.coApplicants.length);
            console.log('Co-applicants data:', JSON.stringify(formData.coApplicants, null, 2));
            
            formData.coApplicants.forEach((co: any, i: number) => {
                console.log(`Processing co-applicant ${i + 1}:`, co);
                console.log(`Co-applicant ${i + 1} name:`, co.name);
                console.log(`Co-applicant ${i + 1} has data:`, !!co);
                this.addCoApplicantInfo(co, i);
            });
        } else {
            console.log('No co-applicants found in formData');
            console.log('formData.coApplicants:', formData.coApplicants);
        }
        
        // 6. Guarantors
        if (formData.guarantors && formData.guarantors.length > 0) {
            console.log('Processing guarantors...');
            formData.guarantors.forEach((g: any, idx: number) => {
                console.log(`Processing guarantor ${idx + 1}:`, g);
                this.addGuarantorInfo(g, idx);
            });
        }
        else {
            console.log('No guarantors found or empty array');
            this.addSectionTitle("Guarantors Information");
            this.doc.setFontSize(10);
            this.doc.setFont("helvetica", "normal");
            this.doc.setTextColor(128, 128, 128);
            this.doc.text("No guarantors provided", this.marginLeft, this.currentY);
            this.currentY += 20;
        }
        
        // 7. Occupants
        if (formData.occupants && formData.occupants.length > 0) {
            this.addOccupants(formData.occupants);
        }
        
        // 8. Signatures (includes legal disclaimer)
        console.log('🔍 generate - About to process signatures');
        console.log('🔍 generate - Final data structure for signatures:', {
            applicant: formData.applicant,
            coApplicants: formData.coApplicants,
            guarantors: formData.guarantors,
            signatures: formData.signatures
        });
        this.addSignatures(formData);
        
        // 9. Footer
        this.addFooter();
        
        return this.doc;
    }

    save(filename: string) {
        this.doc.save(filename);
    }
}