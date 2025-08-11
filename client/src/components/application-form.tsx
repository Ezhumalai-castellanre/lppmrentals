import React from "react";
import { useState, useEffect, useCallback } from "react";
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
import { Download, FileText, Users, UserCheck, CalendarDays, Shield, FolderOpen, ChevronLeft, ChevronRight, Check, Search, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";


import ApplicationInstructions from "./application-instructions";
import { useRef } from "react";
import { useLocation } from "wouter";
import { type EncryptedFile, validateEncryptedData, createEncryptedDataSummary } from "@/lib/file-encryption";
import { WebhookService } from "@/lib/webhook-service";
import { MondayApiService, type UnitItem } from "@/lib/monday-api";
import { dynamoDBService, type DraftData } from "@/lib/dynamodb-service";


import { ValidatedInput, PhoneInput, SSNInput, ZIPInput, EmailInput, LicenseInput, IncomeInput, IncomeWithFrequencyInput } from "@/components/ui/validated-input";
import { StateCitySelector, StateSelector, CitySelector } from "@/components/ui/state-city-selector";
import { validatePhoneNumber, validateSSN, validateZIPCode, validateEmail, validateDriverLicense } from "@/lib/validation";
import { FileUpload } from "@/components/ui/file-upload";



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

  // Co-Applicant
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

  // Guarantor
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
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  


  // Read selected rental from sessionStorage
  const [selectedRental, setSelectedRental] = useState<any>(null);






  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    application: {},
    applicant: {},
    coApplicant: {},
    guarantor: {},
    occupants: [], // Each occupant: { name, relationship, dob, ssn, age, ssnDocument, ssnEncryptedDocument, documents }
  });
  const [signatures, setSignatures] = useState<any>({});
  const [signatureTimestamps, setSignatureTimestamps] = useState<any>({});
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
  }, []); // ✅ Add empty dependency array to run only once on mount







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

      // Co-Applicant
      coApplicantSsn: "",
      coApplicantPhone: "",
      coApplicantEmail: "",
      coApplicantLicense: "",
      coApplicantZip: "",
      coApplicantLandlordZipCode: "",
      coApplicantLandlordPhone: "",
      coApplicantLandlordEmail: "",

      // Guarantor
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

      // Legal Questions
      landlordTenantLegalAction: "",
      brokenLease: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  // Load draft data from DynamoDB
  const loadDraftData = useCallback(async (applicationId: string) => {
    try {
      console.log('📥 Loading draft data from DynamoDB for application ID:', applicationId);
      
      // Try to load the most recent draft for this application
      const draftData = await dynamoDBService.getDraft(applicationId, referenceId);
      
      if (draftData && draftData.status === 'draft') {
        console.log('✅ Draft data loaded from DynamoDB:', draftData);
        
        // Restore form data
        if (draftData.form_data) {
          // Parse the form data if it's a string (from DynamoDB)
          let parsedFormData = draftData.form_data;
          if (typeof draftData.form_data === 'string') {
            try {
              parsedFormData = JSON.parse(draftData.form_data);
              console.log('✅ Parsed form data from JSON string:', parsedFormData);
              
              // Clean up the parsed data to ensure consistency
              if (parsedFormData.application_id) {
                // Remove the old application_id field and ensure applicantId is set
                delete parsedFormData.application_id;
                parsedFormData.applicantId = draftData.applicantId;
              }
              
              // Ensure all required sections exist
              parsedFormData.application = parsedFormData.application || {};
              parsedFormData.applicant = parsedFormData.applicant || {};
              parsedFormData.coApplicant = parsedFormData.coApplicant || {};
              parsedFormData.guarantor = parsedFormData.guarantor || {};
              parsedFormData.occupants = parsedFormData.occupants || [];
              
              console.log('🧹 Cleaned and normalized form data:', parsedFormData);
            } catch (parseError) {
              console.error('❌ Error parsing form data JSON:', parseError);
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
                console.error('❌ Error parsing signatures JSON:', parseError);
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
                console.error('❌ Error parsing webhook responses JSON:', parseError);
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
                console.error('❌ Error parsing uploaded files JSON:', parseError);
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
                console.error('❌ Error parsing encrypted documents JSON:', parseError);
                parsedEncryptedDocuments = {};
              }
            }
            setEncryptedDocuments(parsedEncryptedDocuments);
          }
          
          // Restore form values for React Hook Form
          if (parsedFormData.application) {
            const app = parsedFormData.application;
            if (app.buildingAddress) form.setValue('buildingAddress', app.buildingAddress);
            if (app.apartmentNumber) form.setValue('apartmentNumber', app.apartmentNumber);
            if (app.apartmentType) form.setValue('apartmentType', app.apartmentType);
            if (app.monthlyRent) form.setValue('monthlyRent', app.monthlyRent);
            if (app.howDidYouHear) form.setValue('howDidYouHear', app.howDidYouHear);
            if (app.moveInDate) {
              const moveInDate = new Date(app.moveInDate);
              if (!isNaN(moveInDate.getTime())) {
                form.setValue('moveInDate', moveInDate);
              }
            }
          }
          
          if (parsedFormData.applicant) {
            const applicant = parsedFormData.applicant;
            if (applicant.name) form.setValue('applicantName', applicant.name);
            if (applicant.email) form.setValue('applicantEmail', applicant.email);
            if (applicant.phone) form.setValue('applicantPhone', applicant.phone);
            if (applicant.address) form.setValue('applicantAddress', applicant.address);
            if (applicant.city) form.setValue('applicantCity', applicant.city);
            if (applicant.state) form.setValue('applicantState', applicant.state);
            if (applicant.zip) form.setValue('applicantZip', applicant.zip);
            if (applicant.dob) {
              const dob = new Date(applicant.dob);
              if (!isNaN(dob.getTime())) {
                form.setValue('applicantDob', dob);
              }
            }
          }
          
          // Restore co-applicant and guarantor flags
          if (parsedFormData.hasCoApplicant !== undefined) {
            setHasCoApplicant(parsedFormData.hasCoApplicant);
          }
          if (parsedFormData.hasGuarantor !== undefined) {
            setHasGuarantor(parsedFormData.hasGuarantor);
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
      
      // Load draft data from DynamoDB if available
      if (user.applicantId) {
        loadDraftData(user.applicantId);
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

  // Start auto-save when form data changes


  // Debounced save function to prevent multiple rapid saves
  const debouncedSaveRef = useRef<NodeJS.Timeout>();
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }
    };
  }, []);



  const updateFormData = async (section: string, field: string, value: any) => {
    setFormData((prev: any) => {
      const newFormData = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };
      
      return newFormData;
    });

    // Debounce the save operation to prevent multiple rapid saves
    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }
    
    debouncedSaveRef.current = setTimeout(() => {
      saveDraftToDynamoDB();
    }, 1000); // Wait 1 second after last change before saving
  };

  // Handle building selection
  const handleBuildingSelect = async (buildingAddress: string) => {
    setSelectedBuilding(buildingAddress);
    const unitsForBuilding = MondayApiService.getUnitsByBuilding(units, buildingAddress);
    setAvailableApartments(unitsForBuilding);
    
    // Auto-select first unit if available
    const firstUnit = unitsForBuilding[0] || null;
    setSelectedUnit(firstUnit);
    
    // Update form data
    await updateFormData('application', 'buildingAddress', buildingAddress);
    await updateFormData('application', 'apartmentNumber', firstUnit?.name || '');
    await updateFormData('application', 'apartmentType', firstUnit?.unitType || '');
    
    // Update form fields
    form.setValue('buildingAddress', buildingAddress);
    form.setValue('apartmentNumber', firstUnit?.name || '');
    form.setValue('apartmentType', firstUnit?.unitType || '');
  };

  // Handle apartment selection
  const handleApartmentSelect = async (apartmentName: string) => {
    console.log('🏠 handleApartmentSelect called with:', apartmentName);
    const selectedApartment = availableApartments.find(unit => unit.name === apartmentName);
    console.log('🏠 selectedApartment:', selectedApartment);
    setSelectedUnit(selectedApartment || null);
    
    // Update form data
    await updateFormData('application', 'apartmentNumber', apartmentName);
    await updateFormData('application', 'apartmentType', selectedApartment?.unitType || '');
    await updateFormData('application', 'monthlyRent', selectedApartment?.monthlyRent || undefined);
    
    // Update form fields
    console.log('🏠 Setting form values:');
    console.log('  - apartmentNumber:', apartmentName);
    console.log('  - apartmentType:', selectedApartment?.unitType || '');
    console.log('  - monthlyRent:', selectedApartment?.monthlyRent || undefined);
    
    form.setValue('apartmentNumber', apartmentName);
    form.setValue('apartmentType', selectedApartment?.unitType || '');
    form.setValue('monthlyRent', selectedApartment?.monthlyRent || undefined);
  };

  const handleDocumentChange = async (person: string, documentType: string, files: File[]) => {
    console.log(`📁 Document change for ${person} ${documentType}:`, files.length, 'files');
    
    setDocuments((prev: any) => ({
      ...prev,
      [person]: {
        ...prev[person],
        [documentType]: files,
      },
    }));
    

  };

  // Handler to attach webhook file URL to encrypted file
  const handleWebhookFileUrl = (person: string, documentType: string, fileUrl: string, fileName: string) => {
    setEncryptedDocuments((prev: any) => {
      const updated = { ...prev };
      if (!updated[person] || !updated[person][documentType]) return prev;
      updated[person][documentType] = updated[person][documentType].map((file: any) =>
        file.filename === fileName ? { ...file, fileUrl } : file
      );
      return updated;
    });
  };

  // Enhanced webhook response handler
  const handleWebhookResponse = (person: 'applicant' | 'coApplicant' | 'guarantor' | 'occupants', documentType: string, response: any) => {
    console.log(`📥 === WEBHOOK RESPONSE RECEIVED ===`);
    console.log(`👤 Person: ${person}`);
    console.log(`📄 Document Type: ${documentType}`);
    console.log(`📨 Raw Response:`, response);
    
    // Store webhook response
    const responseKey = person === 'occupants' ? `occupants_${documentType}` : `${person}_${documentType}`;
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
      fileUrl = response;
      responseType = 'string';
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

    if (fileUrl) {
      console.log(`✅ File URL successfully extracted: ${fileUrl}`);
      


      // Also update the webhook file URL for encrypted documents
      // Use person-specific filename to maintain context
      const personSpecificFilename = `${person}_${documentType}_${Date.now()}`;
      console.log(`🔑 Setting webhook file URL with person-specific filename: ${personSpecificFilename}`);
      handleWebhookFileUrl(person, documentType, fileUrl, personSpecificFilename);
      
      console.log(`✅ Webhook response processing completed for ${person} ${documentType}`);
    } else {
      console.warn(`⚠️ No file URL found in webhook response for ${person} ${documentType}`);
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
    if (!user?.applicantId) {
      console.log('⚠️ No applicantId available, skipping draft save');
      return;
    }

    if (!user.applicantId.trim()) {
      console.log('⚠️ Empty applicantId, skipping draft save');
      return;
    }

    try {
      // Get the latest form data from state
      const currentFormData = formData;
              // Clean up the form data before saving to remove empty values and ensure consistency
        const cleanedFormData = cleanFormDataForStorage(currentFormData);
        
        const enhancedFormDataSnapshot = {
          ...cleanedFormData,
          applicantId: user.applicantId,
          // Remove the old application_id field to avoid confusion
          webhookSummary: getWebhookSummary()
        };

        const draftData: DraftData = {
          applicantId: user.applicantId,
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

      const saveResult = await dynamoDBService.saveDraft(draftData);
      if (saveResult) {
        console.log('💾 Draft saved to DynamoDB successfully');
      } else {
        console.warn('⚠️ Failed to save draft to DynamoDB');
      }
    } catch (error) {
      console.error('❌ Error saving draft to DynamoDB:', error);
    }
  }, [user?.applicantId, formData, referenceId, currentStep, uploadedFilesMetadata, webhookResponses, signatures, encryptedDocuments, getWebhookSummary]);

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
        if (value !== '' && value !== null && value !== undefined) {
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
    
    // Clean coApplicant section
    if (data.coApplicant) {
      cleaned.coApplicant = {};
      Object.entries(data.coApplicant).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleaned.coApplicant[key] = value;
        }
      });
    }
    
    // Clean guarantor section
    if (data.guarantor) {
      cleaned.guarantor = {};
      Object.entries(data.guarantor).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleaned.guarantor[key] = value;
        }
      });
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
      if (!['application', 'applicant', 'coApplicant', 'guarantor', 'occupants'].includes(key)) {
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

  const handleEncryptedDocumentChange = async (person: string, documentType: string, encryptedFiles: EncryptedFile[]) => {
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
    // Map docs and include file_url if present on the file
    const docs = encryptedFiles.map(file => ({
      reference_id: file.uploadDate + '-' + file.filename, // or use a better unique id if available
      file_name: file.filename,
      section_name: sectionKey,
      documents: documentType, // <-- Now included
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
    const filesMetadata = encryptedFiles.map(file => ({
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

    // Save draft to DynamoDB after file upload
    if (user?.applicantId) {
      try {
        const formDataSnapshot = JSON.parse(JSON.stringify(formData));
        const enhancedFormDataSnapshot = {
          ...formDataSnapshot,
          applicantId: user.applicantId,
          webhookSummary: getWebhookSummary()
        };

        const draftData: DraftData = {
          applicantId: user.applicantId,
          reference_id: referenceId,
          form_data: enhancedFormDataSnapshot,
          current_step: currentStep,
          last_updated: new Date().toISOString(),
          status: 'draft',
          uploaded_files_metadata: { ...uploadedFilesMetadata, [sectionKey]: filesMetadata },
          webhook_responses: webhookResponses,
          signatures: signatures,
          encrypted_documents: { ...encryptedDocuments, [person]: { ...encryptedDocuments[person], [documentType]: encryptedFiles } },
        };

        const saveResult = await dynamoDBService.saveDraft(draftData);
        if (saveResult) {
          console.log('💾 Draft saved to DynamoDB after file upload for:', person, documentType);
        } else {
          console.warn('⚠️ Failed to save draft to DynamoDB after file upload');
        }
      } catch (error) {
        console.error('❌ Error saving draft after file upload:', error);
      }
    }
  };

  const handleSignatureChange = async (person: string, signature: string) => {
    setSignatures((prev: any) => ({
      ...prev,
      [person]: signature,
    }));
    setSignatureTimestamps((prev: any) => ({
      ...prev,
      [person]: new Date().toISOString(),
    }));

    // Save draft to DynamoDB after signature change
    if (user?.applicantId) {
      try {
        const formDataSnapshot = JSON.parse(JSON.stringify(formData));
        const enhancedFormDataSnapshot = {
          ...formDataSnapshot,
          applicantId: user.applicantId,
          webhookSummary: getWebhookSummary()
        };

        const draftData: DraftData = {
          applicantId: user.applicantId,
          reference_id: referenceId,
          form_data: enhancedFormDataSnapshot,
          current_step: currentStep,
          last_updated: new Date().toISOString(),
          status: 'draft',
          uploaded_files_metadata: uploadedFilesMetadata,
          webhook_responses: webhookResponses,
          signatures: { ...signatures, [person]: signature },
          encrypted_documents: encryptedDocuments,
        };

        const saveResult = await dynamoDBService.saveDraft(draftData);
        if (saveResult) {
          console.log('💾 Draft saved to DynamoDB after signature change for:', person);
        } else {
          console.warn('⚠️ Failed to save draft to DynamoDB after signature change');
        }
      } catch (error) {
        console.error('❌ Error saving draft after signature change:', error);
      }
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

      // Save draft to DynamoDB before advancing to next step
      if (user?.applicantId) {
        const draftData: DraftData = {
          applicantId: user.applicantId,
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

        const saveResult = await dynamoDBService.saveDraft(draftData);
        if (saveResult) {
          console.log('💾 Draft saved to DynamoDB before advancing to step:', nextPlannedStep);
        } else {
          console.warn('⚠️ Failed to save draft to DynamoDB');
        }
      }

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

      // Save draft to DynamoDB before going back
      if (user?.applicantId) {
        const draftData: DraftData = {
          applicantId: user.applicantId,
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

        const saveResult = await dynamoDBService.saveDraft(draftData);
        if (saveResult) {
          console.log('💾 Draft saved to DynamoDB before going back to step:', getNextAllowedStep(currentStep, -1));
        } else {
          console.warn('⚠️ Failed to save draft to DynamoDB');
        }
      }

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
      
      // Enhanced FormData snapshot with webhook responses and application_id
      const enhancedFormDataSnapshot = {
        ...formDataSnapshot,
        application_id: user?.zoneinfo || user?.applicantId || 'unknown',
        webhookSummary: getWebhookSummary()
      };
      
      console.log('🧾 === ENHANCED FORM DATA SNAPSHOT BEFORE JUMPING TO STEP ===');
      console.log('📊 Form Data:', enhancedFormDataSnapshot);
      console.log('🆔 Application ID:', enhancedFormDataSnapshot.application_id);
      console.log('📈 Webhook Summary:', enhancedFormDataSnapshot.webhookSummary);
      console.log('🎯 Jumping to step:', step);
      console.log('=== END ENHANCED FORM DATA SNAPSHOT ===');

      // Save draft to DynamoDB before jumping to step
      if (user?.applicantId) {
        const draftData: DraftData = {
          applicantId: user.applicantId,
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

        const saveResult = await dynamoDBService.saveDraft(draftData);
        if (saveResult) {
          console.log('💾 Draft saved to DynamoDB before jumping to step:', step);
        } else {
          console.warn('⚠️ Failed to save draft to DynamoDB');
        }
      }

    } catch (err) {
      console.warn('FormData logging failed:', err);
    }
    
    setCurrentStep(step);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Save draft to DynamoDB after adding occupant
    if (user?.applicantId) {
      try {
        const formDataSnapshot = JSON.parse(JSON.stringify(formData));
        const enhancedFormDataSnapshot = {
          ...formDataSnapshot,
          applicantId: user.applicantId,
          webhookSummary: getWebhookSummary()
        };

        const draftData: DraftData = {
          applicantId: user.applicantId,
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

        const saveResult = await dynamoDBService.saveDraft(draftData);
        if (saveResult) {
          console.log('💾 Draft saved to DynamoDB after adding occupant');
        } else {
          console.warn('⚠️ Failed to save draft to DynamoDB after adding occupant');
        }
      } catch (error) {
        console.error('❌ Error saving draft after adding occupant:', error);
      }
    }
  };

  const removeOccupant = async (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      occupants: prev.occupants.filter((_: any, i: number) => i !== index)
    }));

    // Save draft to DynamoDB after removing occupant
    if (user?.applicantId) {
      try {
        const formDataSnapshot = JSON.parse(JSON.stringify(formData));
        const enhancedFormDataSnapshot = {
          ...formDataSnapshot,
          applicantId: user.applicantId,
          webhookSummary: getWebhookSummary()
        };

        const draftData: DraftData = {
          applicantId: user.applicantId,
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

        const saveResult = await dynamoDBService.saveDraft(draftData);
        if (saveResult) {
          console.log('💾 Draft saved to DynamoDB after removing occupant');
        } else {
          console.warn('⚠️ Failed to save draft to DynamoDB after removing occupant');
        }
      } catch (error) {
        console.error('❌ Error saving draft after removing occupant:', error);
      }
    }
  };

  const updateOccupant = async (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      occupants: prev.occupants.map((occupant: any, i: number) => 
        i === index ? { ...occupant, [field]: value } : occupant
      )
    }));

    // Save draft to DynamoDB after occupant update
    if (user?.applicantId) {
      try {
        const formDataSnapshot = JSON.parse(JSON.stringify(formData));
        const enhancedFormDataSnapshot = {
          ...formDataSnapshot,
          applicantId: user.applicantId,
          webhookSummary: getWebhookSummary()
        };

        const draftData: DraftData = {
          applicantId: user.applicantId,
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

        const saveResult = await dynamoDBService.saveDraft(draftData);
        if (saveResult) {
          console.log('💾 Draft saved to DynamoDB after occupant update for:', index, field);
        } else {
          console.warn('⚠️ Failed to save draft to DynamoDB after occupant update');
        }
      } catch (error) {
        console.error('❌ Error saving draft after occupant update:', error);
      }
    }
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

    // Save draft to DynamoDB after occupant document change
    if (user?.applicantId) {
      try {
        const formDataSnapshot = JSON.parse(JSON.stringify(formData));
        const enhancedFormDataSnapshot = {
          ...formDataSnapshot,
          applicantId: user.applicantId,
          webhookSummary: getWebhookSummary()
        };

        const draftData: DraftData = {
          applicantId: user.applicantId,
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

        const saveResult = await dynamoDBService.saveDraft(draftData);
        if (saveResult) {
          console.log('💾 Draft saved to DynamoDB after occupant document change for:', index, documentType);
        } else {
          console.warn('⚠️ Failed to save draft to DynamoDB after occupant document change');
        }
      } catch (error) {
        console.error('❌ Error saving draft after occupant document change:', error);
      }
    }
  };

  // Removed handleOccupantEncryptedDocumentChange - no longer needed

  const onSubmit = async (data: ApplicationFormData) => {
    console.log('🚀 Form submission started');
    setIsSubmitting(true);
    
    try {

      
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
        if (
          data[field] === undefined ||
          data[field] === null ||
          (typeof data[field] === 'string' && data[field].trim() === '') ||
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

        // Create COMPLETE form data structure for server submission (same as webhook)
        const completeServerData = {
          // Application Info
          buildingAddress: data.buildingAddress || formData.application?.buildingAddress,
          apartmentNumber: data.apartmentNumber || formData.application?.apartmentNumber,
          moveInDate: safeDateToISO(data.moveInDate || formData.application?.moveInDate),
          monthlyRent: data.monthlyRent || formData.application?.monthlyRent,
          apartmentType: data.apartmentType || formData.application?.apartmentType,
          howDidYouHear: data.howDidYouHear || formData.application?.howDidYouHear,
          howDidYouHearOther: data.howDidYouHearOther || formData.application?.howDidYouHearOther,
          
          // Primary Applicant - Complete data
          applicantName: data.applicantName || formData.applicant?.name,
          applicantDob: safeDateToISO(data.applicantDob || formData.applicant?.dob),
          applicantSsn: formData.applicant?.ssn || data.applicantSsn,
          applicantPhone: formatPhoneForPayload(formData.applicant?.phone || data.applicantPhone),
          applicantEmail: data.applicantEmail || formData.applicant?.email,
          applicantLicense: formData.applicant?.license || data.applicantLicense,
          applicantLicenseState: formData.applicant?.licenseState || data.applicantLicenseState,
          applicantAddress: data.applicantAddress || formData.applicant?.address,
          applicantCity: data.applicantCity || formData.applicant?.city,
          applicantState: data.applicantState || formData.applicant?.state,
          applicantZip: data.applicantZip || formData.applicant?.zip,
          applicantLengthAtAddressYears: formData.applicant?.lengthAtAddressYears || data.applicantLengthAtAddressYears,
          applicantLengthAtAddressMonths: formData.applicant?.lengthAtAddressMonths || data.applicantLengthAtAddressMonths,
          applicantLandlordName: formData.applicant?.landlordName || data.applicantLandlordName,
          applicantLandlordAddressLine1: formData.applicant?.landlordAddressLine1 || data.applicantLandlordAddressLine1,
          applicantLandlordAddressLine2: formData.applicant?.landlordAddressLine2 || data.applicantLandlordAddressLine2,
          applicantLandlordCity: formData.applicant?.landlordCity || data.applicantLandlordCity,
          applicantLandlordState: formData.applicant?.landlordState || data.applicantLandlordState,
          applicantLandlordZipCode: formData.applicant?.landlordZipCode || data.applicantLandlordZipCode,
          applicantLandlordPhone: formData.applicant?.landlordPhone || data.applicantLandlordPhone,
          applicantLandlordEmail: formData.applicant?.landlordEmail || data.applicantLandlordEmail,
          applicantCurrentRent: formData.applicant?.currentRent || data.applicantCurrentRent,
          applicantReasonForMoving: formData.applicant?.reasonForMoving || data.applicantReasonForMoving,
          
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
          applicantSalary: formData.applicant?.salary,
          applicantBankRecords: (formData.applicant?.bankRecords || []).map((record: any) => ({
            bankName: record.bankName,
            accountType: record.accountType
          })),
          
          // Flags
          hasCoApplicant: hasCoApplicant,
          hasGuarantor: hasGuarantor,
          
          // Co-Applicant - Complete data (if exists)
          ...(hasCoApplicant && formData.coApplicant ? {
            coApplicantName: formData.coApplicant?.name,
            coApplicantRelationship: formData.coApplicant?.relationship,
            coApplicantDob: safeDateToISO(formData.coApplicant?.dob),
            coApplicantSsn: formData.coApplicant?.ssn || data.coApplicantSsn,
            coApplicantPhone: formatPhoneForPayload(formData.coApplicant?.phone || data.coApplicantPhone),
            coApplicantEmail: formData.coApplicant?.email || data.coApplicantEmail,
            coApplicantLicense: formData.coApplicant?.license || data.coApplicantLicense,
            coApplicantLicenseState: formData.coApplicant?.licenseState,
            coApplicantAddress: formData.coApplicant?.address,
            coApplicantCity: formData.coApplicant?.city,
            coApplicantState: formData.coApplicant?.state,
            coApplicantZip: formData.coApplicant?.zip || data.coApplicantZip,
            coApplicantLengthAtAddressYears: formData.coApplicant?.lengthAtAddressYears,
            coApplicantLengthAtAddressMonths: formData.coApplicant?.lengthAtAddressMonths,
            coApplicantLandlordName: formData.coApplicant?.landlordName,
            coApplicantLandlordAddressLine1: formData.coApplicant?.landlordAddressLine1,
            coApplicantLandlordAddressLine2: formData.coApplicant?.landlordAddressLine2,
            coApplicantLandlordCity: formData.coApplicant?.landlordCity,
            coApplicantLandlordState: formData.coApplicant?.landlordState,
            coApplicantLandlordZipCode: formData.coApplicant?.landlordZipCode || data.coApplicantLandlordZipCode,
            coApplicantLandlordPhone: formData.coApplicant?.landlordPhone || data.coApplicantLandlordPhone,
            coApplicantLandlordEmail: formData.coApplicant?.landlordEmail || data.coApplicantLandlordEmail,
            coApplicantCurrentRent: formData.coApplicant?.currentRent,
            coApplicantReasonForMoving: formData.coApplicant?.reasonForMoving,
            coApplicantEmploymentType: formData.coApplicant?.employmentType,
            coApplicantEmployerName: formData.coApplicant?.employerName,
            coApplicantEmployerAddress: formData.coApplicant?.employerAddress,
            coApplicantEmployerCity: formData.coApplicant?.employerCity,
            coApplicantEmployerState: formData.coApplicant?.employerState,
            coApplicantEmployerZip: formData.coApplicant?.employerZip,
            coApplicantEmployerPhone: formData.coApplicant?.employerPhone,
            coApplicantPosition: formData.coApplicant?.position,
            coApplicantStartDate: safeDateToISO(formData.coApplicant?.startDate),
            coApplicantSalary: formData.coApplicant?.salary,
            coApplicantBankRecords: (formData.coApplicant?.bankRecords || []).map((record: any) => ({
              bankName: record.bankName,
              accountType: record.accountType
            })),
          } : {}),
          
          // Guarantor - Complete data (if exists)
          ...(hasGuarantor && formData.guarantor ? {
            guarantorName: formData.guarantor?.name,
            guarantorRelationship: formData.guarantor?.relationship,
            guarantorDob: safeDateToISO(formData.guarantor?.dob),
            guarantorSsn: formData.guarantor?.ssn || data.guarantorSsn,
            guarantorPhone: formatPhoneForPayload(formData.guarantor?.phone || data.guarantorPhone),
            guarantorEmail: formData.guarantor?.email || data.guarantorEmail,
            guarantorLicense: formData.guarantor?.license || data.guarantorLicense,
            guarantorLicenseState: formData.guarantor?.licenseState,
            guarantorAddress: formData.guarantor?.address,
            guarantorCity: formData.guarantor?.city,
            guarantorState: formData.guarantor?.state,
            guarantorZip: formData.guarantor?.zip || data.guarantorZip,
            guarantorLengthAtAddressYears: formData.guarantor?.lengthAtAddressYears,
            guarantorLengthAtAddressMonths: formData.guarantor?.lengthAtAddressMonths,
            guarantorLandlordName: formData.guarantor?.landlordName,
            guarantorLandlordAddressLine1: formData.guarantor?.landlordAddressLine1,
            guarantorLandlordAddressLine2: formData.guarantor?.landlordAddressLine2,
            guarantorLandlordCity: formData.guarantor?.landlordCity,
            guarantorLandlordState: formData.guarantor?.landlordState,
            guarantorLandlordZipCode: formData.guarantor?.landlordZipCode || data.guarantorLandlordZipCode,
            guarantorLandlordPhone: formData.guarantor?.landlordPhone || data.guarantorLandlordPhone,
            guarantorLandlordEmail: formData.guarantor?.landlordEmail || data.guarantorLandlordEmail,
            guarantorCurrentRent: formData.guarantor?.currentRent,
            guarantorReasonForMoving: formData.guarantor?.reasonForMoving,
            guarantorEmploymentType: formData.guarantor?.employmentType,
            guarantorEmployerName: formData.guarantor?.employerName,
            guarantorEmployerAddress: formData.guarantor?.employerAddress,
            guarantorEmployerCity: formData.guarantor?.employerCity,
            guarantorEmployerState: formData.guarantor?.employerState,
            guarantorEmployerZip: formData.guarantor?.employerZip,
            guarantorEmployerPhone: formData.guarantor?.employerPhone,
            guarantorPosition: formData.guarantor?.position,
            guarantorStartDate: safeDateToISO(formData.guarantor?.startDate),
            guarantorSalary: formData.guarantor?.salary,
            guarantorBankRecords: (formData.guarantor?.bankRecords || []).map((record: any) => ({
              bankName: record.bankName,
              accountType: record.accountType
            })),
          } : {}),
          
          // Other Occupants (optimized to exclude large document data)
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
            coApplicant: signatures.coApplicant ? "SIGNED" : null,
            guarantor: signatures.guarantor ? "SIGNED" : null,
          },
          
          documents: uploadedDocuments.map(doc => ({
            reference_id: doc.reference_id,
            file_name: doc.file_name,
            section_name: doc.section_name,
            documents: doc.documents // This should just be the document type, not the encrypted data
          })),
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
        console.log('  - documents:', serverOptimizedData.documents);
        console.log('  - signatures:', serverOptimizedData.signatures);
        console.log('  - uploadedFilesMetadata: REMOVED (sent via webhook)');
        
        console.log('SSN Debug:');
        console.log('  - formData.applicant.ssn:', formData.applicant?.ssn);
        console.log('  - data.applicantSsn:', data.applicantSsn);
        console.log('  - serverOptimizedData.applicantSsn:', serverOptimizedData.applicantSsn);
        console.log('Date fields debug:');
        console.log('  - applicantDob (raw):', data.applicantDob);
        console.log('  - applicantDob (raw type):', typeof data.applicantDob);
        console.log('  - applicantDob (raw instanceof Date):', data.applicantDob instanceof Date);
        console.log('  - applicantDob (optimized):', serverOptimizedData.applicantDob);
        console.log('  - moveInDate (raw):', data.moveInDate);
        console.log('  - moveInDate (raw type):', typeof data.moveInDate);
        console.log('  - moveInDate (raw instanceof Date):', data.moveInDate instanceof Date);
        console.log('  - moveInDate (optimized):', serverOptimizedData.moveInDate);
        console.log('Current window location:', window.location.href);
        
        // Use the regular API endpoint for local development
        const apiEndpoint = '/api';
        console.log('Making request to:', window.location.origin + apiEndpoint + '/submit-application');
        
        // Extract basic user info for identification
        const userInfo = {
          name: serverOptimizedData.applicantName,
          email: serverOptimizedData.applicantEmail,
          phone: serverOptimizedData.applicantPhone,
          applicationType: 'rental'
        };

        // Validate user info
        if (!userInfo.name || !userInfo.email) {
          throw new Error('Name and email are required for submission.');
        }

        const requestBody = {
          applicationData: serverOptimizedData,
          userInfo: userInfo
        };
        
        // Log request body size instead of full content
        const requestBodySize = JSON.stringify(requestBody).length;
        console.log(`📊 Request body size: ${Math.round(requestBodySize/1024)}KB`);
        console.log(`📊 Request body size in MB: ${Math.round(requestBodySize/(1024*1024)*100)/100}MB`);
        console.log('Request body structure:', Object.keys(requestBody));
        
        // Validate required fields before submission
        if (!serverOptimizedData.applicantDob) {
          throw new Error('Date of birth is required. Please select your date of birth.');
        }
        if (!serverOptimizedData.moveInDate) {
          throw new Error('Move-in date is required. Please select your move-in date.');
        }
        if (!serverOptimizedData.applicantName || serverOptimizedData.applicantName.trim() === '') {
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
        console.log('✅ === SERVER SUBMISSION RESULT ===');
        console.log('📤 Data sent to server:', JSON.stringify(requestBody, null, 2));
        console.log('📥 Server response:', JSON.stringify(submissionResult, null, 2));
        console.log('🔗 Application ID:', submissionResult.application_id);
        console.log('🔗 Reference ID:', submissionResult.reference_id);
        console.log('=== END SERVER SUBMISSION ===');

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
        console.log('Application submitted successfully. Files and encrypted data sent via webhooks.');

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
            applicantSalary: formData.applicant?.salary,
            applicantBankRecords: (formData.applicant?.bankRecords || []).map((record: any) => ({
              bankName: record.bankName,
              accountType: record.accountType
            })),
            
            // Flags
            hasCoApplicant: hasCoApplicant,
            hasGuarantor: hasGuarantor,
            
            // Co-Applicant - Complete data (if exists)
            ...(hasCoApplicant && formData.coApplicant ? {
              coApplicantName: formData.coApplicant?.name,
              coApplicantRelationship: formData.coApplicant?.relationship,
              coApplicantDob: safeDateToISO(formData.coApplicant?.dob),
              coApplicantSsn: formData.coApplicant?.ssn || data.coApplicantSsn,
              coApplicantPhone: formatPhoneForPayload(formData.coApplicant?.phone || data.coApplicantPhone),
              coApplicantEmail: formData.coApplicant?.email || data.coApplicantEmail,
              coApplicantLicense: formData.coApplicant?.license || data.coApplicantLicense,
              coApplicantLicenseState: formData.coApplicant?.licenseState,
              coApplicantAddress: formData.coApplicant?.address,
              coApplicantCity: formData.coApplicant?.city,
              coApplicantState: formData.coApplicant?.state,
              coApplicantZip: formData.coApplicant?.zip || data.coApplicantZip,
              coApplicantLengthAtAddressYears: formData.coApplicant?.lengthAtAddressYears,
              coApplicantLengthAtAddressMonths: formData.coApplicant?.lengthAtAddressMonths,
              coApplicantLandlordName: formData.coApplicant?.landlordName,
              coApplicantLandlordAddressLine1: formData.coApplicant?.landlordAddressLine1,
              coApplicantLandlordAddressLine2: formData.coApplicant?.landlordAddressLine2,
              coApplicantLandlordCity: formData.coApplicant?.landlordCity,
              coApplicantLandlordState: formData.coApplicant?.landlordState,
              coApplicantLandlordZipCode: formData.coApplicant?.landlordZipCode || data.coApplicantLandlordZipCode,
              coApplicantLandlordPhone: formData.coApplicant?.landlordPhone || data.coApplicantLandlordPhone,
              coApplicantLandlordEmail: formData.coApplicant?.landlordEmail || data.coApplicantLandlordEmail,
              coApplicantCurrentRent: formData.coApplicant?.currentRent,
              coApplicantReasonForMoving: formData.coApplicant?.reasonForMoving,
              coApplicantEmploymentType: formData.coApplicant?.employmentType,
              coApplicantEmployerName: formData.coApplicant?.employerName,
              coApplicantEmployerAddress: formData.coApplicant?.employerAddress,
              coApplicantEmployerCity: formData.coApplicant?.employerCity,
              coApplicantEmployerState: formData.coApplicant?.employerState,
              coApplicantEmployerZip: formData.coApplicant?.employerZip,
              coApplicantEmployerPhone: formData.coApplicant?.employerPhone,
              coApplicantPosition: formData.coApplicant?.position,
              coApplicantStartDate: safeDateToISO(formData.coApplicant?.startDate),
              coApplicantSalary: formData.coApplicant?.salary,
              coApplicantBankRecords: (formData.coApplicant?.bankRecords || []).map((record: any) => ({
                bankName: record.bankName,
                accountType: record.accountType
              })),
            } : {}),
            
            // Guarantor - Complete data (if exists)
            ...(hasGuarantor && formData.guarantor ? {
              guarantorName: formData.guarantor?.name,
              guarantorRelationship: formData.guarantor?.relationship,
              guarantorDob: safeDateToISO(formData.guarantor?.dob),
              guarantorSsn: formData.guarantor?.ssn || data.guarantorSsn,
              guarantorPhone: formatPhoneForPayload(formData.guarantor?.phone || data.guarantorPhone),
              guarantorEmail: formData.guarantor?.email || data.guarantorEmail,
              guarantorLicense: formData.guarantor?.license || data.guarantorLicense,
              guarantorLicenseState: formData.guarantor?.licenseState,
              guarantorAddress: formData.guarantor?.address,
              guarantorCity: formData.guarantor?.city,
              guarantorState: formData.guarantor?.state,
              guarantorZip: formData.guarantor?.zip || data.guarantorZip,
              guarantorLengthAtAddressYears: formData.guarantor?.lengthAtAddressYears,
              guarantorLengthAtAddressMonths: formData.guarantor?.lengthAtAddressMonths,
              guarantorLandlordName: formData.guarantor?.landlordName,
              guarantorLandlordAddressLine1: formData.guarantor?.landlordAddressLine1,
              guarantorLandlordAddressLine2: formData.guarantor?.landlordAddressLine2,
              guarantorLandlordCity: formData.guarantor?.landlordCity,
              guarantorLandlordState: formData.guarantor?.landlordState,
              guarantorLandlordZipCode: formData.guarantor?.landlordZipCode || data.guarantorLandlordZipCode,
              guarantorLandlordPhone: formData.guarantor?.landlordPhone || data.guarantorLandlordPhone,
              guarantorLandlordEmail: formData.guarantor?.landlordEmail || data.guarantorLandlordEmail,
              guarantorCurrentRent: formData.guarantor?.currentRent,
              guarantorReasonForMoving: formData.guarantor?.reasonForMoving,
              guarantorEmploymentType: formData.guarantor?.employmentType,
              guarantorEmployerName: formData.guarantor?.employerName,
              guarantorEmployerAddress: formData.guarantor?.employerAddress,
              guarantorEmployerCity: formData.guarantor?.employerCity,
              guarantorEmployerState: formData.guarantor?.employerState,
              guarantorEmployerZip: formData.guarantor?.employerZip,
              guarantorEmployerPhone: formData.guarantor?.employerPhone,
              guarantorPosition: formData.guarantor?.position,
              guarantorStartDate: safeDateToISO(formData.guarantor?.startDate),
              guarantorSalary: formData.guarantor?.salary,
              guarantorBankRecords: (formData.guarantor?.bankRecords || []).map((record: any) => ({
                bankName: record.bankName,
                accountType: record.accountType
              })),
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
              coApplicant: signatures.coApplicant ? "SIGNED" : null,
              guarantor: signatures.guarantor ? "SIGNED" : null,
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
              coApplicant: hasCoApplicant ? {
                bankRecords: (formData.coApplicant?.bankRecords || []).map((record: any) => ({
                  bankName: record.bankName,
                  accountType: record.accountType
                })),
                totalBankRecords: formData.coApplicant?.bankRecords?.length || 0,
                hasBankRecords: !!(formData.coApplicant?.bankRecords && formData.coApplicant.bankRecords.length > 0)
              } : null,
              guarantor: hasGuarantor ? {
                bankRecords: (formData.guarantor?.bankRecords || []).map((record: any) => ({
                  bankName: record.bankName,
                  accountType: record.accountType
                })),
                totalBankRecords: formData.guarantor?.bankRecords?.length || 0,
                hasBankRecords: !!(formData.guarantor?.bankRecords && formData.guarantor.bankRecords.length > 0)
              } : null,
              summary: {
                totalPeople: 1 + (hasCoApplicant ? 1 : 0) + (hasGuarantor ? 1 : 0),
                totalBankRecords: (formData.applicant?.bankRecords?.length || 0) + 
                                 (hasCoApplicant ? (formData.coApplicant?.bankRecords?.length || 0) : 0) + 
                                 (hasGuarantor ? (formData.guarantor?.bankRecords?.length || 0) : 0),
                peopleWithBankRecords: [
                  ...(formData.applicant?.bankRecords && formData.applicant.bankRecords.length > 0 ? ['applicant'] : []),
                  ...(hasCoApplicant && formData.coApplicant?.bankRecords && formData.coApplicant.bankRecords.length > 0 ? ['coApplicant'] : []),
                  ...(hasGuarantor && formData.guarantor?.bankRecords && formData.guarantor.bankRecords.length > 0 ? ['guarantor'] : [])
                ]
              }
            },
            
            // Application IDs
            applicantId: user?.applicantId || 'unknown',
            reference_id: referenceId,
            

            
            // Webhook responses for uploaded documents
            webhookResponses: webhookResponses,

          };

          const webhookPayload = completeWebhookData;

          // Check payload size before sending
          const payloadSize = JSON.stringify(webhookPayload).length;
          const payloadSizeMB = Math.round(payloadSize / (1024 * 1024) * 100) / 100;
          console.log(`📦 Raw webhook payload size: ${payloadSizeMB}MB`);
          
          if (payloadSize > 10 * 1024 * 1024) { // 10MB limit
            console.warn('⚠️ Raw webhook payload is very large:', payloadSizeMB, 'MB');
            console.warn('⚠️ Large data will be cleaned by webhook service');
          }

          console.log('=== WEBHOOK PAYLOAD DEBUG ===');
          console.log('✅ Complete Webhook Structure:');
          console.log('  - reference_id:', webhookPayload.reference_id);
          console.log('  - application_id:', webhookPayload.application_id);
          console.log('  - form_data: [Complete application data]');
          console.log('  - uploaded_files: [Complete files metadata]');
          console.log('  - submission_type: form_data');
          console.log('');
          console.log('📊 Data Verification:');
          console.log('  - Applicant SSN:', webhookPayload.applicantSsn);
          console.log('  - Other Occupants Count:', webhookPayload.otherOccupants?.length || 0);
          console.log('  - Bank Records - Applicant:', webhookPayload.applicantBankRecords?.length || 0);
          console.log('  - Bank Records - Co-Applicant:', webhookPayload.coApplicantBankRecords?.length || 0);
          console.log('  - Bank Records - Guarantor:', webhookPayload.guarantorBankRecords?.length || 0);
          console.log('  - Legal Questions:', {
            landlordTenantLegalAction: webhookPayload.landlordTenantLegalAction,
            brokenLease: webhookPayload.brokenLease
          });
          console.log('  - Signatures:', Object.keys(webhookPayload.signatures || {}));
          console.log('  - Bank Information:', {
            applicantBankRecords: webhookPayload.bankInformation?.applicant?.totalBankRecords || 0,
            coApplicantBankRecords: webhookPayload.bankInformation?.coApplicant?.totalBankRecords || 0,
            guarantorBankRecords: webhookPayload.bankInformation?.guarantor?.totalBankRecords || 0,
            totalBankRecords: webhookPayload.bankInformation?.summary?.totalBankRecords || 0
          });
          console.log('  - Uploaded Documents Count:', (uploadedDocuments || []).length);
          console.log('=== END WEBHOOK PAYLOAD DEBUG ===');


          // Send the complete webhook data exactly as specified
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
    if (stateValue && formValue !== stateValue) {
      console.log('🏠 Setting apartmentNumber:', stateValue);
      form.setValue('apartmentNumber', stateValue);
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
    if (stateValue && formValue !== stateValue) {
      form.setValue('apartmentType', stateValue);
    }
  }, [formData.application?.apartmentType, form]);

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
                          value={field.value?.toString() || formData.application?.monthlyRent?.toString() || ''}
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
                          value={field.value || selectedUnit?.unitType || ''}
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
          <FinancialSection 
            title="Primary Applicant Financial Information"
            person="applicant"
            formData={formData}
            updateFormData={updateFormData}
          />
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
                // Debug: Log what webhook responses are being filtered for applicant
                // Original webhookResponses: {applicant_employment_letter: "...", coApplicant_photo_id: "...", guarantor_social_security: "..."}
                // Filtered for applicant: {employment_letter: "...", ...}
                // Log the filtering process
                // console.log('🔍 Filtering webhook responses for applicant:', {
                //   original: webhookResponses,
                //   filtered: Object.fromEntries(
                //     Object.entries(webhookResponses)
                //       .filter(([key]) => key.startsWith('applicant_'))
                //       .map(([key, value]) => [key.replace('applicant_', ''), value])
                //   )
                // });
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
                <CardContent className="p-4 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="col-span-1 md:col-span-2">
                  <FormItem>
                    <FormLabel className="mb-0.5">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter full name" 
                        value={formData.coApplicant?.name || ''}
                        className="input-field w-full mt-1"
                        onChange={(e) => {
                          updateFormData('coApplicant', 'name', e.target.value);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label className="mb-0.5">Relationship</Label>
                  <Select
                    value={formData.coApplicant?.relationship || ''}
                    onValueChange={(value) => updateFormData('coApplicant', 'relationship', value)}
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
                      value={toValidDate(formData.coApplicant?.dob)}
                      onChange={(date) => {
                        updateFormData('coApplicant', 'dob', date);
                        // Auto-calculate age
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
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormControl>
                    <SSNInput
                      name="coApplicantSsn"
                      label="Social Security Number"
                      placeholder="XXX-XX-XXXX"
                      value={formData.coApplicant?.ssn || ''}
                      onChange={(value) => {
                        updateFormData('coApplicant', 'ssn', value);
                        form.setValue('coApplicantSsn', value);
                      }}
                      className="w-full mt-1"
                    />
                  </FormControl>
                  {form.formState.errors.coApplicantSsn?.message && (
                    <span className="text-red-500 text-xs">{form.formState.errors.coApplicantSsn.message}</span>
                  )}
                </FormItem>
                <FormItem>
                  <FormControl>
                    <PhoneInput
                      name="coApplicantPhone"
                      label="Phone Number"
                      placeholder="(555) 555-5555"
                      value={formData.coApplicant?.phone || ''}
                      onChange={(value) => {
                        updateFormData('coApplicant', 'phone', value);
                        form.setValue('coApplicantPhone', value);
                      }}
                      className="w-full mt-1"
                    />
                  </FormControl>
                  {form.formState.errors.coApplicantPhone?.message && (
                    <span className="text-red-500 text-xs">{form.formState.errors.coApplicantPhone.message}</span>
                  )}
                </FormItem>
                <FormItem>
                  <FormControl>
                    <EmailInput
                      name="coApplicantEmail"
                      label="Email Address"
                      placeholder="you@email.com"
                      value={formData.coApplicant?.email || ''}
                      onChange={(value) => {
                        updateFormData('coApplicant', 'email', value);
                        form.setValue('coApplicantEmail', value);
                      }}
                      required={true}
                      className="w-full mt-1"
                    />
                  </FormControl>
                  {form.formState.errors.coApplicantEmail?.message && (
                    <span className="text-red-500 text-xs">{form.formState.errors.coApplicantEmail.message}</span>
                  )}
                </FormItem>
                <FormItem>
                  <FormControl>
                    <LicenseInput
                      name="coApplicantLicense"
                      label="Driver's License Number"
                      placeholder="Enter license number"
                      value={formData.coApplicant?.license || ''}
                      onChange={(value) => {
                        updateFormData('coApplicant', 'license', value);
                        form.setValue('coApplicantLicense', value);
                      }}
                      className="w-full mt-1"
                    />
                  </FormControl>
                  {form.formState.errors.coApplicantLicense?.message && (
                    <span className="text-red-500 text-xs">{form.formState.errors.coApplicantLicense.message}</span>
                  )}
                </FormItem>
                <div className="space-y-2">
                  
                  <StateSelector
                    selectedState={formData.coApplicant?.licenseState || ''}
                    onStateChange={(state) => updateFormData('coApplicant', 'licenseState', state)}
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
                              updateFormData('coApplicant', 'address', e.target.value);
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
                            name="coApplicantZip"
                            label="ZIP Code*"
                            placeholder="ZIP code"
                            value={formData.coApplicant?.zip || ''}
                            onChange={(value) => {
                              updateFormData('coApplicant', 'zip', value);
                              form.setValue('coApplicantZip', value);
                            }}
                            required={true}
                            className="w-full mt-1"
                          />
                        </FormControl>
                        {form.formState.errors.coApplicantZip?.message && (
                          <span className="text-red-500 text-xs">{form.formState.errors.coApplicantZip.message}</span>
                        )}
                      </FormItem>
                </div>
                
                <div className="space-y-2">
                  {/* Replace State* and City* text inputs with StateCitySelector */}
                  <StateCitySelector
                    selectedState={formData.coApplicant?.state || ''}
                    selectedCity={formData.coApplicant?.city || ''}
                    onStateChange={(state) => {
                      updateFormData('coApplicant', 'state', state);
                      // Clear city if state changes
                      updateFormData('coApplicant', 'city', '');
                    }}
                    onCityChange={(city) => {
                      updateFormData('coApplicant', 'city', city);
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
                    <FormItem>
                      <FormLabel className="mb-0.5">Landlord Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter landlord's name" 
                          value={formData.coApplicant?.landlordName || ''}
                          className="input-field w-full mt-1 border-gray-300 bg-white"
                          onChange={(e) => {
                            updateFormData('coApplicant', 'landlordName', e.target.value);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormLabel className="mb-0.5">Landlord Street Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter landlord's street address" 
                          value={formData.coApplicant?.landlordAddressLine1 || ''}
                          className="input-field w-full mt-1 border-gray-300 bg-white"
                          onChange={(e) => {
                            updateFormData('coApplicant', 'landlordAddressLine1', e.target.value);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormLabel className="mb-0.5">Landlord Address Line 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Apartment, suite, etc." 
                          value={formData.coApplicant?.landlordAddressLine2 || ''}
                          className="input-field w-full mt-1 border-gray-300 bg-white"
                          onChange={(e) => {
                            updateFormData('coApplicant', 'landlordAddressLine2', e.target.value);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <StateSelector
                          selectedState={formData.coApplicant?.landlordState || ''}
                          onStateChange={(value) => {
                            updateFormData('coApplicant', 'landlordState', value);
                          }}
                          label="Landlord State"
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <CitySelector
                          selectedState={formData.coApplicant?.landlordState || ''}
                          selectedCity={formData.coApplicant?.landlordCity || ''}
                          onCityChange={(value) => {
                            updateFormData('coApplicant', 'landlordCity', value);
                          }}
                          label="Landlord City"
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <ZIPInput
                          name="coApplicantLandlordZipCode"
                          label="Landlord ZIP Code"
                          placeholder="Enter landlord's ZIP code"
                          value={formData.coApplicant?.landlordZipCode || ''}
                          onChange={(value) => {
                            updateFormData('coApplicant', 'landlordZipCode', value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <PhoneInput
                          name="coApplicantLandlordPhone"
                          label="Landlord Phone Number"
                          placeholder="Enter landlord's phone number"
                          value={formData.coApplicant?.landlordPhone || ''}
                          onChange={(value) => {
                            updateFormData('coApplicant', 'landlordPhone', value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <EmailInput
                          name="coApplicantLandlordEmail"
                          label="Landlord Email Address (Optional)"
                          placeholder="Enter landlord's email address"
                          value={formData.coApplicant?.landlordEmail || ''}
                          onChange={(value) => {
                            updateFormData('coApplicant', 'landlordEmail', value);
                          }}
                          className="w-full mt-1"
                        />
                      </FormControl>
                    </FormItem>
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
                    <FormItem>
                      <FormLabel className="mb-0.5">Why Are You Moving</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please explain your reason for moving" 
                          value={formData.coApplicant?.reasonForMoving || ''}
                          className="input-field w-full mt-1 border-gray-300 bg-white min-h-[80px]"
                          onChange={(e) => {
                            updateFormData('coApplicant', 'reasonForMoving', e.target.value);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                </CardContent>
              </Card>
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
          <FinancialSection 
            title="Co-Applicant Financial Information"
            person="coApplicant"
            formData={formData}
            updateFormData={updateFormData}
          />
        );

      case 7:
        if (hasCoApplicant && !formData.coApplicant?.employmentType) {
          return (
            <Card className="form-section border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Co-Applicant Documents
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
        // Wrapper functions for SupportingDocuments to match expected signature
        const coApplicantDocumentChange = (documentType: string, files: File[]) => handleDocumentChange('coApplicant', documentType, files);
        const coApplicantEncryptedDocumentChange = (documentType: string, encryptedFiles: EncryptedFile[]) => handleEncryptedDocumentChange('coApplicant', documentType, encryptedFiles);
        const coApplicantWebhookResponse = (documentType: string, response: any) => {
          handleWebhookResponse('coApplicant', documentType, response);
        };
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
                  formData={{
                    ...formData,
                    webhookResponses: Object.fromEntries(
                      Object.entries(webhookResponses)
                        .filter(([key]) => key.startsWith('coApplicant_'))
                        .map(([key, value]) => [key.replace('coApplicant_', ''), value])
                    )
                  }}
                  // Debug: Filter webhook responses for coApplicant only
                  // Original: {applicant_employment_letter: "...", coApplicant_photo_id: "...", guarantor_social_security: "..."}
                  // Filtered: {photo_id: "..."}
                  onDocumentChange={coApplicantDocumentChange}
                  onEncryptedDocumentChange={coApplicantEncryptedDocumentChange}
                  onWebhookResponse={coApplicantWebhookResponse}
                  referenceId={referenceId}
                  enableWebhook={true}
                  applicationId={user?.applicantId || 'unknown'}
                  applicantId={user?.id}
                  zoneinfo={user?.zoneinfo}
                  showOnlyCoApplicant={true}
                />
              </CardContent>
            </Card>
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
                
                {/* Debug: Show current webhook responses for occupants */}
                {Object.keys(formData.webhookResponses || {}).filter(key => key.startsWith('occupants_')).length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs font-medium text-blue-800 mb-2">🔍 Debug: Occupant Webhook Responses</div>
                    {Object.entries(formData.webhookResponses || {}).filter(([key]) => key.startsWith('occupants_')).map(([key, value]) => (
                      <div key={key} className="text-xs text-blue-700 mb-1">
                        <strong>{key}:</strong> {typeof value === 'string' ? value : JSON.stringify(value)}
                      </div>
                    ))}
                  </div>
                )}
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
                      description="Upload SSN card (.pdf, .jpg, .jpeg, .png, max 10MB)"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple={false}
                      maxFiles={1}
                      maxSize={10}
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
                        } else if (documentStatus.status === "pending") {
                          return (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-orange-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="text-sm">Document upload pending</span>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-red-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="text-sm">SSN document upload is required</span>
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
                        <FormItem>
                          <FormLabel className="mb-0.5">Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter full name" 
                              value={formData.guarantor?.name || ''}
                              className="input-field w-full mt-1"
                              onChange={(e) => {
                                updateFormData('guarantor', 'name', e.target.value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <Label className="mb-0.5">Relationship</Label>
                        <Select
                          value={formData.guarantor?.relationship || ''}
                          onValueChange={(value) => updateFormData('guarantor', 'relationship', value)}
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
                            value={toValidDate(formData.guarantor?.dob)}
                            onChange={(date) => {
                              updateFormData('guarantor', 'dob', date);
                              // Auto-calculate age
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
                        </FormControl>
                      </FormItem>

                      <FormItem>
                        <FormControl>
                          <SSNInput
                            name="guarantorSsn"
                            label="Social Security Number"
                            placeholder="XXX-XX-XXXX"
                            value={formData.guarantor?.ssn || ''}
                            onChange={(value) => {
                              updateFormData('guarantor', 'ssn', value);
                              form.setValue('guarantorSsn', value);
                            }}
                            className="w-full mt-1"
                          />
                        </FormControl>
                        {form.formState.errors.guarantorSsn?.message && (
                          <span className="text-red-500 text-xs">{form.formState.errors.guarantorSsn.message}</span>
                        )}
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <PhoneInput
                            name="guarantorPhone"
                            label="Phone Number"
                            placeholder="(555) 555-5555"
                            value={formData.guarantor?.phone || ''}
                            onChange={(value) => {
                              updateFormData('guarantor', 'phone', value);
                              form.setValue('guarantorPhone', value);
                            }}
                            className="w-full mt-1"
                          />
                        </FormControl>
                        {form.formState.errors.guarantorPhone?.message && (
                          <span className="text-red-500 text-xs">{form.formState.errors.guarantorPhone.message}</span>
                        )}
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <EmailInput
                            name="guarantorEmail"
                            label="Email Address"
                            placeholder="you@email.com"
                            value={formData.guarantor?.email || ''}
                            onChange={(value) => {
                              updateFormData('guarantor', 'email', value);
                              form.setValue('guarantorEmail', value);
                            }}
                            required={true}
                            className="w-full mt-1"
                          />
                        </FormControl>
                        {form.formState.errors.guarantorEmail?.message && (
                          <span className="text-red-500 text-xs">{form.formState.errors.guarantorEmail.message}</span>
                        )}
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <LicenseInput
                            name="guarantorLicense"
                            label="Driver's License Number"
                            placeholder="Enter license number"
                            value={formData.guarantor?.license || ''}
                            onChange={(value) => {
                              updateFormData('guarantor', 'license', value);
                              form.setValue('guarantorLicense', value);
                            }}
                            className="w-full mt-1"
                          />
                        </FormControl>
                        {form.formState.errors.guarantorLicense?.message && (
                          <span className="text-red-500 text-xs">{form.formState.errors.guarantorLicense.message}</span>
                        )}
                      </FormItem>
                      <div className="space-y-2">
                        
                        <StateSelector
                          selectedState={formData.guarantor?.licenseState || ''}
                          onStateChange={(state) => updateFormData('guarantor', 'licenseState', state)}
                          label="License State"
                          required={false}
                          className="w-full mt-1"
                        />
                      </div>
                      <h5>Current Address</h5>
                      <div className="space-y-2"></div>
                      <div className="space-y-2">
                        <FormItem>
                          <FormLabel className="mb-0.5">Street Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter street address" 
                              value={formData.guarantor?.address || ''}
                              className="input-field w-full mt-1"
                              onChange={(e) => {
                                updateFormData('guarantor', 'address', e.target.value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <ZIPInput
                              name="guarantorZip"
                              label="ZIP Code*"
                              placeholder="ZIP code"
                              value={formData.guarantor?.zip || ''}
                              onChange={(value) => {
                                updateFormData('guarantor', 'zip', value);
                                form.setValue('guarantorZip', value);
                              }}
                              required={true}
                              className="w-full mt-1"
                            />
                          </FormControl>
                          {form.formState.errors.guarantorZip?.message && (
                            <span className="text-red-500 text-xs">{form.formState.errors.guarantorZip.message}</span>
                          )}
                        </FormItem>
                      </div>
                      <div className="space-y-2">
                        <StateCitySelector
                          selectedState={formData.guarantor?.state || ''}
                          selectedCity={formData.guarantor?.city || ''}
                          onStateChange={(state) => {
                            updateFormData('guarantor', 'state', state);
                            updateFormData('guarantor', 'city', '');
                          }}
                          onCityChange={(city) => {
                            updateFormData('guarantor', 'city', city);
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
                      <FormItem>
                        <FormLabel className="mb-0.5">Landlord Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter landlord's name" 
                            value={formData.guarantor?.landlordName || ''}
                            className="input-field w-full mt-1 border-gray-300 bg-white"
                            onChange={(e) => {
                              updateFormData('guarantor', 'landlordName', e.target.value);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormLabel className="mb-0.5">Landlord Street Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter landlord's street address" 
                            value={formData.guarantor?.landlordAddressLine1 || ''}
                            className="input-field w-full mt-1 border-gray-300 bg-white"
                            onChange={(e) => {
                              updateFormData('guarantor', 'landlordAddressLine1', e.target.value);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormLabel className="mb-0.5">Landlord Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Apartment, suite, etc." 
                            value={formData.guarantor?.landlordAddressLine2 || ''}
                            className="input-field w-full mt-1 border-gray-300 bg-white"
                            onChange={(e) => {
                              updateFormData('guarantor', 'landlordAddressLine2', e.target.value);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <StateSelector
                            selectedState={formData.guarantor?.landlordState || ''}
                            onStateChange={(value) => {
                              updateFormData('guarantor', 'landlordState', value);
                            }}
                            label="Landlord State"
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <CitySelector
                            selectedState={formData.guarantor?.landlordState || ''}
                            selectedCity={formData.guarantor?.landlordCity || ''}
                            onCityChange={(value) => {
                              updateFormData('guarantor', 'landlordCity', value);
                            }}
                            label="Landlord City"
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <ZIPInput
                            name="guarantorLandlordZipCode"
                            label="Landlord ZIP Code"
                            placeholder="Enter landlord's ZIP code"
                            value={formData.guarantor?.landlordZipCode || ''}
                            onChange={(value) => {
                              updateFormData('guarantor', 'landlordZipCode', value);
                            }}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <PhoneInput
                            name="guarantorLandlordPhone"
                            label="Landlord Phone Number"
                            placeholder="Enter landlord's phone number"
                            value={formData.guarantor?.landlordPhone || ''}
                            onChange={(value) => {
                              updateFormData('guarantor', 'landlordPhone', value);
                            }}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <EmailInput
                            name="guarantorLandlordEmail"
                            label="Landlord Email Address (Optional)"
                            placeholder="Enter landlord's email address"
                            value={formData.guarantor?.landlordEmail || ''}
                            onChange={(value) => {
                              updateFormData('guarantor', 'landlordEmail', value);
                            }}
                            className="w-full mt-1"
                          />
                        </FormControl>
                      </FormItem>
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
                      <FormItem>
                        <FormLabel className="mb-0.5">Why Are You Moving</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please explain your reason for moving" 
                            value={formData.guarantor?.reasonForMoving || ''}
                            className="input-field w-full mt-1 border-gray-300 bg-white min-h-[80px]"
                            onChange={(e) => {
                              updateFormData('guarantor', 'reasonForMoving', e.target.value);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    </div>
                  </>
                )}
                </CardContent>
              </Card>
                  </div>
        );

      case 10:
        if (!hasGuarantor) {
          return (
            <Card className="form-section">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="w-5 h-5 mr-2" />
                  Guarantor Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-500 text-sm mb-4">Please add a Guarantor in the previous step to access financial information.</div>
              </CardContent>
            </Card>
          );
        }
        return (
          <FinancialSection 
            title="Guarantor Financial Information"
            person="guarantor"
            formData={formData}
            updateFormData={updateFormData}
          />
        );

      case 11:
        if (!formData.guarantor?.employmentType) {
          return (
            <Card className="form-section border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Guarantor Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-500 text-sm mb-4">Please select Employment Type in the Guarantor Financial Information section to upload supporting documents.</div>
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
        const guarantorDocumentChange = (documentType: string, files: File[]) => handleDocumentChange('guarantor', documentType, files);
        const guarantorEncryptedDocumentChange = (documentType: string, encryptedFiles: EncryptedFile[]) => handleEncryptedDocumentChange('guarantor', documentType, encryptedFiles);
        const guarantorWebhookResponse = (documentType: string, response: any) => {
          handleWebhookResponse('guarantor', documentType, response);
        };
        return (
          <Card className="form-section border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700 dark:text-green-400">
                <FolderOpen className="w-5 h-5 mr-2" />
                Guarantor Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
                <SupportingDocuments
                  formData={{
                    ...formData,
                    webhookResponses: Object.fromEntries(
                      Object.entries(webhookResponses)
                        .filter(([key]) => key.startsWith('guarantor_'))
                        .map(([key, value]) => [key.replace('guarantor_', ''), value])
                    )
                  }}
                  // Debug: Filter webhook responses for guarantor only
                  // Original: {applicant_employment_letter: "...", coApplicant_photo_id: "...", guarantor_social_security: "..."}
                  // Filtered: {social_security: "..."}
                  onDocumentChange={guarantorDocumentChange}
                  onEncryptedDocumentChange={guarantorEncryptedDocumentChange}
                  onWebhookResponse={guarantorWebhookResponse}
                  referenceId={referenceId}
                  enableWebhook={true}
                  applicationId={user?.applicantId || 'unknown'}
                  applicantId={user?.id}
                  zoneinfo={user?.zoneinfo}
                  showOnlyGuarantor={true}
                />
            </CardContent>
          </Card>
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

  // Helper to robustly convert to Date or undefined
  const toValidDate = (val: any): Date | undefined => {
    if (!val) return undefined;
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    if (typeof val === 'string' || typeof val === 'number') {
      const d = new Date(val);
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    }
    return undefined;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 sm:bg-gradient-to-br sm:from-blue-50 sm:to-gray-100 sm:dark:from-gray-900 sm:dark:to-gray-800">
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
                <p className="text-blue-900 font-medium">{welcomeMessage}</p>
                <p className="text-blue-700 text-sm">Ready to continue your application</p>
              </div>
            </div>
            <button
              onClick={() => setShowWelcomeMessage(false)}
              className="text-blue-400 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header with Navigation */}
      <div className="w-full max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Rental Application
              </h1>
            </div>
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
                    type="button"
                    onClick={(e) => goToStep(step.id, e)}
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


        </div>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-4 sm:space-y-8"
            onKeyDown={(e) => {
              // Prevent form submission on Enter key unless it's the submit button
              if (e.key === 'Enter' && e.target !== e.currentTarget.querySelector('button[type="submit"]')) {
                e.preventDefault();
              }
            }}
          >
            {/* Current Step Content */}
            <div className="form-container">
              {renderStep()}
            </div>



            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex items-center space-x-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                {currentStep < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Submit Application</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
} // end ApplicationForm