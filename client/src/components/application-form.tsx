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
  { id: 5, title: "Other Occupants", icon: Users },
  { id: 6, title: "Guarantor Documents", icon: Shield },
  { id: 7, title: "Digital Signatures", icon: Check },
];

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
      section_name: sectionKey
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

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const uploadEncryptedFiles = async (encryptedFiles: EncryptedFile[], personType: string) => {
    try {
      console.log(`Starting upload of ${encryptedFiles.length} files for ${personType}...`);
      
      // Create FormData
      const formData = new FormData();
      formData.append('personType', personType);
      formData.append('applicationId', Date.now().toString());
      
      // Add each file to FormData
      encryptedFiles.forEach((file, index) => {
        formData.append(`files[${index}][filename]`, file.filename);
        formData.append(`files[${index}][encryptedData]`, file.encryptedData);
        formData.append(`files[${index}][originalSize]`, file.originalSize.toString());
        formData.append(`files[${index}][mimeType]`, file.mimeType);
        formData.append(`files[${index}][uploadDate]`, file.uploadDate);
      });
      
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('/api/upload-files', {
        method: 'POST',
        body: formData, // Use FormData instead of JSON
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload response error:', response.status, response.statusText);
        console.error('Error response body:', errorText);
        
        // Handle specific error cases
        if (response.status === 413) {
          throw new Error('Files are too large. Please reduce file sizes and try again.');
        } else if (response.status === 504) {
          throw new Error('Upload timed out. Please try again with smaller files or fewer files at once.');
        } else {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log(`Files uploaded successfully for ${personType}:`, result);
      

      
      return result;
    } catch (error) {
      console.error(`Failed to upload files for ${personType}:`, error);
      
      // Handle timeout errors specifically
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Upload timed out. Please try again with smaller files or fewer files at once.');
      }
      
      throw error;
    }
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
        applicantPhone: formData.applicant?.phone && formData.applicant.phone.trim() !== '' ? formData.applicant.phone : null,
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
        applicantBankName: formData.applicant?.bankRecords?.[0]?.bankName || null,
        applicantAccountType: formData.applicant?.bankRecords?.[0]?.accountType || null,
        applicantBankRecords: formData.applicant?.bankRecords || [],
        
        // Co-Applicant
        hasCoApplicant: hasCoApplicant,
        coApplicantName: formData.coApplicant?.name || null,
        coApplicantRelationship: formData.coApplicant?.relationship || null,
        coApplicantDob: safeDateToISO(formData.coApplicant?.dob),
        coApplicantSsn: formData.coApplicant?.ssn || null,
        coApplicantPhone: formData.coApplicant?.phone || null,
        coApplicantEmail: formData.coApplicant?.email || null,
        coApplicantSameAddress: sameAddressCoApplicant,
        coApplicantAddress: formData.coApplicant?.address || null,
        coApplicantCity: formData.coApplicant?.city || null,
        coApplicantState: formData.coApplicant?.state || null,
        coApplicantZip: formData.coApplicant?.zip || null,
        coApplicantLengthAtAddress: formData.coApplicant?.lengthAtAddress || null,
        
        // Co-Applicant Financial
        coApplicantEmployer: formData.coApplicant?.employer || null,
        coApplicantPosition: formData.coApplicant?.position || null,
        coApplicantEmploymentStart: safeDateToISO(formData.coApplicant?.employmentStart),
        coApplicantIncome: formData.coApplicant?.income ? parseFloat(formData.coApplicant.income) : null,
        coApplicantOtherIncome: formData.coApplicant?.otherIncome ? parseFloat(formData.coApplicant.otherIncome) : null,
        coApplicantBankName: formData.coApplicant?.bankRecords?.[0]?.bankName || null,
        coApplicantAccountType: formData.coApplicant?.bankRecords?.[0]?.accountType || null,
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
        transformedData.guarantorPhone = formData.guarantor?.phone || null;
        transformedData.guarantorEmail = formData.guarantor?.email || null;
        transformedData.guarantorAddress = formData.guarantor?.address || null;
        transformedData.guarantorCity = formData.guarantor?.city || null;
        transformedData.guarantorState = formData.guarantor?.state || null;
        transformedData.guarantorZip = formData.guarantor?.zip || null;
        transformedData.guarantorLengthAtAddress = formData.guarantor?.lengthAtAddress || null;
        
        // Guarantor Financial
        transformedData.guarantorEmployer = formData.guarantor?.employer || null;
        transformedData.guarantorPosition = formData.guarantor?.position || null;
        transformedData.guarantorEmploymentStart = safeDateToISO(formData.guarantor?.employmentStart);
        transformedData.guarantorIncome = formData.guarantor?.income ? parseFloat(formData.guarantor.income) : null;
        transformedData.guarantorOtherIncome = formData.guarantor?.otherIncome ? parseFloat(formData.guarantor.otherIncome) : null;
        transformedData.guarantorBankName = formData.guarantor?.bankRecords?.[0]?.bankName || null;
        transformedData.guarantorAccountType = formData.guarantor?.bankRecords?.[0]?.accountType || null;
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
            section_name: doc.section_name
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
    if (formData.applicant?.dob && !form.watch('applicantDob')) {
      form.setValue('applicantDob', formData.applicant.dob);
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
                          onChange={(e) => {
                            const numValue = parseFloat(e.target.value) || 0;
                            field.onChange(numValue);
                            updateFormData('application', 'monthlyRent', numValue);
                          }}
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
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <FormField
                    control={form.control}
                    name="applicantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter full name" 
                            {...field}
                            className="input-field"
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth *</FormLabel>
                      <FormControl>
                        <DatePicker
                          key={`applicantDob-${field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value.getTime() : 'empty'}`}
                          value={field.value}
                          onChange={(date) => {
                            console.log('DatePicker onChange - applicantDob:', date);
                            console.log('DatePicker onChange - applicantDob type:', typeof date);
                            console.log('DatePicker onChange - applicantDob instanceof Date:', date instanceof Date);
                            
                            // Update form field
                            field.onChange(date);
                            
                            // Update form data
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
                              // Clear age if no date selected
                              updateFormData('applicant', 'age', '');
                            }
                            
                            // Trigger form validation
                            form.trigger('applicantDob');
                          }}
                          placeholder="Select date of birth"
                          disabled={(date) => date > new Date()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SSNInput
                  name="applicantSsn"
                  label="Social Security Number"
                  value={formData.applicant?.ssn || ''}
                  onChange={(value) => {
                    updateFormData('applicant', 'ssn', value);
                    form.setValue('applicantSsn', value);
                  }}
                  error={form.formState.errors.applicantSsn?.message}
                />

                {/* Age field hidden from frontend, still auto-calculated in state */}

                <PhoneInput
                  name="applicantPhone"
                  label="Phone Number"
                  value={formData.applicant?.phone || ''}
                  onChange={(value) => {
                    updateFormData('applicant', 'phone', value);
                    form.setValue('applicantPhone', value);
                  }}
                  error={form.formState.errors.applicantPhone?.message}
                />

                <EmailInput
                  name="applicantEmail"
                  label="Email Address"
                  value={formData.applicant?.email || ''}
                  onChange={(value) => {
                    updateFormData('applicant', 'email', value);
                    form.setValue('applicantEmail', value);
                  }}
                  error={form.formState.errors.applicantEmail?.message}
                  required={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LicenseInput
                  name="applicantLicense"
                  label="Driver's License Number"
                  value={formData.applicant?.license || ''}
                  onChange={(value) => {
                    updateFormData('applicant', 'license', value);
                    form.setValue('applicantLicense', value);
                  }}
                  error={form.formState.errors.applicantLicense?.message}
                />

                <StateSelector
                  selectedState={formData.applicant?.licenseState || ''}
                  onStateChange={(state) => {
                    updateFormData('applicant', 'licenseState', state);
                    form.setValue('applicantLicenseState', state);
                  }}
                  label="License State"
                  error={form.formState.errors.applicantLicenseState?.message}
                />
              </div>

              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Current Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="applicantAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter street address" 
                              {...field}
                              className="input-field"
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
                  </div>

                  <CitySelector
                    selectedState={formData.applicant?.state || ''}
                    selectedCity={formData.applicant?.city || ''}
                    onCityChange={(city) => {
                      updateFormData('applicant', 'city', city);
                      form.setValue('applicantCity', city);
                    }}
                    label="City"
                    required={true}
                    error={form.formState.errors.applicantCity?.message}
                  />

                  <StateSelector
                    selectedState={formData.applicant?.state || ''}
                    onStateChange={(state) => {
                      updateFormData('applicant', 'state', state);
                      form.setValue('applicantState', state);
                    }}
                    label="State"
                    required={true}
                    error={form.formState.errors.applicantState?.message}
                  />

                  <ZIPInput
                    name="applicantZip"
                    label="ZIP Code"
                    value={formData.applicant?.zip || ''}
                    onChange={(value) => {
                      updateFormData('applicant', 'zip', value);
                      form.setValue('applicantZip', value);
                    }}
                    error={form.formState.errors.applicantZip?.message}
                    required={true}
                  />

                  {/* CURRENT LANDLORDS NAME */}
                  <div className="space-y-2">
                    <FormLabel>CURRENT LANDLORDS NAME</FormLabel>
                    <FormField
                      control={form.control}
                      name="applicantLandlordName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="Enter landlord's name" 
                              {...field}
                              className="input-field border-gray-300 bg-white"
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
                  </div>

          
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="applicantLengthAtAddressYears"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years at Address</FormLabel>
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
                            <FormLabel>Months at Address</FormLabel>
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="form-field">
                      <Label htmlFor="applicantCurrentRent">MONTHLY RENT</Label>
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
                        className="input-field"
                      />
                    </div>
                  </div>
                   {/* WHY ARE YOU MOVING */}
                   <div className="space-y-2">
                    <FormLabel>WHY ARE YOU MOVING</FormLabel>
                    <FormField
                      control={form.control}
                      name="applicantReasonForMoving"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Please explain your reason for moving" 
                              {...field}
                              className="input-field border-gray-300 bg-white min-h-[80px]"
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

                  <FormField
                    control={form.control}
                    name="applicantGender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Select
                            value={formData.applicant?.gender || ''}
                            onValueChange={(value) => {
                              field.onChange(value);
                              updateFormData('applicant', 'gender', value);
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>
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
                    section_name: sectionKey
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name *</Label>
                      <Input 
                        placeholder="Enter full name"
                        className="input-field"
                        onChange={(e) => updateFormData('coApplicant', 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Relationship to Primary Applicant</Label>
                      <Select onValueChange={(value) => updateFormData('coApplicant', 'relationship', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="partner">Partner</SelectItem>
                          <SelectItem value="roommate">Roommate</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Date of Birth *</Label>
                      <DatePicker
                        value={formData.coApplicant?.dob || undefined}
                        onChange={(date) => {
                          updateFormData('coApplicant', 'dob', date);
                          // Auto-calculate age for co-applicant
                          if (date) {
                            const today = new Date();
                            const birthDate = new Date(date);
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                              age--;
                            }
                            updateFormData('coApplicant', 'age', age);
                          }
                        }}
                        placeholder="Select date of birth"
                        disabled={(date) => date > new Date()}
                      />
                    </div>
                    <div>
                      <SSNInput
                        name="coApplicantSsn"
                        label="Social Security Number *"
                        value={formData.coApplicant?.ssn || ''}
                        onChange={(value) => updateFormData('coApplicant', 'ssn', value)}
                        required={true}
                      />
                    </div>
                    <div>
                      <PhoneInput
                        name="coApplicantPhone"
                        label="Phone Number *"
                        value={formData.coApplicant?.phone || ''}
                        onChange={(value) => updateFormData('coApplicant', 'phone', value)}
                        required={true}
                      />
                    </div>
                    {/* Age field hidden from frontend, still auto-calculated in state */}
                    <div>
                      <Label>Age</Label>
                      <Input 
                        value={formData.coApplicant?.age || ''}
                        className="input-field bg-gray-50"
                        readOnly
                        placeholder="Auto-calculated"
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select
                        value={formData.coApplicant?.gender || ''}
                        onValueChange={(value) => updateFormData('coApplicant', 'gender', value)}
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
                  </div>

                  <div>
                    <EmailInput
                      name="coApplicantEmail"
                      label="Email Address *"
                      value={formData.coApplicant?.email || ''}
                      onChange={(value) => updateFormData('coApplicant', 'email', value)}
                      required={true}
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="sameAddressCoApplicant"
                      checked={sameAddressCoApplicant}
                      onCheckedChange={(checked) => {
                        setSameAddressCoApplicant(checked as boolean);
                        if (checked) {
                          copyAddressToCoApplicant();
                        }
                      }}
                    />
                    <Label htmlFor="sameAddressCoApplicant" className="text-sm">
                      Same address as primary applicant
                    </Label>
                  </div>

                  {!sameAddressCoApplicant && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">Current Address</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label>Street Address *</Label>
                          <Input 
                            placeholder="Enter street address"
                            className="input-field"
                            onChange={(e) => updateFormData('coApplicant', 'address', e.target.value)}
                          />
                        </div>
                        <CitySelector
                          selectedState={formData.coApplicant?.state || ''}
                          selectedCity={formData.coApplicant?.city || ''}
                          onCityChange={(city) => updateFormData('coApplicant', 'city', city)}
                          label="City *"
                          required={true}
                        />
                        <StateSelector
                          selectedState={formData.coApplicant?.state || ''}
                          onStateChange={(state) => updateFormData('coApplicant', 'state', state)}
                          label="State *"
                          required={true}
                        />
                        <ZIPInput
                          name="coApplicantZip"
                          label="ZIP Code *"
                          value={formData.coApplicant?.zip || ''}
                          onChange={(value) => updateFormData('coApplicant', 'zip', value)}
                          required={true}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Years at Address</Label>
                            <Input
                              type="number"
                              min={0}
                              value={formData.coApplicant?.lengthAtAddressYears ?? ''}
                              onChange={(e) => updateFormData('coApplicant', 'lengthAtAddressYears', e.target.value === '' ? undefined : Number(e.target.value))}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <Label>Months at Address</Label>
                            <Input
                              type="number"
                              min={0}
                              max={11}
                              value={formData.coApplicant?.lengthAtAddressMonths ?? ''}
                              onChange={(e) => updateFormData('coApplicant', 'lengthAtAddressMonths', e.target.value === '' ? undefined : Number(e.target.value))}
                              className="input-field"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <FinancialSection 
                    title="Co-Applicant Financial Information"
                    person="coApplicant"
                    formData={formData}
                    updateFormData={updateFormData}
                  />

                  <DocumentSection 
                    title="Co-Applicant Documents"
                    person="coApplicant"
                    onDocumentChange={handleDocumentChange}
                    onEncryptedDocumentChange={handleEncryptedDocumentChange}
                    referenceId={referenceId}
                    enableWebhook={true}
                    applicationId={applicationId}
                  />
                </CardContent>
              </Card>
            )}

            {hasCoApplicant && (
              null
            )}
          </div>
        );



      case 6:
        return (
          <div className="space-y-6">
            {/* Guarantor Information Section */}
            {hasGuarantor ? (
              <Card className="form-section border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-700 dark:text-purple-400">
                    <UserCheck className="w-5 h-5 mr-2" />
                    Guarantor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input 
                        placeholder="Enter full name"
                        className="input-field"
                        onChange={(e) => updateFormData('guarantor', 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Relationship to Applicant(s) *</Label>
                      <Select onValueChange={(value) => updateFormData('guarantor', 'relationship', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="family">Family Member</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="employer">Employer</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Date of Birth *</Label>
                      <DatePicker
                        value={formData.guarantor?.dob || undefined}
                        onChange={(date) => {
                          updateFormData('guarantor', 'dob', date);
                          // Auto-calculate age for guarantor
                          if (date) {
                            const today = new Date();
                            const birthDate = new Date(date);
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                              age--;
                            }
                            updateFormData('guarantor', 'age', age);
                          }
                        }}
                        placeholder="Select date of birth"
                        disabled={(date) => date > new Date()}
                      />
                    </div>
                    <div>
                      <SSNInput
                        name="guarantorSsn"
                        label="Social Security Number *"
                        value={formData.guarantor?.ssn || ''}
                        onChange={(value) => updateFormData('guarantor', 'ssn', value)}
                        required={true}
                      />
                    </div>
                    <div>
                      <PhoneInput
                        name="guarantorPhone"
                        label="Phone Number *"
                        value={formData.guarantor?.phone || ''}
                        onChange={(value) => updateFormData('guarantor', 'phone', value)}
                        required={true}
                      />
                    </div>
                    {/* Age field hidden from frontend, still auto-calculated in state */}
                    <div>
                      <Label>Age</Label>
                      <Input 
                        value={formData.guarantor?.age || ''}
                        className="input-field bg-gray-50"
                        readOnly
                        placeholder="Auto-calculated"
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select
                        value={formData.guarantor?.gender || ''}
                        onValueChange={(value) => updateFormData('guarantor', 'gender', value)}
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
                  </div>

                  <div>
                    <EmailInput
                      name="guarantorEmail"
                      label="Email Address *"
                      value={formData.guarantor?.email || ''}
                      onChange={(value) => updateFormData('guarantor', 'email', value)}
                      required={true}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label>Street Address *</Label>
                        <Input 
                          placeholder="Enter street address"
                          className="input-field"
                          onChange={(e) => updateFormData('guarantor', 'address', e.target.value)}
                        />
                      </div>
                      <CitySelector
                        selectedState={formData.guarantor?.state || ''}
                        selectedCity={formData.guarantor?.city || ''}
                        onCityChange={(city) => updateFormData('guarantor', 'city', city)}
                        label="City *"
                        required={true}
                      />
                      <StateSelector
                        selectedState={formData.guarantor?.state || ''}
                        onStateChange={(state) => updateFormData('guarantor', 'state', state)}
                        label="State *"
                        required={true}
                      />
                      <ZIPInput
                        name="guarantorZip"
                        label="ZIP Code *"
                        value={formData.guarantor?.zip || ''}
                        onChange={(value) => updateFormData('guarantor', 'zip', value)}
                        required={true}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Years at Address</Label>
                          <Input
                            type="number"
                            min={0}
                            value={formData.guarantor?.lengthAtAddressYears ?? ''}
                            onChange={(e) => updateFormData('guarantor', 'lengthAtAddressYears', e.target.value === '' ? undefined : Number(e.target.value))}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <Label>Months at Address</Label>
                          <Input
                            type="number"
                            min={0}
                            max={11}
                            value={formData.guarantor?.lengthAtAddressMonths ?? ''}
                            onChange={(e) => updateFormData('guarantor', 'lengthAtAddressMonths', e.target.value === '' ? undefined : Number(e.target.value))}
                            className="input-field"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <FinancialSection 
                    title="Guarantor Financial Information"
                    person="guarantor"
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="form-section border-l-4 border-l-gray-300">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-600">
                    <UserCheck className="w-5 h-5 mr-2" />
                    Guarantor Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No guarantor has been added to this application.</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setHasGuarantor(true);
                        form.setValue('hasGuarantor', true);
                      }}
                    >
                      Add Guarantor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasGuarantor && (
              null
            )}

            {/* Guarantor Documents Section */}
            {hasGuarantor && (
              <Card className="form-section border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-700 dark:text-purple-400">
                    <Shield className="w-5 h-5 mr-2" />
                    Guarantor Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentSection 
                    title="Guarantor Documents"
                    person="guarantor"
                    onDocumentChange={handleDocumentChange}
                    onEncryptedDocumentChange={handleEncryptedDocumentChange}
                    referenceId={referenceId}
                    enableWebhook={true}
                    applicationId={applicationId}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 7:
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
            {/* Hidden Missing Documents Button
            <Button
              variant="outline"
              onClick={() => setLocation('/missing-documents')}
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Missing Documents</span>
              <span className="sm:hidden">Documents</span>
            </Button>
            */}
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