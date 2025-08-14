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

// Bank record schema
const bankRecordSchema = z.object({
  bankName: z.string().optional(),
  accountType: z.string().optional(),
  accountNumber: z.string().optional(),
});

// Application schema
const applicationSchema = z.object({
  buildingAddress: z.string().optional(),
  apartmentNumber: z.string().optional(),
  apartmentType: z.string().optional(),
  monthlyRent: z.union([
    z.number(),
    z.string().transform((val) => parseFloat(val) || 0)
  ]).optional(),
  moveInDate: z.string().optional(),
  howDidYouHear: z.string().optional(),
  howDidYouHearOther: z.string().optional(),
});

// Applicant schema
const applicantSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  dob: z.string().optional(),
  ssn: z.string().optional(),
  license: z.string().optional(),
  licenseState: z.string().optional(),
  lengthAtAddressYears: z.number().optional(),
  lengthAtAddressMonths: z.number().optional(),
  landlordName: z.string().optional(),
  landlordAddressLine1: z.string().optional(),
  landlordAddressLine2: z.string().optional(),
  landlordCity: z.string().optional(),
  landlordState: z.string().optional(),
  landlordZipCode: z.string().optional(),
  landlordPhone: z.string().optional(),
  landlordEmail: z.string().optional(),
  currentRent: z.number().optional(),
  reasonForMoving: z.string().optional(),
  age: z.number().optional(),
  employmentType: z.string().optional(),
  employer: z.string().optional(),
  position: z.string().optional(),
  employmentStart: z.string().optional(),
  income: z.string().optional(),
  incomeFrequency: z.string().optional(),
  otherIncome: z.string().optional(),
  otherIncomeSource: z.string().optional(),
  bankRecords: z.array(bankRecordSchema).optional(),
});

// Co-Applicant schema (same as applicant)
const coApplicantSchema = applicantSchema;

// Guarantor schema (extends applicant with business fields)
const guarantorSchema = applicantSchema.extend({
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  yearsInBusiness: z.string().optional(),
});

// Occupant schema
const occupantSchema = z.object({
  name: z.string().optional(),
  relationship: z.string().optional(),
  dob: z.string().optional(),
  ssn: z.string().optional(),
  license: z.string().optional(),
  age: z.number().optional(),
  documents: z.any().optional(),
});

// Webhook summary schema - updated to match exact structure
const webhookSummarySchema = z.object({
  totalResponses: z.number().optional(),
  responsesByPerson: z.object({
    applicant: z.number().optional(),
    coApplicant: z.number().optional(),
    guarantor: z.number().optional(),
    occupants: z.number().optional(),
  }).optional(),
  webhookResponses: z.record(z.string()).optional(),
});

// Comprehensive validation schema that matches the actual application data for webhook submission
export const webhookSubmissionSchema = z.object({
  // Required fields
  applicantId: z.string().min(1, "Applicant ID is required"),
  applicantName: z.string().min(1, "Applicant name is required"),
  applicantEmail: z.string().email("Valid email is required"),
  application_id: z.string().min(1, "Application ID is required"),
  
  // Nested objects
  application: applicationSchema.optional(),
  applicant: applicantSchema.optional(),
  coApplicant: coApplicantSchema.optional(),
  guarantor: guarantorSchema.optional(),
  occupants: z.array(occupantSchema).optional(),
  webhookSummary: webhookSummarySchema.optional(),
  
  // Additional fields
  zoneinfo: z.string().optional(),
  hasCoApplicant: z.boolean().optional(),
  hasGuarantor: z.boolean().optional(),
  
  // Allow passthrough for extra fields that might be added
}).passthrough();

// Comprehensive validation schema that matches the actual application data
export const insertRentalApplicationSchema = z.object({
  // Required fields
  applicantId: z.string().min(1, "Applicant ID is required"),
  applicantName: z.string().min(1, "Applicant name is required"),
  applicantEmail: z.string().email("Valid email is required"),
  application_id: z.string().min(1, "Application ID is required"),
  
  // Nested objects
  application: applicationSchema.optional(),
  applicant: applicantSchema.optional(),
  coApplicant: coApplicantSchema.optional(),
  guarantor: guarantorSchema.optional(),
  occupants: z.array(occupantSchema).optional(),
  webhookSummary: webhookSummarySchema.optional(),
  
  // Additional fields
  zoneinfo: z.string().optional(),
  hasCoApplicant: z.boolean().optional(),
  hasGuarantor: z.boolean().optional(),
  
  // Documents and encrypted data
  documents: z.any().optional().nullable(),
  encryptedData: z.any().optional().nullable(),
  
  // Status
  status: z.string().optional().default("draft"),

  // Allow passthrough for extra fields that might be added
}).passthrough(); 