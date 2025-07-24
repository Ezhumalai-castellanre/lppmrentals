// Mock schema for testing Netlify functions
// In production, this would import from the actual schema

import { z } from 'zod';

// Simple validation schema for testing
export const insertRentalApplicationSchema = z.object({
  // Application Info
  buildingAddress: z.string().optional(),
  apartmentNumber: z.string().optional(),
  moveInDate: z.string().or(z.date()).optional(),
  monthlyRent: z.number().optional(),
  apartmentType: z.string().optional(),
  howDidYouHear: z.string().optional(),
  howDidYouHearOther: z.string().optional(),

  // Primary Applicant
  applicantName: z.string().min(1, "Applicant name is required"),
  applicantDob: z.string().or(z.date()).optional(),
  applicantSsn: z.string().optional(),
  applicantPhone: z.string().optional(),
  applicantEmail: z.string().email("Valid email is required"),
  applicantLicense: z.string().optional(),
  applicantLicenseState: z.string().optional(),
  applicantAddress: z.string().optional(),
  applicantCity: z.string().optional(),
  applicantState: z.string().optional(),
  applicantZip: z.string().optional(),
  applicantLengthAtAddressYears: z.number().optional(),
  applicantLengthAtAddressMonths: z.number().optional(),
  applicantLandlordName: z.string().optional(),
  applicantCurrentRent: z.number().optional(),
  applicantReasonForMoving: z.string().optional(),
  applicantGender: z.string().optional(),

  // Conditional fields
  hasCoApplicant: z.boolean().optional(),
  hasGuarantor: z.boolean().optional(),

  // Legal Questions
  landlordTenantLegalAction: z.string().optional(),
  brokenLease: z.string().optional(),

  // Allow passthrough for extra fields
}).passthrough(); 