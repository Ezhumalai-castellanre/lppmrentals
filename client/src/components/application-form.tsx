import React from "react";
import { dynamoDBUtils as legacyDraftUtils } from "../lib/dynamodb-service";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { SignaturePad } from "./ui/signature-pad";
import { DatePicker } from "./ui/date-picker";
import { FinancialSection } from "./financial-section";
import { DocumentSection } from "./document-section";
import { SupportingDocuments } from "./supporting-documents";
import { PDFGenerator } from "../lib/pdf-generator";
import { EnhancedPDFGenerator } from "../lib/pdf-generator-enhanced";
import { Download, FileText, Users, UserCheck, CalendarDays, Shield, FolderOpen, ChevronLeft, ChevronRight, Check, Search, Save, X } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";


import ApplicationInstructions from "./application-instructions";
import RentalDashboard from "./rental-dashboard";
import { useRef } from "react";
import { useLocation } from "wouter";
import { type EncryptedFile, validateEncryptedData, createEncryptedDataSummary } from "../lib/file-encryption";
import { WebhookService } from "../lib/webhook-service";
import { dynamoDBSeparateTablesUtils } from "../lib/dynamodb-separate-tables-service";
import { MondayApiService, type UnitItem } from "../lib/monday-api";


import { ValidatedInput, PhoneInput, SSNInput, ZIPInput, EmailInput, LicenseInput, IncomeInput, IncomeWithFrequencyInput } from "./ui/validated-input";
import { StateCitySelector, StateSelector, CitySelector } from "./ui/state-city-selector";
import { validatePhoneNumber, validateSSN, validateZIPCode, validateEmail, validateDriverLicense } from "../lib/validation";
import { FileUpload } from "./ui/file-upload";



// Helpers to normalize incoming values to expected types for Zod
const toDate = (val: unknown) => {
  if (!val) return undefined;
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val as any);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
};

// Helper function to normalize guarantor_info field names to match form schema
const normalizeGuarantorInfo = (guarantorInfo: any) => {
  const normalized = { ...guarantorInfo };
  
  // Normalize field names from database to form field names
  if (normalized.fullName && !normalized.name) normalized.name = normalized.fullName;
  if (normalized.full_name && !normalized.name) normalized.name = normalized.full_name;
  if (normalized.phoneNumber && !normalized.phone) normalized.phone = normalized.phoneNumber;
  if (normalized.phone_number && !normalized.phone) normalized.phone = normalized.phone_number;
  if (normalized.mail && !normalized.email) normalized.email = normalized.mail;
  if (normalized.addressLine1 && !normalized.address) normalized.address = normalized.addressLine1;
  if (normalized.address1 && !normalized.address) normalized.address = normalized.address1;
  if (normalized.street && !normalized.address) normalized.address = normalized.street;
  if (normalized.town && !normalized.city) normalized.city = normalized.town;
  if (normalized.region && !normalized.state) normalized.state = normalized.region;
  if (normalized.zipCode && !normalized.zip) normalized.zip = normalized.zipCode;
  if (normalized.postalCode && !normalized.zip) normalized.zip = normalized.postalCode;
  if (normalized.postal_code && !normalized.zip) normalized.zip = normalized.postal_code;
  if (normalized.date_of_birth && !normalized.dob) normalized.dob = normalized.date_of_birth;
  if (normalized.driverLicense && !normalized.license) normalized.license = normalized.driverLicense;
  if (normalized.driver_license && !normalized.license) normalized.license = normalized.driver_license;
  if (normalized.license_state && !normalized.licenseState) normalized.licenseState = normalized.license_state;
  if (normalized.landlord_name && !normalized.landlordName) normalized.landlordName = normalized.landlord_name;
  if (normalized.landlord_address_line1 && !normalized.landlordAddressLine1) normalized.landlordAddressLine1 = normalized.landlord_address_line1;
  if (normalized.landlord_address && !normalized.landlordAddressLine1) normalized.landlordAddressLine1 = normalized.landlord_address;
  if (normalized.landlord_address_line2 && !normalized.landlordAddressLine2) normalized.landlordAddressLine2 = normalized.landlord_address_line2;
  if (normalized.landlord_city && !normalized.landlordCity) normalized.landlordCity = normalized.landlord_city;
  if (normalized.landlord_state && !normalized.landlordState) normalized.landlordState = normalized.landlord_state;
  if (normalized.landlord_zip && !normalized.landlordZipCode) normalized.landlordZipCode = normalized.landlord_zip;
  if (normalized.landlord_zip_code && !normalized.landlordZipCode) normalized.landlordZipCode = normalized.landlord_zip_code;
  if (normalized.landlord_phone && !normalized.landlordPhone) normalized.landlordPhone = normalized.landlord_phone;
  if (normalized.landlord_email && !normalized.landlordEmail) normalized.landlordEmail = normalized.landlord_email;
  if (normalized.current_rent && !normalized.currentRent) normalized.currentRent = normalized.current_rent;
  if (normalized.reason_for_moving && !normalized.reasonForMoving) normalized.reasonForMoving = normalized.reason_for_moving;
  if (normalized.employment_type && !normalized.employmentType) normalized.employmentType = normalized.employment_type;
  if (normalized.employment && !normalized.employmentType) normalized.employmentType = normalized.employment;
  if (normalized.employment_start && !normalized.employmentStart) normalized.employmentStart = normalized.employment_start;
  if (normalized.years_in_business && !normalized.yearsInBusiness) normalized.yearsInBusiness = normalized.years_in_business;
  if (normalized.other_income && !normalized.otherIncome) normalized.otherIncome = normalized.other_income;
  if (normalized.other_income_frequency && !normalized.otherIncomeFrequency) normalized.otherIncomeFrequency = normalized.other_income_frequency;
  if (normalized.other_income_source && !normalized.otherIncomeSource) normalized.otherIncomeSource = normalized.other_income_source;
  if (normalized.credit_score && !normalized.creditScore) normalized.creditScore = normalized.credit_score;
  if (normalized.bank_records && !normalized.bankRecords) normalized.bankRecords = normalized.bank_records;
  
  return normalized;
};

// Helper function to normalize coapplicant_info field names to match form schema
const normalizeCoApplicantInfo = (coApplicantInfo: any) => {
  const normalized = { ...coApplicantInfo };
  try {
    if (normalized.fullName && !normalized.name) normalized.name = normalized.fullName;
    if (normalized.full_name && !normalized.name) normalized.name = normalized.full_name;
    if (normalized.phoneNumber && !normalized.phone) normalized.phone = normalized.phoneNumber;
    if (normalized.phone_number && !normalized.phone) normalized.phone = normalized.phone_number;
    if (normalized.mail && !normalized.email) normalized.email = normalized.mail;
    if (normalized.addressLine1 && !normalized.address) normalized.address = normalized.addressLine1;
    if (normalized.address1 && !normalized.address) normalized.address = normalized.address1;
    if (normalized.street && !normalized.address) normalized.address = normalized.street;
    if (normalized.town && !normalized.city) normalized.city = normalized.town;
    if (normalized.region && !normalized.state) normalized.state = normalized.region;
    if (normalized.zipCode && !normalized.zip) normalized.zip = normalized.zipCode;
    if (normalized.postalCode && !normalized.zip) normalized.zip = normalized.postalCode;
    if (normalized.postal_code && !normalized.zip) normalized.zip = normalized.postal_code;
    if (normalized.date_of_birth && !normalized.dob) normalized.dob = normalized.date_of_birth;
    if (normalized.driverLicense && !normalized.license) normalized.license = normalized.driverLicense;
    if (normalized.driver_license && !normalized.license) normalized.license = normalized.driver_license;
    if (normalized.license_state && !normalized.licenseState) normalized.licenseState = normalized.license_state;
    if (normalized.current_rent && !normalized.currentRent) normalized.currentRent = normalized.current_rent;
    if (normalized.reason_for_moving && !normalized.reasonForMoving) normalized.reasonForMoving = normalized.reason_for_moving;
    if (normalized.employment_type && !normalized.employmentType) normalized.employmentType = normalized.employment_type;
    if (normalized.employment && !normalized.employmentType) normalized.employmentType = normalized.employment;
    if (normalized.employment_start && !normalized.employmentStart) normalized.employmentStart = normalized.employment_start;
    if (normalized.years_in_business && !normalized.yearsInBusiness) normalized.yearsInBusiness = normalized.years_in_business;
    if (normalized.other_income && !normalized.otherIncome) normalized.otherIncome = normalized.other_income;
    if (normalized.other_income_frequency && !normalized.otherIncomeFrequency) normalized.otherIncomeFrequency = normalized.other_income_frequency;
    if (normalized.other_income_source && !normalized.otherIncomeSource) normalized.otherIncomeSource = normalized.other_income_source;
    if (normalized.credit_score && !normalized.creditScore) normalized.creditScore = normalized.credit_score;
    if (normalized.bank_records && !normalized.bankRecords) normalized.bankRecords = normalized.bank_records;
  } catch {}
  return normalized;
};

// Resolve an effective role from state or Cognito user as a fallback
const getEffectiveRole = (): string => {
  try {
    // Prefer explicitly selected role
    // @ts-ignore userRole is in component scope
    if (typeof userRole === 'string' && userRole.trim().length > 0) return userRole;
    // Fallback to Cognito custom:role
    // @ts-ignore user is in component scope
    if (user && typeof user.role === 'string' && user.role.trim().length > 0) return user.role;
  } catch {}
  return 'applicant';
};

const toStringValue = (val: unknown) => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  // Prevent accidental Date -> string for SSN; treat as empty
  if (val instanceof Date) return '';
  try { return String(val); } catch { return ''; }
};

const applicationSchema = z.object({
  // Application Info
  buildingAddress: z.string().optional(),
  apartmentNumber: z.string().optional(),
  moveInDate: z.preprocess(toDate, z.date()).optional(),
  monthlyRent: z.union([
    z.number().optional(),
    z.string().optional().transform((val) => val ? Number(val) : undefined)
  ]).or(z.undefined()),
  apartmentType: z.string().optional(),
  howDidYouHear: z.string().optional(),
  howDidYouHearOther: z.string().optional(),

  // Primary Applicant
  applicantName: z.string().optional(), // Lenient: any name entry is okay
  applicantDob: z.preprocess(toDate, z.date()).optional(),
  applicantSsn: z.preprocess(toStringValue, z.string().optional().refine((val) => !val || validateSSN(val), {
    message: "Please enter a valid 9-digit Social Security Number"
  })),
  applicantPhone: z.string().optional().refine((val) => {
    // If no value or empty string, it's valid (optional field)
    if (!val || val.trim() === '') return true;
    // Validate the phone number
    return validatePhoneNumber(val);
  }, {
    message: "Please enter a valid US phone number"
  }).refine((val) => !val || (val.replace(/\D/g, '').length === 10), {
    message: "Phone number must be 10 digits"
  }),
  applicantEmail: z.string().optional().refine((val) => !val || validateEmail(val), {
    message: "Please enter a valid email address"
  }),
  applicantLicense: z.string().optional().refine((val) => !val || validateDriverLicense(val), {
    message: "Please enter a valid driver's license number"
  }),
  applicantLicenseState: z.string().optional(),
  applicantAddress: z.string().optional(),
  applicantCity: z.string().optional(),
  applicantState: z.string().optional(),
  applicantZip: z.string().optional().refine((val) => !val || validateZIPCode(val), {
    message: "Please enter a valid ZIP code"
  }),
  applicantLengthAtAddressYears: z.union([
    z.number().optional(),
    z.string().optional().transform((val) => val ? Number(val) : undefined)
  ]).or(z.undefined()),
  applicantLengthAtAddressMonths: z.union([
    z.number().optional(),
    z.string().optional().transform((val) => val ? Number(val) : undefined)
  ]).or(z.undefined()).refine((val) => !val || (val >= 0 && val <= 11), {
    message: "Months must be between 0 and 11"
  }),
  applicantLandlordName: z.string().optional(),
  applicantLandlordAddressLine1: z.string().optional(),
  applicantLandlordAddressLine2: z.string().optional(),
  applicantLandlordCity: z.string().optional(),
  applicantLandlordState: z.string().optional(),
  applicantLandlordZipCode: z.string().optional().refine((val) => !val || validateZIPCode(val), {
    message: "Please enter a valid ZIP code"
  }),
  applicantLandlordPhone: z.string().optional()
    .refine((val) => !val || validatePhoneNumber(val), {
      message: "Please enter a valid US phone number"
    })
    .refine((val) => !val || (val.replace(/\D/g, '').length === 10), {
      message: "Phone number must be 10 digits"
    }),
  applicantLandlordEmail: z.string().optional().refine((val) => !val || validateEmail(val), {
    message: "Please enter a valid email address"
  }),
  applicantCurrentRent: z.union([
    z.number().optional(),
    z.string().optional().transform((val) => val ? Number(val) : undefined)
  ]).or(z.undefined()),
  applicantReasonForMoving: z.string().optional(),

  // Co-Applicants (Array of up to 4)
  coApplicants: z.array(z.object({
    name: z.string().optional(), // Lenient: any name entry is okay
    relationship: z.string().optional(),
    dob: z.date().optional(),
    ssn: z.string().optional().refine((val) => !val || validateSSN(val), {
      message: "Please enter a valid 9-digit Social Security Number"
    }),
    phone: z.string().optional().refine((val) => {
      // If no value or empty string, it's valid (optional field)
      if (!val || val.trim() === '') return true;
      // Validate the phone number
      return validatePhoneNumber(val);
    }, {
      message: "Please enter a valid US phone number"
    }).refine((val) => !val || (val.replace(/\D/g, '').length === 10), {
      message: "Phone number must be 10 digits"
    }),
    email: z.string().optional().refine((val) => !val || validateEmail(val), {
      message: "Please enter a valid email address"
    }),
    license: z.string().optional().refine((val) => !val || validateDriverLicense(val), {
      message: "Please enter a valid driver's license number"
    }),
    licenseState: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional().refine((val) => !val || validateZIPCode(val), {
      message: "Please enter a valid ZIP code"
    }),
    lengthAtAddressYears: z.union([
      z.number().optional(),
      z.string().optional().transform((val) => val ? Number(val) : undefined)
    ]).or(z.undefined()),
    lengthAtAddressMonths: z.union([
      z.number().optional(),
      z.string().optional().transform((val) => val ? Number(val) : undefined)
    ]).or(z.undefined()).refine((val) => !val || (val >= 0 && val <= 11), {
      message: "Months must be between 0 and 11"
    }),
    landlordName: z.string().optional(),
    landlordAddressLine1: z.string().optional(),
    landlordAddressLine2: z.string().optional(),
    landlordCity: z.string().optional(),
    landlordState: z.string().optional(),
    landlordZipCode: z.string().optional().refine((val) => !val || validateZIPCode(val), {
      message: "Please enter a valid ZIP code"
    }),
    landlordPhone: z.string().optional()
      .refine((val) => !val || validatePhoneNumber(val), {
        message: "Please enter a valid US phone number"
      })
      .refine((val) => !val || (val.replace(/\D/g, '').length === 10), {
        message: "Phone number must be 10 digits"
      }),
    landlordEmail: z.string().optional().refine((val) => !val || validateEmail(val), {
      message: "Please enter a valid email address"
    }),
    currentRent: z.union([
      z.number().optional(),
      z.string().optional().transform((val) => val ? Number(val) : undefined)
    ]).or(z.undefined()),
    reasonForMoving: z.string().optional(),
    // Employment & Financial Information
    employmentType: z.string().optional(),
    employer: z.string().optional(),
    position: z.string().optional(),
    employmentStart: z.date().optional(),
    income: z.string().optional(),
    incomeFrequency: z.string().optional(),
    businessName: z.string().optional(),
    businessType: z.string().optional(),
    yearsInBusiness: z.string().optional(),
    otherIncome: z.string().optional(),
    otherIncomeFrequency: z.string().optional(),
    otherIncomeSource: z.string().optional(),
    creditScore: z.string().optional(),
    bankRecords: z.array(z.any()).optional(),
  })).max(4, "Maximum 4 co-applicants allowed"),

  // Guarantors (Array of up to 4) - Only required when hasGuarantor is true
  guarantors: z.array(z.object({
    name: z.string().optional(), // Make optional since validation depends on hasGuarantor
    relationship: z.string().optional(),
    dob: z.date().optional(), // Make optional since validation depends on hasGuarantor
    ssn: z.string().optional().refine((val) => !val || validateSSN(val), {
      message: "Please enter a valid 9-digit Social Security Number"
    }),
    phone: z.string().optional().refine((val) => {
      // If no value or empty string, it's valid (optional field)
      if (!val || val.trim() === '') return true;
      // Validate the phone number
      return validatePhoneNumber(val);
    }, {
      message: "Please enter a valid US phone number"
    }).refine((val) => !val || (val.replace(/\D/g, '').length === 10), {
      message: "Phone number must be 10 digits"
    }),
    email: z.string().optional().refine((val) => !val || validateEmail(val), {
      message: "Please enter a valid email address"
    }),
    license: z.string().optional().refine((val) => !val || validateDriverLicense(val), {
      message: "Please enter a valid driver's license number"
    }),
    licenseState: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional().refine((val) => !val || validateZIPCode(val), {
      message: "Please enter a valid ZIP code"
    }),
    lengthAtAddressYears: z.union([
      z.number().optional(),
      z.string().optional().transform((val) => val ? Number(val) : undefined)
    ]).or(z.undefined()),
    lengthAtAddressMonths: z.union([
      z.number().optional(),
      z.string().optional().transform((val) => val ? Number(val) : undefined)
    ]).or(z.undefined()).refine((val) => !val || (val >= 0 && val <= 11), {
      message: "Months must be between 0 and 11"
    }),
    landlordName: z.string().optional(),
    landlordAddressLine1: z.string().optional(),
    landlordAddressLine2: z.string().optional(),
    landlordCity: z.string().optional(),
    landlordState: z.string().optional(),
    landlordZipCode: z.string().optional().refine((val) => !val || validateZIPCode(val), {
      message: "Please enter a valid ZIP code"
    }),
    landlordPhone: z.string().optional()
      .refine((val) => !val || validatePhoneNumber(val), {
        message: "Please enter a valid US phone number"
      })
      .refine((val) => !val || (val.replace(/\D/g, '').length === 10), {
        message: "Phone number must be 10 digits"
      }),
    landlordEmail: z.string().optional().refine((val) => !val || validateEmail(val), {
      message: "Please enter a valid email address"
    }),
    currentRent: z.union([
      z.number().optional(),
      z.string().optional().transform((val) => val ? Number(val) : undefined)
    ]).or(z.undefined()),
    reasonForMoving: z.string().optional(),
    // Employment & Financial Information
    employmentType: z.string().optional(),
    employer: z.string().optional(),
    position: z.string().optional(),
    employmentStart: z.date().optional(),
    income: z.string().optional(),
    incomeFrequency: z.string().optional(),
    businessName: z.string().optional(),
    businessType: z.string().optional(),
    yearsInBusiness: z.string().optional(),
    otherIncome: z.string().optional(),
    otherIncomeFrequency: z.string().optional(),
    otherIncomeSource: z.string().optional(),
    creditScore: z.string().optional(),
    bankRecords: z.array(z.any()).optional(),
  })
  .superRefine((g, ctx) => {
    // If otherIncome provided, otherIncomeSource must be provided
    const otherIncomeProvided = !!(g.otherIncome && g.otherIncome.toString().trim() !== '');
    if (otherIncomeProvided && (!g.otherIncomeSource || g.otherIncomeSource.toString().trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Other income source is required when other income is provided',
        path: ['otherIncomeSource']
      });
    }

    // If any landlord detail is provided, currentRent must be a positive number
    const landlordFields = [
      g.landlordName,
      g.landlordAddressLine1,
      g.landlordAddressLine2,
      g.landlordCity,
      g.landlordState,
      g.landlordZipCode,
      g.landlordPhone,
      g.landlordEmail,
    ];
    const anyLandlordProvided = landlordFields.some((v) => !!(typeof v === 'string' ? v.trim() : v));
    const currentRentNumeric = typeof g.currentRent === 'string' ? Number(g.currentRent) : g.currentRent;
    if (anyLandlordProvided) {
      if (currentRentNumeric === undefined || currentRentNumeric === null || isNaN(Number(currentRentNumeric)) || Number(currentRentNumeric) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Current rent is required when landlord details are provided',
          path: ['currentRent']
        });
      }
    }
  }))
  .max(4, "Maximum 4 guarantors allowed"),

  // Legacy fields for backward compatibility
  coApplicantSsn: z.string().optional().refine((val) => !val || validateSSN(val), {
    message: "Please enter a valid 9-digit Social Security Number"
  }),
  coApplicantPhone: z.string().optional().refine((val) => !val || validatePhoneNumber(val), {
    message: "Please enter a valid US phone number"
  }),
  coApplicantEmail: z.string().optional().refine((val) => !val || validateEmail(val), {
    message: "Please enter a valid email address"
  }),
  coApplicantLicense: z.string().optional().refine((val) => !val || validateDriverLicense(val), {
    message: "Please enter a valid driver's license number"
  }),
  coApplicantZip: z.string().optional().refine((val) => !val || validateZIPCode(val), {
    message: "Please enter a valid ZIP code"
  }),
  coApplicantLandlordZipCode: z.string().optional().refine((val) => !val || validateZIPCode(val), {
    message: "Please enter a valid ZIP code"
  }),
  coApplicantLandlordPhone: z.string().optional()
    .refine((val) => !val || validatePhoneNumber(val), {
      message: "Please enter a valid US phone number"
    })
    .refine((val) => !val || (val.replace(/\D/g, '').length === 10), {
      message: "Phone number must be 10 digits"
    }),
  coApplicantLandlordEmail: z.string().optional().refine((val) => !val || validateEmail(val), {
    message: "Please enter a valid email address"
  }),

  // Legacy guarantor fields for backward compatibility
  guarantorSsn: z.string().optional().refine((val) => !val || validateSSN(val), {
    message: "Please enter a valid 9-digit Social Security Number"
  }),
  guarantorPhone: z.string().optional().refine((val) => !val || validatePhoneNumber(val), {
    message: "Please enter a valid US phone number"
  }),
  guarantorEmail: z.string().optional().refine((val) => !val || validateEmail(val), {
    message: "Please enter a valid email address"
  }),
  guarantorLicense: z.string().optional().refine((val) => !val || validateDriverLicense(val), {
    message: "Please enter a valid driver's license number"
  }),
  guarantorZip: z.string().optional().refine((val) => !val || validateZIPCode(val), {
    message: "Please enter a valid ZIP code"
  }),
  guarantorLandlordZipCode: z.string().optional().refine((val) => !val || validateZIPCode(val), {
    message: "Please enter a valid ZIP code"
  }),
  guarantorLandlordPhone: z.string().optional()
    .refine((val) => !val || validatePhoneNumber(val), {
      message: "Please enter a valid US phone number"
    })
    .refine((val) => !val || (val.replace(/\D/g, '').length === 10), {
      message: "Phone number must be 10 digits"
    }),
  guarantorLandlordEmail: z.string().optional().refine((val) => !val || validateEmail(val), {
    message: "Please enter a valid email address"
  }),

  // Conditional fields
  hasCoApplicant: z.boolean().default(false),
  hasGuarantor: z.boolean().default(false),
  coApplicantCount: z.number().min(0).max(4).default(0),
  guarantorCount: z.number().min(0).max(4).default(0),

  // Legal Questions
  landlordTenantLegalAction: z.string().optional(),
  brokenLease: z.string().optional(),
}).superRefine((data, ctx) => {
  // Co-applicants validation when enabled
  if (data.hasCoApplicant) {
    if (!data.coApplicants || data.coApplicants.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one co-applicant",
        path: ["coApplicants"]
      });
    } else {
      data.coApplicants.forEach((coApplicant: any, index: number) => {
        if (!coApplicant || typeof coApplicant !== "object") {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid co-applicant", path: ["coApplicants", index] });
          return;
        }
        // Date of birth validation removed - no validation required
      });
    }
  }

  // Guarantors validation when enabled
  if (data.hasGuarantor) {
    if (!data.guarantors || data.guarantors.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one guarantor",
        path: ["guarantors"]
      });
    } else {
      // Filter out completely empty guarantors
      const nonEmptyGuarantors = data.guarantors.filter((guarantor: any) => {
        if (!guarantor || typeof guarantor !== "object") return false;
        return guarantor.name || guarantor.dob || guarantor.ssn || guarantor.phone || guarantor.email;
      });
      
      if (nonEmptyGuarantors.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least one guarantor with information",
          path: ["guarantors"]
        });
      } else {
        nonEmptyGuarantors.forEach((guarantor: any, index: number) => {
          const originalIndex = data.guarantors.indexOf(guarantor);
          // Date of birth validation removed - no validation required
        });
      }
    }
  }
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const STEPS = [
  { id: 0, title: "Instructions" },
  { id: 1, title: "Application Info", icon: FileText },
  { id: 2, title: "Primary Applicant", icon: UserCheck },
  { id: 3, title: "Financial Info", icon: CalendarDays },
  { id: 4, title: "Supporting Documents", icon: FolderOpen },
  { id: 5, title: "Co-Applicant", icon: Users },
  { id: 6, title: "Co-Applicant Financial", icon: CalendarDays },
  { id: 7, title: "Co-Applicant Documents", icon: FolderOpen },
  { id: 8, title: "Other Occupants", icon: Users },
  { id: 9, title: "Guarantor", icon: Shield },
  { id: 10, title: "Guarantor Financial", icon: CalendarDays },
  { id: 11, title: "Guarantor Documents", icon: FolderOpen },
  { id: 12, title: "Digital Signatures", icon: Check },
];
// Function to get filtered steps based on role
const getFilteredSteps = (role: string) => {
  if (role === 'applicant') {
    // For applicant role, exclude Co-Applicant and Guarantor steps
    return STEPS.filter(step => 
      ![5, 6, 7, 9, 10, 11].includes(step.id) // Exclude Co-Applicant and Guarantor steps
    );
  }
  if (role === 'coapplicant') {
    // For coapplicant role, show only: Instructions, Co-Applicant, Co-Applicant Financial, Co-Applicant Documents, Digital Signatures
    return STEPS.filter(step => 
      [0, 5, 6, 7, 12].includes(step.id) // Only include specific steps for co-applicant
    );
  }
  if (role.startsWith('coapplicant') && /coapplicant\d+/.test(role)) {
    // For specific co-applicant role (coapplicant1, coapplicant2, etc.), show only: Instructions, Co-Applicant, Co-Applicant Financial, Co-Applicant Documents, Digital Signatures
    return STEPS.filter(step => 
      [0, 5, 6, 7, 12].includes(step.id) // Only include specific steps for co-applicant
    );
  }
  if (role === 'guarantor') {
    // For guarantor role, show only: Instructions, Guarantor, Guarantor Financial, Guarantor Documents, Digital Signatures
    return STEPS.filter(step => 
      [0, 9, 10, 11, 12].includes(step.id) // Only include specific steps for guarantor
    );
  }
  if (role.startsWith('guarantor') && /guarantor\d+/.test(role)) {
    // For specific guarantor role (guarantor1, guarantor2, etc.), show only: Instructions, Guarantor, Guarantor Financial, Guarantor Documents, Digital Signatures
    return STEPS.filter(step => 
      [0, 9, 10, 11, 12].includes(step.id) // Only include specific steps for guarantor
    );
  }
  // For other roles or 'all', return all steps
  return STEPS;
};

// 1. Add phone formatting helper
function formatPhoneForPayload(phone: string) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return phone;
}
export function ApplicationForm() {
  const { toast } = useToast();
  // Ensure the guarantors array has an object at a given index; extend with defaults if needed
  const ensureGuarantorIndexExists = React.useCallback((index: number) => {
    setFormData((prev: any) => {
      const updated = { ...(prev || {}) };
      const current = Array.isArray(updated.guarantors) ? [...updated.guarantors] : [];
      const defaultGuarantor = {
        name: '', relationship: '', dob: undefined as any, ssn: '', phone: '', email: '',
        license: '', licenseState: '', address: '', city: '', state: '', zip: '',
        lengthAtAddressYears: undefined as any, lengthAtAddressMonths: undefined as any,
        landlordName: '', landlordAddressLine1: '', landlordAddressLine2: '', landlordCity: '', landlordState: '', landlordZipCode: '', landlordPhone: '', landlordEmail: '',
        currentRent: undefined as any, reasonForMoving: '', employmentType: '', employer: '', position: '', employmentStart: undefined as any,
        income: '', incomeFrequency: 'yearly', businessName: '', businessType: '', yearsInBusiness: '',
        otherIncome: '', otherIncomeFrequency: 'monthly', otherIncomeSource: '', bankRecords: [] as any[]
      };
      while (current.length <= index) current.push({ ...defaultGuarantor });
      updated.guarantors = current;
      const neededCount = Math.max(updated.guarantorCount || 0, index + 1);
      updated.guarantorCount = neededCount;
      return updated;
    });
  }, []);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Parse role from URL query parameters
  const [userRole, setUserRole] = useState<string>('');
  const [specificIndex, setSpecificIndex] = useState<number | null>(null);
  // Step 1 helpers
  const [appOptions, setAppOptions] = useState<Array<{ appid: string; apartmentNumber?: string; buildingAddress?: string; zoneinfo: string }>>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  
  // Get filtered steps based on role
  const [filteredSteps, setFilteredSteps] = useState(getFilteredSteps('applicant'));
  
  // Helper function to get actual step ID from filtered step index
  const getActualStepId = (filteredIndex: number) => {
    return filteredSteps[filteredIndex]?.id ?? filteredIndex;
  };

  // Helper functions for sequential step mapping (for better UX)
  const getSequentialStepNumber = (actualStepId: number, role: string) => {
    if (role.startsWith('guarantor')) {
      // Map guarantor steps to sequential numbers: 0->1, 9->2, 10->3, 11->4, 12->5
      const guarantorStepMap: { [key: number]: number } = { 0: 1, 9: 2, 10: 3, 11: 4, 12: 5 };
      return guarantorStepMap[actualStepId] || 1;
    }
    if (role.startsWith('coapplicant')) {
      // Map co-applicant steps to sequential numbers: 0->1, 5->2, 6->3, 7->4
      // Final submitted state should be 4
      const coApplicantStepMap: { [key: number]: number } = { 0: 1, 5: 2, 6: 3, 7: 4 };
      return coApplicantStepMap[actualStepId] || 1;
    }
    // For applicant role, use actual step ID (no mapping needed)
    return actualStepId;
  };

  const getActualStepFromSequential = (sequentialStep: number, role: string) => {
    if (role.startsWith('guarantor')) {
      // Map sequential numbers back to actual step IDs: 1->0, 2->9, 3->10, 4->11, 5->12
      const guarantorReverseMap: { [key: number]: number } = { 1: 0, 2: 9, 3: 10, 4: 11, 5: 12 };
      return guarantorReverseMap[sequentialStep] || 0;
    }
    if (role.startsWith('coapplicant')) {
      // Map sequential numbers back to actual step IDs: 1->0, 2->5, 3->6, 4->7
      const coApplicantReverseMap: { [key: number]: number } = { 1: 0, 2: 5, 3: 6, 4: 7 };
      return coApplicantReverseMap[sequentialStep] || 0;
    }
    // For applicant role, use sequential step as-is (no mapping needed)
    return sequentialStep;
  };

  // Helper: map an actual step ID to the filtered step index for a role
  const getFilteredIndexForActualId = (actualStepId: number, role: string) => {
    const stepsForRole = getFilteredSteps(role || 'applicant');
    const idx = stepsForRole.findIndex(step => step.id === actualStepId);
    return idx >= 0 ? idx : 0;
  };


  // Read selected rental from sessionStorage
  const [selectedRental, setSelectedRental] = useState<any>(null);






  const [currentStep, setCurrentStep] = useState(0);
  const [hasExistingDraft, setHasExistingDraft] = useState<boolean | null>(null); // null = checking, true = has draft, false = no draft
  const [formData, setFormData] = useState<any>({
    application: {
      buildingAddress: '',
      apartmentNumber: '',
      apartmentType: '',
      monthlyRent: undefined,
      moveInDate: undefined,
      howDidYouHear: '',
      howDidYouHearOther: ''
    },
    applicant: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      dob: undefined,
      ssn: '',
      license: '',
      licenseState: '',
      lengthAtAddressYears: undefined,
      lengthAtAddressMonths: undefined,
      landlordName: '',
      landlordAddressLine1: '',
      landlordAddressLine2: '',
      landlordCity: '',
      landlordState: '',
      landlordZipCode: '',
      landlordPhone: '',
      landlordEmail: '',
      currentRent: undefined,
      reasonForMoving: '',
      // Employment & Financial Information
      employmentType: '',
      employer: '',
      position: '',
      employmentStart: undefined,
      income: '',
      incomeFrequency: 'yearly',
      businessName: '',
      businessType: '',
      yearsInBusiness: '',
      otherIncome: '',
      otherIncomeFrequency: 'monthly',
      otherIncomeSource: '',
      creditScore: '',
      bankRecords: []
    },
    coApplicant: {
      email: '',
      phone: '',
      zip: '',
      landlordZipCode: '',
      landlordPhone: '',
      landlordEmail: '',
      // Employment & Financial Information
      employmentType: '',
      employer: '',
      position: '',
      employmentStart: undefined,
      income: '',
      incomeFrequency: 'yearly',
      businessName: '',
      businessType: '',
      yearsInBusiness: '',
      otherIncome: '',
      otherIncomeFrequency: 'monthly',
      otherIncomeSource: '',
      creditScore: '',
      bankRecords: []
    },
    guarantor: {
      email: '',
      phone: '',
      zip: '',
      landlordZipCode: '',
      landlordPhone: '',
      landlordEmail: '',
      // Employment & Financial Information
      employmentType: '',
      employer: '',
      position: '',
      employmentStart: undefined,
      income: '',
      incomeFrequency: 'yearly',
      businessName: '',
      businessType: '',
      yearsInBusiness: '',
      otherIncome: '',
      otherIncomeFrequency: 'monthly',
      otherIncomeSource: '',
      creditScore: '',
      bankRecords: []
    },
    occupants: [], // Each occupant: { name, relationship, dob, ssn, age, ssnDocument, ssnEncryptedDocument, documents }
    
    // Conditional flags
    hasCoApplicant: false,
    hasGuarantor: false,
  });
  const [signatures, setSignatures] = useState<any>({
    applicant: null,
    coApplicants: {},
    guarantors: {}
  });
  const [signatureTimestamps, setSignatureTimestamps] = useState<any>({
    applicant: null,
    coApplicants: {},
    guarantors: {}
  });
  const [documents, setDocuments] = useState<any>({});
  const [encryptedDocuments, setEncryptedDocuments] = useState<any>({});
  const [hasCoApplicant, setHasCoApplicant] = useState(false);
  const [hasGuarantor, setHasGuarantor] = useState(false);

  const [sameAddressGuarantor, setSameAddressGuarantor] = useState(false);
  const [showHowDidYouHearOther, setShowHowDidYouHearOther] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [referenceId] = useState(() => `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [uploadedFilesMetadata, setUploadedFilesMetadata] = useState<{ [section: string]: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[] }>({});
  // Add state for uploadedDocuments
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    reference_id: string;
    file_name: string;
    section_name: string;
    documents?: string;
    file_url?: string;
  }[]>([]);

  // Add state for webhook responses
  const [webhookResponses, setWebhookResponses] = useState<Record<string, any>>({});

  // Welcome message state
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Monday.com API state
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(null);
  const [availableApartments, setAvailableApartments] = useState<UnitItem[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  // Fetch units from NYC listings API
  useEffect(() => {
    // Load all applications from app_nyc to populate Step 1 dropdown (zoneinfo must match current user)
    (async () => {
      try {
        const zone = (user as any)?.zoneinfo;
        const apps = await dynamoDBSeparateTablesUtils.getApplicationsByZoneinfo();
        const options = (apps || [])
          .filter(a => !zone || a.zoneinfo === zone)
          .map(a => ({
            appid: a.appid,
            apartmentNumber: a.application_info?.apartmentNumber,
            buildingAddress: a.application_info?.buildingAddress,
            zoneinfo: a.zoneinfo
          }));
        setAppOptions(options);
        if (options.length > 0) {
          setSelectedAppId(options[0].appid);
        }
      } catch (e) {
        // noop
      }
    })();
  }, [user]);

  const handleRoleChange = (value: string) => {
    setUserRole(value);
    setFilteredSteps(getFilteredSteps(value));
    // Ensure we land on the first step relevant for the selected role
    const startActualId = value.startsWith('guarantor')
      ? 9
      : (value.startsWith('coapplicant') ? 5 : 1);
    setCurrentStep(getFilteredIndexForActualId(startActualId, value));
    // Update specific index for coapplicantN/guarantorN
    if (/^coapplicant\d+$/.test(value)) {
      const match = value.match(/coapplicant(\d+)/);
      const idx = match ? parseInt(match[1], 10) - 1 : null;
      setSpecificIndex(idx);
    } else if (/^guarantor\d+$/.test(value)) {
      const match = value.match(/guarantor(\d+)/);
      const idx = match ? parseInt(match[1], 10) - 1 : null;
      setSpecificIndex(idx);
    } else {
      setSpecificIndex(null);
    }
    // Reflect in URL for consistency with existing logic
    setLocation(`/application?role=${encodeURIComponent(value)}`);
  };

  const handleAppSelect = (appid: string) => {
    setSelectedAppId(appid);
  };

  useEffect(() => {
    const fetchUnits = async () => {
      setIsLoadingUnits(true);
      try {
        // Fetching from NYC listings API...
        const nycResponse = await fetch('https://5sdpaqwf0f.execute-api.us-east-1.amazonaws.com/dev/getnyclisting', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            "Stage": "Active"
          }),
        });

        if (nycResponse.ok) {
          const nycResult = await nycResponse.json();
          // NYC listings API response received
          
          // Handle the new API response structure
          let fetchedUnits: UnitItem[] = [];
          
          if (nycResult.body) {
            try {
              // Parse the body if it's a JSON string
              const bodyData = typeof nycResult.body === 'string' ? JSON.parse(nycResult.body) : nycResult.body;
              
              // Check if we have items array
              if (bodyData.items && Array.isArray(bodyData.items)) {
                fetchedUnits = bodyData.items.map((item: any) => {
                  const monthlyRent = item.price ? Number(item.price) : 0;
                  // Mapping item: price=${item.price}, monthlyRent=${monthlyRent}
                  
                  return {
                    id: item.id || String(Math.random()),
                    name: item.name || 'Unknown Unit',
                    propertyName: item.address || 'Unknown Property',
                    unitType: item.unit_type || 'Unknown',
                    status: item.Stage || 'Available',
                    monthlyRent: monthlyRent,
                    amenities: item.description || item.short_description || '',
                    images: (item.subitems || []).map((subitem: any) => ({
                      id: subitem.id || String(Math.random()),
                      name: subitem.name || 'Media',
                      url: subitem.url || '',
                      text: 'Media'
                    }))
                  };
                });
              }
            } catch (parseError) {
              // Error parsing API response body
            }
          }
          
          // Fallback: check if result has items directly
          if (fetchedUnits.length === 0 && nycResult.items && Array.isArray(nycResult.items)) {
            fetchedUnits = nycResult.items.map((item: any) => {
              const monthlyRent = item.price ? Number(item.price) : 0;
              // Fallback mapping item: price=${item.price}, monthlyRent=${monthlyRent}
              
              return {
                id: item.id || String(Math.random()),
                name: item.name || 'Unknown Unit',
                propertyName: item.address || 'Unknown Property',
                unitType: item.unit_type || 'Unknown',
                status: item.Stage || 'Available',
                monthlyRent: monthlyRent,
                amenities: item.description || item.short_description || '',
                images: (item.subitems || []).map((subitem: any) => ({
                  id: subitem.id || String(Math.random()),
                  name: subitem.name || 'Media',
                  url: subitem.url || '',
                  text: 'Media'
                }))
              };
            });
          }
          
          // Processed units from NYC listings API
          setUnits(fetchedUnits);
        } else {
          // Fallback to Monday.com API if NYC API fails
          // NYC API failed, falling back to Monday.com API...
          const fetchedUnits = await MondayApiService.fetchVacantUnits();
          setUnits(fetchedUnits);
        }
      } catch (error) {
        // Failed to fetch unitsa
        // Final fallback to Monday.com API
        try {
          const fetchedUnits = await MondayApiService.fetchVacantUnits();
          setUnits(fetchedUnits);
        } catch (fallbackError) {
          // Fallback to Monday.com API also failed
        }
      } finally {
        setIsLoadingUnits(false);
      }
    };

    fetchUnits();
  }, []);

  // Restore building selection once units are loaded
  useEffect(() => {
    if (units.length > 0 && formData.application?.buildingAddress) {
              // Units loaded, restoring building selection
      // Use restoreBuildingSelection to preserve original apartment selection
      restoreBuildingSelection(
        formData.application.buildingAddress,
        formData.application.apartmentNumber,
        formData.application.apartmentType
      );
    }
  }, [units, formData.application?.buildingAddress, formData.application?.apartmentNumber, formData.application?.apartmentType]);











  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      // Application Info
      buildingAddress: "",
      apartmentNumber: "",
      moveInDate: undefined,
      monthlyRent: undefined,
      apartmentType: "",
      howDidYouHear: "",
      howDidYouHearOther: "",

      // Primary Applicant
      applicantName: "",
      applicantDob: undefined as any,
      applicantSsn: "",
      applicantPhone: "",
      applicantEmail: "",
      applicantLicense: "",
      applicantLicenseState: "",
      applicantAddress: "",
      applicantCity: "",
      applicantState: "",
      applicantZip: "",
      applicantLengthAtAddressYears: undefined,
      applicantLengthAtAddressMonths: undefined,
      applicantLandlordName: "",
      applicantLandlordAddressLine1: "",
      applicantLandlordAddressLine2: "",
      applicantLandlordCity: "",
      applicantLandlordState: "",
      applicantLandlordZipCode: "",
      applicantLandlordPhone: "",
      applicantLandlordEmail: "",
      applicantCurrentRent: undefined,
      applicantReasonForMoving: "",
      


      // Co-Applicants (Array of up to 4)
      coApplicants: [
        {
          name: '',
          relationship: '',
          dob: undefined as any,
          ssn: '',
          phone: '',
          email: '',
          license: '',
          licenseState: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          lengthAtAddressYears: undefined,
          lengthAtAddressMonths: undefined,
          landlordName: '',
          landlordAddressLine1: '',
          landlordAddressLine2: '',
          landlordCity: '',
          landlordState: '',
          landlordZipCode: '',
          landlordPhone: '',
          landlordEmail: '',
          currentRent: undefined,
          reasonForMoving: '',
          employmentType: '',
          employer: '',
          position: '',
          employmentStart: undefined,
          income: '',
          incomeFrequency: 'yearly',
          businessName: '',
          businessType: '',
          yearsInBusiness: '',
          otherIncome: '',
          otherIncomeFrequency: 'monthly',
          otherIncomeSource: '',
          bankRecords: []
        }
      ],

      // Guarantors (Array of up to 4)
      guarantors: [
        {
          name: '',
          relationship: '',
          dob: undefined as any,
          ssn: '',
          phone: '',
          email: '',
          license: '',
          licenseState: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          lengthAtAddressYears: undefined,
          lengthAtAddressMonths: undefined,
          landlordName: '',
          landlordAddressLine1: '',
          landlordAddressLine2: '',
          landlordCity: '',
          landlordState: '',
          landlordZipCode: '',
          landlordPhone: '',
          landlordEmail: '',
          currentRent: undefined,
          reasonForMoving: '',
          employmentType: '',
          employer: '',
          position: '',
          employmentStart: undefined,
          income: '',
          incomeFrequency: 'yearly',
          businessName: '',
          businessType: '',
          yearsInBusiness: '',
          otherIncome: '',
          otherIncomeFrequency: 'monthly',
          otherIncomeSource: '',
          bankRecords: []
        }
      ],

      // Legacy fields for backward compatibility
      coApplicantSsn: "",
      coApplicantPhone: "",
      coApplicantEmail: "",
      coApplicantLicense: "",
      coApplicantZip: "",
      coApplicantLandlordZipCode: "",
      coApplicantLandlordPhone: "",
      coApplicantLandlordEmail: "",

      // Legacy guarantor fields for backward compatibility
      guarantorSsn: "",
      guarantorPhone: "",
      guarantorEmail: "",
      guarantorLicense: "",
      guarantorZip: "",
      guarantorLandlordZipCode: "",
      guarantorLandlordPhone: "",
      guarantorLandlordEmail: "",

      // Conditional fields
      hasCoApplicant: false,
      hasGuarantor: false,
      coApplicantCount: 0,
      guarantorCount: 1,

      // Legal Questions
      landlordTenantLegalAction: "",
      brokenLease: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  // Sync checkbox states with form field values
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'hasCoApplicant') {
        // Form field hasCoApplicant changed
        setHasCoApplicant(value.hasCoApplicant || false);
      }
              if (name === 'hasGuarantor') {
          // Form field hasGuarantor changed
          setHasGuarantor(value.hasGuarantor || false);
        }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Helper: always prefer logged-in user's zoneinfo; fallbacks are last-resort
  const getCurrentUserZoneinfo = useCallback(() => {
    return user?.zoneinfo || user?.applicantId || user?.sub;
  }, [user?.zoneinfo, user?.applicantId, user?.sub]);

  // Helper function to check if co-applicant has meaningful data
  const hasCoApplicantData = useCallback((coApplicant: any) => {
    if (!coApplicant) return false;
    
    // Check for any meaningful co-applicant data
    const hasBasicInfo = !!(coApplicant.name || coApplicant.email || coApplicant.phone || coApplicant.ssn);
    const hasAddressInfo = !!(coApplicant.address || coApplicant.city || coApplicant.state || coApplicant.zip);
    const hasEmploymentInfo = !!(coApplicant.employmentType || coApplicant.employerName || coApplicant.employerPhone);
    const hasFinancialInfo = !!(coApplicant.monthlyIncome || coApplicant.bankRecords);
    const hasDocuments = !!(coApplicant.documents && Object.keys(coApplicant.documents).length > 0);
    
    return hasBasicInfo || hasAddressInfo || hasEmploymentInfo || hasFinancialInfo || hasDocuments;
  }, []);

  // Helper function to check if guarantor has meaningful data
  const hasGuarantorData = useCallback((guarantor: any) => {
    if (!guarantor) return false;
    
    // Check for any meaningful guarantor data
    const hasBasicInfo = !!(guarantor.name || guarantor.email || guarantor.phone || guarantor.ssn);
    const hasAddressInfo = !!(guarantor.address || guarantor.city || guarantor.state || guarantor.zip);
    const hasEmploymentInfo = !!(guarantor.employmentType || guarantor.employerName || guarantor.employerPhone);
    const hasFinancialInfo = !!(guarantor.monthlyIncome || guarantor.bankRecords);
    const hasDocuments = !!(guarantor.documents && Object.keys(guarantor.documents).length > 0);
    
    return hasBasicInfo || hasAddressInfo || hasEmploymentInfo || hasFinancialInfo || hasDocuments;
  }, []);

  // Ensure form data always uses current user's zoneinfo
  useEffect(() => {
    const currentUserZoneinfo = getCurrentUserZoneinfo();
    
    if (currentUserZoneinfo) {
      setFormData((prevData: any) => {
        // Only update if the values are different
        if (prevData.application_id !== currentUserZoneinfo || prevData.applicantId !== currentUserZoneinfo) {
          // useEffect: Forcing form data update to use current user zoneinfo
          return {
            ...prevData,
            application_id: currentUserZoneinfo,
            applicantId: currentUserZoneinfo
          };
        }
        return prevData;
      });
    }
  }, [getCurrentUserZoneinfo]);

  // Ensure guarantors array is always properly initialized
  useEffect(() => {
    setFormData((prevData: any) => {
      // Ensure guarantors array exists and has at least one item
      if (!prevData.guarantors || !Array.isArray(prevData.guarantors) || prevData.guarantors.length === 0) {
        return {
          ...prevData,
          guarantors: [
            {
              name: '',
              relationship: '',
              dob: undefined,
              ssn: '',
              phone: '',
              email: '',
              license: '',
              licenseState: '',
              address: '',
              city: '',
              state: '',
              zip: '',
              lengthAtAddressYears: undefined,
              lengthAtAddressMonths: undefined,
              landlordName: '',
              landlordAddressLine1: '',
              landlordAddressLine2: '',
              landlordCity: '',
              landlordState: '',
              landlordZipCode: '',
              landlordPhone: '',
              landlordEmail: '',
              currentRent: undefined,
              reasonForMoving: '',
              employmentType: '',
              employer: '',
              position: '',
              employmentStart: undefined,
              income: '',
              incomeFrequency: 'yearly',
              businessName: '',
              businessType: '',
              yearsInBusiness: '',
              otherIncome: '',
              otherIncomeFrequency: 'monthly',
              otherIncomeSource: '',
              bankRecords: []
            }
          ],
          guarantorCount: Math.max(1, prevData.guarantorCount || 1)
        };
      }
      return prevData;
    });
  }, []);

  // AUTO-POPULATION: Ensure form fields are synced with formData
  // Create a stable reference using JSON stringification to prevent infinite loops
  const coApplicantsSnapshot = useMemo(() => 
    JSON.stringify(formData.coApplicants || []), 
    [formData.coApplicants]
  );

  useEffect(() => {
    if (formData.coApplicants && Array.isArray(formData.coApplicants) && formData.coApplicants.length > 0) {
          console.log('🔧 AUTO-POPULATION: useEffect triggered - syncing form fields with formData');
          console.log('🔧 AUTO-POPULATION: formData.coApplicants:', formData.coApplicants);
          console.log('🔧 AUTO-POPULATION: Current specificIndex:', specificIndex);
          console.log('🔧 AUTO-POPULATION: User role:', user?.role);

          // Determine the target index for syncing
          let targetIndex = 0; // Default to index 0
          if (user?.role && user.role.startsWith('coapplicant') && /coapplicant\d+/.test(user.role)) {
            const match = user.role.match(/coapplicant(\d+)/);
            if (match) {
              targetIndex = parseInt(match[1], 10) - 1; // Convert to 0-based index
              console.log(`🔧 AUTO-POPULATION: Using specific index ${targetIndex} for role ${user.role}`);
            }
          } else if (specificIndex !== null && specificIndex !== undefined) {
            targetIndex = specificIndex;
            console.log(`🔧 AUTO-POPULATION: Using specificIndex ${targetIndex}`);
          }

          // Only sync the target co-applicant that has meaningful data
          const coApplicantToSync = formData.coApplicants[targetIndex];
          if (coApplicantToSync && Object.keys(coApplicantToSync).length > 0) {
            // Check if this co-applicant has meaningful data (not just otherIncomeFrequency)
            const hasMeaningfulData = coApplicantToSync.name || coApplicantToSync.email || coApplicantToSync.phone || coApplicantToSync.ssn || coApplicantToSync.address;

            if (hasMeaningfulData) {
              console.log(`🔧 AUTO-POPULATION: Syncing coApplicant[${targetIndex}] (has meaningful data):`, coApplicantToSync);

              // Sync all fields with form
              const fieldsToSync = [
                'name', 'relationship', 'ssn', 'phone', 'email', 'address', 'city', 'state', 'zip',
                'license', 'licenseState', 'employmentType', 'employer', 'employerName', 'employerPhone',
                'position', 'employerPosition', 'income', 'monthlyIncome', 'otherIncome', 'otherIncomeFrequency', 
                'otherIncomeSource', 'creditScore', 'landlordName', 'landlordAddressLine1', 'landlordAddressLine2', 
                'landlordCity', 'landlordState', 'landlordZipCode', 'landlordPhone', 'landlordEmail',
                'employmentStart', 'bankRecords', 'lengthAtAddressYears', 'lengthAtAddressMonths', 
                'currentRent', 'reasonForMoving'
              ];

              fieldsToSync.forEach(field => {
                // Special handling for different field types
                let shouldSync = false;
                let value = coApplicantToSync[field];
                
                if (field === 'bankRecords') {
                  // For bank records, check if it's an array with content
                  shouldSync = Array.isArray(value) && value.length > 0;
                } else if (field === 'employmentStart') {
                  // For employment start date, check if it exists
                  shouldSync = value !== undefined && value !== null;
                } else if (field === 'lengthAtAddressYears' || field === 'lengthAtAddressMonths' || field === 'currentRent') {
                  // For numeric fields, allow 0 values
                  shouldSync = value !== undefined && value !== null && value !== '';
                } else {
                  // For other fields, use the original validation
                  shouldSync = value !== undefined && value !== null && value !== '';
                }
                
                if (shouldSync) {
                  const formFieldName = `coApplicants.${targetIndex}.${field}`;
                  const currentFormValue = form.getValues(formFieldName as any);
                  
                  // Special comparison for different field types
                  let valuesMatch = false;
                  if (field === 'bankRecords') {
                    valuesMatch = JSON.stringify(currentFormValue) === JSON.stringify(value);
                  } else if (field === 'employmentStart') {
                    valuesMatch = currentFormValue && value && 
                      (currentFormValue instanceof Date && value instanceof Date && 
                       currentFormValue.getTime() === value.getTime());
                  } else {
                    valuesMatch = currentFormValue === value;
                  }
                  
                  if (!valuesMatch) {
                    console.log(`🔧 AUTO-POPULATION: Syncing ${formFieldName}: ${currentFormValue} -> ${value}`);
                    form.setValue(formFieldName as any, value);
                    
                    // Also update formData state for UI display
                    setFormData((prevData: any) => {
                      const updated = { ...prevData };
                      if (!updated.coApplicants) updated.coApplicants = [];
                      if (!updated.coApplicants[targetIndex]) updated.coApplicants[targetIndex] = {};
                      updated.coApplicants[targetIndex][field] = value;
                      return updated;
                    });
                  }
                } else {
                  console.log(`🔧 AUTO-POPULATION: Skipping sync for ${field} (value: ${value}, type: ${typeof value})`);
                }
              });

              // Handle field name mappings for FinancialSection compatibility
              const fieldMappings = [
                { from: 'employerName', to: 'employer' },
                { from: 'employerPosition', to: 'position' },
                { from: 'monthlyIncome', to: 'income' }
              ];

              fieldMappings.forEach(mapping => {
                if (coApplicantToSync[mapping.from] !== undefined && coApplicantToSync[mapping.from] !== null && coApplicantToSync[mapping.from] !== '') {
                  const formFieldName = `coApplicants.${targetIndex}.${mapping.to}`;
                  const currentFormValue = form.getValues(formFieldName as any);
                  if (currentFormValue !== coApplicantToSync[mapping.from]) {
                    console.log(`🔧 AUTO-POPULATION: Syncing mapped ${formFieldName}: ${currentFormValue} -> ${coApplicantToSync[mapping.from]}`);
                    form.setValue(formFieldName as any, coApplicantToSync[mapping.from]);
                    
                    // Also update formData state for UI display
                    setFormData((prevData: any) => {
                      const updated = { ...prevData };
                      if (!updated.coApplicants) updated.coApplicants = [];
                      if (!updated.coApplicants[targetIndex]) updated.coApplicants[targetIndex] = {};
                      updated.coApplicants[targetIndex][mapping.to] = coApplicantToSync[mapping.from];
                      return updated;
                    });
                  }
                }
              });

              // Handle date of birth
              if (coApplicantToSync.dob) {
                const dobValue = new Date(coApplicantToSync.dob);
                const formFieldName = `coApplicants.${targetIndex}.dob`;
                const currentFormValue = form.getValues(formFieldName as any);
                if (!currentFormValue || (currentFormValue instanceof Date && currentFormValue.getTime() !== dobValue.getTime())) {
                  console.log(`🔧 AUTO-POPULATION: Syncing ${formFieldName}: ${currentFormValue} -> ${dobValue}`);
                  form.setValue(formFieldName as any, dobValue);
                  
                  // Also update formData state for UI display
                  setFormData((prevData: any) => {
                    const updated = { ...prevData };
                    if (!updated.coApplicants) updated.coApplicants = [];
                    if (!updated.coApplicants[targetIndex]) updated.coApplicants[targetIndex] = {};
                    updated.coApplicants[targetIndex].dob = dobValue;
                    return updated;
                  });
                }
              }

              // Handle employment start date
              if (coApplicantToSync.employmentStart) {
                const employmentStartValue = new Date(coApplicantToSync.employmentStart);
                const formFieldName = `coApplicants.${targetIndex}.employmentStart`;
                const currentFormValue = form.getValues(formFieldName as any);
                if (!currentFormValue || (currentFormValue instanceof Date && currentFormValue.getTime() !== employmentStartValue.getTime())) {
                  console.log(`🔧 AUTO-POPULATION: Syncing ${formFieldName}: ${currentFormValue} -> ${employmentStartValue}`);
                  form.setValue(formFieldName as any, employmentStartValue);
                  
                  // Also update formData state for UI display
                  setFormData((prevData: any) => {
                    const updated = { ...prevData };
                    if (!updated.coApplicants) updated.coApplicants = [];
                    if (!updated.coApplicants[targetIndex]) updated.coApplicants[targetIndex] = {};
                    updated.coApplicants[targetIndex].employmentStart = employmentStartValue;
                    return updated;
                  });
                }
              }

              // Handle bank records (array field)
              if (coApplicantToSync.bankRecords && Array.isArray(coApplicantToSync.bankRecords) && coApplicantToSync.bankRecords.length > 0) {
                const formFieldName = `coApplicants.${targetIndex}.bankRecords`;
                const currentFormValue = form.getValues(formFieldName as any);
                if (!currentFormValue || JSON.stringify(currentFormValue) !== JSON.stringify(coApplicantToSync.bankRecords)) {
                  console.log(`🔧 AUTO-POPULATION: Syncing ${formFieldName}:`, coApplicantToSync.bankRecords);
                  form.setValue(formFieldName as any, coApplicantToSync.bankRecords);
                  
                  // Also update formData state for UI display
                  setFormData((prevData: any) => {
                    const updated = { ...prevData };
                    if (!updated.coApplicants) updated.coApplicants = [];
                    if (!updated.coApplicants[targetIndex]) updated.coApplicants[targetIndex] = {};
                    updated.coApplicants[targetIndex].bankRecords = coApplicantToSync.bankRecords;
                    return updated;
                  });
                }
              }
            } else {
              console.log(`🔧 AUTO-POPULATION: Skipping coApplicant[${targetIndex}] (no meaningful data):`, coApplicantToSync);
            }
          } else {
            console.log(`🔧 AUTO-POPULATION: No co-applicant data found at index ${targetIndex}`);
          }
        }
      }, [coApplicantsSnapshot, form, specificIndex, user?.role]);

  // AUTO-POPULATION: Ensure guarantor form fields are synced with formData
  // Create a stable reference using JSON stringification to prevent infinite loops
  const guarantorsSnapshot = useMemo(() => 
    JSON.stringify(formData.guarantors || []), 
    [formData.guarantors]
  );

  useEffect(() => {
    if ((isSyncingGuarantorRef as any)?.current) {
      console.log('🔧 AUTO-POPULATION: Skipping guarantor sync (already syncing)');
      return;
    }
    console.log('🔧 AUTO-POPULATION: useEffect triggered - checking guarantor form fields sync');
    console.log('🔧 AUTO-POPULATION: formData.guarantors exists:', !!formData.guarantors);
    console.log('🔧 AUTO-POPULATION: formData.guarantors is array:', Array.isArray(formData.guarantors));
    console.log('🔧 AUTO-POPULATION: formData.guarantors length:', formData.guarantors?.length);
    
    if (formData.guarantors && Array.isArray(formData.guarantors) && formData.guarantors.length > 0) {
      (isSyncingGuarantorRef as any).current = true;
      console.log('🔧 AUTO-POPULATION: useEffect triggered - syncing guarantor form fields with formData');
      console.log('🔧 AUTO-POPULATION: formData.guarantors:', formData.guarantors);
      console.log('🔧 AUTO-POPULATION: formData.guarantors[0]:', formData.guarantors[0]);
      console.log('🔧 AUTO-POPULATION: Current specificIndex:', specificIndex);
      console.log('🔧 AUTO-POPULATION: Effective userRole:', userRole);
      console.log('#### USEEFFECT GUARANTOR SYNC: formData.guarantors:', formData.guarantors);
      console.log('#### USEEFFECT GUARANTOR SYNC: formData.guarantors[0]:', formData.guarantors[0]);

      // Determine the target index for syncing
      let targetIndex = 0; // Default to index 0
      if (specificIndex !== null && specificIndex !== undefined) {
        targetIndex = specificIndex;
        console.log(`🔧 AUTO-POPULATION: Using specificIndex ${targetIndex}`);
      } else if (userRole && userRole.startsWith('guarantor') && /guarantor\d+/.test(userRole)) {
        const match = userRole.match(/guarantor(\d+)/);
        if (match) {
          targetIndex = parseInt(match[1], 10) - 1; // Convert to 0-based index
          console.log(`🔧 AUTO-POPULATION: Using role-derived index ${targetIndex} for role ${userRole}`);
        }
      }

      // Ensure we have a slot for the target index before syncing
      ensureGuarantorIndexExists(targetIndex);

      // Only sync the target guarantor that has meaningful data
      const guarantorToSync = formData.guarantors[targetIndex] || formData.guarantors[formData.guarantors.length - 1];
      if (guarantorToSync && Object.keys(guarantorToSync).length > 0) {
        // Check if this guarantor has meaningful data (not just otherIncomeFrequency)
        const hasMeaningfulData = guarantorToSync.name || guarantorToSync.email || guarantorToSync.phone || guarantorToSync.ssn || guarantorToSync.address || guarantorToSync.license || guarantorToSync.licenseState || guarantorToSync.relationship || guarantorToSync.state || guarantorToSync.zip;

        if (hasMeaningfulData) {
          console.log(`🔧 AUTO-POPULATION: Syncing guarantor[${targetIndex}] (has meaningful data):`, guarantorToSync);

          // Sync all fields with form
          const fieldsToSync = [
            'name', 'relationship', 'ssn', 'phone', 'email', 'address', 'city', 'state', 'zip',
            'license', 'licenseState', 'employmentType', 'employer', 'employerName', 'employerPhone',
            'position', 'employerPosition', 'income', 'monthlyIncome', 'otherIncome', 'otherIncomeFrequency', 
            'otherIncomeSource', 'creditScore', 'landlordName', 'landlordAddressLine1', 'landlordAddressLine2', 
            'landlordCity', 'landlordState', 'landlordZipCode', 'landlordPhone', 'landlordEmail',
            'employmentStart', 'bankRecords', 'lengthAtAddressYears', 'lengthAtAddressMonths', 
            'currentRent', 'reasonForMoving'
          ];

          fieldsToSync.forEach(field => {
            // Special handling for different field types
            let shouldSync = false;
            let value = guarantorToSync[field];
            
            if (field === 'bankRecords') {
              // For bank records, check if it's an array with content
              shouldSync = Array.isArray(value) && value.length > 0;
            } else if (field === 'employmentStart') {
              // For employment start date, check if it exists
              shouldSync = value !== undefined && value !== null;
            } else if (field === 'lengthAtAddressYears' || field === 'lengthAtAddressMonths' || field === 'currentRent') {
              // For numeric fields, allow 0 values
              shouldSync = value !== undefined && value !== null && value !== '';
            } else {
              // For other fields, allow any non-null/undefined values (including empty strings for some fields)
              shouldSync = value !== undefined && value !== null;
            }
            
            if (shouldSync) {
              const formFieldName = `guarantors.${targetIndex}.${field}`;
              const currentFormValue = form.getValues(formFieldName as any);
              
              // Special comparison for different field types
              let valuesMatch = false;
              if (field === 'bankRecords') {
                valuesMatch = JSON.stringify(currentFormValue) === JSON.stringify(value);
              } else if (field === 'employmentStart') {
                valuesMatch = currentFormValue && value && 
                  (currentFormValue instanceof Date && value instanceof Date && 
                   currentFormValue.getTime() === value.getTime());
              } else {
                valuesMatch = currentFormValue === value;
              }
              
              if (!valuesMatch) {
                console.log(`🔧 AUTO-POPULATION: Syncing ${formFieldName}: ${currentFormValue} -> ${value}`);
                form.setValue(formFieldName as any, value, { shouldValidate: false, shouldDirty: false });
              } else {
                console.log(`🔧 AUTO-POPULATION: Values already match for ${formFieldName}: ${currentFormValue}`);
              }
            } else {
              console.log(`🔧 AUTO-POPULATION: Skipping sync for ${field} (value: ${value}, type: ${typeof value})`);
            }
          });

          // Handle field name mappings for FinancialSection compatibility
          const fieldMappings = [
            { from: 'employerName', to: 'employer' },
            { from: 'employerPosition', to: 'position' },
            { from: 'monthlyIncome', to: 'income' }
          ];

          fieldMappings.forEach(mapping => {
            if (guarantorToSync[mapping.from] !== undefined && guarantorToSync[mapping.from] !== null && guarantorToSync[mapping.from] !== '') {
              const formFieldName = `guarantors.${targetIndex}.${mapping.to}`;
              const currentFormValue = form.getValues(formFieldName as any);
              if (currentFormValue !== guarantorToSync[mapping.from]) {
                console.log(`🔧 AUTO-POPULATION: Syncing mapped ${formFieldName}: ${currentFormValue} -> ${guarantorToSync[mapping.from]}`);
                form.setValue(formFieldName as any, guarantorToSync[mapping.from], { shouldValidate: false, shouldDirty: false });
              }
            }
          });

          // Handle date of birth
          if (guarantorToSync.dob) {
            const dobValue = new Date(guarantorToSync.dob);
            const formFieldName = `guarantors.${targetIndex}.dob`;
            const currentFormValue = form.getValues(formFieldName as any);
            
            // Compare dates properly - convert both to timestamps
            const currentTime = currentFormValue instanceof Date ? currentFormValue.getTime() : (currentFormValue ? new Date(currentFormValue).getTime() : null);
            const newTime = dobValue.getTime();
            
            if (!currentFormValue || currentTime !== newTime) {
              console.log(`🔧 AUTO-POPULATION: Syncing ${formFieldName}: ${currentFormValue} -> ${dobValue}`);
              form.setValue(formFieldName as any, dobValue, { shouldValidate: false, shouldDirty: false });
            }
          }

          // Handle employment start date
          if (guarantorToSync.employmentStart) {
            const employmentStartValue = new Date(guarantorToSync.employmentStart);
            const formFieldName = `guarantors.${targetIndex}.employmentStart`;
            const currentFormValue = form.getValues(formFieldName as any);
            
            // Compare dates properly - convert both to timestamps
            const currentTime = currentFormValue instanceof Date ? currentFormValue.getTime() : (currentFormValue ? new Date(currentFormValue).getTime() : null);
            const newTime = employmentStartValue.getTime();
            
            if (!currentFormValue || currentTime !== newTime) {
              console.log(`🔧 AUTO-POPULATION: Syncing ${formFieldName}: ${currentFormValue} -> ${employmentStartValue}`);
              form.setValue(formFieldName as any, employmentStartValue, { shouldValidate: false, shouldDirty: false });
            }
          }

          // Handle bank records (array field)
          if (guarantorToSync.bankRecords && Array.isArray(guarantorToSync.bankRecords) && guarantorToSync.bankRecords.length > 0) {
            const formFieldName = `guarantors.${targetIndex}.bankRecords`;
            const currentFormValue = form.getValues(formFieldName as any);
            if (!currentFormValue || JSON.stringify(currentFormValue) !== JSON.stringify(guarantorToSync.bankRecords)) {
              console.log(`🔧 AUTO-POPULATION: Syncing ${formFieldName}:`, guarantorToSync.bankRecords);
              form.setValue(formFieldName as any, guarantorToSync.bankRecords, { shouldValidate: false, shouldDirty: false });
            }
          }
        } else {
          console.log(`🔧 AUTO-POPULATION: Skipping guarantor[${targetIndex}] (no meaningful data):`, guarantorToSync);
        }
      } else {
        console.log(`🔧 AUTO-POPULATION: No guarantor data found at index ${targetIndex}`);
      }
      // Clear syncing flag synchronously to avoid re-entrancy loops
      (isSyncingGuarantorRef as any).current = false;
    }
  }, [guarantorsSnapshot, form, specificIndex, userRole]);

  // Handle webhook responses from formData when it changes
  useEffect(() => {
    if (formData.webhookSummary?.webhookResponses) {
      // Merge webhookSummary.webhookResponses into the main formData.webhookResponses
      const mergedWebhookResponses = {
        ...formData.webhookResponses,
        ...formData.webhookSummary.webhookResponses
      };
      
      // Only update when changed to avoid loops
      const prevString = JSON.stringify(formData.webhookResponses || {});
      const nextString = JSON.stringify(mergedWebhookResponses || {});
      if (prevString !== nextString) {
        // Update formData with merged webhook responses
        setFormData((prevData: any) => ({
          ...prevData,
          webhookResponses: mergedWebhookResponses
        }));
        
        // Update webhook responses state
        setWebhookResponses(mergedWebhookResponses);
        // console.log('🔗 Merged webhook responses from webhookSummary in useEffect:', mergedWebhookResponses);
        // console.log('######### prev document (merged):', mergedWebhookResponses);
        // console.log('######### webhookSummary.webhookResponses (source):', formData.webhookSummary?.webhookResponses);
      }
      
      // Auto-map webhook responses to form fields
      const webhookResponses = formData.webhookSummary.webhookResponses;
      if (webhookResponses && typeof webhookResponses === 'object') {
        console.log('🔄 Auto-mapping webhook responses to form fields...');
        
        // Process each webhook response
        Object.entries(webhookResponses).forEach(([key, value]) => {
          if (typeof value === 'string' && value.startsWith('http')) {
            console.log(`📎 Mapping webhook response: ${key} -> ${value}`);
            
            // Map to appropriate form field based on key pattern
            if (key.includes('coApplicants_') && key.includes('_photo_id')) {
              // This is a co-applicant photo ID document
              const coApplicantIndex = key.match(/coApplicants_(\d+)_/)?.[1];
              if (coApplicantIndex !== undefined) {
                const index = parseInt(coApplicantIndex);
                setFormData((prevData: any) => {
                  const updated = { ...prevData };
                  if (!updated.coApplicants) updated.coApplicants = [];
                  if (!updated.coApplicants[index]) updated.coApplicants[index] = {};
                  
                  // Map to the appropriate field in co-applicant data
                  updated.coApplicants[index].photoIdUrl = value;
                  
                  console.log(`✅ Mapped co-applicant ${index} photo ID URL:`, value);
                  return updated;
                });
              }
            } else if (key.includes('applicant_') && key.includes('_photo_id')) {
              // This is an applicant photo ID document
              setFormData((prevData: any) => {
                const updated = { ...prevData };
                if (!updated.applicant) updated.applicant = {};
                updated.applicant.photoIdUrl = value;
                
                console.log(`✅ Mapped applicant photo ID URL:`, value);
                return updated;
              });
            } else if (key.includes('guarantor_') && key.includes('_photo_id')) {
              // This is a guarantor photo ID document
              const guarantorIndex = key.match(/guarantor_(\d+)_/)?.[1];
              if (guarantorIndex !== undefined) {
                const index = parseInt(guarantorIndex);
                setFormData((prevData: any) => {
                  const updated = { ...prevData };
                  if (!updated.guarantors) updated.guarantors = [];
                  if (!updated.guarantors[index]) updated.guarantors[index] = {};
                  
                  // Map to the appropriate field in guarantor data
                  updated.guarantors[index].photoIdUrl = value;
                  
                  console.log(`✅ Mapped guarantor ${index} photo ID URL:`, value);
                  return updated;
                });
              }
            }
          }
        });
      }
    }
  }, [formData.webhookSummary?.webhookResponses]);

  // When webhookResponses contains direct file URLs, seed preview slots and map URLs
  useEffect(() => {
    // Normalize any composite guarantor save-type keys to the new format
    const normalizeWebhookSaveTypeKey = (key: string): string => {
      // Example: guarantors_0_guarantors_1_pay_stubs_2 -> guarantors_userrole_pay_stubs_2
      const match = key.match(/^guarantors_\d+_guarantors_\d+_(.+)$/);
      if (match) {
        return `guarantors_userrole_${match[1]}`;
      }
      return key;
    };

    if (webhookResponses && Object.keys(webhookResponses).length > 0) {
      const normalizedEntries = Object.entries(webhookResponses).map(([k, v]) => [normalizeWebhookSaveTypeKey(k), v] as const);
      const normalized = Object.fromEntries(normalizedEntries as any);
      const changed = JSON.stringify(normalized) !== JSON.stringify(webhookResponses);
      if (changed) {
        setWebhookResponses(normalized);
        setFormData((prev: any) => ({ ...prev, webhookResponses: normalized }));
        return; // Wait for state to update before proceeding with seeding below
      }
    }

    if (!webhookResponses || Object.keys(webhookResponses).length === 0) return;

    const ensureEncryptedSlot = (personKey: string, documentType: string) => {
      setEncryptedDocuments((prev: any) => {
        const updated = { ...(prev || {}) };
        if (!updated[personKey]) updated[personKey] = {};
        if (!Array.isArray(updated[personKey][documentType])) {
          updated[personKey][documentType] = [{}];
        }
        return updated;
      });
    };

    const getFileName = (url: string) => {
      try {
        const u = new URL(url);
        const last = u.pathname.split('/').pop() || '';
        return decodeURIComponent(last);
      } catch { return url.split('/').pop() || 'document'; }
    };

    Object.entries(webhookResponses).forEach(([key, value]) => {
      if (typeof value !== 'string') return;
      const url = value as string;
      if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('s3://'))) return;

      // Parse keys like: coApplicants_0_photo_id, guarantors_1_paystub, applicant_photo_id
      const parts = key.split('_');
      let personKey = '';
      let documentType = '';

      if ((key.startsWith('coApplicants_') || key.startsWith('guarantors_')) && parts.length >= 3) {
        personKey = `${parts[0]}_${parts[1]}`; // e.g., coApplicants_0
        documentType = parts.slice(2).join('_');
      } else if (key.startsWith('applicant_') || key.startsWith('guarantor_') || key.startsWith('coApplicant_')) {
        const [p, ...rest] = parts;
        personKey = p; // applicant / guarantor / coApplicant (singular)
        documentType = rest.join('_');
      } else if (key.startsWith('occupants_') && parts.length >= 2) {
        personKey = 'occupants';
        documentType = parts.slice(1).join('_');
      } else {
        // Fallback: treat entire key as document type for applicant
        personKey = 'applicant';
        documentType = key;
      }

      ensureEncryptedSlot(personKey, documentType);
      const fileName = getFileName(url);
      handleWebhookFileUrl(personKey, documentType, url, fileName);
    });
  }, [webhookResponses]);
  // Check if any draft data exists
  const checkForExistingDraft = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 Checking for existing draft data...');
      const allData = await dynamoDBSeparateTablesUtils.getAllUserData();
      
      // Check if any draft data exists in any table
      const hasDraft = !!(
        (allData.application && allData.application.status === 'draft') ||
        (allData.applicant && allData.applicant.status === 'draft') ||
        (allData.coApplicant && allData.coApplicant.status === 'draft') ||
        (allData.guarantor && allData.guarantor.status === 'draft')
      );
      
      console.log('🔍 Draft check result:', hasDraft);
      return hasDraft;
    } catch (error) {
      console.error('❌ Error checking for existing draft:', error);
      return false;
    }
  }, []);
  // Load draft data from separate DynamoDB tables
  const hasRestoredFromDraftRef = useRef(false);
  const loadDraftData = useCallback(async (applicationId: string, restoreStep: boolean = true) => {
    if (hasRestoredFromDraftRef.current) {
      console.log('⏭️ Draft restoration already performed; skipping duplicate load');
      return;
    }
    try {
      console.log('🔄 Loading draft data from separate tables for application ID:', applicationId);
      
      // Load data from all separate tables
      let allData = await dynamoDBSeparateTablesUtils.getAllUserData();
      console.log('🔍 All data structure:', allData, userRole);
      console.log('🔍 Applicant webhookSummary:', allData.applicant?.webhookSummary);
      console.log('🔍 CoApplicant webhookSummary:', allData.coApplicant?.webhookSummary);
      console.log('🔍 Guarantor webhookSummary:', allData.guarantor?.webhookSummary);
      console.log('🔍 DEBUG: allData.coApplicant structure:', allData.coApplicant);
      console.log('🔍 DEBUG: allData.coApplicant.coapplicant_info:', allData.coApplicant?.coapplicant_info);
      
      // If we have a specific application ID, try to load data for that specific application
      if (applicationId && applicationId !== user?.applicantId) {
        console.log('🔍 Loading data for specific application ID:', applicationId);
        try {
          const specificApplication = await dynamoDBSeparateTablesUtils.getApplicationByAppId(applicationId);
          if (specificApplication) {
            console.log('📊 Found specific application data:', specificApplication);
            // Override the application data with the specific one
            allData.application = specificApplication;
          }
        } catch (error) {
          console.warn('⚠️ Failed to load specific application data, using current user data:', error);
        }
      }
      
      if (allData.application || allData.applicant || allData.coApplicant || allData.guarantor) {
        console.log('📊 Draft data loaded from separate tables');
        setHasExistingDraft(true);
        
        // Get co-applicants and guarantors
        let coApplicantsArray: any[] = [];
        let guarantorsArray: any[] = [];
        
        // Prioritize allData.coApplicant.coapplicant_info for auto-population
        if (allData.coApplicant && allData.coApplicant.coapplicant_info) {
          console.log('📊 Using allData.coApplicant.coapplicant_info for auto-population');
          coApplicantsArray = [normalizeCoApplicantInfo(allData.coApplicant.coapplicant_info)];
          console.log('🔍 DEBUG: coApplicantsArray after allData.coApplicant:', coApplicantsArray);
        } else if (allData.applicant) {
          coApplicantsArray = allData.applicant.co_applicants || [];
          guarantorsArray = allData.applicant.guarantors || [];
          console.log('🔍 DEBUG: coApplicantsArray after allData.applicant:', coApplicantsArray);
        }

        // If appId is available, augment from separate tables to ensure full array data
        try {
          const appIdToUse = allData.application?.appid;
          if (appIdToUse) {
            console.log('🔍 Loading co-applicants and guarantors for appId:', appIdToUse);
            const [coAppsByAppId, guarantorsByAppId] = await Promise.all([
              dynamoDBSeparateTablesUtils.getCoApplicantsByAppId(appIdToUse),
              dynamoDBSeparateTablesUtils.getGuarantorsByAppId(appIdToUse)
            ]);
            console.log('📊 Loaded co-applicants:', coAppsByAppId);
            console.log('📊 Loaded guarantors:', guarantorsByAppId);
            
            if (Array.isArray(coAppsByAppId) && coAppsByAppId.length > 0) {
              // Only use separate table data if we don't already have allData.coApplicant data
              if (!allData.coApplicant || !allData.coApplicant.coapplicant_info) {
              // Normalize to plain co-applicant_info objects with field name normalization
              coApplicantsArray = coAppsByAppId.map((c: any) => {
                const coInfo = c?.coapplicant_info || c || {};
                  return normalizeCoApplicantInfo(coInfo);
                });
                console.log('📊 Normalized co-applicants array from separate tables:', coApplicantsArray);
              } else {
                console.log('📊 Skipping separate table co-applicants data - using allData.coApplicant instead');
              }
            }
            if (Array.isArray(guarantorsByAppId) && guarantorsByAppId.length > 0) {
              // Only use separate table data if we don't already have allData.guarantor data
              if (!allData.guarantor || !allData.guarantor.guarantor_info) {
              // Normalize to plain guarantor_info objects with field name normalization
              guarantorsArray = guarantorsByAppId.map((g: any) => {
                const guarantorInfo = g?.guarantor_info || g || {};
                console.log('🔍 GUARANTOR_INFO DEBUG: Raw guarantor_info from guarantorsByAppId:', guarantorInfo);
                
                // Normalize field names from database to form field names
                const normalizedGuarantorInfo = normalizeGuarantorInfo(guarantorInfo);
                
                console.log('🔍 GUARANTOR_INFO DEBUG: Normalized guarantor_info from guarantorsByAppId:', normalizedGuarantorInfo);
                return normalizedGuarantorInfo;
              });
                console.log('📊 Normalized guarantors array from separate tables:', guarantorsArray);
              } else {
                console.log('📊 Skipping separate table guarantors data - using allData.guarantor instead');
              }
            }
          }
        } catch (e) {
          console.warn('⚠️ Failed to augment co-applicants/guarantors by appid', e);
        }

        // Reconstruct the form data from separate table data
        let parsedFormData: any = {
          application: {},
          applicant: {},
          coApplicant: {},
          guarantor: {}
        };
        if (user && user.role && user.role.startsWith('coapplicant')) {
          console.log('🔄 Processing Co-Applicant role data mapping...');
          console.log('🔍 Current specificIndex:', specificIndex);
console.log("#### alldata", allData);

          // Prefer Co-Applicants table data for co-applicant role
        if (allData.coApplicant && allData.coApplicant.coapplicant_info) {
            console.log('📊 Using coapplicant_info from Co-Applicants table for Co-Applicant role');
            // Only set coApplicantsArray if it's not already populated from the earlier logic
            if (coApplicantsArray.length === 0) {
          coApplicantsArray = [normalizeCoApplicantInfo(allData.coApplicant.coapplicant_info)];
            }
          // Also load webhookSummary from co-applicant data
          if (allData.coApplicant.webhookSummary) {
            parsedFormData.webhookSummary = allData.coApplicant.webhookSummary;
            console.log('🔍 Loaded webhookSummary from co-applicant data:', parsedFormData.webhookSummary);
          }
        }
          // Check if data exists in coApplicantsArray from previous loading
          else if (coApplicantsArray.length > 0) {
            console.log('📊 Using existing coApplicantsArray for Co-Applicant role');
            // coApplicantsArray already populated from previous logic
          }
          
          // Handle specific index for coapplicant1, coapplicant2, etc.
          if (specificIndex !== null && specificIndex !== undefined && coApplicantsArray.length > 0) {
            console.log(`📊 Mapping data for specific Co-Applicant index: ${specificIndex}`);
            // Ensure the array has enough elements for the specific index
            while (coApplicantsArray.length <= specificIndex) {
              coApplicantsArray.push({});
            }
            // If we have data, put it at the specific index
            if (coApplicantsArray[0] && Object.keys(coApplicantsArray[0]).length > 0) {
              coApplicantsArray[specificIndex] = coApplicantsArray[0];
              if (specificIndex > 0) {
                coApplicantsArray[0] = {}; // Clear the first element if we moved it
              }
            }
          }
          
          // For Co-Applicant role, also clear the applicant data to avoid confusion
          // since the data should be in coApplicants array, not applicant object
          if (parsedFormData.applicant) {
            console.log('🧹 Clearing applicant data for Co-Applicant role to avoid confusion');
            parsedFormData.applicant = {};
          }
        }
        
        // Handle guarantor role data loading
        if (user && user.role && user.role.startsWith('guarantor')) {
          console.log('🔄 Processing Guarantor role data mapping...');
          console.log('🔍 Current specificIndex:', specificIndex);
          
          // Determine specific index from user role if not already set
          let currentSpecificIndex = specificIndex;
          if (currentSpecificIndex === null && user.role && /guarantor\d+/.test(user.role)) {
            const match = user.role.match(/guarantor(\d+)/);
            if (match) {
              currentSpecificIndex = parseInt(match[1], 10) - 1; // Convert to 0-based index
              console.log('🔍 GUARANTOR ROLE DEBUG: Detected specific guarantor index from user role:', currentSpecificIndex);
            }
          }

          // Check if data was saved in Guarantors_nyc table
          if (allData.guarantor && allData.guarantor.guarantor_info) {
            console.log('📊 Using guarantor_info from Guarantors_nyc table for Guarantor role');
            console.log('🔍 GUARANTOR_INFO DEBUG: Raw guarantor_info data:', allData.guarantor.guarantor_info);
            
            // Normalize guarantor_info field names to match form schema
            const normalizedGuarantorInfo = normalizeGuarantorInfo(allData.guarantor.guarantor_info);
            
            console.log('🔍 GUARANTOR_INFO DEBUG: Normalized guarantor_info data:', normalizedGuarantorInfo);
            
            // Check if the normalized data has meaningful content (not just empty strings)
            const hasMeaningfulData = normalizedGuarantorInfo.name || normalizedGuarantorInfo.email || normalizedGuarantorInfo.phone || normalizedGuarantorInfo.ssn || normalizedGuarantorInfo.address || normalizedGuarantorInfo.license || normalizedGuarantorInfo.relationship;
            
            if (hasMeaningfulData) {
              console.log('📊 Using allData.guarantor data - has meaningful content');
            guarantorsArray = [normalizedGuarantorInfo];
              console.log('📊 Set guarantorsArray to allData.guarantor data:', guarantorsArray);
            } else {
              console.log('📊 allData.guarantor data is empty - will use separate table data if available');
              // Don't override guarantorsArray if allData.guarantor is empty
            }
            
            // Also load webhookSummary from guarantor data
            if (allData.guarantor.webhookSummary) {
              parsedFormData.webhookSummary = allData.guarantor.webhookSummary;
              console.log('🔍 Loaded webhookSummary from guarantor data:', parsedFormData.webhookSummary);
            }
          }
          // Check if data exists in guarantorsArray from previous loading
          else if (guarantorsArray.length > 0) {
            console.log('📊 Using existing guarantorsArray for Guarantor role');
            // guarantorsArray already populated from previous logic
          }
          
          // Handle specific index for guarantor1, guarantor2, etc.
          if (currentSpecificIndex !== null && currentSpecificIndex !== undefined && guarantorsArray.length > 0) {
            console.log(`📊 Mapping data for specific Guarantor index: ${currentSpecificIndex}`);
            // Ensure the array has enough elements for the specific index
            while (guarantorsArray.length <= currentSpecificIndex) {
              guarantorsArray.push({});
            }
            // If we have data, put it at the specific index
            if (guarantorsArray[0] && Object.keys(guarantorsArray[0]).length > 0) {
              guarantorsArray[currentSpecificIndex] = guarantorsArray[0];
              if (currentSpecificIndex > 0) {
                guarantorsArray[0] = {}; // Clear the first element if we moved it
              }
            }
          }
          
          // For Guarantor role, also clear the applicant data to avoid confusion
          // since the data should be in guarantors array, not applicant object
          if (parsedFormData.applicant) {
            console.log('🧹 Clearing applicant data for Guarantor role to avoid confusion');
            parsedFormData.applicant = {};
          }
        }
        
        // Restore application data
        if (allData.application) {
          parsedFormData.application = allData.application.application_info || {};
          // Normalize application field names from legacy/alternate keys
          const app = parsedFormData.application as any;
          app.buildingAddress = app.buildingAddress || app.building_address || app.address || '';
          app.apartmentNumber = app.apartmentNumber || app.unitNumber || app.apartment || app.unit || '';
          app.apartmentType = app.apartmentType || app.apartment_type || app.unitType || app.unit_type || '';
          if (typeof app.monthlyRent === 'undefined') {
            app.monthlyRent = typeof app.rent !== 'undefined' ? app.rent : app.monthly_rent;
          }
          if (app.move_in_date && !app.moveInDate) app.moveInDate = app.move_in_date;
          parsedFormData.current_step = allData.application.current_step;
          parsedFormData.status = allData.application.status;
          parsedFormData.uploaded_files_metadata = allData.application.uploaded_files_metadata || {};
          parsedFormData.webhook_responses = allData.application.webhook_responses || {};
          parsedFormData.signatures = allData.application.signatures || {};
          parsedFormData.encrypted_documents = allData.application.encrypted_documents || {};
        }
        
        // Restore applicant data (prefer matching applicant_nyc by appid if available)
        let selectedApplicantInfo: any = {};
        let selectedApplicantOccupants: any[] = [];
        let selectedApplicantSignature: any = {};
        try {
          const appid = allData.application?.appid;
          if (appid) {
            const matchedApplicant = await dynamoDBSeparateTablesUtils.getApplicantByAppId(appid);
            if (matchedApplicant) {
              selectedApplicantInfo = matchedApplicant.applicant_info || {};
              selectedApplicantOccupants = matchedApplicant.occupants || [];
              selectedApplicantSignature = matchedApplicant.signature || {};
            }
          }
        } catch {}
        if (Object.keys(selectedApplicantInfo).length === 0 && allData.applicant) {
          selectedApplicantInfo = allData.applicant.applicant_info || {};
          selectedApplicantOccupants = allData.applicant.occupants || [];
          selectedApplicantSignature = allData.applicant.signature || {};
        }
        if (selectedApplicantInfo) {
          parsedFormData.applicant = selectedApplicantInfo;
          // Normalize applicant field names from legacy/alternate keys
          const ap = parsedFormData.applicant as any;
          ap.name = ap.name || ap.fullName || ap.full_name || '';
          ap.email = ap.email || ap.mail || '';
          ap.phone = ap.phone || ap.phoneNumber || ap.phone_number || '';
          ap.address = ap.address || ap.addressLine1 || ap.address1 || ap.street || '';
          ap.city = ap.city || ap.town || '';
          ap.state = ap.state || ap.region || '';
          ap.zip = ap.zip || ap.zipCode || ap.postalCode || ap.postal_code || '';
          if (ap.date_of_birth && !ap.dob) ap.dob = ap.date_of_birth;
          // Normalize employment type (applicant_nyc variants)
          ap.employmentType = ap.employmentType || ap.employment_type || ap.employment || ap.applicant_employmentType || '';
          // Normalize landlord fields
          ap.landlordName = ap.landlordName || ap.landlord_name || '';
          ap.landlordAddressLine1 = ap.landlordAddressLine1 || ap.landlord_address_line1 || ap.landlord_address || '';
          ap.landlordAddressLine2 = ap.landlordAddressLine2 || ap.landlord_address_line2 || '';
          ap.landlordCity = ap.landlordCity || ap.landlord_city || '';
          ap.landlordState = ap.landlordState || ap.landlord_state || '';
          ap.landlordZipCode = ap.landlordZipCode || ap.landlord_zip || ap.landlord_zip_code || '';
          ap.landlordPhone = ap.landlordPhone || ap.landlord_phone || '';
          ap.landlordEmail = ap.landlordEmail || ap.landlord_email || '';
          parsedFormData.occupants = selectedApplicantOccupants || [];
          // Load webhookSummary from any available source (applicant, coApplicant, guarantor)
          parsedFormData.webhookSummary = allData.applicant?.webhookSummary || 
                                        allData.coApplicant?.webhookSummary || 
                                        allData.guarantor?.webhookSummary || 
                                        parsedFormData.webhookSummary || {};
          console.log('🔍 Loaded webhookSummary from data sources:', {
            applicant: allData.applicant?.webhookSummary,
            coApplicant: allData.coApplicant?.webhookSummary,
            guarantor: allData.guarantor?.webhookSummary,
            final: parsedFormData.webhookSummary
          });
          parsedFormData.signatures = {
            ...parsedFormData.signatures,
            applicant: selectedApplicantSignature || {}
          };
        }
        
        // If no co-applicants/guarantors found on applicant_nyc, try separate tables by appid
        try {
          const currentAppId = allData.application?.appid;
          if ((!coApplicantsArray || coApplicantsArray.length === 0) && currentAppId && (!allData.coApplicant || !allData.coApplicant.coapplicant_info)) {
            const coApps = await dynamoDBSeparateTablesUtils.getCoApplicantsByAppId(currentAppId);
            if (coApps && coApps.length > 0) {
              coApplicantsArray = coApps.map((c: any) => normalizeCoApplicantInfo(c.coapplicant_info || {}));
            }
          }
          if ((!guarantorsArray || guarantorsArray.length === 0) && currentAppId) {
            const gs = await dynamoDBSeparateTablesUtils.getGuarantorsByAppId(currentAppId);
            if (gs && gs.length > 0) {
              guarantorsArray = gs.map((g: any) => {
                const guarantorInfo = g.guarantor_info || {};
                console.log('🔍 GUARANTOR_INFO DEBUG: Raw guarantor_info from getGuarantorsByAppId:', guarantorInfo);
                
                // Normalize field names from database to form field names
                const normalizedGuarantorInfo = normalizeGuarantorInfo(guarantorInfo);
                
                console.log('🔍 GUARANTOR_INFO DEBUG: Normalized guarantor_info from getGuarantorsByAppId:', normalizedGuarantorInfo);
                return normalizedGuarantorInfo;
              });
            }
          }
        } catch {}

        // Ensure all required sections exist first
        parsedFormData.application = parsedFormData.application || {};
        parsedFormData.applicant = parsedFormData.applicant || {};
        parsedFormData.coApplicant = parsedFormData.coApplicant || {};
        parsedFormData.guarantor = parsedFormData.guarantor || {};
        parsedFormData.occupants = parsedFormData.occupants || [];
        
        // Restore co-applicant data into form structure - CONSOLIDATED LOGIC
        console.log('🔍 DEBUG: About to process coApplicantsArray, length:', coApplicantsArray.length);
        console.log('🔍 DEBUG: coApplicantsArray content:', coApplicantsArray);
        if (coApplicantsArray.length > 0) {
          // Use data from coApplicantsArray (from separate tables)
          // Use ALL co-applicants from coApplicantsArray, not just the first one
          if (coApplicantsArray.length > 0) {
            console.log('🔧 AUTO-POPULATION: Using ALL co-applicants from coApplicantsArray');
            parsedFormData.coApplicants = coApplicantsArray; // ✅ Use ALL co-applicants
            parsedFormData.coApplicant = coApplicantsArray[0] || {};
            parsedFormData.coApplicantCount = coApplicantsArray.length; // ✅ Set count to actual length
            console.log(`🔧 AUTO-POPULATION: Set coApplicantCount to ${coApplicantsArray.length} for ${coApplicantsArray.length} co-applicants`);
          } else {
            console.log('🔧 AUTO-POPULATION: No co-applicants in coApplicantsArray');
            parsedFormData.coApplicants = [];
            parsedFormData.coApplicant = {};
            parsedFormData.coApplicantCount = 0;
          }
          console.log('📊 Using coApplicantsArray for co-applicant data:', parsedFormData.coApplicants.length, 'items');
          console.log('🔍 DEBUG: parsedFormData.coApplicants set to:', parsedFormData.coApplicants);
          console.log('🔍 DEBUG: parsedFormData.coApplicant set to:', parsedFormData.coApplicant);
          // Ensure checkbox/counts align so Co-Applicant steps render
          if (!parsedFormData.hasCoApplicant) parsedFormData.hasCoApplicant = true;
        } else if (parsedFormData.coApplicant && Object.keys(parsedFormData.coApplicant).length > 0) {
          // If no coApplicantsArray but we have coApplicant data, map it to coApplicants array
          console.log('📊 Mapping singular coApplicant data to coApplicants array');
          parsedFormData.coApplicants = [normalizeCoApplicantInfo(parsedFormData.coApplicant)];
          if (!parsedFormData.hasCoApplicant) parsedFormData.hasCoApplicant = true;
          parsedFormData.coApplicantCount = Math.max(parsedFormData.coApplicantCount || 0, 1);
        } else {
          // Ensure coApplicants array exists even if empty
          parsedFormData.coApplicants = [];
        }
        
        // Restore guarantor data into form structure - CONSOLIDATED LOGIC WITH DEBUG
        console.log('🔍 GUARANTOR DATA MAPPING DEBUG: Starting guarantor data mapping...');
        console.log('🔍 GUARANTOR DATA MAPPING DEBUG: guarantorsArray.length:', guarantorsArray.length);
        console.log('🔍 GUARANTOR DATA MAPPING DEBUG: guarantorsArray:', guarantorsArray);
        console.log('🔍 GUARANTOR DATA MAPPING DEBUG: parsedFormData.guarantor:', parsedFormData.guarantor);
        console.log('🔍 GUARANTOR DATA MAPPING DEBUG: parsedFormData.guarantor keys:', parsedFormData.guarantor ? Object.keys(parsedFormData.guarantor) : []);
        
        if (guarantorsArray.length > 0) {
          // Use data from guarantorsArray (from separate tables)
          // If we have data from allData.guarantor, check if it has meaningful content
          if (allData.guarantor && allData.guarantor.guarantor_info) {
            const normalizedGuarantorInfo = normalizeGuarantorInfo(allData.guarantor.guarantor_info);
            const hasMeaningfulData = normalizedGuarantorInfo.name || normalizedGuarantorInfo.email || normalizedGuarantorInfo.phone || normalizedGuarantorInfo.ssn || normalizedGuarantorInfo.address || normalizedGuarantorInfo.license || normalizedGuarantorInfo.relationship;
            
            if (hasMeaningfulData) {
              console.log('🔧 AUTO-POPULATION: Using allData.guarantor data - has meaningful content');
              parsedFormData.guarantors = [normalizedGuarantorInfo]; // Use the normalized allData.guarantor data
              parsedFormData.guarantor = normalizedGuarantorInfo;
              parsedFormData.guarantorCount = 1; // Set count to 1
              console.log('🔧 AUTO-POPULATION: Set parsedFormData.guarantors to allData.guarantor data:', parsedFormData.guarantors);
              console.log('#### GUARANTOR DATA PRIORITIZATION: Using allData.guarantor - normalizedGuarantorInfo:', normalizedGuarantorInfo);
            } else {
              console.log('🔧 AUTO-POPULATION: allData.guarantor data is empty - using separate table data');
          parsedFormData.guarantors = guarantorsArray;
          parsedFormData.guarantor = guarantorsArray[0] || {};
              parsedFormData.guarantorCount = Math.max(parsedFormData.guarantorCount || 0, guarantorsArray.length);
              console.log('#### GUARANTOR DATA PRIORITIZATION: Using separate table data - guarantorsArray:', guarantorsArray);
            }
          } else {
            parsedFormData.guarantors = guarantorsArray;
            parsedFormData.guarantor = guarantorsArray[0] || {};
            parsedFormData.guarantorCount = Math.max(parsedFormData.guarantorCount || 0, guarantorsArray.length);
          }
          console.log('📊 GUARANTOR DATA MAPPING DEBUG: Using guarantorsArray for guarantor data:', guarantorsArray.length, 'items');
          console.log('📊 GUARANTOR DATA MAPPING DEBUG: Set parsedFormData.guarantors to:', parsedFormData.guarantors);
        } else if (parsedFormData.guarantor && Object.keys(parsedFormData.guarantor).length > 0) {
          // If no guarantorsArray but we have guarantor data, map it to guarantors array
          console.log('📊 GUARANTOR DATA MAPPING DEBUG: Mapping singular guarantor data to guarantors array');
          parsedFormData.guarantors = [parsedFormData.guarantor];
          console.log('📊 GUARANTOR DATA MAPPING DEBUG: Set parsedFormData.guarantors to:', parsedFormData.guarantors);
        } else {
          // Ensure guarantors array exists even if empty
          parsedFormData.guarantors = [];
          console.log('📊 GUARANTOR DATA MAPPING DEBUG: No guarantor data found, setting empty array');
        }
        
        console.log('🔍 GUARANTOR DATA MAPPING DEBUG: Final parsedFormData.guarantors:', parsedFormData.guarantors);
        console.log('🔍 GUARANTOR DATA MAPPING DEBUG: Final parsedFormData.guarantors.length:', parsedFormData.guarantors.length);
        
        // Final consistency check and logging
        console.log('🔍 Final data mapping results:', {
          coApplicantKeys: parsedFormData.coApplicant ? Object.keys(parsedFormData.coApplicant) : [],
          coApplicantsLength: parsedFormData.coApplicants ? parsedFormData.coApplicants.length : 0,
          guarantorKeys: parsedFormData.guarantor ? Object.keys(parsedFormData.guarantor) : [],
          guarantorsLength: parsedFormData.guarantors ? parsedFormData.guarantors.length : 0
        });
        
        // Load additional people data for auto-population
        let additionalPeopleData: any = null;
        try {
          // Try to get additional people from application_info first
          if (allData.application?.application_info && (allData.application.application_info as any)["Additional People"]) {
            additionalPeopleData = (allData.application.application_info as any)["Additional People"];
            console.log('📊 Loaded Additional People from application_info:', additionalPeopleData);
          }
          // Fallback to applicant_nyc additionalPeople field
          else if (allData.applicant?.additionalPeople) {
            additionalPeopleData = allData.applicant.additionalPeople;
            console.log('📊 Loaded additionalPeople from applicant_nyc:', additionalPeopleData);
          }
        } catch (e) {
          console.warn('⚠️ Failed to load additional people data:', e);
        }

        // Auto-populate co-applicants and guarantors from additional people data
        if (additionalPeopleData && typeof additionalPeopleData === 'object') {
          console.log('🔄 ===== AUTO-POPULATION START =====');
          console.log('🔄 Auto-populating form from additional people data...');
          console.log('🔍 Additional People Data:', additionalPeopleData);
          console.log('🔍 Additional People Data Keys:', Object.keys(additionalPeopleData));
          
          // Parse co-applicants from additional people
          const invitedCoApplicants: any[] = [];
          const invitedGuarantors: any[] = [];
          
          // First, collect all co-applicants with their indices
          const coApplicantEntries: Array<{index: number, data: any}> = [];
          const debugId = Math.random().toString(36).substr(2, 9);

          console.log(`#### [${debugId}] coApplicantEntries INIT`, coApplicantEntries);
          
          
          console.log('🔍 ===== PROCESSING CO-APPLICANTS =====');
          console.log('🔍 Total keys in additionalPeopleData:', Object.keys(additionalPeopleData).length);
          console.log('🔍 All keys in additionalPeopleData:', Object.keys(additionalPeopleData));
          
          for (const [key, value] of Object.entries(additionalPeopleData)) {
            console.log(`🔍 Processing key: "${key}", value:`, value);
            console.log(`🔍 Key starts with 'coApplicants': ${key.startsWith('coApplicants')}`);
            console.log(`🔍 Value is object: ${value && typeof value === 'object'}`);
            console.log(`🔍 Value type: ${typeof value}`);
            console.log(`🔍 Value truthy: ${!!value}`);
            
            if (key.startsWith('coApplicants') && value && typeof value === 'object') {
              console.log(`✅ Found co-applicant key: ${key}`);
              const coAppData = value as any;
              console.log(`🔍 Co-applicant data:`, coAppData);
              console.log(`🔍 Co-applicant has name: ${!!coAppData.name}, email: ${!!coAppData.email}`);
              console.log(`🔍 Co-applicant name: "${coAppData.name}", email: "${coAppData.email}"`);
              
              if (coAppData.name && coAppData.email) {
                // Extract the index from the key (coApplicants1 -> index 0, coApplicants2 -> index 1)
                const indexMatch = key.match(/coApplicants(\d+)/);
                const index = indexMatch ? parseInt(indexMatch[1], 10) - 1 : coApplicantEntries.length;
                console.log(`🔍 Extracted index from "${key}": ${index}`);
                
                // Parse name into first and last name if possible
                const nameParts = coAppData.name.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                console.log(`🔍 Parsed name "${coAppData.name}" -> firstName: "${firstName}", lastName: "${lastName}"`);
                
                const coApplicantData = {
                  name: coAppData.name,
                  firstName: firstName,
                  lastName: lastName,
                  email: coAppData.email,
                  // Add any other available fields from the additional people data
                  phone: coAppData.phone || '',
                  relationship: coAppData.relationship || 'Co-Applicant'
                };
                console.log(`#### [${debugId}] coApplicantData`, coApplicantData);
                
                console.log(`#### [${debugId}] coApplicantEntries BEFORE PUSH`, coApplicantEntries);
                
                coApplicantEntries.push({
                  index: index,
                  data: coApplicantData
                });
                
                console.log(`#### [${debugId}] coApplicantEntries AFTER PUSH`, coApplicantEntries);
                console.log(`✅ [${debugId}] Collected co-applicant from ${key} at index ${index}:`, coApplicantData);
                console.log(`✅ [${debugId}] Total co-applicant entries so far: ${coApplicantEntries.length}`);
                console.log(`🔄 MAPPING: ${key} -> index ${index} -> data:`, {
                  originalKey: key,
                  extractedIndex: index,
                  name: coApplicantData.name,
                  firstName: coApplicantData.firstName,
                  lastName: coApplicantData.lastName,
                  email: coApplicantData.email
                });
              } else {
                console.log(`⚠️ Skipping co-applicant ${key} - missing name or email`);
                console.log(`⚠️ Name: "${coAppData.name}", Email: "${coAppData.email}"`);
              }
            } else {
              console.log(`⚠️ Key "${key}" does not match co-applicant criteria`);
            }
          }
          
          console.log('🔍 ===== CO-APPLICANT PROCESSING COMPLETE =====');
          console.log('🔍 Total co-applicant entries collected:', coApplicantEntries.length);
          console.log('🔍 Co-applicant entries:', coApplicantEntries);
          
          // Sort by index and add to the array in correct order
          console.log(`🔍 [${debugId}] Co-applicant entries before sorting:`, coApplicantEntries);
          coApplicantEntries.sort((a, b) => a.index - b.index);
          console.log(`🔍 [${debugId}] Co-applicant entries after sorting:`, coApplicantEntries);
          
          console.log(`🔄 [${debugId}] ===== BUILDING INVITED CO-APPLICANTS ARRAY =====`);
          console.log(`🔍 [${debugId}] About to start forEach loop with ${coApplicantEntries.length} entries`);
          console.log(`🔍 [${debugId}] coApplicantEntries.length: ${coApplicantEntries.length}`);
          console.log(`🔍 [${debugId}] coApplicantEntries content:`, coApplicantEntries);
          
          // Copy the exact same logic as guarantors
          coApplicantEntries.forEach((entry, forEachIndex) => {
            console.log(`🔄 [${debugId}] Processing entry ${forEachIndex}:`, entry);
            console.log(`🔄 [${debugId}] Adding to invitedCoApplicants[${entry.index}]:`, entry.data);
            invitedCoApplicants.push(entry.data);
            console.log(`✅ [${debugId}] Added co-applicant at index ${entry.index}: ${entry.data.name} (${entry.data.email})`);
            console.log(`🔄 [${debugId}] Current invitedCoApplicants array:`, invitedCoApplicants);
            console.log(`🔄 [${debugId}] Current invitedCoApplicants.length: ${invitedCoApplicants.length}`);
          });
          
          console.log(`🔍 [${debugId}] Final invitedCoApplicants array:`, invitedCoApplicants);
          console.log(`🔍 [${debugId}] Final invitedCoApplicants.length: ${invitedCoApplicants.length}`);
          console.log(`🔍 [${debugId}] Final invitedCoApplicants[0]:`, invitedCoApplicants[0]);
          console.log(`🔍 [${debugId}] Final invitedCoApplicants[1]:`, invitedCoApplicants[1]);
          
          // Now process guarantors with index-based sorting
          const guarantorEntries: Array<{index: number, data: any}> = [];
          
          console.log('🔍 ===== PROCESSING GUARANTORS =====');
          for (const [key, value] of Object.entries(additionalPeopleData)) {
            console.log(`🔍 Processing key: "${key}", value:`, value);
            if (key.startsWith('guarantor') && value && typeof value === 'object') {
              console.log(`✅ Found guarantor key: ${key}`);
              const guarData = value as any;
              console.log(`🔍 Guarantor data:`, guarData);
              console.log(`🔍 Guarantor has name: ${!!guarData.name}, email: ${!!guarData.email}`);
              
              if (guarData.name && guarData.email) {
                // Extract the index from the key (guarantor1 -> index 0, guarantor2 -> index 1)
                const indexMatch = key.match(/guarantor(\d+)/);
                const index = indexMatch ? parseInt(indexMatch[1], 10) - 1 : guarantorEntries.length;
                console.log(`🔍 Extracted index from "${key}": ${index}`);
                
                // Parse name into first and last name if possible
                const nameParts = guarData.name.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                console.log(`🔍 Parsed name "${guarData.name}" -> firstName: "${firstName}", lastName: "${lastName}"`);
                
                const guarantorData = {
                  name: guarData.name,
                  firstName: firstName,
                  lastName: lastName,
                  email: guarData.email,
                  // Add any other available fields from the additional people data
                  phone: guarData.phone || '',
                  relationship: guarData.relationship || 'Guarantor'
                };
                
                guarantorEntries.push({
                  index: index,
                  data: guarantorData
                });
                
                console.log(`✅ Collected guarantor from ${key} at index ${index}:`, guarantorData);
              } else {
                console.log(`⚠️ Skipping guarantor ${key} - missing name or email`);
              }
            }
          }
          
          // Sort by index and add to the array in correct order
          console.log(`🔍 Guarantor entries before sorting:`, guarantorEntries);
          guarantorEntries.sort((a, b) => a.index - b.index);
          console.log(`🔍 Guarantor entries after sorting:`, guarantorEntries);
          
          guarantorEntries.forEach(entry => {
            invitedGuarantors.push(entry.data);
            console.log(`✅ Added guarantor at index ${entry.index}: ${entry.data.name} (${entry.data.email})`);
          });
          
          console.log(`🔍 Final invitedGuarantors array:`, invitedGuarantors);
          
          // Merge invited people with existing data (invited people take precedence for auto-population)
          // Always use Additional People data when available, as it's the most current
          console.log('🔍 ===== MERGING CO-APPLICANTS =====');
          console.log(`🔍 [${debugId}] invitedCoApplicants.length: ${invitedCoApplicants.length}`);
          console.log(`🔍 [${debugId}] invitedCoApplicants:`, invitedCoApplicants);
          console.log(`🔍 [${debugId}] allData.coApplicant:`, allData.coApplicant);
          console.log(`🔍 [${debugId}] allData.coApplicant?.coapplicant_info:`, allData.coApplicant?.coapplicant_info);
          
          // Copy the exact same logic as guarantors - Always use Additional People data when available
          if (invitedCoApplicants.length > 0) {
            console.log(`📊 [${debugId}] ===== AUTO-POPULATING CO-APPLICANTS =====`);
            console.log(`📊 [${debugId}] Auto-populating co-applicants from additional people:`, invitedCoApplicants);
            console.log(`📊 [${debugId}] Number of invited co-applicants:`, invitedCoApplicants.length);
            
            console.log(`📊 [${debugId}] Before setting - parsedFormData.coApplicants:`, parsedFormData.coApplicants);
            console.log(`📊 [${debugId}] Before setting - parsedFormData.coApplicant:`, parsedFormData.coApplicant);
            console.log(`📊 [${debugId}] Before setting - parsedFormData.hasCoApplicant:`, parsedFormData.hasCoApplicant);
            console.log(`📊 [${debugId}] Before setting - parsedFormData.coApplicantCount:`, parsedFormData.coApplicantCount);
            
            // Copy exact same assignment logic as guarantors
            parsedFormData.coApplicants = invitedCoApplicants;
            parsedFormData.coApplicant = invitedCoApplicants[0] || {};
            parsedFormData.hasCoApplicant = true;
            parsedFormData.coApplicantCount = invitedCoApplicants.length;
            
            console.log(`📊 [${debugId}] After setting - parsedFormData.coApplicantCount:`, parsedFormData.coApplicantCount);
            console.log(`📊 [${debugId}] After setting - parsedFormData.coApplicants:`, parsedFormData.coApplicants);
            console.log(`📊 [${debugId}] After setting - parsedFormData.coApplicant:`, parsedFormData.coApplicant);
            console.log(`📊 [${debugId}] After setting - parsedFormData.hasCoApplicant:`, parsedFormData.hasCoApplicant);
          } else {
            console.log(`⚠️ [${debugId}] No co-applicants to auto-populate`);
          }
          
          console.log('🔍 ===== MERGING GUARANTORS =====');
          console.log(`🔍 invitedGuarantors.length: ${invitedGuarantors.length}`);
          
          if (invitedGuarantors.length > 0) {
            // Always use Additional People data when available, as it's the most current
            console.log('📊 ===== AUTO-POPULATING GUARANTORS =====');
            console.log('📊 Auto-populating guarantors from additional people:', invitedGuarantors);
            console.log('📊 Number of invited guarantors:', invitedGuarantors.length);
            
            console.log('📊 Before setting - parsedFormData.guarantors:', parsedFormData.guarantors);
            console.log('📊 Before setting - parsedFormData.guarantor:', parsedFormData.guarantor);
            console.log('📊 Before setting - parsedFormData.hasGuarantor:', parsedFormData.hasGuarantor);
            console.log('📊 Before setting - parsedFormData.guarantorCount:', parsedFormData.guarantorCount);
            
            parsedFormData.guarantors = invitedGuarantors;
            parsedFormData.guarantor = invitedGuarantors[0] || {};
            parsedFormData.hasGuarantor = true;
            parsedFormData.guarantorCount = invitedGuarantors.length;
            
            console.log('📊 After setting - parsedFormData.guarantorCount:', parsedFormData.guarantorCount);
            console.log('📊 After setting - parsedFormData.guarantors:', parsedFormData.guarantors);
            console.log('📊 After setting - parsedFormData.guarantor:', parsedFormData.guarantor);
            console.log('📊 After setting - parsedFormData.hasGuarantor:', parsedFormData.hasGuarantor);
          } else {
            console.log('⚠️ No guarantors to auto-populate');
          }
        }

        console.log('🔄 ===== AUTO-POPULATION END =====');

        // Auto-set checkbox states based on data presence - RELIABLE APPROACH
        console.log('🔍 ===== CHECKING DATA PRESENCE =====');
        const hasCoApplicantDataFlag = parsedFormData.coApplicant && Object.keys(parsedFormData.coApplicant).length > 0;
        const hasCoApplicantsArray = parsedFormData.coApplicants && Array.isArray(parsedFormData.coApplicants) && parsedFormData.coApplicants.length > 0;
        const hasGuarantorDataFlag = parsedFormData.guarantor && Object.keys(parsedFormData.guarantor).length > 0;
        const hasGuarantorsArray = parsedFormData.guarantors && Array.isArray(parsedFormData.guarantors) && parsedFormData.guarantors.length > 0;
        
        console.log('🔍 hasCoApplicantDataFlag:', hasCoApplicantDataFlag);
        console.log('🔍 hasCoApplicantsArray:', hasCoApplicantsArray);
        console.log('🔍 hasGuarantorDataFlag:', hasGuarantorDataFlag);
        console.log('🔍 hasGuarantorsArray:', hasGuarantorsArray);
        
        // Set co-applicant checkbox if data exists
        console.log('🔍 ===== SETTING CO-APPLICANT FLAGS =====');
        console.log(`🔍 Checking co-applicant flags - hasCoApplicantDataFlag: ${hasCoApplicantDataFlag}, hasCoApplicantsArray: ${hasCoApplicantsArray}, hasCoApplicant: ${parsedFormData.hasCoApplicant}`);
        
        if ((hasCoApplicantDataFlag || hasCoApplicantsArray) && parsedFormData.hasCoApplicant === undefined) {
          console.log('🔧 Auto-setting hasCoApplicant to true based on data presence');
          parsedFormData.hasCoApplicant = true;
        }
        
        // Ensure co-applicant count is properly set
        console.log(`🔍 Checking co-applicant count - hasCoApplicantsArray: ${hasCoApplicantsArray}, coApplicantCount: ${parsedFormData.coApplicantCount}`);
        if (hasCoApplicantsArray && parsedFormData.coApplicantCount === undefined) {
          parsedFormData.coApplicantCount = parsedFormData.coApplicants.length;
          console.log('🔧 Auto-setting coApplicantCount to', parsedFormData.coApplicantCount);
        }
        console.log("#### parsedFormData", parsedFormData);
        console.log("#### allData.guarantor", allData.guarantor);
        console.log("#### allData.guarantor.guarantor_info", allData.guarantor?.guarantor_info);
        console.log("#### parsedFormData.guarantors", parsedFormData.guarantors);
        console.log("#### parsedFormData.guarantors[0]", parsedFormData.guarantors?.[0]);
        
        // Set guarantor checkbox if data exists
        console.log('🔍 ===== SETTING GUARANTOR FLAGS =====');
        console.log(`🔍 Checking guarantor flags - hasGuarantorDataFlag: ${hasGuarantorDataFlag}, hasGuarantorsArray: ${hasGuarantorsArray}, hasGuarantor: ${parsedFormData.hasGuarantor}`);
        
        if ((hasGuarantorDataFlag || hasGuarantorsArray) && parsedFormData.hasGuarantor === undefined) {
          console.log('🔧 Auto-setting hasGuarantor to true based on data presence');
          parsedFormData.hasGuarantor = true;
        }
        
        // Ensure guarantor count is properly set
        console.log(`🔍 Checking guarantor count - hasGuarantorsArray: ${hasGuarantorsArray}, guarantorCount: ${parsedFormData.guarantorCount}`);
        if (hasGuarantorsArray && parsedFormData.guarantorCount === undefined) {
          parsedFormData.guarantorCount = parsedFormData.guarantors.length;
          console.log('🔧 Auto-setting guarantorCount to', parsedFormData.guarantorCount);
        }
        
        // Ensure form fields are populated from mapped data - RELIABLE APPROACH WITH DEBUG
        console.log('🔍 GUARANTOR MAPPING DEBUG: Starting form field population check...');
        console.log('🔍 GUARANTOR MAPPING DEBUG: parsedFormData.guarantors:', parsedFormData.guarantors);
        console.log('🔍 GUARANTOR MAPPING DEBUG: Array.isArray(parsedFormData.guarantors):', Array.isArray(parsedFormData.guarantors));
        console.log('🔍 GUARANTOR MAPPING DEBUG: parsedFormData.guarantors.length:', parsedFormData.guarantors?.length || 0);
        console.log('🔍 GUARANTOR MAPPING DEBUG: specificIndex:', specificIndex);
        console.log('🔍 GUARANTOR MAPPING DEBUG: userRole:', userRole);
        console.log('🔍 GUARANTOR MAPPING DEBUG: user.role:', user?.role);
        
        // Determine the effective specific index for guarantor role
        let effectiveSpecificIndex = specificIndex;
        if (user && user.role && user.role.startsWith('guarantor') && /guarantor\d+/.test(user.role)) {
          const match = user.role.match(/guarantor(\d+)/);
          if (match) {
            effectiveSpecificIndex = parseInt(match[1], 10) - 1; // Convert to 0-based index
            console.log('🔍 GUARANTOR MAPPING DEBUG: Using effective specific index from user role:', effectiveSpecificIndex);
          }
        }
        if (parsedFormData.guarantors && Array.isArray(parsedFormData.guarantors) && parsedFormData.guarantors.length > 0) {
          console.log('🔧 GUARANTOR MAPPING DEBUG: Condition met - populating guarantor form fields from mapped data');
          console.log('🔧 GUARANTOR MAPPING DEBUG: Processing', parsedFormData.guarantors.length, 'guarantors');
          
          // For specific role (guarantor4, guarantor3, etc.), only populate the specific index
          if (effectiveSpecificIndex !== null && effectiveSpecificIndex !== undefined) {
            console.log(`🔧 GUARANTOR MAPPING DEBUG: Specific role detected - populating only guarantor ${effectiveSpecificIndex}`);
            let guarantor = parsedFormData.guarantors[effectiveSpecificIndex];

            // Fallback: if only one guarantor exists at index 0, copy it to effective index
            if ((!guarantor || Object.keys(guarantor || {}).length === 0) && parsedFormData.guarantors.length === 1 && effectiveSpecificIndex !== 0) {
              console.log(`⚙️ GUARANTOR MAPPING DEBUG: Fallback engaged - copying guarantor[0] to guarantor[${effectiveSpecificIndex}]`);
              const single = parsedFormData.guarantors[0];
              if (single && Object.keys(single).length > 0) {
                // Ensure array has the target slot
                while (parsedFormData.guarantors.length <= effectiveSpecificIndex) {
                  parsedFormData.guarantors.push({});
                }
                parsedFormData.guarantors[effectiveSpecificIndex] = { ...single };
                guarantor = parsedFormData.guarantors[effectiveSpecificIndex];
              }
            }
            if (guarantor && Object.keys(guarantor).length > 0) {
              console.log(`🔧 GUARANTOR MAPPING DEBUG: Setting form values for specific guarantor ${effectiveSpecificIndex}`);
              
              // Set basic guarantor fields with detailed logging
              if (guarantor.name) {
                form.setValue(`guarantors.${effectiveSpecificIndex}.name`, guarantor.name);
                console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${effectiveSpecificIndex}.name = ${guarantor.name}`);
              }
              if (guarantor.relationship) {
                form.setValue(`guarantors.${effectiveSpecificIndex}.relationship`, guarantor.relationship);
                console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${effectiveSpecificIndex}.relationship = ${guarantor.relationship}`);
              }
              if (guarantor.dob) {
                form.setValue(`guarantors.${effectiveSpecificIndex}.dob`, new Date(guarantor.dob));
                console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${effectiveSpecificIndex}.dob = ${guarantor.dob}`);
              }
              if (guarantor.ssn) {
                form.setValue(`guarantors.${effectiveSpecificIndex}.ssn`, guarantor.ssn);
                console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${effectiveSpecificIndex}.ssn = ${guarantor.ssn}`);
              }
              if (guarantor.phone) {
                form.setValue(`guarantors.${effectiveSpecificIndex}.phone`, guarantor.phone);
                console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${effectiveSpecificIndex}.phone = ${guarantor.phone}`);
              }
              if (guarantor.email) {
                form.setValue(`guarantors.${effectiveSpecificIndex}.email`, guarantor.email);
                console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${effectiveSpecificIndex}.email = ${guarantor.email}`);
              }
              if (guarantor.address) {
                form.setValue(`guarantors.${effectiveSpecificIndex}.address`, guarantor.address);
                console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${effectiveSpecificIndex}.address = ${guarantor.address}`);
              }
              if (guarantor.city) {
                form.setValue(`guarantors.${effectiveSpecificIndex}.city`, guarantor.city);
                console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${effectiveSpecificIndex}.city = ${guarantor.city}`);
              }
              if (guarantor.state) {
                form.setValue(`guarantors.${effectiveSpecificIndex}.state`, guarantor.state);
                console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${effectiveSpecificIndex}.state = ${guarantor.state}`);
              }
              if (guarantor.zip) {
                form.setValue(`guarantors.${effectiveSpecificIndex}.zip`, guarantor.zip);
                console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${effectiveSpecificIndex}.zip = ${guarantor.zip}`);
              }
              if (guarantor.license) {
                form.setValue(`guarantors.${effectiveSpecificIndex}.license`, guarantor.license);
                console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${effectiveSpecificIndex}.license = ${guarantor.license}`);
              }
              if (guarantor.licenseState) {
                form.setValue(`guarantors.${effectiveSpecificIndex}.licenseState`, guarantor.licenseState);
                console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${effectiveSpecificIndex}.licenseState = ${guarantor.licenseState}`);
              }
              
              // Verify form values were set
              setTimeout(() => {
                const formName = form.getValues(`guarantors.${effectiveSpecificIndex}.name`);
                const formEmail = form.getValues(`guarantors.${effectiveSpecificIndex}.email`);
                const formPhone = form.getValues(`guarantors.${effectiveSpecificIndex}.phone`);
                console.log(`🔍 GUARANTOR MAPPING DEBUG: Verification for specific guarantor ${effectiveSpecificIndex}:`, {
                  formName: formName,
                  formEmail: formEmail,
                  formPhone: formPhone,
                  expectedName: guarantor.name,
                  expectedEmail: guarantor.email,
                  expectedPhone: guarantor.phone,
                  formValuesMatch: formName === guarantor.name && formEmail === guarantor.email && formPhone === guarantor.phone
                });
                
                // If form values don't match, log a warning
                if (formName !== guarantor.name || formEmail !== guarantor.email || formPhone !== guarantor.phone) {
                  console.warn(`⚠️ GUARANTOR MAPPING DEBUG: Form values don't match expected values for guarantor ${effectiveSpecificIndex}!`);
                  console.warn(`⚠️ GUARANTOR MAPPING DEBUG: This suggests form fields are being overwritten after population`);
                }
              }, 100);
              
              console.log(`✅ GUARANTOR MAPPING DEBUG: Completed populating specific guarantor ${effectiveSpecificIndex} form fields`);
            } else {
              console.log(`⚠️ GUARANTOR MAPPING DEBUG: No data found for specific guarantor ${effectiveSpecificIndex}`);
            }
          } else {
            // For general loading, populate all guarantors
            console.log('🔧 GUARANTOR MAPPING DEBUG: General loading - populating all guarantors');
            parsedFormData.guarantors.forEach((guarantor: any, index: number) => {
              console.log(`🔧 GUARANTOR MAPPING DEBUG: Processing guarantor ${index}:`, {
                hasGuarantor: !!guarantor,
                guarantorKeys: guarantor ? Object.keys(guarantor) : [],
                guarantorName: guarantor?.name || 'NO NAME'
              });
              
              if (guarantor && Object.keys(guarantor).length > 0) {
                console.log(`🔧 GUARANTOR MAPPING DEBUG: Setting form values for guarantor ${index}`);
                
                // Set basic guarantor fields with detailed logging
                if (guarantor.name) {
                  form.setValue(`guarantors.${index}.name`, guarantor.name);
                  console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${index}.name = ${guarantor.name}`);
                }
                if (guarantor.relationship) {
                  form.setValue(`guarantors.${index}.relationship`, guarantor.relationship);
                  console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${index}.relationship = ${guarantor.relationship}`);
                }
                if (guarantor.dob) {
                  form.setValue(`guarantors.${index}.dob`, new Date(guarantor.dob));
                  console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${index}.dob = ${guarantor.dob}`);
                }
                if (guarantor.ssn) {
                  form.setValue(`guarantors.${index}.ssn`, guarantor.ssn);
                  console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${index}.ssn = ${guarantor.ssn}`);
                }
                if (guarantor.phone) {
                  form.setValue(`guarantors.${index}.phone`, guarantor.phone);
                  console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${index}.phone = ${guarantor.phone}`);
                }
                if (guarantor.email) {
                  form.setValue(`guarantors.${index}.email`, guarantor.email);
                  console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${index}.email = ${guarantor.email}`);
                }
                if (guarantor.address) {
                  form.setValue(`guarantors.${index}.address`, guarantor.address);
                  console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${index}.address = ${guarantor.address}`);
                }
                if (guarantor.city) {
                  form.setValue(`guarantors.${index}.city`, guarantor.city);
                  console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${index}.city = ${guarantor.city}`);
                }
                if (guarantor.state) {
                  form.setValue(`guarantors.${index}.state`, guarantor.state);
                  console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${index}.state = ${guarantor.state}`);
                }
                if (guarantor.zip) {
                  form.setValue(`guarantors.${index}.zip`, guarantor.zip);
                  console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${index}.zip = ${guarantor.zip}`);
                }
                if (guarantor.license) {
                  form.setValue(`guarantors.${index}.license`, guarantor.license);
                  console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${index}.license = ${guarantor.license}`);
                }
                if (guarantor.licenseState) {
                  form.setValue(`guarantors.${index}.licenseState`, guarantor.licenseState);
                  console.log(`✅ GUARANTOR MAPPING DEBUG: Set guarantors.${index}.licenseState = ${guarantor.licenseState}`);
                }
                
                console.log(`✅ GUARANTOR MAPPING DEBUG: Completed populating guarantor ${index} form fields`);
              } else {
                console.log(`⚠️ GUARANTOR MAPPING DEBUG: Skipping guarantor ${index} - no data or empty object`);
              }
            });
          }
        } else {
          console.log('⚠️ GUARANTOR MAPPING DEBUG: Condition not met - not populating guarantor form fields');
          console.log('⚠️ GUARANTOR MAPPING DEBUG: Reasons:', {
            hasGuarantors: !!parsedFormData.guarantors,
            isArray: Array.isArray(parsedFormData.guarantors),
            length: parsedFormData.guarantors?.length || 0
          });
        }
        
      // AUTO-POPULATION SETUP: Populate co-applicant form fields
        if (parsedFormData.coApplicants && Array.isArray(parsedFormData.coApplicants) && parsedFormData.coApplicants.length > 0) {
        console.log('🔧 AUTO-POPULATION: Starting co-applicant form field population');
        console.log('🔍 AUTO-POPULATION: parsedFormData.coApplicants:', parsedFormData.coApplicants);
        console.log('🔍 AUTO-POPULATION: Current specificIndex:', specificIndex);
        console.log('🔍 AUTO-POPULATION: Effective userRole:', userRole);

        // Ensure hasCoApplicant is true to show co-applicant sections
        parsedFormData.hasCoApplicant = true;
        parsedFormData.coApplicantCount = parsedFormData.coApplicants.length;

        // Determine the target index for population
        let targetIndex = 0; // Default to index 0
        if (user?.role && user.role.startsWith('coapplicant') && /coapplicant\d+/.test(user.role)) {
          const match = user.role.match(/coapplicant(\d+)/);
          if (match) {
            targetIndex = parseInt(match[1], 10) - 1; // Convert to 0-based index
            console.log(`🔧 AUTO-POPULATION: Using specific index ${targetIndex} for role ${user.role}`);
          }
        } else if (specificIndex !== null && specificIndex !== undefined) {
          targetIndex = specificIndex;
          console.log(`🔧 AUTO-POPULATION: Using specificIndex ${targetIndex}`);
        }

        // Process ALL co-applicants, not just the first one
        console.log(`🔧 AUTO-POPULATION: Processing ${parsedFormData.coApplicants.length} co-applicants`);
        
        parsedFormData.coApplicants.forEach((coApplicantToPopulate: any, coAppIndex: number) => {
          console.log(`🔧 AUTO-POPULATION: Processing co-applicant ${coAppIndex}:`, coApplicantToPopulate);

          if (coApplicantToPopulate && Object.keys(coApplicantToPopulate).length > 0) {
            // Use the current co-applicant index as the target index
            const currentTargetIndex = coAppIndex;
            console.log(`🔧 AUTO-POPULATION: Using target index ${currentTargetIndex} for co-applicant ${coAppIndex}`);
            
            // Auto-populate all available fields at the target index
            const fieldsToPopulate = [
            'name', 'relationship', 'ssn', 'phone', 'email', 'address', 'city', 'state', 'zip',
            'license', 'licenseState', 'employmentType', 'employer', 'employerName', 'employerPhone',
            'position', 'employerPosition', 'income', 'monthlyIncome', 'otherIncome', 'otherIncomeFrequency', 
            'otherIncomeSource', 'creditScore', 'landlordName', 'landlordAddressLine1', 'landlordAddressLine2', 
            'landlordCity', 'landlordState', 'landlordZipCode', 'landlordPhone', 'landlordEmail',
            'employmentStart', 'bankRecords', 'lengthAtAddressYears', 'lengthAtAddressMonths', 
            'currentRent', 'reasonForMoving'
          ];

          fieldsToPopulate.forEach(field => {
            // Special handling for different field types
            let shouldPopulate = false;
            let value = coApplicantToPopulate[field];
            
            if (field === 'bankRecords') {
              // For bank records, check if it's an array with content
              shouldPopulate = Array.isArray(value) && value.length > 0;
            } else if (field === 'employmentStart') {
              // For employment start date, check if it exists
              shouldPopulate = value !== undefined && value !== null;
            } else if (field === 'lengthAtAddressYears' || field === 'lengthAtAddressMonths' || field === 'currentRent') {
              // For numeric fields, allow 0 values
              shouldPopulate = value !== undefined && value !== null && value !== '';
            } else {
              // For other fields, use the original validation
              shouldPopulate = value !== undefined && value !== null && value !== '';
            }
            
            if (shouldPopulate) {
              const formFieldName = `coApplicants.${currentTargetIndex}.${field}`;
              
              console.log(`🔧 AUTO-POPULATION: Setting ${formFieldName} =`, value);
              form.setValue(formFieldName as any, value);
              
              // Also update formData state for UI display
              setFormData((prevData: any) => {
                const updated = { ...prevData };
                if (!updated.coApplicants) updated.coApplicants = [];
                if (!updated.coApplicants[currentTargetIndex]) updated.coApplicants[currentTargetIndex] = {};
                updated.coApplicants[currentTargetIndex][field] = value;
                return updated;
              });
              
              // Verify the value was set
              const setValue = form.getValues(formFieldName as any);
              console.log(`🔧 AUTO-POPULATION: Verified ${formFieldName} =`, setValue);
            } else {
              console.log(`🔧 AUTO-POPULATION: Skipping ${field} (value: ${value}, type: ${typeof value})`);
            }
          });

          // Handle field name mappings for FinancialSection compatibility
          const fieldMappings = [
            { from: 'employerName', to: 'employer' },
            { from: 'employerPosition', to: 'position' },
            { from: 'monthlyIncome', to: 'income' }
          ];

          fieldMappings.forEach(mapping => {
            if (coApplicantToPopulate[mapping.from] !== undefined && coApplicantToPopulate[mapping.from] !== null && coApplicantToPopulate[mapping.from] !== '') {
              const formFieldName = `coApplicants.${currentTargetIndex}.${mapping.to}`;
              const value = coApplicantToPopulate[mapping.from];
              
              console.log(`🔧 AUTO-POPULATION: Mapping ${mapping.from} -> ${mapping.to}: Setting ${formFieldName} =`, value);
              form.setValue(formFieldName as any, value);
              
              // Also update formData state for UI display
              setFormData((prevData: any) => {
                const updated = { ...prevData };
                if (!updated.coApplicants) updated.coApplicants = [];
                if (!updated.coApplicants[currentTargetIndex]) updated.coApplicants[currentTargetIndex] = {};
                updated.coApplicants[currentTargetIndex][mapping.to] = value;
                return updated;
              });
              
              // Verify the value was set
              const setValue = form.getValues(formFieldName as any);
              console.log(`🔧 AUTO-POPULATION: Verified mapped ${formFieldName} =`, setValue);
            }
          });

          // Handle date fields separately
          if (coApplicantToPopulate.dob) {
            const dobValue = new Date(coApplicantToPopulate.dob);
            console.log(`🔧 AUTO-POPULATION: Setting coApplicants.${currentTargetIndex}.dob =`, dobValue);
            form.setValue(`coApplicants.${currentTargetIndex}.dob` as any, dobValue);
            
            // Also update formData state for UI display
            setFormData((prevData: any) => {
              const updated = { ...prevData };
              if (!updated.coApplicants) updated.coApplicants = [];
              if (!updated.coApplicants[currentTargetIndex]) updated.coApplicants[currentTargetIndex] = {};
              updated.coApplicants[currentTargetIndex].dob = dobValue;
              return updated;
            });
            
            console.log(`🔧 AUTO-POPULATION: Verified coApplicants.${currentTargetIndex}.dob =`, form.getValues(`coApplicants.${currentTargetIndex}.dob` as any));
          }

          // Handle employment start date separately
          if (coApplicantToPopulate.employmentStart) {
            const employmentStartValue = new Date(coApplicantToPopulate.employmentStart);
            console.log(`🔧 AUTO-POPULATION: Setting coApplicants.${currentTargetIndex}.employmentStart =`, employmentStartValue);
            form.setValue(`coApplicants.${currentTargetIndex}.employmentStart` as any, employmentStartValue);
            
            // Also update formData state for UI display
            setFormData((prevData: any) => {
              const updated = { ...prevData };
              if (!updated.coApplicants) updated.coApplicants = [];
              if (!updated.coApplicants[currentTargetIndex]) updated.coApplicants[currentTargetIndex] = {};
              updated.coApplicants[currentTargetIndex].employmentStart = employmentStartValue;
              return updated;
            });
            
            console.log(`🔧 AUTO-POPULATION: Verified coApplicants.${currentTargetIndex}.employmentStart =`, form.getValues(`coApplicants.${currentTargetIndex}.employmentStart` as any));
          }

          // Handle bank records separately (array field)
          if (coApplicantToPopulate.bankRecords && Array.isArray(coApplicantToPopulate.bankRecords) && coApplicantToPopulate.bankRecords.length > 0) {
            console.log(`🔧 AUTO-POPULATION: Setting coApplicants.${currentTargetIndex}.bankRecords =`, coApplicantToPopulate.bankRecords);
            form.setValue(`coApplicants.${currentTargetIndex}.bankRecords` as any, coApplicantToPopulate.bankRecords);
            
            // Also update formData state for UI display
            setFormData((prevData: any) => {
              const updated = { ...prevData };
              if (!updated.coApplicants) updated.coApplicants = [];
              if (!updated.coApplicants[currentTargetIndex]) updated.coApplicants[currentTargetIndex] = {};
              updated.coApplicants[currentTargetIndex].bankRecords = coApplicantToPopulate.bankRecords;
              return updated;
            });
            
            console.log(`🔧 AUTO-POPULATION: Verified coApplicants.${currentTargetIndex}.bankRecords =`, form.getValues(`coApplicants.${currentTargetIndex}.bankRecords` as any));
          }

            console.log(`✅ AUTO-POPULATION: Completed co-applicant ${coAppIndex} form fields`);
          } else {
            console.log(`⚠️ AUTO-POPULATION: Co-applicant ${coAppIndex} has no data to populate`);
          }
        });

        console.log('🔧 AUTO-POPULATION: Completed all co-applicant form field population');
          
          // Force form to update and sync with formData
          console.log('🔧 AUTO-POPULATION: Triggering form update...');
          form.trigger(); // Trigger validation and form update
          
          // Update formData to match the form values
          const currentFormValues = form.getValues();
          console.log('🔧 AUTO-POPULATION: Current form values:', currentFormValues);
          
          // Sync the parsedFormData with the actual form values
          if (currentFormValues.coApplicants) {
            parsedFormData.coApplicants = currentFormValues.coApplicants;
            console.log('🔧 AUTO-POPULATION: Synced parsedFormData.coApplicants with form values');
          }
        }

      // AUTO-POPULATION SETUP: Populate guarantor form fields
      if (parsedFormData.guarantors && Array.isArray(parsedFormData.guarantors) && parsedFormData.guarantors.length > 0) {
        console.log('🔧 AUTO-POPULATION: Starting guarantor form field population');
        console.log('🔍 AUTO-POPULATION: parsedFormData.guarantors:', parsedFormData.guarantors);
        console.log('🔍 AUTO-POPULATION: Current specificIndex:', specificIndex);
        console.log('🔍 AUTO-POPULATION: User role:', user?.role);

        // Ensure hasGuarantor is true to show guarantor sections
        parsedFormData.hasGuarantor = true;
        parsedFormData.guarantorCount = parsedFormData.guarantors.length;

        // Determine the target index for population
        let targetIndex = 0; // Default to index 0
        if (specificIndex !== null && specificIndex !== undefined) {
          targetIndex = specificIndex;
          console.log(`🔧 AUTO-POPULATION: Using specificIndex ${targetIndex}`);
        } else if (userRole && userRole.startsWith('guarantor') && /guarantor\d+/.test(userRole)) {
          const match = userRole.match(/guarantor(\d+)/);
          if (match) {
            targetIndex = parseInt(match[1], 10) - 1; // Convert to 0-based index
            console.log(`🔧 AUTO-POPULATION: Using role-derived index ${targetIndex} for role ${userRole}`);
          }
        }

        // Ensure a slot exists at target index
        ensureGuarantorIndexExists(targetIndex);

        // Get the guarantor data to populate (use first available data)
        const guarantorToPopulate = parsedFormData.guarantors[0];
        console.log(`🔧 AUTO-POPULATION: Using guarantor data:`, guarantorToPopulate);
        console.log('#### GUARANTOR AUTO-POPULATION: allData.guarantor:', allData.guarantor);
        console.log('#### GUARANTOR AUTO-POPULATION: allData.guarantor.guarantor_info:', allData.guarantor?.guarantor_info);
        console.log('#### GUARANTOR AUTO-POPULATION: parsedFormData.guarantors:', parsedFormData.guarantors);
        console.log('#### GUARANTOR AUTO-POPULATION: parsedFormData.guarantors[0]:', parsedFormData.guarantors[0]);

        if (guarantorToPopulate && Object.keys(guarantorToPopulate).length > 0) {
          console.log('#### GUARANTOR AUTO-POPULATION: Starting field population for targetIndex:', targetIndex);
          console.log('#### GUARANTOR AUTO-POPULATION: guarantorToPopulate keys:', Object.keys(guarantorToPopulate));
          
          // Auto-populate all available fields at the target index
          const fieldsToPopulate = [
            'name', 'relationship', 'ssn', 'phone', 'email', 'address', 'city', 'state', 'zip',
            'license', 'licenseState', 'employmentType', 'employer', 'employerName', 'employerPhone',
            'position', 'employerPosition', 'income', 'monthlyIncome', 'otherIncome', 'otherIncomeFrequency', 
            'otherIncomeSource', 'creditScore', 'landlordName', 'landlordAddressLine1', 'landlordAddressLine2', 
            'landlordCity', 'landlordState', 'landlordZipCode', 'landlordPhone', 'landlordEmail',
            'employmentStart', 'bankRecords', 'lengthAtAddressYears', 'lengthAtAddressMonths', 
            'currentRent', 'reasonForMoving'
          ];

          fieldsToPopulate.forEach(field => {
            // Special handling for different field types
            let shouldPopulate = false;
            let value = guarantorToPopulate[field];
            
            console.log(`#### GUARANTOR AUTO-POPULATION: Processing field ${field}: value="${value}", type=${typeof value}`);
            
            if (field === 'bankRecords') {
              // For bank records, check if it's an array with content
              shouldPopulate = Array.isArray(value) && value.length > 0;
            } else if (field === 'employmentStart') {
              // For employment start date, check if it exists
              shouldPopulate = value !== undefined && value !== null;
            } else if (field === 'lengthAtAddressYears' || field === 'lengthAtAddressMonths' || field === 'currentRent') {
              // For numeric fields, allow 0 values
              shouldPopulate = value !== undefined && value !== null && value !== '';
            } else {
              // For other fields, allow any non-null/undefined values (including empty strings for some fields)
              shouldPopulate = value !== undefined && value !== null;
            }
            
            console.log(`#### GUARANTOR AUTO-POPULATION: Field ${field} shouldPopulate: ${shouldPopulate}`);
            
            if (shouldPopulate) {
              const formFieldName = `guarantors.${targetIndex}.${field}`;
              
              console.log(`🔧 AUTO-POPULATION: Setting ${formFieldName} =`, value);
              form.setValue(formFieldName as any, value);
              
              // Also update formData state for UI display
              setFormData((prevData: any) => {
                const updated = { ...prevData };
                if (!updated.guarantors) updated.guarantors = [];
                if (!updated.guarantors[targetIndex]) updated.guarantors[targetIndex] = {};
                updated.guarantors[targetIndex][field] = value;
                console.log(`🔧 AUTO-POPULATION: Updated formData.guarantors[${targetIndex}].${field} = ${value}`);
                return updated;
              });
              
              // Verify the value was set
              const setValue = form.getValues(formFieldName as any);
              console.log(`🔧 AUTO-POPULATION: Verified ${formFieldName} =`, setValue);
            } else {
              console.log(`🔧 AUTO-POPULATION: Skipping ${field} (value: ${value}, type: ${typeof value})`);
            }
          });

          // Handle field name mappings for FinancialSection compatibility
          const fieldMappings = [
            { from: 'employerName', to: 'employer' },
            { from: 'employerPosition', to: 'position' },
            { from: 'monthlyIncome', to: 'income' }
          ];

          fieldMappings.forEach(mapping => {
            if (guarantorToPopulate[mapping.from] !== undefined && guarantorToPopulate[mapping.from] !== null && guarantorToPopulate[mapping.from] !== '') {
              const formFieldName = `guarantors.${targetIndex}.${mapping.to}`;
              const value = guarantorToPopulate[mapping.from];
              
              console.log(`🔧 AUTO-POPULATION: Mapping ${mapping.from} -> ${mapping.to}: Setting ${formFieldName} =`, value);
              form.setValue(formFieldName as any, value);
              
              // Also update formData state for UI display
              setFormData((prevData: any) => {
                const updated = { ...prevData };
                if (!updated.guarantors) updated.guarantors = [];
                if (!updated.guarantors[targetIndex]) updated.guarantors[targetIndex] = {};
                updated.guarantors[targetIndex][mapping.to] = value;
                return updated;
              });
              
              // Verify the value was set
              const setValue = form.getValues(formFieldName as any);
              console.log(`🔧 AUTO-POPULATION: Verified mapped ${formFieldName} =`, setValue);
            }
          });

          // Handle date fields separately
          if (guarantorToPopulate.dob) {
            const dobValue = new Date(guarantorToPopulate.dob);
            console.log(`🔧 AUTO-POPULATION: Setting guarantors.${targetIndex}.dob =`, dobValue);
            form.setValue(`guarantors.${targetIndex}.dob` as any, dobValue);
            
            // Also update formData state for UI display
            setFormData((prevData: any) => {
              const updated = { ...prevData };
              if (!updated.guarantors) updated.guarantors = [];
              if (!updated.guarantors[targetIndex]) updated.guarantors[targetIndex] = {};
              updated.guarantors[targetIndex].dob = dobValue;
              return updated;
            });
            
            console.log(`🔧 AUTO-POPULATION: Verified guarantors.${targetIndex}.dob =`, form.getValues(`guarantors.${targetIndex}.dob` as any));
          }

          // Handle employment start date separately
          if (guarantorToPopulate.employmentStart) {
            const employmentStartValue = new Date(guarantorToPopulate.employmentStart);
            console.log(`🔧 AUTO-POPULATION: Setting guarantors.${targetIndex}.employmentStart =`, employmentStartValue);
            form.setValue(`guarantors.${targetIndex}.employmentStart` as any, employmentStartValue);
            
            // Also update formData state for UI display
            setFormData((prevData: any) => {
              const updated = { ...prevData };
              if (!updated.guarantors) updated.guarantors = [];
              if (!updated.guarantors[targetIndex]) updated.guarantors[targetIndex] = {};
              updated.guarantors[targetIndex].employmentStart = employmentStartValue;
              return updated;
            });
            
            console.log(`🔧 AUTO-POPULATION: Verified guarantors.${targetIndex}.employmentStart =`, form.getValues(`guarantors.${targetIndex}.employmentStart` as any));
          }

          // Handle bank records separately (array field)
          if (guarantorToPopulate.bankRecords && Array.isArray(guarantorToPopulate.bankRecords) && guarantorToPopulate.bankRecords.length > 0) {
            console.log(`🔧 AUTO-POPULATION: Setting guarantors.${targetIndex}.bankRecords =`, guarantorToPopulate.bankRecords);
            form.setValue(`guarantors.${targetIndex}.bankRecords` as any, guarantorToPopulate.bankRecords);
            
            // Also update formData state for UI display
            setFormData((prevData: any) => {
              const updated = { ...prevData };
              if (!updated.guarantors) updated.guarantors = [];
              if (!updated.guarantors[targetIndex]) updated.guarantors[targetIndex] = {};
              updated.guarantors[targetIndex].bankRecords = guarantorToPopulate.bankRecords;
              return updated;
            });
            
            console.log(`🔧 AUTO-POPULATION: Verified guarantors.${targetIndex}.bankRecords =`, form.getValues(`guarantors.${targetIndex}.bankRecords` as any));
          }

          console.log(`✅ AUTO-POPULATION: Completed guarantor ${targetIndex} form fields`);
        }

        console.log('🔧 AUTO-POPULATION: Completed all guarantor form field population');
        }

          // Merge webhookSummary.webhookResponses into the main formData.webhookResponses
          if (parsedFormData.webhookSummary?.webhookResponses) {
            parsedFormData.webhookResponses = {
              ...parsedFormData.webhookResponses,
              ...parsedFormData.webhookSummary.webhookResponses
            };
            console.log('🔗 Merged webhook responses from webhookSummary:', parsedFormData.webhookResponses);
            console.log('######### prev document (loaded):', parsedFormData.webhookResponses);
            console.log('######### webhookSummary.webhookResponses (loaded source):', parsedFormData.webhookSummary?.webhookResponses);
            
            // Auto-map webhook responses to form fields during data loading
            const webhookResponses = parsedFormData.webhookSummary.webhookResponses;
            if (webhookResponses && typeof webhookResponses === 'object') {
              console.log('🔄 Auto-mapping webhook responses during data loading...');
              
              // Process each webhook response
              Object.entries(webhookResponses).forEach(([key, value]) => {
                if (typeof value === 'string' && value.startsWith('http')) {
                  console.log(`📎 Mapping webhook response during load: ${key} -> ${value}`);
                  
                  // Map to appropriate form field based on key pattern
                  if (key.includes('coApplicants_') && key.includes('_photo_id')) {
                    // This is a co-applicant photo ID document
                    const coApplicantIndex = key.match(/coApplicants_(\d+)_/)?.[1];
                    if (coApplicantIndex !== undefined) {
                      const index = parseInt(coApplicantIndex);
                      if (!parsedFormData.coApplicants) parsedFormData.coApplicants = [];
                      if (!parsedFormData.coApplicants[index]) parsedFormData.coApplicants[index] = {};
                      
                      // Map to the appropriate field in co-applicant data
                      parsedFormData.coApplicants[index].photoIdUrl = value;
                      
                      console.log(`✅ Mapped co-applicant ${index} photo ID URL during load:`, value);
                    }
                  } else if (key.includes('applicant_') && key.includes('_photo_id')) {
                    // This is an applicant photo ID document
                    if (!parsedFormData.applicant) parsedFormData.applicant = {};
                    parsedFormData.applicant.photoIdUrl = value;
                    
                    console.log(`✅ Mapped applicant photo ID URL during load:`, value);
                  } else if (key.includes('guarantor_') && key.includes('_photo_id')) {
                    // This is a guarantor photo ID document
                    const guarantorIndex = key.match(/guarantor_(\d+)_/)?.[1];
                    if (guarantorIndex !== undefined) {
                      const index = parseInt(guarantorIndex);
                      if (!parsedFormData.guarantors) parsedFormData.guarantors = [];
                      if (!parsedFormData.guarantors[index]) parsedFormData.guarantors[index] = {};
                      
                      // Map to the appropriate field in guarantor data
                      parsedFormData.guarantors[index].photoIdUrl = value;
                      
                      console.log(`✅ Mapped guarantor ${index} photo ID URL during load:`, value);
                    }
                  }
                }
              });
            }
          }

          // Also merge indexed webhook responses from co-applicants and guarantors arrays so previews show
          try {
            // Gather raw arrays from separate tables if available for webhook merging
            const appIdToUse = allData.application?.appid;
            if (appIdToUse) {
              const [coAppsByAppId, guarantorsByAppId] = await Promise.all([
                dynamoDBSeparateTablesUtils.getCoApplicantsByAppId(appIdToUse),
                dynamoDBSeparateTablesUtils.getGuarantorsByAppId(appIdToUse)
              ]);

              // Merge co-applicants webhook responses with indexed prefixes
              (coAppsByAppId || []).forEach((co, idx) => {
                const responses = co?.webhookSummary?.webhookResponses || {};
                Object.entries(responses).forEach(([k, v]) => {
                  const indexedKey = `coApplicants_${idx}_` + k;
                  parsedFormData.webhookResponses = {
                    ...parsedFormData.webhookResponses,
                    [indexedKey]: v
                  };
                });
              });

              // Merge guarantors webhook responses with indexed prefixes
              (guarantorsByAppId || []).forEach((gu, idx) => {
                const responses = gu?.webhookSummary?.webhookResponses || {};
                Object.entries(responses).forEach(([k, v]) => {
                  const indexedKey = `guarantors_${idx}_` + k;
                  parsedFormData.webhookResponses = {
                    ...parsedFormData.webhookResponses,
                    [indexedKey]: v
                  };
                });
              });
            }
          } catch (e) {
            console.warn('⚠️ Failed to merge indexed webhook responses from separate tables', e);
          }
          
          console.log('📊 Final parsedFormData before setting formData:', {
            hasApplication: !!parsedFormData.application,
            hasApplicant: !!parsedFormData.applicant,
            hasCoApplicants: !!parsedFormData.coApplicants,
            coApplicantsLength: parsedFormData.coApplicants?.length || 0,
            coApplicantsData: parsedFormData.coApplicants,
            userRole: userRole
          });
          console.log('🔍 DEBUG: Final form values after population:', form.getValues());
          // Mark as restored before state updates to avoid duplicate triggers
          hasRestoredFromDraftRef.current = true;
          setFormData(parsedFormData);
          console.log('🔍 DEBUG: After setFormData, form values are:', form.getValues());
          console.log('#### formData.guarantors after setFormData:', parsedFormData.guarantors);
          console.log('#### formData.guarantors[0] after setFormData:', parsedFormData.guarantors?.[0]);
          
          // Ensure Additional People section form fields are properly populated
          console.log('🔍 ===== FORM FIELD POPULATION START =====');
          console.log('🔍 parsedFormData.hasCoApplicant:', parsedFormData.hasCoApplicant);
          console.log('🔍 parsedFormData.coApplicants:', parsedFormData.coApplicants);
          console.log('🔍 Array.isArray(parsedFormData.coApplicants):', Array.isArray(parsedFormData.coApplicants));
          console.log('🔍 parsedFormData.coApplicants.length:', parsedFormData.coApplicants?.length);
          console.log('🔍 parsedFormData.coApplicants[0]:', parsedFormData.coApplicants?.[0]);
          console.log('🔍 parsedFormData.coApplicants[1]:', parsedFormData.coApplicants?.[1]);
          
          if (parsedFormData.hasCoApplicant && parsedFormData.coApplicants && Array.isArray(parsedFormData.coApplicants)) {
            console.log('🔧 ===== POPULATING CO-APPLICANT FORM FIELDS =====');
            console.log('🔧 Ensuring co-applicant form fields are populated');
            console.log('🔧 Number of co-applicants to populate:', parsedFormData.coApplicants.length);
            
            parsedFormData.coApplicants.forEach((coApp: any, index: number) => {
              console.log(`🔧 ===== PROCESSING CO-APPLICANT ${index} =====`);
              console.log(`🔧 Co-applicant ${index} data:`, coApp);
              console.log(`🔧 Co-applicant ${index} has data:`, coApp && Object.keys(coApp).length > 0);
              console.log(`🔧 Co-applicant ${index} keys:`, coApp ? Object.keys(coApp) : 'no data');
              console.log(`🔧 Co-applicant ${index} name: "${coApp?.name}", email: "${coApp?.email}"`);
              console.log(`🔄 FORM MAPPING: parsedFormData.coApplicants[${index}] -> form fields:`, {
                arrayIndex: index,
                name: coApp?.name,
                firstName: coApp?.firstName,
                lastName: coApp?.lastName,
                email: coApp?.email
              });
              
              if (coApp && Object.keys(coApp).length > 0) {
                console.log(`📝 Co-applicant ${index} has name:`, coApp.name);
                console.log(`📝 Co-applicant ${index} has email:`, coApp.email);
                
                // Parse name into first and last name if not already split
                let firstName = coApp.firstName;
                let lastName = coApp.lastName;
                
                if (!firstName && !lastName && coApp.name) {
                  const nameParts = coApp.name.split(' ');
                  firstName = nameParts[0] || '';
                  lastName = nameParts.slice(1).join(' ') || '';
                  console.log(`📝 Parsed name "${coApp.name}" into firstName: "${firstName}", lastName: "${lastName}"`);
                }
                
                if (firstName) {
                  console.log(`🔄 SETTING FORM FIELD: coApplicants.${index}.firstName = ${firstName}`);
                  form.setValue(`coApplicants.${index}.firstName` as any, firstName);
                  console.log(`✅ Set coApplicants.${index}.firstName = ${firstName}`);
                  // Verify the value was set
                  const verifyValue = form.getValues(`coApplicants.${index}.firstName` as any);
                  console.log(`🔍 Verified coApplicants.${index}.firstName = ${verifyValue}`);
                }
                if (lastName) {
                  console.log(`🔄 SETTING FORM FIELD: coApplicants.${index}.lastName = ${lastName}`);
                  form.setValue(`coApplicants.${index}.lastName` as any, lastName);
                  console.log(`✅ Set coApplicants.${index}.lastName = ${lastName}`);
                  // Verify the value was set
                  const verifyValue = form.getValues(`coApplicants.${index}.lastName` as any);
                  console.log(`🔍 Verified coApplicants.${index}.lastName = ${verifyValue}`);
                }
                if (coApp.name) {
                  form.setValue(`coApplicants.${index}.name`, coApp.name);
                  console.log(`✅ Set coApplicants.${index}.name = ${coApp.name}`);
                  // Verify the value was set
                  const verifyValue = form.getValues(`coApplicants.${index}.name` as any);
                  console.log(`🔍 Verified coApplicants.${index}.name = ${verifyValue}`);
                }
                if (coApp.relationship) {
                  form.setValue(`coApplicants.${index}.relationship`, coApp.relationship);
                  console.log(`✅ Set coApplicants.${index}.relationship = ${coApp.relationship}`);
                }
                if (coApp.dob) form.setValue(`coApplicants.${index}.dob`, new Date(coApp.dob));
                if (coApp.ssn) form.setValue(`coApplicants.${index}.ssn`, coApp.ssn);
                if (coApp.phone) form.setValue(`coApplicants.${index}.phone`, coApp.phone);
                if (coApp.email) {
                  console.log(`🔄 SETTING FORM FIELD: coApplicants.${index}.email = ${coApp.email}`);
                  form.setValue(`coApplicants.${index}.email`, coApp.email);
                  console.log(`✅ Set coApplicants.${index}.email = ${coApp.email}`);
                  // Verify the value was set
                  const verifyValue = form.getValues(`coApplicants.${index}.email` as any);
                  console.log(`🔍 Verified coApplicants.${index}.email = ${verifyValue}`);
                }
                
                // Immediately update formData state to ensure UI reflects the changes
                console.log(`🔧 Updating formData state for co-applicant ${index}`);
                setFormData((prevData: any) => {
                  const updated = { ...prevData };
                  if (!updated.coApplicants) updated.coApplicants = [];
                  if (!updated.coApplicants[index]) updated.coApplicants[index] = {};
                  
                  if (firstName) updated.coApplicants[index].firstName = firstName;
                  if (lastName) updated.coApplicants[index].lastName = lastName;
                  if (coApp.name) updated.coApplicants[index].name = coApp.name;
                  if (coApp.email) updated.coApplicants[index].email = coApp.email;
                  if (coApp.relationship) updated.coApplicants[index].relationship = coApp.relationship;
                  
                  console.log(`🔧 Updated formData.coApplicants[${index}] with:`, updated.coApplicants[index]);
                  return updated;
                });
              } else {
                console.log(`⚠️ Co-applicant ${index} has no data to populate`);
              }
            });
          } else {
            console.log('⚠️ No co-applicants to populate form fields for');
          }
          
          console.log('🔍 ===== CHECKING GUARANTOR FORM FIELDS =====');
          console.log('🔍 parsedFormData.hasGuarantor:', parsedFormData.hasGuarantor);
          console.log('🔍 parsedFormData.guarantors:', parsedFormData.guarantors);
          console.log('🔍 Array.isArray(parsedFormData.guarantors):', Array.isArray(parsedFormData.guarantors));
          
          if (parsedFormData.hasGuarantor && parsedFormData.guarantors && Array.isArray(parsedFormData.guarantors)) {
            console.log('🔧 ===== POPULATING GUARANTOR FORM FIELDS =====');
            console.log('🔧 Ensuring guarantor form fields are populated');
            console.log('🔧 Number of guarantors to populate:', parsedFormData.guarantors.length);
            
            parsedFormData.guarantors.forEach((guar: any, index: number) => {
              console.log(`🔧 ===== PROCESSING GUARANTOR ${index} =====`);
              console.log(`🔧 Guarantor ${index} data:`, guar);
              console.log(`🔧 Guarantor ${index} has data:`, guar && Object.keys(guar).length > 0);
              
              if (guar && Object.keys(guar).length > 0) {
                // Parse name into first and last name if not already split
                let firstName = guar.firstName;
                let lastName = guar.lastName;
                
                if (!firstName && !lastName && guar.name) {
                  const nameParts = guar.name.split(' ');
                  firstName = nameParts[0] || '';
                  lastName = nameParts.slice(1).join(' ') || '';
                  console.log(`📝 Parsed guarantor name "${guar.name}" into firstName: "${firstName}", lastName: "${lastName}"`);
                }
                
                if (firstName) form.setValue(`guarantors.${index}.firstName` as any, firstName);
                if (lastName) form.setValue(`guarantors.${index}.lastName` as any, lastName);
                if (guar.name) form.setValue(`guarantors.${index}.name`, guar.name);
                if (guar.relationship) form.setValue(`guarantors.${index}.relationship`, guar.relationship);
                if (guar.dob) form.setValue(`guarantors.${index}.dob`, new Date(guar.dob));
                if (guar.ssn) form.setValue(`guarantors.${index}.ssn`, guar.ssn);
                if (guar.phone) form.setValue(`guarantors.${index}.phone`, guar.phone);
                if (guar.email) form.setValue(`guarantors.${index}.email`, guar.email);
                if (guar.license) form.setValue(`guarantors.${index}.license`, guar.license);
                if (guar.licenseState) form.setValue(`guarantors.${index}.licenseState`, guar.licenseState);
                if (guar.address) form.setValue(`guarantors.${index}.address`, guar.address);
                if (guar.city) form.setValue(`guarantors.${index}.city`, guar.city);
                if (guar.state) form.setValue(`guarantors.${index}.state`, guar.state);
                if (guar.zip) form.setValue(`guarantors.${index}.zip`, guar.zip);
                
                // Immediately update formData state to ensure UI reflects the changes
                console.log(`🔧 Updating formData state for guarantor ${index}`);
                setFormData((prevData: any) => {
                  const updated = { ...prevData };
                  if (!updated.guarantors) updated.guarantors = [];
                  if (!updated.guarantors[index]) updated.guarantors[index] = {};
                  
                  if (firstName) updated.guarantors[index].firstName = firstName;
                  if (lastName) updated.guarantors[index].lastName = lastName;
                  if (guar.name) updated.guarantors[index].name = guar.name;
                  if (guar.email) updated.guarantors[index].email = guar.email;
                  if (guar.relationship) updated.guarantors[index].relationship = guar.relationship;
                  
                  console.log(`🔧 Updated formData.guarantors[${index}] with:`, updated.guarantors[index]);
                  return updated;
                });
              } else {
                console.log(`⚠️ Guarantor ${index} has no data to populate`);
              }
            });
          } else {
            console.log('⚠️ No guarantors to populate form fields for');
          }
          
          console.log('🔍 ===== FORM FIELD POPULATION END =====');
          
          // Force a re-render to ensure the form displays the populated values
          setTimeout(() => {
            console.log('🔧 ===== FINAL FORM VALUES CHECK =====');
            console.log('🔧 AUTO-POPULATION: Final form values after timeout:', form.getValues());
            
            // Update formData state to reflect the populated form values
            const currentFormValues = form.getValues();
            console.log('🔧 Current form values for co-applicants:', currentFormValues.coApplicants);
            console.log('🔧 Current form values for guarantors:', currentFormValues.guarantors);
            
            setFormData((prevData: any) => {
              const updated = { ...prevData };
              
              // Update co-applicants in formData
              if (currentFormValues.coApplicants && Array.isArray(currentFormValues.coApplicants)) {
                updated.coApplicants = currentFormValues.coApplicants;
                console.log('🔧 Updated formData.coApplicants with form values:', updated.coApplicants);
              }
              
              // Update guarantors in formData
              if (currentFormValues.guarantors && Array.isArray(currentFormValues.guarantors)) {
                updated.guarantors = currentFormValues.guarantors;
                console.log('🔧 Updated formData.guarantors with form values:', updated.guarantors);
              }
              
              console.log('🔧 Final updated formData:', updated);
              return updated;
            });
          }, 100);
          
            // Restore current step only if restoreStep is true
            if (restoreStep) {
              // Determine role-scoped sequential step from separate tables when available
              // If continuing without explicit role, infer role from saved data to avoid landing on wrong section
              let activeRole = userRole;
              try {
                const urlParams = new URLSearchParams(window.location.search);
                const continueFlag = urlParams.get('continue');
                const roleParam = urlParams.get('role');
                if (continueFlag === 'true' && !roleParam) {
                  const hasGuarantorData = !!(allData.guarantor && (allData.guarantor as any).guarantor_info);
                  const hasCoApplicantData = !!(allData.coApplicant && (allData.coApplicant as any).coapplicant_info);
                  let inferredRole = userRole;
                  if (hasGuarantorData && !hasCoApplicantData) inferredRole = 'guarantor1';
                  else if (hasCoApplicantData && !hasGuarantorData) inferredRole = 'coapplicant1';
                  if (inferredRole && inferredRole !== userRole) {
                    setUserRole(inferredRole);
                    setFilteredSteps(getFilteredSteps(inferredRole));
                    activeRole = inferredRole; // use immediately; state update is async
                    // Restore to the saved current step for the inferred role when available
                    let inferredSequential = 0;
                    try {
                      if (inferredRole.startsWith('guarantor')) {
                        const appId = (allData.application as any)?.appid as string | undefined;
                        if (appId) {
                          const guarantorsArr = await dynamoDBSeparateTablesUtils.getGuarantorsByAppId(appId);
                          if (Array.isArray(guarantorsArr) && guarantorsArr[0]) {
                            const gRec: any = guarantorsArr[0];
                            inferredSequential = (gRec?.current_step ?? 0) as number;
                          }
                        }
                        if (inferredSequential === 0) {
                          inferredSequential = (((allData.guarantor as any)?.current_step ?? 0)) as number;
                        }
                      } else if (inferredRole.startsWith('coapplicant')) {
                        const appId = (allData.application as any)?.appid as string | undefined;
                        if (appId) {
                          const coAppsArr = await dynamoDBSeparateTablesUtils.getCoApplicantsByAppId(appId);
                          if (Array.isArray(coAppsArr) && coAppsArr[0]) {
                            const cRec: any = coAppsArr[0];
                            inferredSequential = (cRec?.current_step ?? 0) as number;
                          }
                        }
                        if (inferredSequential === 0) {
                          inferredSequential = (((allData.coApplicant as any)?.current_step ?? 0)) as number;
                        }
                      }
                    } catch {}
                    const inferredActual = inferredSequential > 0 ? getActualStepFromSequential(inferredSequential, inferredRole) : (inferredRole.startsWith('guarantor') ? 9 : 5);
                    setCurrentStep(getFilteredIndexForActualId(inferredActual, inferredRole));
                  }
                } else if (roleParam) {
                  activeRole = roleParam;
                }
              } catch {}
             let sequentialStep: number = 0;
             try {
               if (activeRole?.startsWith('coapplicant')) {
                  const appId = (allData.application as any)?.appid as string | undefined;
                  if (specificIndex != null && appId) {
                    try {
                      const coAppsArr = await dynamoDBSeparateTablesUtils.getCoApplicantsByAppId(appId);
                      if (Array.isArray(coAppsArr) && coAppsArr[specificIndex]) {
                        const coRec: any = coAppsArr[specificIndex];
                        // If submitted, start from first step instead of final step
                        if (coRec?.status === 'submitted') {
                          sequentialStep = 1;
                        } else {
                          sequentialStep = (coRec?.current_step ?? 0) as number;
                        }
                      }
                    } catch (_e2) {}
                  }
                  if (sequentialStep === 0) {
                    const coObj: any = (allData.coApplicant as any);
                    // If submitted, start from first step instead of final step
                    if (coObj?.status === 'submitted') {
                      sequentialStep = 1;
                    } else {
                      sequentialStep = ((coObj?.current_step ?? (allData.application as any)?.current_step ?? 0)) as number;
                    }
                  }
               } else if (activeRole?.startsWith('guarantor')) {
                 const appId = (allData.application as any)?.appid as string | undefined;
                 if (specificIndex != null && appId) {
                   try {
                     const guarantorsArr = await dynamoDBSeparateTablesUtils.getGuarantorsByAppId(appId);
                     if (Array.isArray(guarantorsArr) && guarantorsArr[specificIndex]) {
                       const gRec: any = guarantorsArr[specificIndex];
                       // If submitted, start from first step instead of final step
                       if (gRec?.status === 'submitted') {
                         sequentialStep = 1;
                       } else {
                         sequentialStep = (gRec?.current_step ?? 0) as number;
                       }
                     }
                   } catch (_e3) {}
                 }
                 if (sequentialStep === 0) {
                   const gObj: any = (allData.guarantor as any);
                   // If submitted, start from first step instead of final step
                   if (gObj?.status === 'submitted') {
                     sequentialStep = 1;
                   } else {
                     sequentialStep = ((gObj?.current_step ?? (allData.application as any)?.current_step ?? 0)) as number;
                   }
                 }
               } else {
                 // Primary applicant or default
                 sequentialStep = ((allData.application as any)?.current_step ?? 0) as number;
               }
             } catch (_e) {
               sequentialStep = ((allData.application as any)?.current_step ?? 0) as number;
             }
             
            // Convert sequential step -> actual step id
             let actualStepId = getActualStepFromSequential(sequentialStep, activeRole || userRole);
            // Role guard: ensure we never land on another role's steps during restoration
             if ((activeRole || userRole)?.startsWith('guarantor')) {
              // Valid guarantor steps: 0, 9, 10, 11, 12
              if (![0, 9, 10, 11, 12].includes(actualStepId)) {
                actualStepId = 9; // Start at Guarantor
              }
              // Force filtered steps to guarantor-only to hide other roles' steps
              setFilteredSteps(getFilteredSteps('guarantor'));
             } else if ((activeRole || userRole)?.startsWith('coapplicant')) {
              // Valid co-applicant steps: 0, 5, 6, 7, 12
              if (![0, 5, 6, 7, 12].includes(actualStepId)) {
                actualStepId = 5; // Start at Co-Applicant
              }
              setFilteredSteps(getFilteredSteps('coapplicant'));
            }
             const targetFilteredIndex = getFilteredIndexForActualId(actualStepId, activeRole || userRole);
             setCurrentStep(targetFilteredIndex);
           }
          
          // Restore signatures
        if (parsedFormData.signatures) {
          setSignatures(parsedFormData.signatures);
          }
          
          // Restore webhook responses
          if (parsedFormData.webhookResponses) {
            setWebhookResponses(parsedFormData.webhookResponses);
            console.log('🔗 Set webhook responses state from formData:', parsedFormData.webhookResponses);
          }
          
          // Restore uploaded files metadata
        if (allData.application?.uploaded_files_metadata) {
          setUploadedFilesMetadata(allData.application.uploaded_files_metadata);
          }
          
          // Restore encrypted documents
        if (allData.application?.encrypted_documents) {
          setEncryptedDocuments(allData.application.encrypted_documents);
          }
          
          // Restore form values for React Hook Form
          if (parsedFormData.application) {
            const app = parsedFormData.application;
            console.log('🔧 Restoring application form values:', app);
            
            // Restore all application fields
            if (app.buildingAddress !== undefined) {
              form.setValue('buildingAddress', app.buildingAddress || '');
              updateFormData('application', 'buildingAddress', app.buildingAddress || '');
            }
            if (app.apartmentNumber !== undefined) {
              form.setValue('apartmentNumber', app.apartmentNumber || '');
              updateFormData('application', 'apartmentNumber', app.apartmentNumber || '');
            }
            if (app.apartmentType !== undefined) {
              form.setValue('apartmentType', app.apartmentType || '');
              updateFormData('application', 'apartmentType', app.apartmentType || '');
            }
            
            // Apartment fields restored from draft
            if (app.monthlyRent !== undefined) {
              form.setValue('monthlyRent', app.monthlyRent);
              updateFormData('application', 'monthlyRent', app.monthlyRent);
            }
            if (app.howDidYouHear) {
              form.setValue('howDidYouHear', app.howDidYouHear);
              // Set howDidYouHear
            }
            if (app.howDidYouHearOther) {
              form.setValue('howDidYouHearOther', app.howDidYouHearOther);
              // Set howDidYouHearOther
            }
            if (app.moveInDate) {
              const moveInDate = new Date(app.moveInDate);
              if (!isNaN(moveInDate.getTime())) {
                form.setValue('moveInDate', moveInDate);
                updateFormData('application', 'moveInDate', app.moveInDate);
              }
            }
            
            // Application form values restored
            
            // Verify the form values were actually set
            // Verify the form values were actually set
            setTimeout(() => {
              // Verifying form values after restoration
            }, 200);
          }
          
          if (parsedFormData.applicant) {
            const applicant = parsedFormData.applicant;
            if (applicant.name !== undefined) form.setValue('applicantName', applicant.name || '');
            if (applicant.email !== undefined) form.setValue('applicantEmail', applicant.email || '');
            if (applicant.phone !== undefined) form.setValue('applicantPhone', applicant.phone || '');
            if (applicant.address !== undefined) form.setValue('applicantAddress', applicant.address || '');
            if (applicant.city !== undefined) {
              form.setValue('applicantCity', applicant.city || '');
              // Set applicantCity
            }
            if (applicant.state !== undefined) {
              form.setValue('applicantState', applicant.state || '');
              // Set applicantState
            }
            if (applicant.zip !== undefined) {
              form.setValue('applicantZip', applicant.zip || '');
              // Set applicantZip
            }
            if (applicant.dob) {
              const dob = new Date(applicant.dob);
              if (!isNaN(dob.getTime())) {
                form.setValue('applicantDob', dob);
              }
            }
            
            // Restore length of stay fields
            if (applicant.lengthAtAddressYears !== undefined) {
              form.setValue('applicantLengthAtAddressYears', applicant.lengthAtAddressYears);
              // Set applicantLengthAtAddressYears
            }
            if (applicant.lengthAtAddressMonths !== undefined) {
              form.setValue('applicantLengthAtAddressMonths', applicant.lengthAtAddressMonths);
              // Set applicantLengthAtAddressMonths
            }
            
            // Restore landlord information
            if (applicant.landlordName !== undefined) {
              form.setValue('applicantLandlordName', applicant.landlordName || '');
              console.log('🏠 Set applicantLandlordName:', applicant.landlordName || '');
            }
            if (applicant.landlordAddressLine1 !== undefined) {
              form.setValue('applicantLandlordAddressLine1', applicant.landlordAddressLine1 || '');
              console.log('🏠 Set applicantLandlordAddressLine1:', applicant.landlordAddressLine1 || '');
            }
            if (applicant.landlordAddressLine2 !== undefined) {
              form.setValue('applicantLandlordAddressLine2', applicant.landlordAddressLine2 || '');
              console.log('🏠 Set applicantLandlordAddressLine2:', applicant.landlordAddressLine2 || '');
            }
            if (applicant.landlordCity !== undefined) {
              form.setValue('applicantLandlordCity', applicant.landlordCity || '');
              console.log('🏠 Set applicantLandlordCity:', applicant.landlordCity || '');
            }
            if (applicant.landlordState !== undefined) {
              form.setValue('applicantLandlordState', applicant.landlordState || '');
              console.log('🏠 Set applicantLandlordState:', applicant.landlordState || '');
            }
            if (applicant.landlordZipCode !== undefined) {
              form.setValue('applicantLandlordZipCode', applicant.landlordZipCode || '');
              // Set applicantLandlordZipCode
            }
            if (applicant.landlordPhone !== undefined) {
              form.setValue('applicantLandlordPhone', applicant.landlordPhone || '');
              // Set applicantLandlordPhone
            }
            if (applicant.landlordEmail !== undefined) {
              form.setValue('applicantLandlordEmail', applicant.landlordEmail || '');
              // Set applicantLandlordEmail
            }
            
            // Restore current rent and reason for moving
            if (applicant.currentRent !== undefined) {
              form.setValue('applicantCurrentRent', applicant.currentRent);
              // Set applicantCurrentRent
            }
            if (applicant.reasonForMoving !== undefined) {
              form.setValue('applicantReasonForMoving', applicant.reasonForMoving || '');
              // Set applicantReasonForMoving
            }
          }
          
          // Restore co-applicant information (use first entry in coApplicants array if present)
          {
            const coApplicant = (parsedFormData.coApplicants && Array.isArray(parsedFormData.coApplicants))
              ? (parsedFormData.coApplicants[0] || {})
              : (parsedFormData.coApplicant || {});
            if (coApplicant && Object.keys(coApplicant).length > 0) {
              if (coApplicant.email !== undefined) form.setValue('coApplicantEmail', coApplicant.email || '');
              if (coApplicant.phone !== undefined) form.setValue('coApplicantPhone', coApplicant.phone || '');
              if (coApplicant.zip !== undefined) form.setValue('coApplicantZip', coApplicant.zip || '');
              
              // Restore co-applicant landlord information (only fields that exist in schema)
              if (coApplicant.landlordZipCode !== undefined) {
                form.setValue('coApplicantLandlordZipCode', coApplicant.landlordZipCode || '');
              }
              if (coApplicant.landlordPhone !== undefined) {
                form.setValue('coApplicantLandlordPhone', coApplicant.landlordPhone || '');
              }
              if (coApplicant.landlordEmail !== undefined) {
                form.setValue('coApplicantLandlordEmail', coApplicant.landlordEmail || '');
              }
              
              // Auto-check co-applicant checkbox if there's co-applicant data but no explicit flag
              if (parsedFormData.hasCoApplicant === undefined && hasCoApplicantData(coApplicant)) {
                setHasCoApplicant(true);
                form.setValue('hasCoApplicant', true);
                setFormData((prev: any) => ({
                  ...prev,
                  hasCoApplicant: true
                }));
              }
            }
          }
          
          // Also check for coApplicants array (new format)
          if (parsedFormData.coApplicants && Array.isArray(parsedFormData.coApplicants) && parsedFormData.coApplicants.length > 0) {
            // Auto-check co-applicant checkbox if there's co-applicant data but no explicit flag
            if (parsedFormData.hasCoApplicant === undefined) {
              // Auto-detected co-applicant data, checking checkbox
              setHasCoApplicant(true);
              form.setValue('hasCoApplicant', true);
              // Also update formData state
              setFormData((prev: any) => ({
                ...prev,
                hasCoApplicant: true
              }));
            }
            
            // Set coApplicantCount based on the array length
            if (parsedFormData.coApplicantCount === undefined) {
              const count = parsedFormData.coApplicants.length;
              setFormData((prev: any) => ({
                ...prev,
                coApplicantCount: count
              }));
              form.setValue('coApplicantCount', count);
            }
            
            // Set form values for each co-applicant
            console.log('🔄 Setting form values for coApplicants:', parsedFormData.coApplicants);
            console.log('🔄 Co-applicants array length:', parsedFormData.coApplicants.length);
            parsedFormData.coApplicants.forEach((coApplicant: any, index: number) => {
              console.log(`📝 Setting form values for coApplicant[${index}]:`, coApplicant);
              console.log(`📝 Co-applicant ${index} has name:`, coApplicant.name);
              console.log(`📝 Co-applicant ${index} has email:`, coApplicant.email);
              if (coApplicant.name) form.setValue(`coApplicants.${index}.name`, coApplicant.name);
              if (coApplicant.relationship) form.setValue(`coApplicants.${index}.relationship`, coApplicant.relationship);
              if (coApplicant.dob) form.setValue(`coApplicants.${index}.dob`, new Date(coApplicant.dob));
              if (coApplicant.ssn) form.setValue(`coApplicants.${index}.ssn`, coApplicant.ssn);
              if (coApplicant.phone) form.setValue(`coApplicants.${index}.phone`, coApplicant.phone);
              if (coApplicant.email) form.setValue(`coApplicants.${index}.email`, coApplicant.email);
              if (coApplicant.license) form.setValue(`coApplicants.${index}.license`, coApplicant.license);
              if (coApplicant.licenseState) form.setValue(`coApplicants.${index}.licenseState`, coApplicant.licenseState);
              if (coApplicant.address) form.setValue(`coApplicants.${index}.address`, coApplicant.address);
              if (coApplicant.city) form.setValue(`coApplicants.${index}.city`, coApplicant.city);
              if (coApplicant.state) form.setValue(`coApplicants.${index}.state`, coApplicant.state);
              if (coApplicant.zip) form.setValue(`coApplicants.${index}.zip`, coApplicant.zip);
              if (coApplicant.lengthAtAddressYears !== undefined) form.setValue(`coApplicants.${index}.lengthAtAddressYears`, coApplicant.lengthAtAddressYears);
              if (coApplicant.lengthAtAddressMonths !== undefined) form.setValue(`coApplicants.${index}.lengthAtAddressMonths`, coApplicant.lengthAtAddressMonths);
              if (coApplicant.landlordName) form.setValue(`coApplicants.${index}.landlordName`, coApplicant.landlordName);
              if (coApplicant.landlordAddressLine1) form.setValue(`coApplicants.${index}.landlordAddressLine1`, coApplicant.landlordAddressLine1);
              if (coApplicant.landlordAddressLine2) form.setValue(`coApplicants.${index}.landlordAddressLine2`, coApplicant.landlordAddressLine2);
              if (coApplicant.landlordCity) form.setValue(`coApplicants.${index}.landlordCity`, coApplicant.landlordCity);
              if (coApplicant.landlordState) form.setValue(`coApplicants.${index}.landlordState`, coApplicant.landlordState);
              if (coApplicant.landlordZipCode) form.setValue(`coApplicants.${index}.landlordZipCode`, coApplicant.landlordZipCode);
              if (coApplicant.landlordPhone) form.setValue(`coApplicants.${index}.landlordPhone`, coApplicant.landlordPhone);
              if (coApplicant.landlordEmail) form.setValue(`coApplicants.${index}.landlordEmail`, coApplicant.landlordEmail);
              if (coApplicant.currentRent !== undefined) form.setValue(`coApplicants.${index}.currentRent`, coApplicant.currentRent);
              if (coApplicant.reasonForMoving) form.setValue(`coApplicants.${index}.reasonForMoving`, coApplicant.reasonForMoving);
              if (coApplicant.employmentType) form.setValue(`coApplicants.${index}.employmentType`, coApplicant.employmentType);
              if (coApplicant.employer) form.setValue(`coApplicants.${index}.employer`, coApplicant.employer);
              if (coApplicant.position) form.setValue(`coApplicants.${index}.position`, coApplicant.position);
              if (coApplicant.employmentStart) form.setValue(`coApplicants.${index}.employmentStart`, new Date(coApplicant.employmentStart));
              if (coApplicant.income) form.setValue(`coApplicants.${index}.income`, coApplicant.income);
              if (coApplicant.incomeFrequency) form.setValue(`coApplicants.${index}.incomeFrequency`, coApplicant.incomeFrequency);
              if (coApplicant.businessName) form.setValue(`coApplicants.${index}.businessName`, coApplicant.businessName);
              if (coApplicant.businessType) form.setValue(`coApplicants.${index}.businessType`, coApplicant.businessType);
              if (coApplicant.yearsInBusiness) form.setValue(`coApplicants.${index}.yearsInBusiness`, coApplicant.yearsInBusiness);
              if (coApplicant.otherIncome) form.setValue(`coApplicants.${index}.otherIncome`, coApplicant.otherIncome);
              if (coApplicant.otherIncomeFrequency) form.setValue(`coApplicants.${index}.otherIncomeFrequency`, coApplicant.otherIncomeFrequency);
              if (coApplicant.otherIncomeSource) form.setValue(`coApplicants.${index}.otherIncomeSource`, coApplicant.otherIncomeSource);
              if (coApplicant.bankRecords && Array.isArray(coApplicant.bankRecords)) {
                form.setValue(`coApplicants.${index}.bankRecords`, coApplicant.bankRecords);
              }
            });
            
            // Debug: Check if form values were set correctly
            console.log('🔍 Debug: Checking form values after setting co-applicants...');
            for (let i = 0; i < parsedFormData.coApplicants.length; i++) {
              const nameValue = form.getValues(`coApplicants.${i}.name`);
              const emailValue = form.getValues(`coApplicants.${i}.email`);
              console.log(`🔍 Form value coApplicants.${i}.name:`, nameValue);
              console.log(`🔍 Form value coApplicants.${i}.email:`, emailValue);
            }
          }
          
          // Restore guarantor information (only fields that exist in schema)
          if (parsedFormData.guarantor) {
            const guarantor = parsedFormData.guarantor;
            if (guarantor.email !== undefined) form.setValue('guarantorEmail', guarantor.email || '');
            if (guarantor.phone !== undefined) form.setValue('guarantorPhone', guarantor.phone || '');
            if (guarantor.zip !== undefined) form.setValue('guarantorZip', guarantor.zip || '');
            
            // Restore guarantor landlord information (only fields that exist in schema)
            if (guarantor.landlordZipCode !== undefined) {
              form.setValue('guarantorLandlordZipCode', guarantor.landlordZipCode || '');
              // Set guarantorLandlordZipCode
            }
            if (guarantor.landlordPhone !== undefined) {
              form.setValue('guarantorLandlordPhone', guarantor.landlordPhone || '');
              // Set guarantorLandlordPhone
            }
            if (guarantor.landlordEmail !== undefined) {
              form.setValue('guarantorLandlordEmail', guarantor.landlordEmail || '');
              // Set guarantorLandlordEmail
            }
            
            // Auto-check guarantor checkbox if there's guarantor data but no explicit flag
            if (parsedFormData.hasGuarantor === undefined && hasGuarantorData(guarantor)) {
              // Auto-detected guarantor data, checking checkbox
              setHasGuarantor(true);
              form.setValue('hasGuarantor', true);
              // Also update formData state
              setFormData((prev: any) => ({
                ...prev,
                hasGuarantor: true
              }));
            }
          }
          
          // Also check for guarantors array (new format)
          if (parsedFormData.guarantors && Array.isArray(parsedFormData.guarantors) && parsedFormData.guarantors.length > 0) {
            // Auto-check guarantor checkbox if there's guarantor data but no explicit flag
            if (parsedFormData.hasGuarantor === undefined) {
              // Auto-detected guarantor data, checking checkbox
              setHasGuarantor(true);
              form.setValue('hasGuarantor', true);
              // Also update formData state
              setFormData((prev: any) => ({
                ...prev,
                hasGuarantor: true
              }));
            }
            
            // Set guarantorCount based on the array length
            if (parsedFormData.guarantorCount === undefined) {
              const count = parsedFormData.guarantors.length;
              setFormData((prev: any) => ({
                ...prev,
                guarantorCount: count
              }));
              form.setValue('guarantorCount', count);
            }
            
            // Set form values for each guarantor
            parsedFormData.guarantors.forEach((guarantor: any, index: number) => {
              if (guarantor.name) form.setValue(`guarantors.${index}.name`, guarantor.name);
              if (guarantor.relationship) form.setValue(`guarantors.${index}.relationship`, guarantor.relationship);
              if (guarantor.dob) form.setValue(`guarantors.${index}.dob`, new Date(guarantor.dob));
              if (guarantor.ssn) form.setValue(`guarantors.${index}.ssn`, guarantor.ssn);
              if (guarantor.phone) form.setValue(`guarantors.${index}.phone`, guarantor.phone);
              if (guarantor.email) form.setValue(`guarantors.${index}.email`, guarantor.email);
              if (guarantor.license) form.setValue(`guarantors.${index}.license`, guarantor.license);
              if (guarantor.licenseState) form.setValue(`guarantors.${index}.licenseState`, guarantor.licenseState);
              if (guarantor.address) form.setValue(`guarantors.${index}.address`, guarantor.address);
              if (guarantor.city) form.setValue(`guarantors.${index}.city`, guarantor.city);
              if (guarantor.state) form.setValue(`guarantors.${index}.state`, guarantor.state);
              if (guarantor.zip) form.setValue(`guarantors.${index}.zip`, guarantor.zip);
              if (guarantor.lengthAtAddressYears !== undefined) form.setValue(`guarantors.${index}.lengthAtAddressYears`, guarantor.lengthAtAddressYears);
              if (guarantor.lengthAtAddressMonths !== undefined) form.setValue(`guarantors.${index}.lengthAtAddressMonths`, guarantor.lengthAtAddressMonths);
              if (guarantor.landlordName) form.setValue(`guarantors.${index}.landlordName`, guarantor.landlordName);
              if (guarantor.landlordAddressLine1) form.setValue(`guarantors.${index}.landlordAddressLine1`, guarantor.landlordAddressLine1);
              if (guarantor.landlordAddressLine2) form.setValue(`guarantors.${index}.landlordAddressLine2`, guarantor.landlordAddressLine2);
              if (guarantor.landlordCity) form.setValue(`guarantors.${index}.landlordCity`, guarantor.landlordCity);
              if (guarantor.landlordState) form.setValue(`guarantors.${index}.landlordState`, guarantor.landlordState);
              if (guarantor.landlordZipCode) form.setValue(`guarantors.${index}.landlordZipCode`, guarantor.landlordZipCode);
              if (guarantor.landlordPhone) form.setValue(`guarantors.${index}.landlordPhone`, guarantor.landlordPhone);
              if (guarantor.landlordEmail) form.setValue(`guarantors.${index}.landlordEmail`, guarantor.landlordEmail);
              if (guarantor.currentRent !== undefined) form.setValue(`guarantors.${index}.currentRent`, guarantor.currentRent);
              if (guarantor.reasonForMoving) form.setValue(`guarantors.${index}.reasonForMoving`, guarantor.reasonForMoving);
              if (guarantor.employmentType) form.setValue(`guarantors.${index}.employmentType`, guarantor.employmentType);
              if (guarantor.employer) form.setValue(`guarantors.${index}.employer`, guarantor.employer);
              if (guarantor.position) form.setValue(`guarantors.${index}.position`, guarantor.position);
              if (guarantor.employmentStart) form.setValue(`guarantors.${index}.employmentStart`, new Date(guarantor.employmentStart));
              if (guarantor.income) form.setValue(`guarantors.${index}.income`, guarantor.income);
              if (guarantor.incomeFrequency) form.setValue(`guarantors.${index}.incomeFrequency`, guarantor.incomeFrequency);
              if (guarantor.businessName) form.setValue(`guarantors.${index}.businessName`, guarantor.businessName);
              if (guarantor.businessType) form.setValue(`guarantors.${index}.businessType`, guarantor.businessType);
              if (guarantor.yearsInBusiness) form.setValue(`guarantors.${index}.yearsInBusiness`, guarantor.yearsInBusiness);
              if (guarantor.otherIncome) form.setValue(`guarantors.${index}.otherIncome`, guarantor.otherIncome);
              if (guarantor.otherIncomeFrequency) form.setValue(`guarantors.${index}.otherIncomeFrequency`, guarantor.otherIncomeFrequency);
              if (guarantor.otherIncomeSource) form.setValue(`guarantors.${index}.otherIncomeSource`, guarantor.otherIncomeSource);
              if (guarantor.bankRecords && Array.isArray(guarantor.bankRecords)) {
                form.setValue(`guarantors.${index}.bankRecords`, guarantor.bankRecords);
              }
            });
          }
          
          // Restore co-applicant and guarantor flags
          if (parsedFormData.hasCoApplicant !== undefined) {
            // Restoring hasCoApplicant
            setHasCoApplicant(parsedFormData.hasCoApplicant);
            // Also set the form field value to keep them in sync
            form.setValue('hasCoApplicant', parsedFormData.hasCoApplicant);
          }
          if (parsedFormData.hasGuarantor !== undefined) {
            // Restoring hasGuarantor
            setHasGuarantor(parsedFormData.hasGuarantor);
            // Also set the form field value to keep them in sync
            form.setValue('hasGuarantor', parsedFormData.hasGuarantor);
          }
          
          // Force form to re-render with the restored values
          setTimeout(() => {
            form.reset(form.getValues());
            // Form reset completed with values
            
            // Re-sync checkbox values after form reset to ensure they're properly maintained
            if (parsedFormData.hasCoApplicant !== undefined) {
              form.setValue('hasCoApplicant', parsedFormData.hasCoApplicant);
              // Re-syncing hasCoApplicant after form reset
              // Also ensure the state is in sync
              setHasCoApplicant(parsedFormData.hasCoApplicant);
            }
            if (parsedFormData.hasGuarantor !== undefined) {
              form.setValue('hasGuarantor', parsedFormData.hasGuarantor);
              // Re-syncing hasGuarantor after form reset
              // Also ensure the state is in sync
              setHasGuarantor(parsedFormData.hasGuarantor);
            }
            
            // Ensure apartment fields are properly synchronized after form reset
            if (parsedFormData.application?.buildingAddress) {
              form.setValue('buildingAddress', parsedFormData.application.buildingAddress);
              // Re-syncing buildingAddress after form reset
            }
            if (parsedFormData.application?.apartmentNumber) {
              form.setValue('apartmentNumber', parsedFormData.application.apartmentNumber);
              // Re-syncing apartmentNumber after form reset
            }
            if (parsedFormData.application?.apartmentType) {
              form.setValue('apartmentType', parsedFormData.application.apartmentType);
              // Re-syncing apartmentType after form reset
            }
          
            // Ensure city, state, and zip fields are properly synchronized after form reset
            if (parsedFormData.applicant?.city !== undefined) {
              form.setValue('applicantCity', parsedFormData.applicant.city || '');
              // Re-syncing applicantCity after form reset
            }
            if (parsedFormData.applicant?.state !== undefined) {
              form.setValue('applicantState', parsedFormData.applicant.state || '');
              // Re-syncing applicantState after form reset
            }
            if (parsedFormData.applicant?.zip !== undefined) {
              form.setValue('applicantZip', parsedFormData.applicant.zip || '');
              // Re-syncing applicantZip after form reset
            }
            
            // Ensure landlord fields are properly synchronized after form reset
            if (parsedFormData.applicant?.landlordName !== undefined) {
              form.setValue('applicantLandlordName', parsedFormData.applicant.landlordName || '');
              // Re-syncing applicantLandlordName after form reset
            }
            if (parsedFormData.applicant?.landlordAddressLine1 !== undefined) {
              form.setValue('applicantLandlordAddressLine1', parsedFormData.applicant.landlordAddressLine1 || '');
              // Re-syncing applicantLandlordAddressLine1 after form reset
            }
            if (parsedFormData.applicant?.landlordAddressLine2 !== undefined) {
              form.setValue('applicantLandlordAddressLine2', parsedFormData.applicant.landlordAddressLine2 || '');
              console.log('🏠 Re-syncing applicantLandlordAddressLine2 after form reset:', parsedFormData.applicant.landlordAddressLine2 || '');
            }
            if (parsedFormData.applicant?.landlordCity !== undefined) {
              form.setValue('applicantLandlordCity', parsedFormData.applicant.landlordCity || '');
              console.log('🏠 Re-syncing applicantLandlordCity after form reset:', parsedFormData.applicant.landlordCity || '');
            }
            if (parsedFormData.applicant?.landlordAddressLine2 !== undefined) {
              form.setValue('applicantLandlordAddressLine2', parsedFormData.applicant.landlordAddressLine2 || '');
              console.log('🏠 Re-syncing applicantLandlordAddressLine2 after form reset:', parsedFormData.applicant.landlordAddressLine2 || '');
            }
    if (parsedFormData.applicant?.landlordState !== undefined) {
      form.setValue('applicantLandlordState', parsedFormData.applicant.landlordState || '');
      console.log('🏠 Re-syncing applicantLandlordState after form reset:', parsedFormData.applicant.landlordState || '');
    }
    if (parsedFormData.applicant?.landlordZipCode !== undefined) {
      form.setValue('applicantLandlordZipCode', parsedFormData.applicant.landlordZipCode || '');
      console.log('🏠 Re-syncing applicantLandlordZipCode after form reset:', parsedFormData.applicant.landlordZipCode || '');
    }
    if (parsedFormData.applicant?.landlordPhone !== undefined) {
      form.setValue('applicantLandlordPhone', parsedFormData.applicant.landlordPhone || '');
      console.log('🏠 Re-syncing applicantLandlordPhone after form reset:', parsedFormData.applicant.landlordPhone || '');
    }
    if (parsedFormData.applicant?.landlordEmail !== undefined) {
      form.setValue('applicantLandlordEmail', parsedFormData.applicant.landlordEmail || '');
      console.log('🏠 Re-syncing applicantLandlordEmail after form reset:', parsedFormData.applicant.landlordEmail || '');
    }
    
    // Ensure other applicant fields are properly synchronized after form reset
    if (parsedFormData.applicant?.currentRent !== undefined) {
      form.setValue('applicantCurrentRent', parsedFormData.applicant.currentRent);
      console.log('💰 Re-syncing applicantCurrentRent after form reset:', parsedFormData.applicant.currentRent);
    }
    if (parsedFormData.applicant?.reasonForMoving !== undefined) {
      form.setValue('applicantReasonForMoving', parsedFormData.applicant.reasonForMoving || '');
      console.log('🏠 Re-syncing applicantReasonForMoving after form reset:', parsedFormData.applicant.reasonForMoving || '');
    }
    if (parsedFormData.applicant?.lengthAtAddressYears !== undefined) {
      form.setValue('applicantLengthAtAddressYears', parsedFormData.applicant.lengthAtAddressYears);
      console.log('⏰ Re-syncing applicantLengthAtAddressYears after form reset:', parsedFormData.applicant.lengthAtAddressYears);
    }
    if (parsedFormData.applicant?.lengthAtAddressMonths !== undefined) {
      form.setValue('applicantLengthAtAddressMonths', parsedFormData.applicant.lengthAtAddressMonths);
      console.log('⏰ Re-syncing applicantLengthAtAddressMonths after form reset:', parsedFormData.applicant.lengthAtAddressMonths);
    }
        // DISABLED: Ensure guarantor fields are properly synchronized after form reset
        // This section was overriding the correct rich data with wrong separate table data
        console.log('🔧 GUARANTOR RE-SYNC DEBUG: DISABLED - using main auto-population instead');
        /*
        console.log('🔧 GUARANTOR RE-SYNC DEBUG: Starting guarantor re-sync after form reset...');
        console.log('🔧 GUARANTOR RE-SYNC DEBUG: parsedFormData.guarantors:', parsedFormData.guarantors);
        console.log('🔧 GUARANTOR RE-SYNC DEBUG: Array.isArray(parsedFormData.guarantors):', Array.isArray(parsedFormData.guarantors));
        console.log('🔧 GUARANTOR RE-SYNC DEBUG: parsedFormData.guarantors.length:', parsedFormData.guarantors?.length || 0);
        console.log('🔧 GUARANTOR RE-SYNC DEBUG: Current userRole:', userRole);
        console.log('🔧 GUARANTOR RE-SYNC DEBUG: Current specificIndex:', specificIndex);
        console.log('🔧 GUARANTOR RE-SYNC DEBUG: User object role:', user?.role);
        
        // Determine the effective specific index for guarantor role in re-sync
        let effectiveSpecificIndexReSync = specificIndex;
        if (user && user.role && user.role.startsWith('guarantor') && /guarantor\d+/.test(user.role)) {
          const match = user.role.match(/guarantor(\d+)/);
          if (match) {
            effectiveSpecificIndexReSync = parseInt(match[1], 10) - 1; // Convert to 0-based index
            console.log('🔧 GUARANTOR RE-SYNC DEBUG: Using effective specific index from user role:', effectiveSpecificIndexReSync);
          }
        }
    
    if (parsedFormData.guarantors && Array.isArray(parsedFormData.guarantors) && parsedFormData.guarantors.length > 0) {
      console.log('🔧 GUARANTOR RE-SYNC DEBUG: Re-syncing guarantor data after form reset...');
      
      // For specific role (guarantor1, guarantor2, etc.), only re-sync the specific index
      if (effectiveSpecificIndexReSync !== null && effectiveSpecificIndexReSync !== undefined) {
        console.log(`🔧 GUARANTOR RE-SYNC DEBUG: Specific role detected - re-syncing only guarantor ${effectiveSpecificIndexReSync}`);
        const guarantor = parsedFormData.guarantors[effectiveSpecificIndexReSync];
        console.log(`🔧 GUARANTOR RE-SYNC DEBUG: Using guarantor data:`, guarantor);
        if (guarantor && Object.keys(guarantor).length > 0) {
          console.log(`🔧 GUARANTOR RE-SYNC DEBUG: Re-setting form values for specific guarantor ${effectiveSpecificIndexReSync}`);
          
          // Re-set basic guarantor fields with detailed logging
          if (guarantor.name) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.name`, guarantor.name);
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.name = ${guarantor.name}`);
          }
          if (guarantor.relationship) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.relationship`, guarantor.relationship);
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.relationship = ${guarantor.relationship}`);
          }
          if (guarantor.dob) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.dob`, new Date(guarantor.dob));
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.dob = ${guarantor.dob}`);
          }
          if (guarantor.ssn) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.ssn`, guarantor.ssn);
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.ssn = ${guarantor.ssn}`);
          }
          if (guarantor.phone) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.phone`, guarantor.phone);
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.phone = ${guarantor.phone}`);
          }
          if (guarantor.email) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.email`, guarantor.email);
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.email = ${guarantor.email}`);
          }
          if (guarantor.address) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.address`, guarantor.address);
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.address = ${guarantor.address}`);
          }
          if (guarantor.city) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.city`, guarantor.city);
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.city = ${guarantor.city}`);
          }
          if (guarantor.state) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.state`, guarantor.state);
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.state = ${guarantor.state}`);
          }
          if (guarantor.zip) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.zip`, guarantor.zip);
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.zip = ${guarantor.zip}`);
          }
          if (guarantor.license) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.license`, guarantor.license);
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.license = ${guarantor.license}`);
          }
          if (guarantor.licenseState) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.licenseState`, guarantor.licenseState);
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.licenseState = ${guarantor.licenseState}`);
          }
          if (guarantor.lengthAtAddressYears !== undefined) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.lengthAtAddressYears`, guarantor.lengthAtAddressYears);
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.lengthAtAddressYears = ${guarantor.lengthAtAddressYears}`);
          }
          if (guarantor.lengthAtAddressMonths !== undefined) {
            form.setValue(`guarantors.${effectiveSpecificIndexReSync}.lengthAtAddressMonths`, guarantor.lengthAtAddressMonths);
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${effectiveSpecificIndexReSync}.lengthAtAddressMonths = ${guarantor.lengthAtAddressMonths}`);
          }
          
          console.log(`✅ GUARANTOR RE-SYNC DEBUG: Completed re-syncing specific guarantor ${effectiveSpecificIndexReSync} form fields`);
        } else {
          console.log(`⚠️ GUARANTOR RE-SYNC DEBUG: No data found for specific guarantor ${effectiveSpecificIndexReSync}`);
        }
      } else {
        // For general loading, re-sync all guarantors
        console.log('🔧 GUARANTOR RE-SYNC DEBUG: General loading - re-syncing all guarantors');
        parsedFormData.guarantors.forEach((guarantor: any, index: number) => {
          console.log(`🔧 GUARANTOR RE-SYNC DEBUG: Re-processing guarantor ${index}:`, {
            hasGuarantor: !!guarantor,
            guarantorKeys: guarantor ? Object.keys(guarantor) : [],
            guarantorName: guarantor?.name || 'NO NAME'
          });
          
          if (guarantor && Object.keys(guarantor).length > 0) {
            console.log(`🔧 GUARANTOR RE-SYNC DEBUG: Re-setting form values for guarantor ${index}`);
            
            // Re-set basic guarantor fields with detailed logging
            if (guarantor.name) {
              form.setValue(`guarantors.${index}.name`, guarantor.name);
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.name = ${guarantor.name}`);
            }
            if (guarantor.relationship) {
              form.setValue(`guarantors.${index}.relationship`, guarantor.relationship);
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.relationship = ${guarantor.relationship}`);
            }
            if (guarantor.dob) {
              form.setValue(`guarantors.${index}.dob`, new Date(guarantor.dob));
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.dob = ${guarantor.dob}`);
            }
            if (guarantor.ssn) {
              form.setValue(`guarantors.${index}.ssn`, guarantor.ssn);
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.ssn = ${guarantor.ssn}`);
            }
            if (guarantor.phone) {
              form.setValue(`guarantors.${index}.phone`, guarantor.phone);
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.phone = ${guarantor.phone}`);
            }
            if (guarantor.email) {
              form.setValue(`guarantors.${index}.email`, guarantor.email);
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.email = ${guarantor.email}`);
            }
            if (guarantor.address) {
              form.setValue(`guarantors.${index}.address`, guarantor.address);
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.address = ${guarantor.address}`);
            }
            if (guarantor.city) {
              form.setValue(`guarantors.${index}.city`, guarantor.city);
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.city = ${guarantor.city}`);
            }
            if (guarantor.state) {
              form.setValue(`guarantors.${index}.state`, guarantor.state);
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.state = ${guarantor.state}`);
            }
            if (guarantor.zip) {
              form.setValue(`guarantors.${index}.zip`, guarantor.zip);
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.zip = ${guarantor.zip}`);
            }
            if (guarantor.license) {
              form.setValue(`guarantors.${index}.license`, guarantor.license);
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.license = ${guarantor.license}`);
            }
            if (guarantor.licenseState) {
              form.setValue(`guarantors.${index}.licenseState`, guarantor.licenseState);
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.licenseState = ${guarantor.licenseState}`);
            }
            if (guarantor.lengthAtAddressYears !== undefined) {
              form.setValue(`guarantors.${index}.lengthAtAddressYears`, guarantor.lengthAtAddressYears);
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.lengthAtAddressYears = ${guarantor.lengthAtAddressYears}`);
            }
            if (guarantor.lengthAtAddressMonths !== undefined) {
              form.setValue(`guarantors.${index}.lengthAtAddressMonths`, guarantor.lengthAtAddressMonths);
              console.log(`✅ GUARANTOR RE-SYNC DEBUG: Re-set guarantors.${index}.lengthAtAddressMonths = ${guarantor.lengthAtAddressMonths}`);
            }
            
            console.log(`✅ GUARANTOR RE-SYNC DEBUG: Completed re-syncing guarantor ${index} form fields`);
          } else {
            console.log(`⚠️ GUARANTOR RE-SYNC DEBUG: No data found for guarantor ${index}`);
          }
        });
      }
    } else {
      console.log('⚠️ GUARANTOR RE-SYNC DEBUG: No guarantor data to re-sync after form reset');
    }
    */
    
    // Final verification of guarantor form values after re-sync
    setTimeout(() => {
      console.log('🔍 GUARANTOR FINAL VERIFICATION: Checking form values after re-sync...');
      if (parsedFormData.guarantors && Array.isArray(parsedFormData.guarantors) && parsedFormData.guarantors.length > 0) {
        parsedFormData.guarantors.forEach((guarantor: any, index: number) => {
          if (guarantor && Object.keys(guarantor).length > 0) {
            const formName = form.getValues(`guarantors.${index}.name`);
            const formEmail = form.getValues(`guarantors.${index}.email`);
            const formPhone = form.getValues(`guarantors.${index}.phone`);
            console.log(`🔍 GUARANTOR FINAL VERIFICATION: Guarantor ${index} form values:`, {
              formName: formName,
              formEmail: formEmail,
              formPhone: formPhone,
              expectedName: guarantor.name,
              expectedEmail: guarantor.email,
              expectedPhone: guarantor.phone,
              nameMatch: formName === guarantor.name,
              emailMatch: formEmail === guarantor.email,
              phoneMatch: formPhone === guarantor.phone
            });
            
            // Log success or warning
            if (formName === guarantor.name && formEmail === guarantor.email && formPhone === guarantor.phone) {
              console.log(`✅ GUARANTOR FINAL VERIFICATION: Guarantor ${index} form values match expected values - SUCCESS!`);
            } else {
              console.warn(`⚠️ GUARANTOR FINAL VERIFICATION: Guarantor ${index} form values don't match expected values - ISSUE DETECTED!`);
            }
          }
        });
      }
    }, 200);
    
          // Log the final checkbox states after restoration
      console.log('🎯 Final checkbox states after restoration:', {
        hasCoApplicant: parsedFormData.hasCoApplicant,
        hasGuarantor: parsedFormData.hasGuarantor,
        coApplicantDataExists: parsedFormData.coApplicant ? hasCoApplicantData(parsedFormData.coApplicant) : false,
        coApplicantsDataExists: parsedFormData.coApplicants && Array.isArray(parsedFormData.coApplicants) && parsedFormData.coApplicants.length > 0,
        guarantorDataExists: parsedFormData.guarantor ? hasGuarantorData(parsedFormData.guarantor) : false,
        guarantorsDataExists: parsedFormData.guarantors && Array.isArray(parsedFormData.guarantors) && parsedFormData.guarantors.length > 0,
        coApplicantKeys: parsedFormData.coApplicant ? Object.keys(parsedFormData.coApplicant) : [],
        guarantorKeys: parsedFormData.guarantor ? Object.keys(parsedFormData.guarantor) : [],
        coApplicantsLength: parsedFormData.coApplicants ? parsedFormData.coApplicants.length : 0,
        guarantorsLength: parsedFormData.guarantors ? parsedFormData.guarantors.length : 0
      });
      // Force a re-render by updating the formData state
      setFormData((prev: any) => ({
        ...prev,
        application: {
        ...prev.application,
        apartmentNumber: parsedFormData.application?.apartmentNumber || '',
        apartmentType: parsedFormData.application?.apartmentType || ''
      },
      applicant: {
        ...prev.applicant,
        city: parsedFormData.applicant?.city || '',
        state: parsedFormData.applicant?.state || '',
        zip: parsedFormData.applicant?.zip || '',
        landlordName: parsedFormData.applicant?.landlordName || '',
        landlordAddressLine1: parsedFormData.applicant?.landlordAddressLine1 || '',
        landlordAddressLine2: parsedFormData.applicant?.landlordAddressLine2 || '',
        landlordCity: parsedFormData.applicant?.landlordCity || '',
        landlordState: parsedFormData.applicant?.landlordState || '',
        landlordZipCode: parsedFormData.applicant?.landlordZipCode || '',
        landlordPhone: parsedFormData.applicant?.landlordPhone || '',
        landlordEmail: parsedFormData.applicant?.landlordEmail || '',
        currentRent: parsedFormData.applicant?.currentRent,
        reasonForMoving: parsedFormData.applicant?.reasonForMoving || '',
        lengthAtAddressYears: parsedFormData.applicant?.lengthAtAddressYears,
        lengthAtAddressMonths: parsedFormData.applicant?.lengthAtAddressMonths
      },
      // Restore co-applicants array
      coApplicants: parsedFormData.coApplicants || [],
      // Restore guarantors array
      guarantors: parsedFormData.guarantors || [],
      // Restore occupants array
      occupants: parsedFormData.occupants || []
    }));
    }, 100);
          
          // If we have building data, ensure the apartments are loaded
          if (parsedFormData.application?.buildingAddress) {
            console.log('🏠 Restoring building and apartment selection...');
            // Restore building selection without auto-selecting first unit
            await restoreBuildingSelection(
              parsedFormData.application.buildingAddress,
              parsedFormData.application.apartmentNumber,
              parsedFormData.application.apartmentType
            );
          }
          
          toast({
            title: "Draft Loaded",
            description: "Your previous draft has been restored. You can continue from where you left off.",
          });
      } else {
        console.log('📭 No draft data found in separate tables; trying legacy draft fallback...');
        // Fallback: try to load legacy single-table draft (by most recent for current user)
        try {
          const drafts = await legacyDraftUtils.getAllDraftsForCurrentUser();
          if (drafts && drafts.length > 0) {
            const latest = drafts[0];
            console.log('📦 Loaded legacy draft for mapping:', latest);
            const fd = latest.form_data || {};
            const parsedFormData: any = {
              application: fd.application || {},
              applicant: fd.applicant || {},
              coApplicant: (fd.coApplicants && fd.coApplicants[0]) || {},
              guarantor: (fd.guarantors && fd.guarantors[0]) || {},
              coApplicants: fd.coApplicants || [],
              guarantors: fd.guarantors || [],
              occupants: fd.occupants || [],
              webhookSummary: latest.webhook_responses || {},
              signatures: latest.signatures || {},
              uploaded_files_metadata: latest.uploaded_files_metadata || {},
              encrypted_documents: latest.encrypted_documents || {},
              current_step: latest.current_step || 0,
              status: latest.status || 'draft'
            };
            // Normalize key variants used in legacy drafts
            const app = parsedFormData.application as any;
            app.buildingAddress = app.buildingAddress || app.building_address || app.address || '';
            app.apartmentNumber = app.apartmentNumber || app.unitNumber || app.apartment || app.unit || '';
            app.apartmentType = app.apartmentType || app.apartment_type || app.unitType || app.unit_type || '';
            if (typeof app.monthlyRent === 'undefined') {
              app.monthlyRent = typeof app.rent !== 'undefined' ? app.rent : app.monthly_rent;
            }
            if (app.move_in_date && !app.moveInDate) app.moveInDate = app.move_in_date;

            const ap = (parsedFormData.applicant = parsedFormData.applicant || {}) as any;
            ap.name = ap.name || ap.fullName || ap.full_name || '';
            ap.email = ap.email || ap.mail || '';
            ap.phone = ap.phone || ap.phoneNumber || ap.phone_number || '';
            ap.address = ap.address || ap.addressLine1 || ap.address1 || ap.street || '';
            ap.city = ap.city || ap.town || '';
            ap.state = ap.state || ap.region || '';
            ap.zip = ap.zip || ap.zipCode || ap.postalCode || ap.postal_code || '';
            if (ap.date_of_birth && !ap.dob) ap.dob = ap.date_of_birth;
            ap.employmentType = ap.employmentType || ap.employment_type || ap.employment || ap.applicant_employmentType || '';
            ap.landlordName = ap.landlordName || ap.landlord_name || '';
            ap.landlordAddressLine1 = ap.landlordAddressLine1 || ap.landlord_address_line1 || ap.landlord_address || '';
            ap.landlordAddressLine2 = ap.landlordAddressLine2 || ap.landlord_address_line2 || '';
            ap.landlordCity = ap.landlordCity || ap.landlord_city || '';
            ap.landlordState = ap.landlordState || ap.landlord_state || '';
            ap.landlordZipCode = ap.landlordZipCode || ap.landlord_zip || ap.landlord_zip_code || '';
            ap.landlordPhone = ap.landlordPhone || ap.landlord_phone || '';
            ap.landlordEmail = ap.landlordEmail || ap.landlord_email || '';

            // Merge webhook responses if nested under webhookSummary.webhookResponses
            if (parsedFormData.webhookSummary?.webhookResponses) {
              parsedFormData.webhook_responses = {
                ...parsedFormData.webhook_responses,
                ...parsedFormData.webhookSummary.webhookResponses
              };
              
              // Auto-map webhook responses to form fields during legacy data loading
              const webhookResponses = parsedFormData.webhookSummary.webhookResponses;
              if (webhookResponses && typeof webhookResponses === 'object') {
                console.log('🔄 Auto-mapping webhook responses during legacy data loading...');
                
                // Process each webhook response
                Object.entries(webhookResponses).forEach(([key, value]) => {
                  if (typeof value === 'string' && value.startsWith('http')) {
                    console.log(`📎 Mapping webhook response during legacy load: ${key} -> ${value}`);
                    
                    // Map to appropriate form field based on key pattern
                    if (key.includes('coApplicants_') && key.includes('_photo_id')) {
                      // This is a co-applicant photo ID document
                      const coApplicantIndex = key.match(/coApplicants_(\d+)_/)?.[1];
                      if (coApplicantIndex !== undefined) {
                        const index = parseInt(coApplicantIndex);
                        if (!parsedFormData.coApplicants) parsedFormData.coApplicants = [];
                        if (!parsedFormData.coApplicants[index]) parsedFormData.coApplicants[index] = {};
                        
                        // Map to the appropriate field in co-applicant data
                        parsedFormData.coApplicants[index].photoIdUrl = value;
                        
                        console.log(`✅ Mapped co-applicant ${index} photo ID URL during legacy load:`, value);
                      }
                    } else if (key.includes('applicant_') && key.includes('_photo_id')) {
                      // This is an applicant photo ID document
                      if (!parsedFormData.applicant) parsedFormData.applicant = {};
                      parsedFormData.applicant.photoIdUrl = value;
                      
                      console.log(`✅ Mapped applicant photo ID URL during legacy load:`, value);
                    } else if (key.includes('guarantor_') && key.includes('_photo_id')) {
                      // This is a guarantor photo ID document
                      const guarantorIndex = key.match(/guarantor_(\d+)_/)?.[1];
                      if (guarantorIndex !== undefined) {
                        const index = parseInt(guarantorIndex);
                        if (!parsedFormData.guarantors) parsedFormData.guarantors = [];
                        if (!parsedFormData.guarantors[index]) parsedFormData.guarantors[index] = {};
                        
                        // Map to the appropriate field in guarantor data
                        parsedFormData.guarantors[index].photoIdUrl = value;
                        
                        console.log(`✅ Mapped guarantor ${index} photo ID URL during legacy load:`, value);
                      }
                    }
                  }
                });
              }
            }

             setFormData(parsedFormData);
            if (restoreStep) {
              // Convert sequential step -> actual step id -> filtered index
              const actualStepId = getActualStepFromSequential(parsedFormData.current_step || 0, userRole);
              const targetFilteredIndex = getFilteredIndexForActualId(actualStepId, userRole);
              setCurrentStep(targetFilteredIndex);
            }
            if (parsedFormData.signatures) setSignatures(parsedFormData.signatures);
            if (parsedFormData.webhook_responses) setWebhookResponses(parsedFormData.webhook_responses);

            // Try restoring building/unit selection if present
            if (parsedFormData.application?.buildingAddress) {
              await restoreBuildingSelection(
                parsedFormData.application.buildingAddress,
                parsedFormData.application.apartmentNumber,
                parsedFormData.application.apartmentType
              );
            }

            setHasExistingDraft(true);
            toast({ title: 'Draft Loaded', description: 'Your previous draft has been restored from legacy storage.' });
          } else {
            console.log('📭 No draft data found or draft already submitted');
          }
        } catch (legacyErr) {
          console.warn('⚠️ Legacy draft fallback failed:', legacyErr);
        }
      }
    } catch (error) {
      console.error('❌ Error loading draft data:', error);
      toast({
        title: "Draft Load Error",
        description: "Failed to load your previous draft. Starting with a fresh form.",
        variant: "destructive",
      });
    }
  }, [user, userRole, specificIndex, form, toast, setHasExistingDraft, setFormData, setCurrentStep, setSignatures, setWebhookResponses, setUploadedFilesMetadata, setEncryptedDocuments, setHasCoApplicant, setHasGuarantor, hasCoApplicantData, hasGuarantorData, getActualStepFromSequential]);
  // Track if initial load has happened to prevent multiple triggers
  const initialLoadRef = useRef(false);
  const isSyncingGuarantorRef = useRef(false);
  
  // Set up welcome message and load draft data
  useEffect(() => {
    if (user && !initialLoadRef.current) {
      initialLoadRef.current = true;
      const userName = user.name || user.given_name || user.email?.split('@')[0] || 'User';
      setWelcomeMessage(`Welcome back, ${userName}!`);
      
      // Check if we should continue an existing application
      const urlParams = new URLSearchParams(window.location.search);
      const shouldContinue = urlParams.get('continue') === 'true';
      const stepParam = urlParams.get('step');
      const roleParam = urlParams.get('role');
      
      // Set role and update filtered steps - prioritize URL param over user role
      if (roleParam) {
        console.log('🔍 Setting user role from URL parameter:', roleParam);
        setUserRole(roleParam);
        setFilteredSteps(getFilteredSteps(roleParam));
        // Jump to the first relevant step for the role
        {
          const startActualId = roleParam.startsWith('guarantor') ? 9 : (roleParam.startsWith('coapplicant') ? 5 : 1);
          setCurrentStep(getFilteredIndexForActualId(startActualId, roleParam));
        }
        
        // Parse specific index for coapplicant1, coapplicant2, guarantor1, guarantor2, etc.
        if (roleParam.startsWith('coapplicant') && /coapplicant\d+/.test(roleParam)) {
          const match = roleParam.match(/coapplicant(\d+)/);
          if (match) {
            const index = parseInt(match[1], 10) - 1; // Convert to 0-based index
            setSpecificIndex(index);
            
            // Ensure coApplicants array has enough elements for this specific index
            setFormData((prev: any) => {
              const currentCoApplicants = prev.coApplicants || [];
              if (index >= currentCoApplicants.length) {
                // Extend array to accommodate the specific index
                const newCoApplicants = [...currentCoApplicants];
                for (let i = currentCoApplicants.length; i <= index; i++) {
                  newCoApplicants[i] = {
                    name: '',
                    email: '',
                    phone: '',
                    relationship: '',
                    dob: undefined,
                    age: '',
                    ssn: '',
                    license: '',
                    licenseState: '',
                    address: '',
                    city: '',
                    state: '',
                    zip: '',
                    lengthAtAddressYears: undefined,
                    lengthAtAddressMonths: undefined,
                    landlordName: '',
                    landlordAddressLine1: '',
                    landlordAddressLine2: '',
                    landlordCity: '',
                    landlordState: '',
                    landlordZipCode: '',
                    landlordPhone: '',
                    landlordEmail: '',
                    currentRent: undefined,
                    reasonForMoving: '',
                    employmentType: '',
                    bankRecords: []
                  };
                }
                return {
                  ...prev,
                  coApplicants: newCoApplicants,
                  coApplicantCount: Math.max(prev.coApplicantCount || 0, index + 1),
                  hasCoApplicant: true
                };
              }
              return prev;
            });
          }
        } else if (roleParam.startsWith('guarantor') && /guarantor\d+/.test(roleParam)) {
          const match = roleParam.match(/guarantor(\d+)/);
          if (match) {
            const index = parseInt(match[1], 10) - 1; // Convert to 0-based index
            setSpecificIndex(index);
            
            // Ensure guarantors array has enough elements for this specific index
            setFormData((prev: any) => {
              const currentGuarantors = prev.guarantors || [];
              if (index >= currentGuarantors.length) {
                // Extend array to accommodate the specific index
                const newGuarantors = [...currentGuarantors];
                for (let i = currentGuarantors.length; i <= index; i++) {
                  newGuarantors[i] = {
                    name: '',
                    email: '',
                    phone: '',
                    relationship: '',
                    dob: undefined,
                    age: '',
                    ssn: '',
                    license: '',
                    licenseState: '',
                    address: '',
                    city: '',
                    state: '',
                    zip: '',
                    lengthAtAddressYears: undefined,
                    lengthAtAddressMonths: undefined,
                    employmentType: '',
                    bankRecords: []
                  };
                }
                return {
                  ...prev,
                  guarantors: newGuarantors,
                  guarantorCount: Math.max(prev.guarantorCount || 0, index + 1),
                  hasGuarantor: true
                };
              }
              return prev;
            });
          }
        } else {
          setSpecificIndex(null);
        }
      } else if (user && user.role) {
        // Fallback to Cognito custom:role when URL param is absent
        const roleFromUser = user.role;
        console.log('🔍 Setting user role from logged-in user (fallback):', roleFromUser);
        setUserRole(roleFromUser);
        setFilteredSteps(getFilteredSteps(roleFromUser));
        // Jump to the first relevant step for the role
        {
          const startActualId = roleFromUser.startsWith('guarantor') ? 9 : (roleFromUser.startsWith('coapplicant') ? 5 : 1);
          setCurrentStep(getFilteredIndexForActualId(startActualId, roleFromUser));
        }

        if (roleFromUser.startsWith('coapplicant') && /coapplicant\d+/.test(roleFromUser)) {
          const match = roleFromUser.match(/coapplicant(\d+)/);
          if (match) {
            const index = parseInt(match[1], 10) - 1; // Convert to 0-based index
            setSpecificIndex(index);
            // Ensure coApplicants array has enough elements for this specific index
            setFormData((prev: any) => {
              const currentCoApplicants = prev.coApplicants || [];
              if (index >= currentCoApplicants.length) {
                // Extend array to accommodate the specific index
                const newCoApplicants = [...currentCoApplicants];
                for (let i = currentCoApplicants.length; i <= index; i++) {
                  newCoApplicants[i] = {
                    name: '',
                    email: '',
                    phone: '',
                    relationship: '',
                    dob: undefined,
                    age: '',
                    ssn: '',
                    license: '',
                    licenseState: '',
                    address: '',
                    city: '',
                    state: '',
                    zip: '',
                    lengthAtAddressYears: undefined,
                    lengthAtAddressMonths: undefined,
                    landlordName: '',
                    landlordAddressLine1: '',
                    landlordAddressLine2: '',
                    landlordCity: '',
                    landlordState: '',
                    landlordZipCode: '',
                    landlordPhone: '',
                    landlordEmail: '',
                    currentRent: undefined,
                    reasonForMoving: '',
                    employmentType: '',
                    employer: '',
                    position: '',
                    employmentStart: undefined,
                    income: '',
                    incomeFrequency: 'yearly',
                    businessName: '',
                    businessType: '',
                    yearsInBusiness: '',
                    otherIncome: '',
                    otherIncomeFrequency: 'monthly',
                    otherIncomeSource: '',
                    bankRecords: []
                  };
                }
                return {
                  ...prev,
                  coApplicants: newCoApplicants,
                  coApplicantCount: Math.max(prev.coApplicantCount || 0, index + 1),
                  hasCoApplicant: true
                };
              }
              return prev;
            });
          }
        } else if (roleFromUser.startsWith('guarantor') && /guarantor\d+/.test(roleFromUser)) {
          const match = roleFromUser.match(/guarantor(\d+)/);
          if (match) {
            const index = parseInt(match[1], 10) - 1; // Convert to 0-based index
            setSpecificIndex(index);
            // Ensure guarantors array has enough elements for this specific index
            setFormData((prev: any) => {
              const currentGuarantors = prev.guarantors || [];
              if (index >= currentGuarantors.length) {
                // Extend array to accommodate the specific index
                const newGuarantors = [...currentGuarantors];
                for (let i = currentGuarantors.length; i <= index; i++) {
                  newGuarantors[i] = {
                    name: '',
                    email: '',
                    phone: '',
                    relationship: '',
                    dob: undefined,
                    age: '',
                    ssn: '',
                    license: '',
                    licenseState: '',
                    address: '',
                    city: '',
                    state: '',
                    zip: '',
                    lengthAtAddressYears: undefined,
                    lengthAtAddressMonths: undefined,
                    employmentType: '',
                    employer: '',
                    position: '',
                    employmentStart: undefined,
                    income: '',
                    incomeFrequency: 'yearly',
                    businessName: '',
                    businessType: '',
                    yearsInBusiness: '',
                    otherIncome: '',
                    otherIncomeFrequency: 'monthly',
                    otherIncomeSource: '',
                    bankRecords: []
                  };
                }
                return {
                  ...prev,
                  guarantors: newGuarantors,
                  guarantorCount: Math.max(prev.guarantorCount || 0, index + 1),
                  hasGuarantor: true
                };
              }
              return prev;
            });
          }
        } else {
          setSpecificIndex(null);
        }
      } else {
        // Default fallback: set role to 'applicant' if no role is specified
        console.log('🔍 No role specified, defaulting to applicant');
        setUserRole('applicant');
        setFilteredSteps(getFilteredSteps('applicant'));
        setSpecificIndex(null);
      }
      
      // Check for existing draft data first and handle initialization
      checkForExistingDraft().then(hasDraft => {
        setHasExistingDraft(hasDraft);
        
        if (shouldContinue) {
          console.log('🔄 Continue parameter detected, loading existing draft...');
          
          // Check if there's a specific draft to load from sessionStorage
          const draftToLoad = sessionStorage.getItem('draftToLoad');
          if (draftToLoad) {
            console.log('📝 Loading specific draft from sessionStorage:', draftToLoad);
            // Clear the sessionStorage after reading
            sessionStorage.removeItem('draftToLoad');
            // Load the specific draft data
            loadDraftData(draftToLoad, true); // Restore step when continuing
          } else if (user.applicantId) {
            // Fallback to user's applicantId if no specific draft
            loadDraftData(user.applicantId, true); // Restore step when continuing
          }
          
           // If a specific step is provided, navigate to it after draft is loaded
           if (stepParam) {
             if (stepParam === 'current_step') {
               // Rely on restoreStep=true behavior in loadDraftData which already restored current_step
               console.log('🎯 Step parameter is current_step; using restored draft current_step for navigation');
             } else {
               const targetStep = parseInt(stepParam, 10);
               if (!isNaN(targetStep) && targetStep >= 0) {
                 console.log('🎯 Step parameter detected, will navigate to step:', targetStep);
                 // Convert sequential step -> actual step id -> filtered index
                 const actualStepId = getActualStepFromSequential(targetStep, userRole);
                 const targetFilteredIndex = getFilteredIndexForActualId(actualStepId, userRole);
                 setCurrentStep(targetFilteredIndex);
               }
             }
           }
        } else {
          console.log('🆕 No continue parameter. Deciding between loading existing draft or starting fresh...');
          if (hasExistingDraft) {
            console.log('📄 Existing draft detected; loading draft instead of starting fresh');
            // Load the user's draft and restore step when continuing without explicit continue param
            if (user?.applicantId) {
              loadDraftData(user.applicantId, true);
            }
          } else {
            console.log('✨ No existing draft; starting fresh application');
            setHasExistingDraft(false);
        setFormData({
          // Application Info
          buildingAddress: '',
          apartmentNumber: '',
          apartmentType: '',
          monthlyRent: undefined,
          moveInDate: undefined,
          howDidYouHear: '',
          howDidYouHearOther: '',

          // Primary Applicant
          applicantName: '',
          applicantDob: undefined,
          applicantSsn: '',
          applicantPhone: '',
          applicantEmail: '',
          applicantLicense: '',
          applicantLicenseState: '',
          applicantAddress: '',
          applicantCity: '',
          applicantState: '',
          applicantZip: '',
          applicantLengthAtAddressYears: undefined,
          applicantLengthAtAddressMonths: undefined,
          applicantLandlordName: '',
          applicantLandlordAddressLine1: '',
          applicantLandlordAddressLine2: '',
          applicantLandlordCity: '',
          applicantLandlordState: '',
          applicantLandlordZipCode: '',
          applicantLandlordPhone: '',
          applicantLandlordEmail: '',
          applicantCurrentRent: undefined,
          applicantReasonForMoving: '',

          // Co-Applicants (Array of up to 4)
          coApplicants: [
            {
              name: '',
              relationship: '',
              dob: undefined,
              ssn: '',
              phone: '',
              email: '',
              license: '',
              licenseState: '',
              address: '',
              city: '',
              state: '',
              zip: '',
              lengthAtAddressYears: undefined,
              lengthAtAddressMonths: undefined,
              landlordName: '',
              landlordAddressLine1: '',
              landlordAddressLine2: '',
              landlordCity: '',
              landlordState: '',
              landlordZipCode: '',
              landlordPhone: '',
              landlordEmail: '',
              currentRent: undefined,
              reasonForMoving: '',
              employmentType: '',
              employer: '',
              position: '',
              employmentStart: undefined,
              income: '',
              incomeFrequency: 'yearly',
              businessName: '',
              businessType: '',
              yearsInBusiness: '',
              otherIncome: '',
              otherIncomeFrequency: 'monthly',
              otherIncomeSource: '',
              bankRecords: []
            }
          ],

          // Guarantors (Array of up to 4)
          guarantors: [
            {
              name: '',
              relationship: '',
              dob: undefined,
              ssn: '',
              phone: '',
              email: '',
              license: '',
              licenseState: '',
              address: '',
              city: '',
              state: '',
              zip: '',
              lengthAtAddressYears: undefined,
              lengthAtAddressMonths: undefined,
              landlordName: '',
              landlordAddressLine1: '',
              landlordAddressLine2: '',
              landlordCity: '',
              landlordState: '',
              landlordZipCode: '',
              landlordPhone: '',
              landlordEmail: '',
              currentRent: undefined,
              reasonForMoving: '',
              employmentType: '',
              employer: '',
              position: '',
              employmentStart: undefined,
              income: '',
              incomeFrequency: 'yearly',
              businessName: '',
              businessType: '',
              yearsInBusiness: '',
              otherIncome: '',
              otherIncomeFrequency: 'monthly',
              otherIncomeSource: '',
              bankRecords: []
            }
          ],

          // Conditional fields
          hasCoApplicant: false,
          hasGuarantor: false,
          coApplicantCount: 1,
          guarantorCount: 1,

          // Legal Questions
          landlordTenantLegalAction: '',
          brokenLease: '',

          // Occupants
          occupants: []
        });
        setCurrentStep(0);
          }
        }
        
        // Hide welcome message after 5 minutes
        const timer = setTimeout(() => {
          setShowWelcomeMessage(false);
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearTimeout(timer);
      });
    }
  }, [user, loadDraftData, checkForExistingDraft]);

  // Read selected rental from sessionStorage and pre-populate form
  useEffect(() => {
    const storedRental = sessionStorage.getItem('selectedRental');
    if (storedRental) {
      try {
        const rental = JSON.parse(storedRental);
        setSelectedRental(rental);
        console.log('Loaded selected rental:', rental);
        
        // Pre-populate form with rental data
        if (rental) {
          form.setValue('buildingAddress', rental.propertyName || '');
          form.setValue('apartmentNumber', rental.name || '');
          form.setValue('apartmentType', rental.unitType || '');
          form.setValue('monthlyRent', rental.monthlyRent ? parseFloat(rental.monthlyRent) : undefined);
        }
      } catch (error) {
        console.error('Error parsing selected rental:', error);
      }
    }
  }, [form]);

  // Draft saving is now only triggered on navigation (Next, Previous, GoTo buttons)
  // This prevents unnecessary saves on every field change



  const updateFormData = async (section: string, indexOrField: string, fieldOrValue: any, value?: any) => {
    // Reduced logging to prevent spam
    // console.log(`🔄 updateFormData: ${section}.${indexOrField} = ${fieldOrValue || value}`);
    
    setFormData((prev: any) => {
      let newFormData;
      
      if (section === '') {
        // Handle top-level fields
        newFormData = {
          ...prev,
          [indexOrField]: fieldOrValue,
        };
      } else if (section === 'guarantors' || section === 'coApplicants') {
        // Handle array sections (guarantors, coApplicants)
        // Call format: updateFormData('guarantors', '0', 'city', 'New York')
        const arrayIndex = parseInt(indexOrField, 10);
        const subField = fieldOrValue;
        const actualValue = value;
        
        if (!prev[section] || !Array.isArray(prev[section])) {
          console.warn(`🚨 ${section} is not an array, initializing as empty array`);
          newFormData = {
            ...prev,
            [section]: []
          };
        } else {
          newFormData = {
            ...prev,
            [section]: prev[section].map((item: any, i: number) => 
              i === arrayIndex ? { ...item, [subField]: actualValue } : item
            )
          };
        }
      } else {
        // Handle other nested section fields (objects)
        newFormData = {
          ...prev,
          [section]: {
            ...(prev[section] || {}), // Initialize section if it doesn't exist
            [indexOrField]: fieldOrValue,
          },
        };
      }
      
      return newFormData;
    });

  // This prevents unnecessary saves on every field change
  };
  // console.log("######### formData: ", formData);
  
  // Auto-populate specific co-applicant data when role parameter is set
  const coAppPopulateDoneRef = useRef<{ [index: number]: boolean }>({});
  useEffect(() => {
    if (!userRole.startsWith('coapplicant')) return;
    if (specificIndex === null || typeof specificIndex === 'undefined') return;
    if (coAppPopulateDoneRef.current[specificIndex]) return;

    const coApplicantsArr = formData.coApplicants || [];

    // Ensure array has enough elements for the index
    if (coApplicantsArr.length <= specificIndex) {
      setFormData((prev: any) => {
        const current = Array.isArray(prev.coApplicants) ? [...prev.coApplicants] : [];
        while (current.length <= specificIndex) {
          current.push({
            name: '',
            email: '',
            phone: '',
            relationship: '',
            dob: undefined,
            ssn: '',
            license: '',
            licenseState: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            lengthAtAddressYears: undefined,
            lengthAtAddressMonths: undefined,
            landlordName: '',
            landlordAddressLine1: '',
            landlordAddressLine2: '',
            landlordCity: '',
            landlordState: '',
            landlordZipCode: '',
            landlordPhone: '',
            landlordEmail: '',
            currentRent: undefined,
            reasonForMoving: '',
            employmentType: '',
            employer: '',
            position: '',
            employmentStart: undefined,
            income: '',
            incomeFrequency: 'yearly',
            businessName: '',
            businessType: '',
            yearsInBusiness: '',
            otherIncome: '',
            otherIncomeFrequency: 'monthly',
            otherIncomeSource: '',
            bankRecords: []
          });
        }
        return { ...prev, coApplicants: current };
      });
    }

    // Prefer data at specificIndex; fallback to index 0 if empty
    const candidateAtIndex = (formData.coApplicants || [])[specificIndex];
    const fallbackFirst = (formData.coApplicants || [])[0];
    const source = (candidateAtIndex && Object.keys(candidateAtIndex).length > 0)
      ? candidateAtIndex
      : (fallbackFirst && Object.keys(fallbackFirst).length > 0 ? fallbackFirst : undefined);

    if (!source) return;

    // Populate key fields
    if (source.name) {
      form.setValue(`coApplicants.${specificIndex}.name`, source.name);
      updateFormData('coApplicants', specificIndex.toString(), 'name', source.name);
    }
    if (source.relationship) {
      form.setValue(`coApplicants.${specificIndex}.relationship`, source.relationship);
      updateFormData('coApplicants', specificIndex.toString(), 'relationship', source.relationship);
    }
    if (source.dob) {
      form.setValue(`coApplicants.${specificIndex}.dob`, new Date(source.dob));
      updateFormData('coApplicants', specificIndex.toString(), 'dob', source.dob);
    }
    if (source.ssn) {
      form.setValue(`coApplicants.${specificIndex}.ssn`, source.ssn);
      updateFormData('coApplicants', specificIndex.toString(), 'ssn', source.ssn);
    }
    if (source.phone) {
      form.setValue(`coApplicants.${specificIndex}.phone`, source.phone);
      updateFormData('coApplicants', specificIndex.toString(), 'phone', source.phone);
    }
    if (source.email) {
      form.setValue(`coApplicants.${specificIndex}.email`, source.email);
      updateFormData('coApplicants', specificIndex.toString(), 'email', source.email);
    }
    if (source.address) {
      form.setValue(`coApplicants.${specificIndex}.address`, source.address);
      updateFormData('coApplicants', specificIndex.toString(), 'address', source.address);
    }
    if (source.city) {
      form.setValue(`coApplicants.${specificIndex}.city`, source.city);
      updateFormData('coApplicants', specificIndex.toString(), 'city', source.city);
    }
    if (source.state) {
      form.setValue(`coApplicants.${specificIndex}.state`, source.state);
      updateFormData('coApplicants', specificIndex.toString(), 'state', source.state);
    }
    if (source.zip) {
      form.setValue(`coApplicants.${specificIndex}.zip`, source.zip);
      updateFormData('coApplicants', specificIndex.toString(), 'zip', source.zip);
    }
    if (source.license) {
      form.setValue(`coApplicants.${specificIndex}.license`, source.license);
      updateFormData('coApplicants', specificIndex.toString(), 'license', source.license);
    }
    if (source.licenseState) {
      form.setValue(`coApplicants.${specificIndex}.licenseState`, source.licenseState);
      updateFormData('coApplicants', specificIndex.toString(), 'licenseState', source.licenseState);
    }

    // Mark presence
    setHasCoApplicant(true);
    form.setValue('hasCoApplicant', true);
    // Prevent reruns for the same index
    coAppPopulateDoneRef.current[specificIndex] = true;
  }, [userRole, specificIndex, form, setHasCoApplicant, formData.coApplicants]);

  useEffect(() => {
    if (userRole.startsWith('guarantor') && specificIndex !== null) {
      const specificGuarantor = (formData.guarantors || [])[specificIndex];
      if (specificGuarantor) {
        if (specificGuarantor.name) {
          form.setValue(`guarantors.${specificIndex}.name`, specificGuarantor.name);
          updateFormData('guarantors', specificIndex.toString(), 'name', specificGuarantor.name);
        }
        if (specificGuarantor.email) {
          form.setValue(`guarantors.${specificIndex}.email`, specificGuarantor.email);
          updateFormData('guarantors', specificIndex.toString(), 'email', specificGuarantor.email);
        }
        if (specificGuarantor.phone) {
          form.setValue(`guarantors.${specificIndex}.phone`, specificGuarantor.phone);
          updateFormData('guarantors', specificIndex.toString(), 'phone', specificGuarantor.phone);
        }
        // Set hasGuarantor to true for specific role
        setHasGuarantor(true);
        form.setValue('hasGuarantor', true);
      }
    }
  }, [userRole, specificIndex, form, setHasGuarantor]);

  // Helper function to update array items (coApplicants, guarantors)
  const updateArrayItem = (arrayName: string, index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const currentArray = prev[arrayName] || [];
      
      // Ensure array has enough elements to accommodate the index
      let newArray = [...currentArray];
      while (newArray.length <= index) {
        // Create a new empty object with all required fields
        const emptyItem = {
          name: '',
          email: '',
          phone: '',
          relationship: '',
          dob: undefined,
          age: '',
          ssn: '',
          license: '',
          licenseState: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          lengthAtAddressYears: undefined,
          lengthAtAddressMonths: undefined,
          landlordName: '',
          landlordAddressLine1: '',
          landlordAddressLine2: '',
          landlordCity: '',
          landlordState: '',
          landlordZipCode: '',
          landlordPhone: '',
          landlordEmail: '',
          currentRent: undefined,
          reasonForMoving: '',
          employmentType: '',
          bankRecords: []
        };
        newArray.push(emptyItem);
      }
      
      // Update the specific field
      newArray[index] = { ...newArray[index], [field]: value };
      
      const updated = {
        ...prev,
        [arrayName]: newArray
      };
      return updated;
    });
  };

  // Handle building selection
  const handleBuildingSelect = async (buildingAddress: string) => {
    setSelectedBuilding(buildingAddress);
    
    // Wait for units to be loaded if they're not available yet
    if (units.length === 0) {
      console.log('⏳ Units not loaded yet, waiting...');
      return;
    }
    
    const unitsForBuilding = MondayApiService.getUnitsByBuilding(units, buildingAddress);
    setAvailableApartments(unitsForBuilding);
    
    // Auto-select first unit if available
    const firstUnit = unitsForBuilding[0] || null;
    setSelectedUnit(firstUnit);
    
    // Update form fields directly - the useEffect will handle formData synchronization
    form.setValue('buildingAddress', buildingAddress);
    form.setValue('apartmentNumber', firstUnit?.name || '');
    form.setValue('apartmentType', firstUnit?.unitType || '');
  };

  // Restore building selection from draft data without auto-selecting first unit
  const restoreBuildingSelection = async (buildingAddress: string, apartmentNumber?: string, apartmentType?: string) => {
    setSelectedBuilding(buildingAddress);
    
    // Wait for units to be loaded if they're not available yet
    if (units.length === 0) {
      console.log('⏳ Units not loaded yet, waiting...');
      return;
    }
    
    const unitsForBuilding = MondayApiService.getUnitsByBuilding(units, buildingAddress);
    setAvailableApartments(unitsForBuilding);
    
    // Find the specific apartment that was previously selected
    let selectedUnit = null as any;
    let effectiveApartmentNumber = apartmentNumber;
    if (effectiveApartmentNumber) {
      selectedUnit = unitsForBuilding.find(unit => unit.name === effectiveApartmentNumber);
      console.log('🏠 Found previously selected apartment:', selectedUnit);
    }

    // Fallback: derive apartment by matching type and/or monthlyRent when apartmentNumber is missing
    if (!selectedUnit) {
      const normalizeType = (t?: string) => {
        if (!t) return '';
        const s = String(t).toLowerCase().replace(/\s+/g, '');
        if (s.includes('studio')) return 'studio';
        if (s === '1br' || s === '1bedroom' || s === 'onebedroom') return '1br';
        if (s === '2br' || s === '2bedroom' || s === 'twobedroom') return '2br';
        if (s === '3br' || s === '3bedroom' || s === 'threebedroom') return '3br';
        return s;
      };
      const effectiveType = normalizeType(apartmentType);
      const effectiveMonthlyRent = formData.application?.monthlyRent;
      if (effectiveType || typeof effectiveMonthlyRent !== 'undefined') {
        selectedUnit = unitsForBuilding.find(unit => {
          const typeMatches = effectiveType ? normalizeType(unit.unitType) === effectiveType : false;
          const rentMatches = typeof effectiveMonthlyRent !== 'undefined' ? Number(unit.monthlyRent) === Number(effectiveMonthlyRent) : false;
          return typeMatches || rentMatches;
        }) || null;
        if (selectedUnit) {
          effectiveApartmentNumber = selectedUnit.name;
          console.log('🏠 Derived apartment by type/rent:', { effectiveApartmentNumber, selectedUnit });
        }
      }
    }
    
    // If no specific apartment found, don't auto-select anything
    setSelectedUnit(selectedUnit || null);
    
    // Update form fields directly - the useEffect will handle formData synchronization
    form.setValue('buildingAddress', buildingAddress);
    if (effectiveApartmentNumber) {
      form.setValue('apartmentNumber', effectiveApartmentNumber);
      console.log('🏠 Restored apartmentNumber:', effectiveApartmentNumber);
    }
    if (apartmentType) {
      form.setValue('apartmentType', apartmentType);
      console.log('🏠 Restored apartmentType:', apartmentType);
    }
    // If we successfully found the unit, restore monthlyRent as well
    if (selectedUnit && typeof selectedUnit.monthlyRent !== 'undefined') {
      form.setValue('monthlyRent', selectedUnit.monthlyRent as any);
      updateFormData('application', 'monthlyRent', selectedUnit.monthlyRent as any);
      console.log('🏠 Restored monthlyRent:', selectedUnit.monthlyRent);
    }
    
    // Verify the form values were actually set
    setTimeout(() => {
      console.log('🔍 Verifying form values after restoration:', {
        buildingAddress: form.getValues('buildingAddress'),
        apartmentNumber: form.getValues('apartmentNumber'),
        apartmentType: form.getValues('apartmentType')
      });
    }, 100);
  };

  // Handle apartment selection
  const handleApartmentSelect = async (apartmentName: string) => {
    console.log('🏠 handleApartmentSelect called with:', apartmentName);
    const selectedApartment = availableApartments.find(unit => unit.name === apartmentName);
    console.log('🏠 selectedApartment:', selectedApartment);
    console.log('🏠 selectedApartment.monthlyRent:', selectedApartment?.monthlyRent);
    console.log('🏠 selectedApartment.monthlyRent type:', typeof selectedApartment?.monthlyRent);
    setSelectedUnit(selectedApartment || null);
    
    // Update form fields directly - the useEffect will handle formData synchronization
    console.log('🏠 Setting form values:');
    console.log('  - apartmentNumber:', apartmentName);
    console.log('  - apartmentType:', selectedApartment?.unitType || '');
    console.log('  - monthlyRent:', selectedApartment?.monthlyRent || undefined);
    
    form.setValue('apartmentNumber', apartmentName);
    form.setValue('apartmentType', selectedApartment?.unitType || '');
    form.setValue('monthlyRent', selectedApartment?.monthlyRent || undefined);
    updateFormData('application', 'monthlyRent', selectedApartment?.monthlyRent || undefined);
    
    // Verify the form values were actually set
    setTimeout(() => {
      console.log('🔍 Verifying form values after apartment selection:', {
        apartmentNumber: form.getValues('apartmentNumber'),
        apartmentType: form.getValues('apartmentType'),
        monthlyRent: form.getValues('monthlyRent')
      });
    }, 100);
  };

  const handleDocumentChange = async (person: string, documentType: string, files: File[], index?: number) => {
    console.log(`🚀 === DOCUMENT CHANGE DEBUG ===`);
    console.log(`📁 Document change for ${person} ${documentType}:`, files.length, 'files', 'index:', index);
    console.log(`📁 Files:`, files.map(f => ({ name: f.name, size: f.size, lastModified: f.lastModified })));
    
    // Handle array-based people (guarantors, coApplicants) with index
    let actualPerson = person;
    let actualDocumentType = documentType;
    
    if (index !== undefined && (person === 'guarantors' || person === 'coApplicants')) {
      // For array-based people, create indexed keys
      actualPerson = `${person}_${index}`;
      actualDocumentType = documentType;
      console.log(`🚀 Array-based person detected: ${person} -> ${actualPerson}`);
    }
    
    console.log(`🚀 Final storage keys: actualPerson=${actualPerson}, actualDocumentType=${actualDocumentType}`);
    
    setDocuments((prev: any) => {
      console.log(`🚀 Previous documents state:`, prev);
      const newDocs = {
        ...prev,
        [actualPerson]: {
          ...prev[actualPerson],
          [actualDocumentType]: files,
        },
      };
      console.log(`🚀 Documents state updated:`, newDocs);
      return newDocs;
    });
    
    console.log(`🚀 === END DOCUMENT CHANGE DEBUG ===`);
  };

  // Handler to attach webhook file URL to encrypted file
  const handleWebhookFileUrl = (person: string, documentType: string, fileUrl: string, fileName: string) => {
    console.log(`🔍 handleWebhookFileUrl called with:`, { person, documentType, fileUrl, fileName });
    
    setEncryptedDocuments((prev: any) => {
      const updated = { ...prev };
      
      // Handle indexed person types (e.g., coApplicants_1, guarantors_2)
      let searchPerson = person;
      let searchDocumentType = documentType;
      
      // If person contains underscore, it's already indexed (e.g., coApplicants_1)
      if (person.includes('_')) {
        searchPerson = person;
        console.log(`🔍 handleWebhookFileUrl: Person is already indexed: ${searchPerson}`);
      } else {
        // Map plural person types to singular for backward compatibility
        if (person === 'coApplicants') {
          searchPerson = 'coApplicant';
          console.log(`🔍 handleWebhookFileUrl: Mapped coApplicants to coApplicant: ${searchPerson}`);
        } else if (person === 'guarantors') {
          searchPerson = 'guarantor';
          console.log(`🔍 handleWebhookFileUrl: Mapped guarantors to guarantor: ${searchPerson}`);
        }
      }

      // Normalize documentType if it was passed with person/index prefix
      // Examples to normalize:
      // - guarantors_1_photo_id -> photo_id
      // - coApplicants_0_payStubs -> payStubs
      // - coApplicant_photo_id -> photo_id
      const prefixedPattern = new RegExp(`^(?:${searchPerson}|coApplicants|guarantors|coApplicant|guarantor)(?:_\\d+)?_`);
      if (prefixedPattern.test(searchDocumentType)) {
        const normalized = searchDocumentType.replace(prefixedPattern, '');
        console.log(`🔧 Normalized documentType from ${searchDocumentType} -> ${normalized}`);
        searchDocumentType = normalized;
      }
      
      console.log(`🔍 handleWebhookFileUrl: Searching for ${searchPerson}.${searchDocumentType}`);
      console.log(`🔍 Available keys in encryptedDocuments:`, Object.keys(updated));
      
      // Safety check: ensure person and documentType exist
      if (!updated[searchPerson]) {
        console.log(`ℹ️ handleWebhookFileUrl: ${searchPerson} not found in encryptedDocuments, skipping file URL update`);
        console.log(`ℹ️ Available persons:`, Object.keys(updated));
        return prev;
      }
      
      if (!updated[searchPerson][searchDocumentType]) {
        console.log(`ℹ️ handleWebhookFileUrl: ${searchPerson}.${searchDocumentType} not found in encryptedDocuments, skipping file URL update`);
        console.log(`ℹ️ Available document types for ${searchPerson}:`, Object.keys(updated[searchPerson] || {}));
        return prev;
      }
      
      // Safety check: ensure documentType is an array before calling .map()
      if (!Array.isArray(updated[searchPerson][searchDocumentType])) {
        console.warn(`⚠️ handleWebhookFileUrl: ${searchPerson}.${searchDocumentType} is not an array:`, updated[searchPerson][searchDocumentType]);
        return prev;
      }
      
      updated[searchPerson][searchDocumentType] = updated[searchPerson][searchDocumentType].map((file: any) =>
        file.filename === fileName ? { ...file, fileUrl } : file
      );
      
      console.log(`✅ handleWebhookFileUrl: Successfully updated ${searchPerson}.${searchDocumentType} with file URL for ${fileName}`);
      return updated;
    });
  };
  // Enhanced webhook response handler
  const handleWebhookResponse = (person: 'applicant' | 'coApplicant' | 'coApplicants' | 'guarantor' | 'guarantors' | 'occupants', documentTypeOrIndex: string, response: any, index?: number) => {
    console.log(`📥 === WEBHOOK RESPONSE RECEIVED ===`);
    console.log(`👤 Person: ${person}`);
    console.log(`📄 Document Type or Index: ${documentTypeOrIndex}`);
    console.log(`📨 Raw Response:`, response);
    console.log(`🔢 Index: ${index}`);
    
    // Store webhook response with proper key generation
    let responseKey: string;
    
    if (person === 'coApplicants') {
      // Handle coApplicants with index
      if (index !== undefined) {
        responseKey = `coApplicants_${index}_${documentTypeOrIndex}`;
        console.log(`🔑 Co-Applicant with index ${index}: responseKey = ${responseKey}`);
      } else {
        // Fallback to default index 0
        responseKey = `coApplicants_0_${documentTypeOrIndex}`;
        console.log(`🔑 Co-Applicant fallback to index 0: responseKey = ${responseKey}`);
      }
    } else if (person === 'guarantors') {
      // Handle guarantors with index
      if (index !== undefined) {
        responseKey = `guarantors_${index}_${documentTypeOrIndex}`;
        console.log(`🔑 Guarantor with index ${index}: responseKey = ${responseKey}`);
      } else {
        // Fallback to default index 0
        responseKey = `guarantors_0_${documentTypeOrIndex}`;
        console.log(`🔑 Guarantor fallback to index 0: responseKey = ${responseKey}`);
      }
    } else if (person === 'occupants') {
      responseKey = `occupants_${documentTypeOrIndex}`;
      console.log(`🔑 Occupant: responseKey = ${responseKey}`);
    } else {
      // Handle applicant, coApplicant, guarantor (singular)
      responseKey = `${person}_${documentTypeOrIndex}`;
      console.log(`🔑 Singular person: responseKey = ${responseKey}`);
    }
    
    console.log(`🔑 Setting webhook response for key: ${responseKey}`);
    console.log(`🔑 Previous webhook responses:`, webhookResponses);
    
    setWebhookResponses(prev => {
      const newResponses = {
        ...prev,
        [responseKey]: response
      };
      console.log(`💾 Updated webhook responses:`, newResponses);
      console.log(`💾 New response key added: ${responseKey}`);
      console.log(`💾 Total webhook responses now:`, Object.keys(newResponses).length);
      return newResponses;
    });
    
    // Log the state after setting
    setTimeout(() => {
      console.log(`⏰ Webhook responses after setState:`, webhookResponses);
    }, 0);

    // Extract file URL from webhook response
    let fileUrl = '';
    let responseType = 'unknown';
    
    if (typeof response === 'string') {
      // Check if the response is actually a valid URL or just a document type identifier
      if (response.startsWith('http://') || response.startsWith('https://') || response.startsWith('s3://')) {
        fileUrl = response;
        responseType = 'url_string';
      } else {
        // This is likely a document type identifier, not a file URL
        console.log(`ℹ️ Response appears to be a document type identifier: ${response}`);
        responseType = 'document_type';
        // Don't treat this as a file URL
      }
    } else if (response && response.body) {
      fileUrl = response.body;
      responseType = 'body';
    } else if (response && response.url) {
      fileUrl = response.url;
      responseType = 'url';
    }

    console.log(`🔍 Response Analysis:`);
    console.log(`  - Response Type: ${responseType}`);
    console.log(`  - File URL: ${fileUrl}`);
    console.log(`  - Has File URL: ${!!fileUrl}`);

    if (fileUrl && responseType !== 'document_type') {
      console.log(`✅ File URL successfully extracted: ${fileUrl}`);
      
      // Also update the webhook file URL for encrypted documents
      // Construct the full indexed person key for array-based people
      let fullPersonKey: string = person;
      let documentTypeOnly: string = documentTypeOrIndex;
      
      if (person === 'coApplicants' && index !== undefined) {
        // For coApplicants, use the index parameter directly
        fullPersonKey = `coApplicants_${index}`;
        documentTypeOnly = documentTypeOrIndex;
        console.log(`🔑 Co-Applicant detected: constructing full person key: ${person} -> ${fullPersonKey}, document type: ${documentTypeOnly}`);
      } else if (person === 'guarantors' && index !== undefined) {
        // For guarantors, use the index parameter directly
        fullPersonKey = `guarantors_${index}`;
        documentTypeOnly = documentTypeOrIndex;
        console.log(`🔑 Guarantor detected: constructing full person key: ${person} -> ${fullPersonKey}, document type: ${documentTypeOnly}`);
      }
      
      // Use person-specific filename to maintain context
      const personSpecificFilename = `${fullPersonKey}_${documentTypeOrIndex}_${Date.now()}`;
      console.log(`🔑 Setting webhook file URL with full person key: ${fullPersonKey} and document type: ${documentTypeOnly}`);
      handleWebhookFileUrl(fullPersonKey, documentTypeOnly, fileUrl, personSpecificFilename);
      
      console.log(`✅ Webhook response processing completed for ${fullPersonKey} ${documentTypeOrIndex}`);
    } else {
      console.log(`ℹ️ Webhook response stored but no file URL processing needed for ${person} ${documentTypeOrIndex}`);
    }
    
    console.log(`=== END WEBHOOK RESPONSE ===`);
  };

  // Helper function to get comprehensive webhook summary
  const getWebhookSummary = () => {
    const summary = {
      totalResponses: Object.keys(webhookResponses).length,
      responsesByPerson: {
        applicant: Object.keys(webhookResponses).filter(key => key.startsWith('applicant_')).length,
        coApplicant: Object.keys(webhookResponses).filter(key => 
          key.startsWith('coApplicant_') || key.startsWith('coApplicants_')
        ).length,
        guarantor: Object.keys(webhookResponses).filter(key => 
          key.startsWith('guarantor_') || key.startsWith('guarantors_')
        ).length,
        occupants: Object.keys(webhookResponses).filter(key => key.startsWith('occupants_')).length
      },
      webhookResponses: webhookResponses
    };
    
    console.log('📊 Generated webhook summary:', summary);
    return summary;
  };

  // Helper function to get role-specific webhook summary
  const getRoleSpecificWebhookSummary = (role: string, index?: number) => {
    if (!role) return getWebhookSummary();
    
    let filteredResponses: any = {};
    
    if (role === 'applicant') {
      filteredResponses = Object.fromEntries(
        Object.entries(webhookResponses).filter(([key]) => key.startsWith('applicant_'))
      );
    } else if (role.startsWith('coapplicant')) {
      const coAppIndex = index !== undefined ? index : 0;
      filteredResponses = Object.fromEntries(
        Object.entries(webhookResponses).filter(([key]) => 
          key.startsWith(`coApplicants_${coAppIndex}_`) || key.startsWith(`coApplicant_${coAppIndex}_`)
        )
      );
    } else if (role.startsWith('guarantor')) {
      const guarIndex = index !== undefined ? index : 0;
      filteredResponses = Object.fromEntries(
        Object.entries(webhookResponses).filter(([key]) => 
          key.startsWith(`guarantors_${guarIndex}_`) || key.startsWith(`guarantor_${guarIndex}_`)
        )
      );
    } else {
      filteredResponses = webhookResponses;
    }
    
    const summary = {
      totalResponses: Object.keys(filteredResponses).length,
      responsesByPerson: {
        [role]: Object.keys(filteredResponses).length
      },
      webhookResponses: filteredResponses
    };
    
    console.log(`📊 Generated role-specific webhook summary for ${role}:`, summary);
    return summary;
  };
  // Build role-scoped copies of form data and signatures for saving
  const buildRoleScopedFormData = useCallback((data: any, role: string, coGuarIndex?: number): any => {
    if (!role) return data;
    
      console.log('🔍 buildRoleScopedFormData called with:', { role, coGuarIndex, dataKeys: Object.keys(data) });
      console.log('🔍 buildRoleScopedFormData webhookResponses:', data.webhookResponses);
      console.log('🔍 buildRoleScopedFormData webhookResponses keys:', Object.keys(data.webhookResponses || {}));
      
      // Debug: Check what's in the original data.guarantors
      console.log('🔍 DEBUG: data.guarantors:', data.guarantors);
      if (data.guarantors && data.guarantors.length > 0) {
        data.guarantors.forEach((guarantor: any, index: number) => {
          console.log(`🔍 DEBUG: data.guarantors[${index}]:`, guarantor);
          console.log(`🔍 DEBUG: data.guarantors[${index}].bankRecords:`, guarantor.bankRecords);
          console.log(`🔍 DEBUG: data.guarantors[${index}].bankRecords length:`, guarantor.bankRecords?.length || 0);
        });
      }
    
    // Applicant saves full dataset
    if (role === 'applicant') {
      return data;
    }

    // Co-applicant specific role: coapplicant or coapplicantN
    if (role === 'coapplicant' || /^coapplicant\d+$/.test(role)) {
      // Extract index from role if it's in format coapplicantN, otherwise use coGuarIndex
      let index = 0;
      if (/^coapplicant\d+$/.test(role)) {
        const match = role.match(/coapplicant(\d+)/);
        index = match ? parseInt(match[1]) - 1 : 0; // Convert 1-based to 0-based index
      } else if (typeof coGuarIndex === 'number') {
        index = coGuarIndex;
      }
      
      console.log('👥 Co-applicant role detected, using index:', index);
      const coApplicant = (data.coApplicants || [])[index] || {};
      console.log('👥 Co-applicant data for index', index, ':', coApplicant);
      console.log('👥 Available webhookResponses in data:', data.webhookResponses);
      console.log('👥 WebhookResponses keys:', Object.keys(data.webhookResponses || {}));
      
      // Filter webhook responses to only include this co-applicant's responses
      const coApplicantWebhookResponses = Object.fromEntries(
        Object.entries(data.webhookResponses || {}).filter(([key]) => 
          key.startsWith(`coApplicants_${index}_`) || key.startsWith(`coApplicant_${index}_`)
        )
      );
      
      console.log('👥 Filtered co-applicant webhook responses:', coApplicantWebhookResponses);
      console.log('👥 Filtered responses count:', Object.keys(coApplicantWebhookResponses).length);
      
      // Create webhook summary for this specific co-applicant
      const coApplicantWebhookSummary = {
        totalResponses: Object.keys(coApplicantWebhookResponses).length,
        responsesByPerson: {
          coApplicant: Object.keys(coApplicantWebhookResponses).length
        },
        webhookResponses: coApplicantWebhookResponses
      };
      
      console.log('👥 Co-applicant webhook summary generated:', coApplicantWebhookSummary);
      
      // Return simplified JSON structure as requested
      return {
        coApplicants: [coApplicant],
        webhookSummary: coApplicantWebhookSummary,
        // Include the original index for reference
        coApplicantIndex: index,
      };
    }

    // Guarantor specific role: guarantor or guarantorN
    if (role === 'guarantor' || /^guarantor\d+$/.test(role)) {
      // Extract index from role if it's in format guarantorN, otherwise use coGuarIndex
      let index = 0;
      if (/^guarantor\d+$/.test(role)) {
        const match = role.match(/guarantor(\d+)/);
        index = match ? parseInt(match[1]) - 1 : 0; // Convert 1-based to 0-based index
        console.log('🛡️ DEBUG: Role-based index calculation:', { role, match, index });
      } else if (typeof coGuarIndex === 'number') {
        index = coGuarIndex;
        console.log('🛡️ DEBUG: Using coGuarIndex:', { coGuarIndex, index });
      }
      
      // FIX: Use coGuarIndex if it's provided, as it's more reliable than role parsing
      if (typeof coGuarIndex === 'number' && coGuarIndex >= 0) {
        index = coGuarIndex;
        console.log('🛡️ DEBUG: Overriding with coGuarIndex:', { coGuarIndex, index });
      }
      
      console.log('🛡️ DEBUG: Final index to use:', index);
      
      console.log('🛡️ Guarantor role detected, using index:', index);
      console.log('🛡️ Data structure:', { 
        hasGuarantors: !!data.guarantors, 
        guarantorsLength: data.guarantors?.length || 0,
        guarantorsData: data.guarantors 
      });
      console.log('🛡️ Full data object keys:', Object.keys(data));
      console.log('🛡️ Full data object:', data);
      
      const guarantor = (data.guarantors || [])[index] || {};
      console.log('🛡️ Guarantor data for index', index, ':', guarantor);
      console.log('🛡️ Guarantor data keys:', Object.keys(guarantor));
      console.log('🛡️ Guarantor has name:', !!guarantor.name);
      console.log('🛡️ Guarantor has email:', !!guarantor.email);
      console.log('🛡️ Guarantor has bankRecords:', !!guarantor.bankRecords);
      console.log('🛡️ Guarantor bankRecords length:', guarantor.bankRecords?.length || 0);
      console.log('🛡️ Guarantor bankRecords data:', guarantor.bankRecords);
      console.log('🛡️ Guarantor bankRecords type:', typeof guarantor.bankRecords);
      console.log('🛡️ Guarantor bankRecords isArray:', Array.isArray(guarantor.bankRecords));
      if (guarantor.bankRecords && guarantor.bankRecords.length > 0) {
        console.log('🛡️ First bank record:', guarantor.bankRecords[0]);
        console.log('🛡️ Bank record keys:', Object.keys(guarantor.bankRecords[0] || {}));
      }
      
      // Filter webhook responses to only include this guarantor's responses
      console.log('🛡️ Available webhookResponses in data:', data.webhookResponses);
      console.log('🛡️ WebhookResponses keys:', Object.keys(data.webhookResponses || {}));
      console.log('🛡️ Looking for keys starting with:', `guarantors_${index}_` + ' OR ' + `guarantor_`);
      
      const guarantorWebhookResponses = Object.fromEntries(
        Object.entries(data.webhookResponses || {}).filter(([key]) => 
          key.startsWith(`guarantors_${index}_`) || key.startsWith(`guarantor_`)
        )
      );
      
      console.log('🛡️ Filtered guarantor webhook responses:', guarantorWebhookResponses);
      console.log('🛡️ Filtered responses count:', Object.keys(guarantorWebhookResponses).length);
      console.log('🛡️ All webhook response keys for debugging:', Object.keys(data.webhookResponses || {}));
      console.log('🛡️ Keys matching guarantors_ pattern:', Object.keys(data.webhookResponses || {}).filter(key => key.startsWith('guarantors_')));
      console.log('🛡️ Keys matching guarantor_ pattern:', Object.keys(data.webhookResponses || {}).filter(key => key.startsWith('guarantor_')));
      
      // Check if we need to include bank records from guarantor data in webhook summary
      if (guarantor.bankRecords && guarantor.bankRecords.length > 0) {
        console.log('🛡️ WARNING: Guarantor has bank records but no webhook responses found!');
        console.log('🛡️ This suggests bank records are stored in guarantor data but not in webhook responses');
        console.log('🛡️ Bank records count:', guarantor.bankRecords.length);
        console.log('🛡️ Webhook responses count:', Object.keys(guarantorWebhookResponses).length);
      }
      
      // Create webhook summary for this specific guarantor
      // Include bank records from guarantor data in the count
      const bankRecordsCount = guarantor.bankRecords?.length || 0;
      const webhookResponsesCount = Object.keys(guarantorWebhookResponses).length;
      const totalResponses = webhookResponsesCount + bankRecordsCount;
      
      const guarantorWebhookSummary = {
        totalResponses: totalResponses,
        responsesByPerson: {
          guarantor: totalResponses
        },
        webhookResponses: guarantorWebhookResponses,
        // Include bank records info for debugging
        bankRecordsCount: bankRecordsCount,
        webhookResponsesCount: webhookResponsesCount
      };
      
      console.log('🛡️ Guarantor webhook summary generated:', guarantorWebhookSummary);
      
      // Return simplified JSON structure as requested
      return {
        guarantors: [guarantor],
        webhookSummary: guarantorWebhookSummary,
        // Include the original index for reference
        guarantorIndex: index,
      };
    }

    // Default: return full data
    return data;
  }, []);

  const buildRoleScopedSignatures = useCallback((rawSignatures: any, role: string, coGuarIndex?: number): any => {
    const safe = rawSignatures || {};
    
    console.log('🔍 buildRoleScopedSignatures called with:', { role, coGuarIndex, signatureKeys: Object.keys(safe) });
    
    if (role === 'applicant') {
      return { applicant: safe.applicant ?? null };
    }
    
    if (role === 'coapplicant' || /^coapplicant\d+$/.test(role)) {
      // Extract index from role if it's in format coapplicantN, otherwise use coGuarIndex
      let index = 0;
      if (/^coapplicant\d+$/.test(role)) {
        const match = role.match(/coapplicant(\d+)/);
        index = match ? parseInt(match[1]) - 1 : 0; // Convert 1-based to 0-based index
      } else if (typeof coGuarIndex === 'number') {
        index = coGuarIndex;
      }
      
      console.log('👥 Co-applicant signature role detected, using index:', index);
      const signature = (safe.coApplicants || {})[index] || null;
      console.log('👥 Co-applicant signature for index', index, ':', signature);
      
      return { coApplicants: { [index]: signature } };
    }
    
    if (role === 'guarantor' || /^guarantor\d+$/.test(role)) {
      // Extract index from role if it's in format guarantorN, otherwise use coGuarIndex
      let index = 0;
      if (/^guarantor\d+$/.test(role)) {
        const match = role.match(/guarantor(\d+)/);
        index = match ? parseInt(match[1]) - 1 : 0; // Convert 1-based to 0-based index
      } else if (typeof coGuarIndex === 'number') {
        index = coGuarIndex;
      }
      
      console.log('🛡️ Guarantor signature role detected, using index:', index);
      const signature = (safe.guarantors || {})[index] || null;
      console.log('🛡️ Guarantor signature for index', index, ':', signature);
      
      return { guarantors: { [index]: signature } };
    }
    
    return safe;
  }, []);

  // Save draft to DynamoDB function - ONLY for Applicant role
  const saveDraftToDynamoDB = useCallback(async () => {
    // Only allow save draft for Applicant role
    if (userRole !== 'applicant') {
      console.log('⚠️ Save draft is only available for Applicant role. Current role:', userRole);
      toast({
        title: 'Save Draft Not Available',
        description: 'Save draft functionality is only available for the primary applicant.',
        variant: 'destructive',
      });
      return;
    }

    const currentUserZoneinfo = getCurrentUserZoneinfo();
    
    if (!currentUserZoneinfo) {
      console.log('⚠️ No zoneinfo/applicantId available, skipping draft save');
      toast({
        title: 'Cannot Save Draft',
        description: 'No applicant ID available. Please ensure you are properly authenticated.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUserZoneinfo.trim()) {
      console.log('⚠️ Empty zoneinfo/applicantId, skipping draft save');
      toast({
        title: 'Cannot Save Draft',
        description: 'Invalid applicant ID. Please ensure you are properly authenticated.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      // Get the latest form data from state
      const currentFormData = formData;
      
      // Ensure coApplicants and guarantors arrays are properly included
      const enhancedFormData = {
        ...currentFormData,
        // Ensure coApplicants array is included
        coApplicants: currentFormData.coApplicants || [],
        // Ensure guarantors array is included  
        guarantors: currentFormData.guarantors || [],
        // Ensure counts are set
        coApplicantCount: currentFormData.coApplicantCount || (currentFormData.coApplicants?.length || 0),
        guarantorCount: currentFormData.guarantorCount || (currentFormData.guarantors?.length || 0)
      };
      
      // Clean up the form data before saving to remove empty values and ensure consistency
      const cleanedFormData = cleanFormDataForStorage(enhancedFormData);
      
      // Build role-scoped data to avoid overwriting unrelated sections
      const roleScopedForm = buildRoleScopedFormData(cleanedFormData, userRole || '', specificIndex ?? undefined);
      const roleScopedSign = buildRoleScopedSignatures(signatures, userRole || '', specificIndex ?? undefined);

      // ALWAYS use the current user's zoneinfo for both fields
      const enhancedFormDataSnapshot = {
        ...roleScopedForm,
        application_id: currentUserZoneinfo, // Use zoneinfo as application_id
        applicantId: currentUserZoneinfo,    // Use zoneinfo as applicantId
        webhookSummary: getWebhookSummary()
      };

      console.log('💾 Saving draft with user sub-based IDs:', {
        application_id: currentUserZoneinfo,
        applicantId: currentUserZoneinfo,
        userSub: user?.sub,
        userZoneinfo: user?.zoneinfo,
        userApplicantId: user?.applicantId
      });

      // Save data to separate tables - ONLY for Applicant role
      console.log('💾 Applicant draft saving to separate DynamoDB tables...');
      
      let saveResults: boolean[] = [];

      // Save Application Information to app_nyc table
      const applicationData = {
        application_info: {
          ...enhancedFormDataSnapshot.application,
          reference_id: referenceId,
          zoneinfo: (user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || '',
          // Persist Additional People to DynamoDB so Make.com can pick it up later
          ...(Array.isArray(enhancedFormDataSnapshot.coApplicants) || Array.isArray(enhancedFormDataSnapshot.guarantors)
            ? {
                "Additional People": {
                  zoneinfo: (user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || '',
                  role: 'applicant',
                  applicant: (enhancedFormDataSnapshot.applicant?.name) || (form.getValues() as any)?.applicantName || 'unknown',
                  applicantEmail: (enhancedFormDataSnapshot.applicant?.email) || (form.getValues() as any)?.applicantEmail || '',
                  // All co-applicants
                  ...(Array.isArray(enhancedFormDataSnapshot.coApplicants) && enhancedFormDataSnapshot.coApplicants.length > 0
                    ? enhancedFormDataSnapshot.coApplicants.reduce((acc: any, coApp: any, idx: number) => {
                        const i = idx + 1;
                        acc[`coApplicants${i}`] = {
                          coApplicant: `coapplicant${i}`,
                          url: `https://www.app.lppmrentals.com/login?role=coapplicant${i}&zoneinfo=${(user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || ''}`,
                          name: coApp?.name || '',
                          email: coApp?.email || ''
                        };
                        return acc;
                      }, {})
                    : {}),
                  // All guarantors
                  ...(Array.isArray(enhancedFormDataSnapshot.guarantors) && enhancedFormDataSnapshot.guarantors.length > 0
                    ? enhancedFormDataSnapshot.guarantors.reduce((acc: any, guar: any, idx: number) => {
                        const i = idx + 1;
                        acc[`guarantor${i}`] = {
                          guarantor: `guarantor${i}`,
                          url: `https://www.app.lppmrentals.com/login?role=guarantor${i}&zoneinfo=${(user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || ''}`,
                          name: guar?.name || '',
                          email: guar?.email || ''
                        };
                        return acc;
                      }, {})
                    : {})
                }
              }
            : {})
        },
        current_step: currentStep,
        status: 'draft' as const,
        last_updated_human: new Date().toLocaleString(),
        uploaded_files_metadata: uploadedFilesMetadata,
        webhook_responses: webhookResponses,
        signatures: roleScopedSign,
        encrypted_documents: encryptedDocuments,
        storage_mode: 'direct' as const,
        flow_type: 'separate_webhooks' as const,
        webhook_flow_version: '2.0',
        last_updated: new Date().toISOString()
      };

      const appSaveResult = await dynamoDBSeparateTablesUtils.saveApplicationData(applicationData);
      saveResults.push(appSaveResult);
      
      // Save Primary Applicant data to applicant_nyc table (including co-applicants and guarantors)
      const applicantData = {
        applicant_info: enhancedFormDataSnapshot.applicant || {},
        occupants: enhancedFormDataSnapshot.occupants || [],
        webhookSummary: getWebhookSummary(),
        // Store applicant signature as base64 string or null (never empty object)
        signature: (typeof roleScopedSign.applicant === 'string' && roleScopedSign.applicant.startsWith('data:image/'))
          ? roleScopedSign.applicant
          : (roleScopedSign.applicant ?? null),
        co_applicants: enhancedFormDataSnapshot.coApplicants || [], // Include co-applicants data
        guarantors: enhancedFormDataSnapshot.guarantors || [], // Include guarantors data
        // Also include Additional People summary for quick access by backoffice
        additionalPeople: ((): any => {
          const zone = (user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || '';
          const applicantName = (enhancedFormDataSnapshot.applicant?.name) || (form.getValues() as any)?.applicantName || 'unknown';
          const applicantEmail = (enhancedFormDataSnapshot.applicant?.email) || (form.getValues() as any)?.applicantEmail || '';
          const coBlocks = Array.isArray(enhancedFormDataSnapshot.coApplicants) && enhancedFormDataSnapshot.coApplicants.length > 0
            ? enhancedFormDataSnapshot.coApplicants.reduce((acc: any, coApp: any, idx: number) => {
                const i = idx + 1;
                acc[`coApplicants${i}`] = {
                  coApplicant: `coapplicant${i}`,
                  url: `https://www.app.lppmrentals.com/login?role=coapplicant${i}&zoneinfo=${zone}`,
                  name: coApp?.name || '',
                  email: coApp?.email || ''
                };
                return acc;
              }, {}) : {};
          const guarBlocks = Array.isArray(enhancedFormDataSnapshot.guarantors) && enhancedFormDataSnapshot.guarantors.length > 0
            ? enhancedFormDataSnapshot.guarantors.reduce((acc: any, guar: any, idx: number) => {
                const i = idx + 1;
                acc[`guarantor${i}`] = {
                  guarantor: `guarantor${i}`,
                  url: `https://www.app.lppmrentals.com/login?role=guarantor${i}&zoneinfo=${zone}`,
                  name: guar?.name || '',
                  email: guar?.email || ''
                };
                return acc;
              }, {}) : {};
          return {
            zoneinfo: zone,
            role: 'applicant',
            applicant: applicantName,
            applicantEmail: applicantEmail,
            ...coBlocks,
            ...guarBlocks
          };
        })(),
        timestamp: new Date().toISOString(), // Add timestamp field
        status: 'draft' as const,
        last_updated_human: new Date().toLocaleString(),
        last_updated: new Date().toISOString()
      };

      // Get the appid we just created for app_nyc and pass it to applicant_nyc
      const createdApp = await dynamoDBSeparateTablesUtils.getApplicationDataByUserId();
      const newAppId = createdApp?.appid || undefined;
      const applicantSaveResult = await dynamoDBSeparateTablesUtils.saveApplicantDataNew(applicantData, newAppId);
      saveResults.push(applicantSaveResult);
      
      console.log('✅ Primary Applicant draft with co-applicants and guarantors saved to app_nyc and applicant_nyc tables');

      const allSaved = saveResults.every(result => result);
      if (allSaved) {
        console.log('💾 Applicant draft saved successfully');
        setHasExistingDraft(true);
        toast({
          title: 'Draft Saved Successfully',
          description: 'Your application draft has been saved. You can continue working on it later.',
          variant: 'default',
        });
      } else {
        console.warn('⚠️ Failed to save some parts of applicant draft');
        toast({
          title: 'Partially Saved Draft',
          description: 'Some parts of your draft were saved, but there may have been issues. Please try saving again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error saving draft to DynamoDB:', error);
      toast({
        title: 'Error Saving Draft',
        description: 'An unexpected error occurred while saving your draft. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
    }
  }, [getCurrentUserZoneinfo, formData, referenceId, currentStep, uploadedFilesMetadata, webhookResponses, signatures, encryptedDocuments, getWebhookSummary, userRole, specificIndex, buildRoleScopedFormData, buildRoleScopedSignatures]);

  // Save draft to DynamoDB function - ONLY for Co-Applicant role
  const saveCoApplicantDraftToDynamoDB = useCallback(async () => {
    // Only allow save draft for Co-Applicant role
    if (!userRole || !userRole.startsWith('coapplicant')) {
      console.log('⚠️ Save draft is only available for Co-Applicant role. Current role:', userRole);
      toast({
        title: 'Save Draft Not Available',
        description: 'Save draft functionality is only available for co-applicants.',
        variant: 'destructive',
      });
      return;
    }

    const currentUserZoneinfo = getCurrentUserZoneinfo();
    
    if (!currentUserZoneinfo) {
      console.log('⚠️ No zoneinfo/applicantId available, skipping draft save');
      toast({
        title: 'Cannot Save Draft',
        description: 'No applicant ID available. Please ensure you are properly authenticated.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUserZoneinfo.trim()) {
      console.log('⚠️ Empty zoneinfo/applicantId, skipping draft save');
      toast({
        title: 'Cannot Save Draft',
        description: 'Invalid applicant ID. Please ensure you are properly authenticated.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      // Get the latest form data from state
      const currentFormData = formData;
      console.log('🔍 Current form data structure for Co-Applicant:', {
        hasCoApplicants: !!currentFormData.coApplicants,
        coApplicantsLength: currentFormData.coApplicants?.length || 0,
        specificIndex: specificIndex,
        userRole: userRole,
        coApplicantsData: currentFormData.coApplicants,
        webhookResponsesCount: Object.keys(webhookResponses).length,
        webhookResponses: webhookResponses
      });
      
      // Build role-scoped data to avoid overwriting unrelated sections
      // Pass webhookResponses to the function so it can filter them properly
      const formDataWithWebhooks = {
        ...currentFormData,
        webhookResponses: webhookResponses
      };
      console.log('🔍 FormDataWithWebhooks for regular co-applicant save:', {
        hasWebhookResponses: !!formDataWithWebhooks.webhookResponses,
        webhookResponsesKeys: Object.keys(formDataWithWebhooks.webhookResponses || {}),
        webhookResponses: formDataWithWebhooks.webhookResponses,
        userRole: userRole,
        specificIndex: specificIndex
      });
      const roleScopedForm = buildRoleScopedFormData(formDataWithWebhooks, userRole || '', specificIndex ?? undefined);
      const roleScopedSign = buildRoleScopedSignatures(signatures, userRole || '', specificIndex ?? undefined);

      // Get the specific co-applicant data from the role-scoped form
      const coApplicantData = roleScopedForm.coApplicants?.[0] || {};
      console.log('🔍 RoleScopedForm result:', {
        hasWebhookSummary: !!roleScopedForm.webhookSummary,
        webhookSummary: roleScopedForm.webhookSummary,
        coApplicantsCount: roleScopedForm.coApplicants?.length || 0
      });
      console.log('📊 Co-Applicant draft data to save:', coApplicantData);
      console.log('📊 Role-scoped form structure:', {
        hasCoApplicants: !!roleScopedForm.coApplicants,
        coApplicantsLength: roleScopedForm.coApplicants?.length || 0,
        hasOccupants: !!roleScopedForm.occupants,
        occupantsLength: roleScopedForm.occupants?.length || 0,
        hasWebhookSummary: !!roleScopedForm.webhookSummary,
        coApplicantDataKeys: Object.keys(coApplicantData)
      });
      
      // Save Co-Applicant data to Co-Applicants table with simplified structure
      const coApplicantDraftData = {
        role: 'coApplicant',
        coapplicant_info: coApplicantData,
        occupants: roleScopedForm.occupants || [],
        webhookSummary: roleScopedForm.webhookSummary || getRoleSpecificWebhookSummary(userRole || '', specificIndex ?? undefined),
        signature: (() => {
          const sig = (roleScopedSign as any)?.coApplicants?.[0];
          if (typeof sig === 'string' && sig.startsWith('data:image/')) return sig;
          return sig ?? null;
        })(),
        current_step: getSequentialStepNumber(currentStep, getEffectiveRole() || ''),
        last_updated: new Date().toISOString(),
        last_updated_human: new Date().toLocaleString(),
        status: 'draft' as const
      };

      // Get the appid from the application data to link co-applicant to application
      const existingApp = await dynamoDBSeparateTablesUtils.getApplicationDataByZoneinfo();
      const appid = selectedAppId || existingApp?.appid || referenceId;
      console.log('🔗 Linking co-applicant draft to appid:', appid);
      console.log('💾 Final co-applicant draft data being saved:', {
        role: coApplicantDraftData.role,
        coapplicant_info_keys: Object.keys(coApplicantDraftData.coapplicant_info || {}),
        occupants_count: coApplicantDraftData.occupants?.length || 0,
        has_signature: !!coApplicantDraftData.signature,
        current_step: coApplicantDraftData.current_step,
        status: coApplicantDraftData.status,
        has_webhookSummary: !!coApplicantDraftData.webhookSummary,
        webhookSummary_totalResponses: coApplicantDraftData.webhookSummary?.totalResponses || 0,
        webhookSummary_responsesByPerson: coApplicantDraftData.webhookSummary?.responsesByPerson || {},
        webhookSummary_webhookResponses_keys: Object.keys(coApplicantDraftData.webhookSummary?.webhookResponses || {}),
        webhookSummary_webhookResponses: coApplicantDraftData.webhookSummary?.webhookResponses || {}
      });
      console.log('🔍 About to save co-applicant data to DynamoDB:', {
        hasWebhookSummary: !!coApplicantDraftData.webhookSummary,
        webhookSummaryType: typeof coApplicantDraftData.webhookSummary,
        webhookSummaryKeys: coApplicantDraftData.webhookSummary ? Object.keys(coApplicantDraftData.webhookSummary) : [],
        webhookSummary: coApplicantDraftData.webhookSummary
      });

      const coApplicantSaveResult = await dynamoDBSeparateTablesUtils.saveCoApplicantDataNew(coApplicantDraftData, appid);
      
      if (coApplicantSaveResult) {
        console.log('💾 Co-Applicant draft saved successfully');
        setHasExistingDraft(true);
        toast({
          title: 'Draft Saved Successfully',
          description: 'Your co-applicant draft has been saved. You can continue working on it later.',
          variant: 'default',
        });
      } else {
        console.warn('⚠️ Failed to save co-applicant draft');
        toast({
          title: 'Failed to Save Draft',
          description: 'There was an issue saving your draft. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error saving co-applicant draft to DynamoDB:', error);
      toast({
        title: 'Error Saving Draft',
        description: 'An unexpected error occurred while saving your draft. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
    }
  }, [getCurrentUserZoneinfo, formData, referenceId, currentStep, uploadedFilesMetadata, webhookResponses, signatures, encryptedDocuments, getWebhookSummary, userRole, specificIndex, buildRoleScopedFormData, buildRoleScopedSignatures, selectedAppId]);
  // Save draft to DynamoDB function - ONLY for Co-Applicant role with applicant type
  const saveCoApplicantApplicantTypeDraftToDynamoDB = useCallback(async () => {
    // Only allow save draft for Co-Applicant role
    if (!userRole || !userRole.startsWith('coapplicant')) {
      console.log('⚠️ Save draft is only available for Co-Applicant role. Current role:', userRole);
      toast({
        title: 'Save Draft Not Available',
        description: 'Save draft functionality is only available for co-applicants.',
        variant: 'destructive',
      });
      return;
    }

    const currentUserZoneinfo = getCurrentUserZoneinfo();
    
    if (!currentUserZoneinfo) {
      console.log('⚠️ No zoneinfo/applicantId available, skipping draft save');
      toast({
        title: 'Cannot Save Draft',
        description: 'No applicant ID available. Please ensure you are properly authenticated.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUserZoneinfo.trim()) {
      console.log('⚠️ Empty zoneinfo/applicantId, skipping draft save');
      toast({
        title: 'Cannot Save Draft',
        description: 'Invalid applicant ID. Please ensure you are properly authenticated.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      // Get the latest form data from state
      const currentFormData = formData;
      console.log('🔍 Current form data structure for Co-Applicant (Applicant Type):', {
        hasCoApplicants: !!currentFormData.coApplicants,
        coApplicantsLength: currentFormData.coApplicants?.length || 0,
        specificIndex: specificIndex,
        userRole: userRole,
        coApplicantsData: currentFormData.coApplicants,
        webhookResponsesCount: Object.keys(webhookResponses).length,
        webhookResponses: webhookResponses
      });
      
      // Build role-scoped data to avoid overwriting unrelated sections
      // Pass webhookResponses to the function so it can filter them properly
      const formDataWithWebhooks = {
        ...currentFormData,
        webhookResponses: webhookResponses
      };
      const roleScopedForm = buildRoleScopedFormData(formDataWithWebhooks, userRole || '', specificIndex ?? undefined);
      const roleScopedSign = buildRoleScopedSignatures(signatures, userRole || '', specificIndex ?? undefined);

      // Get the specific co-applicant data from the role-scoped form
      const coApplicantData = roleScopedForm.coApplicants?.[0] || {};
      console.log('📊 Co-Applicant (Applicant Type) draft data to save:', coApplicantData);
      console.log('📊 Role-scoped form structure:', {
        hasCoApplicants: !!roleScopedForm.coApplicants,
        coApplicantsLength: roleScopedForm.coApplicants?.length || 0,
        hasOccupants: !!roleScopedForm.occupants,
        occupantsLength: roleScopedForm.occupants?.length || 0,
        hasWebhookSummary: !!roleScopedForm.webhookSummary,
        coApplicantDataKeys: Object.keys(coApplicantData)
      });
      
      // Save Co-Applicant data to Applications table with applicant type structure
      const webhookSummary = roleScopedForm.webhookSummary || getRoleSpecificWebhookSummary(userRole || '', specificIndex ?? undefined);
      const coApplicantApplicantTypeDraftData = {
        application_info: coApplicantData, // Map coapplicant_info to application_info
        occupants: roleScopedForm.occupants || [],
        webhook_responses: webhookSummary?.webhookResponses || {}, // Map webhookSummary.webhookResponses to webhook_responses
        signatures: (() => {
          const sig = (roleScopedSign as any)?.coApplicants?.[0];
          if (typeof sig === 'string' && sig.startsWith('data:image/')) return { coApplicants: [sig] };
          return { coApplicants: [sig ?? null] };
        })(),
        current_step: getSequentialStepNumber(currentStep, getEffectiveRole() || ''),
        last_updated: new Date().toISOString(),
        last_updated_human: new Date().toLocaleString(),
        status: 'draft' as const
      };

      // Get the appid from the application data to link co-applicant to application
      const existingApp = await dynamoDBSeparateTablesUtils.getApplicationDataByZoneinfo();
      const appid = selectedAppId || existingApp?.appid || referenceId;
      console.log('🔗 Linking co-applicant (applicant type) draft to appid:', appid);
      console.log('💾 Final co-applicant (applicant type) draft data being saved:', {
        application_info_keys: Object.keys(coApplicantApplicantTypeDraftData.application_info || {}),
        occupants_count: coApplicantApplicantTypeDraftData.occupants?.length || 0,
        has_signature: !!coApplicantApplicantTypeDraftData.signatures,
        current_step: coApplicantApplicantTypeDraftData.current_step,
        status: coApplicantApplicantTypeDraftData.status,
        has_webhook_responses: !!coApplicantApplicantTypeDraftData.webhook_responses,
        webhook_responses_keys: Object.keys(coApplicantApplicantTypeDraftData.webhook_responses || {}),
        webhook_responses: coApplicantApplicantTypeDraftData.webhook_responses
      });

      // Save to Applications table instead of Co-Applicants table for applicant type
      const coApplicantSaveResult = await dynamoDBSeparateTablesUtils.saveApplicationData(coApplicantApplicantTypeDraftData);
      
      if (coApplicantSaveResult) {
        console.log('💾 Co-Applicant (Applicant Type) draft saved successfully');
        setHasExistingDraft(true);
        toast({
          title: 'Draft Saved Successfully',
          description: 'Your co-applicant draft has been saved as applicant type. You can continue working on it later.',
          variant: 'default',
        });
      } else {
        console.warn('⚠️ Failed to save co-applicant (applicant type) draft');
        toast({
          title: 'Failed to Save Draft',
          description: 'There was an issue saving your draft. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error saving co-applicant (applicant type) draft to DynamoDB:', error);
      toast({
        title: 'Error Saving Draft',
        description: 'An unexpected error occurred while saving your draft. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
    }
  }, [getCurrentUserZoneinfo, formData, referenceId, currentStep, uploadedFilesMetadata, webhookResponses, signatures, encryptedDocuments, getWebhookSummary, userRole, specificIndex, buildRoleScopedFormData, buildRoleScopedSignatures, selectedAppId]);

  // Save draft to DynamoDB function - ONLY for Guarantor role
  const saveGuarantorDraftToDynamoDB = useCallback(async () => {
    // Only allow save draft for Guarantor role
    if (!userRole || !userRole.startsWith('guarantor')) {
      console.log('⚠️ Save draft is only available for Guarantor role. Current role:', userRole);
      toast({
        title: 'Save Draft Not Available',
        description: 'Save draft functionality is only available for guarantors.',
        variant: 'destructive',
      });
      return;
    }

    const currentUserZoneinfo = getCurrentUserZoneinfo();
    
    if (!currentUserZoneinfo) {
      console.log('⚠️ No zoneinfo/applicantId available, skipping draft save');
      toast({
        title: 'Cannot Save Draft',
        description: 'No applicant ID available. Please ensure you are properly authenticated.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUserZoneinfo.trim()) {
      console.log('⚠️ Empty zoneinfo/applicantId, skipping draft save');
      toast({
        title: 'Cannot Save Draft',
        description: 'Invalid applicant ID. Please ensure you are properly authenticated.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      // Get the latest form data from state
      const currentFormData = formData;
      console.log('🔍 Current form data structure for Guarantor:', {
        hasGuarantors: !!currentFormData.guarantors,
        guarantorsLength: currentFormData.guarantors?.length || 0,
        specificIndex: specificIndex,
        userRole: userRole,
        guarantorsData: currentFormData.guarantors,
        webhookResponsesCount: Object.keys(webhookResponses).length,
        webhookResponses: webhookResponses
      });
      
      // Debug: Check if bank records exist in form data
      console.log('🔍 DEBUG: Checking form data for bank records...');
      console.log('🔍 DEBUG: currentFormData.guarantors:', currentFormData.guarantors);
      if (currentFormData.guarantors && currentFormData.guarantors.length > 0) {
        currentFormData.guarantors.forEach((guarantor: any, index: number) => {
          console.log(`🔍 DEBUG: guarantors[${index}]:`, guarantor);
          console.log(`🔍 DEBUG: guarantors[${index}].bankRecords:`, guarantor.bankRecords);
          console.log(`🔍 DEBUG: guarantors[${index}].bankRecords length:`, guarantor.bankRecords?.length || 0);
        });
      }
      
      // Debug: Check actual form values
      console.log('🔍 DEBUG: Checking actual form values...');
      const formValues = form.getValues();
      console.log('🔍 DEBUG: formValues.guarantors:', formValues.guarantors);
      if (formValues.guarantors && formValues.guarantors.length > 0) {
        formValues.guarantors.forEach((guarantor: any, index: number) => {
          console.log(`🔍 DEBUG: formValues.guarantors[${index}]:`, guarantor);
          console.log(`🔍 DEBUG: formValues.guarantors[${index}].bankRecords:`, guarantor.bankRecords);
          console.log(`🔍 DEBUG: formValues.guarantors[${index}].bankRecords length:`, guarantor.bankRecords?.length || 0);
        });
      }
      console.log('🔍 DEBUG: formData.webhookResponses vs webhookResponses state:');
      console.log('🔍 formData.webhookResponses:', currentFormData.webhookResponses);
      console.log('🔍 webhookResponses state:', webhookResponses);
      console.log('🔍 Are they the same?', JSON.stringify(currentFormData.webhookResponses) === JSON.stringify(webhookResponses));
      console.log('🔍 DEBUG: Original formData.guarantors:', currentFormData.guarantors);
      console.log('🔍 DEBUG: Original formData.guarantors[2]:', currentFormData.guarantors?.[2]);
      console.log('🔍 DEBUG: Original formData.guarantors[2].bankRecords:', currentFormData.guarantors?.[2]?.bankRecords);
      
      // Build role-scoped data to avoid overwriting unrelated sections
      // Pass webhookResponses to the function so it can filter them properly
      const formDataWithWebhooks = {
        ...currentFormData,
        webhookResponses: webhookResponses
      };
      console.log('🔍 FormDataWithWebhooks for regular guarantor save:', {
        hasWebhookResponses: !!formDataWithWebhooks.webhookResponses,
        webhookResponsesKeys: Object.keys(formDataWithWebhooks.webhookResponses || {}),
        webhookResponses: formDataWithWebhooks.webhookResponses,
        userRole: userRole,
        specificIndex: specificIndex
      });
      console.log('🔍 DEBUG: All webhook response keys:', Object.keys(webhookResponses || {}));
      console.log('🔍 DEBUG: Webhook responses for guarantors:', Object.keys(webhookResponses || {}).filter(key => key.includes('guarantor')));
      const roleScopedForm = buildRoleScopedFormData(formDataWithWebhooks, userRole || '', specificIndex ?? undefined);
      const roleScopedSign = buildRoleScopedSignatures(signatures, userRole || '', specificIndex ?? undefined);

      // Get the specific guarantor data from the role-scoped form
      const guarantorData = roleScopedForm.guarantors?.[0] || {};
      console.log('🔍 RoleScopedForm result:', {
        hasWebhookSummary: !!roleScopedForm.webhookSummary,
        webhookSummary: roleScopedForm.webhookSummary,
        guarantorsCount: roleScopedForm.guarantors?.length || 0
      });
      console.log('📊 Guarantor draft data to save:', guarantorData);
      console.log('📊 Guarantor bankRecords in draft data:', guarantorData.bankRecords);
      console.log('📊 Guarantor bankRecords length:', guarantorData.bankRecords?.length || 0);
      console.log('📊 DEBUG: Full guarantorData object:', JSON.stringify(guarantorData, null, 2));
      console.log('📊 DEBUG: guarantorData keys:', Object.keys(guarantorData));
      console.log('📊 DEBUG: guarantorData.bankRecords type:', typeof guarantorData.bankRecords);
      console.log('📊 DEBUG: guarantorData.bankRecords isArray:', Array.isArray(guarantorData.bankRecords));
      console.log('📊 Role-scoped form structure:', {
        hasGuarantors: !!roleScopedForm.guarantors,
        guarantorsLength: roleScopedForm.guarantors?.length || 0,
        hasOccupants: !!roleScopedForm.occupants,
        occupantsLength: roleScopedForm.occupants?.length || 0,
        hasWebhookSummary: !!roleScopedForm.webhookSummary,
        guarantorDataKeys: Object.keys(guarantorData)
      });
      
      // Save Guarantor data to Guarantors_nyc table with simplified structure
      console.log('🔍 DEBUG: Before creating guarantorDraftData...');
      console.log('🔍 DEBUG: guarantorData:', guarantorData);
      console.log('🔍 DEBUG: guarantorData.bankRecords:', guarantorData.bankRecords);
      console.log('🔍 DEBUG: guarantorData.bankRecords length:', guarantorData.bankRecords?.length || 0);
      
      // Debug: Check what's in the original form data
      console.log('🔍 DEBUG: Checking original form data...');
      console.log('🔍 DEBUG: currentFormData.guarantors:', currentFormData.guarantors);
      if (currentFormData.guarantors && currentFormData.guarantors.length > 0) {
        currentFormData.guarantors.forEach((guarantor: any, index: number) => {
          console.log(`🔍 DEBUG: formData.guarantors[${index}]:`, guarantor);
          console.log(`🔍 DEBUG: formData.guarantors[${index}].bankRecords:`, guarantor.bankRecords);
          console.log(`🔍 DEBUG: formData.guarantors[${index}].bankRecords length:`, guarantor.bankRecords?.length || 0);
        });
      }
      
      // Debug: Check actual form values
      console.log('🔍 DEBUG: Checking actual form values...');
      const currentFormValues = form.getValues();
      console.log('🔍 DEBUG: currentFormValues.guarantors:', currentFormValues.guarantors);
      if (currentFormValues.guarantors && currentFormValues.guarantors.length > 0) {
        currentFormValues.guarantors.forEach((guarantor: any, index: number) => {
          console.log(`🔍 DEBUG: currentFormValues.guarantors[${index}]:`, guarantor);
          console.log(`🔍 DEBUG: currentFormValues.guarantors[${index}].bankRecords:`, guarantor.bankRecords);
          console.log(`🔍 DEBUG: currentFormValues.guarantors[${index}].bankRecords length:`, guarantor.bankRecords?.length || 0);
        });
      }
      
      const guarantorDraftData = {
        role: 'guarantor',
        guarantor_info: guarantorData,
        occupants: roleScopedForm.occupants || [],
        webhookSummary: roleScopedForm.webhookSummary || getRoleSpecificWebhookSummary(userRole || '', specificIndex ?? undefined),
        signature: (() => {
          const sig = (roleScopedSign as any)?.guarantors?.[0];
          if (typeof sig === 'string' && sig.startsWith('data:image/')) return sig;
          return sig ?? null;
        })(),
        current_step: getSequentialStepNumber(currentStep, getEffectiveRole() || ''),
        last_updated: new Date().toISOString(),
        last_updated_human: new Date().toLocaleString(),
        status: 'draft' as const
      };

      // Get the appid from the application data to link guarantor to application
      const existingApp = await dynamoDBSeparateTablesUtils.getApplicationDataByZoneinfo();
      const appid = selectedAppId || existingApp?.appid || referenceId;
      console.log('🔗 Linking guarantor draft to appid:', appid);
      console.log('💾 Final guarantor draft data being saved:', {
        role: guarantorDraftData.role,
        guarantor_info_keys: Object.keys(guarantorDraftData.guarantor_info || {}),
        guarantor_info_bankRecords: guarantorDraftData.guarantor_info?.bankRecords,
        guarantor_info_bankRecords_length: guarantorDraftData.guarantor_info?.bankRecords?.length || 0,
        occupants_count: guarantorDraftData.occupants?.length || 0,
        has_signature: !!guarantorDraftData.signature,
        current_step: guarantorDraftData.current_step,
        status: guarantorDraftData.status,
        has_webhookSummary: !!guarantorDraftData.webhookSummary,
        webhookSummary_totalResponses: guarantorDraftData.webhookSummary?.totalResponses || 0,
        webhookSummary_responsesByPerson: guarantorDraftData.webhookSummary?.responsesByPerson || {},
        webhookSummary_webhookResponses_keys: Object.keys(guarantorDraftData.webhookSummary?.webhookResponses || {}),
        webhookSummary_webhookResponses: guarantorDraftData.webhookSummary?.webhookResponses || {}
      });
      console.log('🔍 About to save guarantor data to DynamoDB:', {
        hasWebhookSummary: !!guarantorDraftData.webhookSummary,
        webhookSummaryType: typeof guarantorDraftData.webhookSummary,
        webhookSummaryKeys: guarantorDraftData.webhookSummary ? Object.keys(guarantorDraftData.webhookSummary) : [],
        webhookSummary: guarantorDraftData.webhookSummary
      });

      console.log('🔍 DEBUG: About to save guarantor data with bank records check...');
      console.log('🔍 DEBUG: guarantorDraftData.guarantor_info.bankRecords:', guarantorDraftData.guarantor_info?.bankRecords);
      console.log('🔍 DEBUG: guarantorDraftData.guarantor_info.bankRecords length:', guarantorDraftData.guarantor_info?.bankRecords?.length || 0);
      
      const guarantorSaveResult = await dynamoDBSeparateTablesUtils.saveGuarantorDataNew(guarantorDraftData, appid);
      
      if (guarantorSaveResult) {
        console.log('💾 Guarantor draft saved successfully');
        setHasExistingDraft(true);
        toast({
          title: 'Draft Saved Successfully',
          description: 'Your guarantor draft has been saved. You can continue working on it later.',
          variant: 'default',
        });
      } else {
        console.warn('⚠️ Failed to save guarantor draft');
        toast({
          title: 'Failed to Save Draft',
          description: 'There was an issue saving your draft. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error saving guarantor draft to DynamoDB:', error);
      toast({
        title: 'Error Saving Draft',
        description: 'An unexpected error occurred while saving your draft. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
    }
  }, [getCurrentUserZoneinfo, formData, referenceId, currentStep, uploadedFilesMetadata, webhookResponses, signatures, encryptedDocuments, getWebhookSummary, userRole, specificIndex, buildRoleScopedFormData, buildRoleScopedSignatures, selectedAppId]);

  // Function to log current webhook state (useful for debugging)
  const logCurrentWebhookState = () => {
    console.log('🔍 === CURRENT WEBHOOK STATE ===');
    console.log('📊 Webhook Summary:', getWebhookSummary());
    console.log('🌐 Webhook Responses:', webhookResponses);
    console.log('📋 Uploaded Documents:', uploadedDocuments);
    console.log('=== END CURRENT WEBHOOK STATE ===');
  };

  // Function to log current occupant form data structure
  const logOccupantFormData = () => {
    console.log('👥 === CURRENT OCCUPANT FORM DATA ===');
    console.log('📊 Total Occupants:', formData.occupants?.length || 0);
    
    if (formData.occupants && formData.occupants.length > 0) {
      formData.occupants.forEach((occupant: any, index: number) => {
        console.log(`👤 Occupant ${index + 1}:`, {
          name: occupant.name,
          relationship: occupant.relationship,
          dob: occupant.dob,
          ssn: occupant.ssn,
          license: occupant.license,
          age: occupant.age,
          documents: occupant.documents
        });
      });
    }
    
    console.log('📁 Document Sections Created:');
    const documentSections: string[] = [];
    if (formData.occupants) {
      formData.occupants.forEach((_: any, index: number) => {
        documentSections.push(`occupants_ssn${index + 1}`);
      });
    }
    console.log('  - SSN Document Sections:', documentSections);
    console.log('=== END OCCUPANT FORM DATA ===');
  };

  // Clean form data for storage by removing empty values and ensuring consistency
  const cleanFormDataForStorage = (data: any) => {
    const cleaned: any = {};
    
    // Clean application section
    if (data.application) {
      cleaned.application = {};
      Object.entries(data.application).forEach(([key, value]) => {
        // Always preserve apartment fields even if they're empty strings
        if (key === 'apartmentNumber' || key === 'apartmentType' || key === 'buildingAddress') {
          cleaned.application[key] = value || '';
        } else if (value !== '' && value !== null && value !== undefined) {
          cleaned.application[key] = value;
        }
      });
    }
    
    // Clean applicant section
    if (data.applicant) {
      cleaned.applicant = {};
      Object.entries(data.applicant).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleaned.applicant[key] = value;
        }
      });
    }
    
    // Clean coApplicant section (legacy format)
    if (data.coApplicant) {
      cleaned.coApplicant = {};
      Object.entries(data.coApplicant).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleaned.coApplicant[key] = value;
        }
      });
    }
    
    // Clean coApplicants array (new format)
    if (data.coApplicants && Array.isArray(data.coApplicants)) {
      cleaned.coApplicants = data.coApplicants.map((coApplicant: any) => {
        const cleanCoApplicant: any = {};
        if (coApplicant) {
          Object.entries(coApplicant).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
              cleanCoApplicant[key] = value;
            }
          });
        }
        return cleanCoApplicant;
      }).filter((coApplicant: any) => Object.keys(coApplicant).length > 0);
    }
    
    // Clean guarantor section (legacy format)
    if (data.guarantor) {
      cleaned.guarantor = {};
      Object.entries(data.guarantor).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleaned.guarantor[key] = value;
        }
      });
    }
    
    // Clean guarantors array (new format)
    if (data.guarantors && Array.isArray(data.guarantors)) {
      cleaned.guarantors = data.guarantors.map((guarantor: any) => {
        const cleanGuarantor: any = {};
        if (guarantor) {
          Object.entries(guarantor).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
              cleanGuarantor[key] = value;
            }
          });
        }
        return cleanGuarantor;
      }).filter((guarantor: any) => Object.keys(guarantor).length > 0);
    }
    
    // Clean occupants array
    if (data.occupants && Array.isArray(data.occupants)) {
      cleaned.occupants = data.occupants.map((occupant: any) => {
        const cleanOccupant: any = {};
        if (occupant) {
          Object.entries(occupant).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
              cleanOccupant[key] = value;
            }
          });
        }
        return cleanOccupant;
      }).filter((occupant: any) => Object.keys(occupant).length > 0);
    }
    
    // Copy other fields
    Object.entries(data).forEach(([key, value]) => {
      if (!['application', 'applicant', 'coApplicant', 'coApplicants', 'guarantor', 'guarantors', 'occupants'].includes(key)) {
        cleaned[key] = value;
      }
    });
    
    return cleaned;
  };

  // Function to get occupant document status
  const getOccupantDocumentStatus = (occupantIndex: number, documentType: string) => {
    const sectionName = `occupants_${documentType}`;
    
    console.log(`🔍 Checking occupant document status for section: ${sectionName}`);
    console.log(`🔍 Available webhook responses:`, Object.keys(formData.webhookResponses || {}));
    
    // Check webhook responses first
    const webhookResponse = formData.webhookResponses?.[sectionName];
    console.log(`🔍 Webhook response for ${sectionName}:`, webhookResponse);
    
    if (webhookResponse) {
      let fileUrl = '';
      if (typeof webhookResponse === 'string') {
        fileUrl = webhookResponse;
      } else if (webhookResponse && webhookResponse.body) {
        fileUrl = webhookResponse.body;
      } else if (webhookResponse && webhookResponse.url) {
        fileUrl = webhookResponse.url;
      }
      console.log(`🔍 Extracted file URL:`, fileUrl);
      if (fileUrl && fileUrl.trim()) {
        return { status: "uploaded", count: 1 };
      }
    }
    
    // Check encrypted documents
    const occupant = formData.occupants?.[occupantIndex];
    if (occupant?.encryptedDocuments?.[documentType]?.length > 0) {
      return { status: "pending", count: occupant.encryptedDocuments[documentType].length };
    }
    
    // Check regular documents
    if (occupant?.documents?.[documentType]?.length > 0) {
      return { status: "pending", count: occupant.documents[documentType].length };
    }
    
    return { status: "missing", count: 0 };
  };

  // Function to get occupant uploaded documents
  const getOccupantUploadedDocuments = (occupantIndex: number, documentType: string) => {
    const uploadedDocs: Array<{ filename: string; webhookbodyUrl: string }> = [];
    const sectionName = `occupants_${documentType}`;
    
    console.log(`📁 Getting uploaded documents for section: ${sectionName}`);
    
    // Check webhook responses first
    const webhookResponse = formData.webhookResponses?.[sectionName];
    console.log(`📁 Webhook response for ${sectionName}:`, webhookResponse);
    
    if (webhookResponse) {
      let fileUrl = '';
      if (typeof webhookResponse === 'string') {
        fileUrl = webhookResponse;
      } else if (webhookResponse && webhookResponse.body) {
        fileUrl = webhookResponse.body;
      } else if (webhookResponse && webhookResponse.url) {
        fileUrl = webhookResponse.url;
      }
      console.log(`📁 Extracted file URL:`, fileUrl);
      if (fileUrl && fileUrl.trim()) {
        uploadedDocs.push({ 
          filename: `${documentType}_document`, 
          webhookbodyUrl: fileUrl 
        });
        console.log(`📁 Added document to uploaded docs:`, uploadedDocs[uploadedDocs.length - 1]);
      }
    }
    
    console.log(`📁 Final uploaded docs array:`, uploadedDocs);
    return uploadedDocs;
  };
  // Function to handle occupant document preview
  const handlePreviewOccupantDocument = (filename: string, fileUrl: string, documentName: string) => {
    console.log(`👁️ Previewing occupant document:`, { filename, fileUrl, documentName });
    
    // Open in new tab for preview
    window.open(fileUrl, '_blank');
  };

  const handleEncryptedDocumentChange = async (person: string, documentType: string, encryptedFiles: EncryptedFile[], index?: number) => {
    // Safety check: ensure encryptedFiles is an array
    if (!Array.isArray(encryptedFiles)) {
      console.error('❌ handleEncryptedDocumentChange: encryptedFiles is not an array:', {
        person,
        documentType,
        encryptedFiles,
        type: typeof encryptedFiles,
        isArray: Array.isArray(encryptedFiles)
      });
      return; // Exit early to prevent crash
    }
    
    console.log('🚀 === ENCRYPTED DOCUMENT CHANGE DEBUG ===');
    console.log('handleEncryptedDocumentChange called:', { person, documentType, encryptedFilesCount: encryptedFiles.length, index });
    console.log('🚀 Encrypted files details:', encryptedFiles.map(f => ({ 
      filename: f.filename, 
      size: f.encryptedData.length,
      originalSize: f.originalSize,
      uploadDate: f.uploadDate
    })));
    
    // Special debugging for guarantor documents
    if (person === 'guarantor' || person === 'guarantors') {
      console.log('🚀 GUARANTOR ENCRYPTED DOCUMENT CHANGE:', {
        person,
        documentType,
        index,
        encryptedFilesCount: encryptedFiles.length,
        encryptedFiles: encryptedFiles.map(f => ({ filename: f.filename, size: f.encryptedData.length }))
      });
    }
    
    // Special debugging for co-applicant documents
    if (person === 'coApplicant' || person === 'coApplicants') {
      console.log('🚀 CO-APPLICANT ENCRYPTED DOCUMENT CHANGE:', {
        person,
        documentType,
        index,
        encryptedFilesCount: encryptedFiles.length,
        encryptedFiles: encryptedFiles.map(f => ({ filename: f.filename, size: f.encryptedData.length }))
      });
    }
    console.log('🚀 === END ENCRYPTED DOCUMENT CHANGE DEBUG ===');
    
    // Handle array-based people (guarantors, coApplicants) with index
    let actualPerson = person;
    let actualDocumentType = documentType;
    
    if (index !== undefined && (person === 'guarantors' || person === 'coApplicants')) {
      // For array-based people, create indexed keys
      actualPerson = `${person}_${index}`;
      actualDocumentType = documentType;
      console.log(`🚀 Encrypted: Array-based person detected: ${person} -> ${actualPerson}, index: ${index}`);
    }
    
    setEncryptedDocuments((prev: any) => ({
      ...prev,
      [actualPerson]: {
        ...prev[actualPerson],
        [actualDocumentType]: encryptedFiles,
      },
    }));
console.log('######docsEncrypted documents:', encryptedDocuments);

    // Track uploadedDocuments for webhook
    const sectionKey = `${actualPerson}_${actualDocumentType}`;
    // Map docs and include file_url if present on the file
    const docs = (encryptedFiles || []).map(file => ({
      reference_id: file.uploadDate + '-' + file.filename, // or use a better unique id if available
      file_name: file.filename,
      section_name: sectionKey,
      documents: actualDocumentType, // <-- Now included
      file_url: file.fileUrl || '' // Use fileUrl if present, else blank
    }));
    setUploadedDocuments(prev => {
      // Ensure prev is always an array
      const safePrev = Array.isArray(prev) ? prev : [];
      // Remove any previous docs for this section
      const filtered = safePrev.filter(doc => doc.section_name !== sectionKey);
      return [...filtered, ...docs];
    });

    // Track uploaded files metadata for webhook - OPTIMIZED VERSION
    const filesMetadata = (encryptedFiles || []).map(file => ({
      file_name: file.filename,
      file_size: file.originalSize,
      mime_type: file.mimeType,
      upload_date: file.uploadDate
    }));

    setUploadedFilesMetadata(prev => {
      const newMetadata = {
        ...prev,
        [sectionKey]: filesMetadata
      };
      
      // Log metadata size for debugging
      const metadataSize = JSON.stringify(newMetadata).length;
      console.log(`📊 UploadedFilesMetadata size: ${metadataSize} characters for section ${sectionKey}`);
      
      // If metadata is getting too large, log a warning
      if (metadataSize > 50000) { // 50KB warning threshold
        console.warn(`⚠️ UploadedFilesMetadata is getting large: ${metadataSize} characters`);
      }
      
      return newMetadata;
    });

    console.log('📁 File uploaded successfully for:', actualPerson, actualDocumentType);
  };

  const handleSignatureChange = async (person: string, index?: string, signature?: string) => {
    // Handle both old format (person, signature) and new format (person, index, signature)
    let actualPerson = person;
    let actualSignature = signature || index;
    let actualIndex = signature ? index : undefined;

    console.log('🔍 handleSignatureChange called with:', { person, index, signature });
    console.log('🔍 Processed values:', { actualPerson, actualSignature, actualIndex });
    console.log('🔍 Signature type:', typeof actualSignature);
    console.log('🔍 Is base64 image:', typeof actualSignature === 'string' && actualSignature.startsWith('data:image/'));

    if (actualIndex !== undefined) {
      // New format: person is the type (e.g., 'coApplicants'), index is the position
      setSignatures((prev: any) => {
        const newSignatures = {
          ...prev,
          [actualPerson]: {
            ...prev[actualPerson],
            [actualIndex]: actualSignature,
          },
        };
        console.log('🔍 Updated signatures (new format):', newSignatures);
        return newSignatures;
      });
      setSignatureTimestamps((prev: any) => ({
        ...prev,
        [actualPerson]: {
          ...prev[actualPerson],
          [actualIndex]: new Date().toISOString(),
        },
      }));
      console.log(`✍️ Signature updated for: ${actualPerson}[${actualIndex}]`);
    } else {
      // Old format: person is the identifier (e.g., 'applicant')
      setSignatures((prev: any) => {
        const newSignatures = {
          ...prev,
          [actualPerson]: actualSignature,
        };
        console.log('🔍 Updated signatures (old format):', newSignatures);
        return newSignatures;
      });
      setSignatureTimestamps((prev: any) => ({
        ...prev,
        [actualPerson]: new Date().toISOString(),
      }));
      console.log(`✍️ Signature updated for: ${actualPerson}`);
    }
  };

  // Enhanced document change handlers for each person type
  const applicantDocumentChange = (documentType: string, files: File[]) => handleDocumentChange('applicant', documentType, files);
  const applicantEncryptedDocumentChange = (documentType: string, encryptedFiles: EncryptedFile[]) => handleEncryptedDocumentChange('applicant', documentType, encryptedFiles);

  const coApplicantDocumentChange = (documentType: string, files: File[]) => handleDocumentChange('coApplicant', documentType, files);
  const coApplicantEncryptedDocumentChange = (documentType: string, encryptedFiles: EncryptedFile[]) => handleEncryptedDocumentChange('coApplicant', documentType, encryptedFiles);

  const guarantorDocumentChange = (documentType: string, files: File[]) => handleDocumentChange('guarantor', documentType, files);
  const guarantorEncryptedDocumentChange = (documentType: string, encryptedFiles: EncryptedFile[]) => handleEncryptedDocumentChange('guarantor', documentType, encryptedFiles);

  const occupantDocumentChange = (documentType: string, files: File[]) => handleDocumentChange('occupants', documentType, files);
  // Removed occupantEncryptedDocumentChange - no longer needed

  // Enhanced webhook response handlers for each person type
  const applicantWebhookResponse = (documentType: string, response: any) => {
    handleWebhookResponse('applicant', documentType, response);
  };

  const coApplicantWebhookResponse = (documentType: string, response: any) => {
    handleWebhookResponse('coApplicant', documentType, response);
  };

  const guarantorWebhookResponse = (documentType: string, response: any) => {
    handleWebhookResponse('guarantor', documentType, response);
  };
  const occupantWebhookResponse = (documentType: string, response: any) => {
    console.log(`🌐 Occupant webhook response for ${documentType}:`, response);
    console.log(`🌐 Calling handleWebhookResponse with:`, { person: 'occupants', documentType, response });
    handleWebhookResponse('occupants', documentType, response);
  };

  // Process signatures to extract meaningful information for PDF
  const processSignaturesForPDF = (rawSignatures: any) => {
    if (!rawSignatures) rawSignatures = {};
    
    const processedSignatures: any = {};
    
    // Process applicant signature - preserve actual signature data for image rendering
    if (rawSignatures.applicant) {
      processedSignatures.applicant = rawSignatures.applicant;
    } else {
      // If no applicant signature, add a placeholder
      processedSignatures.applicant = null;
    }
    
    // Process co-applicant signatures - preserve actual signature data
    // Get the actual co-applicants from the form data to ensure we process all of them
    const coApplicants = form.getValues().coApplicants || [];
    if (coApplicants.length > 0) {
      processedSignatures.coApplicants = {};
      coApplicants.forEach((_: any, index: number) => {
        const signature = rawSignatures.coApplicants?.[index];
        if (signature) {
          processedSignatures.coApplicants[index] = signature;
        } else {
          // If no signature for this co-applicant, add a placeholder
          processedSignatures.coApplicants[index] = null;
        }
      });
    }
    
    // Process guarantor signatures - preserve actual signature data
    // Get the actual guarantors from the form data to ensure we process all of them
    const guarantors = form.getValues().guarantors || [];
    if (guarantors.length > 0) {
      processedSignatures.guarantors = {};
      guarantors.forEach((_: any, index: number) => {
        const signature = rawSignatures.guarantors?.[index];
        if (signature) {
          processedSignatures.guarantors[index] = signature;
        } else {
          // If no signature for this guarantor, add a placeholder
          processedSignatures.guarantors[index] = null;
        }
      });
    }
    
    console.log('Processed signatures for PDF (preserving actual data):', processedSignatures);
    console.log('Form co-applicants count:', form.getValues().coApplicants?.length || 0);
    console.log('Form guarantors count:', form.getValues().guarantors?.length || 0);
    return processedSignatures;
  };
    const generatePDF = async (submissionData?: any): Promise<string | null> => {
    try {
      // Use the enhanced PDF generator for clean, professional alignment
      const pdfGenerator = new EnhancedPDFGenerator();

      // Use submission data if provided, otherwise get current form values
      const dataToUse = submissionData || form.getValues();
      
      // Combine application data with any additional data
      const combinedApplicationData = {
        ...dataToUse.application,
        ...dataToUse,
        submittedAt: new Date().toISOString(),
      };

      // Debug logging to verify data
      console.log('PDF Generation Debug:');
      console.log('Data being used for PDF:', dataToUse);
      console.log('Combined application data:', combinedApplicationData);
      console.log('Applicant data:', dataToUse.applicant);
      console.log('Co-applicants data:', dataToUse.coApplicants);
      console.log('Guarantors data:', dataToUse.guarantors);
      console.log('Occupants data:', dataToUse.occupants);
      console.log('Applicant bank records:', dataToUse.applicant?.bankRecords);
      console.log('Co-applicants bank records:', dataToUse.coApplicants?.[0]?.bankRecords);
      console.log('Guarantors bank records:', dataToUse.guarantors?.[0]?.bankRecords);

      // Process signatures for PDF generation
      const processedSignatures = processSignaturesForPDF(signatures);
      
      console.log('🔍 PDF Generation - Raw signatures:', signatures);
      console.log('🔍 PDF Generation - Processed signatures:', processedSignatures);
      console.log('🔍 PDF Generation - Signature types:', {
        applicant: typeof processedSignatures.applicant,
        coApplicants: processedSignatures.coApplicants ? Object.entries(processedSignatures.coApplicants).map(([k, v]) => ({ key: k, type: typeof v, isBase64: typeof v === 'string' && v.startsWith('data:image/') })) : [],
        guarantors: processedSignatures.guarantors ? Object.entries(processedSignatures.guarantors).map(([k, v]) => ({ key: k, type: typeof v, isBase64: typeof v === 'string' && v.startsWith('data:image/') })) : []
      });
      
      // Debug: Check if signatures are actually base64 images
      if (processedSignatures.applicant && typeof processedSignatures.applicant === 'string') {
        console.log('🔍 Applicant signature preview:', processedSignatures.applicant.substring(0, 100) + '...');
        console.log('🔍 Applicant signature is base64:', processedSignatures.applicant.startsWith('data:image/'));
      }
      
      if (processedSignatures.coApplicants) {
        Object.entries(processedSignatures.coApplicants).forEach(([index, signature]) => {
          const sig = signature as any;
          if (typeof sig === 'string') {
            console.log(`🔍 Co-applicant ${index} signature preview:`, sig.substring(0, 100) + '...');
            console.log(`🔍 Co-applicant ${index} signature is base64:`, sig.startsWith('data:image/'));
          }
        });
      }
      
      if (processedSignatures.guarantors) {
        Object.entries(processedSignatures.guarantors).forEach(([index, signature]) => {
          const sig = signature as any;
          if (typeof sig === 'string') {
            console.log(`🔍 Guarantor ${index} signature preview:`, sig.substring(0, 100) + '...');
            console.log(`🔍 Guarantor ${index} signature is base64:`, sig.startsWith('data:image/'));
          }
        });
      }
      
      console.log('🔍 About to call pdfGenerator.generatePDF with signatures:', processedSignatures);
      
      const firstCoApplicant = (dataToUse.coApplicants && dataToUse.coApplicants.length > 0) ? dataToUse.coApplicants[0] : undefined;
      const firstGuarantor = (dataToUse.guarantors && dataToUse.guarantors.length > 0) ? dataToUse.guarantors[0] : undefined;

      const pdfData = pdfGenerator.generatePDF({
        application: combinedApplicationData,
        applicant: dataToUse.applicant,
        coApplicant: firstCoApplicant,
        guarantor: firstGuarantor,
        occupants: dataToUse.occupants || [],
        signatures: {
          applicant: processedSignatures.applicant || undefined,
          coApplicant: processedSignatures.coApplicants ? (processedSignatures.coApplicants as any)[0] : undefined,
          guarantor: processedSignatures.guarantors ? (processedSignatures.guarantors as any)[0] : undefined,
        },
      });

      // Extract base64 from data URL
      const base64 = pdfData.split(',')[1];

      // Prepare filename
      const filename = `rental-application-${new Date().toISOString().split('T')[0]}.pdf`;

      // Send PDF to webhook
      console.log('Sending PDF to webhook:', {
        filename,
        referenceId,
        applicantId: user?.applicantId,
        base64Length: base64.length
      });
      
      const webhookResult = await WebhookService.sendPDFToWebhook(
        base64,
        referenceId,
        user?.applicantId || 'unknown',
        user?.applicantId || 'unknown',
        filename
      );

      // Trigger browser download first
      const link = document.createElement('a');
      link.href = pdfData;
      link.download = filename;
      link.click();

      // Skip PDF toast notifications
      return webhookResult.success ? (webhookResult.s3Url || null) : null;

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF.",
        variant: "destructive",
      });
      return null;
    }
  };



  // Clear webhook cache when starting fresh
  const clearWebhookCache = () => {
    WebhookService.clearFailedUploads();
    // Don't clear successful webhook responses - they're needed for preview functionality
    console.log('🧹 Cleared failed uploads cache');
  };

  // Check webhook status
  const getWebhookStatus = () => {
    const status = WebhookService.getUploadStatus();
    console.log('📊 Webhook Status:', status);
    return status;
  };

  // Clear cache when component mounts or when referenceId changes
  useEffect(() => {
    if (referenceId) {
      console.log('🔄 useEffect triggered - referenceId changed to:', referenceId);
      console.log('🔄 Current webhook responses before clearing:', webhookResponses);
      clearWebhookCache();
      console.log('🔄 After clearWebhookCache - webhook responses:', webhookResponses);
    }
  }, [referenceId]);

  // --- Add this helper to get the next allowed step index ---
  const getNextAllowedStep = (current: number, direction: 1 | -1) => {
    let next = current + direction;
    
    // If no existing draft and starting fresh, check if Step 1 is valid before allowing navigation
    if (hasExistingDraft === false && current === 0 && direction === 1) {
      const stepValidation = validateStep(current);
      if (!stepValidation.isValid) {
        console.log('🚫 No existing draft found and Step 1 is invalid, restricting navigation to Step 1 only');
        return current; // Stay on Step 1
      }
      console.log('✅ No existing draft but Step 1 is valid, allowing navigation to create first draft');
    }
    
    // Get actual step IDs for current and next steps
    const currentStepId = getActualStepId(current);
    const nextStepId = getActualStepId(next);
    
    // Check if primary applicant is a student
    const isStudent = formData?.applicant?.employmentType === 'student';
    
    // If moving forward and primary applicant is student, skip Documents step (step 4)
    if (direction === 1 && nextStepId === 4 && isStudent) {
      // Find the next step that has ID 5 or higher
      const nextStepIndex = filteredSteps.findIndex(step => step.id >= 5);
      if (nextStepIndex !== -1) {
        next = nextStepIndex;
      }
    }
    // If moving backward and primary applicant is student, skip Documents step (step 4)
    if (direction === -1 && nextStepId === 4 && isStudent) {
      // Find the previous step that has ID 3 or lower
      const prevStepIndex = filteredSteps.findLastIndex(step => step.id <= 3);
      if (prevStepIndex !== -1) {
        next = prevStepIndex;
      }
    }
    
    // If moving forward and co-applicant is not checked, skip co-applicant financial and docs
    // Do NOT apply this skip when the current role is co-applicant; co-applicants must see their own steps
    if (direction === 1 && (nextStepId === 6 || nextStepId === 7) && !hasCoApplicant && !userRole.startsWith('coapplicant')) {
      // Find the next step that has ID 8 or higher
      const nextStepIndex = filteredSteps.findIndex(step => step.id >= 8);
      if (nextStepIndex !== -1) {
        next = nextStepIndex;
      }
    }
    // If moving backward and co-applicant is not checked, skip co-applicant financial and docs
    // Do NOT apply this skip when the current role is co-applicant
    if (direction === -1 && (nextStepId === 6 || nextStepId === 7) && !hasCoApplicant && !userRole.startsWith('coapplicant')) {
      // Find the previous step that has ID 5 or lower
      const prevStepIndex = filteredSteps.findLastIndex(step => step.id <= 5);
      if (prevStepIndex !== -1) {
        next = prevStepIndex;
      }
    }
    // If moving forward and guarantor is not checked, skip guarantor financial and docs
    // Do NOT apply this skip when the current role is guarantor
    if (direction === 1 && (nextStepId === 10 || nextStepId === 11) && !hasGuarantor && !userRole.startsWith('guarantor')) {
      // Find the next step that has ID 12 or higher
      const nextStepIndex = filteredSteps.findIndex(step => step.id >= 12);
      if (nextStepIndex !== -1) {
        next = nextStepIndex;
      }
    }
    // If moving backward and guarantor is not checked, skip guarantor financial and docs
    // Do NOT apply this skip when the current role is guarantor
    if (direction === -1 && (nextStepId === 10 || nextStepId === 11) && !hasGuarantor && !userRole.startsWith('guarantor')) {
      // Find the previous step that has ID 9 or lower
      const prevStepIndex = filteredSteps.findLastIndex(step => step.id <= 9);
      if (prevStepIndex !== -1) {
        next = prevStepIndex;
      }
    }
    
    // For role-based filtering, ensure we stay within filtered steps
    const maxStep = filteredSteps.length - 1;
    return Math.max(0, Math.min(maxStep, next));
  };
  // Step validation functions
  const validateStep = (step: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const actualStepId = getActualStepId(step);
    
    switch (actualStepId) {
      case 1: // Application Information - all fields required
        if (!formData.application?.buildingAddress?.trim()) {
          errors.push('Building Address is required');
        }
        if (!formData.application?.apartmentNumber?.trim()) {
          errors.push('Apartment Number is required');
        }
        if (!formData.application?.moveInDate) {
          errors.push('Move-in Date is required');
        }
        if (!formData.application?.monthlyRent || formData.application?.monthlyRent <= 0) {
          errors.push('Monthly Rent is required');
        }
        if (!formData.application?.apartmentType?.trim()) {
          errors.push('Apartment Type is required');
        }
        break;

      case 2: // Primary Applicant Information - all fields required
        if (!formData.applicant?.name?.trim()) {
          errors.push('Full Name is required');
        }
        if (!formData.applicant?.ssn?.trim()) {
          errors.push('Social Security Number is required');
        }
        if (!formData.applicant?.phone?.trim()) {
          errors.push('Phone Number is required');
        }
        if (!formData.applicant?.email?.trim()) {
          errors.push('Email Address is required');
        }
        if (!formData.applicant?.license?.trim()) {
          errors.push('Driver\'s License is required');
        }
        if (!formData.applicant?.licenseState?.trim()) {
          errors.push('Driver\'s License State is required');
        }
        if (!formData.applicant?.address?.trim()) {
          errors.push('Address is required');
        }
        if (!formData.applicant?.city?.trim()) {
          errors.push('City is required');
        }
        if (!formData.applicant?.state?.trim()) {
          errors.push('State is required');
        }
        if (!formData.applicant?.zip?.trim()) {
          errors.push('ZIP Code is required');
        }
        break;

      case 3: // Financial Information - Primary Applicant - conditional based on employment type
        if (!formData.applicant?.employmentType?.trim()) {
          errors.push('Employment Type is required');
        }
        // If not self-employed, require employer fields
        if (formData.applicant?.employmentType !== 'self-employed') {
          if (!formData.applicant?.employer?.trim()) {
            errors.push('Current Employer is required');
          }
          if (!formData.applicant?.position?.trim()) {
            errors.push('Position/Title is required');
          }
          if (!formData.applicant?.employmentStart) {
            errors.push('Employment Start Date is required');
          }
        }
        if (!formData.applicant?.income || formData.applicant?.income <= 0) {
          errors.push('Annual Income is required');
        }
        break;

      case 5: // Co-Applicant Information - conditional based on checkbox
        if (formData.hasCoApplicant && ((formData.coApplicantCount || 0) > 0)) {
          // Validate either a specific co-applicant (by role) or all co-applicants
          const totalCoApplicants = Math.min(
            formData.coApplicantCount || 0,
            (formData.coApplicants?.length || 0)
          );
          const indicesToValidate = (userRole?.startsWith('coapplicant') && specificIndex !== null && specificIndex !== undefined)
            ? [specificIndex as number]
            : Array.from({ length: totalCoApplicants }, (_, i) => i);

          indicesToValidate.forEach((idx: number) => {
            const coApplicant = formData.coApplicants?.[idx];
            if (!coApplicant?.name?.trim()) {
              errors.push(`Co-Applicant ${idx + 1} Full Name is required`);
            }
            if (!coApplicant?.ssn?.trim()) {
              errors.push(`Co-Applicant ${idx + 1} Social Security Number is required`);
            }
            if (!coApplicant?.phone?.trim()) {
              errors.push(`Co-Applicant ${idx + 1} Phone Number is required`);
            }
            if (!coApplicant?.email?.trim()) {
              errors.push(`Co-Applicant ${idx + 1} Email Address is required`);
            }
            if (!coApplicant?.license?.trim()) {
              errors.push(`Co-Applicant ${idx + 1} Driver's License is required`);
            }
            if (!coApplicant?.licenseState?.trim()) {
              errors.push(`Co-Applicant ${idx + 1} Driver's License State is required`);
            }
            if (!coApplicant?.address?.trim()) {
              errors.push(`Co-Applicant ${idx + 1} Address is required`);
            }
            if (!coApplicant?.city?.trim()) {
              errors.push(`Co-Applicant ${idx + 1} City is required`);
            }
            if (!coApplicant?.state?.trim()) {
              errors.push(`Co-Applicant ${idx + 1} State is required`);
            }
            if (!coApplicant?.zip?.trim()) {
              errors.push(`Co-Applicant ${idx + 1} ZIP Code is required`);
            }
          });
        }
        break;

      case 6: // Co-Applicant Financial Information - conditional based on employment type
        if (formData.hasCoApplicant && ((formData.coApplicantCount || 0) > 0)) {
          const totalCoApplicants = Math.min(
            formData.coApplicantCount || 0,
            (formData.coApplicants?.length || 0)
          );
          const indicesToValidate = (userRole?.startsWith('coapplicant') && specificIndex !== null && specificIndex !== undefined)
            ? [specificIndex as number]
            : Array.from({ length: totalCoApplicants }, (_, i) => i);

          indicesToValidate.forEach((idx: number) => {
            const coApplicant = formData.coApplicants?.[idx];
            if (!coApplicant?.employmentType?.trim()) {
              errors.push(`Co-Applicant ${idx + 1} Employment Type is required`);
            }
            // If not student, require financial fields
            if (coApplicant?.employmentType !== 'student') {
              if (!coApplicant?.employer?.trim()) {
                errors.push(`Co-Applicant ${idx + 1} Current Employer is required`);
              }
              if (!coApplicant?.position?.trim()) {
                errors.push(`Co-Applicant ${idx + 1} Position/Title is required`);
              }
              if (!coApplicant?.income || coApplicant?.income <= 0) {
                errors.push(`Co-Applicant ${idx + 1} Income is required`);
              }
              if (!coApplicant?.incomeFrequency?.trim()) {
                errors.push(`Co-Applicant ${idx + 1} Income Frequency is required`);
              }
            }
          });
        }
        break;

      case 8: // Other Occupants - conditional based on checkbox
        if (formData.hasOtherOccupants) {
          if (!formData.occupants || formData.occupants.length === 0) {
            errors.push('At least one occupant must be added');
          } else {
            formData.occupants.forEach((occupant: any, index: number) => {
              if (!occupant?.name?.trim()) {
                errors.push(`Occupant ${index + 1} Name is required`);
              }
              if (!occupant?.relationship?.trim()) {
                errors.push(`Occupant ${index + 1} Relationship is required`);
              }
              if (!occupant?.dob) {
                errors.push(`Occupant ${index + 1} Date of Birth is required`);
              }
              if (!occupant?.ssn?.trim()) {
                errors.push(`Occupant ${index + 1} Social Security Number is required`);
              }
            });
          }
        }
        break;

      case 9: // Guarantor Information - conditional based on checkbox
        if (formData.hasGuarantor) {
          const totalGuarantors = formData.guarantors?.length || 0;
          const indicesToValidate = (userRole?.startsWith('guarantor') && specificIndex !== null && specificIndex !== undefined)
            ? [specificIndex as number]
            : Array.from({ length: Math.max(1, totalGuarantors) }, (_, i) => i);

          indicesToValidate.forEach((idx: number) => {
            const guarantor = formData.guarantors?.[idx] || formData.guarantors?.[0];
            if (!guarantor?.name?.trim()) {
              errors.push(`Guarantor ${idx + 1} Full Name is required`);
            }
            if (!guarantor?.ssn?.trim()) {
              errors.push(`Guarantor ${idx + 1} Social Security Number is required`);
            }
            if (!guarantor?.phone?.trim()) {
              errors.push(`Guarantor ${idx + 1} Phone Number is required`);
            }
            if (!guarantor?.email?.trim()) {
              errors.push(`Guarantor ${idx + 1} Email Address is required`);
            }
            if (!guarantor?.license?.trim()) {
              errors.push(`Guarantor ${idx + 1} Driver's License is required`);
            }
            if (!guarantor?.licenseState?.trim()) {
              errors.push(`Guarantor ${idx + 1} Driver's License State is required`);
            }
            if (!guarantor?.address?.trim()) {
              errors.push(`Guarantor ${idx + 1} Address is required`);
            }
            if (!guarantor?.city?.trim()) {
              errors.push(`Guarantor ${idx + 1} City is required`);
            }
            if (!guarantor?.state?.trim()) {
              errors.push(`Guarantor ${idx + 1} State is required`);
            }
            if (!guarantor?.zip?.trim()) {
              errors.push(`Guarantor ${idx + 1} ZIP Code is required`);
            }
          });
        }
        break;

      case 10: // Guarantor Financial Information - conditional based on employment type
        if (formData.hasGuarantor) {
          const totalGuarantors = formData.guarantors?.length || 0;
          const indicesToValidate = (userRole?.startsWith('guarantor') && specificIndex !== null && specificIndex !== undefined)
            ? [specificIndex as number]
            : Array.from({ length: Math.max(1, totalGuarantors) }, (_, i) => i);

          indicesToValidate.forEach((idx: number) => {
            const guarantor = formData.guarantors?.[idx] || formData.guarantors?.[0];
            if (!guarantor?.employmentType?.trim()) {
              errors.push(`Guarantor ${idx + 1} Employment Type is required`);
            }
            // If not student, require financial fields
            if (guarantor?.employmentType !== 'student') {
              if (!guarantor?.employer?.trim()) {
                errors.push(`Guarantor ${idx + 1} Current Employer is required`);
              }
              if (!guarantor?.position?.trim()) {
                errors.push(`Guarantor ${idx + 1} Position/Title is required`);
              }
              if (!guarantor?.income || guarantor?.income <= 0) {
                errors.push(`Guarantor ${idx + 1} Income is required`);
              }
              if (!guarantor?.incomeFrequency?.trim()) {
                errors.push(`Guarantor ${idx + 1} Income Frequency is required`);
              }
            }
          });
        }
        break;

      default:
        // Steps 0, 4, 7, 11, 12 don't require validation
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // --- Update nextStep and prevStep to use the helper ---
  const nextStep = async (e?: React.MouseEvent) => {
    console.log('🔄 Next step clicked - Current step:', currentStep);
    // Prevent form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Validate current step before proceeding, but don't block if we're restoring a draft
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      // If the page was opened with continue=true (restoring a draft), allow navigation and show a gentle hint
      const urlParams = new URLSearchParams(window.location.search);
      const isContinuing = urlParams.get('continue') === 'true';
      if (isContinuing) {
        
      } else {
        toast({
          title: 'Required fields missing',
          description: validation.errors.join(', '),
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const nextPlannedStep = getNextAllowedStep(currentStep, 1);
      // Log a safe snapshot of formData to avoid proxies/refs
      const formDataSnapshot = JSON.parse(JSON.stringify(formData));
      
      // Enhanced FormData snapshot with webhook responses and application_id
      const enhancedFormDataSnapshot = {
        ...formDataSnapshot,
        application_id: user?.zoneinfo || user?.applicantId || 'unknown',
        webhookSummary: getWebhookSummary()
      };
      
      console.log('🧾 === ENHANCED FORM DATA SNAPSHOT BEFORE ADVANCING ===');
      console.log('📊 Form Data:', enhancedFormDataSnapshot);
      console.log('🆔 Application ID:', enhancedFormDataSnapshot.application_id);
      console.log('📈 Webhook Summary:', enhancedFormDataSnapshot.webhookSummary);
      console.log('➡️ Moving to step:', nextPlannedStep);
      console.log('=== END ENHANCED FORM DATA SNAPSHOT ===');

      console.log('➡️ Moving to step:', nextPlannedStep);

    } catch (err) {
      console.warn('FormData logging failed:', err);
    }

    setCurrentStep((prev) => getNextAllowedStep(prev, 1));
  };

  const prevStep = async (e?: React.MouseEvent) => {
    console.log('🔄 Previous step clicked - Current step:', currentStep);
    // Prevent form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      // Log a safe snapshot of formData to avoid proxies/refs
      const formDataSnapshot = JSON.parse(JSON.stringify(formData));
      
      // Enhanced FormData snapshot with webhook responses and application_id
      const enhancedFormDataSnapshot = {
        ...formDataSnapshot,
        application_id: user?.zoneinfo || user?.applicantId || 'unknown',
        webhookSummary: getWebhookSummary()
      };
      
      console.log('🧾 === ENHANCED FORM DATA SNAPSHOT BEFORE GOING BACK ===');
      console.log('📊 Form Data:', enhancedFormDataSnapshot);
      console.log('🆔 Application ID:', enhancedFormDataSnapshot.application_id);
      console.log('📈 Webhook Summary:', enhancedFormDataSnapshot.webhookSummary);
      console.log('⬅️ Going back to step:', getNextAllowedStep(currentStep, -1));
      console.log('=== END ENHANCED FORM DATA SNAPSHOT ===');

      console.log('⬅️ Going back to step:', getNextAllowedStep(currentStep, -1));

    } catch (err) {
      console.warn('FormData logging failed:', err);
    }
    
    setCurrentStep((prev) => getNextAllowedStep(prev, -1));
  };

  // --- Update goToStep to block manual access to co-applicant/guarantor docs if not allowed ---
  const goToStep = async (step: number, e?: React.MouseEvent) => {
    // Prevent form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // If no existing draft and trying to navigate away from Step 1, check if Step 1 is valid first
    if (hasExistingDraft === false && step > 0) {
      const stepValidation = validateStep(0);
      if (!stepValidation.isValid) {
        console.log('🚫 No existing draft found and Step 1 is invalid, blocking navigation to step:', step);
        toast({
          title: 'Complete Step 1 First',
          description: 'Please complete the required fields in Step 1 before proceeding to other steps.',
          variant: 'destructive',
        });
        return;
      }
      console.log('✅ No existing draft but Step 1 is valid, allowing navigation to step:', step);
    }
    
    // Validate all previous steps before allowing navigation to a step
    if (step > currentStep) {
      for (let i = 1; i < step; i++) {
        const validation = validateStep(i);
        if (!validation.isValid) {
          toast({
            title: 'Complete previous steps first',
            description: `Please complete step ${i + 1} (${STEPS[i]?.title}) before proceeding. Missing: ${validation.errors.join(', ')}`,
            variant: 'destructive',
          });
          return;
        }
      }
    }
    
    // Check if primary applicant is a student
    const isStudent = formData?.applicant?.employmentType === 'student';
    
    // Step 4 is Supporting Documents - skip for students
    if (step === 4 && isStudent) {
      toast({
        title: 'Documents Step Skipped',
        description: 'Document validation is not required for students. Moving to next step.',
        variant: 'default',
      });
      // Automatically move to next step instead of blocking
      setCurrentStep(5);
      return;
    }
    
    // Step 6 is Co-Applicant Financial Information
    if (step === 6 && !hasCoApplicant) {
      toast({
        title: 'Co-Applicant Financial Information Unavailable',
        description: 'Please check "Add Co-Applicant" to access financial information.',
        variant: 'warning',
      });
      return;
    }
    // Step 7 is Co-Applicant Documents
    if (step === 7 && !hasCoApplicant) {
      toast({
        title: 'Co-Applicant Documents Unavailable',
        description: 'Please check "Add Co-Applicant" to upload documents.',
        variant: 'warning',
      });
      return;
    }
    // Step 10 is Guarantor Financial Information
    if (step === 10 && !hasGuarantor) {
      toast({
        title: 'Guarantor Financial Information Unavailable',
        description: 'Please check "Add Guarantor" to access financial information.',
        variant: 'warning',
      });
      return;
    }
    // Step 11 is Guarantor Documents
    if (step === 11 && !hasGuarantor) {
      toast({
        title: 'Guarantor Documents Unavailable',
        description: 'Please check "Add Guarantor" to upload documents.',
        variant: 'warning',
      });
      return;
    }
    
    try {
      // Log a safe snapshot of formData to avoid proxies/refs
      const formDataSnapshot = JSON.parse(JSON.stringify(formData));
      
      console.log('🧾 === FORM DATA SNAPSHOT BEFORE JUMPING TO STEP ===');
      console.log('📊 Form Data:', formDataSnapshot);
      console.log('🎯 Jumping to step:', step);
      console.log('=== END FORM DATA SNAPSHOT ===');

      // No draft saving - just navigate to step

    } catch (err) {
      console.warn('FormData logging failed:', err);
    }
    
    setCurrentStep(step);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [submissionReferenceId, setSubmissionReferenceId] = useState<string | null>(null);

  // Enhanced occupants handling with document uploads
  const addOccupant = async () => {
    const newOccupant = {
      name: '',
      relationship: '',
      dob: '',
      ssn: '',
      license: '',
      age: '',
      ssnDocument: null,
      documents: {}
    };
    
    setFormData((prev: any) => ({
      ...prev,
      occupants: [...(prev.occupants || []), newOccupant]
    }));

    console.log('👤 Occupant added');
  };

  const removeOccupant = async (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      occupants: prev.occupants.filter((_: any, i: number) => i !== index)
    }));

    console.log('👤 Occupant removed');
  };

  const updateOccupant = async (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      occupants: prev.occupants.map((occupant: any, i: number) => 
        i === index ? { ...occupant, [field]: value } : occupant
      )
    }));

    console.log('👤 Occupant updated:', index, field);
  };
  const handleOccupantDocumentChange = async (index: number, documentType: string, files: File[]) => {
    console.log(`📁 Occupant ${index + 1} document change:`, { documentType, filesCount: files.length });
    
    setFormData((prev: any) => ({
      ...prev,
      occupants: prev.occupants.map((occupant: any, i: number) => 
        i === index ? { 
          ...occupant, 
          documents: { 
            ...occupant.documents, 
            [documentType]: files 
          } 
        } : occupant
      )
    }));

    console.log('📁 Occupant document updated:', index, documentType);
  };

  // Handle role-specific form submission (bypasses schema validation)
  const handleRoleSpecificSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀🚀🚀 ROLE-SPECIFIC SUBMIT BUTTON CLICKED!');
    console.log('🔍 User role:', userRole, 'Specific index:', specificIndex);
    
    // Get current form values without validation
    const formValues = form.getValues();
    console.log('🔍 Current form values:', formValues);
    
    // Call the same onSubmit function with the form values
    await onSubmit(formValues);
  };

  // Handle regular form submission with debugging
  const handleFormSubmit = async (data: ApplicationFormData) => {
    console.log('🚀🚀🚀 REGULAR FORM SUBMIT HANDLER CALLED!');
    console.log('🔍 User role:', userRole);
    console.log('🔍 User role starts with coapplicant:', userRole?.startsWith('coapplicant'));
    console.log('🔍 User role starts with guarantor:', userRole?.startsWith('guarantor'));
    console.log('🔍 Form data received:', data);
    console.log('🔍 Form validation state in handler:', {
      isValid: form.formState.isValid,
      errors: form.formState.errors
    });
    await onSubmit(data);
  };

  // Handle form validation errors
  const handleFormError = (errors: any) => {
    console.log('❌❌❌ FORM VALIDATION FAILED!');
    console.log('🔍 Validation errors:', errors);
    console.log('🔍 Form state:', form.formState);
  };
  const onSubmit = async (data: ApplicationFormData) => {
    console.log('🚀🚀🚀 FORM SUBMIT BUTTON CLICKED - onSubmit function called!');
    console.log('🚀 Form submission started');
    console.log('Form data (data):', data);
    console.log('Form state (formData):', formData);
    console.log('Has guarantor:', data.hasGuarantor);
    console.log('Guarantors in data:', data.guarantors);
    console.log('Guarantors in formData:', formData.guarantors);
    console.log('🔍 ROLE DEBUG:');
    console.log('  - userRole:', userRole);
    console.log('  - specificIndex:', specificIndex);
    console.log('  - userRole starts with guarantor:', userRole?.startsWith('guarantor'));
    console.log('  - specificIndex is not null:', specificIndex !== null);
    console.log('User role:', userRole);
    console.log('Specific index:', specificIndex);
    console.log('🔍 Form validation state before submission:', {
      isValid: form.formState.isValid,
      isDirty: form.formState.isDirty,
      isSubmitting: form.formState.isSubmitting,
      errors: form.formState.errors
    });
    setIsSubmitting(true);
    
    try {
      // === Payscore submission for applicant role ===
      try {
        if (!userRole || userRole === 'applicant') {
          const fullName = (data.applicantName || '').trim();
          const nameParts = fullName.split(/\s+/);
          const firstName = nameParts[0] || '';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

          // Pull property details from stored primary applicant/application data when available
          let resolvedProperty = {
            name: data.buildingAddress || '',
            street_address: (data as any).applicantAddress || '',
            city: (data as any).applicantCity || '',
            state: (data as any).applicantState || '',
            zip_code: (data as any).applicantZip || ''
          };
          let resolvedMonthlyRent = Number(data.monthlyRent || 0) || 0;
          try {
            const prop = await dynamoDBSeparateTablesUtils.getPrimaryApplicantPropertyInfo();
            if (prop) {
              resolvedProperty = {
                name: prop.name || resolvedProperty.name,
                street_address: resolvedProperty.street_address || prop.street_address || '',
                city: resolvedProperty.city || prop.city || '',
                state: resolvedProperty.state || prop.state || '',
                zip_code: resolvedProperty.zip_code || prop.zip_code || ''
              };
              if (typeof prop.monthly_rent === 'number') {
                resolvedMonthlyRent = prop.monthly_rent;
              }
            }
          } catch {}

          // Normalize phone to E.164 with default +1
          const rawPhone = (data.applicantPhone || '').toString();
          const phoneDigits = rawPhone.replace(/\D/g, '');
          const e164Phone = phoneDigits ? `+1${phoneDigits.slice(-10)}` : '';

          // Build applicants list including Additional People (co-applicants, guarantors)
          const applicantsList: Array<{ applicant_first_name: string; applicant_last_name: string; applicant_email: string; applicant_phone_number: string; }> = [];
          // Primary applicant
          applicantsList.push({
            applicant_first_name: firstName,
            applicant_last_name: lastName,
            applicant_email: data.applicantEmail || '',
            applicant_phone_number: e164Phone
          });
          // Co-Applicants: use main applicant phone number
          try {
            const coApps = Array.isArray(formData.coApplicants) ? formData.coApplicants : [];
            coApps.forEach((co: any) => {
              const coFirst = (co?.firstName || (co?.name ? String(co.name).trim().split(/\s+/)[0] : '') || '').trim();
              const coLast = (() => {
                if (co?.lastName) return String(co.lastName).trim();
                const parts = (co?.name ? String(co.name).trim().split(/\s+/) : []) as string[];
                return parts.length > 1 ? parts.slice(1).join(' ') : '';
              })();
              applicantsList.push({
                applicant_first_name: coFirst,
                applicant_last_name: coLast,
                applicant_email: co?.email || '',
                applicant_phone_number: e164Phone
              });
            });
          } catch {}
          // Guarantors: use main applicant phone number
          try {
            const guars = Array.isArray(formData.guarantors) ? formData.guarantors : [];
            guars.forEach((g: any) => {
              const gFirst = (g?.firstName || (g?.name ? String(g.name).trim().split(/\s+/)[0] : '') || '').trim();
              const gLast = (() => {
                if (g?.lastName) return String(g.lastName).trim();
                const parts = (g?.name ? String(g.name).trim().split(/\s+/) : []) as string[];
                return parts.length > 1 ? parts.slice(1).join(' ') : '';
              })();
              applicantsList.push({
                applicant_first_name: gFirst,
                applicant_last_name: gLast,
                applicant_email: g?.email || '',
                applicant_phone_number: e164Phone
              });
            });
          } catch {}

          const payscorePayload = {
            applicants: applicantsList,
            property: resolvedProperty,
            is_decision_maker_paying: true,
            decision_maker_display_name: 'Liberty Place Property Management',
            monthly_rent: resolvedMonthlyRent,
            webhook_url: 'https://hook.us1.make.com/78cgvrcr4ifaitsii3dn4sza6ckibd29'
          };

          let payscoreResponseBody: any = null;
          let payscoreStatus = 'ok';
          try {
            const wrappedPayload = { metadata: payscorePayload };
            const psRes = await fetch('https://5sdpaqwf0f.execute-api.us-east-1.amazonaws.com/prod/payscore', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(wrappedPayload)
            });
            const text = await psRes.text();
            try { payscoreResponseBody = JSON.parse(text); } catch { payscoreResponseBody = text; }
            if (!psRes.ok) {
              payscoreStatus = `error_${psRes.status}`;
            }
          } catch (e: any) {
            payscoreStatus = 'network_error';
            payscoreResponseBody = e?.message || String(e);
          }

          try {
            await dynamoDBSeparateTablesUtils.savePayscoreResponse({
              email: (data.applicantEmail || '').toLowerCase(),
              role: 'applicant',
              zoneinfo: user?.zoneinfo || user?.applicantId || null,
              userId: user?.sub || null,
              requestPayload: { metadata: payscorePayload },
              responseBody: payscoreResponseBody,
              status: payscoreStatus
            });
          } catch (saveErr) {
            console.warn('⚠️ Failed to save payscore response (non-blocking):', saveErr);
          }
        }
      } catch (psErr) {
        console.warn('⚠️ Payscore submission block failed (non-blocking):', psErr);
      }
      // === Generate individual applicantId for specific roles ===
      let individualApplicantId = user?.applicantId || user?.zoneinfo || 'unknown';
      
      if (userRole.startsWith('coapplicant') && specificIndex !== null) {
        // Generate individual applicantId for specific co-applicant
        individualApplicantId = `${user?.applicantId || user?.zoneinfo || 'unknown'}-coapplicant${specificIndex + 1}`;
        console.log('🆔 Generated co-applicant applicantId:', individualApplicantId);
      } else if (userRole.startsWith('guarantor') && specificIndex !== null) {
        // Generate individual applicantId for specific guarantor
        individualApplicantId = `${user?.applicantId || user?.zoneinfo || 'unknown'}-guarantor${specificIndex + 1}`;
        console.log('🆔 Generated guarantor applicantId:', individualApplicantId);
      }

      // === Additional People in Application: minimal JSON + email POST ===
      try {
        if (userRole === 'applicant') {
          const zoneinfo = user?.zoneinfo || user?.applicantId || 'unknown';
          const applicantName = data.applicantName || formData.applicant?.name || '';
          const coCount = Math.max(0, Number(formData.coApplicantCount || 0));
          const guaCount = Math.max(0, Number(formData.guarantorCount || 0));

          const summaryPayload: any = {
            zoneinfo,
            role: 'applicant',
            applicant: applicantName,
          };

          // Add coApplicantsN
          const coList = (formData.coApplicants || []).slice(0, coCount);
          coList.forEach((co: any, idx: number) => {
            summaryPayload[`coApplicants${idx + 1}`] = {
              name: co?.name || '',
              email: co?.email || ''
            };
          });

          // Add guarantorN
          const guaList = (formData.guarantors || []).slice(0, guaCount);
          guaList.forEach((g: any, idx: number) => {
            summaryPayload[`guarantor${idx + 1}`] = {
              name: g?.name || '',
              email: g?.email || ''
            };
          });

          // Jest-style log (pretty JSON)
          console.log('📨 Additional People in Application (email payload):');
          console.log(JSON.stringify(summaryPayload, null, 2));

          // Send to email API endpoint (ONLY this minimal payload)
          try {
            await fetch('https://5sdpaqwf0f.execute-api.us-east-1.amazonaws.com/dev/sendmail', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(summaryPayload)
              
            });
          } catch (emailErr) {
            console.warn('✉️ Email API call failed (non-blocking):', emailErr);
          }
        }
      } catch (summaryErr) {
        console.warn('⚠️ Failed to prepare/send Additional People summary (non-blocking):', summaryErr);
      }

      // Import signature utilities
      const { validateSignatures, prepareSignaturesForSubmission } = await import('../lib/signature-utils');
      
      // Validate signatures before submission
      console.log('🔍 Pre-signature validation - userRole:', userRole, 'specificIndex:', specificIndex);
      console.log('🔍 Current signatures state:', signatures);
      const signatureValidation = validateSignatures(signatures, userRole, specificIndex ?? undefined);
      console.log('🔍 Signature validation result:', signatureValidation);
      
      if (!signatureValidation.isValid) {
        const errorMessage = signatureValidation.errors.join(', ');
        console.log('❌ Signature validation failed:', errorMessage);
        toast({
          title: "Signature Required",
          description: errorMessage,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      console.log('✅ Signature validation passed');
      
      // ✅ FIX: Trigger form validation before checking validity
      console.log("🔍 Triggering form validation...");
      console.log("🔍 Current form data before validation:", data);
      console.log("🔍 User role:", userRole, "Specific index:", specificIndex);
      const isValid = await form.trigger();
      console.log("✅ Form validation result:", isValid);
      console.log("✅ Updated form errors:", form.formState.errors);
      console.log("🔍 Form values being validated:", form.getValues());
      
      // For guarantor and co-applicant roles, we need to be more lenient with validation
      // since they don't have all the applicant fields filled out
      if (!isValid && (!userRole || userRole === 'applicant')) {
        console.log("❌ Form validation failed for applicant role");
        toast({
          title: 'Form validation failed',
          description: 'Please check the form for errors and try again.',
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      } else if (!isValid && userRole && (userRole.startsWith('coapplicant') || userRole.startsWith('guarantor'))) {
        console.log("⚠️ Form validation failed for role-specific submission, but continuing with role-specific validation");
        // Continue with role-specific validation below
      }
      
      // Ensure all required fields are present and valid based on user role
      let missingFields = [];
      
      // Only validate applicant-specific fields for applicant role
      if (!userRole || userRole === 'applicant') {
        const requiredFields: (keyof ApplicationFormData)[] = [
          'buildingAddress',
          'apartmentNumber',
          'moveInDate',
          'monthlyRent',
          'apartmentType',
          'applicantName',
          'applicantDob',
          'applicantEmail',
          'applicantAddress',
          'applicantCity',
          'applicantState',
          'applicantZip',
        ];
        
        for (const field of requiredFields) {
          // Resolve value with fallbacks for nested application and applicant fields
          let value = (data as any)[field];

          // Application-level fields can live under formData.application
          const applicationLevelFields = new Set([
            'buildingAddress',
            'apartmentNumber',
            'moveInDate',
            'monthlyRent',
            'apartmentType'
          ]);

          if (applicationLevelFields.has(field as string)) {
            value = value ?? (formData.application as any)?.[field as keyof typeof formData.application];
          }

          // Applicant fields can live under formData.applicant
          const applicantFieldMap: Record<string, string> = {
            applicantName: 'name',
            applicantDob: 'dob',
            applicantEmail: 'email',
            applicantAddress: 'address',
            applicantCity: 'city',
            applicantState: 'state',
            applicantZip: 'zip'
          };
          if (field in applicantFieldMap) {
            const nestedKey = applicantFieldMap[field as keyof typeof applicantFieldMap];
            value = value ?? (formData.applicant as any)?.[nestedKey];
          }

          if (
            value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '') ||
            (field === 'applicantDob' && !value) ||
            (field === 'moveInDate' && !value)
          ) {
            missingFields.push(field);
          }
        }
        
        // Email format check for applicant
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const effectiveApplicantEmail = data.applicantEmail || formData.applicant?.email || '';
        if (!emailRegex.test(effectiveApplicantEmail)) {
          missingFields.push('applicantEmail');
        }
      }
      
      // For co-applicant and guarantor roles, validate role-specific fields
      if (userRole && (userRole.startsWith('coapplicant') || userRole.startsWith('guarantor'))) {
        const roleType = userRole.startsWith('coapplicant') ? 'coApplicant' : 'guarantor';
        const roleData = formData[roleType + 's']?.[specificIndex || 0];
        
        console.log(`🔍 Validating ${roleType} ${(specificIndex || 0) + 1} fields:`, roleData);
        
        // Check required fields for the specific role
        const requiredRoleFields = ['name', 'email', 'phone', 'address', 'city', 'state', 'zip'];
        for (const field of requiredRoleFields) {
          const value = roleData?.[field];
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            missingFields.push(`${roleType}${(specificIndex || 0) + 1} ${field}`);
          }
        }
        
        // Email format check for role
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (roleData?.email && !emailRegex.test(roleData.email)) {
          missingFields.push(`${roleType}${(specificIndex || 0) + 1} email format`);
        }
      }
      
      if (missingFields.length > 0) {
        console.log('❌ Missing required fields:', missingFields);
        console.log('🔍 Detailed field validation:');
        console.log('- buildingAddress:', data.buildingAddress, '| formData.application?.buildingAddress:', formData.application?.buildingAddress);
        console.log('- apartmentNumber:', data.apartmentNumber, '| formData.application?.apartmentNumber:', formData.application?.apartmentNumber);
        console.log('- moveInDate:', data.moveInDate, '| formData.application?.moveInDate:', formData.application?.moveInDate);
        console.log('- monthlyRent:', data.monthlyRent, '| formData.application?.monthlyRent:', formData.application?.monthlyRent);
        console.log('- apartmentType:', data.apartmentType, '| formData.application?.apartmentType:', formData.application?.apartmentType);
        console.log('- applicantName:', data.applicantName, '| formData.applicant?.name:', formData.applicant?.name);
        console.log('- applicantDob:', data.applicantDob, '| formData.applicant?.dob:', formData.applicant?.dob);
        console.log('- applicantEmail:', data.applicantEmail, '| formData.applicant?.email:', formData.applicant?.email);
        console.log('- applicantAddress:', data.applicantAddress, '| formData.applicant?.address:', formData.applicant?.address);
        console.log('- applicantCity:', data.applicantCity, '| formData.applicant?.city:', formData.applicant?.city);
        console.log('- applicantState:', data.applicantState, '| formData.applicant?.state:', formData.applicant?.state);
        console.log('- applicantZip:', data.applicantZip, '| formData.applicant?.zip:', formData.applicant?.zip);
        console.log('🔍 Form state errors:', form.formState.errors);
        toast({
          title: 'Missing or invalid fields',
          description: `Please fill in: ${missingFields.join(', ')}`,
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }
      
      console.log('✅ All validation passed, proceeding with submission');
      
      // ENSURE FULL METADATA IS AVAILABLE FOR WEBHOOK
      
      console.log('📊 Full uploadedFilesMetadata for webhook:', JSON.stringify(uploadedFilesMetadata, null, 2));
      
      console.log('🚀 === COMPLETE FORM SUBMISSION DATA ===' );
      console.log("📋 FORM DATA (React Hook Form):");
      console.log(JSON.stringify(data, null, 2));
      
      console.log("📊 FORM STATE:");
      console.log("- Is Valid:", form.formState.isValid);
      console.log("- Is Dirty:", form.formState.isDirty);
      console.log("- Is Submitting:", form.formState.isSubmitting);
      console.log("- Validation Errors:", form.formState.errors);
      
      console.log("🗂️ FORM DATA STATE (Internal State):");
      console.log(JSON.stringify(formData, null, 2));
      
      console.log("📝 SIGNATURES:");
      console.log(JSON.stringify(signatures, null, 2));
      
      console.log("�� UPLOADED DOCUMENTS:");
      console.log(JSON.stringify(uploadedDocuments, null, 2));
      
      console.log("🔐 ENCRYPTED DOCUMENTS: (Removed from server request)");
      console.log("Count:", Object.keys(encryptedDocuments).length);
      console.log("Guarantor documents:", encryptedDocuments.guarantor);
      console.log("Applicant documents:", encryptedDocuments.applicant);
      console.log("Co-applicant documents:", encryptedDocuments.coApplicant);
      
      console.log("📋 UPLOADED FILES METADATA:");
      console.log(JSON.stringify(uploadedFilesMetadata, null, 2));
      
      console.log("🏦 BANK RECORDS:");
      console.log("- Applicant Bank Records:", formData.applicant?.bankRecords);
      console.log("- Co-Applicant Bank Records:", formData.coApplicant?.bankRecords);
      console.log("- Guarantor Bank Records:", formData.guarantor?.bankRecords);
      
      console.log("👥 OTHER OCCUPANTS:");
      console.log("formData.occupants:", formData.occupants);
      console.log("formData.otherOccupants:", formData.otherOccupants);
      console.log("Final otherOccupants:", formData.occupants || formData.otherOccupants || []);
      console.log("Occupants with SSN documents:", formData.occupants?.map((occ: any) => ({
        name: occ.name,
        ssnDocument: occ.ssnDocument ? 'UPLOADED' : 'NULL'
      })));
      
      console.log("⚖️ LEGAL QUESTIONS:");
      console.log("- Landlord Tenant Legal Action:", formData.legalQuestions?.landlordTenantLegalAction);
      console.log("- Landlord Tenant Legal Action Explanation:", formData.legalQuestions?.landlordTenantLegalActionExplanation);
      console.log("- Broken Lease:", formData.legalQuestions?.brokenLease);
      console.log("- Broken Lease Explanation:", formData.legalQuestions?.brokenLeaseExplanation);
      
      console.log("📅 DATE FIELDS:");
      console.log("- Move In Date (Form):", data.moveInDate);
      console.log("- Move In Date (State):", formData.application?.moveInDate);
      console.log("- Applicant DOB (Form):", data.applicantDob);
      console.log("- Applicant DOB (State):", formData.applicant?.dob);
      console.log("- Co-Applicant DOB (State):", formData.coApplicant?.dob);
      console.log("- Guarantor DOB (State):", formData.guarantor?.dob);
      
      console.log("📞 PHONE NUMBERS:");
      console.log("- Applicant Phone:", formData.applicant?.phone);
      console.log("- Co-Applicant Phone:", formData.coApplicant?.phone);
      console.log("- Guarantor Phone:", formData.guarantor?.phone);
      
      console.log("📧 EMAILS:");
      console.log("- Applicant Email:", data.applicantEmail);
      console.log("- Co-Applicant Email:", formData.coApplicant?.email);
      console.log("- Guarantor Email:", formData.guarantor?.email);
      
      console.log("🏠 ADDRESSES:");
      console.log("- Applicant Address:", {
        address: data.applicantAddress,
        city: data.applicantCity,
        state: data.applicantState,
        zip: data.applicantZip
      });
      console.log("- Co-Applicant Address:", {
        address: formData.coApplicant?.address,
        city: formData.coApplicant?.city,
        state: formData.coApplicant?.state,
        zip: formData.coApplicant?.zip
      });
      console.log("- Guarantor Address:", {
        address: formData.guarantor?.address,
        city: formData.guarantor?.city,
        state: formData.guarantor?.state,
        zip: formData.guarantor?.zip
      });
      
      console.log("💼 EMPLOYMENT:");
      console.log("- Applicant Employment:", {
        type: formData.applicant?.employmentType,
        employer: formData.applicant?.employerName,
        address: formData.applicant?.employerAddress,
        city: formData.applicant?.employerCity,
        state: formData.applicant?.employerState,
        zip: formData.applicant?.employerZip,
        phone: formData.applicant?.employerPhone,
        position: formData.applicant?.position,
        startDate: formData.applicant?.startDate,
        salary: formData.applicant?.salary
      });
      console.log("- Co-Applicant Employment:", {
        type: formData.coApplicant?.employmentType,
        employer: formData.coApplicant?.employerName,
        address: formData.coApplicant?.employerAddress,
        city: formData.coApplicant?.employerCity,
        state: formData.coApplicant?.employerState,
        zip: formData.coApplicant?.employerZip,
        phone: formData.coApplicant?.employerPhone,
        position: formData.coApplicant?.position,
        startDate: formData.coApplicant?.startDate,
        salary: formData.coApplicant?.salary
      });
      console.log("- Guarantor Employment:", {
        type: formData.guarantor?.employmentType,
        employer: formData.guarantor?.employerName,
        address: formData.guarantor?.employerAddress,
        city: formData.guarantor?.employerCity,
        state: formData.guarantor?.employerState,
        zip: formData.guarantor?.employerZip,
        phone: formData.guarantor?.employerPhone,
        position: formData.guarantor?.position,
        startDate: formData.guarantor?.startDate,
        salary: formData.guarantor?.salary
      });
      
      console.log("🏠 LANDLORD INFO:");
      console.log("- Applicant Landlord:", {
        name: formData.applicant?.landlordName,
        address1: formData.applicant?.landlordAddressLine1,
        address2: formData.applicant?.landlordAddressLine2,
        city: formData.applicant?.landlordCity,
        state: formData.applicant?.landlordState,
        zip: formData.applicant?.landlordZipCode,
        phone: formData.applicant?.landlordPhone,
        email: formData.applicant?.landlordEmail,
        currentRent: formData.applicant?.currentRent,
        reasonForMoving: formData.applicant?.reasonForMoving
      });
      console.log("- Co-Applicant Landlord:", {
        name: formData.coApplicant?.landlordName,
        address1: formData.coApplicant?.landlordAddressLine1,
        address2: formData.coApplicant?.landlordAddressLine2,
        city: formData.coApplicant?.landlordCity,
        state: formData.coApplicant?.landlordState,
        zip: formData.coApplicant?.landlordZipCode,
        phone: formData.coApplicant?.landlordPhone,
        email: formData.coApplicant?.landlordEmail,
        currentRent: formData.coApplicant?.currentRent,
        reasonForMoving: formData.coApplicant?.reasonForMoving
      });
      console.log("- Guarantor Landlord:", {
        name: formData.guarantor?.landlordName,
        address1: formData.guarantor?.landlordAddressLine1,
        address2: formData.guarantor?.landlordAddressLine2,
        city: formData.guarantor?.landlordCity,
        state: formData.guarantor?.landlordState,
        zip: formData.guarantor?.landlordZipCode,
        phone: formData.guarantor?.landlordPhone,
        email: formData.guarantor?.landlordEmail,
        currentRent: formData.guarantor?.currentRent,
        reasonForMoving: formData.guarantor?.reasonForMoving
      });
      console.log("📊 DATA SUMMARY:");
      console.log("- Application Info Fields:", Object.keys(data).filter(k => k.includes('building') || k.includes('apartment') || k.includes('moveIn') || k.includes('monthly') || k.includes('howDid')).length);
      console.log("- Primary Applicant Fields:", Object.keys(data).filter(k => k.startsWith('applicant')).length);
      console.log("- Co-Applicant Fields:", Object.keys(formData.coApplicant || {}).length);
      console.log("- Guarantor Fields:", Object.keys(formData.guarantor || {}).length);
      console.log("- Other Occupants Count:", formData.otherOccupants?.length || 0);
      console.log("- Documents Count:", (uploadedDocuments || []).length);
      console.log("- Encrypted Documents Count:", Object.keys(encryptedDocuments).length, "(Not sent to server)");
      console.log("- Signatures Count:", Object.keys(signatures).length);
      
      console.log("=== END COMPLETE FORM DATA ===");
      
      // Check if user is authenticated and has applicantId
      if (!user?.applicantId && !user?.zoneinfo) {
        console.log("❌ User not authenticated or missing applicantId");
        console.log("🔍 User object:", user);
        console.log("🔍 User applicantId:", user?.applicantId);
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to submit your application. If you are already signed in, please try refreshing the page.',
          variant: 'destructive',
        });
        return;
      }
      // Use the individual applicantId (could be temporary for development)
      console.log("✅ Using individual applicantId:", individualApplicantId);


      
      try {
        console.log("Submitting application:", { ...data, formData, signatures });
        console.log("Uploaded files metadata:", uploadedFilesMetadata);

        // Helper function to safely convert date to ISO string (preserving local date)
        const safeDateToISO = (dateValue: any): string | null => {
          if (!dateValue) return null;
          try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) {
              console.warn('Invalid date value:', dateValue);
              return null;
            }
            // For date-only fields, preserve the local date without timezone conversion
            // This prevents dates from shifting due to timezone offsets
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}T00:00:00.000Z`;
          } catch (error) {
            console.warn('Error converting date to ISO:', dateValue, error);
            return null;
          }
        };

        // Create COMPLETE form data structure for server submission (new nested structure)
        let completeServerData = {
          // Application Info (nested object)
          application: {
            buildingAddress: data.buildingAddress || formData.application?.buildingAddress,
            apartmentNumber: data.apartmentNumber || formData.application?.apartmentNumber,
            apartmentType: data.apartmentType || formData.application?.apartmentType,
            monthlyRent: data.monthlyRent || formData.application?.monthlyRent,
            moveInDate: safeDateToISO(data.moveInDate || formData.application?.moveInDate),
            howDidYouHear: data.howDidYouHear || formData.application?.howDidYouHear,
            howDidYouHearOther: data.howDidYouHearOther || formData.application?.howDidYouHearOther,
          },
          
          // Primary Applicant (nested object)
          applicant: {
            name: data.applicantName || formData.applicant?.name,
            email: data.applicantEmail || formData.applicant?.email,
            phone: formatPhoneForPayload(formData.applicant?.phone || data.applicantPhone),
            address: data.applicantAddress || formData.applicant?.address,
            city: data.applicantCity || formData.applicant?.city,
            state: data.applicantState || formData.applicant?.state,
            zip: data.applicantZip || formData.applicant?.zip,
            dob: safeDateToISO(data.applicantDob || formData.applicant?.dob),
            ssn: formData.applicant?.ssn || data.applicantSsn,
            license: formData.applicant?.license || data.applicantLicense,
            licenseState: formData.applicant?.licenseState || data.applicantLicenseState,
            lengthAtAddressYears: formData.applicant?.lengthAtAddressYears || data.applicantLengthAtAddressYears,
            lengthAtAddressMonths: formData.applicant?.lengthAtAddressMonths || data.applicantLengthAtAddressMonths,
            landlordName: formData.applicant?.landlordName || data.applicantLandlordName,
            landlordAddressLine1: formData.applicant?.landlordAddressLine1 || data.applicantLandlordAddressLine1,
            landlordAddressLine2: formData.applicant?.landlordAddressLine2 || data.applicantLandlordAddressLine2,
            landlordCity: formData.applicant?.landlordCity || data.applicantLandlordCity,
            landlordState: formData.applicant?.landlordState || data.applicantLandlordState,
            landlordZipCode: formData.applicant?.landlordZipCode || data.applicantLandlordZipCode,
            landlordPhone: formData.applicant?.landlordPhone || data.applicantLandlordPhone,
            landlordEmail: formData.applicant?.landlordEmail || data.applicantLandlordEmail,
            currentRent: formData.applicant?.currentRent || data.applicantCurrentRent,
            reasonForMoving: formData.applicant?.reasonForMoving || data.applicantReasonForMoving,
            age: formData.applicant?.age || 0,
            employmentType: formData.applicant?.employmentType,
            employer: formData.applicant?.employer,
            position: formData.applicant?.position,
            employmentStart: safeDateToISO(formData.applicant?.employmentStart),
            income: formData.applicant?.income,
            incomeFrequency: formData.applicant?.incomeFrequency,
            businessName: formData.applicant?.businessName,
            businessType: formData.applicant?.businessType,
            yearsInBusiness: formData.applicant?.yearsInBusiness,
            otherIncome: formData.applicant?.otherIncome,
            otherIncomeFrequency: formData.applicant?.otherIncomeFrequency,
            otherIncomeSource: formData.applicant?.otherIncomeSource,
            bankRecords: (formData.applicant?.bankRecords || []).map((record: any) => ({
              bankName: record.bankName,
              accountType: record.accountType,
              accountNumber: record.accountNumber || ""
            })),
          },
          
          // Co-Applicants (array) - Include all co-applicants for primary applicant role
          coApplicants: (formData.coApplicants || []).map((coApp: any) => ({
            name: coApp.name,
            email: coApp.email,
            phone: coApp.phone,
            address: coApp.address,
            city: coApp.city,
            state: coApp.state,
            zip: coApp.zip,
            dob: coApp.dob,
            ssn: coApp.ssn,
            license: coApp.license,
            licenseState: coApp.licenseState,
            lengthAtAddressYears: coApp.lengthAtAddressYears,
            lengthAtAddressMonths: coApp.lengthAtAddressMonths,
            landlordName: coApp.landlordName,
            landlordAddressLine1: coApp.landlordAddressLine1,
            landlordAddressLine2: coApp.landlordAddressLine2,
            landlordCity: coApp.landlordCity,
            landlordState: coApp.landlordState,
            landlordZipCode: coApp.landlordZipCode,
            landlordPhone: coApp.landlordPhone,
            landlordEmail: coApp.landlordEmail,
            currentRent: coApp.currentRent,
            reasonForMoving: coApp.reasonForMoving,
            age: coApp.age || 0,
            employmentType: coApp.employmentType,
            employer: coApp.employer,
            position: coApp.position,
            employmentStart: coApp.employmentStart,
            income: coApp.income,
            incomeFrequency: coApp.incomeFrequency,
            businessName: coApp.businessName,
            businessType: coApp.businessType,
            yearsInBusiness: coApp.yearsInBusiness,
            otherIncome: coApp.otherIncome,
            otherIncomeFrequency: coApp.otherIncomeFrequency,
            otherIncomeSource: coApp.otherIncomeSource,
            bankRecords: (coApp.bankRecords || []).map((record: any) => ({
              bankName: record.bankName,
              accountType: record.accountType,
              accountNumber: record.accountNumber || ""
            })),
          })),
          
          // Guarantors (array) - Include all guarantors for primary applicant role
          guarantors: (formData.guarantors || []).map((guar: any) => ({
            name: guar.name,
            email: guar.email,
            phone: guar.phone,
            address: guar.address,
            city: guar.city,
            state: guar.state,
            zip: guar.zip,
            dob: guar.dob,
            ssn: guar.ssn,
            license: guar.license,
            licenseState: guar.licenseState,
            lengthAtAddressYears: guar.lengthAtAddressYears,
            lengthAtAddressMonths: guar.lengthAtAddressMonths,
            landlordName: guar.landlordName,
            landlordAddressLine1: guar.landlordAddressLine1,
            landlordAddressLine2: guar.landlordAddressLine2,
            landlordCity: guar.landlordCity,
            landlordState: guar.landlordState,
            landlordZipCode: guar.landlordZipCode,
            landlordPhone: guar.landlordPhone,
            landlordEmail: guar.landlordEmail,
            currentRent: guar.currentRent,
            reasonForMoving: guar.reasonForMoving,
            age: guar.age || 0,
            employmentType: guar.employmentType,
            employer: guar.employer,
            position: guar.position,
            employmentStart: guar.employmentStart,
            income: guar.income,
            incomeFrequency: guar.incomeFrequency,
            businessName: guar.businessName,
            businessType: guar.businessType,
            yearsInBusiness: guar.yearsInBusiness,
            otherIncome: guar.otherIncome,
            otherIncomeFrequency: guar.otherIncomeFrequency,
            otherIncomeSource: guar.otherIncomeSource,
            bankRecords: (guar.bankRecords || []).map((record: any) => ({
              bankName: record.bankName,
              accountType: record.accountType,
              accountNumber: record.accountNumber || ""
            })),
          })),
          
          // Occupants (array)
          occupants: (formData.occupants || formData.otherOccupants || []).map((occupant: any) => ({
            name: occupant.name,
            relationship: occupant.relationship,
            dob: occupant.dob,
            ssn: occupant.ssn,
            license: occupant.license,
            age: occupant.age || 0
          })),
          
          // Core metadata fields
          applicantName: data.applicantName || formData.applicant?.name,
          applicantEmail: data.applicantEmail || formData.applicant?.email,
          application_id: user.applicantId,
          applicantId: user.applicantId,
          zoneinfo: user.applicantId,
          hasCoApplicant: hasCoApplicant,
          hasGuarantor: hasGuarantor,
          coApplicantCount: (formData.coApplicants || []).length,
          guarantorCount: (formData.guarantors || []).length,
          landlordTenantLegalAction: formData.landlordTenantLegalAction || "",
          brokenLease: formData.brokenLease || "",
          webhookSummary: getWebhookSummary(),
        };

        console.log("🔍 COMPLETE SERVER DATA BEING SENT:");
        console.log(JSON.stringify(completeServerData, null, 2));
        
        console.log('📊 Complete server data structure created (same as webhook)');
          console.log('🔍 Debug - uploadedDocuments type:', typeof uploadedDocuments);
          console.log('🔍 Debug - uploadedDocuments is array:', Array.isArray(uploadedDocuments));
          console.log('🔍 Debug - uploadedDocuments value:', uploadedDocuments);
        
                 // Create a server-optimized version with only document metadata
         const serverOptimizedData = {
           ...completeServerData,
           // Add applicantId from authenticated user
           applicantId: user.applicantId,
           // Completely remove encrypted documents from server request - they will be sent via webhook
           encryptedDocuments: undefined,
           // Remove uploadedFilesMetadata from server request - files are sent via webhook
           uploadedFilesMetadata: undefined
         };

        // Filter data for specific co-applicant/guarantor roles
        if (userRole.startsWith('coapplicant') && specificIndex !== null) {
          // For specific co-applicant, only include that co-applicant's data
          const specificCoApplicant = (formData.coApplicants || [])[specificIndex];
          if (specificCoApplicant) {
            (completeServerData as any).coApplicants = [specificCoApplicant];
            console.log(`🎯 Filtered data for co-applicant ${specificIndex + 1}:`, specificCoApplicant);
          }
        } else if (userRole.startsWith('guarantor') && specificIndex !== null) {
          // For specific guarantor, only include that guarantor's data
          console.log('🛡️ Processing guarantor data for submission...');
          console.log('🛡️ formData.guarantors:', formData.guarantors);
          console.log('🛡️ specificIndex:', specificIndex);
          console.log('🛡️ userRole:', userRole);
          
          const specificGuarantor = (formData.guarantors || [])[specificIndex];
          console.log('🛡️ specificGuarantor at index', specificIndex, ':', specificGuarantor);
          
          if (specificGuarantor && Object.keys(specificGuarantor).length > 0) {
            (completeServerData as any).guarantors = [specificGuarantor];
            console.log(`🎯 Filtered data for guarantor ${specificIndex + 1}:`, specificGuarantor);
          } else {
            // Fallback: if no specific guarantor found, try to get from the form data directly
            console.log('⚠️ No specific guarantor found at index', specificIndex, 'trying fallback');
            const fallbackGuarantor = (formData.guarantors || [])[0] || {};
            console.log('🛡️ fallbackGuarantor:', fallbackGuarantor);
            
            // If still no data, try to get from the form values directly
            if (!fallbackGuarantor || Object.keys(fallbackGuarantor).length === 0) {
              console.log('⚠️ No guarantor data in formData.guarantors, trying form values...');
              const formValues = form.getValues();
              console.log('🛡️ Form values guarantors:', formValues.guarantors);
              
              if (formValues.guarantors && formValues.guarantors[specificIndex]) {
                (completeServerData as any).guarantors = [formValues.guarantors[specificIndex]];
                console.log(`🎯 Using form values for guarantor ${specificIndex + 1}:`, formValues.guarantors[specificIndex]);
              } else if (formValues.guarantors && formValues.guarantors[0]) {
                (completeServerData as any).guarantors = [formValues.guarantors[0]];
                console.log(`🎯 Using form values fallback for guarantor:`, formValues.guarantors[0]);
              } else {
                console.error('❌ No guarantor data found anywhere!');
                (completeServerData as any).guarantors = [{}];
              }
            } else {
              (completeServerData as any).guarantors = [fallbackGuarantor];
              console.log(`🎯 Fallback guarantor data:`, fallbackGuarantor);
            }
          }
        }
        
        // Log payload size for debugging
        const payloadSize = JSON.stringify(completeServerData).length;
        const optimizedPayloadSize = JSON.stringify(serverOptimizedData).length;
        console.log(`📊 Original server data size: ${Math.round(payloadSize/1024)}KB`);
        console.log(`📊 Optimized server data size: ${Math.round(optimizedPayloadSize/1024)}KB`);
        console.log(`📊 Size reduction: ${Math.round((payloadSize - optimizedPayloadSize)/1024)}KB`);
        console.log(`📊 Size reduction percentage: ${Math.round(((payloadSize - optimizedPayloadSize) / payloadSize) * 100)}%`);
        
        // Additional debugging for the optimized data
        console.log('🔍 Optimized data analysis:');
        console.log('  - documents: REMOVED (sent via webhook)');
        console.log('  - signatures: REMOVED (sent via webhook)');
        console.log('  - uploadedFilesMetadata: REMOVED (sent via webhook)');
        
        console.log('SSN Debug:');
        console.log('  - formData.applicant.ssn:', formData.applicant?.ssn);
        console.log('  - data.applicantSsn:', data.applicantSsn);
        console.log('  - serverOptimizedData.applicant.ssn:', serverOptimizedData.applicant?.ssn);
        console.log('Date fields debug:');
        console.log('  - applicantDob (raw):', data.applicantDob);
        console.log('  - applicantDob (raw type):', typeof data.applicantDob);
        console.log('  - applicantDob (raw instanceof Date):', data.applicantDob instanceof Date);
        console.log('  - applicantDob (optimized):', serverOptimizedData.applicant?.dob);
        console.log('  - moveInDate (raw):', data.moveInDate);
        console.log('  - moveInDate (raw type):', typeof data.moveInDate);
        console.log('  - moveInDate (raw instanceof Date):', data.moveInDate instanceof Date);
        console.log('  - moveInDate (optimized):', serverOptimizedData.application?.moveInDate);
        console.log('Current window location:', window.location.href);
        
        // Resolve submission endpoints (try multiple in production)
        const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
        const explicitSubmitUrl = (import.meta as any).env?.VITE_SUBMIT_FUNCTION_URL as string | undefined;
        const candidateSubmitEndpoints: string[] = [];
        if (explicitSubmitUrl) candidateSubmitEndpoints.push(explicitSubmitUrl);
        candidateSubmitEndpoints.push(`${apiBase}/submit-application`);
        // Common Amplify/CloudFront path alias to Lambda gateway (if configured)
        candidateSubmitEndpoints.push('/aws/lambda/lppmrentals-submit-application');
        console.log('🔗 Submission endpoint candidates:', candidateSubmitEndpoints);
        
        // Validate required fields before submission based on user role
        console.log('🔍 VALIDATION DEBUG:');
        console.log('  - userRole:', userRole);
        console.log('  - specificIndex:', specificIndex);
        console.log('  - window.location.href:', window.location.href);
        
        // Check if this is a guarantor submission
        if (userRole && userRole.startsWith('guarantor') && specificIndex !== null) {
          // For guarantor role, validate guarantor data from the original formData
          const specificGuarantor = (formData.guarantors || [])[specificIndex];
          console.log('  - specificGuarantor:', specificGuarantor);
          
          if (!specificGuarantor?.dob) {
            console.log('❌ GUARANTOR DOB MISSING:', specificGuarantor);
            throw new Error('Date of birth is required. Please select your date of birth.');
          }
          if (!specificGuarantor?.name || specificGuarantor.name.trim() === '') {
            throw new Error('Full name is required. Please enter your full name.');
          }
          console.log('✅ GUARANTOR VALIDATION PASSED');
        } else if (userRole && userRole.startsWith('coapplicant') && specificIndex !== null) {
          // For co-applicant role, validate co-applicant data from the original formData
          const specificCoApplicant = (formData.coApplicants || [])[specificIndex];
          if (!specificCoApplicant?.dob) {
            throw new Error('Date of birth is required. Please select your date of birth.');
          }
          if (!specificCoApplicant?.name || specificCoApplicant.name.trim() === '') {
            throw new Error('Full name is required. Please enter your full name.');
          }
        } else {
          // For primary applicant role, validate applicant data
          if (!serverOptimizedData.applicant?.dob) {
            throw new Error('Date of birth is required. Please select your date of birth.');
          }
          if (!serverOptimizedData.applicantName || serverOptimizedData.applicantName.trim() === '') {
            throw new Error('Full name is required. Please enter your full name.');
          }
        }
        
        // Move-in date validation (only for primary applicant)
        if (!userRole || (!userRole.startsWith('guarantor') && !userRole.startsWith('coapplicant'))) {
          if (!serverOptimizedData.application?.moveInDate) {
            throw new Error('Move-in date is required. Please select your move-in date.');
          }
        }
        
        let serverSubmissionOk = false;
        let submissionResult: any = null;
        
        // Try server submission first, but fall back to webhook if it fails
        try {
          console.log('🔍 Attempting server submission...');
          
          // Extract basic user info for identification
          const userInfo = {
            name: serverOptimizedData.applicantName,
            email: serverOptimizedData.applicantEmail,
            phone: serverOptimizedData.applicant?.phone,
            applicationType: 'rental'
          };

          // Validate user info
          if (!userInfo.name || !userInfo.email) {
            throw new Error('Name and email are required for submission.');
          }

          // Prepare signatures for submission
          const submissionSignatures = prepareSignaturesForSubmission(signatures);
          
          const requestBody = {
            applicationData: {
              ...serverOptimizedData,
              signatures: submissionSignatures
            },
            userInfo: userInfo
          };
          
          // Log request body size instead of full content
          const requestBodySize = JSON.stringify(requestBody).length;
          console.log(`📊 Request body size: ${Math.round(requestBodySize/1024)}KB`);
          console.log(`📊 Request body size in MB: ${Math.round(requestBodySize/(1024*1024)*100)/100}MB`);
          console.log('Request body structure:', Object.keys(requestBody));
          
          // Create AbortController for submission timeout
          const submissionController = new AbortController();
          const submissionTimeoutId = setTimeout(() => submissionController.abort(), 45000); // 45 second timeout
          
          // Try candidates in order until one succeeds
          let submissionResponse: Response | null = null;
          let lastError: any = null;
          for (const endpoint of candidateSubmitEndpoints) {
            try {
              console.log('🌐 Attempting submission to:', endpoint);
              submissionResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: submissionController.signal
              });
              if (submissionResponse.ok) {
                console.log('✅ Submission succeeded at:', endpoint);
                break;
              }
              console.warn('⚠️ Submission returned non-OK from:', endpoint, submissionResponse.status);
            } catch (e) {
              console.warn('⚠️ Submission attempt failed at:', endpoint, e);
              lastError = e;
            }
          }
          if (!submissionResponse) {
            throw lastError || new Error('No submission response received');
          }

          // Evaluate response
          if (!submissionResponse.ok) {
            clearTimeout(submissionTimeoutId);
            const errorText = await submissionResponse.text();
            console.error('Submission response error:', submissionResponse.status, submissionResponse.statusText);
            console.error('Error response body:', errorText);
            
            // Handle specific error cases
            if (submissionResponse.status === 413) {
              throw new Error('Application data is too large. Please reduce file sizes and try again.');
            } else if (submissionResponse.status === 504) {
              throw new Error('Submission timed out. Please try again with smaller files or fewer files at once.');
            } else if (submissionResponse.status === 500) {
              console.warn('⚠️ Server error (500). Proceeding with webhook fallback.');
              serverSubmissionOk = false;
              // Don't throw error, just continue to webhook fallback
              console.log('🔄 500 error caught, will proceed with webhook submission');
            } else {
              throw new Error(`Submission failed: ${submissionResponse.status} ${submissionResponse.statusText}`);
            }
          } else {
            clearTimeout(submissionTimeoutId);
            submissionResult = await submissionResponse.json();
            serverSubmissionOk = true;
            console.log('✅ === SERVER SUBMISSION RESULT ===');
            console.log('📤 Data sent to server:', JSON.stringify(requestBody, null, 2));
            console.log('📥 Server response:', JSON.stringify(submissionResult, null, 2));
            if (submissionResult?.application_id) console.log('🔗 Application ID:', submissionResult.application_id);
            if (submissionResult?.reference_id) console.log('🔗 Reference ID:', submissionResult.reference_id);
            console.log('=== END SERVER SUBMISSION ===');
          }
        } catch (error) {
          console.warn('⚠️ Server submission failed. Proceeding with webhook fallback:', error);
          serverSubmissionOk = false;
        }
        
        // If server submission failed or endpoint doesn't exist, inform user about webhook fallback
        if (!serverSubmissionOk) {
          console.log('📤 Proceeding with webhook submission fallback...');
          toast({
            title: "Application Submission",
            description: "Submitting application via webhook system. This may take a moment.",
          });
          
          // Skip the rest of the server submission logic and go directly to webhook
          console.log('🔄 Bypassing server submission, proceeding with webhook submission...');
        }

        // Removed: do not update existing records' status on submit; create a new application only

        // Note: Encrypted data and files are now sent separately via webhooks
        if (serverSubmissionOk) {
          console.log('✅ Server submission successful. Files and encrypted data sent via webhooks.');
        } else {
          console.log('📤 Server submission failed. Proceeding with webhook submission fallback.');
          console.log('🔄 This is expected behavior when server endpoint is not available.');
        }
        // Disabled automatic PDF generation on submit
        let pdfUrl: string | null = null;
        console.log('🛑 Skipping PDF generation on submit for all roles');
        // On form submit, send complete form data, application_id, and uploadedDocuments to the webhook
        try {
          // Create complete webhook payload with ALL data
          const completeWebhookData = {
            // Role at top level
            role: 'applicant',
            // Application Info
            buildingAddress: data.buildingAddress,
            apartmentNumber: data.apartmentNumber,
            moveInDate: safeDateToISO(data.moveInDate || formData.application?.moveInDate),
            monthlyRent: data.monthlyRent,
            apartmentType: data.apartmentType,
            howDidYouHear: data.howDidYouHear,
            
            // Primary Applicant - Complete data
            applicantName: data.applicantName,
            applicantDob: safeDateToISO(data.applicantDob || formData.applicant?.dob),
            applicantSsn: formData.applicant?.ssn && formData.applicant.ssn.trim() !== '' ? formData.applicant.ssn : null,
            applicantPhone: formatPhoneForPayload(formData.applicant?.phone),
            applicantEmail: data.applicantEmail,
            applicantLicense: formData.applicant?.license || data.applicantLicense,
            applicantLicenseState: formData.applicant?.licenseState || data.applicantLicenseState,
            applicantAddress: data.applicantAddress,
            applicantCity: data.applicantCity,
            applicantState: data.applicantState,
            applicantZip: data.applicantZip,
            applicantLengthAtAddressYears: formData.applicant?.lengthAtAddressYears,
            applicantLengthAtAddressMonths: formData.applicant?.lengthAtAddressMonths,
            applicantLandlordName: formData.applicant?.landlordName,
            applicantLandlordAddressLine1: formData.applicant?.landlordAddressLine1,
            applicantLandlordAddressLine2: formData.applicant?.landlordAddressLine2,
            applicantLandlordCity: formData.applicant?.landlordCity,
            applicantLandlordState: formData.applicant?.landlordState,
            applicantLandlordZipCode: formData.applicant?.landlordZipCode,
            applicantLandlordPhone: formData.applicant?.landlordPhone,
            applicantLandlordEmail: formData.applicant?.landlordEmail,
            applicantCurrentRent: formData.applicant?.currentRent,
            applicantReasonForMoving: formData.applicant?.reasonForMoving,
            
            // Applicant Employment & Financial Info
            applicantEmploymentType: formData.applicant?.employmentType,
            applicantEmployerName: formData.applicant?.employerName,
            applicantEmployerAddress: formData.applicant?.employerAddress,
            applicantEmployerCity: formData.applicant?.employerCity,
            applicantEmployerState: formData.applicant?.employerState,
            applicantEmployerZip: formData.applicant?.employerZip,
            applicantEmployerPhone: formData.applicant?.employerPhone,
            applicantPosition: formData.applicant?.position,
            applicantStartDate: safeDateToISO(formData.applicant?.startDate),
            applicantSalary: formData.applicant?.income,
            applicantIncomeFrequency: formData.applicant?.incomeFrequency,
            applicantOtherIncome: formData.applicant?.otherIncome,
            applicantOtherIncomeSource: formData.applicant?.otherIncomeSource,
            applicantCreditScore: formData.applicant?.creditScore,
            applicantBankRecords: (formData.applicant?.bankRecords || []).map((record: any) => ({
              bankName: record.bankName,
              accountType: record.accountType
            })),
            
            // Flags
            hasCoApplicant: hasCoApplicant,
            hasGuarantor: hasGuarantor,
            
            // Co-Applicants - Complete data (if exists)
            ...(hasCoApplicant && (formData.coApplicants || []).length > 0 ? {
              coApplicants: (formData.coApplicants || []).map((coApplicant: any) => ({
                name: coApplicant.name,
                relationship: coApplicant.relationship,
                dob: coApplicant.dob,
                ssn: coApplicant.ssn,
                phone: coApplicant.phone,
                email: coApplicant.email,
                license: coApplicant.license,
                licenseState: coApplicant.licenseState,
                address: coApplicant.address,
                city: coApplicant.city,
                state: coApplicant.state,
                zip: coApplicant.zip,
                lengthAtAddressYears: coApplicant.lengthAtAddressYears,
                lengthAtAddressMonths: coApplicant.lengthAtAddressMonths,
                landlordName: coApplicant.landlordName,
                landlordAddressLine1: coApplicant.landlordAddressLine1,
                landlordAddressLine2: coApplicant.landlordAddressLine2,
                landlordCity: coApplicant.landlordCity,
                landlordState: coApplicant.landlordState,
                landlordZipCode: coApplicant.landlordZipCode,
                landlordPhone: coApplicant.landlordPhone,
                landlordEmail: coApplicant.landlordEmail,
                currentRent: coApplicant.currentRent,
                reasonForMoving: coApplicant.reasonForMoving,
                employmentType: coApplicant.employmentType,
                employer: coApplicant.employer,
                position: coApplicant.position,
                employmentStart: safeDateToISO(coApplicant.employmentStart),
                income: coApplicant.income,
                incomeFrequency: coApplicant.incomeFrequency,
                otherIncome: coApplicant.otherIncome,
                otherIncomeFrequency: coApplicant.otherIncomeFrequency,
                otherIncomeSource: coApplicant.otherIncomeSource,
                bankRecords: (coApplicant.bankRecords || []).map((record: any) => ({
                bankName: record.bankName,
                accountType: record.accountType
              })),
                coApplicantPosition: coApplicant.position,
                coApplicantStartDate: safeDateToISO(coApplicant.employmentStart),
                coApplicantSalary: coApplicant.income,
                // Add missing income frequency and other income fields for co-applicant
                coApplicantIncomeFrequency: coApplicant.incomeFrequency,
                coApplicantOtherIncome: coApplicant.otherIncome,
                coApplicantOtherIncomeSource: coApplicant.otherIncomeSource,
                coApplicantCreditScore: coApplicant.creditScore,
                coApplicantBankRecords: (coApplicant.bankRecords || []).map((record: any) => ({
                  bankName: record.bankName,
                  accountType: record.accountType
                }))
              }))
            } : {}),
            
            // Guarantors - Complete data (if exists)
            ...(hasGuarantor && (formData.guarantors || []).length > 0 ? {
              guarantors: (formData.guarantors || []).map((guarantor: any) => ({
                name: guarantor.name,
                relationship: guarantor.relationship,
                dob: guarantor.dob,
                ssn: guarantor.ssn,
                phone: guarantor.phone,
                email: guarantor.email,
                license: guarantor.license,
                licenseState: guarantor.licenseState,
                address: guarantor.address,
                city: guarantor.city,
                state: guarantor.state,
                zip: guarantor.zip,
                lengthAtAddressYears: guarantor.lengthAtAddressYears,
                lengthAtAddressMonths: guarantor.lengthAtAddressMonths,
                landlordName: guarantor.landlordName,
                landlordAddressLine1: guarantor.landlordAddressLine1,
                landlordAddressLine2: guarantor.landlordAddressLine2,
                landlordCity: guarantor.landlordCity,
                landlordState: guarantor.landlordState,
                landlordZipCode: guarantor.landlordZipCode,
                landlordPhone: guarantor.landlordPhone,
                landlordEmail: guarantor.landlordEmail,
                currentRent: guarantor.currentRent,
                reasonForMoving: guarantor.reasonForMoving,
                employmentType: guarantor.employmentType,
                businessName: guarantor.businessName,
                businessType: guarantor.businessType,
                yearsInBusiness: guarantor.yearsInBusiness,
                income: guarantor.income,
                incomeFrequency: guarantor.incomeFrequency,
                otherIncome: guarantor.otherIncome,
                otherIncomeFrequency: guarantor.otherIncomeFrequency,
                otherIncomeSource: guarantor.otherIncomeSource,
                bankRecords: (guarantor.bankRecords || []).map((record: any) => ({
                bankName: record.bankName,
                  accountType: record.accountType,
                  accountNumber: record.accountNumber || ""
                })),
                guarantorPosition: guarantor.position,
                guarantorStartDate: safeDateToISO(guarantor.employmentStart),
                guarantorSalary: guarantor.salary,
                // Add missing income frequency and other income fields for guarantor
                guarantorIncomeFrequency: guarantor.incomeFrequency,
                guarantorOtherIncome: guarantor.otherIncome,
                guarantorOtherIncomeSource: guarantor.otherIncomeSource,
                guarantorCreditScore: guarantor.creditScore,
                guarantorBankRecords: (guarantor.bankRecords || []).map((record: any) => ({
                  bankName: record.bankName,
                  accountType: record.accountType
                }))
              }))
            } : {}),
            
            // Other Occupants - Complete data (optimized to exclude large document data)
            otherOccupants: (formData.occupants || formData.otherOccupants || []).map((occupant: any) => ({
              name: occupant.name,
              relationship: occupant.relationship,
              dob: occupant.dob,
              ssn: occupant.ssn,
              license: occupant.license,
              age: occupant.age,
              // Remove large document data - will be sent via webhook
              ssnDocument: occupant.ssnDocument ? "UPLOADED" : null
            })),
            
            // Legal Questions
            landlordTenantLegalAction: formData.legalQuestions?.landlordTenantLegalAction,
            landlordTenantLegalActionExplanation: formData.legalQuestions?.landlordTenantLegalActionExplanation,
            brokenLease: formData.legalQuestions?.brokenLease,
            brokenLeaseExplanation: formData.legalQuestions?.brokenLeaseExplanation,
            
            // Signatures (optimized to avoid large base64 data)
            signatures: {
              applicant: signatures.applicant ? "SIGNED" : null,
              coApplicants: Object.keys(signatures.coApplicants || {}).length > 0 ? 
                Object.entries(signatures.coApplicants).map(([index, signature]) => 
                  signature ? `Co-Applicant ${parseInt(index) + 1} SIGNED` : null
                ).filter(Boolean).join(', ') : null,
              guarantors: Object.keys(signatures.guarantors || {}).length > 0 ? 
                Object.entries(signatures.guarantors).map(([index, signature]) => 
                  signature ? `Guarantor ${parseInt(index) + 1} SIGNED` : null
                ).filter(Boolean).join(', ') : null,
            },
            signatureTimestamps: signatureTimestamps,
            

            
            // Bank Information List
            bankInformation: {
              applicant: {
                bankRecords: (formData.applicant?.bankRecords || []).map((record: any) => ({
                  bankName: record.bankName,
                  accountType: record.accountType
                })),
                totalBankRecords: formData.applicant?.bankRecords?.length || 0,
                hasBankRecords: !!(formData.applicant?.bankRecords && formData.applicant.bankRecords.length > 0)
              },
              coApplicants: hasCoApplicant ? {
                bankRecords: (formData.coApplicants || []).map((coApplicant: any) => ({
                  bankName: coApplicant.bankRecords?.[0]?.bankName || '',
                  accountType: coApplicant.bankRecords?.[0]?.accountType || '',
                  totalBankRecords: coApplicant.bankRecords?.length || 0,
                  hasBankRecords: !!(coApplicant.bankRecords && coApplicant.bankRecords.length > 0)
                })),
                totalBankRecords: formData.coApplicants.reduce((total: number, coApplicant: any) => total + (coApplicant.bankRecords?.length || 0), 0),
                hasBankRecords: !!(formData.coApplicants?.[0]?.bankRecords?.length)
              } : null,
              guarantors: hasGuarantor ? {
                bankRecords: (formData.guarantors || []).map((guarantor: any) => ({
                  bankName: guarantor.bankRecords?.[0]?.bankName || '',
                  accountType: guarantor.bankRecords?.[0]?.accountType || '',
                  totalBankRecords: guarantor.bankRecords?.length || 0,
                  hasBankRecords: !!(guarantor.bankRecords && guarantor.bankRecords.length > 0)
                })),
                totalBankRecords: formData.guarantors.reduce((total: number, guarantor: any) => total + (guarantor.bankRecords?.length || 0), 0),
                hasBankRecords: !!(formData.guarantors?.[0]?.bankRecords?.length)
              } : null,
              summary: {
                totalPeople: 1 + (hasCoApplicant ? formData.coApplicants.length : 0) + (hasGuarantor ? formData.guarantors.length : 0),
                totalBankRecords: (formData.applicant?.bankRecords?.length || 0) + 
                                 (hasCoApplicant ? formData.coApplicants.reduce((total: number, coApplicant: any) => total + (coApplicant.bankRecords?.length || 0), 0) : 0) + 
                                 (hasGuarantor ? formData.guarantors.reduce((total: number, guarantor: any) => total + (guarantor.bankRecords?.length || 0), 0) : 0),
                peopleWithBankRecords: [
                  ...(formData.applicant?.bankRecords && formData.applicant.bankRecords.length > 0 ? ['applicant'] : []),
                  ...(hasCoApplicant ? (formData.coApplicants || []).map((coApplicant: any) => `coApplicant_${coApplicant.name}`) : []),
                  ...(hasGuarantor ? (formData.guarantors || []).map((guarantor: any) => `guarantor_${guarantor.name}`) : [])
                ]
              }
            },
            
            // Application IDs
            applicantId: individualApplicantId,
            application_id: individualApplicantId,
            reference_id: referenceId,
            

            
            // Webhook responses for uploaded documents
            webhookResponses: webhookResponses,
            
            // PDF URL from generated application PDF
            pdfUrl: pdfUrl,

            // Additional People in Application data - Always include this section
            "Additional People": {
              zoneinfo: user?.zoneinfo || 'unknown',
              role: 'applicant',
              applicant: data.applicantName || 'unknown',
              applicantEmail: data.applicantEmail || '',
              // Dynamically include all co-applicants
              ...(Array.isArray(formData.coApplicants) && formData.coApplicants.length > 0
                ? formData.coApplicants.reduce((acc: any, coApp: any, idx: number) => {
                    const i = idx + 1;
                    acc[`coApplicants${i}`] = {
                      coApplicant: `coapplicant${i}`,
                      url: `https://www.app.lppmrentals.com/login?role=coapplicant${i}&zoneinfo=${user?.zoneinfo || 'unknown'}`,
                      name: coApp?.name || '',
                      email: coApp?.email || ''
                    };
                    return acc;
                  }, {})
                : {}),
              // Dynamically include all guarantors
              ...(Array.isArray(formData.guarantors) && formData.guarantors.length > 0
                ? formData.guarantors.reduce((acc: any, guar: any, idx: number) => {
                    const i = idx + 1;
                    acc[`guarantor${i}`] = {
                      guarantor: `guarantor${i}`,
                      url: `https://www.app.lppmrentals.com/login?role=guarantor${i}&zoneinfo=${user?.zoneinfo || 'unknown'}`,
                      name: guar?.name || '',
                      email: guar?.email || ''
                    };
                    return acc;
                  }, {})
                : {})
            }

          };

          const webhookPayload = completeWebhookData;

          // Check payload size before sending
          const payloadSize = JSON.stringify(webhookPayload).length;
          const payloadSizeMB = Math.round(payloadSize / (1024 * 1024) * 100) / 100;
          console.log(`📦 Raw webhook payload size: ${payloadSizeMB}MB`);
          
          // Debug income frequency values
          console.log('🔍 === INCOME FREQUENCY DEBUG IN APPLICATION FORM ===');
          console.log('📊 Applicant income frequency:', (webhookPayload as any).applicantIncomeFrequency);
          console.log('📊 Co-Applicant income frequency:', (webhookPayload as any).coApplicantsIncomeFrequency);
          console.log('📊 Guarantor income frequency:', (webhookPayload as any).guarantorsIncomeFrequency);
          console.log('📊 Form data applicant income frequency:', formData.applicant?.incomeFrequency);
          console.log('📊 Form data co-applicants income frequency:', (formData.coApplicants || []).map((coApplicant: any) => coApplicant.incomeFrequency).join(', '));
          console.log('📊 Form data guarantors income frequency:', (formData.guarantors || []).map((guarantor: any) => guarantor.incomeFrequency).join(', '));
          console.log('=== END INCOME FREQUENCY DEBUG ===');
          
          if (payloadSize > 50 * 1024 * 1024) { // 50MB limit
            console.warn('⚠️ Raw webhook payload is very large:', payloadSizeMB, 'MB');
            console.warn('⚠️ Large data will be cleaned by webhook service');
          }

          console.log('=== WEBHOOK PAYLOAD DEBUG ===');
          console.log('✅ Complete Webhook Structure:');
          console.log('  - reference_id:', webhookPayload.reference_id);
          console.log('  - applicantId:', webhookPayload.applicantId);
          console.log('  - application_id:', webhookPayload.application_id);
          console.log('  - form_data: [Complete application data]');
          console.log('  - uploaded_files: [Complete files metadata]');
          console.log('  - submission_type: form_data');
          console.log('');
          console.log('📊 Data Verification:');
          console.log('  - Applicant SSN:', webhookPayload.applicantSsn);
          console.log('  - Other Occupants Count:', webhookPayload.otherOccupants?.length || 0);
          console.log('  - Bank Records - Applicant:', webhookPayload.applicantBankRecords?.length || 0);
          console.log('  - Bank Records - Co-Applicants:', webhookPayload.bankInformation?.coApplicants?.totalBankRecords || 0);
          console.log('  - Bank Records - Guarantors:', webhookPayload.guarantors?.length ? webhookPayload.guarantors.reduce((total: number, guar: any) => total + (guar.bankRecords?.length || 0), 0) : 0);
          console.log('  - Legal Questions:', {
            landlordTenantLegalAction: webhookPayload.landlordTenantLegalAction,
            brokenLease: webhookPayload.brokenLease
          });
          console.log('  - Signatures:', Object.keys(webhookPayload.signatures || {}));
          console.log('  - Bank Information:', {
            applicantBankRecords: webhookPayload.bankInformation?.applicant?.totalBankRecords || 0,
            coApplicantsBankRecords: webhookPayload.bankInformation?.coApplicants?.totalBankRecords || 0,
            guarantorsBankRecords: webhookPayload.bankInformation?.guarantors?.totalBankRecords || 0,
            totalBankRecords: webhookPayload.bankInformation?.summary?.totalBankRecords || 0
          });
          console.log('  - Uploaded Documents Count:', (uploadedDocuments || []).length);
          console.log('=== END WEBHOOK PAYLOAD DEBUG ===');


          // Send role-specific webhook submissions
          console.log('🌐 === ROLE-SPECIFIC WEBHOOK SUBMISSIONS ===');
          console.log('📤 Sending role-specific webhook...');
          console.log('🔗 Reference ID:', referenceId);
          console.log('🔗 Application ID:', user?.applicantId);
          console.log('🔗 User Role:', userRole, 'Specific Index:', specificIndex);
          
          let webhookResult;
          
          if (userRole && userRole.startsWith('coapplicant') && specificIndex !== null) {
            // Send co-applicant-specific webhook
            const coApplicant = formData.coApplicants?.[specificIndex];
            if (coApplicant && coApplicant.name) {
              console.log(`📤 Sending co-applicant ${specificIndex + 1} webhook...`);
              // Create complete form data for webhook service
              const completeFormData = {
                ...formData,
                ...webhookPayload,
                coApplicants: formData.coApplicants || [],
                guarantors: formData.guarantors || [],
                coApplicantCount: formData.coApplicantCount || (formData.coApplicants ? formData.coApplicants.length : 0),
                guarantorCount: formData.guarantorCount || (formData.guarantors ? formData.guarantors.length : 0),
                hasCoApplicant: formData.hasCoApplicant || (formData.coApplicants && formData.coApplicants.length > 0),
                hasGuarantor: formData.hasGuarantor || (formData.guarantors && formData.guarantors.length > 0)
              };
              
              webhookResult = await WebhookService.sendCoApplicantWebhook(
                coApplicant,
                specificIndex,
                completeFormData,
                referenceId,
                individualApplicantId,
                user?.zoneinfo,
                uploadedFilesMetadata
              );
            } else {
              webhookResult = { success: false, error: 'Co-applicant data not found' };
            }
          } else if (userRole && userRole.startsWith('guarantor') && specificIndex !== null) {
            // Send guarantor-specific webhook
            const guarantor = formData.guarantors?.[specificIndex];
            if (guarantor && guarantor.name) {
              console.log(`📤 Sending guarantor ${specificIndex + 1} webhook...`);
              // Create complete form data for webhook service
              const completeFormData = {
                ...formData,
                ...webhookPayload,
                coApplicants: formData.coApplicants || [],
                guarantors: formData.guarantors || [],
                coApplicantCount: formData.coApplicantCount || (formData.coApplicants ? formData.coApplicants.length : 0),
                guarantorCount: formData.guarantorCount || (formData.guarantors ? formData.guarantors.length : 0),
                hasCoApplicant: formData.hasCoApplicant || (formData.coApplicants && formData.coApplicants.length > 0),
                hasGuarantor: formData.hasGuarantor || (formData.guarantors && formData.guarantors.length > 0)
              };
              
              webhookResult = await WebhookService.sendGuarantorWebhook(
                guarantor,
                specificIndex,
                completeFormData,
                referenceId,
                individualApplicantId,
                user?.zoneinfo,
                uploadedFilesMetadata
              );
            } else {
              webhookResult = { success: false, error: 'Guarantor data not found' };
            }
          } else if (userRole === 'coapplicant') {
            // Generic co-applicant role: send one webhook per co-applicant present
            console.log('📤 Sending individual webhooks for all co-applicants...');
            const results: any[] = [];
            const coApplicantsArray = Array.isArray(formData.coApplicants) ? formData.coApplicants : [];
            for (let idx = 0; idx < coApplicantsArray.length; idx++) {
              const ca = coApplicantsArray[idx];
              if (ca && ca.name) {
                console.log(`📤 Sending co-applicant ${idx + 1} webhook...`);
                // Create complete form data for webhook service
                const completeFormData = {
                  ...formData,
                  ...webhookPayload,
                  coApplicants: formData.coApplicants || [],
                  guarantors: formData.guarantors || [],
                  coApplicantCount: formData.coApplicantCount || (formData.coApplicants ? formData.coApplicants.length : 0),
                  guarantorCount: formData.guarantorCount || (formData.guarantors ? formData.guarantors.length : 0),
                  hasCoApplicant: formData.hasCoApplicant || (formData.coApplicants && formData.coApplicants.length > 0),
                  hasGuarantor: formData.hasGuarantor || (formData.guarantors && formData.guarantors.length > 0)
                };
                
                const result = await WebhookService.sendCoApplicantWebhook(
                  ca,
                  idx,
                  completeFormData,
                  referenceId,
                  `${user?.applicantId || user?.zoneinfo}-coapplicant${idx + 1}`,
                  user?.zoneinfo,
                  uploadedFilesMetadata
                );
                results.push({ index: idx, ...result });
              }
            }
            const anySuccess = results.some(r => r.success);
            webhookResult = anySuccess ? { success: true, results } : { success: false, error: 'No co-applicant webhooks sent' };
          } else {
            // Send separate webhooks for all roles (applicant role)
            console.log('📤 Sending separate webhooks for all roles...');
            // Create complete form data for webhook service with proper form field documents
            const completeFormData = {
              ...formData,
              ...webhookPayload,
              // Ensure co-applicants and guarantors are included
              coApplicants: formData.coApplicants || [],
              guarantors: formData.guarantors || [],
              coApplicantCount: formData.coApplicantCount || (formData.coApplicants ? formData.coApplicants.length : 0),
              guarantorCount: formData.guarantorCount || (formData.guarantors ? formData.guarantors.length : 0),
              hasCoApplicant: formData.hasCoApplicant || (formData.coApplicants && formData.coApplicants.length > 0),
              hasGuarantor: formData.hasGuarantor || (formData.guarantors && formData.guarantors.length > 0),
              // Ensure webhook responses are properly included for form field documents
              webhookResponses: webhookResponses,
              // Include encrypted documents for form field documents
              encryptedDocuments: encryptedDocuments
            };
            
            webhookResult = await WebhookService.sendFormDataToWebhook(
              completeFormData,
              referenceId,
              individualApplicantId,
              user?.zoneinfo,
              uploadedFilesMetadata,
              userRole || 'applicant'
            );
          }
          console.log('📥 Webhook result:', JSON.stringify(webhookResult, null, 2));
          console.log('=== END WEBHOOK SUBMISSION ===');
          
          if (webhookResult.success) {
            toast({
              title: "Application Submitted & Sent",
              description: "Your rental application has been submitted and sent to webhook successfully.",
            });
            setShowSuccessPopup(true);
            setSubmissionReferenceId((submissionResult && submissionResult.reference_id) ? submissionResult.reference_id : referenceId);
          } else {
            console.log('❌ Webhook submission failed:', webhookResult.error);
            
            toast({
              title: "Application Submitted",
              description: "Your rental application has been submitted, but webhook delivery failed. Check console for details.",
            });
            setShowSuccessPopup(true);
            setSubmissionReferenceId((submissionResult && submissionResult.reference_id) ? submissionResult.reference_id : referenceId);
          }
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
          toast({
            title: "Application Submitted",
              description: "Your rental application has been submitted, but webhook delivery failed.",
          });
          setShowSuccessPopup(true);
          setSubmissionReferenceId((submissionResult && submissionResult.reference_id) ? submissionResult.reference_id : referenceId);
        }


        // Role-based submission to separate DynamoDB tables
        try {
          console.log('💾 Role-based submission to separate DynamoDB tables...');
          console.log('🔍 User role:', userRole, 'Specific index:', specificIndex);
          
          // Persist role-scoped data and signatures on submit
          const submittedFormRoleScoped = buildRoleScopedFormData(completeServerData, userRole || '', specificIndex ?? undefined);
          const submittedSigsRoleScoped = buildRoleScopedSignatures((completeServerData as any).signatures || signatures, userRole || '', specificIndex ?? undefined);

          let saveResults: boolean[] = [];

          // Role-based submission logic
          if (userRole === 'applicant') {
            console.log('👤 Primary Applicant submitting to app_nyc and applicant_nyc tables...');
            
            // Save Application Information to app_nyc table
            const submittedApplicationData = {
              application_info: {
                ...submittedFormRoleScoped.application,
                reference_id: submissionResult?.reference_id || referenceId,
                zoneinfo: (user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || '',
                // Persist Additional People on submit so DynamoDB record includes all invited parties
                ...((Array.isArray((completeServerData as any)?.coApplicants) || Array.isArray((completeServerData as any)?.guarantors))
                  ? {
                      "Additional People": {
                        zoneinfo: (user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || '',
                        role: 'applicant',
                        applicant: ((completeServerData as any)?.applicant?.name) || (form.getValues() as any)?.applicantName || 'unknown',
                        applicantEmail: ((completeServerData as any)?.applicant?.email) || (form.getValues() as any)?.applicantEmail || '',
                        // All co-applicants
                        ...((Array.isArray((completeServerData as any)?.coApplicants) && (completeServerData as any).coApplicants.length > 0)
                          ? (completeServerData as any).coApplicants.reduce((acc: any, coApp: any, idx: number) => {
                              const i = idx + 1;
                              acc[`coApplicants${i}`] = {
                                coApplicant: `coapplicant${i}`,
                                url: `https://www.app.lppmrentals.com/login?role=coapplicant${i}&zoneinfo=${(user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || ''}`,
                                name: coApp?.name || '',
                                email: coApp?.email || ''
                              };
                              return acc;
                            }, {})
                          : {}),
                        // All guarantors
                        ...((Array.isArray((completeServerData as any)?.guarantors) && (completeServerData as any).guarantors.length > 0)
                          ? (completeServerData as any).guarantors.reduce((acc: any, guar: any, idx: number) => {
                              const i = idx + 1;
                              acc[`guarantor${i}`] = {
                                guarantor: `guarantor${i}`,
                                url: `https://www.app.lppmrentals.com/login?role=guarantor${i}&zoneinfo=${(user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || ''}`,
                                name: guar?.name || '',
                                email: guar?.email || ''
                              };
                              return acc;
                            }, {})
                          : {})
                      }
                    }
                  : {})
              },
            current_step: 12, // Mark as completed
            status: 'submitted' as const,
            uploaded_files_metadata: (completeServerData as any).uploaded_files_metadata || {},
            webhook_responses: (completeServerData as any).webhook_responses || {},
            signatures: submittedSigsRoleScoped,
            encrypted_documents: (completeServerData as any).encrypted_documents || {},
              storage_mode: 'direct' as const,
              flow_type: 'separate_webhooks' as const,
              webhook_flow_version: '2.0',
              last_updated: new Date().toISOString()
            };

            const appSaveResult = await dynamoDBSeparateTablesUtils.saveApplicationData(submittedApplicationData);
            saveResults.push(appSaveResult);
            
            // Save Primary Applicant data to applicant_nyc table
            const submittedApplicantData = {
              applicant_info: submittedFormRoleScoped.applicant || {},
              occupants: submittedFormRoleScoped.occupants || [],
              webhookSummary: getWebhookSummary(),
              // Store applicant signature as base64 string or null
              signature: (() => {
                const sig = (submittedSigsRoleScoped as any)?.applicant;
                if (typeof sig === 'string' && sig.startsWith('data:image/')) return sig;
                return sig ?? null;
              })(),
              // Include Additional People on submit as camelCase field
              additionalPeople: ((): any => {
                const zone = (user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || '';
                const applicantName = ((completeServerData as any)?.applicant?.name) || (form.getValues() as any)?.applicantName || 'unknown';
                const applicantEmail = ((completeServerData as any)?.applicant?.email) || (form.getValues() as any)?.applicantEmail || '';
                const coBlocks = (Array.isArray((completeServerData as any)?.coApplicants) && (completeServerData as any).coApplicants.length > 0)
                  ? (completeServerData as any).coApplicants.reduce((acc: any, coApp: any, idx: number) => {
                      const i = idx + 1;
                      acc[`coApplicants${i}`] = {
                        coApplicant: `coapplicant${i}`,
                        url: `https://www.app.lppmrentals.com/login?role=coapplicant${i}&zoneinfo=${zone}`,
                        name: coApp?.name || '',
                        email: coApp?.email || ''
                      };
                      return acc;
                    }, {}) : {};
                const guarBlocks = (Array.isArray((completeServerData as any)?.guarantors) && (completeServerData as any).guarantors.length > 0)
                  ? (completeServerData as any).guarantors.reduce((acc: any, guar: any, idx: number) => {
                      const i = idx + 1;
                      acc[`guarantor${i}`] = {
                        guarantor: `guarantor${i}`,
                        url: `https://www.app.lppmrentals.com/login?role=guarantor${i}&zoneinfo=${zone}`,
                        name: guar?.name || '',
                        email: guar?.email || ''
                      };
                      return acc;
                    }, {}) : {};
                return {
                  zoneinfo: zone,
                  role: 'applicant',
                  applicant: applicantName,
                  applicantEmail: applicantEmail,
                  ...coBlocks,
                  ...guarBlocks
                };
              })(),
              co_applicants: submittedFormRoleScoped.coApplicants || [], // Include co-applicants data
              guarantors: submittedFormRoleScoped.guarantors || [], // Include guarantors data
              timestamp: new Date().toISOString(), // Add timestamp field
              status: 'submitted' as const,
              last_updated: new Date().toISOString()
            };

            const createdAppFinal = await dynamoDBSeparateTablesUtils.getApplicationDataByUserId();
            const finalAppId = createdAppFinal?.appid || undefined;
            const applicantSaveResult = await dynamoDBSeparateTablesUtils.saveApplicantDataNew(submittedApplicantData, finalAppId);
            saveResults.push(applicantSaveResult);
            
            console.log('✅ Primary Applicant data saved to app_nyc and applicant_nyc tables');

          } else if (userRole && userRole.startsWith('coapplicant')) {
            console.log('👥 Co-Applicant submitting to Co-Applicants table...');
            
            // Get the specific co-applicant data from the role-scoped form
            let coApplicantData = submittedFormRoleScoped.coApplicants?.[0] || {};
            console.log('📊 Initial co-applicant data to save:', coApplicantData);

            // If the co-applicant data is empty, try to get it from the form data directly (mirror guarantor fallback logic)
            if (!coApplicantData || Object.keys(coApplicantData).length === 0) {
              console.log('⚠️ Co-Applicant data is empty, trying to get from formData directly...');
              const formDataCoApplicant = (formData.coApplicants || [])[specificIndex || 0];
              if (formDataCoApplicant && Object.keys(formDataCoApplicant).length > 0) {
                coApplicantData = formDataCoApplicant;
                console.log('✅ Found co-applicant data in formData:', coApplicantData);
              } else {
                console.log('⚠️ No co-applicant data in formData, trying form values...');
                const formValues = form.getValues();
                const formValuesCoApplicant = (formValues.coApplicants || [])[specificIndex || 0];
                if (formValuesCoApplicant && Object.keys(formValuesCoApplicant).length > 0) {
                  coApplicantData = formValuesCoApplicant;
                  console.log('✅ Found co-applicant data in form values:', coApplicantData);
                } else {
                  console.error('❌ No co-applicant data found anywhere!');
                }
              }
            }

            console.log('📊 Final co-applicant data to save:', coApplicantData);
            
            // Save Co-Applicant data to Co-Applicants table with simplified structure
            const submittedCoApplicantData = {
              role: 'coApplicant', // Add role attribute at top level
              coapplicant_info: coApplicantData,
              occupants: submittedFormRoleScoped.occupants || [],
              webhookSummary: submittedFormRoleScoped.webhookSummary || getWebhookSummary(),
              // Use role-scoped coApplicants[0] signature (base64) or null
              signature: (() => {
                const sig = (submittedSigsRoleScoped as any)?.coApplicants?.[0];
                if (typeof sig === 'string' && sig.startsWith('data:image/')) return sig;
                return sig ?? null;
              })(),
              current_step: 4, // Final step stored as 4 for co-applicant
              status: 'submitted' as const,
              last_updated: new Date().toISOString()
            };

            // Get the appid from the application data to link co-applicant to application
            const existingApp = await dynamoDBSeparateTablesUtils.getApplicationDataByZoneinfo();
            const appid = selectedAppId || existingApp?.appid || submissionResult?.reference_id || referenceId;
            console.log('🔗 Linking co-applicant to appid:', appid);

            const coApplicantSaveResult = await dynamoDBSeparateTablesUtils.saveCoApplicantDataNew(submittedCoApplicantData, appid);
            saveResults.push(coApplicantSaveResult);
            
            console.log('✅ Co-Applicant data saved to Co-Applicants table');

          } else if (userRole && userRole.startsWith('guarantor')) {
            console.log('🛡️ Guarantor submitting to Guarantors_nyc table...');
            console.log('🛡️ submittedFormRoleScoped:', submittedFormRoleScoped);
            
            // Get the specific guarantor data from the role-scoped form
            let guarantorData = submittedFormRoleScoped.guarantors?.[0] || {};
            console.log('📊 Initial guarantor data to save:', guarantorData);
            console.log('📊 Initial guarantor data keys:', Object.keys(guarantorData));
            console.log('📊 Initial guarantor data is empty:', Object.keys(guarantorData).length === 0);
            
            // If the guarantor data is empty, try to get it from the form data directly
            if (!guarantorData || Object.keys(guarantorData).length === 0) {
              console.log('⚠️ Guarantor data is empty, trying to get from formData directly...');
              const formDataGuarantor = (formData.guarantors || [])[specificIndex || 0];
              if (formDataGuarantor && Object.keys(formDataGuarantor).length > 0) {
                guarantorData = formDataGuarantor;
                console.log('✅ Found guarantor data in formData:', guarantorData);
              } else {
                console.log('⚠️ No guarantor data in formData, trying form values...');
                const formValues = form.getValues();
                const formValuesGuarantor = (formValues.guarantors || [])[specificIndex || 0];
                if (formValuesGuarantor && Object.keys(formValuesGuarantor).length > 0) {
                  guarantorData = formValuesGuarantor;
                  console.log('✅ Found guarantor data in form values:', guarantorData);
                } else {
                  console.error('❌ No guarantor data found anywhere!');
                }
              }
            }
            
            console.log('📊 Final guarantor data to save:', guarantorData);
            console.log('📊 Final guarantor data keys:', Object.keys(guarantorData));
            console.log('📊 Final guarantor data has name:', !!guarantorData.name);
            console.log('📊 Final guarantor data has email:', !!guarantorData.email);
            console.log('📊 Final guarantor data has phone:', !!guarantorData.phone);
            console.log('📊 Final guarantor data has address:', !!guarantorData.address);
            console.log('📊 Final guarantor data is empty:', Object.keys(guarantorData).length === 0);
            
            // Save Guarantor data to Guarantors_nyc table with simplified structure
            const submittedGuarantorData = {
              role: 'Guarantor', // Add role attribute at top level
              guarantor_info: guarantorData,
              occupants: submittedFormRoleScoped.occupants || [],
              webhookSummary: submittedFormRoleScoped.webhookSummary || getWebhookSummary(),
              // Use role-scoped guarantors[0] signature (base64) or null
              signature: (() => {
                const sig = (submittedSigsRoleScoped as any)?.guarantors?.[0];
                if (typeof sig === 'string' && sig.startsWith('data:image/')) return sig;
                return sig ?? null;
              })(),
              current_step: getSequentialStepNumber(12, userRole), // Final step when submitted (5 for guarantor)
              status: 'submitted' as const,
              last_updated: new Date().toISOString()
            };
            
            console.log('📊 Final submittedGuarantorData:', submittedGuarantorData);

            // Get the appid from the application data to link guarantor to application
            const existingApp = await dynamoDBSeparateTablesUtils.getApplicationDataByZoneinfo();
            const appid = selectedAppId || existingApp?.appid || submissionResult?.reference_id || referenceId;
            console.log('🔗 Linking guarantor to appid:', appid);

            const guarantorSaveResult = await dynamoDBSeparateTablesUtils.saveGuarantorDataNew(submittedGuarantorData, appid);
            saveResults.push(guarantorSaveResult);
            
            console.log('✅ Guarantor data saved to Guarantors_nyc table');

          } else {
            console.log('❓ Unknown role, saving to all tables as fallback...');
            
            // Fallback: save to all tables if role is unknown
            const submittedApplicationData = {
              application_info: {
                ...submittedFormRoleScoped.application,
                reference_id: submissionResult?.reference_id || referenceId,
                zoneinfo: (user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || ''
              },
              current_step: 12,
              status: 'submitted' as const,
              uploaded_files_metadata: (completeServerData as any).uploaded_files_metadata || {},
              webhook_responses: (completeServerData as any).webhook_responses || {},
              signatures: submittedSigsRoleScoped,
              encrypted_documents: (completeServerData as any).encrypted_documents || {},
              storage_mode: 'direct' as const,
              flow_type: 'separate_webhooks' as const,
              webhook_flow_version: '2.0',
              last_updated: new Date().toISOString()
            };

            const appSaveResult = await dynamoDBSeparateTablesUtils.saveApplicationData(submittedApplicationData);
            saveResults.push(appSaveResult);
          }

          const allSaved = saveResults.every(result => result);
          if (allSaved) {
            console.log('✅ Role-based submission completed successfully');
          } else {
            console.warn('⚠️ Some parts of role-based submission failed');
          }
        } catch (dbError) {
          console.error('❌ Error in role-based submission:', dbError);
          // Don't show error to user as submission was successful
        }
      } catch (error) {
        console.error('Failed to submit application:', error);
        
        let errorMessage = "Failed to submit application. Please try again.";
        
        // Handle specific error types
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = "Submission timed out. Please try again with smaller files or fewer files at once.";
          } else if (error.message.includes('413')) {
            errorMessage = "Application data is too large. Please reduce file sizes and try again.";
          } else if (error.message.includes('504')) {
            errorMessage = "Submission timed out. Please try again with smaller files or fewer files at once.";
          } else {
            errorMessage = error.message;
          }
        }
        
        toast({
          title: "Submission Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Failed to submit application:', error);
      
      let errorMessage = "Failed to submit application. Please try again.";
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Submission timed out. Please try again with smaller files or fewer files at once.";
        } else if (error.message.includes('413')) {
          errorMessage = "Application data is too large. Please reduce file sizes and try again.";
        } else if (error.message.includes('504')) {
          errorMessage = "Submission timed out. Please try again with smaller files or fewer files at once.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }; // end onSubmit


  // Clear phone validation errors for empty or valid phone numbers
  useEffect(() => {
    if (formData.guarantors) {
      formData.guarantors.forEach((guarantor: any, index: number) => {
        const phoneValue = guarantor?.phone;
        const phoneError = form.formState.errors.guarantors?.[index]?.phone;
        
        // If there's a phone error but the phone is empty or valid, clear the error
        if (phoneError && (!phoneValue || phoneValue.trim() === '' || validatePhoneNumber(phoneValue))) {
          form.clearErrors(`guarantors.${index}.phone`);
        }
      });
    }
  }, [formData.guarantors, form.formState.errors.guarantors, form]);

  // Clear phone validation errors for co-applicants
  useEffect(() => {
    if (formData.coApplicants) {
      formData.coApplicants.forEach((coApplicant: any, index: number) => {
        const phoneValue = coApplicant?.phone;
        const phoneError = form.formState.errors.coApplicants?.[index]?.phone;
        
        // If there's a phone error but the phone is empty or valid, clear the error
        if (phoneError && (!phoneValue || phoneValue.trim() === '' || validatePhoneNumber(phoneValue))) {
          form.clearErrors(`coApplicants.${index}.phone`);
        }
      });
    }
  }, [formData.coApplicants, form.formState.errors.coApplicants, form]);

  // Sync formData.applicant.dob with form.applicantDob (preserving local date)
  useEffect(() => {
    const formValue = form.watch('applicantDob');
    const stateValue = formData.applicant?.dob;
    let dateObj = toValidDate(stateValue);
    if (dateObj) {
      if (!formValue || !(formValue instanceof Date) || formValue.getTime() !== dateObj.getTime()) {
        form.setValue('applicantDob', dateObj);
      }
    }
  }, [formData.applicant?.dob, form]);

  const copyAddressToGuarantor = async () => {
    if (sameAddressGuarantor) {
      const applicantAddress = formData.applicant;
      await updateFormData('guarantor', 'address', applicantAddress.address);
      await updateFormData('guarantor', 'city', applicantAddress.city);
      await updateFormData('guarantor', 'state', applicantAddress.state);
      await updateFormData('guarantor', 'zip', applicantAddress.zip);
      await updateFormData('guarantor', 'landlordName', applicantAddress.landlordName);
      await updateFormData('guarantor', 'landlordAddressLine1', applicantAddress.landlordAddressLine1);
      await updateFormData('guarantor', 'landlordAddressLine2', applicantAddress.landlordAddressLine2);
      await updateFormData('guarantor', 'landlordCity', applicantAddress.landlordCity);
      await updateFormData('guarantor', 'landlordState', applicantAddress.landlordState);
      await updateFormData('guarantor', 'landlordZipCode', applicantAddress.landlordZipCode);
      await updateFormData('guarantor', 'landlordPhone', applicantAddress.landlordPhone);
      await updateFormData('guarantor', 'landlordEmail', applicantAddress.landlordEmail);
      await updateFormData('guarantor', 'currentRent', applicantAddress.currentRent);
      await updateFormData('guarantor', 'lengthAtAddress', applicantAddress.lengthAtAddress);
    }
  };



  // Ensure applicantDob in formData and react-hook-form stay in sync for DatePicker display (preserving local date)
  useEffect(() => {
    const formValue = form.watch('applicantDob');
    const stateValue = formData.applicant?.dob;
    const dateObj = toValidDate(stateValue);
    if (dateObj && (!formValue || (formValue instanceof Date && dateObj instanceof Date && formValue.getTime() !== dateObj.getTime()))) {
      form.setValue('applicantDob', dateObj);
    }
  }, [formData.applicant?.dob, form]);
  // Ensure moveInDate in formData and react-hook-form stay in sync for DatePicker display
  useEffect(() => {
    const formValue = form.watch('moveInDate');
    const stateValue = formData.application?.moveInDate;
    console.log('📅 moveInDate sync check - formValue:', formValue, 'stateValue:', stateValue);
    if (stateValue && (!formValue || (formValue instanceof Date && stateValue instanceof Date && formValue.getTime() !== stateValue.getTime()))) {
      // Only set if different and stateValue is a valid Date
      if (stateValue instanceof Date && !isNaN(stateValue.getTime())) {
        console.log('📅 Setting moveInDate from Date object:', stateValue);
        form.setValue('moveInDate', stateValue);
      } else if (typeof stateValue === 'string' || typeof stateValue === 'number') {
        const parsed = new Date(stateValue);
        if (!isNaN(parsed.getTime())) {
          console.log('📅 Setting moveInDate from parsed string/number:', parsed);
          form.setValue('moveInDate', parsed);
        }
      }
    }
  }, [formData.application?.moveInDate, form]);

  // Do not auto-fill moveInDate 
  useEffect(() => {
    // Intentionally left blank: user must select a date
  }, []);

  // Ensure apartmentNumber in formData and react-hook-form stay in sync
  useEffect(() => {
    const formValue = form.watch('apartmentNumber');
    const stateValue = formData.application?.apartmentNumber;
    console.log('🏠 apartmentNumber sync check - formValue:', formValue, 'stateValue:', stateValue);
    if (stateValue !== undefined && formValue !== stateValue) {
      console.log('🏠 Setting apartmentNumber:', stateValue);
      form.setValue('apartmentNumber', stateValue || '');
    }
  }, [formData.application?.apartmentNumber, form]);

  // Ensure monthlyRent in formData and react-hook-form stay in sync
  useEffect(() => {
    const formValue = form.watch('monthlyRent');
    const stateValue = formData.application?.monthlyRent;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('monthlyRent', stateValue);
    }
  }, [formData.application?.monthlyRent, form]);

  // Ensure apartmentType in formData and react-hook-form stay in sync
  useEffect(() => {
    const formValue = form.watch('apartmentType');
    const stateValue = formData.application?.apartmentType;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('apartmentType', stateValue || '');
    }
  }, [formData.application?.apartmentType, form]);

  // Ensure apartmentNumber in formData and react-hook-form stay in sync
  useEffect(() => {
    const formValue = form.watch('apartmentNumber');
    const stateValue = formData.application?.apartmentNumber;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('apartmentNumber', stateValue || '');
    }
  }, [formData.application?.apartmentNumber, form]);

  // Ensure buildingAddress in formData and react-hook-form stay in sync
  useEffect(() => {
    const formValue = form.watch('buildingAddress');
    const stateValue = formData.application?.buildingAddress;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('buildingAddress', stateValue || '');
    }
  }, [formData.application?.buildingAddress, form]);

  // Ensure landlord fields in formData and react-hook-form stay in sync
  useEffect(() => {
    const formValue = form.watch('applicantLandlordName');
    const stateValue = formData.applicant?.landlordName;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantLandlordName', stateValue || '');
    }
  }, [formData.applicant?.landlordName, form]);

  useEffect(() => {
    const formValue = form.watch('applicantLandlordAddressLine1');
    const stateValue = formData.applicant?.landlordAddressLine1;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantLandlordAddressLine1', stateValue || '');
    }
  }, [formData.applicant?.landlordAddressLine1, form]);

  useEffect(() => {
    const formValue = form.watch('applicantLandlordAddressLine2');
    const stateValue = formData.applicant?.landlordAddressLine2;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantLandlordAddressLine2', stateValue || '');
    }
  }, [formData.applicant?.landlordAddressLine2, form]);

  useEffect(() => {
    const formValue = form.watch('applicantLandlordCity');
    const stateValue = formData.applicant?.landlordCity;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantLandlordCity', stateValue || '');
    }
  }, [formData.applicant?.landlordCity, form]);

  useEffect(() => {
    const formValue = form.watch('applicantLandlordState');
    const stateValue = formData.applicant?.landlordState;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantLandlordState', stateValue || '');
    }
  }, [formData.applicant?.landlordState, form]);

  useEffect(() => {
    const formValue = form.watch('applicantLandlordZipCode');
    const stateValue = formData.applicant?.landlordZipCode;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantLandlordZipCode', stateValue || '');
    }
  }, [formData.applicant?.landlordZipCode, form]);

  useEffect(() => {
    const formValue = form.watch('applicantLandlordPhone');
    const stateValue = formData.applicant?.landlordPhone;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantLandlordPhone', stateValue || '');
    }
  }, [formData.applicant?.landlordPhone, form]);

  useEffect(() => {
    const formValue = form.watch('applicantLandlordEmail');
    const stateValue = formData.applicant?.landlordEmail;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantLandlordEmail', stateValue || '');
    }
  }, [formData.applicant?.landlordEmail, form]);

  useEffect(() => {
    const formValue = form.watch('applicantCurrentRent');
    const stateValue = formData.applicant?.currentRent;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantCurrentRent', stateValue);
    }
  }, [formData.applicant?.currentRent, form]);

  useEffect(() => {
    const formValue = form.watch('applicantReasonForMoving');
    const stateValue = formData.applicant?.reasonForMoving;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantReasonForMoving', stateValue || '');
    }
  }, [formData.applicant?.reasonForMoving, form]);

  useEffect(() => {
    const formValue = form.watch('applicantLengthAtAddressYears');
    const stateValue = formData.applicant?.lengthAtAddressYears;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantLengthAtAddressYears', stateValue);
    }
  }, [formData.applicant?.lengthAtAddressYears, form]);

  useEffect(() => {
    const formValue = form.watch('applicantLengthAtAddressMonths');
    const stateValue = formData.applicant?.lengthAtAddressMonths;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantLengthAtAddressMonths', stateValue);
    }
  }, [formData.applicant?.lengthAtAddressMonths, form]);

  // Ensure city, state, and zip fields in formData and react-hook-form stay in sync
  useEffect(() => {
    const formValue = form.watch('applicantCity');
    const stateValue = formData.applicant?.city;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantCity', stateValue || '');
    }
  }, [formData.applicant?.city, form]);

  useEffect(() => {
    const formValue = form.watch('applicantState');
    const stateValue = formData.applicant?.state;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantState', stateValue || '');
    }
  }, [formData.applicant?.state, form]);

  useEffect(() => {
    const formValue = form.watch('applicantZip');
    const stateValue = formData.applicant?.zip;
    if (stateValue !== undefined && formValue !== stateValue) {
      form.setValue('applicantZip', stateValue || '');
    }
  }, [formData.applicant?.zip, form]);

  // Debug apartment, address, and landlord field values
  useEffect(() => {
    const apartmentNumberValue = form.watch('apartmentNumber');
    const apartmentTypeValue = form.watch('apartmentType');
    const monthlyRentValue = form.watch('monthlyRent');
    const buildingAddressValue = form.watch('buildingAddress');
    const cityValue = form.watch('applicantCity');
    const stateValue = form.watch('applicantState');
    const zipValue = form.watch('applicantZip');
    const landlordCityValue = form.watch('applicantLandlordCity');
    const landlordStateValue = form.watch('applicantLandlordState');
    const landlordZipValue = form.watch('applicantLandlordZipCode');
    
    console.log('🔍 Apartment, address, and landlord field values in form:', {
      apartmentNumber: apartmentNumberValue,
      apartmentType: apartmentTypeValue,
      buildingAddress: buildingAddressValue,
      city: cityValue,
      state: stateValue,
      zip: zipValue,
      landlordCity: landlordCityValue,
      landlordState: landlordStateValue,
      landlordZip: landlordZipValue
    });

    // Synchronize form values back to formData state
    if (apartmentNumberValue !== formData.application?.apartmentNumber) {
      updateFormData('application', 'apartmentNumber', apartmentNumberValue);
    }
    if (apartmentTypeValue !== formData.application?.apartmentType) {
      updateFormData('application', 'apartmentType', apartmentTypeValue);
    }
    if (buildingAddressValue !== formData.application?.buildingAddress) {
      updateFormData('application', 'buildingAddress', buildingAddressValue);
    }
    if (monthlyRentValue !== formData.application?.monthlyRent) {
      updateFormData('application', 'monthlyRent', monthlyRentValue);
    }
    
    console.log('🔍 Apartment, address, and landlord field values in formData:', {
      apartmentNumber: formData.application?.apartmentNumber,
      apartmentType: formData.application?.apartmentType,
      buildingAddress: formData.application?.buildingAddress,
      city: formData.applicant?.city,
      state: formData.applicant?.state,
      zip: formData.applicant?.zip,
      landlordCity: formData.applicant?.landlordCity,
      landlordState: formData.applicant?.landlordState,
      landlordZipCode: formData.applicant?.landlordZipCode
    });
  }, [form.watch('apartmentNumber'), form.watch('apartmentType'), form.watch('buildingAddress'), form.watch('monthlyRent'), form.watch('applicantCity'), form.watch('applicantState'), form.watch('applicantZip'), form.watch('applicantLandlordCity'), form.watch('applicantLandlordState'), form.watch('applicantLandlordZipCode'), formData.application?.apartmentNumber, formData.application?.apartmentType, formData.application?.buildingAddress, formData.application?.monthlyRent, formData.applicant?.city, formData.applicant?.state, formData.applicant?.zip, formData.applicant?.landlordCity, formData.applicant?.landlordState, formData.applicant?.landlordZipCode]);

  // Refactor renderStep to accept a stepIdx argument
  const renderStep = (stepIdx = currentStep) => {
    const actualStepId = getActualStepId(stepIdx);
    switch (actualStepId) {
      case 0:
        return (
          <div className="space-y-6">
           
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-900 space-y-4">
                  <p>Thank you for choosing a Liberty Place Property Management apartment.</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Applicants must show income of <span style={{ fontSize: 18, fontWeight: 500 }}>40 TIMES THE MONTHLY RENT.</span> (may be combined among applicants)</li>
                    <li>Guarantors must show income of <span style={{ fontSize: 18, fontWeight: 500 }}>80 TIMES THE MONTHLY RENT.</span> (may NOT be combined with applicants)</li>
                    <li>Application packages must be submitted in full as detailed below. Only complete applications will be reviewed and considered for tenancy.</li>
                    <li>Applications will not remove apartments from the market.</li>
                    <li>Lease signings must be scheduled within three (3) days of approval or the backup applicant will be considered.</li>
                  </ol>
                  <p>We look forward to servicing your residential needs.</p>
                  <div className="font-bold">YOUR APPLICATION PACKAGE MUST INCLUDE:</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Completed and Signed application by applicants and guarantors.</li>
                    <li>Driver's License or Photo ID (18 &amp; over)</li>
                    <li>Social Security Card </li>
                    <li>Financial Statement First Page (Checking, Savings and/or other assets)</li>
                    <li>Previous year tax returns First Page</li>
                  </ul>
                  <div className="font-bold">Proof of Employment if you work for a company:</div>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Letter on company letterhead From current employerincluding length of employment, salary &amp; position</li>
                    <li>Last 4 paystubs (If paid weekly) - or - Last 2 paystubs (if paid every weeks or semi-monthly)</li>
                  </ol>
                  <div className="font-bold">Proof of Employment if you are self-employed:</div>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Previous year 1099</li>
                    <li>Notarized Letter from your accountant on his/her company letterhead verifying:</li>
                  </ol>
                  <ul className="list-disc pl-8 space-y-1">
                    <li>A. Nature of the business</li>
                    <li>B. Length of employment</li>
                    <li>C. Income holdings</li>
                    <li>D. Projected annual income expected for the current year and upcoming year.</li>
                  </ul>
                  <div className="font-bold">CORPORATE APPLICANTS MUST SUBMIT A SEPARATE APPLICATION ALONG WITH:</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>$150.00 Non-refundable application fee</li>
                    <li>Corporate officer as a guarantor</li>
                    <li>Information of the company employee that will occupy the apartment</li>
                    <li>Certified Financial Statements</li>
                    <li>Corporate Tax Returns (two (2) most recent consecutive returns)</li>
                  </ul>
                   {/* Role selector removed as requested */}

            {/* Application (app_nyc) selector if zoneinfo matches (hidden for applicant role) */}
            {userRole !== 'applicant' && (
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Application</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={selectedAppId}
                  onChange={(e) => handleAppSelect(e.target.value)}
                >
                  {appOptions.length === 0 && (
                    <option value="">No matching application found</option>
                  )}
                  {appOptions.map(opt => (
                    <option key={opt.appid} value={opt.appid}>
                      {opt.appid} — {opt.apartmentNumber || '-'} — {opt.buildingAddress || '-'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Instructional content block */}
                </div>
              </CardContent>
            </Card>

          </div>
        );
      case 1:
        return (
          <Card className="form-section">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Application Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="buildingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Address</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value || formData.application?.buildingAddress || ''}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleBuildingSelect(value);
                          }}
                          disabled={isLoadingUnits}
                          key={`buildingAddress-${formData.application?.buildingAddress || 'empty'}`}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingUnits ? "Loading..." : "Select building address"} />
                          </SelectTrigger>
                          <SelectContent>
                            {MondayApiService.getUniqueBuildingAddresses(units).map((address) => (
                              <SelectItem key={address} value={address}>
                                {address}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apartmentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apartment #</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value || formData.application?.apartmentNumber || ''}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleApartmentSelect(value);
                          }}
                          disabled={!selectedBuilding || availableApartments.length === 0}
                          key={`apartmentNumber-${formData.application?.apartmentNumber || 'empty'}`}
                        >
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={
                                field.value || formData.application?.apartmentNumber
                                  ? (field.value || formData.application?.apartmentNumber)
                                  : !selectedBuilding 
                                    ? "Select building first" 
                                    : availableApartments.length === 0 
                                      ? "No apartments available" 
                                      : "Select apartment"
                              } 
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableApartments.map((apartment) => (
                              <SelectItem key={apartment.id} value={apartment.name}>
                                {apartment.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="moveInDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Move-in Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : undefined)}
                          onChange={(date) => {
                            const onlyDate = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : undefined;
                            field.onChange(onlyDate);
                            updateFormData('application', 'moveInDate', onlyDate);
                          }}
                          placeholder="Select move-in date"
                          disabled={(date) => {
                            const today = new Date(); today.setHours(0,0,0,0);
                            const d = new Date(date); d.setHours(0,0,0,0);
                            return d < today; // allow today and future
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="monthlyRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Rent ($) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="0.00"
                          {...field}
                          className="input-field"
                          value={field.value?.toString() || formData.application?.monthlyRent?.toString() || selectedUnit?.monthlyRent?.toString() || ''}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apartmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apartment Type</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Auto-populated from building selection" 
                          {...field}
                          className="input-field bg-gray-50"
                          readOnly
                          value={field.value || formData.application?.apartmentType || selectedUnit?.unitType || ''}
                          key={`apartmentType-${formData.application?.apartmentType || 'empty'}`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <Label className="text-base font-medium">How did you hear about us?</Label>
                <div className="flex flex-wrap gap-4 mt-3">
                  {['Building Sign', 'Broker', 'Streeteasy', 'Other'].map((option) => (
                    <div key={option} className="flex items-center space-x-2 checkbox-container">
                      <Checkbox 
                        id={option}
                        checked={formData.application?.howDidYouHear === option}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFormData('application', 'howDidYouHear', option);
                            form.setValue('howDidYouHear', option);
                            if (option === 'Other') {
                              setShowHowDidYouHearOther(true);
                            } else {
                              setShowHowDidYouHearOther(false);
                              updateFormData('application', 'howDidYouHearOther', '');
                              form.setValue('howDidYouHearOther', '');
                            }
                          } else {
                            updateFormData('application', 'howDidYouHear', '');
                            form.setValue('howDidYouHear', '');
                            if (option === 'Other') {
                              setShowHowDidYouHearOther(false);
                              updateFormData('application', 'howDidYouHearOther', '');
                              form.setValue('howDidYouHearOther', '');
                            }
                          }
                        }}
                      />
                      <Label htmlFor={option} className="text-sm font-normal">{option}</Label>
                    </div>
                  ))}
                </div>
                
                {showHowDidYouHearOther && (
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="howDidYouHearOther"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Please specify how you heard about us</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Please specify..." 
                              {...field}
                              className="input-field"
                              value={field.value || ''}
                              onChange={(e) => {
                                field.onChange(e);
                                updateFormData('application', 'howDidYouHearOther', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card className="form-section">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="w-5 h-5 mr-2" />
                Primary Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-8">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-1 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-0.5">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter full name" 
                            value={field.value || ''}
                            className="input-field w-full mt-1"
                            onChange={(e) => {
                              field.onChange(e);
                              updateFormData('applicant', 'name', e.target.value);
                              // Also update the top-level field for compatibility
                              updateFormData('', 'applicantName', e.target.value);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="applicantDob"
                  render={({ field }) => {
                    const dateVal = toValidDate(formData.applicant?.dob);
                    const safeDate = (dateVal instanceof Date && !isNaN(dateVal.getTime())) ? dateVal : undefined;
                    return (
                      <FormItem>
                        <FormLabel className="mb-0.5">Date of Birth *</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={safeDate as Date | undefined}
                            onChange={(date) => {
                              field.onChange(date);
                              // Store the date as a local date to prevent timezone conversion
                              const localDate = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : undefined;
                              updateFormData('applicant', 'dob', localDate);
                              // Auto-calculate age
                              if (date) {
                                const today = new Date();
                                const birthDate = new Date(date);
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                  age--;
                                }
                                updateFormData('applicant', 'age', age);
                              } else {
                                updateFormData('applicant', 'age', '');
                              }
                            }}
                            placeholder="Select date of birth"
                            className="w-full mt-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="applicantSsn"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SSNInput
                          name="applicantSsn"
                          label="Social Security Number"
                          placeholder="XXX-XX-XXXX"
                          value={formData.applicant?.ssn || field.value || ''}
                          onChange={(value) => {
                            field.onChange(value);
                            updateFormData('applicant', 'ssn', value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applicantPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PhoneInput
                          name="applicantPhone"
                          label="Phone Number"
                          placeholder="(555) 555-5555"
                          value={formData.applicant?.phone || field.value || ''}
                          onChange={(value) => {
                            field.onChange(value);
                            updateFormData('applicant', 'phone', value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applicantEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <EmailInput
                          name="applicantEmail"
                          label="Email Address"
                          placeholder="you@email.com"
                          value={formData.applicant?.email || field.value || ''}
                          onChange={(value) => {
                            field.onChange(value);
                            updateFormData('applicant', 'email', value);
                            // Also update the top-level field for compatibility
                            updateFormData('', 'applicantEmail', value);
                          }}
                          required={true}
                          className="w-full mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applicantLicense"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <LicenseInput
                          name="applicantLicense"
                          label="Driver's License Number"
                          placeholder="Enter license number"
                          value={formData.applicant?.license || field.value || ''}
                          onChange={(value) => {
                            field.onChange(value);
                            updateFormData('applicant', 'license', value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  
                  <StateSelector
                    selectedState={formData.applicant?.licenseState || ''}
                    onStateChange={(state) => {
                      updateFormData('applicant', 'licenseState', state);
                      form.setValue('applicantLicenseState', state);
                    }}
                    label="License State"
                    required={false}
                    className="w-full mt-1"
                  />
                </div>
                <h5>Current Address</h5>
                <div className="space-y-2"></div>
             
                <div className="space-y-2">
                <FormField
                    control={form.control}
                    name="applicantAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-0.5">Street Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter street address" 
                            {...field}
                            className="input-field w-full mt-1"
                            value={field.value || ''}
                            onChange={(e) => {
                              field.onChange(e);
                              updateFormData('applicant', 'address', e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                      <FormField
                        control={form.control}
                        name="applicantZip"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <ZIPInput
                                name="applicantZip"
                                label="ZIP Code"
                                placeholder="ZIP code"
                                value={field.value || ''}
                                onChange={(value: string) => {
                                  field.onChange(value);
                                  updateFormData('applicant', 'zip', value);
                                }}
                                required={true}
                                className="w-full mt-1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                </div>
                
                <div className="space-y-2">
                  {/* Replace State* and City* text inputs with StateCitySelector */}
                  <StateCitySelector
                    selectedState={formData.applicant?.state || ''}
                    selectedCity={formData.applicant?.city || ''}
                    onStateChange={(state) => {
                      updateFormData('applicant', 'state', state);
                      form.setValue('applicantState', state);
                      // Clear city if state changes
                      updateFormData('applicant', 'city', '');
                      form.setValue('applicantCity', '');
                    }}
                    onCityChange={(city) => {
                      updateFormData('applicant', 'city', city);
                      form.setValue('applicantCity', city);
                    }}
                    stateLabel="State"
                    cityLabel="City"
                    required={true}
                    error={form.formState.errors.applicantState?.message || form.formState.errors.applicantCity?.message}
                    className="mb-4"
                  />
                </div>
            
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-1 md:col-span-2">
                  
                   </div>
                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-x-6 gap-y-4">
                  <FormLabel className="mb-0.5 col-span-2">Length of Stay at Current Address</FormLabel>
                  <FormField
                    control={form.control}
                    name="applicantLengthAtAddressYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : Number(e.target.value);
                              field.onChange(val);
                              updateFormData('applicant', 'lengthAtAddressYears', val);
                            }}
                            placeholder="e.g. 2 years"
                            className="w-full mt-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="applicantLengthAtAddressMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={11}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : Number(e.target.value);
                              field.onChange(val);
                              updateFormData('applicant', 'lengthAtAddressMonths', val);
                            }}
                            onKeyDown={(e) => {
                              // Allow: backspace, delete, tab, escape, enter, decimal point
                              if ([8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
                                  // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                  (e.keyCode === 65 && e.ctrlKey === true) ||
                                  (e.keyCode === 67 && e.ctrlKey === true) ||
                                  (e.keyCode === 86 && e.ctrlKey === true) ||
                                  (e.keyCode === 88 && e.ctrlKey === true) ||
                                  // Allow: home, end, left, right, down, up
                                  (e.keyCode >= 35 && e.keyCode <= 40)) {
                                return;
                              }
                              // Ensure that it is a number and stop the keypress
                              if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                                e.preventDefault();
                              }
                            }}
                            onInput={(e) => {
                              const target = e.target as HTMLInputElement;
                              let value = parseInt(target.value);
                              if (isNaN(value)) {
                                target.value = '';
                                return;
                              }
                              if (value < 0) {
                                target.value = '0';
                                const val = 0;
                                field.onChange(val);
                                updateFormData('applicant', 'lengthAtAddressMonths', val);
                              } else if (value > 11) {
                                target.value = '11';
                                const val = 11;
                                field.onChange(val);
                                updateFormData('applicant', 'lengthAtAddressMonths', val);
                              }
                            }}
                            placeholder="e.g. 4 months"
                            className="w-full mt-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="applicantLandlordName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-0.5">Landlord Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter landlord's name" 
                          {...field}
                          className="input-field w-full mt-1 border-gray-300 bg-white"
                            value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e);
                            updateFormData('applicant', 'landlordName', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applicantLandlordAddressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-0.5">Landlord Street Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter landlord's street address" 
                          {...field}
                          className="input-field w-full mt-1 border-gray-300 bg-white"
                            value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e);
                            updateFormData('applicant', 'landlordAddressLine1', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applicantLandlordAddressLine2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-0.5">Landlord Address Line 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Apartment, suite, etc." 
                          {...field}
                          className="input-field w-full mt-1 border-gray-300 bg-white"
                            value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e);
                            updateFormData('applicant', 'landlordAddressLine2', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applicantLandlordState"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <StateSelector
                          selectedState={field.value || ''}
                          onStateChange={(value) => {
                            field.onChange(value);
                            updateFormData('applicant', 'landlordState', value);
                          }}
                          label="Landlord State"
                          className="w-full mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applicantLandlordCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <CitySelector
                          selectedState={formData.applicant?.landlordState || ''}
                          selectedCity={field.value || ''}
                          onCityChange={(value) => {
                            field.onChange(value);
                            updateFormData('applicant', 'landlordCity', value);
                          }}
                          label="Landlord City"
                          className="w-full mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applicantLandlordZipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ZIPInput
                          name="applicantLandlordZipCode"
                          label="Landlord ZIP Code"
                          placeholder="Enter landlord's ZIP code"
                          value={field.value || ''}
                          onChange={(value: string) => {
                            field.onChange(value);
                            updateFormData('applicant', 'landlordZipCode', value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applicantLandlordPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PhoneInput
                          name="applicantLandlordPhone"
                          label="Landlord Phone Number"
                          placeholder="Enter landlord's phone number"
                          value={field.value || ''}
                          onChange={(value) => {
                            field.onChange(value);
                            updateFormData('applicant', 'landlordPhone', value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applicantLandlordEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <EmailInput
                          name="applicantLandlordEmail"
                          label="Landlord Email Address (Optional)"
                          placeholder="Enter landlord's email address"
                          value={field.value || ''}
                          onChange={(value) => {
                            field.onChange(value);
                            updateFormData('applicant', 'landlordEmail', value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <Label htmlFor="applicantCurrentRent" className="mb-0.5">Monthly Rent</Label>
                  <Input
                    id="applicantCurrentRent"
                    type="number"
                    placeholder="0.00"
                    value={formData.applicant?.currentRent?.toString() || ''}
                    onChange={(e) => {
                      const numValue = parseFloat(e.target.value) || 0;
                      updateFormData('applicant', 'currentRent', numValue);
                      form.setValue('applicantCurrentRent', numValue);
                    }}
                    className="input-field w-full mt-1"
                  />
                </div>
                <FormField
                  control={form.control}
                  name="applicantReasonForMoving"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-0.5">Why Are You Moving</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please explain your reason for moving" 
                          {...field}
                          className="input-field w-full mt-1 border-gray-300 bg-white min-h-[80px]"
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e);
                            updateFormData('applicant', 'reasonForMoving', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Co-Applicant and Guarantor Count Selectors - Only for applicant role */}
              {userRole === 'applicant' && (
                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Additional People in Application</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-blue-800">How many Co-Applicants?</Label>
                      <Select
                        value={formData.coApplicantCount?.toString() || '0'}
                        onValueChange={(value) => {
                          const count = parseInt(value, 10);
                          updateFormData('', 'coApplicantCount', count);
                          updateFormData('', 'hasCoApplicant', count > 0);

                          // Ensure coApplicants array is sized to count (extend or trim)
                          const current = Array.isArray(formData.coApplicants) ? formData.coApplicants : [];
                          let next = current.slice(0, Math.max(0, count));
                          if (count > next.length) {
                            const toAdd = count - next.length;
                            const defaults = Array.from({ length: toAdd }, () => ({
                              name: '',
                              email: '',
                              phone: '',
                              zip: '',
                              dob: undefined,
                              ssn: '',
                              license: '',
                              licenseState: '',
                              address: '',
                              city: '',
                              state: '',
                              employmentType: '',
                              employer: '',
                              position: '',
                              employmentStart: undefined,
                              income: '',
                              incomeFrequency: 'yearly',
                              businessName: '',
                              businessType: '',
                              yearsInBusiness: '',
                              otherIncome: '',
                              otherIncomeFrequency: 'monthly',
                              otherIncomeSource: '',
                              creditScore: '',
                              bankRecords: []
                            }));
                            next = next.concat(defaults);
                          }
                          updateFormData('', 'coApplicants', next);
                        }}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select number of co-applicants" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 Co-Applicants</SelectItem>
                          <SelectItem value="1">1 Co-Applicant</SelectItem>
                          <SelectItem value="2">2 Co-Applicants</SelectItem>
                          <SelectItem value="3">3 Co-Applicants</SelectItem>
                          <SelectItem value="4">4 Co-Applicants</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-blue-800">How many Guarantors?</Label>
                      <Select
                        value={formData.guarantorCount?.toString() || '0'}
                        onValueChange={(value) => {
                          const count = parseInt(value, 10);
                          updateFormData('', 'guarantorCount', count);
                          updateFormData('', 'hasGuarantor', count > 0);

                          // Ensure guarantors array is sized to count (extend or trim)
                          const current = Array.isArray(formData.guarantors) ? formData.guarantors : [];
                          let next = current.slice(0, Math.max(0, count));
                          if (count > next.length) {
                            const toAdd = count - next.length;
                            const defaults = Array.from({ length: toAdd }, () => ({
                              name: '',
                              email: '',
                              phone: '',
                              zip: '',
                              dob: undefined,
                              ssn: '',
                              license: '',
                              licenseState: '',
                              address: '',
                              city: '',
                              state: '',
                              employmentType: '',
                              employer: '',
                              position: '',
                              employmentStart: undefined,
                              income: '',
                              incomeFrequency: 'yearly',
                              businessName: '',
                              businessType: '',
                              yearsInBusiness: '',
                              otherIncome: '',
                              otherIncomeFrequency: 'monthly',
                              otherIncomeSource: '',
                              creditScore: '',
                              bankRecords: []
                            }));
                            next = next.concat(defaults);
                          }
                          updateFormData('', 'guarantors', next);
                        }}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select number of guarantors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 Guarantors</SelectItem>
                          <SelectItem value="1">1 Guarantor</SelectItem>
                          <SelectItem value="2">2 Guarantors</SelectItem>
                          <SelectItem value="3">3 Guarantors</SelectItem>
                          <SelectItem value="4">4 Guarantors</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-3">
                    Select the number of additional people who will be involved in this application. 
                    You can add or remove people later if needed.
                  </p>

                  {/* Quick-entry fields for Co-Applicants */}
                  {formData.coApplicantCount > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-blue-900 mb-3">Co-Applicants</h4>
                      <div className="space-y-4">
                        {Array.from({ length: formData.coApplicantCount || 0 }, (_, index) => (
                          <div key={`coapplicant-quick-${index}`} className="p-4 bg-white border border-blue-200 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <Label className="text-sm">Co-Applicant {index + 1} First Name</Label>
                                <Input
                                  value={formData.coApplicants?.[index]?.firstName || ''}
                                  onChange={(e) => {
                                    updateArrayItem('coApplicants', index, 'firstName', e.target.value);
                                    // Store firstName in formData only; avoid strict form.setValue path
                                    // Update full name by combining first and last
                                    const lastName = formData.coApplicants?.[index]?.lastName || '';
                                    const fullName = `${e.target.value} ${lastName}`.trim();
                                    updateArrayItem('coApplicants', index, 'name', fullName);
                                    form.setValue('applicantName', form.getValues('applicantName')); // no-op to satisfy types
                                  }}
                                  placeholder="First name"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Co-Applicant {index + 1} Last Name</Label>
                                <Input
                                  value={formData.coApplicants?.[index]?.lastName || ''}
                                  onChange={(e) => {
                                    updateArrayItem('coApplicants', index, 'lastName', e.target.value);
                                    // Store lastName in formData only; avoid strict form.setValue path
                                    // Update full name by combining first and last
                                    const firstName = formData.coApplicants?.[index]?.firstName || '';
                                    const fullName = `${firstName} ${e.target.value}`.trim();
                                    updateArrayItem('coApplicants', index, 'name', fullName);
                                    form.setValue('applicantName', form.getValues('applicantName'));
                                  }}
                                  placeholder="Last name"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Co-Applicant {index + 1} Email</Label>
                                <Input
                                  type="email"
                                  value={formData.coApplicants?.[index]?.email || ''}
                                  onChange={(e) => {
                                    updateArrayItem('coApplicants', index, 'email', e.target.value);
                                    form.setValue(`coApplicants.${index}.email`, e.target.value);
                                  }}
                                  placeholder="email@example.com"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Open specific co-applicant form
                                  const url = new URL(window.location.href);
                                  url.searchParams.set('role', `coapplicant${index + 1}`);
                                  window.open(url.toString(), '_blank');
                                }}
                                className="text-blue-600 hover:text-blue-700 border-blue-300"
                              >
                                Open Co-Applicant {index + 1} Form
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Remove this co-applicant
                                  const newCount = Math.max(0, (formData.coApplicantCount || 0) - 1);
                                  const newCoApplicants = (formData.coApplicants || []).filter((_: any, i: number) => i !== index);
                                  updateFormData('', 'coApplicantCount', newCount);
                                  updateFormData('', 'hasCoApplicant', newCount > 0);
                                  updateFormData('', 'coApplicants', newCoApplicants);
                                }}
                                className="text-red-600 hover:text-red-700 border-red-300"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick-entry fields for Guarantors */}
                  {formData.guarantorCount > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-blue-900 mb-3">Guarantors</h4>
                      <div className="space-y-4">
                        {Array.from({ length: formData.guarantorCount || 0 }, (_, index) => (
                          <div key={`guarantor-quick-${index}`} className="p-4 bg-white border border-blue-200 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <Label className="text-sm">Guarantor {index + 1} First Name</Label>
                                <Input
                                  value={formData.guarantors?.[index]?.firstName || ''}
                                  onChange={(e) => {
                                    updateArrayItem('guarantors', index, 'firstName', e.target.value);
                                    // Store firstName in formData only; avoid strict form.setValue path
                                    // Update full name by combining first and last
                                    const lastName = formData.guarantors?.[index]?.lastName || '';
                                    const fullName = `${e.target.value} ${lastName}`.trim();
                                    updateArrayItem('guarantors', index, 'name', fullName);
                                    form.setValue('applicantName', form.getValues('applicantName'));
                                  }}
                                  placeholder="First name"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Guarantor {index + 1} Last Name</Label>
                                <Input
                                  value={formData.guarantors?.[index]?.lastName || ''}
                                  onChange={(e) => {
                                    updateArrayItem('guarantors', index, 'lastName', e.target.value);
                                    // Store lastName in formData only; avoid strict form.setValue path
                                    // Update full name by combining first and last
                                    const firstName = formData.guarantors?.[index]?.firstName || '';
                                    const fullName = `${firstName} ${e.target.value}`.trim();
                                    updateArrayItem('guarantors', index, 'name', fullName);
                                    form.setValue('applicantName', form.getValues('applicantName'));
                                  }}
                                  placeholder="Last name"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Guarantor {index + 1} Email</Label>
                                <Input
                                  type="email"
                                  value={formData.guarantors?.[index]?.email || ''}
                                  onChange={(e) => {
                                    updateArrayItem('guarantors', index, 'email', e.target.value);
                                    form.setValue(`guarantors.${index}.email`, e.target.value);
                                  }}
                                  placeholder="email@example.com"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Open specific guarantor form
                                  const url = new URL(window.location.href);
                                  url.searchParams.set('role', `guarantor${index + 1}`);
                                  window.open(url.toString(), '_blank');
                                }}
                                className="text-blue-600 hover:text-blue-700 border-blue-300"
                              >
                                Open Guarantor {index + 1} Form
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Remove this guarantor
                                  const newCount = Math.max(0, (formData.guarantorCount || 0) - 1);
                                  const newGuarantors = (formData.guarantors || []).filter((_: any, i: number) => i !== index);
                                  updateFormData('', 'guarantorCount', newCount);
                                  updateFormData('', 'hasGuarantor', newCount > 0);
                                  updateFormData('', 'guarantors', newGuarantors);
                                }}
                                className="text-red-600 hover:text-red-700 border-red-300"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <div className="space-y-6">
            <Card className="form-section border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-700 dark:text-blue-400">
                  <CalendarDays className="w-5 h-5 mr-2" />
                  Financial Information 1 - Primary Applicant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FinancialSection 
                  title="Primary Applicant Financial Information"
                  person="applicant"
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        if (!formData.applicant?.employmentType) {
          console.log('🔍 Primary Applicant Documents - No employment type selected:', {
            applicant_employmentType: formData.applicant?.employmentType,
            applicant_data: formData.applicant,
          });
          return (
            <Card className="form-section">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Supporting Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-500 text-sm mb-4">Please select Employment Type in the Financial Information section to upload supporting documents.</div>
                {/* Info blocks: Security Notice and Important Notes */}
                <div className="flex flex-col space-y-1.5 p-6">
                  <div className="tracking-tight text-lg font-medium">Supporting Documents</div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">🔒 Security Notice:</span> All documents uploaded in this section will be encrypted before transmission to ensure your privacy and data security.
                    </p>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-yellow-900 mb-2">Important Notes:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Documents must be current and legible</li>
                    <li>• Corporate applicants require additional documentation</li>
                    <li>• Self-employed applicants need accountant verification</li>
                    <li>• Incomplete applications will delay processing</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        }
        console.log('🔍 Primary Applicant Documents - Employment type selected:', {
          applicant_employmentType: formData.applicant?.employmentType,
          applicant_data: formData.applicant,
        });
        return (
          <Card className="form-section">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderOpen className="w-5 h-5 mr-2" />
                Supporting Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SupportingDocuments 
                formData={{
                  ...formData,
                  webhookResponses: Object.fromEntries(
                    Object.entries(webhookResponses)
                      .filter(([key]) => key.startsWith('applicant_'))
                      .map(([key, value]) => [key.replace('applicant_', ''), value])
                  )
                }}
                onDocumentChange={(documentType, files) => {
                  handleDocumentChange('applicant', documentType, files);
                }}
                onWebhookResponse={(documentType, response) => {
                  handleWebhookResponse('applicant', documentType, response);
                }}
                onEncryptedDocumentChange={(documentType, encryptedFiles) => {
                  handleEncryptedDocumentChange('applicant', documentType, encryptedFiles);
                }}
                referenceId={referenceId}
                enableWebhook={true}
                applicationId={user?.applicantId || 'unknown'}
                applicantId={user?.id}
                zoneinfo={user?.zoneinfo}
                showOnlyApplicant={true}
              />
            </CardContent>
          </Card>
        );
      case 5:

        return (
          <div className="space-y-8">
            <Card className="form-section border-l-4 border-l-green-500 hidden">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                  <Users className="w-5 h-5 mr-2" />
                  {userRole.startsWith('coapplicant') && specificIndex !== null 
                    ? `Co-Applicant ${specificIndex + 1} Information`
                    : 'Co-Applicant Information'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Only show checkbox if not a specific co-applicant role */}
                {!userRole.startsWith('coapplicant') && (
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="hasCoApplicant"
                      checked={hasCoApplicant}
                      onCheckedChange={(checked) => {
                        const isChecked = checked as boolean;
                        console.log('🔘 Co-Applicant checkbox changed:', isChecked);
                        setHasCoApplicant(isChecked);
                        form.setValue('hasCoApplicant', isChecked);
                        // Also update the formData state to keep everything in sync
                      setFormData((prev: any) => {
                        const updated = {
                          ...prev,
                          hasCoApplicant: isChecked
                        };
                        
                        // Initialize coApplicants array if checking the checkbox
                        if (isChecked && (!prev.coApplicants || !Array.isArray(prev.coApplicants))) {
                          updated.coApplicantCount = 1;
                          updated.coApplicants = [{
                            name: '',
                            relationship: '',
                            dob: undefined,
                            ssn: '',
                            phone: '',
                            email: '',
                            license: '',
                            licenseState: '',
                            address: '',
                            city: '',
                            state: '',
                            zip: '',
                            lengthAtAddressYears: undefined,
                            lengthAtAddressMonths: undefined,
                            landlordName: '',
                            landlordAddressLine1: '',
                            landlordAddressLine2: '',
                            landlordCity: '',
                            landlordState: '',
                            landlordZipCode: '',
                            landlordPhone: '',
                            landlordEmail: '',
                            currentRent: undefined,
                            reasonForMoving: '',
                            employmentType: '',
                            employer: '',
                            position: '',
                            employmentStart: undefined,
                            income: '',
                            incomeFrequency: 'yearly',
                            businessName: '',
                            businessType: '',
                            yearsInBusiness: '',
                            otherIncome: '',
                            otherIncomeFrequency: 'monthly',
                            otherIncomeSource: '',
                            bankRecords: []
                          }];
                        }
                        
                        return updated;
                      });
                    }}
                  />
                  <Label htmlFor="hasCoApplicant" className="text-base font-medium">
                    Add Co-Applicant
                  </Label>
                </div>
                )}

                {hasCoApplicant && (
                  <div className="space-y-4 block">
                    <div className="flex items-center space-x-4 hidden">
                      <Label className="text-sm font-medium">How many Co-Applicants?</Label>
                      <Select
                        value={formData.coApplicantCount?.toString() || '1'}
                        onValueChange={(value) => {
                          const count = parseInt(value);
                          setFormData((prev: any) => ({
                            ...prev,
                            coApplicantCount: count
                          }));
                          form.setValue('coApplicantCount', count);
                          
                          // Ensure coApplicants array has the right number of items
                          setFormData((prev: any) => {
                            const currentCoApplicants = prev.coApplicants || [];
                            if (count > currentCoApplicants.length) {
                              // Add new co-applicants
                              const newCoApplicants = [...currentCoApplicants];
                              for (let i = currentCoApplicants.length; i < count; i++) {
                                newCoApplicants.push({
                                  name: '',
                                  relationship: '',
                                  dob: undefined,
                                  ssn: '',
                                  phone: '',
                                  email: '',
                                  license: '',
                                  licenseState: '',
                                  address: '',
                                  city: '',
                                  state: '',
                                  zip: '',
                                  lengthAtAddressYears: undefined,
                                  lengthAtAddressMonths: undefined,
                                  landlordName: '',
                                  landlordAddressLine1: '',
                                  landlordAddressLine2: '',
                                  landlordCity: '',
                                  landlordState: '',
                                  landlordZipCode: '',
                                  landlordPhone: '',
                                  landlordEmail: '',
                                  currentRent: undefined,
                                  reasonForMoving: '',
                                  employmentType: '',
                                  employer: '',
                                  position: '',
                                  employmentStart: undefined,
                                  income: '',
                                  incomeFrequency: 'yearly',
                                  businessName: '',
                                  businessType: '',
                                  yearsInBusiness: '',
                                  otherIncome: '',
                                  otherIncomeFrequency: 'monthly',
                                  otherIncomeSource: '',
                                  bankRecords: []
                                });
                              }
                              return {
                                ...prev,
                                coApplicants: newCoApplicants
                              };
                            } else if (count < currentCoApplicants.length) {
                              // Remove excess co-applicants
                              return {
                                ...prev,
                                coApplicants: currentCoApplicants.slice(0, count)
                              };
                            }
                            return prev;
                          });
                        }}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select number" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Co-Applicant</SelectItem>
                          <SelectItem value="2">2 Co-Applicants</SelectItem>
                          <SelectItem value="3">3 Co-Applicants</SelectItem>
                          <SelectItem value="4">4 Co-Applicants</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

                {(hasCoApplicant || (userRole.startsWith('coapplicant') && specificIndex !== null)) && (
                  <>
                    {Array.from({ length: userRole.startsWith('coapplicant') && specificIndex !== null ? 1 : (formData.coApplicantCount || 1) }, (_, index) => {
                      // For specific co-applicant roles, always show the specific index
                      const actualIndex = userRole.startsWith('coapplicant') && specificIndex !== null ? specificIndex : index;
                      return (
                  <Card key={`co-applicant-${index}`} className="form-section border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                    <UserCheck className="w-5 h-5 mr-2" />
                        Co-Applicant Information {actualIndex + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="col-span-1 md:col-span-2">
                          <FormItem>
                            <FormLabel className="mb-0.5">Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter full name" 
                                value={formData.coApplicants?.[actualIndex]?.name || ''}
                                className="input-field w-full mt-1"
                                onChange={(e) => {
                           updateArrayItem('coApplicants', actualIndex, 'name', e.target.value);
                           form.setValue(`coApplicants.${actualIndex}.name`, e.target.value);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <Label className="mb-0.5">Relationship</Label>
                          <Select
                            value={formData.coApplicants?.[actualIndex]?.relationship || ''}
                     onValueChange={(value) => {
                       updateArrayItem('coApplicants', actualIndex, 'relationship', value);
                       form.setValue(`coApplicants.${actualIndex}.relationship`, value);
                     }}
                          >
                            <SelectTrigger className="w-full mt-1">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="partner">Partner</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="child">Child</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <FormItem>
                          <FormLabel className="mb-0.5">Date of Birth *</FormLabel>
                          <FormControl>
                            <DatePicker
                              value={toValidDate(formData.coApplicants?.[actualIndex]?.dob)}
                              onChange={(date) => {
                        // Store the date as a local date to prevent timezone conversion
                        const localDate = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : undefined;
                         updateArrayItem('coApplicants', actualIndex, 'dob', localDate);
                         form.setValue(`coApplicants.${actualIndex}.dob`, localDate);
                                // Auto-calculate age
                                if (date) {
                                  const today = new Date();
                                  const birthDate = new Date(date);
                                  let age = today.getFullYear() - birthDate.getFullYear();
                                  const monthDiff = today.getMonth() - birthDate.getMonth();
                                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                    age--;
                                  }
                           updateArrayItem('coApplicants', actualIndex, 'age', age);
                                } else {
                           updateArrayItem('coApplicants', actualIndex, 'age', '');
                                }
                              }}
                              placeholder="Select date of birth"
                              className="w-full mt-1"
                            />
                          </FormControl>
                        </FormItem>

                        <FormItem>
                          <FormControl>
                            <SSNInput
                       name={`coApplicants.${actualIndex}.ssn`}
                              label="Social Security Number"
                              placeholder="XXX-XX-XXXX"
                              value={formData.coApplicants?.[actualIndex]?.ssn || ''}
                              onChange={(value) => {
                        updateArrayItem('coApplicants', actualIndex, 'ssn', value);
                         form.setValue(`coApplicants.${actualIndex}.ssn`, value);
                              }}
                              className="w-full mt-1"
                            />
                          </FormControl>
                  {form.formState.errors.coApplicants?.[actualIndex]?.ssn?.message && (
                     <span className="text-red-500 text-xs">{form.formState.errors.coApplicants[actualIndex].ssn.message}</span>
                    )}
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <PhoneInput
                      name={`coApplicants.${actualIndex}.phone`}
                              label="Phone Number"
                              placeholder="(555) 555-5555"
                              value={formData.coApplicants?.[actualIndex]?.phone || ''}
                              onChange={(value) => {
                        updateArrayItem('coApplicants', actualIndex, 'phone', value);
                         form.setValue(`coApplicants.${actualIndex}.phone`, value);
                              }}
                              className="w-full mt-1"
                            />
                          </FormControl>
                  {form.formState.errors.coApplicants?.[actualIndex]?.phone?.message && (
                     <span className="text-red-500 text-xs">{form.formState.errors.coApplicants[actualIndex].phone.message}</span>
                    )}
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <EmailInput
                      name={`coApplicants.${actualIndex}.email`}
                              label="Email Address"
                              placeholder="you@email.com"
                              value={formData.coApplicants?.[actualIndex]?.email || ''}
                              onChange={(value) => {
                        updateArrayItem('coApplicants', actualIndex, 'email', value);
                         form.setValue(`coApplicants.${actualIndex}.email`, value);
                              }}
                              required={true}
                              className="w-full mt-1"
                            />
                          </FormControl>
                   {form.formState.errors[`coApplicants.${actualIndex}.email` as keyof typeof form.formState.errors]?.message && (
                     <span className="text-red-500 text-xs">{(form.formState.errors[`coApplicants.${actualIndex}.email` as keyof typeof form.formState.errors] as any)?.message}</span>
                    )}
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <LicenseInput
                      name={`coApplicants.${actualIndex}.license`}
                              label="Driver's License Number"
                              placeholder="Enter license number"
                              value={formData.coApplicants?.[actualIndex]?.license || ''}
                              onChange={(value) => {
                        updateArrayItem('coApplicants', actualIndex, 'license', value);
                         form.setValue(`coApplicants.${actualIndex}.license`, value);
                              }}
                              className="w-full mt-1"
                            />
                          </FormControl>
                  {form.formState.errors[`coApplicants.${actualIndex}.license` as keyof typeof form.formState.errors]?.message && (
                     <span className="text-red-500 text-xs">{(form.formState.errors[`coApplicants.${actualIndex}.license` as keyof typeof form.formState.errors] as any)?.message}</span>
                    )}
                        </FormItem>
                <div className="space-y-2">
                        
                            <StateSelector
                    selectedState={formData.coApplicants?.[actualIndex]?.licenseState || ''}
                    onStateChange={(state) => {
                      updateArrayItem('coApplicants', actualIndex, 'licenseState', state);
                      form.setValue(`coApplicants.${actualIndex}.licenseState`, state);
                    }}
                    label="License State"
                    required={false}
                              className="w-full mt-1"
                            />
                </div>
                <h5>Current Address</h5>
                <div className="space-y-2"></div>
             
                <div className="space-y-2">
                <FormField
                    control={form.control}
                     name={`coApplicants.${actualIndex}.address`}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="mb-0.5">Street Address</FormLabel>
                          <FormControl>
                            <Input 
                            placeholder="Enter street address" 
                            {...field}
                              className="input-field w-full mt-1"
                              value={field.value || ''}
                              onChange={(e) => {
                              field.onChange(e);
                              updateArrayItem('coApplicants', actualIndex, 'address', e.target.value);
                              }}
                            />
                          </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                  />
                        <FormItem>
                          <FormControl>
                            <ZIPInput
                             name={`coApplicants.${actualIndex}.zip`}
                            label="ZIP Code"
                            placeholder="ZIP code"
                              value={formData.coApplicants?.[actualIndex]?.zip || ''}
                              onChange={(value: string) => {
                              updateArrayItem('coApplicants', actualIndex, 'zip', value);
                               form.setValue(`coApplicants.${actualIndex}.zip`, value);
                            }}
                            required={true}
                              className="w-full mt-1"
                            />
                          </FormControl>
                         {form.formState.errors[`coApplicants.${actualIndex}.zip` as keyof typeof form.formState.errors]?.message && (
                           <span className="text-red-500 text-xs">{(form.formState.errors[`coApplicants.${actualIndex}.zip` as keyof typeof form.formState.errors] as any)?.message}</span>
                          )}
                        </FormItem>
                </div>
                
                <div className="space-y-2">
                  {/* Replace State* and City* text inputs with StateCitySelector */}
                  <StateCitySelector
                    selectedState={formData.coApplicants?.[actualIndex]?.state || ''}
                    selectedCity={formData.coApplicants?.[actualIndex]?.city || ''}
                      onStateChange={(state) => {
                       updateArrayItem('coApplicants', actualIndex, 'state', state);
                       form.setValue(`coApplicants.${actualIndex}.state`, state);
                        // Clear city if state changes
                       updateArrayItem('coApplicants', actualIndex, 'city', '');
                       form.setValue(`coApplicants.${actualIndex}.city`, '');
                      }}
                      onCityChange={(city) => {
                       updateArrayItem('coApplicants', actualIndex, 'city', city);
                       form.setValue(`coApplicants.${actualIndex}.city`, city);
                      }}
                   stateLabel="State"
                   cityLabel="City"
                    required={true}
                    className="mb-4"
                  />
                        </div>
              </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-x-6 gap-y-4">
                      <FormLabel className="mb-0.5 col-span-2">Length of Stay at Current Address</FormLabel>
                            <Input 
                        type="number"
                        min={0}
                        value={formData.coApplicants?.[actualIndex]?.lengthAtAddressYears ?? ''}
                         onChange={e => {
                           const value = e.target.value === '' ? undefined : Number(e.target.value);
                           updateArrayItem('coApplicants', actualIndex, 'lengthAtAddressYears', value);
                           form.setValue(`coApplicants.${actualIndex}.lengthAtAddressYears`, value);
                         }}
                        placeholder="e.g. 2 years"
                              className="w-full mt-1"
                            />
                            <Input 
                              type="number"
                        min={0}
                        max={11}
                        value={formData.coApplicants?.[actualIndex]?.lengthAtAddressMonths ?? ''}
                         onChange={e => {
                           const value = e.target.value === '' ? undefined : Number(e.target.value);
                           updateArrayItem('coApplicants', actualIndex, 'lengthAtAddressMonths', value);
                           form.setValue(`coApplicants.${actualIndex}.lengthAtAddressMonths`, value);
                         }}
                         onKeyDown={(e) => {
                           // Allow: backspace, delete, tab, escape, enter, decimal point
                           if ([8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
                               // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                               (e.keyCode === 65 && e.ctrlKey === true) ||
                               (e.keyCode === 67 && e.ctrlKey === true) ||
                               (e.keyCode === 86 && e.ctrlKey === true) ||
                               (e.keyCode === 88 && e.ctrlKey === true) ||
                               // Allow: home, end, left, right, down, up
                               (e.keyCode >= 35 && e.keyCode <= 40)) {
                             return;
                           }
                           // Ensure that it is a number and stop the keypress
                           if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                             e.preventDefault();
                           }
                         }}
                         onInput={(e) => {
                           const target = e.target as HTMLInputElement;
                           let value = parseInt(target.value);
                           if (isNaN(value)) {
                             target.value = '';
                             return;
                           }
                           if (value < 0) {
                             target.value = '0';
                             const val = 0;
                             updateArrayItem('coApplicants', actualIndex, 'lengthAtAddressMonths', val);
                             form.setValue(`coApplicants.${actualIndex}.lengthAtAddressMonths`, val);
                           } else if (value > 11) {
                             target.value = '11';
                             const val = 11;
                             updateArrayItem('coApplicants', actualIndex, 'lengthAtAddressMonths', val);
                             form.setValue(`coApplicants.${actualIndex}.lengthAtAddressMonths`, val);
                           }
                         }}
                        placeholder="e.g. 4 months"
                          className="w-full mt-1"
                      />
                    </div>
                    <FormItem>
                      <FormLabel className="mb-0.5">Landlord Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter landlord's name" 
                          value={formData.coApplicants?.[actualIndex]?.landlordName || ''}
                          className="input-field w-full mt-1 border-gray-300 bg-white"
                            onChange={(e) => {
                             updateArrayItem('coApplicants', actualIndex, 'landlordName', e.target.value);
                             form.setValue(`coApplicants.${actualIndex}.landlordName`, e.target.value);
                            }}
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormLabel className="mb-0.5">Landlord Street Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter landlord's street address" 
                          value={formData.coApplicants?.[actualIndex]?.landlordAddressLine1 || ''}
                          className="input-field w-full mt-1 border-gray-300 bg-white"
                            onChange={(e) => {
                             updateArrayItem('coApplicants', actualIndex, 'landlordAddressLine1', e.target.value);
                             form.setValue(`coApplicants.${actualIndex}.landlordAddressLine1`, e.target.value);
                            }}
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormLabel className="mb-0.5">Landlord Address Line 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Apartment, suite, etc." 
                          value={formData.coApplicants?.[actualIndex]?.landlordAddressLine2 || ''}
                          className="input-field w-full mt-1 border-gray-300 bg-white"
                            onChange={(e) => {
                             updateArrayItem('coApplicants', actualIndex, 'landlordAddressLine2', e.target.value);
                             form.setValue(`coApplicants.${actualIndex}.landlordAddressLine2`, e.target.value);
                            }}
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <StateSelector
                          selectedState={formData.coApplicants?.[actualIndex]?.landlordState || ''}
                            onStateChange={(value) => {
                             updateArrayItem('coApplicants', actualIndex, 'landlordState', value);
                             form.setValue(`coApplicants.${actualIndex}.landlordState`, value);
                            }}
                          label="Landlord State"
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <CitySelector
                          selectedState={formData.coApplicants?.[actualIndex]?.landlordState || ''}
                          selectedCity={formData.coApplicants?.[actualIndex]?.landlordCity || ''}
                            onCityChange={(value) => {
                             updateArrayItem('coApplicants', actualIndex, 'landlordCity', value);
                             form.setValue(`coApplicants.${actualIndex}.landlordCity`, value);
                            }}
                          label="Landlord City"
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <ZIPInput
                           name={`coApplicants.${actualIndex}.landlordZipCode`}
                          label="Landlord ZIP Code"
                          placeholder="Enter landlord's ZIP code"
                          value={formData.coApplicants?.[actualIndex]?.landlordZipCode || ''}
                          onChange={(value: string) => {
                            updateArrayItem('coApplicants', actualIndex, 'landlordZipCode', value);
                            form.setValue(`coApplicants.${actualIndex}.landlordZipCode`, value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <PhoneInput
                           name={`coApplicants.${actualIndex}.landlordPhone`}
                          label="Landlord Phone Number"
                          placeholder="Enter landlord's phone number"
                          value={formData.coApplicants?.[actualIndex]?.landlordPhone || ''}
                          onChange={(value) => {
                            updateArrayItem('coApplicants', actualIndex, 'landlordPhone', value);
                            form.setValue(`coApplicants.${actualIndex}.landlordPhone`, value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <EmailInput
                           name={`coApplicants.${actualIndex}.landlordEmail`}
                          label="Landlord Email Address (Optional)"
                          placeholder="Enter landlord's email address"
                          value={formData.coApplicants?.[actualIndex]?.landlordEmail || ''}
                          onChange={(value) => {
                            updateArrayItem('coApplicants', actualIndex, 'landlordEmail', value);
                            form.setValue(`coApplicants.${actualIndex}.landlordEmail`, value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <div>
                       <Label htmlFor={`coApplicants.${actualIndex}.currentRent`} className="mb-0.5">Monthly Rent</Label>
                      <Input
                        id={`coApplicants.${actualIndex}.currentRent`}
                        type="number"
                        placeholder="0.00"
                        value={formData.coApplicants?.[actualIndex]?.currentRent?.toString() || ''}
                        onChange={e => {
                          const numValue = parseFloat(e.target.value) || 0;
                           updateArrayItem('coApplicants', actualIndex, 'currentRent', numValue);
                           form.setValue(`coApplicants.${actualIndex}.currentRent`, numValue);
                        }}
                        className="input-field w-full mt-1"
                      />
                    </div>
                    <FormItem>
                      <FormLabel className="mb-0.5">Why Are You Moving</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please explain your reason for moving" 
                          value={formData.coApplicants?.[actualIndex]?.reasonForMoving || ''}
                          className="input-field w-full mt-1 border-gray-300 bg-white min-h-[80px]"
                            onChange={(e) => {
                             updateArrayItem('coApplicants', actualIndex, 'reasonForMoving', e.target.value);
                             form.setValue(`coApplicants.${actualIndex}.reasonForMoving`, e.target.value);
                            }}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                </CardContent>
              </Card>
                      );
                    })}
              </>
            )}
          </div>
        );

      case 6:
        if (!hasCoApplicant && !(userRole.startsWith('coapplicant') && specificIndex !== null)) {
          return (
            <Card className="form-section">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="w-5 h-5 mr-2" />
                  Co-Applicant Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-500 text-sm mb-4">Please add a Co-Applicant in the previous step to access financial information.</div>
              </CardContent>
            </Card>
          );
        }
        return (
          <>
            {Array.from({ length: (userRole.startsWith('coapplicant') && specificIndex !== null) ? 1 : (formData.coApplicantCount || 1) }, (_, index) => {
              // For specific co-applicant roles, always show the specific index
              const actualIndex = userRole.startsWith('coapplicant') && specificIndex !== null ? specificIndex : index;
              return (
              <Card key={`co-applicant-financial-${index}`} className="form-section border-l-4 border-l-green-500 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                    <CalendarDays className="w-5 h-5 mr-2" />
                    Financial Information - Co-Applicant {actualIndex + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FinancialSection 
                    title={`Co-Applicant ${actualIndex + 1} Financial Information`}
                    person={`coApplicants_${actualIndex}`}
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                </CardContent>
              </Card>
                      );
                    })}
          </>
        );
      case 7:
        
        // Only show the fallback message if there are no co-applicants at all
        if (!hasCoApplicant && !(userRole.startsWith('coapplicant') && specificIndex !== null)) {
          return (
            <Card className="form-section border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Co-Applicant Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-500 text-sm mb-4">No co-applicants added. Please add co-applicants in the previous step to access document uploads.</div>
                {/* Info blocks: Security Notice and Important Notes */}
                <div className="flex flex-col space-y-1.5 p-6">
                  <div className="tracking-tight text-lg font-medium">Supporting Documents</div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">🔒 Security Notice:</span> All documents uploaded in this section will be encrypted before transmission to ensure your privacy and data security.
                    </p>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-yellow-900 mb-2">Important Notes:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Documents must be current and legible</li>
                    <li>• Corporate applicants require additional documentation</li>
                    <li>• Self-employed applicants need accountant verification</li>
                    <li>• Incomplete applications will delay processing</li>
                  </ul>
                </div>

              </CardContent>
            </Card>
          );
        }
        // Wrapper functions for SupportingDocuments to match expected signature
        const coApplicantDocumentChange = (documentType: string, files: File[]) => handleDocumentChange('coApplicants', documentType, files, 0);
        const coApplicantEncryptedDocumentChange = (documentType: string, encryptedFiles: EncryptedFile[]) => handleEncryptedDocumentChange('coApplicants', documentType, encryptedFiles, 0);
        return (
          (hasCoApplicant || (userRole.startsWith('coapplicant') && specificIndex !== null)) ? (
            <>
              {Array.from({ length: (userRole.startsWith('coapplicant') && specificIndex !== null) ? 1 : (formData.coApplicantCount || 1) }, (_, index) => {
                // For specific co-applicant roles, always show the specific index
                const actualIndex = userRole.startsWith('coapplicant') && specificIndex !== null ? specificIndex : index;
                return (
                <Card key={`co-applicant-documents-${index}`} className="form-section border-l-4 border-l-green-500 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                  <FolderOpen className="w-5 h-5 mr-2" />
                      Co-Applicant Documents {actualIndex + 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Employment Type Selection for Co-Applicant Documents */}
                {!formData.coApplicants?.[actualIndex]?.employmentType ? (
                  <div className="space-y-4">
                    <div className="text-gray-500 text-sm mb-4">Please select Employment Type to upload supporting documents for Co-Applicant {actualIndex + 1}.</div>
                    
                    <div className="form-field">
                      <Label htmlFor={`coApplicant-${actualIndex}-employmentType`}>Employment Type *</Label>
                      <Select
                        value={formData.coApplicants?.[actualIndex]?.employmentType || ''}
                        onValueChange={(value) => {
                          updateFormData('coApplicants', actualIndex.toString(), 'employmentType', value);
                        }}
                      >
                        <SelectTrigger className="input-field">
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="self-employed">Self-Employed</SelectItem>
                          <SelectItem value="salaried">Salaried</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Info blocks: Security Notice and Important Notes */}
                    <div className="flex flex-col space-y-1.5 p-6">
                      <div className="tracking-tight text-lg font-medium">Supporting Documents</div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-green-800">
                          <span className="font-medium">🔒 Security Notice:</span> All documents uploaded in this section will be encrypted before transmission to ensure your privacy and data security.
                        </p>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                      <h4 className="font-medium text-yellow-900 mb-2">Important Notes:</h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Documents must be current and legible</li>
                        <li>• Corporate applicants require additional documentation</li>
                        <li>• Self-employed applicants need accountant verification</li>
                        <li>• Incomplete applications will delay processing</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <SupportingDocuments
                    formData={{
                      ...formData,
                      webhookResponses: Object.fromEntries(
                        Object.entries(webhookResponses)
                              .filter(([key]) => key.startsWith(`coApplicants_${actualIndex}_`))
                              .map(([key, value]) => [key.replace(`coApplicants_${actualIndex}_`, ''), value])
                          )
                        }}
                        originalWebhookResponses={webhookResponses}
                        onDocumentChange={(documentType: string, files: File[]) => {
                          console.log(`🔑 Co-Applicant ${actualIndex + 1} document change for ${documentType}:`, files.length, 'files');
                          handleDocumentChange('coApplicants', documentType, files, actualIndex);
                        }}
                        onEncryptedDocumentChange={(documentType: string, encryptedFiles: EncryptedFile[]) => {
                          console.log(`🔑 Co-Applicant ${actualIndex + 1} encrypted document change for ${documentType}:`, encryptedFiles.length, 'files');
                          handleEncryptedDocumentChange('coApplicants', documentType, encryptedFiles, actualIndex);
                        }}
                        onWebhookResponse={(documentType: string, response: any) => {
                          // Pass the document type and index to the function
                          console.log(`🔑 Co-Applicant ${actualIndex + 1} webhook response for ${documentType}:`, response);
                          handleWebhookResponse('coApplicants', documentType, response, actualIndex);
                        }}
                        referenceId={referenceId}
                        enableWebhook={true}
                        applicationId={user?.applicantId || 'unknown'}
                        applicantId={user?.id}
                        zoneinfo={user?.zoneinfo}
                        showOnlyCoApplicant={true}
                        index={actualIndex}
                  />
                )}
              </CardContent>
            </Card>
                      );
                    })}
            </>
          ) : null
        );
      case 8:
        return (
          <Card className="form-section border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700 dark:text-blue-400">
                <Users className="w-5 h-5 mr-2" />
                Other Occupants (Not Applicants)
              </CardTitle>
              <div className="text-sm text-muted-foreground mt-2">
                List any other people who will be living in the apartment
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {(formData.occupants || []).map((occupant: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-4 mb-4 bg-gray-50 relative">
                  <div className="font-semibold mb-2">Occupant {idx + 1}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <div>
                      <Label>Name</Label>
                      <Input
                        placeholder="Full name"
                        value={occupant.name || ''}
                        onChange={e => {
                          const updated = [...formData.occupants];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setFormData((prev: any) => ({ ...prev, occupants: updated }));
                        }}
                      />
                    </div>

                    <div>
                      <Label>Relationship</Label>
                      <Select
                        value={occupant.relationship || ''}
                        onValueChange={value => {
                          const updated = [...formData.occupants];
                          updated[idx] = { ...updated[idx], relationship: value };
                          setFormData((prev: any) => ({ ...prev, occupants: updated }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="roommate">Roommate</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="relative">Relative</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Date of Birth</Label>
                      <DatePicker
                        value={occupant.dob || undefined}
                        onChange={date => {
                          const updated = [...formData.occupants];
                          updated[idx] = { ...updated[idx], dob: date };
                          // Auto-calculate age
                          if (date) {
                            const today = new Date();
                            const birthDate = new Date(date);
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                              age--;
                            }
                            updated[idx].age = age;
                          } else {
                            updated[idx].age = '';
                          }
                          setFormData((prev: any) => ({ ...prev, occupants: updated }));
                        }}
                        placeholder="dd-mm-yyyy"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <SSNInput
                        name={`occupantSsn${idx}`}
                        label="Social Security #"
                        value={occupant.ssn || ''}
                        onChange={value => {
                          const updated = [...formData.occupants];
                          updated[idx] = { ...updated[idx], ssn: value };
                          setFormData((prev: any) => ({ ...prev, occupants: updated }));
                        }}
                      />
                    </div>
                    <div>
                      <Label>Driver's License #</Label>
                      <Input
                        placeholder="License number"
                        value={occupant.license || ''}
                        onChange={e => {
                          const updated = [...formData.occupants];
                          updated[idx] = { ...updated[idx], license: e.target.value };
                          setFormData((prev: any) => ({ ...prev, occupants: updated }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <FileUpload
                      label={`Occupant ${idx + 1} - Social Security Card (Required)`}
                      description="Upload SSN card (.pdf, .jpg, .jpeg, .png, max 50MB)"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple={false}
                      maxFiles={1}
                      maxSize={50}
                      enableEncryption={true}
                      initialWebhookResponse={formData.webhookResponses?.[`occupants_ssn${idx + 1}`]}
                      onFileChange={files => {
                        console.log('🚀 OCCUPANT SSN DOCUMENT UPLOAD:', {
                          occupantIndex: idx,
                          occupantName: occupant.name,
                          filesCount: files.length,
                          fileName: files[0]?.name
                        });
                          handleOccupantDocumentChange(idx, `ssn${idx + 1}`, files);
                      }}
                      // Removed onEncryptedFilesChange - no longer handling encrypted documents for occupants
                        onWebhookResponse={(response) => {
                          console.log('🚀 OCCUPANT SSN WEBHOOK RESPONSE:', {
                            occupantIndex: idx,
                            occupantName: occupant.name,
                            response
                          });
                          occupantWebhookResponse(`ssn${idx + 1}`, response);
                      }}
                      referenceId={`${referenceId}_occupant_${idx}`}
                      sectionName={`occupants_ssn${idx + 1}`}
                      documentName="ssn"
                      enableWebhook={true}
                      applicationId={user?.applicantId || 'unknown'}
                      applicantId={user?.applicantId}
                      zoneinfo={user?.zoneinfo}
                    />
                    
                    {/* Document Status and Preview Section */}
                    <div className="mt-3">
                      {(() => {
                        const documentStatus = getOccupantDocumentStatus(idx, `ssn${idx + 1}`);
                        const uploadedDocs = getOccupantUploadedDocuments(idx, `ssn${idx + 1}`);
                        
                        if (documentStatus.status === "uploaded" && uploadedDocs.length > 0) {
                          return (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-green-700">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-medium">Document Uploaded</span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreviewOccupantDocument(uploadedDocs[0].filename, uploadedDocs[0].webhookbodyUrl, `Occupant ${idx + 1} SSN Document`)}
                                    className="h-7 px-2 text-xs border-green-200 text-green-700 hover:bg-green-100"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Preview
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(uploadedDocs[0].webhookbodyUrl, '_blank')}
                                    className="h-7 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-100"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Open
                                  </Button>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-green-600">
                                File: {uploadedDocs[0].filename}
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          const updated = [...formData.occupants];
                          updated.splice(idx, 1);
                          setFormData((prev: any) => ({ ...prev, occupants: updated }));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData((prev: any) => ({
                    ...prev,
                      occupants: [...(prev.occupants || []), { 
                        name: '', 
                        relationship: '', 
                        dob: '', 
                        ssn: '', 
                        license: '', 
                        age: '', 
                        ssnDocument: null, 
                        documents: {}
                      }]
                  }));
                }}
              >
                Add Another Occupant
              </Button>
                
             
                
                
              </div>
            </CardContent>
          </Card>
        );
      case 9:

        return (
          <div className="space-y-6">
            {/* Guarantor Section with Checkbox */}
              <Card className="form-section border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                    <Shield className="w-5 h-5 mr-2" />
                    {userRole.startsWith('guarantor') && specificIndex !== null 
                      ? `Guarantor ${specificIndex + 1} Information`
                      : 'Guarantor Information'
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                {/* Only show checkbox if not a specific guarantor role */}
                {!userRole.startsWith('guarantor') && (
                  <div className="flex items-center space-x-3 mb-4">
                    <Checkbox 
                      id="hasGuarantor"
                      checked={hasGuarantor}
                      onCheckedChange={(checked) => {
                        const isChecked = checked as boolean;
                        console.log('🔘 Guarantor checkbox changed:', isChecked);
                        setHasGuarantor(isChecked);
                        form.setValue('hasGuarantor', isChecked);
                      // Also update the formData state to keep everything in sync
                      setFormData((prev: any) => {
                        const updated = {
                          ...prev,
                          hasGuarantor: isChecked
                        };
                        
                        // Initialize guarantors array if checking the checkbox
                        if (isChecked && (!prev.guarantors || !Array.isArray(prev.guarantors))) {
                          updated.guarantorCount = 1;
                          updated.guarantors = [{
                            name: '',
                            relationship: '',
                            dob: undefined,
                            ssn: '',
                            phone: '',
                            email: '',
                            license: '',
                            licenseState: '',
                            address: '',
                            city: '',
                            state: '',
                            zip: '',
                            lengthAtAddressYears: undefined,
                            lengthAtAddressMonths: undefined,
                            landlordName: '',
                            landlordAddressLine1: '',
                            landlordAddressLine2: '',
                            landlordCity: '',
                            landlordState: '',
                            landlordZipCode: '',
                            landlordPhone: '',
                            landlordEmail: '',
                            currentRent: undefined,
                            reasonForMoving: '',
                            employmentType: '',
                            employer: '',
                            position: '',
                            employmentStart: undefined,
                            income: '',
                            incomeFrequency: 'yearly',
                            businessName: '',
                            businessType: '',
                            yearsInBusiness: '',
                            otherIncome: '',
                            otherIncomeFrequency: 'monthly',
                            otherIncomeSource: '',
                            bankRecords: []
                          }];
                        }
                        
                        return updated;
                      });
                    }}
                  />
                  <Label htmlFor="hasGuarantor" className="text-base font-medium">
                    Add Guarantor
                  </Label>
                </div>
                )}
                {(hasGuarantor || (userRole.startsWith('guarantor') && specificIndex !== null)) && (
                  <div className="space-y-4">
                    {/* Only show guarantor count selector for applicant role */}
                    {userRole === 'applicant' && (
                    <div className="flex items-center space-x-4">
                      <Label className="text-sm font-medium">How many Guarantors?</Label>
                      <Select
                        value={formData.guarantorCount?.toString() || '1'}
                        onValueChange={(value) => {
                          const count = parseInt(value);
                          setFormData((prev: any) => {
                            const currentGuarantors = prev.guarantors || [];
                            if (count > currentGuarantors.length) {
                              // Add new guarantors
                              const newGuarantors = [...currentGuarantors];
                              for (let i = currentGuarantors.length; i < count; i++) {
                                newGuarantors.push({
                                  name: '',
                                  relationship: '',
                                  dob: undefined,
                                  ssn: '',
                                  phone: '',
                                  email: '',
                                  license: '',
                                  licenseState: '',
                                  address: '',
                                  city: '',
                                  state: '',
                                  zip: '',
                                  lengthAtAddressYears: undefined,
                                  lengthAtAddressMonths: undefined,
                                  landlordName: '',
                                  landlordAddressLine1: '',
                                  landlordAddressLine2: '',
                                  landlordCity: '',
                                  landlordState: '',
                                  landlordZipCode: '',
                                  landlordPhone: '',
                                  landlordEmail: '',
                                  currentRent: undefined,
                                  reasonForMoving: '',
                                  employmentType: '',
                                  employer: '',
                                  position: '',
                                  employmentStart: undefined,
                                  income: '',
                                  incomeFrequency: 'yearly',
                                  businessName: '',
                                  businessType: '',
                                  yearsInBusiness: '',
                                  otherIncome: '',
                                  otherIncomeFrequency: 'monthly',
                                  otherIncomeSource: '',
                                  bankRecords: []
                                });
                              }
                              return {
                                ...prev,
                                guarantors: newGuarantors,
                                guarantorCount: count
                              };
                            } else if (count < currentGuarantors.length) {
                              // Remove excess guarantors
                              return {
                                ...prev,
                                guarantors: currentGuarantors.slice(0, count),
                                guarantorCount: count
                              };
                            }
                            return prev;
                          });
                          form.setValue('guarantorCount', count);
                        }}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select number" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Guarantor</SelectItem>
                          <SelectItem value="2">2 Guarantors</SelectItem>
                          <SelectItem value="3">3 Guarantors</SelectItem>
                          <SelectItem value="4">4 Guarantors</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    )}

                    {/* Render guarantor forms based on count */}
                    {Array.from({ length: (userRole.startsWith('guarantor') && specificIndex !== null) ? 1 : Math.max(1, formData.guarantorCount || 1) }, (_, index) => {
                      // For specific guarantor roles, always show the specific index
                      const actualIndex = userRole.startsWith('guarantor') && specificIndex !== null ? specificIndex : index;
                      return (
                      <Card key={index} className="form-section border-l-4 border-l-orange-500">
                        <CardHeader>
                          <CardTitle className="flex items-center text-orange-700 dark:text-orange-400">
                            <Shield className="w-5 h-5 mr-2" />
                            Guarantor {actualIndex + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="col-span-1 md:col-span-2">
                        <FormItem>
                                <FormLabel className="mb-0.5">Full Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter full name" 
                                    value={formData.guarantors?.[actualIndex]?.name || ''}
                              className="input-field w-full mt-1"
                                onChange={(e) => {
                                 updateArrayItem('guarantors', actualIndex, 'name', e.target.value);
                                 form.setValue(`guarantors.${actualIndex}.name`, e.target.value);
                                }}
                            />
                          </FormControl>
                        </FormItem>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <Label className="mb-0.5">Relationship</Label>
                        <Select
                                value={formData.guarantors?.[actualIndex]?.relationship || ''}
                                 onValueChange={(value) => {
                                   updateArrayItem('guarantors', actualIndex, 'relationship', value);
                                   form.setValue(`guarantors.${actualIndex}.relationship`, value);
                                 }}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="partner">Partner</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <FormItem>
                        <FormLabel className="mb-0.5">Date of Birth *</FormLabel>
                        <FormControl>
                          <DatePicker
                                  value={toValidDate(formData.guarantors?.[actualIndex]?.dob)}
                            onChange={(date) => {
                                    // Store the date as a local date to prevent timezone conversion
                                    const localDate = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : undefined;
                                     updateArrayItem('guarantors', actualIndex, 'dob', localDate);
                                     form.setValue(`guarantors.${actualIndex}.dob`, localDate);
                              // Auto-calculate age
                              if (date) {
                                const today = new Date();
                                const birthDate = new Date(date);
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                  age--;
                                }
                                       updateArrayItem('guarantors', actualIndex, 'age', age);
                               } else {
                                       updateArrayItem('guarantors', actualIndex, 'age', '');
                              }
                            }}
                            placeholder="Select date of birth"
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>

                      <FormItem>
                        <FormControl>
                          <SSNInput
                                   name={`guarantors.${actualIndex}.ssn`}
                            label="Social Security Number"
                            placeholder="XXX-XX-XXXX"
                                  value={formData.guarantors?.[actualIndex]?.ssn || ''}
                            onChange={(value) => {
                                    updateArrayItem('guarantors', actualIndex, 'ssn', value);
                                    form.setValue(`guarantors.${actualIndex}.ssn`, value);
                            }}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <PhoneInput
                                   name={`guarantors.${actualIndex}.phone`}
                            label="Phone Number"
                            placeholder="(555) 555-5555"
                                  value={formData.guarantors?.[actualIndex]?.phone || ''}
                            onChange={(value) => {
                                    updateArrayItem('guarantors', actualIndex, 'phone', value);
                                    form.setValue(`guarantors.${actualIndex}.phone`, value);
                            }}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <EmailInput
                                  name={`guarantors.${actualIndex}.email`}
                            label="Email Address"
                            placeholder="you@email.com"
                                  value={formData.guarantors?.[actualIndex]?.email || ''}
                            onChange={(value) => {
                                    updateArrayItem('guarantors', actualIndex, 'email', value);
                                    form.setValue(`guarantors.${actualIndex}.email`, value);
                            }}
                            required={true}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <LicenseInput
                                   name={`guarantors.${actualIndex}.license`}
                            label="Driver's License Number"
                            placeholder="Enter license number"
                                  value={formData.guarantors[actualIndex]?.license || ''}
                            onChange={(value) => {
                                    updateArrayItem('guarantors', actualIndex, 'license', value);
                                    form.setValue(`guarantors.${actualIndex}.license`, value);
                            }}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <div className="space-y-2">
                        <StateSelector
                           selectedState={formData.guarantors[actualIndex]?.licenseState || ''}
                           onStateChange={(state) => {
                             updateArrayItem('guarantors', actualIndex, 'licenseState', state);
                             form.setValue(`guarantors.${actualIndex}.licenseState`, state);
                           }}
                          label="License State"
                          required={false}
                          className="w-full mt-1"
                        />
                      </div>
                    </div>
                    
                    {/* Current Address Section - Outside the main grid */}
                    <h5>Current Address</h5>
                    <div className="space-y-2"></div>
                 
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="col-span-2">
                        <FormItem>
                          <FormLabel className="mb-0.5">Street Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter street address" 
                               value={formData.guarantors[actualIndex]?.address || ''}
                               className="input-field w-full mt-1"
                               onChange={(e) => {
                                 updateArrayItem('guarantors', actualIndex, 'address', e.target.value);
                                 form.setValue(`guarantors.${actualIndex}.address`, e.target.value);
                               }}
                            />
                          </FormControl>
                        </FormItem>
                      </div>
                      <FormItem>
                        <FormControl>
                          <ZIPInput
                             name={`guarantors.${actualIndex}.zip`}
                            label="ZIP Code"
                            placeholder="ZIP code"
                            value={formData.guarantors[actualIndex]?.zip || ''}
                            onChange={(value: string) => {
                              updateArrayItem('guarantors', actualIndex, 'zip', value);
                              form.setValue(`guarantors.${actualIndex}.zip`, value);
                            }}
                            required={true}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <StateSelector
                             selectedState={formData.guarantors[actualIndex]?.state || ''}
                             onStateChange={(state) => {
                               updateArrayItem('guarantors', actualIndex, 'state', state);
                               form.setValue(`guarantors.${actualIndex}.state`, state);
                               // Clear city if state changes
                               updateArrayItem('guarantors', actualIndex, 'city', '');
                               form.setValue(`guarantors.${actualIndex}.city`, '');
                             }}
                           label="State"
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <CitySelector
                             selectedState={formData.guarantors[actualIndex]?.state || ''}
                             selectedCity={formData.guarantors[actualIndex]?.city || ''}
                             onCityChange={(city) => {
                               updateArrayItem('guarantors', actualIndex, 'city', city);
                               form.setValue(`guarantors.${actualIndex}.city`, city);
                             }}
                           label="City"
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-x-6 gap-y-4">
                        <FormLabel className="mb-0.5 col-span-2">Length of Stay at Current Address</FormLabel>
                        <Input 
                          type="number"
                          min={0}
                           value={formData.guarantors[actualIndex]?.lengthAtAddressYears ?? ''}
                           onChange={e => {
                             const value = e.target.value === '' ? undefined : Number(e.target.value);
                             updateArrayItem('guarantors', actualIndex, 'lengthAtAddressYears', value);
                             form.setValue(`guarantors.${actualIndex}.lengthAtAddressYears`, value);
                           }}
                          placeholder="e.g. 2 years"
                          className="w-full mt-1"
                        />
                        <Input 
                          type="number"
                          min={0}
                          max={11}
                           value={formData.guarantors[actualIndex]?.lengthAtAddressMonths ?? ''}
                           onChange={e => {
                             const value = e.target.value === '' ? undefined : Number(e.target.value);
                             updateArrayItem('guarantors', actualIndex, 'lengthAtAddressMonths', value);
                             form.setValue(`guarantors.${actualIndex}.lengthAtAddressMonths`, value);
                           }}
                           onKeyDown={(e) => {
                             // Allow: backspace, delete, tab, escape, enter, decimal point
                             if ([8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
                                 // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                 (e.keyCode === 65 && e.ctrlKey === true) ||
                                 (e.keyCode === 67 && e.ctrlKey === true) ||
                                 (e.keyCode === 86 && e.ctrlKey === true) ||
                                 (e.keyCode === 88 && e.ctrlKey === true) ||
                                 // Allow: home, end, left, right, down, up
                                 (e.keyCode >= 35 && e.keyCode <= 40)) {
                               return;
                             }
                             // Ensure that it is a number and stop the keypress
                             if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                               e.preventDefault();
                             }
                           }}
                           onInput={(e) => {
                             const target = e.target as HTMLInputElement;
                             let value = parseInt(target.value);
                             if (isNaN(value)) {
                               target.value = '';
                               return;
                             }
                             if (value < 0) {
                               target.value = '0';
                               const val = 0;
                               updateArrayItem('guarantors', actualIndex, 'lengthAtAddressMonths', val);
                               form.setValue(`guarantors.${actualIndex}.lengthAtAddressMonths`, val);
                             } else if (value > 11) {
                               target.value = '11';
                               const val = 11;
                               updateArrayItem('guarantors', actualIndex, 'lengthAtAddressMonths', val);
                               form.setValue(`guarantors.${actualIndex}.lengthAtAddressMonths`, val);
                             }
                           }}
                          placeholder="e.g. 4 months"
                          className="w-full mt-1"
                        />
                      </div>

                      </div>
                      
                      {/* Landlord Information - Matching Co-Applicant layout */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-x-6 gap-y-4">
                          <FormLabel className="mb-0.5 col-span-2">Landlord Information</FormLabel>
                        </div>
                        <FormItem>
                          <FormLabel className="mb-0.5">Landlord Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter landlord's name" 
                              value={formData.guarantors[actualIndex]?.landlordName || ''}
                              className="input-field w-full mt-1 border-gray-300 bg-white"
                              onChange={(e) => {
                                updateArrayItem('guarantors', actualIndex, 'landlordName', e.target.value);
                                form.setValue(`guarantors.${actualIndex}.landlordName`, e.target.value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormLabel className="mb-0.5">Landlord Street Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter landlord's street address" 
                              value={formData.guarantors[actualIndex]?.landlordAddressLine1 || ''}
                              className="input-field w-full mt-1 border-gray-300 bg-white"
                              onChange={(e) => {
                                updateArrayItem('guarantors', actualIndex, 'landlordAddressLine1', e.target.value);
                                form.setValue(`guarantors.${actualIndex}.landlordAddressLine1`, e.target.value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormLabel className="mb-0.5">Landlord Address Line 2 (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Apartment, suite, etc." 
                              value={formData.guarantors[actualIndex]?.landlordAddressLine2 || ''}
                              className="input-field w-full mt-1 border-gray-300 bg-white"
                              onChange={(e) => {
                                updateArrayItem('guarantors', actualIndex, 'landlordAddressLine2', e.target.value);
                                form.setValue(`guarantors.${actualIndex}.landlordAddressLine2`, e.target.value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <StateSelector
                              selectedState={formData.guarantors[actualIndex]?.landlordState || ''}
                              onStateChange={(value) => {
                                updateArrayItem('guarantors', actualIndex, 'landlordState', value);
                                form.setValue(`guarantors.${actualIndex}.landlordState`, value);
                              }}
                              label="Landlord State"
                              className="w-full mt-1"
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <CitySelector
                              selectedState={formData.guarantors[actualIndex]?.landlordState || ''}
                              selectedCity={formData.guarantors[actualIndex]?.landlordCity || ''}
                              onCityChange={(value) => {
                                updateArrayItem('guarantors', actualIndex, 'landlordCity', value);
                                form.setValue(`guarantors.${actualIndex}.landlordCity`, value);
                              }}
                              label="Landlord City"
                              className="w-full mt-1"
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <ZIPInput
                              name={`guarantors.${actualIndex}.landlordZipCode`}
                              label="Landlord ZIP Code"
                              placeholder="Enter landlord's ZIP code"
                              value={formData.guarantors[actualIndex]?.landlordZipCode || ''}
                              onChange={(value: string) => {
                                updateArrayItem('guarantors', actualIndex, 'landlordZipCode', value);
                                form.setValue(`guarantors.${actualIndex}.landlordZipCode`, value);
                              }}
                              className="w-full mt-1"
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <PhoneInput
                              name={`guarantors.${actualIndex}.landlordPhone`}
                              label="Landlord Phone Number"
                              placeholder="Enter landlord's phone number"
                              value={formData.guarantors[actualIndex]?.landlordPhone || ''}
                              onChange={(value) => {
                                updateArrayItem('guarantors', actualIndex, 'landlordPhone', value);
                                form.setValue(`guarantors.${actualIndex}.landlordPhone`, value);
                              }}
                              className="w-full mt-1"
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <EmailInput
                              name={`guarantors.${actualIndex}.landlordEmail`}
                              label="Landlord Email Address (Optional)"
                              placeholder="Enter landlord's email address"
                              value={formData.guarantors[actualIndex]?.landlordEmail || ''}
                              onChange={(value) => {
                                updateArrayItem('guarantors', actualIndex, 'landlordEmail', value);
                                form.setValue(`guarantors.${actualIndex}.landlordEmail`, value);
                              }}
                              className="w-full mt-1"
                            />
                          </FormControl>
                        </FormItem>
                        <div>
                          <Label htmlFor={`guarantors.${actualIndex}.currentRent`} className="mb-0.5">
                            {`Monthly Rent${(
                              (formData.guarantors[actualIndex]?.landlordName && formData.guarantors[actualIndex]?.landlordName.trim() !== '') ||
                              (formData.guarantors[actualIndex]?.landlordAddressLine1 && formData.guarantors[actualIndex]?.landlordAddressLine1.trim() !== '') ||
                              (formData.guarantors[actualIndex]?.landlordAddressLine2 && formData.guarantors[actualIndex]?.landlordAddressLine2.trim() !== '') ||
                              (formData.guarantors[actualIndex]?.landlordCity && formData.guarantors[actualIndex]?.landlordCity.trim() !== '') ||
                              (formData.guarantors[actualIndex]?.landlordState && formData.guarantors[actualIndex]?.landlordState.trim() !== '') ||
                              (formData.guarantors[actualIndex]?.landlordZipCode && formData.guarantors[actualIndex]?.landlordZipCode.trim() !== '') ||
                              (formData.guarantors[actualIndex]?.landlordPhone && formData.guarantors[actualIndex]?.landlordPhone.trim() !== '') ||
                              (formData.guarantors[actualIndex]?.landlordEmail && formData.guarantors[actualIndex]?.landlordEmail.trim() !== '')
                            ) ? ' *' : ''}`}
                          </Label>
                          <Input
                            id={`guarantors.${actualIndex}.currentRent`}
                            type="number"
                            placeholder="0.00"
                            value={formData.guarantors[actualIndex]?.currentRent?.toString() || ''}
                            onChange={e => {
                              const numValue = parseFloat(e.target.value) || 0;
                              updateArrayItem('guarantors', actualIndex, 'currentRent', numValue);
                              form.setValue(`guarantors.${actualIndex}.currentRent`, numValue);
                            }}
                            className="input-field w-full mt-1"
                          />
                        </div>
                        
                      </div>
                    </CardContent>
                  </Card>
                      );
                    })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            {!hasGuarantor && !(userRole.startsWith('guarantor') && specificIndex !== null) ? (
              <Card className="form-section border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700 dark:text-orange-400">
                    <CalendarDays className="w-5 h-5 mr-2" />
                    Guarantor Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-gray-500 text-lg mb-2">Guarantor Financial Information Unavailable</div>
                    <div className="text-gray-400 text-sm">Please check "Add Guarantor" to access financial information.</div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="form-section border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700 dark:text-orange-400">
                    <CalendarDays className="w-5 h-5 mr-2" />
                    Guarantor Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.from({ length: (userRole.startsWith('guarantor') && specificIndex !== null) ? 1 : Math.max(1, formData.guarantorCount || 1) }, (_, index) => {
                    // For specific guarantor roles, always show the specific index
                    const actualIndex = userRole.startsWith('guarantor') && specificIndex !== null ? specificIndex : index;
                    return (
                    <div key={index} className="mb-8 last:mb-0">
                      <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-4">
                        Financial Information - Guarantor {actualIndex + 1}
                      </h3>
                      <FinancialSection
                        title={`Guarantor ${actualIndex + 1} Financial Information`}
                        person={`guarantors_${actualIndex}`}
                        formData={formData}
                        updateFormData={updateFormData}
                      />
                    </div>
                      );
                    })}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 11:
        return (
          <div className="space-y-6">
            {!hasGuarantor && !(userRole.startsWith('guarantor') && specificIndex !== null) ? (
              <Card className="form-section border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700 dark:text-orange-400">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Guarantor Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-gray-500 text-lg mb-2">Guarantor Documents Unavailable</div>
                    <div className="text-gray-400 text-sm">Please check "Add Guarantor" to upload documents.</div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="form-section border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700 dark:text-orange-400">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Guarantor Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Wrapper functions for SupportingDocuments to match expected signature */}
                  {Array.from({ length: (userRole.startsWith('guarantor') && specificIndex !== null) ? 1 : Math.max(1, formData.guarantorCount || 1) }, (_, index) => {
                    // For specific guarantor roles, always show the specific index
                    const actualIndex = userRole.startsWith('guarantor') && specificIndex !== null ? specificIndex : index;
                    return (
                    <div key={index} className="mb-8 last:mb-0">
                      <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-4">
                        Guarantor {actualIndex + 1} Documents
                      </h3>
                      {/* Employment Type Selection for Guarantor Documents */}
                      {!formData.guarantors?.[actualIndex]?.employmentType ? (
                        <div className="space-y-4">
                          <div className="text-gray-500 text-sm mb-4">Please select Employment Type to upload supporting documents for Guarantor {actualIndex + 1}.</div>
                          
                          <div className="form-field">
                            <Label htmlFor={`guarantor-${actualIndex}-employmentType`}>Employment Type *</Label>
                            <Select
                              value={formData.guarantors?.[actualIndex]?.employmentType || ''}
                              onValueChange={(value) => {
                                // Prevent guarantors from selecting student employment type
                                if (value === 'student') {
                                  return; // Don't allow this selection
                                }
                                updateFormData('guarantors', actualIndex.toString(), 'employmentType', value);
                              }}
                            >
                              <SelectTrigger className="input-field">
                                <SelectValue placeholder="Select employment type" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Students option NOT available for Guarantors */}
                                <SelectItem value="self-employed">Self-Employed</SelectItem>
                                <SelectItem value="salaried">Salaried</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Info blocks: Security Notice and Important Notes */}
                          <div className="flex flex-col space-y-1.5 p-6">
                            <div className="tracking-tight text-lg font-medium">Supporting Documents</div>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-sm text-green-800">
                                <span className="font-medium">🔒 Security Notice:</span> All documents uploaded in this section will be encrypted before transmission to ensure your privacy and data security.
                              </p>
                            </div>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                            <h4 className="font-medium text-yellow-900 mb-2">Important Notes:</h4>
                            <ul className="text-sm text-yellow-800 space-y-1">
                              <li>• Documents must be current and legible</li>
                              <li>• Corporate applicants require additional documentation</li>
                              <li>• Self-employed applicants need accountant verification</li>
                              <li>• Incomplete applications will delay processing</li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <SupportingDocuments
                          formData={{
                            ...formData,
                            webhookResponses: Object.fromEntries(
                              Object.entries(webhookResponses)
                                .filter(([key]) => key.startsWith(`guarantors_${actualIndex}_`))
                                .map(([key, value]) => [key.replace(`guarantors_${actualIndex}_`, ''), value])
                            )
                          }}
                          originalWebhookResponses={webhookResponses}
                          onDocumentChange={(documentType: string, files: File[]) => 
                            handleDocumentChange('guarantors', documentType, files, actualIndex)
                          }
                          onEncryptedDocumentChange={(documentType: string, encryptedFiles: EncryptedFile[]) => 
                            handleEncryptedDocumentChange('guarantors', documentType, encryptedFiles, actualIndex)
                          }
                          onWebhookResponse={(documentType: string, response: any) => {
                            // Pass the document type and index to the function
                            handleWebhookResponse('guarantors', documentType, response, actualIndex);
                          }}
                          referenceId={referenceId}
                          enableWebhook={true}
                          applicationId={user?.applicantId || 'unknown'}
                          applicantId={user?.id}
                          zoneinfo={user?.zoneinfo}
                          showOnlyGuarantor={true}
                          index={actualIndex}
                        />
                      )}
                    </div>
                      );
                    })}
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 12:
        return (
          <div className="space-y-8">
            <Card className="form-section">
              <CardHeader>
                <CardTitle>Digital Signatures</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="mb-6">
                  <h3 className="font-bold uppercase text-sm mb-2">PLEASE READ CAREFULLY BEFORE SIGNING</h3>
                  <p className="text-xs text-gray-700 whitespace-pre-line">
                  The Landlord shall not be bound by any lease, nor will possession of the premises be delivered to the Tenant, until a written lease agreement is executed by the Landlord and delivered to the Tenant. Approval of this application remains at Landlord's discretion until a lease agreement is fully executed. Please be advised that the date on page one of the lease is your move-in date and also denotes the lease commencement date. No representations or agreements by agents, brokers or others shall be binding upon the Landlord or its Agent unless those representations or agreements are set forth in the written lease agreement executed by both Landlord and Tenant.</p>
                  <h3 className="font-bold uppercase text-sm mb-2">Certification & Consents</h3>
                  <p className="text-xs text-gray-700 whitespace-pre-line">By signing this application electronically, I consent to the use of electronic records and digital signatures in connection with this application and any resulting lease agreement. I agree that my electronic signature is legally binding and has the same effect as a handwritten signature. <br/>I hereby warrant that all my representations and information provided in this application are true, accurate, and complete to the best of my knowledge. I recognize the truth of the information contained herein is essential and I acknowledge that any false or misleading information may result in the rejection of my application  or rescission of the offer prior to possession or, if a lease has been executed and/or possession delivered, may constitute a material breach and provide grounds to commence appropriate legal proceedings to terminate the tenancy, as permitted by law. I further represent that I am not renting a room or an apartment under any other name, nor have I ever been dispossessed or evicted from any residence, nor am I now being dispossessed nor currently being evicted. I represent that I am over at least 18 years of age. I acknowledge and consent that my Social Security number and any other personal identifying information collected in this application may be used for tenant screening and will be maintained in confidence and protected against unauthorized disclosure in accordance with New York General Business Law and related privacy laws. I have been advised that I have the right, under the Fair Credit Reporting Act, to make a written request, directed to the appropriate credit reporting agency, within reasonable time, for a complete and accurate disclosure of the nature and scope of any credit investigation. I understand that upon submission, this application and all related documents become the property of the Landlord, and will not be returned to me under any circumstances regardless of whether my application is approved or denied. I consent to and authorize the Landlord, Agent and any designated screening or credit reporting agency to obtain a consumer credit report on me and to conduct any necessary background checks, to the extent permitted by law. I further authorize the Landlord and Agent to verify any and all information provided in this application with regard to my employment history, current and prior tenancies, bank accounts, and all other information that the Landlord deems pertinent to evaluating my leasing application. I authorize the designated screening company to contact my current and previous landlords, employers and references, if necessary. I understand that I shall not be permitted to receive or review my application file or my credit consumer report, <br/>and the Landlord and Agent are not obligated to provide me with copies of my application file or any consumer report obtained in the screening process, and that I may obtain my credit report from the credit reporting agency or as otherwise provided by law. I authorize banks, financial institutions, landlords, employers, business associates, credit bureaus, attorneys, accountants and other persons or institutions with whom I am acquainted and that may have information about me to furnish any and all information regarding myself. This authorization also applies to any updated reports which may be ordered as needed. A photocopy or fax of this authorization or an electronic copy (including any electronic signature) shall be accepted with the same authority as this original. I will provide any additional information required by the Landlord or Agent in connection with this application or any prospective lease contemplated herein. I understand that the application fee is non-refundable. <br/>The Civil Rights Act of 1968, as amended by the Fair Housing Amendments Act of 1988, prohibits discrimination in the rental of housing based on race, color, religion, gender, disability, familial status, lawful source of income (including housing vouchers and public assistance) or national origin. The Federal Agency, which administers compliance with this law, is the U.S. Department of Housing and Urban Development." </p> </div>
                {/* Primary Applicant Signature - Show only for applicant role */}
                {userRole === 'applicant' && (
                  <div>
                    <Label className="text-base font-medium">Primary Applicant Signature *</Label>
                    <SignaturePad 
                      onSignatureChange={(signature) => handleSignatureChange('applicant', signature)}
                      className="mt-2"
                    />
                  </div>
                )}

                {/* Co-Applicant Signatures - Only for co-applicant logins */}
                {userRole.startsWith('coapplicant') && Array.from({ 
                  length: userRole.startsWith('coapplicant') && specificIndex !== null ? 1 : (formData.coApplicantCount || 1) 
                }, (_, index) => {
                  // For specific co-applicant roles, show the specific number
                  const displayNumber = userRole.startsWith('coapplicant') && specificIndex !== null ? specificIndex + 1 : index + 1;
                  const actualIndex = userRole.startsWith('coapplicant') && specificIndex !== null ? specificIndex : index;
                  return (
                    <div key={`co-applicant-signature-${actualIndex}`}>
                      <Label className="text-base font-medium">Co-Applicant {displayNumber} Signature *</Label>
                      <SignaturePad 
                        onSignatureChange={(signature) => handleSignatureChange('coApplicants', actualIndex.toString(), signature)}
                        className="mt-2"
                      />
                    </div>
                  );
                })}

                {/* Guarantor Signatures - Only for guarantor logins */}
                {userRole.startsWith('guarantor') && Array.from({ 
                  length: userRole.startsWith('guarantor') && specificIndex !== null ? 1 : Math.max(1, formData.guarantorCount || 1) 
                }, (_, index) => {
                  // For specific guarantor roles, show the specific number
                  const displayNumber = userRole.startsWith('guarantor') && specificIndex !== null ? specificIndex + 1 : index + 1;
                  const actualIndex = userRole.startsWith('guarantor') && specificIndex !== null ? specificIndex : index;
                  return (
                    <div key={`guarantor-signature-${actualIndex}`}>
                      <Label className="text-base font-medium">Guarantor {displayNumber} Signature *</Label>
                      <SignaturePad 
                        onSignatureChange={(signature) => handleSignatureChange('guarantors', actualIndex.toString(), signature)}
                        className="mt-2"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  }; // end renderStep

  // Enhanced sync effect for applicantDob
  useEffect(() => {
    const formValue = form.watch('applicantDob');
    const stateValue = formData.applicant?.dob;
    let dateObj = toValidDate(stateValue);
    console.log('DOB sync effect - formValue:', formValue, 'stateValue:', stateValue, 'dateObj:', dateObj);
    if (dateObj) {
      if (!formValue || !(formValue instanceof Date) || formValue.getTime() !== dateObj.getTime()) {
        form.setValue('applicantDob', dateObj);
      }
    } else if (formValue) {
      // If invalid, clear by setting to a default date or handling differently
      // Don't set undefined for required date field
    }
  }, [formData.applicant?.dob, form]);
  // Helper to robustly convert to Date or undefined (preserving local date)
  const toValidDate = (val: any): Date | undefined => {
    if (!val) return undefined;
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    if (typeof val === 'string' || typeof val === 'number') {
      const d = new Date(val);
      if (d instanceof Date && !isNaN(d.getTime())) {
        // For date-only fields, create a new date with local date components
        // This prevents timezone-related date shifts
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
    }
    return undefined;
  };

  // Step navigation handlers
  const handlePrevious = () => {
    console.log('🔄 Previous step clicked - Current step:', currentStep);
    setCurrentStep((prev) => getNextAllowedStep(prev, -1));
  };
  const handleNext = (e?: React.MouseEvent<HTMLButtonElement>) => {
    console.log('🔄 Next step clicked - Current step:', currentStep);
    // Prevent form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Validate current step before proceeding, but don't block if we're restoring a draft
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      // If the page was opened with continue=true (restoring a draft), allow navigation and show a gentle hint
      const urlParams = new URLSearchParams(window.location.search);
      const isContinuing = urlParams.get('continue') === 'true';
      if (isContinuing) {
        console.log('🔄 Continuing draft - allowing navigation despite validation errors');
      } else {
        toast({
          title: 'Required fields missing',
          description: validation.errors.join(', '),
          variant: 'destructive',
        });
        return;
      }
    }

    setCurrentStep((prev) => getNextAllowedStep(prev, 1));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Welcome Message */}
      {showWelcomeMessage && user && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {user.name?.[0] || user.given_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Welcome back, {user.name || user.given_name || 'User'}!
                </h2>
                <p className="text-sm text-gray-600">Continue with your rental application</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowWelcomeMessage(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const isTextArea = (e.target as HTMLElement)?.tagName === 'TEXTAREA';
            if (!isTextArea && currentStep !== filteredSteps.length - 1) {
              e.preventDefault();
            }
          }
        }} onSubmit={(e) => {
          // Only allow submit on last step
          if (currentStep !== filteredSteps.length - 1) {
            e.preventDefault();
            return;
          }
          console.log('🚀🚀🚀 FORM SUBMIT EVENT TRIGGERED!');
          console.log('🔍 User role:', userRole);
          console.log('🔍 Is role-specific submit?', userRole && (userRole.startsWith('coapplicant') || userRole.startsWith('guarantor')));
          console.log('🔍 Form validation state:', {
            isValid: form.formState.isValid,
            isDirty: form.formState.isDirty,
            isSubmitting: form.formState.isSubmitting,
            errors: form.formState.errors
          });
          if (userRole && (userRole.startsWith('coapplicant') || userRole.startsWith('guarantor'))) {
            handleRoleSpecificSubmit(e);
          } else {
            form.handleSubmit(handleFormSubmit, handleFormError)(e);
          }
        }} className="space-y-8">
          {/* Progress Bar - Hidden */}
          {/* <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Step {currentStep + 1} of {filteredSteps.length}: {filteredSteps[currentStep]?.title}
              </h2>
              <span className="text-sm text-gray-500">
                {Math.round(((currentStep + 1) / filteredSteps.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${((currentStep + 1) / filteredSteps.length) * 100}%` }}
              ></div>
          </div>
          
            <div className="flex flex-wrap gap-2 mt-4">
            {filteredSteps.map((step, index) => {
              const stepValidation = validateStep(index);
              const isCompleted = index < currentStep && stepValidation.isValid;
              const hasErrors = index < currentStep && !stepValidation.isValid;
              const isDisabled = hasExistingDraft === false && index > 0 && !validateStep(0).isValid;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                      onClick={() => goToStep(index)}
                      disabled={isDisabled}
                      className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        isDisabled
                          ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                          : index === currentStep
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : isCompleted
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : hasErrors
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {step.icon && <step.icon className="w-3 h-3 mr-1" />}
                      {step.title}
                      {isCompleted && <Check className="w-3 h-3 ml-1" />}
                      {hasErrors && <X className="w-3 h-3 ml-1" />}
                  </button>
                  {index < filteredSteps.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-gray-400 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div> */}

          {/* Form Content */}
              {/* Validation Error Display - HIDDEN */}
              {/* {(() => {
                const validation = validateStep(currentStep);
                if (!validation.isValid && currentStep > 0) {
                  return (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <X className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Required fields missing
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            <ul className="list-disc list-inside space-y-1">
                              {validation.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()} */}
              



              

               <div data-form-content>
                 {renderStep()}
               </div>
              
              {/* Student Documents Skip Notice */}
              {formData?.applicant?.employmentType === 'student' && currentStep === 3 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Documents Step Skipped for Students
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>As a student, document validation is not required. You can proceed directly to the next step.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}



            {/* Draft Status Message */}
            {hasExistingDraft === false && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Starting Fresh Application
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {validateStep(currentStep).isValid 
                        ? "Step 1 is complete! You can now proceed to the next step or save your progress."
                        : "Complete Step 1 to begin your application. You'll be able to navigate to other steps once you save your progress."
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center"
                  >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
                  </Button>
              
            <div className="flex space-x-3">
              {/* Save Draft Button - Show for Applicant, Co-Applicant, and Guarantor roles */}
              {(userRole === 'applicant' || (userRole && userRole.startsWith('coapplicant')) || (userRole && userRole.startsWith('guarantor'))) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    userRole === 'applicant' 
                      ? saveDraftToDynamoDB 
                      : userRole && userRole.startsWith('coapplicant')
                      ? saveCoApplicantDraftToDynamoDB
                      : saveGuarantorDraftToDynamoDB
                  }
                  disabled={isSavingDraft}
                  className="flex items-center"
                >
                  {isSavingDraft ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Draft
                </Button>
              )}
              
              {currentStep === filteredSteps.length - 1 ? (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  className="flex items-center"
                  >
                    {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Submit Application
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={(e) => handleNext(e)}
                  disabled={hasExistingDraft === false && currentStep === 0 && !validateStep(currentStep).isValid}
                  className="flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>

        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-lg mx-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Application Submitted Successfully!
              </h3>
              <div className="text-gray-600 mb-6 space-y-3">
                <p>
                  Your rental application has been submitted and is being processed.
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowSuccessPopup(false);
                    setLocation('/drafts');
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
                
              </div>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {showDashboard && (
          <RentalDashboard 
            onBackToForm={() => setShowDashboard(false)}
            currentApplication={{
              id: submissionReferenceId || "APP-" + Date.now(),
              applicantName: formData.applicantName || "Current Applicant",
              propertyAddress: `${formData.buildingAddress || ""} ${formData.apartmentNumber || ""}`.trim() || "Property Address",
              status: "pending_documents",
              submittedDate: new Date().toISOString().split('T')[0],
              progress: 25,
              // Add default values for missing fields to prevent errors
              creditScore: undefined,
              monthlyIncome: undefined,
              creditCardType: undefined,
              creditCardLast4: undefined,
              creditCardValid: undefined,
              missingDocuments: [],
            }}
          />
        )}
      </div>
    );
  }