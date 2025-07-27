// Mock schema for testing Netlify functions
// In production, this would import from the actual schema

import { z } from 'zod';

// Helper function to convert string dates to Date objects
const dateStringToDate = z.string().or(z.date()).or(z.null()).transform((val) => {
  if (val === null || val === undefined) {
    return null;
  }
  if (typeof val === 'string') {
    return new Date(val);
  }
  return val;
});

// Comprehensive validation schema that matches the actual application data
export const insertRentalApplicationSchema = z.object({
  // Application Info
  buildingAddress: z.string().optional(),
  apartmentNumber: z.string().optional(),
  moveInDate: dateStringToDate.optional(),
  monthlyRent: z.number().optional(),
  apartmentType: z.string().optional(),
  howDidYouHear: z.string().optional(),
  howDidYouHearOther: z.string().optional(),

  // Primary Applicant
  applicantName: z.string().min(1, "Applicant name is required"),
  applicantDob: dateStringToDate.optional(),
  applicantSsn: z.string().optional().nullable(),
  applicantPhone: z.string().optional().nullable(),
  applicantEmail: z.string().email("Valid email is required"),
  applicantLicense: z.string().optional().nullable(),
  applicantLicenseState: z.string().optional().nullable(),
  applicantAddress: z.string().optional(),
  applicantCity: z.string().optional(),
  applicantState: z.string().optional(),
  applicantZip: z.string().optional(),
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
  applicantGender: z.string().optional().nullable(),

  // Primary Applicant Financial
  applicantEmploymentType: z.string().optional().nullable(),
  applicantEmployer: z.string().optional().nullable(),
  applicantPosition: z.string().optional().nullable(),
  applicantEmploymentStart: dateStringToDate.optional().nullable(),
  applicantBusinessName: z.string().optional().nullable(),
  applicantBusinessType: z.string().optional().nullable(),
  applicantYearsInBusiness: z.number().optional().nullable(),
  applicantIncome: z.number().optional().nullable(),
  applicantOtherIncome: z.number().optional().nullable(),
  applicantOtherIncomeSource: z.string().optional().nullable(),
  applicantBankRecords: z.array(z.any()).optional().nullable(),

  // Co-Applicant
  hasCoApplicant: z.boolean().optional(),
  coApplicantName: z.string().optional().nullable(),
  coApplicantRelationship: z.string().optional().nullable(),
  coApplicantDob: dateStringToDate.optional().nullable(),
  coApplicantSsn: z.string().optional().nullable(),
  coApplicantPhone: z.string().optional().nullable(),
  coApplicantEmail: z.string().optional().nullable(),
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

  // Co-Applicant Financial
  coApplicantEmploymentType: z.string().optional().nullable(),
  coApplicantEmployer: z.string().optional().nullable(),
  coApplicantPosition: z.string().optional().nullable(),
  coApplicantEmploymentStart: dateStringToDate.optional().nullable(),
  coApplicantBusinessName: z.string().optional().nullable(),
  coApplicantBusinessType: z.string().optional().nullable(),
  coApplicantYearsInBusiness: z.number().optional().nullable(),
  coApplicantIncome: z.number().optional().nullable(),
  coApplicantOtherIncome: z.number().optional().nullable(),
  coApplicantOtherIncomeSource: z.string().optional().nullable(),
  coApplicantBankRecords: z.array(z.any()).optional().nullable(),

  // Guarantor
  hasGuarantor: z.boolean().optional(),
  guarantorName: z.string().optional().nullable(),
  guarantorRelationship: z.string().optional().nullable(),
  guarantorDob: dateStringToDate.optional().nullable(),
  guarantorSsn: z.string().optional().nullable(),
  guarantorPhone: z.string().optional().nullable(),
  guarantorEmail: z.string().optional().nullable(),
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

  // Guarantor Financial
  guarantorEmploymentType: z.string().optional().nullable(),
  guarantorEmployer: z.string().optional().nullable(),
  guarantorPosition: z.string().optional().nullable(),
  guarantorEmploymentStart: dateStringToDate.optional().nullable(),
  guarantorBusinessName: z.string().optional().nullable(),
  guarantorBusinessType: z.string().optional().nullable(),
  guarantorYearsInBusiness: z.number().optional().nullable(),
  guarantorIncome: z.number().optional().nullable(),
  guarantorOtherIncome: z.number().optional().nullable(),
  guarantorOtherIncomeSource: z.string().optional().nullable(),
  guarantorBankRecords: z.array(z.any()).optional().nullable(),

  // Signatures
  applicantSignature: z.string().optional().nullable(),
  applicantSignatureDate: z.string().optional().nullable(),
  coApplicantSignature: z.string().optional().nullable(),
  coApplicantSignatureDate: z.string().optional().nullable(),
  guarantorSignature: z.string().optional().nullable(),
  guarantorSignatureDate: z.string().optional().nullable(),

  // Other Occupants
  otherOccupants: z.array(z.any()).optional().nullable(),

  // Legal Questions
  landlordTenantLegalAction: z.string().optional().nullable(),
  brokenLease: z.string().optional().nullable(),

  // Status
  status: z.string().optional().default("draft"),

  // Allow passthrough for extra fields that might be added
}).passthrough(); 