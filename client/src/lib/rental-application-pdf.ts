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

    constructor() {
        this.currentY = 40;
        this.doc = new jsPDF({ unit: "px", format: "a4" });
    }
    addHeader() {
        // Company logo placeholder
        this.doc.setFillColor(0, 102, 204);
        this.doc.rect(20, this.currentY, 25, 18, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(7);
        this.doc.setFont("helvetica", "bold");
        this.doc.text('LIBERTY', 23, this.currentY + 7);
        this.doc.text('PLACE', 23, this.currentY + 12);
        // Company name
        this.doc.setTextColor(0, 102, 204);
        this.doc.setFontSize(16);
        this.doc.setFont("helvetica", "bold");
        this.doc.text("Liberty Place Property Management", 55, this.currentY + 10);
        // Address and contact info
        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(51, 51, 51);
        this.doc.text("122 East 42nd Street, Suite 1903", 55, this.currentY + 16);
        this.doc.text("New York, NY 10168", 55, this.currentY + 20);
        this.doc.text("Tel: (646) 545-6700 | Fax: (646) 304-2255", 55, this.currentY + 24);
        this.doc.text("Leasing Direct Line: (646) 545-6700", 55, this.currentY + 28);
        this.currentY += 35;
        // Title with decorative elements
        this.doc.setFillColor(255, 193, 7);
        this.doc.rect(20, this.currentY, 555, 12, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(14);
        this.doc.setFont("helvetica", "bold");
        this.doc.text("RENTAL APPLICATION", 297.5, this.currentY + 8, { align: 'center' });
        this.currentY += 16;
        // Application ID and date
        this.doc.setTextColor(51, 51, 51);
        this.doc.setFontSize(9);
        this.doc.setFont("helvetica", "normal");
        this.doc.text(`Application Date: ${new Date().toLocaleDateString()}`, 20, this.currentY);
        this.doc.text(`Generated: ${new Date().toLocaleString()}`, 400, this.currentY);
        this.currentY += 20;
    }
    addSectionTitle(title: string) {
        this.doc.setFontSize(14);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(0, 102, 204);
        this.doc.text(title, 20, this.currentY);
        this.currentY += 20;
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
            // Don't exclude if it's a meaningful value
            if (exclude.includes(key))
                return false;
            if (typeof val === "object" && val !== null)
                return false;
            if (val === null || val === undefined)
                return false;
            if (val === "")
                return false;
            if (val === "empty")
                return false;
            if (val === "undefined")
                return false;
            return true;
        })
            .map(([key, val]) => {
            let displayValue = val;
            // Format dates properly
            if (key === 'dob' || key === 'employmentStart' || key === 'moveInDate' || key === 'coApplicantStartDate') {
                try {
                    const date = new Date(val);
                    if (!isNaN(date.getTime())) {
                        displayValue = date.toLocaleDateString();
                    }
                }
                catch (e) {
                    displayValue = val;
                }
            }
            // Format income values
            if (key === 'income' || key === 'otherIncome' || key === 'monthlyRent' || key === 'currentRent' || key === 'coApplicantSalary' || key === 'coApplicantOtherIncome') {
                if (typeof val === 'number' || !isNaN(Number(val))) {
                    displayValue = `$${Number(val).toLocaleString()}`;
                }
            }
            // Calculate age from date of birth
            if (key === 'age' && data.dob) {
                try {
                    const dob = new Date(data.dob);
                    if (!isNaN(dob.getTime())) {
                        const today = new Date();
                        const age = today.getFullYear() - dob.getFullYear();
                        const monthDiff = today.getMonth() - dob.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                            displayValue = age - 1;
                        }
                        else {
                            displayValue = age;
                        }
                    }
                }
                catch (e) {
                    // Keep original value if calculation fails
                }
            }
            return [
                fieldMappings[key] || this.toLabel(key),
                displayValue ? String(displayValue) : "[Not Provided]",
            ];
        });
        if (!body.length)
            return;
        if (title) {
            this.doc.setFontSize(12);
            this.doc.setFont("helvetica", "bold");
            this.doc.setTextColor(51, 51, 51);
            this.doc.text(title, 20, this.currentY);
            this.currentY += 15;
        }
        autoTable(this.doc, {
            startY: this.currentY,
            head: [["Field", "Value"]],
            body,
            margin: { left: 20, right: 20 },
            styles: { fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });
        this.currentY = this.doc.lastAutoTable.finalY + 15;
    }
    addBankTable(banks: any[] | undefined, title = "Bank Records") {
        if (!banks?.length)
            return;
        this.doc.setFontSize(12);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(51, 51, 51);
        this.doc.text(title, 20, this.currentY);
        this.currentY += 15;
        const body = banks.map((b) => [b.bankName || "", b.accountType || ""]);
        autoTable(this.doc, {
            startY: this.currentY,
            head: [["Bank Name", "Account Type"]],
            body,
            margin: { left: 20, right: 20 },
            styles: { fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: [51, 51, 51], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });
        this.currentY = this.doc.lastAutoTable.finalY + 15;
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
                this.currentY += 8;
            }
            else if (instruction.startsWith("•")) {
                this.doc.setFontSize(9);
                this.doc.setFont("helvetica", "normal");
                this.doc.setTextColor(51, 51, 51);
                this.doc.text(instruction, 25, this.currentY);
                this.currentY += 12;
            }
            else if (instruction.includes(":")) {
                this.doc.setFontSize(10);
                this.doc.setFont("helvetica", "bold");
                this.doc.setTextColor(0, 102, 204);
                this.doc.text(instruction, 20, this.currentY);
                this.currentY += 15;
            }
            else {
                this.doc.setFontSize(9);
                this.doc.setFont("helvetica", "normal");
                this.doc.setTextColor(51, 51, 51);
                this.doc.text(instruction, 20, this.currentY);
                this.currentY += 12;
            }
        });
        this.currentY += 20;
    }
    addApplicantInfo(applicant: any) {
        this.addSectionTitle("Primary Applicant Information");
        // Personal Information
        this.addKeyValueTable(applicant, ["bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "employmentType", "position", "employmentStart", "income", "incomeFrequency", "otherIncome", "otherIncomeFrequency", "otherIncomeSource", "businessName", "businessType", "yearsInBusiness"], "Personal Information");
        // Address Information
        const addressData = { ...applicant };
        // Fix Length at Address by combining years and months
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
        this.addKeyValueTable(addressData, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "lengthAtAddressYears", "lengthAtAddressMonths"], "Current Address:");
        // Landlord Information
        this.addKeyValueTable(applicant, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving"], "Landlord Information");
        // Employment Information
        this.addKeyValueTable(applicant, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail"], "Primary Applicant Financial Information");
        // Business Information
        this.addKeyValueTable(applicant, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "employmentType", "position", "employmentStart", "income", "incomeFrequency", "otherIncome", "otherIncomeFrequency", "otherIncomeSource"], "Business Information");
        // Bank Records
        this.addBankTable(applicant?.bankRecords, "Bank Information:");
    }
    addCoApplicantInfo(coApplicant, index) {
        this.addSectionTitle(`Co-Applicant ${index + 1} Information`);
        // Personal Information
        this.addKeyValueTable(coApplicant, ["bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "employmentType", "position", "employmentStart", "income", "incomeFrequency", "otherIncome", "otherIncomeFrequency", "otherIncomeSource", "businessName", "businessType", "yearsInBusiness"], "Personal Information");
        // Address Information
        const addressData = { ...coApplicant };
        // Fix Length at Address by combining years and months
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
                addressData.lengthAtAddress = "Less than 1 month";
            }
        }
        else {
            addressData.lengthAtAddress = "Not provided";
        }
        this.addKeyValueTable(addressData, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "lengthAtAddressYears", "lengthAtAddressMonths"], "Current Address:");
        // Landlord Information
        this.addKeyValueTable(coApplicant, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving"], "Landlord Information");
        // Employment Information
        this.addKeyValueTable(coApplicant, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail"], `Co-Applicant ${index + 1} Financial Information`);
        // Business Information
        this.addKeyValueTable(coApplicant, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "employmentType", "position", "employmentStart", "income", "incomeFrequency", "otherIncome", "otherIncomeFrequency", "otherIncomeSource"], "Business Information");
        // Bank Records
        this.addBankTable(coApplicant.bankRecords, `Co-Applicant ${index + 1} Bank Information:`);
    }
    addGuarantorInfo(guarantor, index) {
        this.addSectionTitle(`Guarantor ${index + 1} Information`);
        // Personal Information
        this.addKeyValueTable(guarantor, ["bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "employmentType", "position", "employmentStart", "income", "incomeFrequency", "otherIncome", "otherIncomeFrequency", "otherIncomeSource", "businessName", "businessType", "yearsInBusiness"], "Personal Information");
        // Address Information
        const addressData = { ...guarantor };
        // Fix Length at Address by combining years and months
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
                addressData.lengthAtAddress = "Less than 1 month";
            }
        }
        else {
            addressData.lengthAtAddress = "Not provided";
        }
        this.addKeyValueTable(addressData, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "lengthAtAddressYears", "lengthAtAddressMonths"], "Current Address:");
        // Landlord Information
        this.addKeyValueTable(guarantor, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving"], "Landlord Information");
        // Employment Information
        this.addKeyValueTable(guarantor, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail"], `Guarantor ${index + 1} Financial Information`);
        // Business Information
        this.addKeyValueTable(guarantor, ["name", "email", "phone", "dob", "ssn", "license", "licenseState", "bankRecords", "address", "city", "state", "zip", "lengthAtAddressYears", "lengthAtAddressMonths", "currentRent", "reasonForMoving", "landlordName", "landlordAddressLine1", "landlordAddressLine2", "landlordCity", "landlordState", "landlordZipCode", "landlordPhone", "landlordEmail", "employmentType", "position", "employmentStart", "income", "incomeFrequency", "otherIncome", "otherIncomeFrequency", "otherIncomeSource"], "Business Information");
        // Bank Records
        this.addBankTable(guarantor.bankRecords, `Guarantor ${index + 1} Bank Information:`);
    }
    addOccupants(occupants: any[]) {
        if (!occupants?.length)
            return;
        this.addSectionTitle("Other Occupants");
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(51, 51, 51);
        this.doc.text("Additional occupants who will be living in the apartment:", 20, this.currentY);
        this.currentY += 15;
        occupants.forEach((o, idx) => {
            this.addKeyValueTable(o, [], `Occupant ${idx + 1} Information`);
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
        console.log('🔍 addSignatureImageOrText called with:', {
            signatureData: typeof signatureData,
            dataPreview: typeof signatureData === 'string' ? signatureData.substring(0, 100) + '...' : signatureData,
            x, y, maxWidth, maxHeight
        });
        
        const processedSignature = processSignatureData(signatureData);
        console.log('🔍 Processed signature:', processedSignature);
        
        if (processedSignature.type === 'image' && processedSignature.data) {
            try {
                console.log('🔍 Attempting to add image signature...');
                // Determine image type from data URL
                const imgType = processedSignature.data.substring(processedSignature.data.indexOf('/') + 1, processedSignature.data.indexOf(';'));
                const imgData = processedSignature.data.split(',')[1];

                console.log('🔍 Image processing:', { imgType, imgDataLength: imgData?.length });

                if (imgData && imgType) {
                    // For jsPDF, we need to handle the image properly
                    // Since we can't wait for async image loading, we'll use a standard signature size
                    const width = Math.min(maxWidth, 120); // Standard signature width
                    const height = Math.min(maxHeight, 40); // Standard signature height
                    
                    console.log('🔍 Adding image to PDF:', { width, height, imgType: imgType.toUpperCase() });
                        this.doc.addImage(imgData, imgType.toUpperCase(), x, y, width, height);
                    console.log('🔍 Image added successfully');
                        return height + 5; // Return height of the image plus some padding
                } else {
                    console.log('🔍 Image data or type missing:', { imgType, hasImgData: !!imgData });
                }
            } catch (error) {
                console.error("🔍 Error adding signature image:", error);
                // Fallback to text if image adding fails
            }
        } else {
            console.log('🔍 Not an image signature, type:', processedSignature.type);
        }
        
        // If not an image data URL or image adding failed, display text
        console.log('🔍 Falling back to text display:', processedSignature.displayText);
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(51, 51, 51);
        this.doc.text(processedSignature.displayText, x, y);
        return 15; // Height for a line of text
    }



    addSignatures(data: any) {
        // Add the legal disclaimer content above signatures
        this.addSectionTitle("PLEASE READ CAREFULLY BEFORE SIGNING");
        const disclaimerText = "The Landlord shall not be bound by any lease, nor will possession of the premises be delivered to the Tenant, until a written lease agreement is executed by the Landlord and delivered to the Tenant. Approval of this application remains at Landlord's discretion until a lease agreement is fully executed. Please be advised that the date on page one of the lease is your move-in date and also denotes the lease commencement date. No representations or agreements by agents, brokers or others shall be binding upon the Landlord or its Agent unless those representations or agreements are set forth in the written lease agreement executed by both Landlord and Tenant.";
        
        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(51, 51, 51);
        const lines = this.doc.splitTextToSize(disclaimerText, 555);
        this.doc.text(lines, 20, this.currentY);
        this.currentY += lines.length * 12 + 15;

        // Certification & Consents section
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(0, 102, 204);
        this.doc.text("Certification & Consents", 20, this.currentY);
        this.currentY += 15;

        const certificationText = "By signing this application electronically, I consent to the use of electronic records and digital signatures in connection with this application and any resulting lease agreement. I agree that my electronic signature is legally binding and has the same effect as a handwritten signature. I hereby warrant that all my representations and information provided in this application are true, accurate, and complete to the best of my knowledge. I recognize the truth of the information contained herein is essential and I acknowledge that any false or misleading information may result in the rejection of my application or rescission of the offer prior to possession or, if a lease has been executed and/or possession delivered, may constitute a material breach and provide grounds to commence appropriate legal proceedings to terminate the tenancy, as permitted by law. I further represent that I am not renting a room or an apartment under any other name, nor have I ever been dispossessed or evicted from any residence, nor am I now being dispossessed nor currently being evicted. I represent that I am over at least 18 years of age. I acknowledge and consent that my Social Security number and any other personal identifying information collected in this application may be used for tenant screening and will be maintained in confidence and protected against unauthorized disclosure in accordance with New York General Business Law and related privacy laws. I have been advised that I have the right, under the Fair Credit Reporting Act, to make a written request, directed to the appropriate credit reporting agency, within reasonable time, for a complete and accurate disclosure of the nature and scope of any credit investigation. I understand that upon submission, this application and all related documents become the property of the Landlord, and will not be returned to me under any circumstances regardless of whether my application is approved or denied. I consent to and authorize the Landlord, Agent and any designated screening or credit reporting agency to obtain a consumer credit report on me and to conduct any necessary background checks, to the extent permitted by law. I further authorize the Landlord and Agent to verify any and all information provided in this application with regard to my employment history, current and prior tenancies, bank accounts, and all other information that the Landlord deems pertinent to evaluating my leasing application. I authorize the designated screening company to contact my current and previous landlords, employers and references, if necessary. I understand that I shall not be permitted to receive or review my application file or my credit consumer report, and the Landlord and Agent are not obligated to provide me with copies of my application file or any consumer report obtained in the screening process, and that I may obtain my credit report from the credit reporting agency or as otherwise provided by law. I authorize banks, financial institutions, landlords, employers, business associates, credit bureaus, attorneys, accountants and other persons or institutions with whom I am acquainted and that may have information about me to furnish any and all information regarding myself. This authorization also applies to any updated reports which may be ordered as needed. A photocopy or fax of this authorization or an electronic copy (including any electronic signature) shall be accepted with the same authority as this original. I will provide any additional information required by the Landlord or Agent in connection with this application or any prospective lease contemplated herein. I understand that the application fee is non-refundable.";
        
        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(51, 51, 51);
        const certLines = this.doc.splitTextToSize(certificationText, 555);
        this.doc.text(certLines, 20, this.currentY);
        this.currentY += certLines.length * 12 + 15;

        const civilRightsText = "The Civil Rights Act of 1968, as amended by the Fair Housing Amendments Act of 1988, prohibits discrimination in the rental of housing based on race, color, religion, gender, disability, familial status, lawful source of income (including housing vouchers and public assistance) or national origin. The Federal Agency, which administers compliance with this law, is the U.S. Department of Housing and Urban Development.";
        const civilRightsLines = this.doc.splitTextToSize(civilRightsText, 555);
        this.doc.text(civilRightsLines, 20, this.currentY);
        this.currentY += civilRightsLines.length * 12 + 20;

        // Now add the signatures section
        this.addSectionTitle("Signatures");
        
        // Process signatures with proper image handling
        this.processSignatures(data);
    }

    /**
     * Process and display signatures with proper image handling
     */
    processSignatures(data: any) {
        // Extract signatures using the utility function
        const signatures = extractSignaturesForPDF(data);
        
        console.log('🔍 PDF Generator - Processing signatures:', signatures);
        console.log('🔍 PDF Generator - Raw data signatures:', data.signatures);
        console.log('🔍 PDF Generator - Extracted signatures keys:', Object.keys(signatures));
        
        // Debug each signature individually
        if (signatures.applicant) {
            console.log('🔍 PDF Generator - Applicant signature type:', typeof signatures.applicant);
            console.log('🔍 PDF Generator - Applicant signature preview:', signatures.applicant?.substring(0, 100) + '...');
        }
        
        if (signatures.coApplicants) {
            Object.entries(signatures.coApplicants).forEach(([index, signature]) => {
                console.log(`🔍 PDF Generator - Co-applicant ${index} signature type:`, typeof signature);
                console.log(`🔍 PDF Generator - Co-applicant ${index} signature preview:`, signature?.substring(0, 100) + '...');
            });
        }
        
        if (signatures.guarantors) {
            Object.entries(signatures.guarantors).forEach(([index, signature]) => {
                console.log(`🔍 PDF Generator - Guarantor ${index} signature type:`, typeof signature);
                console.log(`🔍 PDF Generator - Guarantor ${index} signature preview:`, signature?.substring(0, 100) + '...');
            });
        }
        
        const signatureY = this.currentY;
        let currentSignatureY = signatureY;
        const signatureX = 20;
        const signatureWidth = 200;
        const signatureHeight = 40;
        const spacing = 60;

        // Primary Applicant Signature
        if (data.applicant?.name || (data.coApplicants && data.coApplicants.length > 0)) {
            const applicantName = data.applicant?.name || data.coApplicants[0]?.name || 'Primary Applicant';
            this.doc.setFontSize(10);
            this.doc.setFont("helvetica", "bold");
            this.doc.setTextColor(51, 51, 51);
            this.doc.text(`Primary Applicant: ${applicantName}`, signatureX, currentSignatureY);
            currentSignatureY += 15;

            // Check for signature
            if (signatures.applicant) {
                console.log('🔍 PDF Generator - Adding applicant signature:', typeof signatures.applicant, signatures.applicant?.substring(0, 50) + '...');
                // Add signature image
                const height = this.addSignatureImageOrText(
                    signatures.applicant, 
                    signatureX, 
                    currentSignatureY, 
                    signatureWidth, 
                    signatureHeight
                );
                currentSignatureY += height + 10;
            } else {
                console.log('🔍 PDF Generator - No applicant signature found, adding line');
                // Add signature line
                this.doc.setDrawColor(51, 51, 51);
                this.doc.setLineWidth(1);
                this.doc.line(signatureX, currentSignatureY, signatureX + signatureWidth, currentSignatureY);
                currentSignatureY += 20;
            }
            currentSignatureY += spacing;
        }

        // Co-Applicant Signatures
        if (signatures.coApplicants && Object.keys(signatures.coApplicants).length > 0) {
            Object.entries(signatures.coApplicants).forEach(([index, signature]) => {
                const coIndex = parseInt(index);
                const co = data.coApplicants?.[coIndex];
                
                if (!co) return;

                const title = data.applicant ? `Co-Applicant ${coIndex + 1}` : `Co-Applicant ${coIndex + 1}`;
                this.doc.setFontSize(10);
                this.doc.setFont("helvetica", "bold");
                this.doc.setTextColor(51, 51, 51);
                this.doc.text(`${title}: ${co.name || 'N/A'}`, signatureX, currentSignatureY);
                currentSignatureY += 15;

                console.log(`🔍 PDF Generator - Adding co-applicant ${coIndex + 1} signature:`, typeof signature, signature?.substring(0, 50) + '...');
                // Add signature image
                const height = this.addSignatureImageOrText(
                    signature, 
                    signatureX, 
                    currentSignatureY, 
                    signatureWidth, 
                    signatureHeight
                );
                currentSignatureY += height + 10;
                currentSignatureY += spacing;
            });
        }

        // Guarantor Signatures
        if (signatures.guarantors && Object.keys(signatures.guarantors).length > 0) {
            Object.entries(signatures.guarantors).forEach(([index, signature]) => {
                const guarantorIndex = parseInt(index);
                const g = data.guarantors?.[guarantorIndex];
                
                if (!g) return;

                this.doc.setFontSize(10);
                this.doc.setFont("helvetica", "bold");
                this.doc.setTextColor(51, 51, 51);
                this.doc.text(`Guarantor ${guarantorIndex + 1}: ${g.name || 'N/A'}`, signatureX, currentSignatureY);
                currentSignatureY += 15;

                console.log(`🔍 PDF Generator - Adding guarantor ${guarantorIndex + 1} signature:`, typeof signature, signature?.substring(0, 50) + '...');
                // Add signature image
                const height = this.addSignatureImageOrText(
                    signature, 
                    signatureX, 
                    currentSignatureY, 
                    signatureWidth, 
                    signatureHeight
                );
                currentSignatureY += height + 10;
                currentSignatureY += spacing;
            });
        }

        this.currentY = currentSignatureY + 20;
    }



    addFooter() {
        this.doc.setDrawColor(0, 102, 204);
        this.doc.setLineWidth(0.5);
        this.doc.line(20, this.currentY, 575, this.currentY);
        this.currentY += 10;
        this.doc.setFontSize(7);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(128, 128, 128);
        this.doc.text("This application was submitted electronically on " + new Date().toLocaleString(), 20, this.currentY);
        this.currentY += 8;
        this.doc.text("Liberty Place Property Management - Rental Application", 20, this.currentY);
        this.currentY += 8;
        this.doc.text("All information is encrypted and secure", 20, this.currentY);
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
            this.doc.text("No applicant information provided", 20, this.currentY);
            this.currentY += 20;
        }
        
        // 5. All Co-Applicants (process all, starting from index 0)
        if (formData.coApplicants && formData.coApplicants.length > 0) {
            console.log('Processing all co-applicants...');
            formData.coApplicants.forEach((co: any, i: number) => {
                console.log(`Processing co-applicant ${i + 1}:`, co);
                this.addCoApplicantInfo(co, i);
            });
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
            this.doc.text("No guarantors provided", 20, this.currentY);
            this.currentY += 20;
        }
        
        // 7. Occupants
        if (formData.occupants && formData.occupants.length > 0) {
            this.addOccupants(formData.occupants);
        }
        
        // 8. Signatures (includes legal disclaimer)
        this.addSignatures(formData);
        
        // 9. Footer
        this.addFooter();
        
        return this.doc;
    }

    save(filename: string) {
        this.doc.save(filename);
    }
}
