import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rentalApplications = pgTable("rental_applications", {
  id: serial("id").primaryKey(),
  // Application Info
  applicationDate: timestamp("application_date").defaultNow(),
  buildingAddress: text("building_address").notNull(),
  apartmentNumber: text("apartment_number").notNull(),
  moveInDate: timestamp("move_in_date").notNull(),
  monthlyRent: real("monthly_rent").notNull(),
  apartmentType: text("apartment_type").notNull(),
  howDidYouHear: text("how_did_you_hear"),
  
  // Primary Applicant
  applicantName: text("applicant_name").notNull(),
  applicantDob: timestamp("applicant_dob").notNull(),
  applicantSsn: text("applicant_ssn"),
  applicantPhone: text("applicant_phone"),
  applicantEmail: text("applicant_email").notNull(),
  applicantLicense: text("applicant_license"),
  applicantLicenseState: text("applicant_license_state"),
  applicantAddress: text("applicant_address").notNull(),
  applicantCity: text("applicant_city").notNull(),
  applicantState: text("applicant_state").notNull(),
  applicantZip: text("applicant_zip").notNull(),
  applicantLengthAtAddress: text("applicant_length_at_address"),
  applicantLandlordName: text("applicant_landlord_name"),
  applicantCurrentRent: real("applicant_current_rent"),
  applicantReasonForMoving: text("applicant_reason_for_moving"),
  
  // Primary Applicant Financial
  applicantEmployer: text("applicant_employer"),
  applicantPosition: text("applicant_position"),
  applicantEmploymentStart: timestamp("applicant_employment_start"),
  applicantIncome: real("applicant_income"),
  applicantOtherIncome: real("applicant_other_income"),
  applicantOtherIncomeSource: text("applicant_other_income_source"),
  applicantBankName: text("applicant_bank_name"),
  applicantAccountType: text("applicant_account_type"),
  
  // Co-Applicant
  hasCoApplicant: boolean("has_co_applicant").default(false),
  coApplicantName: text("co_applicant_name"),
  coApplicantRelationship: text("co_applicant_relationship"),
  coApplicantDob: timestamp("co_applicant_dob"),
  coApplicantSsn: text("co_applicant_ssn"),
  coApplicantPhone: text("co_applicant_phone"),
  coApplicantEmail: text("co_applicant_email"),
  coApplicantSameAddress: boolean("co_applicant_same_address").default(false),
  coApplicantAddress: text("co_applicant_address"),
  coApplicantCity: text("co_applicant_city"),
  coApplicantState: text("co_applicant_state"),
  coApplicantZip: text("co_applicant_zip"),
  coApplicantLengthAtAddress: text("co_applicant_length_at_address"),
  
  // Co-Applicant Financial
  coApplicantEmployer: text("co_applicant_employer"),
  coApplicantPosition: text("co_applicant_position"),
  coApplicantEmploymentStart: timestamp("co_applicant_employment_start"),
  coApplicantIncome: real("co_applicant_income"),
  coApplicantOtherIncome: real("co_applicant_other_income"),
  coApplicantBankName: text("co_applicant_bank_name"),
  coApplicantAccountType: text("co_applicant_account_type"),
  
  // Guarantor
  hasGuarantor: boolean("has_guarantor").default(false),
  guarantorName: text("guarantor_name"),
  guarantorRelationship: text("guarantor_relationship"),
  guarantorDob: timestamp("guarantor_dob"),
  guarantorSsn: text("guarantor_ssn"),
  guarantorPhone: text("guarantor_phone"),
  guarantorEmail: text("guarantor_email"),
  guarantorAddress: text("guarantor_address"),
  guarantorCity: text("guarantor_city"),
  guarantorState: text("guarantor_state"),
  guarantorZip: text("guarantor_zip"),
  guarantorLengthAtAddress: text("guarantor_length_at_address"),
  
  // Guarantor Financial
  guarantorEmployer: text("guarantor_employer"),
  guarantorPosition: text("guarantor_position"),
  guarantorEmploymentStart: timestamp("guarantor_employment_start"),
  guarantorIncome: real("guarantor_income"),
  guarantorOtherIncome: real("guarantor_other_income"),
  guarantorBankName: text("guarantor_bank_name"),
  guarantorAccountType: text("guarantor_account_type"),
  
  // Signatures
  applicantSignature: text("applicant_signature"),
  coApplicantSignature: text("co_applicant_signature"),
  guarantorSignature: text("guarantor_signature"),
  
  // Legal Questions
  hasBankruptcy: boolean("has_bankruptcy").default(false),
  bankruptcyDetails: text("bankruptcy_details"),
  hasEviction: boolean("has_eviction").default(false),
  evictionDetails: text("eviction_details"),
  hasCriminalHistory: boolean("has_criminal_history").default(false),
  criminalHistoryDetails: text("criminal_history_details"),
  hasPets: boolean("has_pets").default(false),
  petDetails: text("pet_details"),
  smokingStatus: text("smoking_status"), // "non-smoker", "smoker", "occasional"
  
  // Documents (JSON array of file paths/URLs)
  documents: text("documents"),
  
  // Encrypted Data (JSON object containing encrypted documents and metadata)
  encryptedData: text("encrypted_data"),
  
  // Status
  status: text("status").default("draft"),
  submittedAt: timestamp("submitted_at"),
});

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

