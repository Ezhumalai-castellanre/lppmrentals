import React from "react";
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
import { RentalApplicationPDF } from "../lib/rental-application-pdf";
import { Download, FileText, Users, UserCheck, CalendarDays, Shield, FolderOpen, ChevronLeft, ChevronRight, Check, Search, Save, X } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";


import ApplicationInstructions from "./application-instructions";
import RentalDashboard from "./rental-dashboard";
import { useRef } from "react";
import { useLocation } from "wouter";
import { type EncryptedFile, validateEncryptedData, createEncryptedDataSummary } from "../lib/file-encryption";
import { WebhookService } from "../lib/webhook-service";
import { MondayApiService, type UnitItem } from "../lib/monday-api";
import { dynamoDBService, type DraftData } from "../lib/dynamodb-service";


import { ValidatedInput, PhoneInput, SSNInput, ZIPInput, EmailInput, LicenseInput, IncomeInput, IncomeWithFrequencyInput } from "./ui/validated-input";
import { StateCitySelector, StateSelector, CitySelector } from "./ui/state-city-selector";
import { validatePhoneNumber, validateSSN, validateZIPCode, validateEmail, validateDriverLicense } from "../lib/validation";
import { FileUpload } from "./ui/file-upload";



const applicationSchema = z.object({
  // Application Info
  buildingAddress: z.string().optional(),
  apartmentNumber: z.string().optional(),
  moveInDate: z.date({
    required_error: "Move-in date is required",
    invalid_type_error: "Please select a valid move-in date",
  }),
  monthlyRent: z.union([
    z.number().optional(),
    z.string().optional().transform((val) => val ? Number(val) : undefined)
  ]).or(z.undefined()),
  apartmentType: z.string().optional(),
  howDidYouHear: z.string().optional(),
  howDidYouHearOther: z.string().optional(),

  // Primary Applicant
  applicantName: z.string().min(1, "Full name is required"),
  applicantDob: z.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Please select a valid date of birth",
  }),
  applicantSsn: z.string().optional().refine((val) => !val || validateSSN(val), {
    message: "Please enter a valid 9-digit Social Security Number"
  }),
  applicantPhone: z.string().optional().refine((val) => !val || validatePhoneNumber(val), {
    message: "Please enter a valid US phone number"
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
  applicantLandlordPhone: z.string().optional().refine((val) => !val || validatePhoneNumber(val), {
    message: "Please enter a valid US phone number"
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
    name: z.string().min(1, "Full name is required"),
    relationship: z.string().optional(),
    dob: z.date({
      required_error: "Date of birth is required",
      invalid_type_error: "Please select a valid date of birth",
    }),
    ssn: z.string().optional().refine((val) => !val || validateSSN(val), {
      message: "Please enter a valid 9-digit Social Security Number"
    }),
    phone: z.string().optional().refine((val) => !val || validatePhoneNumber(val), {
      message: "Please enter a valid US phone number"
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
    landlordPhone: z.string().optional().refine((val) => !val || validatePhoneNumber(val), {
      message: "Please enter a valid US phone number"
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
    phone: z.string().optional().refine((val) => !val || val.trim() === '' || validatePhoneNumber(val), {
      message: "Please enter a valid US phone number"
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
    landlordPhone: z.string().optional().refine((val) => !val || validatePhoneNumber(val), {
      message: "Please enter a valid US phone number"
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
  coApplicantLandlordPhone: z.string().optional().refine((val) => !val || validatePhoneNumber(val), {
    message: "Please enter a valid US phone number"
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
  guarantorLandlordPhone: z.string().optional().refine((val) => !val || validatePhoneNumber(val), {
    message: "Please enter a valid US phone number"
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
        if (!coApplicant.name) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Full name is required", path: ["coApplicants", index, "name"] });
        }
        if (!coApplicant.dob) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date of birth is required", path: ["coApplicants", index, "dob"] });
        }
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
          if (!guarantor.name || guarantor.name.trim() === '') {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Full name is required", path: ["guarantors", originalIndex, "name"] });
          }
          if (!guarantor.dob) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date of birth is required", path: ["guarantors", originalIndex, "dob"] });
          }
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
  


  // Read selected rental from sessionStorage
  const [selectedRental, setSelectedRental] = useState<any>(null);






  const [currentStep, setCurrentStep] = useState(0);
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
  }, []); // ✅ Add empty dependency array to run only once on mount

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
      moveInDate: undefined as any,
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

  // Helper function to get current user's zoneinfo (source of truth for LPPM numbers)
  const getCurrentUserZoneinfo = useCallback(() => {
    return user?.zoneinfo || user?.applicantId;
  }, [user?.zoneinfo, user?.applicantId]);

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

  // Load draft data from DynamoDB
  const loadDraftData = useCallback(async (applicationId: string) => {
    try {
      // Loading draft data from DynamoDB for application ID
      
      // Try to load the most recent draft for this application
      const draftData = await dynamoDBService.getDraft(applicationId, referenceId);
      
      if (draftData && draftData.status === 'draft') {
        // Draft data loaded from DynamoDB
        
        // Restore form data
        if (draftData.form_data) {
          // Parse the form data if it's a string (from DynamoDB)
          let parsedFormData = draftData.form_data;
          if (typeof draftData.form_data === 'string') {
            try {
              parsedFormData = JSON.parse(draftData.form_data);
              // Parsed form data from JSON string
              
              // Clean up the parsed data to ensure consistency
              // Always use the current user's zoneinfo/applicantId, not the stored draft data
              const currentUserZoneinfo = getCurrentUserZoneinfo();
              
              // Form data cleaning - Current user zoneinfo
              // Form data before cleaning
              
              // ALWAYS update application_id to current user's zoneinfo (overwrite any draft data)
              if (currentUserZoneinfo) {
                const oldApplicationId = parsedFormData.application_id;
                parsedFormData.application_id = currentUserZoneinfo;
                // FORCED UPDATE: application_id changed
              }
              
              // ALWAYS update applicantId to current user's zoneinfo (overwrite any draft data)
              if (currentUserZoneinfo) {
                const oldApplicantId = parsedFormData.applicantId;
                parsedFormData.applicantId = currentUserZoneinfo;
                // FORCED UPDATE: applicantId changed
              }
              
              // Form data after cleaning
              
              // Ensure all required sections exist
              parsedFormData.application = parsedFormData.application || {};
              parsedFormData.applicant = parsedFormData.applicant || {};
              parsedFormData.coApplicant = parsedFormData.coApplicant || {};
              parsedFormData.guarantor = parsedFormData.guarantor || {};
              parsedFormData.occupants = parsedFormData.occupants || [];
              
              // Cleaned and normalized form data
            } catch (parseError) {
              // Error parsing form data JSON
              parsedFormData = {
                application: {},
                applicant: {},
                coApplicant: {},
                guarantor: {},
                occupants: []
              };
            }
          }
          
          setFormData(parsedFormData);
          
          // Draft data loaded successfully
          
          // Restore current step
          if (draftData.current_step !== undefined) {
            setCurrentStep(draftData.current_step);
          }
          
          // Restore signatures
          if (draftData.signatures) {
            let parsedSignatures = draftData.signatures;
            if (typeof draftData.signatures === 'string') {
              try {
                parsedSignatures = JSON.parse(draftData.signatures);
              } catch (parseError) {
                // Error parsing signatures JSON
                parsedSignatures = {};
              }
            }
            setSignatures(parsedSignatures);
          }
          
          // Restore webhook responses
          if (draftData.webhook_responses) {
            let parsedWebhookResponses = draftData.webhook_responses;
            if (typeof draftData.webhook_responses === 'string') {
              try {
                parsedWebhookResponses = JSON.parse(draftData.webhook_responses);
              } catch (parseError) {
                // Error parsing webhook responses JSON
                parsedWebhookResponses = {};
              }
            }
            setWebhookResponses(parsedWebhookResponses);
          }
          
          // Restore uploaded files metadata
          if (draftData.uploaded_files_metadata) {
            let parsedUploadedFiles = draftData.uploaded_files_metadata;
            if (typeof draftData.uploaded_files_metadata === 'string') {
              try {
                parsedUploadedFiles = JSON.parse(draftData.uploaded_files_metadata);
              } catch (parseError) {
                // Error parsing uploaded files JSON
                parsedUploadedFiles = {};
              }
            }
            setUploadedFilesMetadata(parsedUploadedFiles);
          }
          
          // Restore encrypted documents
          if (draftData.encrypted_documents) {
            let parsedEncryptedDocuments = draftData.encrypted_documents;
            if (typeof draftData.encrypted_documents === 'string') {
              try {
                parsedEncryptedDocuments = JSON.parse(draftData.encrypted_documents);
              } catch (parseError) {
                // Error parsing encrypted documents JSON
                parsedEncryptedDocuments = {};
              }
            }
            setEncryptedDocuments(parsedEncryptedDocuments);
          }
          
          // Restore form values for React Hook Form
          if (parsedFormData.application) {
            const app = parsedFormData.application;
            console.log('🔧 Restoring application form values:', app);
            
            // Restore all application fields
            if (app.buildingAddress !== undefined) {
              form.setValue('buildingAddress', app.buildingAddress || '');
              // Set buildingAddress
            }
            if (app.apartmentNumber !== undefined) {
              form.setValue('apartmentNumber', app.apartmentNumber || '');
              // Set apartmentNumber
            }
            if (app.apartmentType !== undefined) {
              form.setValue('apartmentType', app.apartmentType || '');
              // Set apartmentType
            }
            
            // Apartment fields restored from draft
            if (app.monthlyRent) {
              form.setValue('monthlyRent', app.monthlyRent);
              // Set monthlyRent
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
                // Set moveInDate
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
          
          // Restore co-applicant information (only fields that exist in schema)
          if (parsedFormData.coApplicant) {
            const coApplicant = parsedFormData.coApplicant;
            if (coApplicant.email !== undefined) form.setValue('coApplicantEmail', coApplicant.email || '');
            if (coApplicant.phone !== undefined) form.setValue('coApplicantPhone', coApplicant.phone || '');
            if (coApplicant.zip !== undefined) form.setValue('coApplicantZip', coApplicant.zip || '');
            
            // Restore co-applicant landlord information (only fields that exist in schema)
            if (coApplicant.landlordZipCode !== undefined) {
              form.setValue('coApplicantLandlordZipCode', coApplicant.landlordZipCode || '');
              // Set coApplicantLandlordZipCode
            }
            if (coApplicant.landlordPhone !== undefined) {
              form.setValue('coApplicantLandlordPhone', coApplicant.landlordPhone || '');
              // Set coApplicantLandlordPhone
            }
            if (coApplicant.landlordEmail !== undefined) {
              form.setValue('coApplicantLandlordEmail', coApplicant.landlordEmail || '');
              // Set coApplicantLandlordEmail
            }
            
            // Auto-check co-applicant checkbox if there's co-applicant data but no explicit flag
            if (parsedFormData.hasCoApplicant === undefined && hasCoApplicantData(coApplicant)) {
              // Auto-detected co-applicant data, checking checkbox
              setHasCoApplicant(true);
              form.setValue('hasCoApplicant', true);
              // Also update formData state
              setFormData((prev: any) => ({
                ...prev,
                hasCoApplicant: true
              }));
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
        }
      } else {
        console.log('📭 No draft data found or draft already submitted');
      }
    } catch (error) {
      console.error('❌ Error loading draft data:', error);
      toast({
        title: "Draft Load Error",
        description: "Failed to load your previous draft. Starting with a fresh form.",
        variant: "destructive",
      });
    }
  }, [referenceId, form, toast]);

  // Set up welcome message and load draft data
  useEffect(() => {
    if (user) {
      const userName = user.name || user.given_name || user.email?.split('@')[0] || 'User';
      setWelcomeMessage(`Welcome back, ${userName}!`);
      
      // Check if we should continue an existing application
      const urlParams = new URLSearchParams(window.location.search);
      const shouldContinue = urlParams.get('continue') === 'true';
      const stepParam = urlParams.get('step');
      
      if (shouldContinue) {
        console.log('🔄 Continue parameter detected, loading existing draft...');
        // Load draft data from DynamoDB if available
        if (user.applicantId) {
          loadDraftData(user.applicantId);
        }
        
        // If a specific step is provided, navigate to it after draft is loaded
        if (stepParam) {
          const targetStep = parseInt(stepParam, 10);
          if (!isNaN(targetStep) && targetStep >= 0 && targetStep < STEPS.length) {
            console.log('🎯 Step parameter detected, will navigate to step:', targetStep);
            // Set the target step - it will be applied after draft data is loaded
            setCurrentStep(targetStep);
          }
        }
      } else {
        console.log('🆕 No continue parameter, starting fresh...');
        // Clear any existing draft data and start fresh
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

          // Initialize co-applicants array
          coApplicants: [],

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
    }
  }, [user, loadDraftData]);

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

  // Helper function to update array items (coApplicants, guarantors)
  const updateArrayItem = (arrayName: string, index: number, field: string, value: any) => {
    console.log(`🔄 updateArrayItem: ${arrayName}[${index}].${field} = ${value}`);
    setFormData((prev: any) => {
      const updated = {
        ...prev,
        [arrayName]: prev[arrayName]?.map((item: any, i: number) => 
          i === index ? { ...item, [field]: value } : item
        ) || []
      };
      console.log(`🔄 Updated ${arrayName}:`, updated[arrayName]);
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
    let selectedUnit = null;
    if (apartmentNumber) {
      selectedUnit = unitsForBuilding.find(unit => unit.name === apartmentNumber);
      console.log('🏠 Found previously selected apartment:', selectedUnit);
    }
    
    // If no specific apartment found, don't auto-select anything
    setSelectedUnit(selectedUnit || null);
    
    // Update form fields directly - the useEffect will handle formData synchronization
    form.setValue('buildingAddress', buildingAddress);
    if (apartmentNumber) {
      form.setValue('apartmentNumber', apartmentNumber);
      console.log('🏠 Restored apartmentNumber:', apartmentNumber);
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

  // Save draft to DynamoDB function
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
      
      // ALWAYS use the current user's zoneinfo for both fields
      const enhancedFormDataSnapshot = {
        ...cleanedFormData,
        application_id: currentUserZoneinfo, // Use zoneinfo as application_id
        applicantId: currentUserZoneinfo,    // Use zoneinfo as applicantId
        webhookSummary: getWebhookSummary()
      };

      console.log('💾 Saving draft with zoneinfo-based IDs:', {
        application_id: currentUserZoneinfo,
        applicantId: currentUserZoneinfo,
        userZoneinfo: user?.zoneinfo,
        userApplicantId: user?.applicantId
      });

      const draftData: DraftData = {
        zoneinfo: currentUserZoneinfo, // Source of truth - user's zoneinfo value
        applicantId: currentUserZoneinfo, // Use zoneinfo for DynamoDB partition key
        reference_id: referenceId,
        form_data: enhancedFormDataSnapshot,
        current_step: currentStep,
        last_updated: new Date().toISOString(),
        status: 'draft',
        uploaded_files_metadata: uploadedFilesMetadata,
        webhook_responses: webhookResponses,
        signatures: signatures,
        encrypted_documents: encryptedDocuments,
      };

      const saveResult = await dynamoDBService.saveDraft(draftData, draftData.applicantId);
      if (saveResult) {
        console.log('💾 Draft saved to DynamoDB successfully');
        toast({
          title: 'Draft Saved Successfully',
          description: 'Your application draft has been saved. You can continue working on it later.',
          variant: 'default',
        });
      } else {
        console.warn('⚠️ Failed to save draft to DynamoDB');
        toast({
          title: 'Failed to Save Draft',
          description: 'There was an error saving your draft. This may be due to an expired session. Please try refreshing the page and signing in again.',
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
  }, [getCurrentUserZoneinfo, formData, referenceId, currentStep, uploadedFilesMetadata, webhookResponses, signatures, encryptedDocuments, getWebhookSummary]);

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

    const generatePDF = async (submissionData?: any) => {
    try {
      // Use the rental application PDF generator for clean, professional alignment
      const pdfGenerator = new RentalApplicationPDF();

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
      if (processedSignatures.applicant) {
        console.log('🔍 Applicant signature preview:', processedSignatures.applicant.substring(0, 100) + '...');
        console.log('🔍 Applicant signature is base64:', processedSignatures.applicant.startsWith('data:image/'));
      }
      
      if (processedSignatures.coApplicants) {
        Object.entries(processedSignatures.coApplicants).forEach(([index, signature]) => {
          const sig = signature as string;
          console.log(`🔍 Co-applicant ${index} signature preview:`, sig.substring(0, 100) + '...');
          console.log(`🔍 Co-applicant ${index} signature is base64:`, sig.startsWith('data:image/'));
        });
      }
      
      if (processedSignatures.guarantors) {
        Object.entries(processedSignatures.guarantors).forEach(([index, signature]) => {
          const sig = signature as string;
          console.log(`🔍 Guarantor ${index} signature preview:`, sig.substring(0, 100) + '...');
          console.log(`🔍 Guarantor ${index} signature is base64:`, sig.startsWith('data:image/'));
        });
      }
      
      console.log('🔍 About to call pdfGenerator.generate with signatures:', processedSignatures);
      
      const pdfDoc = pdfGenerator.generate({
        application: combinedApplicationData,
        applicant: dataToUse.applicant,
        coApplicants: dataToUse.coApplicants || [],
        guarantors: dataToUse.guarantors || [],
        occupants: dataToUse.occupants || [],
        signatures: processedSignatures, // Use processed signatures
      });
    
      // Convert PDF document to data URL for download
      const pdfData = pdfDoc.output('dataurlstring');

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

      // Notify user of result
      if (webhookResult.success) {
        toast({
          title: "PDF Generated & Sent",
          description: "Your rental application PDF has been generated and sent to the webhook.",
        });
      } else {
        toast({
          title: "PDF Generated",
          description: "Your rental application PDF has been generated, but webhook delivery failed.",
          variant: "destructive",
        });
      }

      // Trigger browser download
      const link = document.createElement('a');
      link.href = pdfData;
      link.download = filename;
      link.click();

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF.",
        variant: "destructive",
      });
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
    // If moving forward and co-applicant is not checked, skip co-applicant financial and docs
    if (direction === 1 && (next === 6 || next === 7) && !hasCoApplicant) {
      next = 8;
    }
    // If moving backward and co-applicant is not checked, skip co-applicant financial and docs
    if (direction === -1 && (next === 6 || next === 7) && !hasCoApplicant) {
      next = 5;
    }
    // If moving forward and guarantor is not checked, skip guarantor financial and docs
    if (direction === 1 && (next === 10 || next === 11) && !hasGuarantor) {
      next = 12;
    }
    // If moving backward and guarantor is not checked, skip guarantor financial and docs
    if (direction === -1 && (next === 10 || next === 11) && !hasGuarantor) {
      next = 9;
    }
    return Math.max(0, Math.min(STEPS.length - 1, next));
  };

  // --- Update nextStep and prevStep to use the helper ---
  const nextStep = async (e?: React.MouseEvent) => {
    console.log('🔄 Next step clicked - Current step:', currentStep);
    // Prevent form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
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

  const onSubmit = async (data: ApplicationFormData) => {
    console.log('🚀 Form submission started');
    console.log('Form data (data):', data);
    console.log('Form state (formData):', formData);
    console.log('Has guarantor:', data.hasGuarantor);
    console.log('Guarantors in data:', data.guarantors);
    console.log('Guarantors in formData:', formData.guarantors);
    setIsSubmitting(true);
    
    try {
      // Import signature utilities
      const { validateSignatures, prepareSignaturesForSubmission } = await import('../lib/signature-utils');
      
      // Validate signatures before submission
      const signatureValidation = validateSignatures(signatures);
      if (!signatureValidation.isValid) {
        const errorMessage = signatureValidation.errors.join(', ');
        toast({
          title: "Signature Required",
          description: errorMessage,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
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
      if (!user?.applicantId) {
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

             // Use the applicantId (could be temporary for development)
       console.log("✅ Using applicantId:", user.applicantId);

      // ✅ FIX: Trigger form validation before checking validity
      console.log("🔍 Triggering form validation...");
      const isValid = await form.trigger();
      console.log("✅ Form validation result:", isValid);
      console.log("✅ Updated form errors:", form.formState.errors);
      
      if (!isValid) {
        console.log("❌ Form validation failed");
        toast({
          title: 'Form validation failed',
          description: 'Please check all required fields and try again.',
          variant: 'destructive',
        });
        return;
      }
      
      // Ensure all required fields are present and valid
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
      let missingFields = [];
      for (const field of requiredFields) {
        // Resolve value with fallbacks for nested application fields
        let value = (data as any)[field];
        if (field === 'monthlyRent') {
          value = (data as any).monthlyRent ?? formData.application?.monthlyRent;
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
      // Email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.applicantEmail || '')) {
        missingFields.push('applicantEmail');
      }
      if (missingFields.length > 0) {
        toast({
          title: 'Missing or invalid fields',
          description: `Please fill out: ${missingFields.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      
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
        const completeServerData = {
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
          
          // Co-Applicants (nested objects)
          coApplicants: (formData.coApplicants || []).map((coApplicant: any) => ({
            email: coApplicant.email || formData.coApplicantEmail,
            phone: formatPhoneForPayload(coApplicant.phone || formData.coApplicantPhone),
            zip: coApplicant.zip || formData.coApplicantZip,
            landlordZipCode: coApplicant.landlordZipCode || formData.coApplicantLandlordZipCode,
            landlordPhone: coApplicant.landlordPhone || formData.coApplicantLandlordPhone,
            landlordEmail: coApplicant.landlordEmail || formData.coApplicantLandlordEmail,
            city: coApplicant.city,
            landlordCity: coApplicant.landlordCity,
            name: coApplicant.name,
            licenseState: coApplicant.licenseState,
            state: coApplicant.state,
            relationship: coApplicant.relationship,
            dob: safeDateToISO(coApplicant.dob),
            age: coApplicant.age || 0,
            ssn: coApplicant.ssn || formData.coApplicantSsn,
            license: coApplicant.license || formData.coApplicantLicense,
            lengthAtAddressYears: coApplicant.lengthAtAddressYears,
            lengthAtAddressMonths: coApplicant.lengthAtAddressMonths,
            landlordName: coApplicant.landlordName,
            landlordAddressLine1: coApplicant.landlordAddressLine1,
            landlordAddressLine2: coApplicant.landlordAddressLine2,
            landlordState: coApplicant.landlordState,
            currentRent: coApplicant.currentRent,
            reasonForMoving: coApplicant.reasonForMoving,
            employmentType: coApplicant.employmentType,
            employer: coApplicant.employer,
            position: coApplicant.position,
            employmentStart: safeDateToISO(coApplicant.employmentStart),
            income: coApplicant.income,
            incomeFrequency: coApplicant.incomeFrequency,
            otherIncome: coApplicant.otherIncome,
            otherIncomeSource: coApplicant.otherIncomeSource,
            bankRecords: (coApplicant.bankRecords || []).map((record: any) => ({
                bankName: record.bankName,
                accountType: record.accountType,
                accountNumber: record.accountNumber || ""
              })),
          })),
          
          // Guarantors (nested objects)
          guarantors: (formData.guarantors || []).map((guarantor: any) => ({
            email: guarantor.email || formData.guarantorEmail,
            phone: formatPhoneForPayload(guarantor.phone || formData.guarantorPhone),
            zip: guarantor.zip || formData.guarantorZip,
            city: guarantor.city,
            name: guarantor.name,
            licenseState: guarantor.licenseState,
            address: guarantor.address,
            state: guarantor.state,
            relationship: guarantor.relationship,
            dob: safeDateToISO(guarantor.dob),
            age: guarantor.age || 0,
            ssn: guarantor.ssn || formData.guarantorSsn,
            license: guarantor.license || formData.guarantorLicense,
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
            otherIncomeFrequency: guarantor.otherIncomeFrequency || "monthly",
            otherIncomeSource: guarantor.otherIncomeSource,
            bankRecords: (guarantor.bankRecords || []).map((record: any) => ({
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
            age: occupant.age || 0,
            documents: occupant.documents || {}
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
        
        // Log payload size for debugging
        const payloadSize = JSON.stringify(completeServerData).length;
        const optimizedPayloadSize = JSON.stringify(serverOptimizedData).length;
        console.log(`📊 Original server data size: ${Math.round(payloadSize/1024)}KB`);
        console.log(`📊 Optimized server data size: ${Math.round(optimizedPayloadSize/1024)}KB`);
        console.log(`📊 Size reduction: ${Math.round((payloadSize - optimizedPayloadSize)/1024)}KB`);
        console.log(`📊 Size reduction percentage: ${Math.round(((payloadSize - optimizedPayloadSize) / payloadSize) * 100)}%`);
        
        // Debug: Check what's making the payload large
        if (payloadSize > 100 * 1024) { // If larger than 100KB
          console.log('🔍 Large payload detected, analyzing...');
          console.log(`📊 Total payload size: ${Math.round(payloadSize/1024)}KB`);
          
          // Sort fields by size to identify the largest contributors
          const fieldSizes: { key: string; size: number; sizeKB: number }[] = [];
          
          Object.keys(completeServerData).forEach(key => {
            try {
              const fieldValue = (completeServerData as any)[key];
              if (fieldValue !== undefined && fieldValue !== null) {
                const fieldSize = JSON.stringify(fieldValue).length;
                if (fieldSize > 1024) { // If field is larger than 1KB
                  fieldSizes.push({
                    key,
                    size: fieldSize,
                    sizeKB: Math.round(fieldSize/1024)
                  });
                  console.log(`⚠️ Large field: ${key} = ${Math.round(fieldSize/1024)}KB`);
                  
                  // If it's an object, check its properties
                  if (typeof fieldValue === 'object' && fieldValue !== null) {
                    Object.keys(fieldValue).forEach(subKey => {
                      try {
                        const subValue = fieldValue[subKey];
                        if (subValue !== undefined && subValue !== null) {
                          const subSize = JSON.stringify(subValue).length;
                          if (subSize > 100) { // If sub-field is larger than 100 bytes
                            console.log(`  ⚠️ Large sub-field: ${key}.${subKey} = ${Math.round(subSize/1024)}KB`);
                            // If it's a string and looks like base64, log its length
                            if (typeof subValue === 'string' && subValue.length > 1000) {
                              console.log(`    📝 Large string detected: ${subKey} length = ${subValue.length} characters`);
                              if (subValue.startsWith('data:')) {
                                console.log(`    📝 This appears to be a data URL (base64 encoded)`);
                              }
                            }
                          }
                        }
                      } catch (subError) {
                        console.log(`  ⚠️ Error analyzing sub-field ${key}.${subKey}:`, subError);
                      }
                    });
                  }
                }
              }
            } catch (error) {
              console.log(`⚠️ Error analyzing field ${key}:`, error);
            }
          });
          
          // Sort and display the largest fields
          fieldSizes.sort((a, b) => b.size - a.size);
          console.log('📊 Top 5 largest fields:');
          fieldSizes.slice(0, 5).forEach((field, index) => {
            console.log(`  ${index + 1}. ${field.key}: ${field.sizeKB}KB`);
          });
        }
        
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
        
        // Check if submit-application endpoint exists, if not, skip server submission
        // Use Netlify functions endpoint for local development, or AWS Lambda for production
        const apiEndpoint = import.meta.env.DEV ? '/api' : 'https://your-aws-api-gateway-url.amazonaws.com/prod';
        const submitEndpoint = apiEndpoint + '/submit-application';
        
        // Validate required fields before submission
        if (!serverOptimizedData.applicant?.dob) {
          throw new Error('Date of birth is required. Please select your date of birth.');
        }
        if (!serverOptimizedData.application?.moveInDate) {
          throw new Error('Move-in date is required. Please select your move-in date.');
        }
        if (!serverOptimizedData.applicantName || serverOptimizedData.applicantName.trim() === '') {
          throw new Error('Full name is required. Please enter your full name.');
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
          
          const submissionResponse = await fetch(submitEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: submissionController.signal
          });

          clearTimeout(submissionTimeoutId);

          if (!submissionResponse.ok) {
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

        // Mark draft as submitted in DynamoDB
        if (user?.applicantId) {
          try {
            const markSubmittedResult = await dynamoDBService.markAsSubmitted(user.applicantId, referenceId);
            if (markSubmittedResult) {
              console.log('✅ Draft marked as submitted in DynamoDB');
            } else {
              console.warn('⚠️ Failed to mark draft as submitted in DynamoDB');
            }
          } catch (error) {
            console.error('❌ Error marking draft as submitted:', error);
          }
        }

        // Note: Encrypted data and files are now sent separately via webhooks
        if (serverSubmissionOk) {
          console.log('✅ Server submission successful. Files and encrypted data sent via webhooks.');
        } else {
          console.log('📤 Server submission failed. Proceeding with webhook submission fallback.');
          console.log('🔄 This is expected behavior when server endpoint is not available.');
        }

        // On form submit, send complete form data, application_id, and uploadedDocuments to the webhook
        try {
          // Create complete webhook payload with ALL data
          const completeWebhookData = {
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
            applicantId: user?.applicantId || 'unknown',
            application_id: user?.zoneinfo || user?.applicantId || 'unknown',
            reference_id: referenceId,
            

            
            // Webhook responses for uploaded documents
            webhookResponses: webhookResponses,

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


          // Send the complete webhook data exactly as specified (fallback if server failed or always after)
          console.log('🌐 === WEBHOOK SUBMISSION ===');
          console.log('📤 Webhook payload being sent:', JSON.stringify(webhookPayload, null, 2));
          console.log('🔗 Reference ID:', referenceId);
          console.log('🔗 Application ID:', user?.applicantId);
          
          // Send form data to webhook
          const webhookResult = await WebhookService.sendFormDataToWebhook(
            webhookPayload,
            referenceId,
            user?.applicantId || 'unknown',
            user?.zoneinfo,
            uploadedFilesMetadata
          );
          
          console.log('📥 Webhook response:', JSON.stringify(webhookResult, null, 2));
          console.log('=== END WEBHOOK SUBMISSION ===');
          
          if (webhookResult.success) {
            toast({
              title: "Application Submitted & Sent",
              description: "Your rental application has been submitted and sent to the webhook successfully.",
            });
            setShowSuccessPopup(true);
            setSubmissionReferenceId((submissionResult && submissionResult.reference_id) ? submissionResult.reference_id : referenceId);
          } else {
            toast({
              title: "Application Submitted",
              description: "Your rental application has been submitted, but webhook delivery failed.",
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

        try {
          await generatePDF(completeServerData);
        } catch (pdfError) {
          console.error('PDF generation failed:', pdfError);
          toast({
            title: "PDF Generation Failed",
            description: "Application submitted successfully, but PDF generation failed. Please try generating the PDF again.",
            variant: "destructive",
          });
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

  // Debug effect for Date of Birth and Form Errors
  useEffect(() => {
    console.log('Form applicantDob value:', form.watch('applicantDob'));
    console.log('FormData applicant dob:', formData.applicant?.dob);
    console.log('Form errors:', form.formState.errors);
    
    // Debug guarantor phone validation
    if (form.formState.errors.guarantors) {
      form.formState.errors.guarantors.forEach((guarantorError: any, index: number) => {
        if (guarantorError.phone) {
          console.log(`Guarantor ${index} phone error:`, guarantorError.phone);
          console.log(`Guarantor ${index} phone value:`, formData.guarantors?.[index]?.phone);
        }
      });
    }
  }, [form.watch('applicantDob'), formData.applicant?.dob, form.formState.errors, formData.guarantors]);

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
    switch (stepIdx) {
      case 0:
        return <ApplicationInstructions onNext={nextStep} />;
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
                          value={field.value}
                          onChange={(date) => {
                            field.onChange(date);
                            updateFormData('application', 'moveInDate', date); // Store Date object, not string
                          }}
                          placeholder="Select move-in date"
                          disabled={(date) => date < new Date()}
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
                            disabled={(date) => date > new Date()}
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
                                label="ZIP Code*"
                                placeholder="ZIP code"
                                value={field.value || ''}
                                onChange={(value) => {
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
                    stateLabel="State*"
                    cityLabel="City*"
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
                          onChange={(value) => {
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
                  Co-Applicant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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

            {hasCoApplicant && (
              <>
                {Array.from({ length: formData.coApplicantCount || 1 }, (_, index) => (
                  <Card key={`co-applicant-${index}`} className="form-section border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                    <UserCheck className="w-5 h-5 mr-2" />
                        Co-Applicant Information {index + 1}
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
                                value={formData.coApplicants?.[index]?.name || ''}
                                className="input-field w-full mt-1"
                                onChange={(e) => {
                          updateArrayItem('coApplicants', index, 'name', e.target.value);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <Label className="mb-0.5">Relationship</Label>
                          <Select
                            value={formData.coApplicants?.[index]?.relationship || ''}
                    onValueChange={(value) => updateArrayItem('coApplicants', index, 'relationship', value)}
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
                              value={toValidDate(formData.coApplicants?.[index]?.dob)}
                              onChange={(date) => {
                        // Store the date as a local date to prevent timezone conversion
                        const localDate = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : undefined;
                        updateArrayItem('coApplicants', index, 'dob', localDate);
                                // Auto-calculate age
                                if (date) {
                                  const today = new Date();
                                  const birthDate = new Date(date);
                                  let age = today.getFullYear() - birthDate.getFullYear();
                                  const monthDiff = today.getMonth() - birthDate.getMonth();
                                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                    age--;
                                  }
                          updateArrayItem('coApplicants', index, 'age', age);
                                } else {
                          updateArrayItem('coApplicants', index, 'age', '');
                                }
                              }}
                              placeholder="Select date of birth"
                              disabled={(date) => date > new Date()}
                              className="w-full mt-1"
                            />
                          </FormControl>
                        </FormItem>

                        <FormItem>
                          <FormControl>
                            <SSNInput
                      name={`coApplicants.${index}.ssn`}
                              label="Social Security Number"
                              placeholder="XXX-XX-XXXX"
                              value={formData.coApplicants?.[index]?.ssn || ''}
                              onChange={(value) => {
                        updateArrayItem('coApplicants', index, 'ssn', value);
                        form.setValue(`coApplicants.${index}.ssn`, value);
                              }}
                              className="w-full mt-1"
                            />
                          </FormControl>
                  {form.formState.errors[`coApplicants.${index}.ssn`]?.message && (
                    <span className="text-red-500 text-xs">{form.formState.errors[`coApplicants.${index}.ssn`].message}</span>
                  )}
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <PhoneInput
                      name={`coApplicants.${index}.phone`}
                              label="Phone Number"
                              placeholder="(555) 555-5555"
                              value={formData.coApplicants?.[index]?.phone || ''}
                              onChange={(value) => {
                        updateArrayItem('coApplicants', index, 'phone', value);
                        form.setValue(`coApplicants.${index}.phone`, value);
                              }}
                              className="w-full mt-1"
                            />
                          </FormControl>
                  {form.formState.errors[`coApplicants.${index}.phone`]?.message && (
                    <span className="text-red-500 text-xs">{form.formState.errors[`coApplicants.${index}.phone`].message}</span>
                  )}
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <EmailInput
                      name={`coApplicants.${index}.email`}
                              label="Email Address"
                              placeholder="you@email.com"
                              value={formData.coApplicants?.[index]?.email || ''}
                              onChange={(value) => {
                        updateArrayItem('coApplicants', index, 'email', value);
                        form.setValue(`coApplicants.${index}.email`, value);
                              }}
                              required={true}
                              className="w-full mt-1"
                            />
                          </FormControl>
                  {form.formState.errors[`coApplicants.${index}.email` as keyof typeof form.formState.errors]?.message && (
                    <span className="text-red-500 text-xs">{(form.formState.errors[`coApplicants.${index}.email` as keyof typeof form.formState.errors] as any)?.message}</span>
                  )}
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <LicenseInput
                      name={`coApplicants.${index}.license`}
                              label="Driver's License Number"
                              placeholder="Enter license number"
                              value={formData.coApplicants?.[index]?.license || ''}
                              onChange={(value) => {
                        updateArrayItem('coApplicants', index, 'license', value);
                        form.setValue(`coApplicants.${index}.license`, value);
                              }}
                              className="w-full mt-1"
                            />
                          </FormControl>
                  {form.formState.errors[`coApplicants.${index}.license` as keyof typeof form.formState.errors]?.message && (
                    <span className="text-red-500 text-xs">{(form.formState.errors[`coApplicants.${index}.license` as keyof typeof form.formState.errors] as any)?.message}</span>
                  )}
                        </FormItem>
                <div className="space-y-2">
                        
                            <StateSelector
                    selectedState={formData.coApplicants?.[index]?.licenseState || ''}
                    onStateChange={(state) => updateArrayItem('coApplicants', index, 'licenseState', state)}
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
                    name={`coApplicants.${index}.address`}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="mb-0.5">Street Address</FormLabel>
                          <FormControl>
                            <Input 
                            placeholder="Enter street address" 
                            {...field}
                              className="input-field w-full mt-1"
                              onChange={(e) => {
                              field.onChange(e);
                              updateArrayItem('coApplicants', index, 'address', e.target.value);
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
                            name={`coApplicants.${index}.zip`}
                            label="ZIP Code*"
                            placeholder="ZIP code"
                              value={formData.coApplicants?.[index]?.zip || ''}
                              onChange={(value) => {
                              updateArrayItem('coApplicants', index, 'zip', value);
                              form.setValue(`coApplicants.${index}.zip`, value);
                            }}
                            required={true}
                              className="w-full mt-1"
                            />
                          </FormControl>
                        {form.formState.errors[`coApplicants.${index}.zip` as keyof typeof form.formState.errors]?.message && (
                          <span className="text-red-500 text-xs">{(form.formState.errors[`coApplicants.${index}.zip` as keyof typeof form.formState.errors] as any)?.message}</span>
                        )}
                        </FormItem>
                </div>
                
                <div className="space-y-2">
                  {/* Replace State* and City* text inputs with StateCitySelector */}
                  <StateCitySelector
                    selectedState={formData.coApplicants?.[index]?.state || ''}
                    selectedCity={formData.coApplicants?.[index]?.city || ''}
                    onStateChange={(state) => {
                      updateFormData('coApplicants', index.toString(), 'state', state);
                      // Clear city if state changes
                      updateFormData('coApplicants', index.toString(), 'city', '');
                    }}
                    onCityChange={(city) => {
                      updateFormData('coApplicants', index.toString(), 'city', city);
                    }}
                    stateLabel="State*"
                    cityLabel="City*"
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
                        value={formData.coApplicants?.[index]?.lengthAtAddressYears ?? ''}
                        onChange={e => updateFormData('coApplicants', index.toString(), 'lengthAtAddressYears', e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder="e.g. 2 years"
                              className="w-full mt-1"
                            />
                            <Input 
                              type="number"
                        min={0}
                        max={11}
                        value={formData.coApplicants?.[index]?.lengthAtAddressMonths ?? ''}
                        onChange={e => updateFormData('coApplicants', index.toString(), 'lengthAtAddressMonths', e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder="e.g. 4 months"
                          className="w-full mt-1"
                      />
                    </div>
                    <FormItem>
                      <FormLabel className="mb-0.5">Landlord Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter landlord's name" 
                          value={formData.coApplicants?.[index]?.landlordName || ''}
                          className="input-field w-full mt-1 border-gray-300 bg-white"
                          onChange={(e) => {
                            updateFormData('coApplicants', index.toString(), 'landlordName', e.target.value);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormLabel className="mb-0.5">Landlord Street Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter landlord's street address" 
                          value={formData.coApplicants?.[index]?.landlordAddressLine1 || ''}
                          className="input-field w-full mt-1 border-gray-300 bg-white"
                          onChange={(e) => {
                            updateFormData('coApplicants', index.toString(), 'landlordAddressLine1', e.target.value);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormLabel className="mb-0.5">Landlord Address Line 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Apartment, suite, etc." 
                          value={formData.coApplicants?.[index]?.landlordAddressLine2 || ''}
                          className="input-field w-full mt-1 border-gray-300 bg-white"
                          onChange={(e) => {
                            updateFormData('coApplicants', index.toString(), 'landlordAddressLine2', e.target.value);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <StateSelector
                          selectedState={formData.coApplicants?.[index]?.landlordState || ''}
                          onStateChange={(value) => {
                            updateFormData('coApplicants', index.toString(), 'landlordState', value);
                          }}
                          label="Landlord State"
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <CitySelector
                          selectedState={formData.coApplicants?.[index]?.landlordState || ''}
                          selectedCity={formData.coApplicants?.[index]?.landlordCity || ''}
                          onCityChange={(value) => {
                            updateFormData('coApplicants', index.toString(), 'landlordCity', value);
                          }}
                          label="Landlord City"
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <ZIPInput
                          name={`coApplicants.${index}.landlordZipCode`}
                          label="Landlord ZIP Code"
                          placeholder="Enter landlord's ZIP code"
                          value={formData.coApplicants?.[index]?.landlordZipCode || ''}
                          onChange={(value) => {
                            updateFormData('coApplicants', index.toString(), 'landlordZipCode', value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <PhoneInput
                          name={`coApplicants.${index}.landlordPhone`}
                          label="Landlord Phone Number"
                          placeholder="Enter landlord's phone number"
                          value={formData.coApplicants?.[index]?.landlordPhone || ''}
                          onChange={(value) => {
                            updateFormData('coApplicants', index.toString(), 'landlordPhone', value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <EmailInput
                          name={`coApplicants.${index}.landlordEmail`}
                          label="Landlord Email Address (Optional)"
                          placeholder="Enter landlord's email address"
                          value={formData.coApplicants?.[index]?.landlordEmail || ''}
                          onChange={(value) => {
                            updateFormData('coApplicants', index.toString(), 'landlordEmail', value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <div>
                      <Label htmlFor={`coApplicants.${index}.currentRent`} className="mb-0.5">Monthly Rent</Label>
                      <Input
                        id={`coApplicants.${index}.currentRent`}
                        type="number"
                        placeholder="0.00"
                        value={formData.coApplicants?.[index]?.currentRent?.toString() || ''}
                        onChange={e => {
                          const numValue = parseFloat(e.target.value) || 0;
                          updateFormData('coApplicants', index.toString(), 'currentRent', numValue);
                        }}
                        className="input-field w-full mt-1"
                      />
                    </div>
                    <FormItem>
                      <FormLabel className="mb-0.5">Why Are You Moving</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please explain your reason for moving" 
                          value={formData.coApplicants?.[index]?.reasonForMoving || ''}
                          className="input-field w-full mt-1 border-gray-300 bg-white min-h-[80px]"
                          onChange={(e) => {
                            updateFormData('coApplicants', index.toString(), 'reasonForMoving', e.target.value);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                </CardContent>
              </Card>
                ))}
              </>
            )}
          </div>
        );

      case 6:
        if (!hasCoApplicant) {
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
            {Array.from({ length: formData.coApplicantCount || 1 }, (_, index) => (
              <Card key={`co-applicant-financial-${index}`} className="form-section border-l-4 border-l-green-500 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                    <CalendarDays className="w-5 h-5 mr-2" />
                    Financial Information - Co-Applicant {index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FinancialSection 
                    title={`Co-Applicant ${index + 1} Financial Information`}
                    person={`coApplicants_${index}`}
                    formData={formData}
                    updateFormData={updateFormData}
                    coApplicantIndex={index}
                  />
                </CardContent>
              </Card>
            ))}
          </>
        );

      case 7:
        
        // Only show the fallback message if there are no co-applicants at all
        if (!hasCoApplicant) {
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
          hasCoApplicant ? (
            <>
              {Array.from({ length: formData.coApplicantCount || 1 }, (_, index) => (
                <Card key={`co-applicant-documents-${index}`} className="form-section border-l-4 border-l-green-500 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                  <FolderOpen className="w-5 h-5 mr-2" />
                      Co-Applicant Documents {index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Employment Type Selection for Co-Applicant Documents */}
                {!formData.coApplicants?.[index]?.employmentType ? (
                  <div className="space-y-4">
                    <div className="text-gray-500 text-sm mb-4">Please select Employment Type to upload supporting documents for Co-Applicant {index + 1}.</div>
                    
                    <div className="form-field">
                      <Label htmlFor={`coApplicant-${index}-employmentType`}>Employment Type *</Label>
                      <Select
                        value={formData.coApplicants?.[index]?.employmentType || ''}
                        onValueChange={(value) => {
                          updateFormData('coApplicants', index.toString(), 'employmentType', value);
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
                              .filter(([key]) => key.startsWith(`coApplicants_${index}_`))
                              .map(([key, value]) => [key.replace(`coApplicants_${index}_`, ''), value])
                          )
                        }}
                        originalWebhookResponses={webhookResponses}
                        onDocumentChange={(documentType: string, files: File[]) => {
                          console.log(`🔑 Co-Applicant ${index + 1} document change for ${documentType}:`, files.length, 'files');
                          handleDocumentChange('coApplicants', documentType, files, index);
                        }}
                        onEncryptedDocumentChange={(documentType: string, encryptedFiles: EncryptedFile[]) => {
                          console.log(`🔑 Co-Applicant ${index + 1} encrypted document change for ${documentType}:`, encryptedFiles.length, 'files');
                          handleEncryptedDocumentChange('coApplicants', documentType, encryptedFiles, index);
                        }}
                        onWebhookResponse={(documentType: string, response: any) => {
                          // Pass the document type and index to the function
                          console.log(`🔑 Co-Applicant ${index + 1} webhook response for ${documentType}:`, response);
                          handleWebhookResponse('coApplicants', documentType, response, index);
                        }}
                        referenceId={referenceId}
                        enableWebhook={true}
                        applicationId={user?.applicantId || 'unknown'}
                        applicantId={user?.id}
                        zoneinfo={user?.zoneinfo}
                        showOnlyCoApplicant={true}
                        index={index}
                  />
                )}
              </CardContent>
            </Card>
              ))}
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
                      <Input
                        placeholder="Relationship"
                        value={occupant.relationship || ''}
                        onChange={e => {
                          const updated = [...formData.occupants];
                          updated[idx] = { ...updated[idx], relationship: e.target.value };
                          setFormData((prev: any) => ({ ...prev, occupants: updated }));
                        }}
                      />
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
                        disabled={date => date > new Date()}
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
                    Guarantor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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

                {hasGuarantor && (
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
                    {Array.from({ length: Math.max(1, formData.guarantorCount || 1) }, (_, index) => (
                      <Card key={index} className="form-section border-l-4 border-l-orange-500">
                        <CardHeader>
                          <CardTitle className="flex items-center text-orange-700 dark:text-orange-400">
                            <Shield className="w-5 h-5 mr-2" />
                            Guarantor {index + 1}
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
                                    value={formData.guarantors?.[index]?.name || ''}
                              className="input-field w-full mt-1"
                              onChange={(e) => {
                                      updateFormData('guarantors', index.toString(), 'name', e.target.value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <Label className="mb-0.5">Relationship</Label>
                        <Select
                                value={formData.guarantors?.[index]?.relationship || ''}
                                onValueChange={(value) => updateFormData('guarantors', index.toString(), 'relationship', value)}
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
                                  value={toValidDate(formData.guarantors?.[index]?.dob)}
                            onChange={(date) => {
                                    // Store the date as a local date to prevent timezone conversion
                                    const localDate = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : undefined;
                                    updateFormData('guarantors', index.toString(), 'dob', localDate);
                              // Auto-calculate age
                              if (date) {
                                const today = new Date();
                                const birthDate = new Date(date);
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                  age--;
                                }
                                      updateFormData('guarantors', index.toString(), 'age', age);
                              } else {
                                      updateFormData('guarantors', index.toString(), 'age', '');
                              }
                            }}
                            placeholder="Select date of birth"
                            disabled={(date) => date > new Date()}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>

                      <FormItem>
                        <FormControl>
                          <SSNInput
                                  name={`guarantors.${index}.ssn`}
                            label="Social Security Number"
                            placeholder="XXX-XX-XXXX"
                                  value={formData.guarantors?.[index]?.ssn || ''}
                            onChange={(value) => {
                                    updateFormData('guarantors', index.toString(), 'ssn', value);
                            }}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <PhoneInput
                                  name={`guarantors.${index}.phone`}
                            label="Phone Number"
                            placeholder="(555) 555-5555"
                                  value={formData.guarantors?.[index]?.phone || ''}
                            onChange={(value) => {
                                    updateFormData('guarantors', index.toString(), 'phone', value);
                            }}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <EmailInput
                                  name={`guarantors.${index}.email`}
                            label="Email Address"
                            placeholder="you@email.com"
                                  value={formData.guarantors?.[index]?.email || ''}
                            onChange={(value) => {
                                    updateFormData('guarantors', index.toString(), 'email', value);
                            }}
                            required={true}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <LicenseInput
                                  name={`guarantors.${index}.license`}
                            label="Driver's License Number"
                            placeholder="Enter license number"
                                  value={formData.guarantors[index]?.license || ''}
                            onChange={(value) => {
                                    updateFormData('guarantors', index.toString(), 'license', value);
                            }}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <div className="space-y-2">
                        <StateSelector
                          selectedState={formData.guarantors[index]?.licenseState || ''}
                          onStateChange={(state) => updateFormData('guarantors', index.toString(), 'licenseState', state)}
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
                              value={formData.guarantors[index]?.address || ''}
                              className="input-field w-full mt-1"
                              onChange={(e) => {
                                updateFormData('guarantors', index.toString(), 'address', e.target.value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      </div>
                      <FormItem>
                        <FormControl>
                          <ZIPInput
                            name={`guarantors.${index}.zip`}
                            label="ZIP Code*"
                            placeholder="ZIP code"
                            value={formData.guarantors[index]?.zip || ''}
                            onChange={(value) => {
                              updateFormData('guarantors', index.toString(), 'zip', value);
                            }}
                            required={true}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <StateSelector
                            selectedState={formData.guarantors[index]?.state || ''}
                            onStateChange={(state) => {
                              updateFormData('guarantors', index.toString(), 'state', state);
                              // Clear city if state changes
                              updateFormData('guarantors', index.toString(), 'city', '');
                            }}
                            label="State*"
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <CitySelector
                            selectedState={formData.guarantors[index]?.state || ''}
                            selectedCity={formData.guarantors[index]?.city || ''}
                            onCityChange={(city) => {
                              updateFormData('guarantors', index.toString(), 'city', city);
                            }}
                            label="City*"
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
                          value={formData.guarantors[index]?.lengthAtAddressYears ?? ''}
                          onChange={e => updateFormData('guarantors', index.toString(), 'lengthAtAddressYears', e.target.value === '' ? undefined : Number(e.target.value))}
                          placeholder="e.g. 2 years"
                          className="w-full mt-1"
                        />
                        <Input 
                          type="number"
                          min={0}
                          max={11}
                          value={formData.guarantors[index]?.lengthAtAddressMonths ?? ''}
                          onChange={e => updateFormData('guarantors', index.toString(), 'lengthAtAddressMonths', e.target.value === '' ? undefined : Number(e.target.value))}
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
                              value={formData.guarantors[index]?.landlordName || ''}
                              className="input-field w-full mt-1 border-gray-300 bg-white"
                              onChange={(e) => {
                                updateFormData('guarantors', index.toString(), 'landlordName', e.target.value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormLabel className="mb-0.5">Landlord Street Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter landlord's street address" 
                              value={formData.guarantors[index]?.landlordAddressLine1 || ''}
                              className="input-field w-full mt-1 border-gray-300 bg-white"
                              onChange={(e) => {
                                updateFormData('guarantors', index.toString(), 'landlordAddressLine1', e.target.value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormLabel className="mb-0.5">Landlord Address Line 2 (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Apartment, suite, etc." 
                              value={formData.guarantors[index]?.landlordAddressLine2 || ''}
                              className="input-field w-full mt-1 border-gray-300 bg-white"
                              onChange={(e) => {
                                updateFormData('guarantors', index.toString(), 'landlordAddressLine2', e.target.value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <StateSelector
                              selectedState={formData.guarantors[index]?.landlordState || ''}
                              onStateChange={(value) => {
                                updateFormData('guarantors', index.toString(), 'landlordState', value);
                              }}
                              label="Landlord State"
                              className="w-full mt-1"
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <CitySelector
                              selectedState={formData.guarantors[index]?.landlordState || ''}
                              selectedCity={formData.guarantors[index]?.landlordCity || ''}
                              onCityChange={(value) => {
                                updateFormData('guarantors', index.toString(), 'landlordCity', value);
                              }}
                              label="Landlord City"
                              className="w-full mt-1"
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <ZIPInput
                              name={`guarantors.${index}.landlordZipCode`}
                              label="Landlord ZIP Code"
                              placeholder="Enter landlord's ZIP code"
                              value={formData.guarantors[index]?.landlordZipCode || ''}
                              onChange={(value) => {
                                updateFormData('guarantors', index.toString(), 'landlordZipCode', value);
                              }}
                              className="w-full mt-1"
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <PhoneInput
                              name={`guarantors.${index}.landlordPhone`}
                              label="Landlord Phone Number"
                              placeholder="Enter landlord's phone number"
                              value={formData.guarantors[index]?.landlordPhone || ''}
                              onChange={(value) => {
                                updateFormData('guarantors', index.toString(), 'landlordPhone', value);
                              }}
                              className="w-full mt-1"
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <EmailInput
                              name={`guarantors.${index}.landlordEmail`}
                              label="Landlord Email Address (Optional)"
                              placeholder="Enter landlord's email address"
                              value={formData.guarantors[index]?.landlordEmail || ''}
                              onChange={(value) => {
                                updateFormData('guarantors', index.toString(), 'landlordEmail', value);
                              }}
                              className="w-full mt-1"
                            />
                          </FormControl>
                        </FormItem>
                        <div>
                          <Label htmlFor={`guarantors.${index}.currentRent`} className="mb-0.5">Monthly Rent</Label>
                          <Input
                            id={`guarantors.${index}.currentRent`}
                            type="number"
                            placeholder="0.00"
                            value={formData.guarantors[index]?.currentRent?.toString() || ''}
                            onChange={e => {
                              const numValue = parseFloat(e.target.value) || 0;
                              updateFormData('guarantors', index.toString(), 'currentRent', numValue);
                            }}
                            className="input-field w-full mt-1"
                          />
                        </div>
                        <FormItem>
                          <FormLabel className="mb-0.5">Why Are You Moving</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Please explain your reason for moving" 
                              value={formData.guarantors[index]?.reasonForMoving || ''}
                              className="input-field w-full mt-1 border-gray-300 bg-white min-h-[80px]"
                              onChange={(e) => {
                                updateFormData('guarantors', index.toString(), 'reasonForMoving', e.target.value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            {!hasGuarantor ? (
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
                  {Array.from({ length: Math.max(1, formData.guarantorCount || 1) }, (_, index) => (
                    <div key={index} className="mb-8 last:mb-0">
                      <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-4">
                        Financial Information 3 - Guarantor {index + 1}
                      </h3>
                      <FinancialSection 
                        title={`Guarantor ${index + 1} Financial Information`}
                        person={`guarantors_${index}`}
                        formData={formData}
                        updateFormData={updateFormData}
                        form={form}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 11:
        return (
          <div className="space-y-6">
            {!hasGuarantor ? (
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
                  {Array.from({ length: Math.max(1, formData.guarantorCount || 1) }, (_, index) => (
                    <div key={index} className="mb-8 last:mb-0">
                      <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-4">
                        Guarantor {index + 1} Documents
                      </h3>
                      {/* Employment Type Selection for Guarantor Documents */}
                      {!formData.guarantors?.[index]?.employmentType ? (
                        <div className="space-y-4">
                          <div className="text-gray-500 text-sm mb-4">Please select Employment Type to upload supporting documents for Guarantor {index + 1}.</div>
                          
                          <div className="form-field">
                            <Label htmlFor={`guarantor-${index}-employmentType`}>Employment Type *</Label>
                            <div className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                              Guarantor cannot be a student, only employment/ self-employment options
                            </div>
                            <Select
                              value={formData.guarantors?.[index]?.employmentType || ''}
                              onValueChange={(value) => {
                                // Prevent guarantors from selecting student employment type
                                if (value === 'student') {
                                  return; // Don't allow this selection
                                }
                                updateFormData('guarantors', index.toString(), 'employmentType', value);
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
                                .filter(([key]) => key.startsWith(`guarantors_${index}_`))
                                .map(([key, value]) => [key.replace(`guarantors_${index}_`, ''), value])
                            )
                          }}
                          originalWebhookResponses={webhookResponses}
                          onDocumentChange={(documentType: string, files: File[]) => 
                            handleDocumentChange('guarantors', documentType, files, index)
                          }
                          onEncryptedDocumentChange={(documentType: string, encryptedFiles: EncryptedFile[]) => 
                            handleEncryptedDocumentChange('guarantors', documentType, encryptedFiles, index)
                          }
                          onWebhookResponse={(documentType: string, response: any) => {
                            // Pass the document type and index to the function
                            handleWebhookResponse('guarantors', documentType, response, index);
                          }}
                          referenceId={referenceId}
                          enableWebhook={true}
                          applicationId={user?.applicantId || 'unknown'}
                          applicantId={user?.id}
                          zoneinfo={user?.zoneinfo}
                          showOnlyGuarantor={true}
                          index={index}
                        />
                      )}
                    </div>
                  ))}
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
                  The Landlord shall not be bound by any lease, nor will possession of the premises be delivered to the Tenant, until a written lease agreement is executed by the Landlord and delivered to the Tenant. Approval of this application remains at Landlord’s discretion until a lease agreement is fully executed. Please be advised that the date on page one of the lease is your move-in date and also denotes the lease commencement date. No representations or agreements by agents, brokers or others shall be binding upon the Landlord or its Agent unless those representations or agreements are set forth in the written lease agreement executed by both Landlord and Tenant.</p>
                  <h3 className="font-bold uppercase text-sm mb-2">Certification & Consents</h3>
                  <p className="text-xs text-gray-700 whitespace-pre-line">By signing this application electronically, I consent to the use of electronic records and digital signatures in connection with this application and any resulting lease agreement. I agree that my electronic signature is legally binding and has the same effect as a handwritten signature. <br/>I hereby warrant that all my representations and information provided in this application are true, accurate, and complete to the best of my knowledge. I recognize the truth of the information contained herein is essential and I acknowledge that any false or misleading information may result in the rejection of my application  or rescission of the offer prior to possession or, if a lease has been executed and/or possession delivered, may constitute a material breach and provide grounds to commence appropriate legal proceedings to terminate the tenancy, as permitted by law. I further represent that I am not renting a room or an apartment under any other name, nor have I ever been dispossessed or evicted from any residence, nor am I now being dispossessed nor currently being evicted. I represent that I am over at least 18 years of age. I acknowledge and consent that my Social Security number and any other personal identifying information collected in this application may be used for tenant screening and will be maintained in confidence and protected against unauthorized disclosure in accordance with New York General Business Law and related privacy laws. I have been advised that I have the right, under the Fair Credit Reporting Act, to make a written request, directed to the appropriate credit reporting agency, within reasonable time, for a complete and accurate disclosure of the nature and scope of any credit investigation. I understand that upon submission, this application and all related documents become the property of the Landlord, and will not be returned to me under any circumstances regardless of whether my application is approved or denied. I consent to and authorize the Landlord, Agent and any designated screening or credit reporting agency to obtain a consumer credit report on me and to conduct any necessary background checks, to the extent permitted by law. I further authorize the Landlord and Agent to verify any and all information provided in this application with regard to my employment history, current and prior tenancies, bank accounts, and all other information that the Landlord deems pertinent to evaluating my leasing application. I authorize the designated screening company to contact my current and previous landlords, employers and references, if necessary. I understand that I shall not be permitted to receive or review my application file or my credit consumer report, <br/>and the Landlord and Agent are not obligated to provide me with copies of my application file or any consumer report obtained in the screening process, and that I may obtain my credit report from the credit reporting agency or as otherwise provided by law. I authorize banks, financial institutions, landlords, employers, business associates, credit bureaus, attorneys, accountants and other persons or institutions with whom I am acquainted and that may have information about me to furnish any and all information regarding myself. This authorization also applies to any updated reports which may be ordered as needed. A photocopy or fax of this authorization or an electronic copy (including any electronic signature) shall be accepted with the same authority as this original. I will provide any additional information required by the Landlord or Agent in connection with this application or any prospective lease contemplated herein. I understand that the application fee is non-refundable. <br/>The Civil Rights Act of 1968, as amended by the Fair Housing Amendments Act of 1988, prohibits discrimination in the rental of housing based on race, color, religion, gender, disability, familial status, lawful source of income (including housing vouchers and public assistance) or national origin. The Federal Agency, which administers compliance with this law, is the U.S. Department of Housing and Urban Development.” </p> </div>
                <div>
                  <Label className="text-base font-medium">Primary Applicant Signature *</Label>
                  <SignaturePad 
                    onSignatureChange={(signature) => handleSignatureChange('applicant', signature)}
                    className="mt-2"
                  />
                </div>

                {hasCoApplicant && Array.from({ length: formData.coApplicantCount || 1 }, (_, index) => (
                  <div key={`co-applicant-signature-${index}`}>
                    <Label className="text-base font-medium">Co-Applicant {index + 1} Signature *</Label>
                    <SignaturePad 
                      onSignatureChange={(signature) => handleSignatureChange('coApplicants', index.toString(), signature)}
                      className="mt-2"
                    />
                  </div>
                ))}

                {hasGuarantor && Array.from({ length: Math.max(1, formData.guarantorCount || 1) }, (_, index) => (
                  <div key={`guarantor-signature-${index}`}>
                    <Label className="text-base font-medium">Guarantor {index + 1} Signature *</Label>
                    <SignaturePad 
                      onSignatureChange={(signature) => handleSignatureChange('guarantors', index.toString(), signature)}
                      className="mt-2"
                    />
                  </div>
                ))}
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

  const handleNext = () => {
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
      
      return Math.min(nextStep, STEPS.length - 1);
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Progress Bar - Hidden */}
          {/* <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]?.title}
              </h2>
              <span className="text-sm text-gray-500">
                {Math.round(((currentStep + 1) / STEPS.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              ></div>
          </div>
          
            <div className="flex flex-wrap gap-2 mt-4">
            {STEPS.map((step, index) => {
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                      onClick={() => setCurrentStep(index)}
                      className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        index === currentStep
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : index < currentStep
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {step.icon && <step.icon className="w-3 h-3 mr-1" />}
                      {step.title}
                  </button>
                  {index < STEPS.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-gray-400 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div> */}

          {/* Form Content */}
              {renderStep()}

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
                
              {currentStep === STEPS.length - 1 ? (
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
                  onClick={handleNext}
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
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Application Submitted Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your rental application has been submitted and sent to the webhook successfully.
                {submissionReferenceId && (
                  <span className="block mt-2 text-sm font-medium text-gray-700">
                    Reference ID: {submissionReferenceId}
                  </span>
                )}
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowSuccessPopup(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuccessPopup(false);
                    setShowDashboard(true);
                  }}
                  className="flex-1"
                >
                  View Dashboard
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
