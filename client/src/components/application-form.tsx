import React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SignaturePad } from "@/components/ui/signature-pad";
import { DatePicker } from "@/components/ui/date-picker";
import { FinancialSection } from "./financial-section";
import { DocumentSection } from "./document-section";
import { SupportingDocuments } from "./supporting-documents";
import { PDFGenerator } from "@/lib/pdf-generator";
import { EnhancedPDFGenerator } from "@/lib/pdf-generator-enhanced";
import { ResetPDFGenerator } from "@/lib/pdf-generator-reset";
import { Download, FileText, Save, Users, UserCheck, CalendarDays, Shield, FolderOpen, ChevronLeft, ChevronRight, Check, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ApplicationInstructions from "./application-instructions";
import { useRef } from "react";
import { useLocation } from "wouter";
import { type EncryptedFile, validateEncryptedData, createEncryptedDataSummary } from "@/lib/file-encryption";
import { WebhookService } from "@/lib/webhook-service";
import { MondayApiService, type UnitItem } from "@/lib/monday-api";
import { ValidatedInput, PhoneInput, SSNInput, ZIPInput, EmailInput, LicenseInput, IncomeInput, IncomeWithFrequencyInput } from "@/components/ui/validated-input";
import { StateCitySelector, StateSelector, CitySelector } from "@/components/ui/state-city-selector";
import { validatePhoneNumber, validateSSN, validateZIPCode, validateEmail } from "@/lib/validation";
import { FileUpload } from "@/components/ui/file-upload";


const applicationSchema = z.object({
  // Application Info
  buildingAddress: z.string().optional(),
  apartmentNumber: z.string().optional(),
  moveInDate: z.date({
    required_error: "Move-in date is required",
    invalid_type_error: "Please select a valid move-in date",
  }),
  monthlyRent: z.number().optional().or(z.undefined()),
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
  applicantLicense: z.string().optional(),
  applicantLicenseState: z.string().optional(),
  applicantAddress: z.string().optional(),
  applicantCity: z.string().optional(),
  applicantState: z.string().optional(),
  applicantZip: z.string().optional().refine((val) => !val || validateZIPCode(val), {
    message: "Please enter a valid ZIP code"
  }),
  applicantLengthAtAddressYears: z.number().optional().or(z.undefined()),
  applicantLengthAtAddressMonths: z.number().optional().or(z.undefined()),
  applicantLandlordName: z.string().optional(),
  applicantCurrentRent: z.number().optional().or(z.undefined()),
  applicantReasonForMoving: z.string().optional(),
  applicantGender: z.string().optional(),

  // Conditional fields
  hasCoApplicant: z.boolean().default(false),
  hasGuarantor: z.boolean().default(false),

  // Legal Questions
  landlordTenantLegalAction: z.string().optional(),
  brokenLease: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const STEPS = [
  { id: 0, title: "Instructions" },
  { id: 1, title: "Application Info", icon: FileText },
  { id: 2, title: "Primary Applicant", icon: UserCheck },
  { id: 3, title: "Financial Info", icon: CalendarDays },
  { id: 4, title: "Supporting Documents", icon: FolderOpen },
  { id: 5, title: "Co-Applicant", icon: Users },
  { id: 6, title: "Co-Applicant Documents", icon: FolderOpen },
  { id: 7, title: "Other Occupants", icon: Users },
  { id: 8, title: "Guarantor", icon: Shield },
  { id: 9, title: "Guarantor Documents", icon: FolderOpen },
  { id: 10, title: "Digital Signatures", icon: Check },
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
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    application: {},
    applicant: {},
    coApplicant: {},
    guarantor: {},
    occupants: [], // Each occupant: { name, relationship, dob, ssn, age, gender }
  });
  const [signatures, setSignatures] = useState<any>({});
  const [signatureTimestamps, setSignatureTimestamps] = useState<any>({});
  const [documents, setDocuments] = useState<any>({});
  const [encryptedDocuments, setEncryptedDocuments] = useState<any>({});
  const [hasCoApplicant, setHasCoApplicant] = useState(false);
  const [hasGuarantor, setHasGuarantor] = useState(false);
  const [sameAddressCoApplicant, setSameAddressCoApplicant] = useState(false);
  const [sameAddressGuarantor, setSameAddressGuarantor] = useState(false);
  const [showHowDidYouHearOther, setShowHowDidYouHearOther] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [referenceId] = useState(() => `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [applicationId] = useState(() => `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [uploadedFilesMetadata, setUploadedFilesMetadata] = useState<{ [section: string]: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[] }>({});
  // Add state for uploadedDocuments
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    reference_id: string;
    file_name: string;
    section_name: string;
    documents?: string;
  }[]>([]);

  // Monday.com API state
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(null);
  const [availableApartments, setAvailableApartments] = useState<UnitItem[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  // Fetch units from Monday.com API
  useEffect(() => {
    const fetchUnits = async () => {
      setIsLoadingUnits(true);
      try {
        const fetchedUnits = await MondayApiService.fetchVacantUnits();
        setUnits(fetchedUnits);
      } catch (error) {
        console.error('Failed to fetch units:', error);
      } finally {
        setIsLoadingUnits(false);
      }
    };

    fetchUnits();
  }, []);

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
      applicantCurrentRent: undefined,
      applicantReasonForMoving: "",
      applicantGender: "",

      // Conditional fields
      hasCoApplicant: false,
      hasGuarantor: false,

      // Legal Questions
      landlordTenantLegalAction: "",
      brokenLease: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  const updateFormData = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Handle building selection
  const handleBuildingSelect = (buildingAddress: string) => {
    setSelectedBuilding(buildingAddress);
    const unitsForBuilding = MondayApiService.getUnitsByBuilding(units, buildingAddress);
    setAvailableApartments(unitsForBuilding);
    
    // Auto-select first unit if available
    const firstUnit = unitsForBuilding[0] || null;
    setSelectedUnit(firstUnit);
    
    // Update form data
    updateFormData('application', 'buildingAddress', buildingAddress);
    updateFormData('application', 'apartmentNumber', firstUnit?.name || '');
    updateFormData('application', 'apartmentType', firstUnit?.unitType || '');
    
    // Update form fields
    form.setValue('buildingAddress', buildingAddress);
    form.setValue('apartmentNumber', firstUnit?.name || '');
    form.setValue('apartmentType', firstUnit?.unitType || '');
  };

  // Handle apartment selection
  const handleApartmentSelect = (apartmentName: string) => {
    const selectedApartment = availableApartments.find(unit => unit.name === apartmentName);
    setSelectedUnit(selectedApartment || null);
    
    // Update form data
    updateFormData('application', 'apartmentNumber', apartmentName);
    updateFormData('application', 'apartmentType', selectedApartment?.unitType || '');
    updateFormData('application', 'monthlyRent', selectedApartment?.monthlyRent || undefined);
    
    // Update form fields
    form.setValue('apartmentNumber', apartmentName);
    form.setValue('apartmentType', selectedApartment?.unitType || '');
    form.setValue('monthlyRent', selectedApartment?.monthlyRent || undefined);
  };

  const handleDocumentChange = (person: string, documentType: string, files: File[]) => {
    setDocuments((prev: any) => ({
      ...prev,
      [person]: {
        ...prev[person],
        [documentType]: files,
      },
    }));
  };

  const handleEncryptedDocumentChange = (person: string, documentType: string, encryptedFiles: EncryptedFile[]) => {
    console.log('handleEncryptedDocumentChange called:', { person, documentType, encryptedFilesCount: encryptedFiles.length });
    
    // Special debugging for guarantor documents
    if (person === 'guarantor') {
      console.log('🚀 GUARANTOR ENCRYPTED DOCUMENT CHANGE:', {
        person,
        documentType,
        encryptedFilesCount: encryptedFiles.length,
        encryptedFiles: encryptedFiles.map(f => ({ filename: f.filename, size: f.encryptedData.length }))
      });
    }
    
    setEncryptedDocuments((prev: any) => ({
      ...prev,
      [person]: {
        ...prev[person],
        [documentType]: encryptedFiles,
      },
    }));

    // Track uploadedDocuments for webhook
    const sectionKey = `${person}_${documentType}`;
    const docs = encryptedFiles.map(file => ({
      reference_id: file.uploadDate + '-' + file.filename, // or use a better unique id if available
      file_name: file.filename,
      section_name: sectionKey,
      documents: documentType // <-- Now included
    }));
    setUploadedDocuments(prev => {
      // Remove any previous docs for this section
      const filtered = prev.filter(doc => doc.section_name !== sectionKey);
      return [...filtered, ...docs];
    });

    // Track uploaded files metadata for webhook
    const filesMetadata = encryptedFiles.map(file => ({
      file_name: file.filename,
      file_size: file.originalSize,
      mime_type: file.mimeType,
      upload_date: file.uploadDate
    }));

    setUploadedFilesMetadata(prev => ({
      ...prev,
      [sectionKey]: filesMetadata
    }));
  };

  const handleSignatureChange = (person: string, signature: string) => {
    setSignatures((prev: any) => ({
      ...prev,
      [person]: signature,
    }));
    setSignatureTimestamps((prev: any) => ({
      ...prev,
      [person]: new Date().toISOString(),
    }));
  };

  const generatePDF = async () => {
    try {
    // Use the reset PDF generator for clean, professional alignment
    const pdfGenerator = new ResetPDFGenerator();

    // Get current form values to ensure we have the latest data
    const currentFormData = form.getValues();
    
    // Combine form data from both sources to ensure all fields are included
    const combinedApplicationData = {
      ...formData.application,
      buildingAddress: currentFormData.buildingAddress || formData.application?.buildingAddress,
      apartmentNumber: currentFormData.apartmentNumber || formData.application?.apartmentNumber,
      moveInDate: currentFormData.moveInDate || formData.application?.moveInDate,
      monthlyRent: currentFormData.monthlyRent || formData.application?.monthlyRent,
      apartmentType: currentFormData.apartmentType || formData.application?.apartmentType,
      howDidYouHear: currentFormData.howDidYouHear || formData.application?.howDidYouHear,
    };

    // Debug logging to verify data
    console.log('PDF Generation Debug:');
    console.log('Current form data:', currentFormData);
    console.log('FormData state:', formData.application);
    console.log('Combined application data:', combinedApplicationData);
    console.log('Applicant bank records:', formData.applicant?.bankRecords);
    console.log('Co-applicant bank records:', formData.coApplicant?.bankRecords);
    console.log('Guarantor bank records:', formData.guarantor?.bankRecords);

    const pdfData = pdfGenerator.generatePDF({
      application: combinedApplicationData,
      applicant: formData.applicant,
      coApplicant: hasCoApplicant ? formData.coApplicant : undefined,
      guarantor: hasGuarantor ? formData.guarantor : undefined,
      signatures,
      occupants: formData.occupants || [],
    });

      // Extract base64 from data URL
      const base64 = pdfData.split(',')[1];

      // Prepare filename
      const filename = `rental-application-${new Date().toISOString().split('T')[0]}.pdf`;

      // Send PDF to webhook
      console.log('Sending PDF to webhook:', {
        filename,
        referenceId,
        applicationId,
        base64Length: base64.length
      });
      
      const webhookResult = await WebhookService.sendPDFToWebhook(
        base64,
        referenceId,
        applicationId,
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

  const saveDraft = () => {
    localStorage.setItem('rentalApplicationDraft', JSON.stringify({
      formData,
      signatures,
      hasCoApplicant,
      hasGuarantor,
      sameAddressCoApplicant,
      sameAddressGuarantor,
      currentStep,
    }));

    toast({
      title: "Draft Saved",
      description: "Your application has been saved as a draft.",
    });
  };

  // --- Add this helper to get the next allowed step index ---
  function getNextAllowedStep(current: number, direction: 1 | -1) {
    let next = current + direction;
    // If moving forward and co-applicant is not checked, skip co-applicant docs
    if (direction === 1 && next === 6 && !hasCoApplicant) {
      next = 7;
    }
    // If moving backward and co-applicant is not checked, skip co-applicant docs
    if (direction === -1 && next === 6 && !hasCoApplicant) {
      next = 5;
    }
    // If moving forward and guarantor is not checked, skip guarantor docs
    if (direction === 1 && next === 9 && !hasGuarantor) {
      next = 10;
    }
    // If moving backward and guarantor is not checked, skip guarantor docs
    if (direction === -1 && next === 9 && !hasGuarantor) {
      next = 8;
    }
    return Math.max(0, Math.min(STEPS.length - 1, next));
  }

  // --- Update nextStep and prevStep to use the helper ---
  const nextStep = () => {
    setCurrentStep((prev) => getNextAllowedStep(prev, 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => getNextAllowedStep(prev, -1));
  };

  // --- Update goToStep to block manual access to co-applicant/guarantor docs if not allowed ---
  const goToStep = (step: number) => {
    // Step 6 is Co-Applicant Documents
    if (step === 6 && !hasCoApplicant) {
      toast({
        title: 'Co-Applicant Documents Unavailable',
        description: 'Please check "Add Co-Applicant" to upload documents.',
        variant: 'warning',
      });
      return;
    }
    // Step 9 is Guarantor Documents
    if (step === 9 && !hasGuarantor) {
      toast({
        title: 'Guarantor Documents Unavailable',
        description: 'Please check "Add Guarantor" to upload documents.',
        variant: 'warning',
      });
      return;
    }
    setCurrentStep(step);
  };

  const onSubmit = async (data: ApplicationFormData) => {
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Form data received:", data);
    console.log("Form data applicantDob:", data.applicantDob);
    console.log("Form data moveInDate:", data.moveInDate);
    console.log("Form data applicantName:", data.applicantName);
    console.log("Form validation errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    console.log("Form is dirty:", form.formState.isDirty);
    console.log("=== END DEBUG ===");
    
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
      if (
        data[field] === undefined ||
        data[field] === null ||
        (typeof data[field] === 'string' && data[field].trim() === '') ||
        (field === 'monthlyRent' && (!data[field] || isNaN(data[field] as any) || (data[field] as any) <= 0)) ||
        (field === 'applicantDob' && !data[field]) ||
        (field === 'moveInDate' && !data[field])
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

      // Helper function to safely convert date to ISO string
      const safeDateToISO = (dateValue: any): string | null => {
        if (!dateValue) return null;
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) {
            console.warn('Invalid date value:', dateValue);
            return null;
          }
          return date.toISOString();
        } catch (error) {
          console.warn('Error converting date to ISO:', dateValue, error);
          return null;
        }
      };

      // Transform form data to match database schema
      const transformedData: any = {
        // Application Info
        buildingAddress: data.buildingAddress,
        apartmentNumber: data.apartmentNumber,
        moveInDate: safeDateToISO(data.moveInDate || formData.application?.moveInDate),
        monthlyRent: data.monthlyRent,
        apartmentType: data.apartmentType,
        howDidYouHear: data.howDidYouHear,
        
        // Primary Applicant
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
        applicantLengthAtAddressYears: data.applicantLengthAtAddressYears,
        applicantLengthAtAddressMonths: data.applicantLengthAtAddressMonths,
        applicantLandlordName: data.applicantLandlordName,
        applicantCurrentRent: formData.applicant?.currentRent || data.applicantCurrentRent,
        applicantReasonForMoving: data.applicantReasonForMoving,
        applicantGender: data.applicantGender,
        
        // Primary Applicant Financial (from formData)
        applicantEmployer: formData.applicant?.employer || null,
        applicantPosition: formData.applicant?.position || null,
        applicantEmploymentStart: safeDateToISO(formData.applicant?.employmentStart),
        applicantIncome: formData.applicant?.income ? parseFloat(formData.applicant.income) : null,
        applicantOtherIncome: formData.applicant?.otherIncome ? parseFloat(formData.applicant.otherIncome) : null,
        applicantOtherIncomeSource: formData.applicant?.otherIncomeSource || null,
        applicantBankRecords: formData.applicant?.bankRecords || [],
        
        // Co-Applicant
        hasCoApplicant: hasCoApplicant,
        coApplicantName: formData.coApplicant?.name || null,
        coApplicantRelationship: formData.coApplicant?.relationship || null,
        coApplicantDob: safeDateToISO(formData.coApplicant?.dob),
        coApplicantSsn: formData.coApplicant?.ssn || null,
        coApplicantPhone: formatPhoneForPayload(formData.coApplicant?.phone),
        coApplicantEmail: formData.coApplicant?.email || null,
        coApplicantSameAddress: sameAddressCoApplicant,
        coApplicantAddress: formData.coApplicant?.address || null,
        coApplicantCity: formData.coApplicant?.city || null,
        coApplicantState: formData.coApplicant?.state || null,
        coApplicantZip: formData.coApplicant?.zip || null,
        coApplicantLengthAtAddressYears: formData.coApplicant?.lengthAtAddressYears ?? null,
        coApplicantLengthAtAddressMonths: formData.coApplicant?.lengthAtAddressMonths ?? null,
        
        // Co-Applicant Financial
        coApplicantEmployer: formData.coApplicant?.employer || null,
        coApplicantPosition: formData.coApplicant?.position || null,
        coApplicantEmploymentStart: safeDateToISO(formData.coApplicant?.employmentStart),
        coApplicantIncome: formData.coApplicant?.income ? parseFloat(formData.coApplicant.income) : null,
        coApplicantOtherIncome: formData.coApplicant?.otherIncome ? parseFloat(formData.coApplicant.otherIncome) : null,
        coApplicantOtherIncomeSource: formData.coApplicant?.otherIncomeSource || null,
        coApplicantBankRecords: formData.coApplicant?.bankRecords || [],
        
        // Guarantor - only include if hasGuarantor is true
        hasGuarantor: hasGuarantor,
      };

      // Only add guarantor fields if hasGuarantor is true
      console.log('hasGuarantor value:', hasGuarantor);
      if (hasGuarantor) {
        console.log('Adding guarantor fields...');
        transformedData.guarantorName = formData.guarantor?.name || null;
        transformedData.guarantorRelationship = formData.guarantor?.relationship || null;
        transformedData.guarantorDob = safeDateToISO(formData.guarantor?.dob);
        transformedData.guarantorSsn = formData.guarantor?.ssn || null;
        transformedData.guarantorPhone = formatPhoneForPayload(formData.guarantor?.phone);
        transformedData.guarantorEmail = formData.guarantor?.email || null;
        transformedData.guarantorAddress = formData.guarantor?.address || null;
        transformedData.guarantorCity = formData.guarantor?.city || null;
        transformedData.guarantorState = formData.guarantor?.state || null;
        transformedData.guarantorZip = formData.guarantor?.zip || null;
        transformedData.guarantorLengthAtAddressYears = formData.guarantor?.lengthAtAddressYears ?? null;
        transformedData.guarantorLengthAtAddressMonths = formData.guarantor?.lengthAtAddressMonths ?? null;
        
        // Guarantor Financial
        transformedData.guarantorEmployer = formData.guarantor?.employer || null;
        transformedData.guarantorPosition = formData.guarantor?.position || null;
        transformedData.guarantorEmploymentStart = safeDateToISO(formData.guarantor?.employmentStart);
        transformedData.guarantorIncome = formData.guarantor?.income ? parseFloat(formData.guarantor.income) : null;
        transformedData.guarantorOtherIncome = formData.guarantor?.otherIncome ? parseFloat(formData.guarantor.otherIncome) : null;
        transformedData.guarantorOtherIncomeSource = formData.guarantor?.otherIncomeSource || null;
        transformedData.guarantorBankRecords = formData.guarantor?.bankRecords || [];
        transformedData.guarantorSignature = signatures.guarantor || null;
        transformedData.guarantorSignatureDate = signatureTimestamps.guarantor || null;
      } else {
        console.log('Skipping guarantor fields - hasGuarantor is false');
      }

      // Add signatures for applicant and co-applicant
      transformedData.applicantSignature = signatures.applicant || null;
      transformedData.applicantSignatureDate = signatureTimestamps.applicant || null;
      transformedData.coApplicantSignature = signatures.coApplicant || null;
      transformedData.coApplicantSignatureDate = signatureTimestamps.coApplicant || null;
      
      // Other Occupants - send as a list
      transformedData.otherOccupants = formData.occupants || [];
      
      // Legal Questions
      transformedData.landlordTenantLegalAction = data.landlordTenantLegalAction;
      transformedData.brokenLease = data.brokenLease;
      
      // Note: Documents and encrypted data are now sent via webhooks, not included in server submission
      console.log('Documents and encrypted data will be sent via webhooks');
      
      console.log('Transformed application data:', JSON.stringify(transformedData, null, 2));
      console.log('SSN Debug:');
      console.log('  - formData.applicant.ssn:', formData.applicant?.ssn);
      console.log('  - data.applicantSsn:', data.applicantSsn);
      console.log('  - transformedData.applicantSsn:', transformedData.applicantSsn);
      console.log('Date fields debug:');
      console.log('  - applicantDob (raw):', data.applicantDob);
      console.log('  - applicantDob (raw type):', typeof data.applicantDob);
      console.log('  - applicantDob (raw instanceof Date):', data.applicantDob instanceof Date);
      console.log('  - applicantDob (transformed):', transformedData.applicantDob);
      console.log('  - moveInDate (raw):', data.moveInDate);
      console.log('  - moveInDate (raw type):', typeof data.moveInDate);
      console.log('  - moveInDate (raw instanceof Date):', data.moveInDate instanceof Date);
      console.log('  - moveInDate (transformed):', transformedData.moveInDate);
      console.log('Current window location:', window.location.href);
      
      // Use the regular API endpoint for local development
      const apiEndpoint = '/api';
      console.log('Making request to:', window.location.origin + apiEndpoint + '/submit-application');
      
      const requestBody = {
        applicationData: transformedData,
        uploadedFilesMetadata: uploadedFilesMetadata
      };
      
      console.log('Request body being sent:', JSON.stringify(requestBody, null, 2));
      console.log('Request body uploadedFilesMetadata:', requestBody.uploadedFilesMetadata);
      
      // Validate required fields before submission
      if (!transformedData.applicantDob) {
        throw new Error('Date of birth is required. Please select your date of birth.');
      }
      if (!transformedData.moveInDate) {
        throw new Error('Move-in date is required. Please select your move-in date.');
      }
      if (!transformedData.applicantName || transformedData.applicantName.trim() === '') {
        throw new Error('Full name is required. Please enter your full name.');
      }
      
      // Create AbortController for submission timeout
      const submissionController = new AbortController();
      const submissionTimeoutId = setTimeout(() => submissionController.abort(), 45000); // 45 second timeout
      
      const submissionResponse = await fetch(apiEndpoint + '/submit-application', {
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
        } else {
          throw new Error(`Submission failed: ${submissionResponse.status} ${submissionResponse.statusText}`);
        }
      }

      const submissionResult = await submissionResponse.json();
      console.log('Application submitted successfully:', submissionResult);

      // Note: Encrypted data and files are now sent separately via webhooks
      console.log('Application submitted successfully. Files and encrypted data sent via webhooks.');

      // On form submit, send only form data, application_id, and uploadedDocuments to the webhook
      try {
        const webhookPayload = {
          ...transformedData, // all form fields
          application_id: applicationId,
          uploaded_documents: uploadedDocuments.map(doc => ({
            reference_id: doc.reference_id,
            file_name: doc.file_name,
            section_name: doc.section_name,
            documents: doc.documents // <-- Now included
          }))
        };

        console.log('=== WEBHOOK PAYLOAD DEBUG ===');
        console.log('Applicant SSN in webhook:', webhookPayload.applicantSsn);
        console.log('Other Occupants:', transformedData.otherOccupants);
        console.log('Bank Records - Applicant:', transformedData.applicantBankRecords);
        console.log('Bank Records - Co-Applicant:', transformedData.coApplicantBankRecords);
        console.log('Bank Records - Guarantor:', transformedData.guarantorBankRecords);
        console.log('Uploaded Documents Count:', uploadedDocuments.length);
        console.log('=== END WEBHOOK PAYLOAD DEBUG ===');

        console.log('Form submission webhook payload:', JSON.stringify(webhookPayload, null, 2));
        console.log('Uploaded documents array:', JSON.stringify(uploadedDocuments, null, 2));
        const webhookResult = await WebhookService.sendFormDataToWebhook(
          webhookPayload,
          referenceId,
          applicationId,
          uploadedFilesMetadata
        );
        
        if (webhookResult.success) {
          toast({
            title: "Application Submitted & Sent",
            description: "Your rental application has been submitted and sent to the webhook successfully.",
          });
          } else {
          toast({
            title: "Application Submitted",
            description: "Your rental application has been submitted, but webhook delivery failed.",
          });
        }
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      toast({
        title: "Application Submitted",
          description: "Your rental application has been submitted, but webhook delivery failed.",
      });
      }

      generatePDF();
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
  };

  const copyAddressToCoApplicant = () => {
    if (sameAddressCoApplicant) {
      const applicantAddress = formData.applicant;
      updateFormData('coApplicant', 'address', applicantAddress.address);
      updateFormData('coApplicant', 'city', applicantAddress.city);
      updateFormData('coApplicant', 'state', applicantAddress.state);
      updateFormData('coApplicant', 'zip', applicantAddress.zip);
      updateFormData('coApplicant', 'landlordName', applicantAddress.landlordName);
      updateFormData('coApplicant', 'currentRent', applicantAddress.currentRent);
      updateFormData('coApplicant', 'lengthAtAddress', applicantAddress.lengthAtAddress);
    }
  };

  // Effect to copy address when checkbox is checked
  useEffect(() => {
    if (sameAddressCoApplicant && hasCoApplicant) {
      copyAddressToCoApplicant();
    }
  }, [sameAddressCoApplicant, hasCoApplicant, formData.applicant]);

  // Debug effect for Date of Birth
  useEffect(() => {
    console.log('Form applicantDob value:', form.watch('applicantDob'));
    console.log('FormData applicant dob:', formData.applicant?.dob);
    console.log('Form errors:', form.formState.errors);
  }, [form.watch('applicantDob'), formData.applicant?.dob, form.formState.errors]);

  // Sync formData.applicant.dob with form.applicantDob
  useEffect(() => {
    const formValue = form.watch('applicantDob');
    const stateValue = formData.applicant?.dob;
    let dateObj = stateValue;
    if (stateValue && !(stateValue instanceof Date)) {
      dateObj = new Date(stateValue);
    }
    if (dateObj && dateObj instanceof Date && !isNaN(dateObj.getTime())) {
      if (!formValue || !(formValue instanceof Date) || formValue.getTime() !== dateObj.getTime()) {
        form.setValue('applicantDob', dateObj);
      }
    }
  }, [formData.applicant?.dob, form]);

  const copyAddressToGuarantor = () => {
    if (sameAddressGuarantor) {
      const applicantAddress = formData.applicant;
      updateFormData('guarantor', 'address', applicantAddress.address);
      updateFormData('guarantor', 'city', applicantAddress.city);
      updateFormData('guarantor', 'state', applicantAddress.state);
      updateFormData('guarantor', 'zip', applicantAddress.zip);
      updateFormData('guarantor', 'landlordName', applicantAddress.landlordName);
      updateFormData('guarantor', 'currentRent', applicantAddress.currentRent);
      updateFormData('guarantor', 'lengthAtAddress', applicantAddress.lengthAtAddress);
    }
  };

  // Ensure applicantDob in formData and react-hook-form stay in sync for DatePicker display
  useEffect(() => {
    const formValue = form.watch('applicantDob');
    const stateValue = formData.applicant?.dob;
    if (stateValue && (!formValue || (formValue instanceof Date && stateValue instanceof Date && formValue.getTime() !== stateValue.getTime()))) {
      // Only set if different and stateValue is a valid Date
      if (stateValue instanceof Date && !isNaN(stateValue.getTime())) {
        form.setValue('applicantDob', stateValue);
      } else if (typeof stateValue === 'string' || typeof stateValue === 'number') {
        const parsed = new Date(stateValue);
        if (!isNaN(parsed.getTime())) {
          form.setValue('applicantDob', parsed);
        }
      }
    }
  }, [formData.applicant?.dob, form]);

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
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleBuildingSelect(value);
                          }}
                          disabled={isLoadingUnits}
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
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleApartmentSelect(value);
                          }}
                          disabled={!selectedBuilding || availableApartments.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={!selectedBuilding ? "Select building first" : availableApartments.length === 0 ? "No apartments available" : "Select apartment"} />
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
                            console.log('DatePicker onChange - moveInDate:', date);
                            console.log('DatePicker onChange - moveInDate type:', typeof date);
                            console.log('DatePicker onChange - moveInDate instanceof Date:', date instanceof Date);
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
                          value={formData.application?.monthlyRent?.toString() || ''}
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
                          value={selectedUnit?.unitType || field.value}
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
                        <FormLabel className="mb-0.5">Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter full name" 
                            {...field}
                            className="input-field w-full mt-1"
                            onChange={(e) => {
                              field.onChange(e);
                              updateFormData('applicant', 'name', e.target.value);
                            }}
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
                              updateFormData('applicant', 'dob', date);
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
                  name="applicantGender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-0.5">Gender</FormLabel>
                      <FormControl>
                        <Select
                          value={formData.applicant?.gender || ''}
                          onValueChange={(value) => {
                            field.onChange(value);
                            updateFormData('applicant', 'gender', value);
                          }}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                    Social Security Number
                  </label>
                  <input
                    type="text"
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                    placeholder="XXX-XX-XXXX"
                    value={formData.applicant?.ssn || ''}
                    onChange={e => {
                      updateFormData('applicant', 'ssn', e.target.value);
                      form.setValue('applicantSsn', e.target.value);
                    }}
                  />
                  {form.formState.errors.applicantSsn?.message && (
                    <span className="text-red-500 text-xs">{form.formState.errors.applicantSsn.message}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                    placeholder="(555) 555-5555"
                    value={formData.applicant?.phone || ''}
                    onChange={e => {
                      updateFormData('applicant', 'phone', e.target.value);
                      form.setValue('applicantPhone', e.target.value);
                    }}
                  />
                  {form.formState.errors.applicantPhone?.message && (
                    <span className="text-red-500 text-xs">{form.formState.errors.applicantPhone.message}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                    placeholder="you@email.com"
                    value={formData.applicant?.email || ''}
                    onChange={e => {
                      updateFormData('applicant', 'email', e.target.value);
                      form.setValue('applicantEmail', e.target.value);
                    }}
                    required
                  />
                  {form.formState.errors.applicantEmail?.message && (
                    <span className="text-red-500 text-xs">{form.formState.errors.applicantEmail.message}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                    Driver's License Number
                  </label>
                  <input
                    type="text"
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                    placeholder="Enter license number"
                    value={formData.applicant?.license || ''}
                    onChange={e => {
                      updateFormData('applicant', 'license', e.target.value);
                      form.setValue('applicantLicense', e.target.value);
                    }}
                  />
                  {form.formState.errors.applicantLicense?.message && (
                    <span className="text-red-500 text-xs">{form.formState.errors.applicantLicense.message}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                    License State
                  </label>
                  <input
                    type="text"
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                    placeholder="State"
                    value={formData.applicant?.licenseState || ''}
                    onChange={e => {
                      updateFormData('applicant', 'licenseState', e.target.value);
                      form.setValue('applicantLicenseState', e.target.value);
                    }}
                  />
                  {form.formState.errors.applicantLicenseState?.message && (
                    <span className="text-red-500 text-xs">{form.formState.errors.applicantLicenseState.message}</span>
                  )}
                </div>
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
                      <div className="space-y-2">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                    ZIP Code*
                  </label>
                  <input
                    type="text"
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                    placeholder="ZIP code"
                    value={formData.applicant?.zip || ''}
                    onChange={e => {
                      updateFormData('applicant', 'zip', e.target.value);
                      form.setValue('applicantZip', e.target.value);
                    }}
                  />
                  {form.formState.errors.applicantZip?.message && (
                    <span className="text-red-500 text-xs">{form.formState.errors.applicantZip.message}</span>
                  )}
                </div>
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
                      <FormLabel className="mb-0.5">Current Landlord's Name</FormLabel>
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
          <FinancialSection 
            title="Primary Applicant Financial Information"
            person="applicant"
            formData={formData}
            updateFormData={updateFormData}
          />
        );

      case 4:
        // Only show Supporting Documents if applicant employmentType is selected
        if (!formData.applicant?.employmentType) {
          return (
            <Card className="form-section">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Supporting Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-500 text-sm">Please select Employment Type in the Financial Information section to upload supporting documents.</div>
              </CardContent>
            </Card>
          );
        }
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
                formData={formData}
                onDocumentChange={(documentType, files) => {
                  setDocuments((prev: any) => ({
                    ...prev,
                    [documentType]: files,
                  }));
                }}
                onEncryptedDocumentChange={(documentType, encryptedFiles) => {
                  console.log('Encrypted document change:', documentType, encryptedFiles);
                  setEncryptedDocuments((prev: any) => ({
                    ...prev,
                    [documentType]: encryptedFiles,
                  }));

                  // Track uploadedDocuments for webhook
                  const sectionKey = `supporting_${documentType}`;
                  const docs = encryptedFiles.map(file => ({
                    reference_id: file.uploadDate + '-' + file.filename,
                    file_name: file.filename,
                    section_name: sectionKey,
                    documents: documentType // <-- Now included
                  }));
                  setUploadedDocuments(prev => {
                    const filtered = prev.filter(doc => doc.section_name !== sectionKey);
                    return [...filtered, ...docs];
                  });

                  // Track uploaded files metadata for webhook
                  const filesMetadata = encryptedFiles.map(file => ({
                    file_name: file.filename,
                    file_size: file.originalSize,
                    mime_type: file.mimeType,
                    upload_date: file.uploadDate
                  }));

                  setUploadedFilesMetadata(prev => ({
                    ...prev,
                    [sectionKey]: filesMetadata
                  }));
                }}
                referenceId={referenceId}
                enableWebhook={true}
                applicationId={applicationId}
              />
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <div className="space-y-8">
            <Card className="form-section">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Co-Applicant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="hasCoApplicant"
                    checked={hasCoApplicant}
                    onCheckedChange={(checked) => {
                      setHasCoApplicant(checked as boolean);
                      form.setValue('hasCoApplicant', checked as boolean);
                    }}
                  />
                  <Label htmlFor="hasCoApplicant" className="text-base font-medium">
                    Add Co-Applicant
                  </Label>
                </div>
              </CardContent>
            </Card>

            {hasCoApplicant && (
              <Card className="form-section border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                    <UserCheck className="w-5 h-5 mr-2" />
                    Co-Applicant Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="col-span-1 md:col-span-2">
                      <Label className="mb-0.5">Full Name *</Label>
                      <Input 
                        placeholder="Enter full name"
                        className="input-field w-full mt-1"
                        value={formData.coApplicant?.name || ''}
                        onChange={(e) => updateFormData('coApplicant', 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="mb-0.5">Date of Birth *</Label>
                      {(() => {
                        const dateVal = toValidDate(formData.coApplicant?.dob);
                        const safeDate = (dateVal instanceof Date && !isNaN(dateVal.getTime())) ? dateVal : undefined;
                        return (
                          <>
                            <DatePicker
                              value={safeDate as Date | undefined}
                              onChange={(date) => {
                                updateFormData('coApplicant', 'dob', date);
                                if (date) {
                                  const today = new Date();
                                  const birthDate = new Date(date);
                                  let age = today.getFullYear() - birthDate.getFullYear();
                                  const monthDiff = today.getMonth() - birthDate.getMonth();
                                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                    age--;
                                  }
                                  updateFormData('coApplicant', 'age', age);
                                } else {
                                  updateFormData('coApplicant', 'age', '');
                                }
                              }}
                              placeholder="Select date of birth"
                              disabled={(date) => date > new Date()}
                              className="w-full mt-1"
                            />
                          </>
                        );
                      })()}
                    </div>
                    <div>
                      <Label className="mb-0.5">Gender</Label>
                      <Select
                        value={formData.coApplicant?.gender || ''}
                        onValueChange={(value) => updateFormData('coApplicant', 'gender', value)}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                        Social Security Number
                      </label>
                      <input
                        type="text"
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                        placeholder="XXX-XX-XXXX"
                        value={formData.coApplicant?.ssn || ''}
                        onChange={e => updateFormData('coApplicant', 'ssn', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                        placeholder="(555) 555-5555"
                        value={formData.coApplicant?.phone || ''}
                        onChange={e => updateFormData('coApplicant', 'phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                        placeholder="you@email.com"
                        value={formData.coApplicant?.email || ''}
                        onChange={e => updateFormData('coApplicant', 'email', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                        Driver's License Number
                      </label>
                      <input
                        type="text"
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                        placeholder="Enter license number"
                        value={formData.coApplicant?.license || ''}
                        onChange={e => updateFormData('coApplicant', 'license', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                        License State
                      </label>
                      <input
                        type="text"
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                        placeholder="State"
                        value={formData.coApplicant?.licenseState || ''}
                        onChange={e => updateFormData('coApplicant', 'licenseState', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                        Street Address
                      </label>
                      <input
                        type="text"
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                        placeholder="Enter street address"
                        value={formData.coApplicant?.address || ''}
                        onChange={e => updateFormData('coApplicant', 'address', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                        State*
                      </label>
                      <input
                        type="text"
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                        placeholder="State"
                        value={formData.coApplicant?.state || ''}
                        onChange={e => updateFormData('coApplicant', 'state', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                        City*
                      </label>
                      <input
                        type="text"
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                        placeholder="City"
                        value={formData.coApplicant?.city || ''}
                        onChange={e => updateFormData('coApplicant', 'city', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                        ZIP Code*
                      </label>
                      <input
                        type="text"
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                        placeholder="ZIP code"
                        value={formData.coApplicant?.zip || ''}
                        onChange={e => updateFormData('coApplicant', 'zip', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-x-6 gap-y-4">
                      <FormLabel className="mb-0.5 col-span-2">Length of Stay at Current Address</FormLabel>
                      <Input
                        type="number"
                        min={0}
                        value={formData.coApplicant?.lengthAtAddressYears ?? ''}
                        onChange={e => updateFormData('coApplicant', 'lengthAtAddressYears', e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder="e.g. 2 years"
                        className="w-full mt-1"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={11}
                        value={formData.coApplicant?.lengthAtAddressMonths ?? ''}
                        onChange={e => updateFormData('coApplicant', 'lengthAtAddressMonths', e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder="e.g. 4 months"
                        className="w-full mt-1"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <FormLabel className="mb-0.5">Current Landlord's Name</FormLabel>
                      <Input
                        placeholder="Enter landlord's name"
                        value={formData.coApplicant?.landlordName || ''}
                        onChange={e => updateFormData('coApplicant', 'landlordName', e.target.value)}
                        className="input-field w-full mt-1 border-gray-300 bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="coApplicantCurrentRent" className="mb-0.5">Monthly Rent</Label>
                      <Input
                        id="coApplicantCurrentRent"
                        type="number"
                        placeholder="0.00"
                        value={formData.coApplicant?.currentRent?.toString() || ''}
                        onChange={e => {
                          const numValue = parseFloat(e.target.value) || 0;
                          updateFormData('coApplicant', 'currentRent', numValue);
                        }}
                        className="input-field w-full mt-1"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <FormLabel className="mb-0.5">Why Are You Moving</FormLabel>
                      <Textarea
                        placeholder="Please explain your reason for moving"
                        value={formData.coApplicant?.reasonForMoving || ''}
                        onChange={e => updateFormData('coApplicant', 'reasonForMoving', e.target.value)}
                        className="input-field w-full mt-1 border-gray-300 bg-white min-h-[80px]"
                      />
                    </div>
                  </div>
                  <FinancialSection 
                    title="Co-Applicant Financial Information"
                    person="coApplicant"
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 6:
        // Wrapper functions for SupportingDocuments to match expected signature
        const coApplicantDocumentChange = (documentType: string, files: File[]) => handleDocumentChange('coApplicant', documentType, files);
        const coApplicantEncryptedDocumentChange = (documentType: string, encryptedFiles: EncryptedFile[]) => handleEncryptedDocumentChange('coApplicant', documentType, encryptedFiles);
        return (
          hasCoApplicant ? (
            <Card className="form-section border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Co-Applicant Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SupportingDocuments
                  formData={formData}
                  onDocumentChange={coApplicantDocumentChange}
                  onEncryptedDocumentChange={coApplicantEncryptedDocumentChange}
                  referenceId={referenceId}
                  enableWebhook={true}
                  applicationId={applicationId}
                  showOnlyCoApplicant={true}
                />
              </CardContent>
            </Card>
          ) : null
        );

      case 7:
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
                      <Label>Gender</Label>
                      <Select
                        value={occupant.gender || ''}
                        onValueChange={value => {
                          const updated = [...formData.occupants];
                          updated[idx] = { ...updated[idx], gender: value };
                          setFormData((prev: any) => ({ ...prev, occupants: updated }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
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
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
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
                      label="Social Security Card (Required)"
                      description="Upload SSN card (.pdf, .jpg, .jpeg, .png, max 10MB)"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple={false}
                      maxFiles={1}
                      maxSize={10}
                      enableEncryption={true}
                      onFileChange={files => {
                        const updated = [...formData.occupants];
                        updated[idx] = { ...updated[idx], ssnDocument: files[0] };
                        setFormData((prev: any) => ({ ...prev, occupants: updated }));
                      }}
                      onEncryptedFilesChange={encryptedFiles => {
                        const updated = [...formData.occupants];
                        updated[idx] = { ...updated[idx], ssnEncryptedDocument: encryptedFiles[0] };
                        setFormData((prev: any) => ({ ...prev, occupants: updated }));
                      }}
                      referenceId={referenceId}
                      sectionName={`occupant_${idx}_ssn`}
                      documentName="ssn"
                      enableWebhook={true}
                      applicationId={applicationId}
                    />
                    {(!occupant.ssnEncryptedDocument) && (
                      <div className="text-red-600 text-xs mt-1">SSN document upload is required.</div>
                    )}
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
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData((prev: any) => ({
                    ...prev,
                    occupants: [...(prev.occupants || []), { name: '', relationship: '', dob: '', ssn: '', license: '', age: '', gender: '', ssnDocument: null, ssnEncryptedDocument: null }]
                  }));
                }}
              >
                Add Another Occupant
              </Button>
            </CardContent>
          </Card>
        );

      case 8:
        return (
          <div className="space-y-6">
            {/* Guarantor Section with Checkbox */}
              <Card className="form-section border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-700 dark:text-purple-400">
                    <UserCheck className="w-5 h-5 mr-2" />
                  Guarantor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Checkbox 
                    id="hasGuarantor"
                    checked={hasGuarantor}
                    onCheckedChange={(checked) => {
                      setHasGuarantor(checked as boolean);
                      form.setValue('hasGuarantor', checked as boolean);
                    }}
                  />
                  <Label htmlFor="hasGuarantor" className="text-base font-medium">
                    Add Guarantor
                  </Label>
                </div>
                {hasGuarantor && (
                  <>
                    {/* Guarantor Information Section - aligned like Primary/Co-Applicant */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="col-span-1 md:col-span-2">
                        <Label className="mb-0.5">Full Name *</Label>
                        <Input 
                          placeholder="Enter full name"
                          className="input-field w-full mt-1"
                          value={formData.guarantor?.name || ''}
                          onChange={(e) => updateFormData('guarantor', 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="mb-0.5">Date of Birth *</Label>
                        {(() => {
                          const dateVal = toValidDate(formData.guarantor?.dob);
                          const safeDate = (dateVal instanceof Date && !isNaN(dateVal.getTime())) ? dateVal : undefined;
                          return (
                            <DatePicker
                              value={safeDate as Date | undefined}
                              onChange={(date) => {
                                updateFormData('guarantor', 'dob', date);
                                if (date) {
                                  const today = new Date();
                                  const birthDate = new Date(date);
                                  let age = today.getFullYear() - birthDate.getFullYear();
                                  const monthDiff = today.getMonth() - birthDate.getMonth();
                                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                    age--;
                                  }
                                  updateFormData('guarantor', 'age', age);
                                } else {
                                  updateFormData('guarantor', 'age', '');
                                }
                              }}
                              placeholder="Select date of birth"
                              disabled={(date) => date > new Date()}
                              className="w-full mt-1"
                            />
                          );
                        })()}
                      </div>
                      <div>
                        <Label className="mb-0.5">Gender</Label>
                        <Select
                          value={formData.guarantor?.gender || ''}
                          onValueChange={(value) => updateFormData('guarantor', 'gender', value)}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                          Social Security Number
                        </label>
                        <input
                          type="text"
                          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                          placeholder="XXX-XX-XXXX"
                          value={formData.guarantor?.ssn || ''}
                          onChange={e => updateFormData('guarantor', 'ssn', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                          placeholder="(555) 555-5555"
                          value={formData.guarantor?.phone || ''}
                          onChange={e => updateFormData('guarantor', 'phone', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                          Email Address
                        </label>
                        <input
                          type="email"
                          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                          placeholder="you@email.com"
                          value={formData.guarantor?.email || ''}
                          onChange={e => updateFormData('guarantor', 'email', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                          Driver's License Number
                        </label>
                        <input
                          type="text"
                          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                          placeholder="Enter license number"
                          value={formData.guarantor?.license || ''}
                          onChange={e => updateFormData('guarantor', 'license', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                          License State
                        </label>
                        <input
                          type="text"
                          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                          placeholder="State"
                          value={formData.guarantor?.licenseState || ''}
                          onChange={e => updateFormData('guarantor', 'licenseState', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                          Street Address
                        </label>
                        <input
                          type="text"
                          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                          placeholder="Enter street address"
                          value={formData.guarantor?.address || ''}
                          onChange={e => updateFormData('guarantor', 'address', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                          State*
                        </label>
                        <input
                          type="text"
                          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                          placeholder="State"
                          value={formData.guarantor?.state || ''}
                          onChange={e => updateFormData('guarantor', 'state', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                          City*
                        </label>
                        <input
                          type="text"
                          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                          placeholder="City"
                          value={formData.guarantor?.city || ''}
                          onChange={e => updateFormData('guarantor', 'city', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium">
                          ZIP Code*
                        </label>
                        <input
                          type="text"
                          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full mt-1"
                          placeholder="ZIP code"
                          value={formData.guarantor?.zip || ''}
                          onChange={e => updateFormData('guarantor', 'zip', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-x-6 gap-y-4">
                        <FormLabel className="mb-0.5 col-span-2">Length of Stay at Current Address</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          value={formData.guarantor?.lengthAtAddressYears ?? ''}
                          onChange={e => updateFormData('guarantor', 'lengthAtAddressYears', e.target.value === '' ? undefined : Number(e.target.value))}
                          placeholder="e.g. 2 years"
                          className="w-full mt-1"
                        />
                        <Input
                          type="number"
                          min={0}
                          max={11}
                          value={formData.guarantor?.lengthAtAddressMonths ?? ''}
                          onChange={e => updateFormData('guarantor', 'lengthAtAddressMonths', e.target.value === '' ? undefined : Number(e.target.value))}
                          placeholder="e.g. 4 months"
                          className="w-full mt-1"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <FormLabel className="mb-0.5">Current Landlord's Name</FormLabel>
                        <Input
                          placeholder="Enter landlord's name"
                          value={formData.guarantor?.landlordName || ''}
                          onChange={e => updateFormData('guarantor', 'landlordName', e.target.value)}
                          className="input-field w-full mt-1 border-gray-300 bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guarantorCurrentRent" className="mb-0.5">Monthly Rent</Label>
                        <Input
                          id="guarantorCurrentRent"
                          type="number"
                          placeholder="0.00"
                          value={formData.guarantor?.currentRent?.toString() || ''}
                          onChange={e => {
                            const numValue = parseFloat(e.target.value) || 0;
                            updateFormData('guarantor', 'currentRent', numValue);
                          }}
                          className="input-field w-full mt-1"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <FormLabel className="mb-0.5">Why Are You Moving</FormLabel>
                        <Textarea
                          placeholder="Please explain your reason for moving"
                          value={formData.guarantor?.reasonForMoving || ''}
                          onChange={e => updateFormData('guarantor', 'reasonForMoving', e.target.value)}
                          className="input-field w-full mt-1 border-gray-300 bg-white min-h-[80px]"
                        />
                      </div>
                    </div>
                    <FinancialSection 
                      title="Guarantor Financial Information"
                      person="guarantor"
                      formData={formData}
                      updateFormData={updateFormData}
                    />
                  </>
                )}
                </CardContent>
              </Card>
                  </div>
        );

      case 9:
        // Only show Guarantor Supporting Documents if employmentType is selected
        if (!formData.guarantor?.employmentType) {
          return (
            <Card className="form-section">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Guarantor Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-500 text-sm">Please select Employment Type in the Guarantor Financial Information section to upload supporting documents.</div>
              </CardContent>
            </Card>
          );
        }
        return (
          <SupportingDocuments
            formData={formData}
            onDocumentChange={(documentType, files) => {
              setDocuments((prev: any) => ({
                ...prev,
                [documentType]: files,
              }));
            }}
            onEncryptedDocumentChange={(documentType, encryptedFiles) => {
              setEncryptedDocuments((prev: any) => ({
                ...prev,
                [documentType]: encryptedFiles,
              }));
            }}
            referenceId={referenceId}
            enableWebhook={true}
            applicationId={applicationId}
            showOnlyGuarantor={true}
          />
        );

      case 10:
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
                    The Landlord will in no event be bound, nor will possession be given, unless and until a lease executed by the Landlord has been delivered to the Tenant. The applicant and his/her references must be satisfactory to the Landlord. Please be advised that the date on page one of the lease is not your move-in date. Your move-in date will be arranged with you after you have been approved. No representations or agreements by agents, brokers or others are binding on the Landlord or Agent unless included in the written lease proposed to be executed. I hereby warrant that all my representations set forth herein are true. I recognize the truth of the information contained herein is essential. I further represent that I am not renting a room or an apartment under any other name, nor have I ever been dispossessed from any apartment, nor am I now being dispossessed. I represent that I am over 18 years of age. I have been advised that I have the right, under section 8068 of the Fair Credit Reporting Act, to make a written request, directed to the appropriate credit reporting agency, within reasonable time, for a complete and accurate disclosure of the nature and scope of any credit investigation. I understand that upon submission, this application and all related documents become the property of the Landlord, and will not be returned to me under any circumstances. I authorize the Landlord, Agent and credit reporting agency to obtain a consumer credit report on me and to verify any information on this application with regard to my employment history, current and prior tenancies, bank accounts, and all other information that the Landlord deems pertinent to my obtaining residency. I understand that I shall not be permitted to receive or review my application file or my credit consumer report. I authorize banks, financial institutions, landlords, business associates, credit bureaus, attorneys, accountants and other persons or institutions with whom I am acquainted to furnish any and all information regarding myself. This authorization also applies to any update reports which may be ordered as needed. A photocopy or fax of this authorization shall be accepted with the same authority as this original. I will present any other information required by the Landlord or Agent in connection with the lease contemplated herein. I understand that the application fee is non-refundable. The Civil Rights Act of 1968, as amended by the Fair Housing Amendments Act of 1988, prohibits discrimination in the rental of housing based on race, color, religion, gender, handicap, familial status or national origin. The Federal Agency, which administers compliance with this law, is the U.S. Department of Housing and Urban Development.
                  </p>
                </div>
                <div>
                  <Label className="text-base font-medium">Primary Applicant Signature *</Label>
                  <SignaturePad 
                    onSignatureChange={(signature) => handleSignatureChange('applicant', signature)}
                    className="mt-2"
                  />
                </div>

                {hasCoApplicant && (
                  <div>
                    <Label className="text-base font-medium">Co-Applicant Signature *</Label>
                    <SignaturePad 
                      onSignatureChange={(signature) => handleSignatureChange('coApplicant', signature)}
                      className="mt-2"
                    />
                  </div>
                )}

                {hasGuarantor && (
                  <div>
                    <Label className="text-base font-medium">Guarantor Signature *</Label>
                    <SignaturePad 
                      onSignatureChange={(signature) => handleSignatureChange('guarantor', signature)}
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper to robustly convert to Date or undefined
  function toValidDate(val: any): Date | undefined {
    if (!val) return undefined;
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    if (typeof val === 'string' || typeof val === 'number') {
      const d = new Date(val);
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    }
    return undefined;
  }

  // On mount, if loading draft from localStorage, always convert dob to Date
  useEffect(() => {
    const draft = localStorage.getItem('rentalApplicationDraft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed?.formData?.applicant?.dob) {
          parsed.formData.applicant.dob = toValidDate(parsed.formData.applicant.dob);
        }
        setFormData(parsed.formData || {});
        // ... set other state as needed
      } catch (e) {
        console.warn('Failed to parse draft:', e);
      }
    }
  }, []);

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
      // If invalid, clear
      form.setValue('applicantDob', undefined);
    }
  }, [formData.applicant?.dob, form]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:bg-gradient-to-br sm:from-blue-50 sm:to-gray-100 sm:dark:from-gray-900 sm:dark:to-gray-800">
      {/* Header - Hidden */}
      {/* <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Liberty Place Property Management</h1>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p className="break-words">122 East 42nd Street, Suite 1903, New York, NY 10168</p>
              <p className="break-words">Tel: (646) 545-6700 | Fax: (646) 304-2255</p>
              <p className="text-blue-600 dark:text-blue-400 font-medium">Rental Application Form</p>
            </div>
          </div>
        </div>
      </header> */}

      <div className="w-full max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-8">
        {/* Header with Navigation */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Rental Application
            </h1>
            
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-2 sm:mb-4 overflow-x-auto">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => goToStep(step.id)}
                    className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-colors flex-shrink-0 ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      step.icon ? React.createElement(step.icon, { className: "w-4 h-4 sm:w-5 sm:h-5" }) : step.title[0]
                    )}
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-1 sm:mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
          {/* Step title and progress indicator removed */}
        </div>



        {/* Action Buttons - Removed */}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-8">
            {/* Current Step Content */}
            <div className="form-container">
              {renderStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-4 sm:pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center text-xs sm:text-sm px-2 sm:px-4 py-2"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>

              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Step {currentStep + 1} of {STEPS.length}
              </div>

              {currentStep === STEPS.length - 1 ? (
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-semibold"
                  onClick={() => onSubmit(form.getValues())}
                >
                  <span className="hidden sm:inline">Submit Application</span>
                  <span className="sm:hidden">Submit</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 sm:px-6 py-2"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}