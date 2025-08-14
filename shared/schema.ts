import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicantId: text("applicant_id").notNull().unique(),
  cognitoUsername: text("cognito_username").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const rentalApplications = sqliteTable("rental_applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // User reference
  applicantId: text("applicant_id").notNull().references(() => users.applicantId),
  
  // Application Info (nested object)
  application: text("application"), // JSON string containing buildingAddress, apartmentNumber, etc.
  
  // Applicant Info (nested object)
  applicant: text("applicant"), // JSON string containing name, email, phone, etc.
  
  // Co-Applicant Info (nested object)
  coApplicant: text("co_applicant"), // JSON string containing co-applicant data
  
  // Guarantor Info (nested object)
  guarantor: text("guarantor"), // JSON string containing guarantor data
  
  // Occupants Info (nested array)
  occupants: text("occupants"), // JSON string containing occupants array
  
  // Additional fields
  applicantName: text("applicant_name").notNull(),
  applicantEmail: text("applicant_email").notNull(),
  application_id: text("application_id").notNull(),
  zoneinfo: text("zoneinfo"),
  hasCoApplicant: integer("has_co_applicant", { mode: 'boolean' }).default(false),
  hasGuarantor: integer("has_guarantor", { mode: 'boolean' }).default(false),
  
  // Webhook Summary
  webhookSummary: text("webhook_summary"), // JSON string containing webhook responses
  
  // Documents (JSON array of file paths/URLs)
  documents: text("documents"),
  
  // Encrypted Data (JSON object containing encrypted documents and metadata)
  encryptedData: text("encrypted_data"),
  
  // Status
  status: text("status").default("draft"),
  submittedAt: integer("submitted_at", { mode: 'timestamp' }),
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
  submittedAt: true,
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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

// Webhook summary schema
const webhookSummarySchema = z.object({
  totalResponses: z.number().optional(),
  responsesByPerson: z.record(z.number()).optional(),
  webhookResponses: z.record(z.string()).optional(),
});

export const insertRentalApplicationSchema = baseSchema.extend({
  // Required fields
  applicantId: z.string().min(1, "Applicant ID is required"),
  applicantName: z.string().min(1, "Applicant name is required"),
  applicantEmail: z.string().email("Valid email is required"),
  application_id: z.string().min(1, "Application ID is required"),
  
  // Nested objects as JSON strings
  application: z.string().optional().transform((val) => {
    if (!val) return null;
    try {
      return JSON.stringify(applicationSchema.parse(JSON.parse(val)));
    } catch {
      return val;
    }
  }),
  
  applicant: z.string().optional().transform((val) => {
    if (!val) return null;
    try {
      return JSON.stringify(applicantSchema.parse(JSON.parse(val)));
    } catch {
      return val;
    }
  }),
  
  coApplicant: z.string().optional().transform((val) => {
    if (!val) return null;
    try {
      return JSON.stringify(coApplicantSchema.parse(JSON.parse(val)));
    } catch {
      return val;
    }
  }),
  
  guarantor: z.string().optional().transform((val) => {
    if (!val) return null;
    try {
      return JSON.stringify(guarantorSchema.parse(JSON.parse(val)));
    } catch {
      return val;
    }
  }),
  
  occupants: z.string().optional().transform((val) => {
    if (!val) return null;
    try {
      const parsed = JSON.parse(val);
      const occupantsArray = Array.isArray(parsed) ? parsed : [parsed];
      return JSON.stringify(occupantsArray.map(occupant => occupantSchema.parse(occupant)));
    } catch {
      return val;
    }
  }),
  
  webhookSummary: z.string().optional().transform((val) => {
    if (!val) return null;
    try {
      return JSON.stringify(webhookSummarySchema.parse(JSON.parse(val)));
    } catch {
      return val;
    }
  }),
  
  // Additional fields
  zoneinfo: z.string().optional(),
  hasCoApplicant: z.boolean().default(false),
  hasGuarantor: z.boolean().default(false),
  
  // Documents and encrypted data
  documents: z.string().optional(),
  encryptedData: z.string().optional(),
  
  // Status
  status: z.string().default("draft"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRentalApplication = z.infer<typeof insertRentalApplicationSchema>;
export type RentalApplication = typeof rentalApplications.$inferSelect;
