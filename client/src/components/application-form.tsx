import React from "react";
import { dynamoDBUtils as legacyDraftUtils } from "../lib/dynamodb-service";
import { useState, useEffect, useCallback } from "react";
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
  ]).or(z.undefined()),
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
    ]).or(z.undefined()),
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
    ]).or(z.undefined()),
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
  })).max(4, "Maximum 4 guarantors allowed"),

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
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Parse role from URL query parameters
  const [userRole, setUserRole] = useState<string>('applicant');
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
    const hasBasicInfo = coApplicant.name || coApplicant.email || coApplicant.phone || coApplicant.ssn;
    const hasAddressInfo = coApplicant.address || coApplicant.city || coApplicant.state || coApplicant.zip;
    const hasEmploymentInfo = coApplicant.employmentType || coApplicant.employerName || coApplicant.employerPhone;
    const hasFinancialInfo = coApplicant.monthlyIncome || coApplicant.bankRecords;
    const hasDocuments = coApplicant.documents && Object.keys(coApplicant.documents).length > 0;
    
    return hasBasicInfo || hasAddressInfo || hasEmploymentInfo || hasFinancialInfo || hasDocuments;
  }, []);

  // Helper function to check if guarantor has meaningful data
  const hasGuarantorData = useCallback((guarantor: any) => {
    if (!guarantor) return false;
    
    // Check for any meaningful guarantor data
    const hasBasicInfo = guarantor.name || guarantor.email || guarantor.phone || guarantor.ssn;
    const hasAddressInfo = guarantor.address || guarantor.city || guarantor.state || guarantor.zip;
    const hasEmploymentInfo = guarantor.employmentType || guarantor.employerName || guarantor.employerPhone;
    const hasFinancialInfo = guarantor.monthlyIncome || guarantor.bankRecords;
    const hasDocuments = guarantor.documents && Object.keys(guarantor.documents).length > 0;
    
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

  // Handle webhook responses from formData when it changes
  useEffect(() => {
    if (formData.webhookSummary?.webhookResponses) {
      // Merge webhookSummary.webhookResponses into the main formData.webhookResponses
      const mergedWebhookResponses = {
        ...formData.webhookResponses,
        ...formData.webhookSummary.webhookResponses
      };
      
      // Update formData with merged webhook responses
      setFormData((prevData: any) => ({
        ...prevData,
        webhookResponses: mergedWebhookResponses
      }));
      
      // Update webhook responses state
      setWebhookResponses(mergedWebhookResponses);
      console.log('🔗 Merged webhook responses from webhookSummary in useEffect:', mergedWebhookResponses);
    }
  }, [formData.webhookSummary?.webhookResponses]);

  // When webhookResponses contains direct file URLs (from saved drafts), seed preview slots and map URLs
  useEffect(() => {
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
  const loadDraftData = useCallback(async (applicationId: string, restoreStep: boolean = true) => {
    try {
      console.log('🔄 Loading draft data from separate tables for application ID:', applicationId);
      
      // Load data from all separate tables
      const allData = await dynamoDBSeparateTablesUtils.getAllUserData();
      
      if (allData.application || allData.applicant || allData.coApplicant || allData.guarantor) {
        console.log('📊 Draft data loaded from separate tables');
        setHasExistingDraft(true);
        
        // Get co-applicants and guarantors
        let coApplicantsArray: any[] = [];
        let guarantorsArray: any[] = [];
        if (allData.applicant) {
          coApplicantsArray = allData.applicant.co_applicants || [];
          guarantorsArray = allData.applicant.guarantors || [];
        }

        // If appId is available, augment from separate tables to ensure full array data
        try {
          const appIdToUse = allData.application?.appid;
          if (appIdToUse) {
            const [coAppsByAppId, guarantorsByAppId] = await Promise.all([
              dynamoDBSeparateTablesUtils.getCoApplicantsByAppId(appIdToUse),
              dynamoDBSeparateTablesUtils.getGuarantorsByAppId(appIdToUse)
            ]);
            if (Array.isArray(coAppsByAppId) && coAppsByAppId.length > 0) {
              // Normalize to plain co-applicant_info objects
              coApplicantsArray = coAppsByAppId.map((c: any) => c?.coapplicant_info || c || {});
            }
            if (Array.isArray(guarantorsByAppId) && guarantorsByAppId.length > 0) {
              // Normalize to plain guarantor_info objects
              guarantorsArray = guarantorsByAppId.map((g: any) => g?.guarantor_info || g || {});
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
          parsedFormData.webhookSummary = allData.applicant?.webhookSummary || parsedFormData.webhookSummary || {};
          parsedFormData.signatures = {
            ...parsedFormData.signatures,
            applicant: selectedApplicantSignature || {}
          };
        }
        
        // If no co-applicants/guarantors found on applicant_nyc, try separate tables by appid
        try {
          const currentAppId = allData.application?.appid;
          if ((!coApplicantsArray || coApplicantsArray.length === 0) && currentAppId) {
            const coApps = await dynamoDBSeparateTablesUtils.getCoApplicantsByAppId(currentAppId);
            if (coApps && coApps.length > 0) {
              coApplicantsArray = coApps.map((c: any) => c.coapplicant_info || {});
            }
          }
          if ((!guarantorsArray || guarantorsArray.length === 0) && currentAppId) {
            const gs = await dynamoDBSeparateTablesUtils.getGuarantorsByAppId(currentAppId);
            if (gs && gs.length > 0) {
              guarantorsArray = gs.map((g: any) => g.guarantor_info || {});
            }
          }
        } catch {}

        // Restore co-applicant data into form structure
        if (coApplicantsArray.length > 0) {
          parsedFormData.coApplicants = coApplicantsArray;
        }
        
        // Restore guarantor data into form structure
        if (guarantorsArray.length > 0) {
          parsedFormData.guarantor = guarantorsArray[0] || {};
          parsedFormData.guarantors = guarantorsArray;
        }
              
              // Ensure all required sections exist
              parsedFormData.application = parsedFormData.application || {};
              parsedFormData.applicant = parsedFormData.applicant || {};
              parsedFormData.coApplicant = parsedFormData.coApplicant || {};
              parsedFormData.guarantor = parsedFormData.guarantor || {};
              parsedFormData.occupants = parsedFormData.occupants || [];
          
          // Attach multi-applicant arrays if present
          if (coApplicantsArray.length > 0) {
            parsedFormData.coApplicants = coApplicantsArray;
          }
          if (guarantorsArray.length > 0) {
            parsedFormData.guarantors = guarantorsArray;
          }

          // Merge webhookSummary.webhookResponses into the main formData.webhookResponses
          if (parsedFormData.webhookSummary?.webhookResponses) {
            parsedFormData.webhookResponses = {
              ...parsedFormData.webhookResponses,
              ...parsedFormData.webhookSummary.webhookResponses
            };
            console.log('🔗 Merged webhook responses from webhookSummary:', parsedFormData.webhookResponses);
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
          
          setFormData(parsedFormData);
          
          // Restore current step only if restoreStep is true
        if (restoreStep && allData.application?.current_step !== undefined) {
          setCurrentStep(allData.application.current_step);
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
            parsedFormData.coApplicants.forEach((coApplicant: any, index: number) => {
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
    
          // Log the final checkbox states after restoration
      console.log('🎯 Final checkbox states after restoration:', {
        hasCoApplicant: parsedFormData.hasCoApplicant,
        hasGuarantor: parsedFormData.hasGuarantor,
        coApplicantDataExists: parsedFormData.coApplicant ? hasCoApplicantData(parsedFormData.coApplicant) : false,
        coApplicantsDataExists: parsedFormData.coApplicants && Array.isArray(parsedFormData.coApplicants) && parsedFormData.coApplicants.length > 0,
        guarantorDataExists: parsedFormData.guarantor ? hasGuarantorData(parsedFormData.guarantor) : false,
        guarantorsDataExists: parsedFormData.guarantors && Array.isArray(parsedFormData.guarantors) && parsedFormData.guarantors.length > 0
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
            }

            setFormData(parsedFormData);
            if (restoreStep) {
              setCurrentStep(parsedFormData.current_step || 0);
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
  }, []);
  // Set up welcome message and load draft data
  useEffect(() => {
    if (user) {
      const userName = user.name || user.given_name || user.email?.split('@')[0] || 'User';
      setWelcomeMessage(`Welcome back, ${userName}!`);
      
      // Check if we should continue an existing application
      const urlParams = new URLSearchParams(window.location.search);
      const shouldContinue = urlParams.get('continue') === 'true';
      const stepParam = urlParams.get('step');
      const roleParam = urlParams.get('role');
      
      // Set role and update filtered steps
      if (roleParam) {
        setUserRole(roleParam);
        setFilteredSteps(getFilteredSteps(roleParam));
        
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
        setUserRole(roleFromUser);
        setFilteredSteps(getFilteredSteps(roleFromUser));

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
      }
      
      // Check for existing draft data first and handle initialization
      checkForExistingDraft().then(hasDraft => {
        setHasExistingDraft(hasDraft);
        
        if (shouldContinue) {
          console.log('🔄 Continue parameter detected, loading existing draft...');
          // Load draft data from DynamoDB if available
          if (user.applicantId) {
            loadDraftData(user.applicantId, true); // Restore step when continuing
          }
          
          // If a specific step is provided, navigate to it after draft is loaded
          if (stepParam) {
            const targetStep = parseInt(stepParam, 10);
            if (!isNaN(targetStep) && targetStep >= 0 && targetStep < filteredSteps.length) {
              console.log('🎯 Step parameter detected, will navigate to step:', targetStep);
              // Set the target step - it will be applied after draft data is loaded
              setCurrentStep(targetStep);
            }
          }
        } else {
          console.log('🆕 No continue parameter, starting fresh application...');
          // Clear any existing draft data and start fresh, regardless of whether draft exists
          setHasExistingDraft(false); // Force fresh start behavior
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

  // Remove automatic draft saving - only save when Next button is clicked
  // This prevents unnecessary saves on every field change
  };

  // Auto-populate specific co-applicant/guarantor data when role parameter is set
  useEffect(() => {
    if (userRole.startsWith('coapplicant') && specificIndex !== null) {
      const specificCoApplicant = (formData.coApplicants || [])[specificIndex];
      if (specificCoApplicant) {
        if (specificCoApplicant.name) {
          form.setValue(`coApplicants.${specificIndex}.name`, specificCoApplicant.name);
          updateFormData('coApplicants', specificIndex.toString(), 'name', specificCoApplicant.name);
        }
        if (specificCoApplicant.email) {
          form.setValue(`coApplicants.${specificIndex}.email`, specificCoApplicant.email);
          updateFormData('coApplicants', specificIndex.toString(), 'email', specificCoApplicant.email);
        }
        if (specificCoApplicant.phone) {
          form.setValue(`coApplicants.${specificIndex}.phone`, specificCoApplicant.phone);
          updateFormData('coApplicants', specificIndex.toString(), 'phone', specificCoApplicant.phone);
        }
        // Set hasCoApplicant to true for specific role
        setHasCoApplicant(true);
        form.setValue('hasCoApplicant', true);
      }
    }
  }, [userRole, specificIndex, form, setHasCoApplicant]);

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
        coApplicant: Object.keys(webhookResponses).filter(key => key.startsWith('coApplicant_')).length,
        guarantor: Object.keys(webhookResponses).filter(key => key.startsWith('guarantor_')).length,
        occupants: Object.keys(webhookResponses).filter(key => key.startsWith('occupants_')).length
      },
      webhookResponses: webhookResponses
    };
    
    return summary;
  };

  // Build role-scoped copies of form data and signatures for saving
  const buildRoleScopedFormData = useCallback((data: any, role: string, coGuarIndex?: number): any => {
    if (!role) return data;
    
    console.log('🔍 buildRoleScopedFormData called with:', { role, coGuarIndex, dataKeys: Object.keys(data) });
    
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
      
      // Return simplified JSON structure as requested
      return {
        coApplicants: [coApplicant],
        webhookSummary: data.webhookSummary || {},
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
      } else if (typeof coGuarIndex === 'number') {
        index = coGuarIndex;
      }
      
      console.log('🛡️ Guarantor role detected, using index:', index);
      const guarantor = (data.guarantors || [])[index] || {};
      console.log('🛡️ Guarantor data for index', index, ':', guarantor);
      
      // Return simplified JSON structure as requested
      return {
        guarantors: [guarantor],
        webhookSummary: data.webhookSummary || {},
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

  // Save draft to DynamoDB function with updated flow type
  const saveDraftToDynamoDB = useCallback(async () => {
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
      
      // Debug: Log what's in the enhancedFormData before cleaning
      console.log('🔍 === DEBUG: ENHANCED FORM DATA BEFORE CLEANING ===');
      console.log('📊 enhancedFormData.coApplicants:', enhancedFormData.coApplicants);
      console.log('📊 enhancedFormData.coApplicant:', enhancedFormData.coApplicant);
      console.log('📊 enhancedFormData.hasCoApplicant:', enhancedFormData.hasCoApplicant);
      console.log('📊 enhancedFormData.coApplicantCount:', enhancedFormData.coApplicantCount);
      console.log('📊 enhancedFormData.guarantors:', enhancedFormData.guarantors);
      console.log('📊 enhancedFormData.guarantor:', enhancedFormData.guarantor);
      console.log('📊 enhancedFormData.hasGuarantor:', enhancedFormData.hasGuarantor);
      console.log('=== END DEBUG ===');
      
      // Clean up the form data before saving to remove empty values and ensure consistency
      const cleanedFormData = cleanFormDataForStorage(enhancedFormData);
      
      // Debug: Log what's in the cleanedFormData after cleaning
      console.log('🔍 === DEBUG: CLEANED FORM DATA AFTER CLEANING ===');
      console.log('📊 cleanedFormData.coApplicants:', cleanedFormData.coApplicants);
      console.log('📊 cleanedFormData.coApplicant:', cleanedFormData.coApplicant);
      console.log('📊 cleanedFormData.hasCoApplicant:', cleanedFormData.hasCoApplicant);
      console.log('📊 cleanedFormData.coApplicantCount:', cleanedFormData.coApplicantCount);
      console.log('📊 cleanedFormData.guarantors:', cleanedFormData.guarantors);
      console.log('📊 cleanedFormData.guarantor:', cleanedFormData.guarantor);
      console.log('📊 cleanedFormData.hasGuarantor:', cleanedFormData.hasGuarantor);
      console.log('=== END DEBUG ===');
      
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

      // Save data to separate tables
      console.log('💾 Role-based draft saving to separate DynamoDB tables...');
      console.log('🔍 User role:', userRole, 'Specific index:', specificIndex);
      
      let saveResults: boolean[] = [];

      // Role-based draft saving logic
      if (userRole === 'applicant') {
        console.log('👤 Primary Applicant saving draft to app_nyc and applicant_nyc tables...');
        
        // Save Application Information to app_nyc table
        const applicationData = {
          application_info: {
            ...enhancedFormDataSnapshot.application,
            reference_id: referenceId,
            zoneinfo: (user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || ''
          },
          current_step: currentStep,
          status: 'draft' as const,
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
        
        // Generate Additional People data for draft storage
        const generateAdditionalPeopleDataForDraft = () => {
          const additionalPeople: any = {
            zoneinfo: (user as any)?.zoneinfo || 'unknown',
            role: 'applicant',
            applicant: enhancedFormDataSnapshot.applicant?.name || 'unknown',
            applicantEmail: enhancedFormDataSnapshot.applicant?.email || ''
          };

          // Add co-applicants
          const coApplicants = enhancedFormDataSnapshot.coApplicants || [];
          coApplicants.forEach((coApplicant: any, index: number) => {
            const coApplicantNumber = index + 1;
            additionalPeople[`coApplicants${coApplicantNumber}`] = {
              coApplicant: `coapplicant${coApplicantNumber}`,
              url: `https://www.app.lppmrentals.com/login?role=coapplicant${coApplicantNumber}&zoneinfo=${(user as any)?.zoneinfo || 'unknown'}`,
              name: coApplicant?.name || `Co-Applicant ${coApplicantNumber}`,
              email: coApplicant?.email || ''
            };
          });

          // Add guarantors
          const guarantors = enhancedFormDataSnapshot.guarantors || [];
          guarantors.forEach((guarantor: any, index: number) => {
            const guarantorNumber = index + 1;
            additionalPeople[`guarantor${guarantorNumber}`] = {
              guarantor: `guarantor${guarantorNumber}`,
              url: `https://www.app.lppmrentals.com/login?role=guarantor${guarantorNumber}&zoneinfo=${(user as any)?.zoneinfo || 'unknown'}`,
              name: guarantor?.name || `Guarantor ${guarantorNumber}`,
              email: guarantor?.email || ''
            };
          });

          return additionalPeople;
        };

        // Generate Additional People data for draft
        const additionalPeopleDataForDraft = generateAdditionalPeopleDataForDraft();
        console.log('📋 Additional People data for draft storage:', JSON.stringify(additionalPeopleDataForDraft, null, 2));

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
          additional_people: additionalPeopleDataForDraft, // Add Additional People structure for draft
          timestamp: new Date().toISOString(), // Add timestamp field
          status: 'draft' as const,
          last_updated: new Date().toISOString()
        };

        // Get the appid we just created for app_nyc and pass it to applicant_nyc
        const createdApp = await dynamoDBSeparateTablesUtils.getApplicationDataByUserId();
        const newAppId = createdApp?.appid || undefined;
        const applicantSaveResult = await dynamoDBSeparateTablesUtils.saveApplicantDataNew(applicantData, newAppId);
        saveResults.push(applicantSaveResult);
        
        console.log('✅ Primary Applicant draft with co-applicants and guarantors saved to app_nyc and applicant_nyc tables');

      } else if (userRole && userRole.startsWith('coapplicant')) {
        console.log('👥 Co-Applicant saving draft to Co-Applicants table...');

        // Build co-applicant record with proper index handling
        let coApplicantIndex = 0;
        if (/^coapplicant\d+$/.test(userRole)) {
          const match = userRole.match(/coapplicant(\d+)/);
          coApplicantIndex = match ? parseInt(match[1]) - 1 : 0; // Convert 1-based to 0-based index
        } else if (typeof specificIndex === 'number') {
          coApplicantIndex = specificIndex;
        }
        
        console.log('👥 Co-Applicant save using index:', coApplicantIndex);
        const coApplicantData = (enhancedFormDataSnapshot.coApplicants || [])[coApplicantIndex] || {};
        console.log('👥 Co-Applicant data being saved:', coApplicantData);
        
        // Generate Additional People data for co-applicant draft (only this co-applicant)
        const generateAdditionalPeopleDataForCoApplicantDraft = () => {
          const additionalPeople: any = {
            zoneinfo: (user as any)?.zoneinfo || 'unknown',
            role: 'coapplicant',
            coApplicant: coApplicantData?.name || 'unknown',
            coApplicantEmail: coApplicantData?.email || ''
          };

          // Add this specific co-applicant
          const coApplicantNumber = coApplicantIndex + 1;
          additionalPeople[`coApplicants${coApplicantNumber}`] = {
            coApplicant: `coapplicant${coApplicantNumber}`,
            url: `https://www.app.lppmrentals.com/login?role=coapplicant${coApplicantNumber}&zoneinfo=${(user as any)?.zoneinfo || 'unknown'}`,
            name: coApplicantData?.name || `Co-Applicant ${coApplicantNumber}`,
            email: coApplicantData?.email || ''
          };

          return additionalPeople;
        };

        const additionalPeopleDataForCoApplicantDraft = generateAdditionalPeopleDataForCoApplicantDraft();
        console.log('📋 Additional People data for co-applicant draft storage:', JSON.stringify(additionalPeopleDataForCoApplicantDraft, null, 2));

        const submittedCoApplicantData = {
          role: 'coApplicant', // Add role attribute at top level
          coapplicant_info: coApplicantData,
          occupants: enhancedFormDataSnapshot.occupants || [],
          webhookSummary: enhancedFormDataSnapshot.webhookSummary || getWebhookSummary(),
          // Store only this co-applicant's signature as base64 string or null
          signature: (() => {
            const sig = (roleScopedSign as any)?.coApplicants?.[coApplicantIndex];
            if (typeof sig === 'string' && sig.startsWith('data:image/')) return sig;
            return sig ?? null;
          })(),
          additional_people: additionalPeopleDataForCoApplicantDraft, // Add Additional People structure for co-applicant draft
          status: 'draft' as const,
          last_updated: new Date().toISOString()
        };

        // Link to current application id if available
        const existingApp = await dynamoDBSeparateTablesUtils.getApplicationDataByZoneinfo();
        const appid = existingApp?.appid;
        const coApplicantSaveResult = await dynamoDBSeparateTablesUtils.saveCoApplicantDataNew(submittedCoApplicantData as any, appid);
        saveResults.push(coApplicantSaveResult);

        // Also persist current_step for resume navigation (do not overwrite signatures/documents)
        try {
          const stepOnlyApplicationData = {
            application_info: { zoneinfo: (user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || '' },
            current_step: currentStep,
            status: 'draft' as const,
            storage_mode: 'direct' as const,
            flow_type: 'separate_webhooks' as const,
            webhook_flow_version: '2.0',
            last_updated: new Date().toISOString()
          };
          const stepSave = await dynamoDBSeparateTablesUtils.saveApplicationData(stepOnlyApplicationData as any);
          saveResults.push(stepSave);
        } catch (e) {
          console.warn('⚠️ Failed to persist current_step for co-applicant resume:', e);
        }

        console.log('✅ Co-Applicant draft saved to Co-Applicants table');

      } else if (userRole && userRole.startsWith('guarantor')) {
        console.log('🛡️ Guarantor saving draft to Guarantors_nyc table...');

        // Build guarantor record with proper index handling
        let guarantorIndex = 0;
        if (/^guarantor\d+$/.test(userRole)) {
          const match = userRole.match(/guarantor(\d+)/);
          guarantorIndex = match ? parseInt(match[1]) - 1 : 0; // Convert 1-based to 0-based index
        } else if (typeof specificIndex === 'number') {
          guarantorIndex = specificIndex;
        }
        
        console.log('🛡️ Guarantor save using index:', guarantorIndex);
        const guarantorData = (enhancedFormDataSnapshot.guarantors || [])[guarantorIndex] || {};
        console.log('🛡️ Guarantor data being saved:', guarantorData);
        
        // Generate Additional People data for guarantor draft (only this guarantor)
        const generateAdditionalPeopleDataForGuarantorDraft = () => {
          const additionalPeople: any = {
            zoneinfo: (user as any)?.zoneinfo || 'unknown',
            role: 'guarantor',
            guarantor: guarantorData?.name || 'unknown',
            guarantorEmail: guarantorData?.email || ''
          };

          // Add this specific guarantor
          const guarantorNumber = guarantorIndex + 1;
          additionalPeople[`guarantor${guarantorNumber}`] = {
            guarantor: `guarantor${guarantorNumber}`,
            url: `https://www.app.lppmrentals.com/login?role=guarantor${guarantorNumber}&zoneinfo=${(user as any)?.zoneinfo || 'unknown'}`,
            name: guarantorData?.name || `Guarantor ${guarantorNumber}`,
            email: guarantorData?.email || ''
          };

          return additionalPeople;
        };

        const additionalPeopleDataForGuarantorDraft = generateAdditionalPeopleDataForGuarantorDraft();
        console.log('📋 Additional People data for guarantor draft storage:', JSON.stringify(additionalPeopleDataForGuarantorDraft, null, 2));

        const submittedGuarantorData = {
          role: 'Guarantor', // Add role attribute at top level
          guarantor_info: guarantorData,
          occupants: enhancedFormDataSnapshot.occupants || [],
          webhookSummary: enhancedFormDataSnapshot.webhookSummary || getWebhookSummary(),
          // Store only this guarantor's signature as base64 string or null
          signature: (() => {
            const sig = (roleScopedSign as any)?.guarantors?.[guarantorIndex];
            if (typeof sig === 'string' && sig.startsWith('data:image/')) return sig;
            return sig ?? null;
          })(),
          additional_people: additionalPeopleDataForGuarantorDraft, // Add Additional People structure for guarantor draft
          status: 'draft' as const,
          last_updated: new Date().toISOString()
        };

        const existingApp = await dynamoDBSeparateTablesUtils.getApplicationDataByZoneinfo();
        const appid = existingApp?.appid;
        const guarantorSaveResult = await dynamoDBSeparateTablesUtils.saveGuarantorDataNew(submittedGuarantorData as any, appid);
        saveResults.push(guarantorSaveResult);

        // Also persist current_step for resume navigation (do not overwrite signatures/documents)
        try {
          const stepOnlyApplicationData = {
            application_info: { zoneinfo: (user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || '' },
            current_step: currentStep,
            status: 'draft' as const,
            storage_mode: 'direct' as const,
            flow_type: 'separate_webhooks' as const,
            webhook_flow_version: '2.0',
            last_updated: new Date().toISOString()
          };
          const stepSave = await dynamoDBSeparateTablesUtils.saveApplicationData(stepOnlyApplicationData as any);
          saveResults.push(stepSave);
        } catch (e) {
          console.warn('⚠️ Failed to persist current_step for guarantor resume:', e);
        }

        console.log('✅ Guarantor draft saved to Guarantors_nyc table');

      } else {
        console.log('❓ Unknown role, saving to all tables as fallback...');
        
        // Fallback: save to all tables if role is unknown
        const applicationData = {
          application_info: {
            ...enhancedFormDataSnapshot.application,
            reference_id: referenceId,
            zoneinfo: (user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || ''
          },
          current_step: currentStep,
          status: 'draft' as const,
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
      }

      const allSaved = saveResults.every(result => result);
      if (allSaved) {
        console.log('💾 Role-based draft saved successfully');
        setHasExistingDraft(true);
        toast({
          title: 'Draft Saved Successfully',
          description: 'Your application draft has been saved to the appropriate table. You can continue working on it later.',
          variant: 'default',
        });
      } else {
        console.warn('⚠️ Failed to save some parts of role-based draft');
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

    // Note: Draft saving is now manual - only when Save Draft button is clicked
    console.log('📁 File uploaded successfully for:', actualPerson, actualDocumentType, '- Draft will be saved when Save Draft button is clicked');
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
      console.log(`✍️ Signature updated for: ${actualPerson}[${actualIndex}] - Draft will be saved when Save Draft button is clicked`);
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
      console.log(`✍️ Signature updated for: ${actualPerson} - Draft will be saved when Save Draft button is clicked`);
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
    if (direction === 1 && (nextStepId === 6 || nextStepId === 7) && !hasCoApplicant) {
      // Find the next step that has ID 8 or higher
      const nextStepIndex = filteredSteps.findIndex(step => step.id >= 8);
      if (nextStepIndex !== -1) {
        next = nextStepIndex;
      }
    }
    // If moving backward and co-applicant is not checked, skip co-applicant financial and docs
    if (direction === -1 && (nextStepId === 6 || nextStepId === 7) && !hasCoApplicant) {
      // Find the previous step that has ID 5 or lower
      const prevStepIndex = filteredSteps.findLastIndex(step => step.id <= 5);
      if (prevStepIndex !== -1) {
        next = prevStepIndex;
      }
    }
    // If moving forward and guarantor is not checked, skip guarantor financial and docs
    if (direction === 1 && (nextStepId === 10 || nextStepId === 11) && !hasGuarantor) {
      // Find the next step that has ID 12 or higher
      const nextStepIndex = filteredSteps.findIndex(step => step.id >= 12);
      if (nextStepIndex !== -1) {
        next = nextStepIndex;
      }
    }
    // If moving backward and guarantor is not checked, skip guarantor financial and docs
    if (direction === -1 && (nextStepId === 10 || nextStepId === 11) && !hasGuarantor) {
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
          // Determine which co-applicant to validate
          const coApplicantIndex = (userRole?.startsWith('coapplicant') && specificIndex !== null)
            ? specificIndex
            : 0;
          const coApplicant = formData.coApplicants?.[coApplicantIndex];
          if (!coApplicant?.name?.trim()) {
            errors.push('Co-Applicant Full Name is required');
          }
          if (!coApplicant?.ssn?.trim()) {
            errors.push('Co-Applicant Social Security Number is required');
          }
          if (!coApplicant?.phone?.trim()) {
            errors.push('Co-Applicant Phone Number is required');
          }
          if (!coApplicant?.email?.trim()) {
            errors.push('Co-Applicant Email Address is required');
          }
          if (!coApplicant?.license?.trim()) {
            errors.push('Co-Applicant Driver\'s License is required');
          }
          if (!coApplicant?.licenseState?.trim()) {
            errors.push('Co-Applicant Driver\'s License State is required');
          }
          if (!coApplicant?.address?.trim()) {
            errors.push('Co-Applicant Address is required');
          }
          if (!coApplicant?.city?.trim()) {
            errors.push('Co-Applicant City is required');
          }
          if (!coApplicant?.state?.trim()) {
            errors.push('Co-Applicant State is required');
          }
          if (!coApplicant?.zip?.trim()) {
            errors.push('Co-Applicant ZIP Code is required');
          }
        }
        break;

      case 6: // Co-Applicant Financial Information - conditional based on employment type
        if (formData.hasCoApplicant && ((formData.coApplicantCount || 0) > 0)) {
          // Determine which co-applicant to validate
          const coApplicantIndex = (userRole?.startsWith('coapplicant') && specificIndex !== null)
            ? specificIndex
            : 0;
          const coApplicant = formData.coApplicants?.[coApplicantIndex];
          if (!coApplicant?.employmentType?.trim()) {
            errors.push('Co-Applicant Employment Type is required');
          }
          // If not student, require financial fields
          if (coApplicant?.employmentType !== 'student') {
            if (!coApplicant?.employer?.trim()) {
              errors.push('Co-Applicant Current Employer is required');
            }
            if (!coApplicant?.position?.trim()) {
              errors.push('Co-Applicant Position/Title is required');
            }
            if (!coApplicant?.income || coApplicant?.income <= 0) {
              errors.push('Co-Applicant Income is required');
            }
            if (!coApplicant?.incomeFrequency?.trim()) {
              errors.push('Co-Applicant Income Frequency is required');
            }
          }
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
          const guarantor = formData.guarantors?.[0]; // Get first guarantor
          if (!guarantor?.name?.trim()) {
            errors.push('Guarantor Full Name is required');
          }
          if (!guarantor?.ssn?.trim()) {
            errors.push('Guarantor Social Security Number is required');
          }
          if (!guarantor?.phone?.trim()) {
            errors.push('Guarantor Phone Number is required');
          }
          if (!guarantor?.email?.trim()) {
            errors.push('Guarantor Email Address is required');
          }
          if (!guarantor?.license?.trim()) {
            errors.push('Guarantor Driver\'s License is required');
          }
          if (!guarantor?.licenseState?.trim()) {
            errors.push('Guarantor Driver\'s License State is required');
          }
          if (!guarantor?.address?.trim()) {
            errors.push('Guarantor Address is required');
          }
          if (!guarantor?.city?.trim()) {
            errors.push('Guarantor City is required');
          }
          if (!guarantor?.state?.trim()) {
            errors.push('Guarantor State is required');
          }
          if (!guarantor?.zip?.trim()) {
            errors.push('Guarantor ZIP Code is required');
          }
        }
        break;

      case 10: // Guarantor Financial Information - conditional based on employment type
        if (formData.hasGuarantor) {
          const guarantor = formData.guarantors?.[0]; // Get first guarantor
          if (!guarantor?.employmentType?.trim()) {
            errors.push('Guarantor Employment Type is required');
          }
          // If not student, require financial fields
          if (guarantor?.employmentType !== 'student') {
            if (!guarantor?.employer?.trim()) {
              errors.push('Guarantor Current Employer is required');
            }
            if (!guarantor?.position?.trim()) {
              errors.push('Guarantor Position/Title is required');
            }
            if (!guarantor?.income || guarantor?.income <= 0) {
              errors.push('Guarantor Income is required');
            }
            if (!guarantor?.incomeFrequency?.trim()) {
              errors.push('Guarantor Income Frequency is required');
            }
          }
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
        toast({
          title: 'Some fields are incomplete',
          description: 'You can continue editing your restored draft and fill these later.',
          variant: 'default',
        });
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

      // Note: Draft saving is now manual - only when Save Draft button is clicked
      console.log('➡️ Moving to step:', nextPlannedStep, '- Draft will be saved when Save Draft button is clicked');

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

      // Note: Draft saving is now manual - only when Save Draft button is clicked
      console.log('⬅️ Going back to step:', getNextAllowedStep(currentStep, -1), '- Draft will be saved when Save Draft button is clicked');

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

    // Note: Draft saving is now manual - only when Save Draft button is clicked
    console.log('👤 Occupant added - Draft will be saved when Save Draft button is clicked');
  };

  const removeOccupant = async (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      occupants: prev.occupants.filter((_: any, i: number) => i !== index)
    }));

    // Note: Draft saving is now manual - only when Save Draft button is clicked
    console.log('👤 Occupant removed - Draft will be saved when Save Draft button is clicked');
  };

  const updateOccupant = async (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      occupants: prev.occupants.map((occupant: any, i: number) => 
        i === index ? { ...occupant, [field]: value } : occupant
      )
    }));

    // Note: Draft saving is now manual - only when Save Draft button is clicked
    console.log('👤 Occupant updated:', index, field, '- Draft will be saved when Save Draft button is clicked');
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

    // Note: Draft saving is now manual - only when Save Draft button is clicked
    console.log('📁 Occupant document updated:', index, documentType, '- Draft will be saved when Save Draft button is clicked');
  };

  // Removed handleOccupantEncryptedDocumentChange - no longer needed

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
          
          
          // Occupants (array)
          occupants: (formData.occupants || formData.otherOccupants || []).map((occupant: any) => ({
            name: occupant.name,
            relationship: occupant.relationship,
            dob: occupant.dob,
            ssn: occupant.ssn,
            license: occupant.license,
            age: occupant.age || 0
          })),
          
          // Co-Applicants (array)
          coApplicants: (formData.coApplicants || []).map((coApplicant: any) => ({
            name: coApplicant.name,
            email: coApplicant.email,
            phone: coApplicant.phone,
            address: coApplicant.address,
            city: coApplicant.city,
            state: coApplicant.state,
            zip: coApplicant.zip,
            dob: coApplicant.dob,
            ssn: coApplicant.ssn,
            license: coApplicant.license,
            licenseState: coApplicant.licenseState,
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
            age: coApplicant.age || 0,
            employmentType: coApplicant.employmentType,
            employer: coApplicant.employer,
            position: coApplicant.position,
            employmentStart: coApplicant.employmentStart,
            income: coApplicant.income,
            incomeFrequency: coApplicant.incomeFrequency,
            businessName: coApplicant.businessName,
            businessType: coApplicant.businessType,
            yearsInBusiness: coApplicant.yearsInBusiness,
            otherIncome: coApplicant.otherIncome,
            otherIncomeFrequency: coApplicant.otherIncomeFrequency,
            otherIncomeSource: coApplicant.otherIncomeSource,
            bankRecords: (coApplicant.bankRecords || []).map((record: any) => ({
              bankName: record.bankName,
              accountType: record.accountType,
              accountNumber: record.accountNumber || ""
            })),
          })),
          
          // Guarantors (array)
          guarantors: (formData.guarantors || []).map((guarantor: any) => ({
            name: guarantor.name,
            email: guarantor.email,
            phone: guarantor.phone,
            address: guarantor.address,
            city: guarantor.city,
            state: guarantor.state,
            zip: guarantor.zip,
            dob: guarantor.dob,
            ssn: guarantor.ssn,
            license: guarantor.license,
            licenseState: guarantor.licenseState,
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
            age: guarantor.age || 0,
            employmentType: guarantor.employmentType,
            employer: guarantor.employer,
            position: guarantor.position,
            employmentStart: guarantor.employmentStart,
            income: guarantor.income,
            incomeFrequency: guarantor.incomeFrequency,
            businessName: guarantor.businessName,
            businessType: guarantor.businessType,
            yearsInBusiness: guarantor.yearsInBusiness,
            otherIncome: guarantor.otherIncome,
            otherIncomeFrequency: guarantor.otherIncomeFrequency,
            otherIncomeSource: guarantor.otherIncomeSource,
            bankRecords: (guarantor.bankRecords || []).map((record: any) => ({
              bankName: record.bankName,
              accountType: record.accountType,
              accountNumber: record.accountNumber || ""
            })),
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
        
        // Debug: Check co-applicants and guarantors in completeServerData
        console.log('🔍 Co-applicants in completeServerData:', (completeServerData as any).coApplicants?.length || 0);
        console.log('🔍 Guarantors in completeServerData:', (completeServerData as any).guarantors?.length || 0);
        console.log('🔍 Co-applicants data:', (completeServerData as any).coApplicants);
        console.log('🔍 Guarantors data:', (completeServerData as any).guarantors);
        
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
          const specificGuarantor = (formData.guarantors || [])[specificIndex];
          if (specificGuarantor) {
            (completeServerData as any).guarantors = [specificGuarantor];
            console.log(`🎯 Filtered data for guarantor ${specificIndex + 1}:`, specificGuarantor);
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
                totalBankRecords: formData.coApplicants.reduce((total: number, coApplicant: any) => total + coApplicant.bankRecords.length, 0),
                hasBankRecords: !!(formData.coApplicants?.[0]?.bankRecords?.length)
              } : null,
              guarantors: hasGuarantor ? {
                bankRecords: (formData.guarantors || []).map((guarantor: any) => ({
                  bankName: guarantor.bankRecords?.[0]?.bankName || '',
                  accountType: guarantor.bankRecords?.[0]?.accountType || '',
                  totalBankRecords: guarantor.bankRecords?.length || 0,
                  hasBankRecords: !!(guarantor.bankRecords && guarantor.bankRecords.length > 0)
                })),
                totalBankRecords: formData.guarantors.reduce((total: number, guarantor: any) => total + guarantor.bankRecords.length, 0),
                hasBankRecords: !!(formData.guarantors?.[0]?.bankRecords?.length)
              } : null,
              summary: {
                totalPeople: 1 + (hasCoApplicant ? formData.coApplicants.length : 0) + (hasGuarantor ? formData.guarantors.length : 0),
                totalBankRecords: (formData.applicant?.bankRecords?.length || 0) + 
                                 (hasCoApplicant ? formData.coApplicants.reduce((total: number, coApplicant: any) => total + coApplicant.bankRecords.length, 0) : 0) + 
                                 (hasGuarantor ? formData.guarantors.reduce((total: number, guarantor: any) => total + guarantor.bankRecords.length, 0) : 0),
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
              applicant: data.applicantName || 'unknown',
              // Include co-applicants if they exist
              ...(formData.coApplicantCount > 0 && formData.coApplicants && formData.coApplicants.length > 0 ? {
                coApplicants1: {
                  coApplicants: 'coapplicants1',
                  url: `https://www.app.lppmrentals.com/login?role=coapplicants1&zoneinfo=${user?.zoneinfo || 'unknown'}`,
                  name: formData.coApplicants[0]?.name || '',
                  email: formData.coApplicants[0]?.email || ''
                }
              } : {}),
              ...(formData.coApplicantCount > 1 && formData.coApplicants && formData.coApplicants.length > 1 ? {
                coApplicants2: {
                  coApplicants: 'coapplicants2',
                  url: `https://www.app.lppmrentals.com/login?role=coapplicants2&zoneinfo=${user?.zoneinfo || 'unknown'}`,
                  name: formData.coApplicants[1]?.name || '',
                  email: formData.coApplicants[1]?.email || ''
                }
              } : {}),
              // Include guarantors if they exist
              ...(formData.guarantorCount > 0 && formData.guarantors && formData.guarantors.length > 0 ? {
                guarantor1: {
                  guarantor: 'guarantor1',
                  url: `https://www.app.lppmrentals.com/login?role=guarantor1&zoneinfo=${user?.zoneinfo || 'unknown'}`,
                  name: formData.guarantors[0]?.name || '',
                  email: formData.guarantors[0]?.email || ''
                }
              } : {})
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
                zoneinfo: (user as any)?.zoneinfo || (form.getValues() as any)?.zoneinfo || ''
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
            
            // Generate Additional People data structure for DynamoDB storage
            const generateAdditionalPeopleData = () => {
              const additionalPeople: any = {
                zoneinfo: user?.zoneinfo || 'unknown',
                role: 'applicant',
                applicant: submittedFormRoleScoped.applicant?.name || 'unknown',
                applicantEmail: submittedFormRoleScoped.applicant?.email || ''
              };

              // Add co-applicants
              const coApplicants = submittedFormRoleScoped.coApplicants || [];
              coApplicants.forEach((coApplicant: any, index: number) => {
                const coApplicantNumber = index + 1;
                additionalPeople[`coApplicants${coApplicantNumber}`] = {
                  coApplicant: `coapplicant${coApplicantNumber}`,
                  url: `https://www.app.lppmrentals.com/login?role=coapplicant${coApplicantNumber}&zoneinfo=${user?.zoneinfo || 'unknown'}`,
                  name: coApplicant?.name || `Co-Applicant ${coApplicantNumber}`,
                  email: coApplicant?.email || ''
                };
              });

              // Add guarantors
              const guarantors = submittedFormRoleScoped.guarantors || [];
              guarantors.forEach((guarantor: any, index: number) => {
                const guarantorNumber = index + 1;
                additionalPeople[`guarantor${guarantorNumber}`] = {
                  guarantor: `guarantor${guarantorNumber}`,
                  url: `https://www.app.lppmrentals.com/login?role=guarantor${guarantorNumber}&zoneinfo=${user?.zoneinfo || 'unknown'}`,
                  name: guarantor?.name || `Guarantor ${guarantorNumber}`,
                  email: guarantor?.email || ''
                };
              });

              return additionalPeople;
            };

            // Generate Additional People data
            const additionalPeopleData = generateAdditionalPeopleData();
            console.log('📋 Additional People data for DynamoDB storage:', JSON.stringify(additionalPeopleData, null, 2));
            console.log('📊 Co-applicants count:', (submittedFormRoleScoped.coApplicants || []).length);
            console.log('📊 Guarantors count:', (submittedFormRoleScoped.guarantors || []).length);

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
              co_applicants: submittedFormRoleScoped.coApplicants || [], // Include co-applicants data
              guarantors: submittedFormRoleScoped.guarantors || [], // Include guarantors data
              additional_people: additionalPeopleData, // Add Additional People structure
              timestamp: new Date().toISOString(), // Add timestamp field
              status: 'submitted' as const,
              last_updated: new Date().toISOString()
            };

            // Debug: Log the complete data structure being saved
            console.log('🔍 Complete submittedApplicantData being saved:', JSON.stringify(submittedApplicantData, null, 2));
            console.log('🔍 Additional People field specifically:', JSON.stringify(submittedApplicantData.additional_people, null, 2));
            
            // Check data size
            const dataSize = JSON.stringify(submittedApplicantData).length;
            console.log('📏 Total data size being saved:', dataSize, 'bytes');
            const additionalPeopleSize = JSON.stringify(submittedApplicantData.additional_people).length;
            console.log('📏 Additional People data size:', additionalPeopleSize, 'bytes');

            const createdAppFinal = await dynamoDBSeparateTablesUtils.getApplicationDataByUserId();
            const finalAppId = createdAppFinal?.appid || undefined;
            const applicantSaveResult = await dynamoDBSeparateTablesUtils.saveApplicantDataNew(submittedApplicantData, finalAppId);
            saveResults.push(applicantSaveResult);
            
            console.log('✅ Primary Applicant data saved to app_nyc and applicant_nyc tables');

          } else if (userRole && userRole.startsWith('coapplicant')) {
            console.log('👥 Co-Applicant submitting to Co-Applicants table...');
            
            // Get the specific co-applicant data from the role-scoped form
            const coApplicantData = submittedFormRoleScoped.coApplicants?.[0] || {};
            console.log('📊 Co-Applicant data to save:', coApplicantData);
            
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
            
            // Get the specific guarantor data from the role-scoped form
            const guarantorData = submittedFormRoleScoped.guarantors?.[0] || {};
            console.log('📊 Guarantor data to save:', guarantorData);
            
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
              status: 'submitted' as const,
              last_updated: new Date().toISOString()
            };

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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <Label className="text-sm">Co-Applicant {index + 1} Name</Label>
                                <Input
                                  value={formData.coApplicants?.[index]?.name || ''}
                                  onChange={(e) => {
                                    updateArrayItem('coApplicants', index, 'name', e.target.value);
                                    form.setValue(`coApplicants.${index}.name`, e.target.value);
                                  }}
                                  placeholder="Full name"
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <Label className="text-sm">Guarantor {index + 1} Name</Label>
                                <Input
                                  value={formData.guarantors?.[index]?.name || ''}
                                  onChange={(e) => {
                                    updateArrayItem('guarantors', index, 'name', e.target.value);
                                    form.setValue(`guarantors.${index}.name`, e.target.value);
                                  }}
                                  placeholder="Full name"
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
            <Card className="form-section border-l-4 border-l-green-500">
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
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
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
        const coApplicantWebhookResponse = (documentType: string, response: any) => {
          handleWebhookResponse('coApplicants', `0_${documentType}`, response);
        };
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
                          <Label htmlFor={`guarantors.${actualIndex}.currentRent`} className="mb-0.5">Monthly Rent</Label>
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
                        <FormItem>
                          <FormLabel className="mb-0.5">Why Are You Moving</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Please explain your reason for moving" 
                            value={formData.guarantors[actualIndex]?.reasonForMoving || ''}
                            className="input-field w-full mt-1 border-gray-300 bg-white min-h-[80px]"
                            onChange={(e) => {
                              updateArrayItem('guarantors', actualIndex, 'reasonForMoving', e.target.value);
                              form.setValue(`guarantors.${actualIndex}.reasonForMoving`, e.target.value);
                            }}
                            />
                          </FormControl>
                        </FormItem>
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
                        Financial Information 3 - Guarantor {actualIndex + 1}
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
                            <div className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                              Guarantor cannot be a student, only employment/ self-employment options
                            </div>
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
    setCurrentStep((prev: number) => {
      let prevStep = prev - 1;
      
      // If coming back from Other Occupants (step 8) and no co-applicant is selected, go back to Add Co-Applicant step (step 5)
      if (!hasCoApplicant && prev === 8) {
        prevStep = 5; // Go back to Add Co-Applicant step
      }
      
      // If coming back from Digital Signatures (step 12) and no guarantor is selected, go back to Add Guarantor step (step 9)
      if (!hasGuarantor && prev === 12) {
        prevStep = 9; // Go back to Add Guarantor step
      }
      
      return Math.max(prevStep, 0);
    });
  };
  const handleNext = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // If no existing draft and trying to move from Step 1, check if Step 1 is valid first
    if (hasExistingDraft === false && currentStep === 0) {
      // First validate Step 1 - if it's not valid, show validation errors
      const stepValidation = validateStep(currentStep);
      if (!stepValidation.isValid) {
        console.log('🚫 Step 1 validation failed, blocking navigation');
        toast({
          title: 'Complete Step 1 First',
          description: 'Please complete the required fields before proceeding to the next step.',
          variant: 'destructive',
        });
        return;
      }
      // If Step 1 is valid, allow navigation (this will create the first draft)
      console.log('✅ Step 1 is valid, allowing navigation to create first draft');
    }
    
    // Validate current step before proceeding, but be lenient when resuming a draft
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      const urlParams = new URLSearchParams(window.location.search);
      const isContinuing = urlParams.get('continue') === 'true';
      if (isContinuing) {
        toast({
          title: 'Some fields are incomplete',
          description: 'Keep going; you can complete these before submission.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Required fields missing',
          description: validation.errors.join(', '),
          variant: 'destructive',
        });
        return;
      }
    }

    setCurrentStep((prev: number) => {
      let nextStep = prev + 1;
      
      // If moving to co-applicant steps (step 6, 7) and no co-applicant is selected, skip to Other Occupants (step 8)
      if (!hasCoApplicant && (nextStep === 6 || nextStep === 7)) {
        nextStep = 8; // Skip to Other Occupants
      }
      
      // Only skip guarantor steps if user is not already on them and trying to navigate TO them
      // If user is already on step 10 or 11, allow them to proceed normally
      if (!hasGuarantor && nextStep === 10 && prev < 10) {
        nextStep = 12; // Skip to Digital Signatures only when navigating TO step 10
      }
      if (!hasGuarantor && nextStep === 11 && prev < 11) {
        nextStep = 12; // Skip to Digital Signatures only when navigating TO step 11
      }
      
      return Math.min(nextStep, filteredSteps.length - 1);
    });
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
              



              
              {renderStep()}
              
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveDraftToDynamoDB}
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