import { z } from 'zod';

// Helper function to convert string dates to Date objects
const dateStringToDate = z.union([
  z.string(),
  z.date(),
  z.null(),
  z.undefined()
]).transform((val) => {
  if (val === null || val === undefined) {
    return null;
  }
  if (typeof val === 'string') {
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date string: ${val}`);
    }
    return date;
  }
  if (val instanceof Date) {
    if (isNaN(val.getTime())) {
      throw new Error('Invalid Date object');
    }
    return val;
  }
  return null;
}).refine((val) => val !== null, "Date is required");

// Comprehensive validation schema that matches the actual application data
export const insertRentalApplicationSchema = z.object({
  // Application Info
  buildingAddress: z.string().min(1, "Building address is required"),
  apartmentNumber: z.string().min(1, "Apartment number is required"),
  moveInDate: dateStringToDate,
  monthlyRent: z.union([
    z.number().positive("Monthly rent must be positive"),
    z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) {
        throw new Error("Monthly rent must be a positive number");
      }
      return num;
    })
  ]),
  apartmentType: z.string().min(1, "Apartment type is required"),
  howDidYouHear: z.string().optional(),
  howDidYouHearOther: z.string().optional(),

  // Primary Applicant
  applicantName: z.string().min(1, "Applicant name is required"),
  applicantDob: dateStringToDate,
  applicantSsn: z.string().optional().nullable(),
  applicantPhone: z.string().optional().nullable(),
  applicantEmail: z.string().email("Valid email is required"),
  applicantLicense: z.string().optional().nullable(),
  applicantLicenseState: z.string().optional().nullable(),
  applicantAddress: z.string().min(1, "Address is required"),
  applicantCity: z.string().min(1, "City is required"),
  applicantState: z.string().min(1, "State is required"),
  applicantZip: z.string().min(1, "ZIP code is required"),
  applicantLengthAtAddressYears: z.number().optional().nullable(),
  applicantLengthAtAddressMonths: z.number().optional().nullable(),
  applicantLandlordName: z.string().optional().nullable(),
  applicantLandlordAddressLine1: z.string().optional().nullable(),
  applicantLandlordAddressLine2: z.string().optional().nullable(),
  applicantLandlordCity: z.string().optional().nullable(),
  applicantLandlordState: z.string().optional().nullable(),
  applicantLandlordZipCode: z.string().optional().nullable(),
  applicantLandlordPhone: z.string().optional().nullable(),
  applicantLandlordEmail: z.string().optional().nullable(),
  applicantCurrentRent: z.number().optional().nullable(),
  applicantReasonForMoving: z.string().optional().nullable(),

  // Primary Applicant Employment & Financial
  applicantEmploymentType: z.string().optional().nullable(),
  applicantEmployerName: z.string().optional().nullable(),
  applicantEmployerAddress: z.string().optional().nullable(),
  applicantEmployerCity: z.string().optional().nullable(),
  applicantEmployerState: z.string().optional().nullable(),
  applicantEmployerZip: z.string().optional().nullable(),
  applicantEmployerPhone: z.string().optional().nullable(),
  applicantPosition: z.string().optional().nullable(),
  applicantStartDate: dateStringToDate.optional().nullable(),
  applicantSalary: z.number().optional().nullable(),
  applicantBankRecords: z.array(z.any()).optional().nullable(),

  // Co-Applicant
  hasCoApplicant: z.boolean().optional(),
  coApplicantName: z.string().optional().nullable(),
  coApplicantRelationship: z.string().optional().nullable(),
  coApplicantDob: dateStringToDate.optional().nullable(),
  coApplicantSsn: z.string().optional().nullable(),
  coApplicantPhone: z.string().optional().nullable(),
  coApplicantEmail: z.string().optional().nullable(),
  coApplicantLicense: z.string().optional().nullable(),
  coApplicantLicenseState: z.string().optional().nullable(),
  coApplicantAddress: z.string().optional().nullable(),
  coApplicantCity: z.string().optional().nullable(),
  coApplicantState: z.string().optional().nullable(),
  coApplicantZip: z.string().optional().nullable(),
  coApplicantLengthAtAddressYears: z.number().optional().nullable(),
  coApplicantLengthAtAddressMonths: z.number().optional().nullable(),
  coApplicantLandlordName: z.string().optional().nullable(),
  coApplicantLandlordAddressLine1: z.string().optional().nullable(),
  coApplicantLandlordAddressLine2: z.string().optional().nullable(),
  coApplicantLandlordCity: z.string().optional().nullable(),
  coApplicantLandlordState: z.string().optional().nullable(),
  coApplicantLandlordZipCode: z.string().optional().nullable(),
  coApplicantLandlordPhone: z.string().optional().nullable(),
  coApplicantLandlordEmail: z.string().optional().nullable(),
  coApplicantCurrentRent: z.number().optional().nullable(),
  coApplicantReasonForMoving: z.string().optional().nullable(),

  // Co-Applicant Employment & Financial
  coApplicantEmploymentType: z.string().optional().nullable(),
  coApplicantEmployerName: z.string().optional().nullable(),
  coApplicantEmployerAddress: z.string().optional().nullable(),
  coApplicantEmployerCity: z.string().optional().nullable(),
  coApplicantEmployerState: z.string().optional().nullable(),
  coApplicantEmployerZip: z.string().optional().nullable(),
  coApplicantEmployerPhone: z.string().optional().nullable(),
  coApplicantPosition: z.string().optional().nullable(),
  coApplicantStartDate: dateStringToDate.optional().nullable(),
  coApplicantSalary: z.number().optional().nullable(),
  coApplicantBankRecords: z.array(z.any()).optional().nullable(),

  // Guarantor
  hasGuarantor: z.boolean().optional(),
  guarantorName: z.string().optional().nullable(),
  guarantorRelationship: z.string().optional().nullable(),
  guarantorDob: dateStringToDate.optional().nullable(),
  guarantorSsn: z.string().optional().nullable(),
  guarantorPhone: z.string().optional().nullable(),
  guarantorEmail: z.string().optional().nullable(),
  guarantorLicense: z.string().optional().nullable(),
  guarantorAddress: z.string().optional().nullable(),
  guarantorCity: z.string().optional().nullable(),
  guarantorState: z.string().optional().nullable(),
  guarantorZip: z.string().optional().nullable(),
  guarantorLengthAtAddressYears: z.number().optional().nullable(),
  guarantorLengthAtAddressMonths: z.number().optional().nullable(),
  guarantorLandlordName: z.string().optional().nullable(),
  guarantorLandlordAddressLine1: z.string().optional().nullable(),
  guarantorLandlordAddressLine2: z.string().optional().nullable(),
  guarantorLandlordCity: z.string().optional().nullable(),
  guarantorLandlordState: z.string().optional().nullable(),
  guarantorLandlordZipCode: z.string().optional().nullable(),
  guarantorLandlordPhone: z.string().optional().nullable(),
  guarantorLandlordEmail: z.string().optional().nullable(),
  guarantorCurrentRent: z.number().optional().nullable(),
  guarantorReasonForMoving: z.string().optional().nullable(),

  // Guarantor Employment & Financial
  guarantorEmploymentType: z.string().optional().nullable(),
  guarantorEmployerName: z.string().optional().nullable(),
  guarantorEmployerAddress: z.string().optional().nullable(),
  guarantorEmployerCity: z.string().optional().nullable(),
  guarantorEmployerState: z.string().optional().nullable(),
  guarantorEmployerZip: z.string().optional().nullable(),
  guarantorEmployerPhone: z.string().optional().nullable(),
  guarantorPosition: z.string().optional().nullable(),
  guarantorStartDate: dateStringToDate.optional().nullable(),
  guarantorSalary: z.number().optional().nullable(),
  guarantorBankRecords: z.array(z.any()).optional().nullable(),

  // Other Occupants
  otherOccupants: z.array(z.any()).optional().nullable(),

  // Legal Questions
  landlordTenantLegalAction: z.string().optional().nullable(),
  landlordTenantLegalActionExplanation: z.string().optional().nullable(),
  brokenLease: z.string().optional().nullable(),
  brokenLeaseExplanation: z.string().optional().nullable(),

  // Signatures
  signatures: z.any().optional().nullable(),
  signatureTimestamps: z.any().optional().nullable(),

  // Documents
  documents: z.any().optional().nullable(),
  encryptedDocuments: z.any().optional().nullable(),

  // Status
  status: z.string().optional().default("draft"),

  // Allow passthrough for extra fields that might be added
}).passthrough(); 