// Create base schema and then override date fields
const baseSchema = createInsertSchema(rentalApplications).omit({
  id: true,
  applicationDate: true,
  submittedAt: true,
});

export const insertRentalApplicationSchema = baseSchema.extend({
  // Required fields (from database schema)
  buildingAddress: z.string().min(1, "Building address is required"),
  apartmentNumber: z.string().min(1, "Apartment number is required"),
  moveInDate: dateStringToDate.refine((val) => val !== null, "Move-in date is required"),
  monthlyRent: z.number().optional(),
  apartmentType: z.string().min(1, "Apartment type is required"),
  applicantName: z.string().min(1, "Applicant name is required"),
  applicantDob: dateStringToDate.refine((val) => val !== null, "Applicant date of birth is required"),
  applicantSsn: z.string().optional().nullable(),
  applicantPhone: z.string().optional().nullable(),
  applicantEmail: z.string().email("Valid email is required"),
  applicantAddress: z.string().min(1, "Address is required"),
  applicantCity: z.string().min(1, "City is required"),
  applicantState: z.string().min(1, "State is required"),
  applicantZip: z.string().min(1, "ZIP code is required"),
  
  // Optional fields
  howDidYouHear: z.string().optional(),
  applicantLicense: z.string().optional(),
  applicantLicenseState: z.string().optional(),
  applicantLengthAtAddress: z.string().optional(),
  applicantLandlordName: z.string().optional(),
  applicantCurrentRent: z.number().optional(),
  applicantReasonForMoving: z.string().optional(),
  applicantEmploymentStart: dateStringToDate.optional(),
  coApplicantDob: dateStringToDate.optional(),
  coApplicantEmploymentStart: dateStringToDate.optional(),
  
  // Make co-applicant fields optional and nullable
  coApplicantName: z.string().optional().nullable(),
  coApplicantRelationship: z.string().optional().nullable(),
  coApplicantSsn: z.string().optional().nullable(),
  coApplicantPhone: z.string().optional().nullable(),
  coApplicantEmail: z.string().optional().nullable(),
  coApplicantAddress: z.string().optional().nullable(),
  coApplicantCity: z.string().optional().nullable(),
  coApplicantState: z.string().optional().nullable(),
  coApplicantZip: z.string().optional().nullable(),
  coApplicantLengthAtAddress: z.string().optional().nullable(),
  coApplicantEmployer: z.string().optional().nullable(),
  coApplicantPosition: z.string().optional().nullable(),
  coApplicantIncome: z.number().optional().nullable(),
  coApplicantOtherIncome: z.number().optional().nullable(),
  coApplicantBankName: z.string().optional().nullable(),
  coApplicantAccountType: z.string().optional().nullable(),
  coApplicantSignature: z.string().optional().nullable(),
  
  // Make guarantor fields optional and nullable
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
  guarantorLengthAtAddress: z.string().optional().nullable(),
  guarantorEmployer: z.string().optional().nullable(),
  guarantorPosition: z.string().optional().nullable(),
  guarantorEmploymentStart: dateStringToDate.optional().nullable(),
  guarantorIncome: z.number().optional().nullable(),
  guarantorOtherIncome: z.number().optional().nullable(),
  guarantorBankName: z.string().optional().nullable(),
  guarantorAccountType: z.string().optional().nullable(),
  guarantorSignature: z.string().optional().nullable(),
  
  // Make applicant financial fields optional
  applicantEmployer: z.string().optional().nullable(),
  applicantPosition: z.string().optional().nullable(),
  applicantIncome: z.number().optional().nullable(),
  applicantOtherIncome: z.number().optional().nullable(),
  applicantOtherIncomeSource: z.string().optional().nullable(),
  applicantBankName: z.string().optional().nullable(),
  applicantAccountType: z.string().optional().nullable(),
  applicantSignature: z.string().optional().nullable(),
  
  // Legal questions
  hasBankruptcy: z.boolean().default(false),
  bankruptcyDetails: z.string().optional(),
  hasEviction: z.boolean().default(false),
  evictionDetails: z.string().optional(),
  hasCriminalHistory: z.boolean().default(false),
  criminalHistoryDetails: z.string().optional(),
  hasPets: z.boolean().default(false),
  petDetails: z.string().optional(),
  smokingStatus: z.string().optional(),
  
  // Documents and encrypted data
  documents: z.string().optional(),
  encryptedData: z.string().optional(),
  
  // Status
  status: z.string().default("draft"),
});

export type InsertRentalApplication = z.infer<typeof insertRentalApplicationSchema>;
export type RentalApplication = typeof rentalApplications.$inferSelect;
