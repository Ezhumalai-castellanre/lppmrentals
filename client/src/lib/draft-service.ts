export interface DraftData {
  // Core metadata
  applicantId: string;
  currentStep: number;
  isComplete: boolean;
  lastSaved: string;
  version: string;
  compressed: boolean;

  // Step 1: Application Info
  buildingAddress?: string;
  apartmentNumber?: string;
  moveInDate?: string;
  monthlyRent?: number;
  apartmentType?: string;
  howDidYouHear?: string;

  // Step 2: Primary Applicant
  applicantName?: string;
  applicantDob?: string;
  applicantSsn?: string;
  applicantPhone?: string;
  applicantEmail?: string;
  applicantLicense?: string;
  applicantLicenseState?: string;
  applicantAddress?: string;
  applicantCity?: string;
  applicantState?: string;
  applicantZip?: string;
  applicantLengthAtAddressYears?: number;
  applicantLengthAtAddressMonths?: number;
  applicantLandlordName?: string;
  applicantLandlordAddressLine1?: string;
  applicantLandlordAddressLine2?: string;
  applicantLandlordCity?: string;
  applicantLandlordState?: string;
  applicantLandlordZipCode?: string;
  applicantLandlordPhone?: string;
  applicantLandlordEmail?: string;
  applicantCurrentRent?: number;
  applicantReasonForMoving?: string;

  // Step 3: Primary Applicant Financial
  applicantEmploymentType?: string;
  applicantPosition?: string;
  applicantStartDate?: string | null;
  applicantBankInformation?: {
    bankRecords: Array<{
      bankName: string;
      accountType: string;
    }>;
    totalBankRecords: number;
    hasBankRecords: boolean;
  };

  // Step 4: Primary Applicant Documents
  applicantDocuments?: {
    photo_id?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    pay_stubs?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    bank_statements?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    tax_returns?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    social_security?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
  };

  // Step 5: Co-Applicant (conditional)
  hasCoApplicant?: boolean;
  coApplicantName?: string;
  coApplicantRelationship?: string;
  coApplicantDob?: string;
  coApplicantSsn?: string;
  coApplicantPhone?: string;
  coApplicantEmail?: string;
  coApplicantLicense?: string;
  coApplicantLicenseState?: string;
  coApplicantCity?: string;
  coApplicantState?: string;
  coApplicantZip?: string;
  coApplicantLengthAtAddressYears?: number;
  coApplicantLengthAtAddressMonths?: number;
  coApplicantLandlordName?: string;
  coApplicantLandlordAddressLine1?: string;
  coApplicantLandlordAddressLine2?: string;
  coApplicantLandlordCity?: string;
  coApplicantLandlordState?: string;
  coApplicantLandlordZipCode?: string;
  coApplicantLandlordPhone?: string;
  coApplicantLandlordEmail?: string;
  coApplicantCurrentRent?: number;
  coApplicantReasonForMoving?: string;

  // Step 6: Co-Applicant Financial (conditional)
  coApplicantEmploymentType?: string;
  coApplicantPosition?: string;
  coApplicantStartDate?: string | null;
  coApplicantBankInformation?: {
    bankRecords: Array<{
      bankName: string;
      accountType: string;
    }>;
    totalBankRecords: number;
    hasBankRecords: boolean;
  };

  // Step 7: Co-Applicant Documents (conditional)
  coApplicantDocuments?: {
    photo_id?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    pay_stubs?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    bank_statements?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    tax_returns?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    social_security?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
  };

  // Step 8: Other Occupants
  otherOccupants?: Array<{
    name: string;
    relationship: string;
    dob: string;
    ssn: string;
    license: string;
    age: number;
    ssnDocument?: string | null;
    ssnEncryptedDocument?: string | null;
  }>;
  otherOccupantsDocuments?: {
    social_security1?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    social_security2?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    social_security3?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    social_security4?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
  };

  // Step 9: Guarantor (conditional)
  hasGuarantor?: boolean;
  guarantorName?: string;
  guarantorRelationship?: string;
  guarantorDob?: string;
  guarantorSsn?: string;
  guarantorPhone?: string;
  guarantorEmail?: string;
  guarantorLicense?: string;
  guarantorLicenseState?: string;
  guarantorAddress?: string;
  guarantorCity?: string;
  guarantorState?: string;
  guarantorZip?: string;
  guarantorLengthAtAddressYears?: number;
  guarantorLengthAtAddressMonths?: number;
  guarantorLandlordName?: string;
  guarantorLandlordAddressLine1?: string;
  guarantorLandlordAddressLine2?: string;
  guarantorLandlordCity?: string;
  guarantorLandlordState?: string;
  guarantorLandlordZipCode?: string;
  guarantorLandlordPhone?: string;
  guarantorLandlordEmail?: string;
  guarantorCurrentRent?: number;
  guarantorReasonForMoving?: string;

  // Step 10: Guarantor Financial (conditional)
  guarantorEmploymentType?: string;
  guarantorPosition?: string;
  guarantorStartDate?: string | null;
  guarantorBankInformation?: {
    bankRecords: Array<{
      bankName: string;
      accountType: string;
    }>;
    totalBankRecords: number;
    hasBankRecords: boolean;
  };

  // Step 11: Guarantor Documents (conditional)
  guarantorDocuments?: {
    photo_id?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    pay_stubs?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    bank_statements?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    tax_returns?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
    social_security?: Array<{
      filename: string;
      webhookbodyUrl: string;
    }>;
  };

  // Step 12: Digital Signatures
  signatures?: {
    applicant?: string;
    coApplicant?: string;
    guarantor?: string;
  };
  signatureTimestamps?: {
    applicant?: string;
    coApplicant?: string;
    guarantor?: string;
  };

  // File management (legacy support)
  webhookResponses?: Record<string, string>;
  uploadedFilesMetadata?: Record<string, Array<{
    file_name: string;
    file_size: number;
    mime_type: string;
    upload_date: string;
  }>>;

  // Legacy field names for backward compatibility
  documents?: Record<string, any>;
  bankInformation?: Record<string, any>;
}

export class DraftService {
  private static readonly API_BASE = '/api';
  
  /**
   * Save draft data to DynamoDB
   */
  static async saveDraft(draftData: DraftData): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('💾 Saving draft data:', {
        applicantId: draftData.applicantId,
        currentStep: draftData.currentStep,
        dataSize: JSON.stringify(draftData).length
      });
      
      const response = await fetch(`${this.API_BASE}/save-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draftData,
          applicantId: draftData.applicantId,
          action: 'save'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Draft saved successfully:', result);
      
      return {
        success: true,
        message: result.message || 'Draft saved successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to save draft:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Load draft data from DynamoDB
   */
  static async loadDraft(applicantId: string): Promise<{ success: boolean; data?: DraftData; error?: string }> {
    try {
      console.log('🔍 Loading draft for applicant:', applicantId);
      
      const response = await fetch(`${this.API_BASE}/get-draft?applicantId=${encodeURIComponent(applicantId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('📭 No draft found for applicant:', applicantId);
          return {
            success: true,
            data: undefined // No draft exists
          };
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Draft loaded successfully:', {
        applicantId: result.applicantId,
        currentStep: result.currentStep,
        lastSaved: result.lastSaved
      });
      
      // Transform the response to match our DraftData interface
      const draftData: DraftData = {
        applicantId: result.applicantId,
        currentStep: result.currentStep || 0,
        isComplete: result.isComplete || false,
        lastSaved: result.lastSaved,
        version: result.version || '1.0',
        compressed: result.compressed || false,
        
        // Map form data from the response - extract from formData field
        buildingAddress: result.formData?.buildingAddress || result.buildingAddress,
        apartmentNumber: result.formData?.apartmentNumber || result.apartmentNumber,
        moveInDate: result.formData?.moveInDate || result.moveInDate,
        monthlyRent: result.formData?.monthlyRent || result.monthlyRent,
        apartmentType: result.formData?.apartmentType || result.apartmentType,
        howDidYouHear: result.formData?.howDidYouHear || result.howDidYouHear,
        applicantName: result.formData?.applicantName || result.applicantName,
        applicantDob: result.formData?.applicantDob || result.applicantDob,
        applicantSsn: result.formData?.applicantSsn || result.applicantSsn,
        applicantPhone: result.formData?.applicantPhone || result.applicantPhone,
        applicantEmail: result.formData?.applicantEmail || result.applicantEmail,
        applicantLicense: result.formData?.applicantLicense || result.applicantLicense,
        applicantLicenseState: result.formData?.applicantLicenseState || result.applicantLicenseState,
        applicantAddress: result.formData?.applicantAddress || result.applicantAddress,
        applicantCity: result.formData?.applicantCity || result.applicantCity,
        applicantState: result.formData?.applicantState || result.applicantState,
        applicantZip: result.formData?.applicantZip || result.applicantZip,
        applicantLengthAtAddressYears: result.formData?.applicantLengthAtAddressYears || result.applicantLengthAtAddressYears,
        applicantLengthAtAddressMonths: result.formData?.applicantLengthAtAddressMonths || result.applicantLengthAtAddressMonths,
        applicantLandlordName: result.formData?.applicantLandlordName || result.applicantLandlordName,
        applicantLandlordAddressLine1: result.formData?.applicantLandlordAddressLine1 || result.applicantLandlordAddressLine1,
        applicantLandlordAddressLine2: result.formData?.applicantLandlordAddressLine2 || result.applicantLandlordAddressLine2,
        applicantLandlordCity: result.formData?.applicantLandlordCity || result.applicantLandlordCity,
        applicantLandlordState: result.formData?.applicantLandlordState || result.applicantLandlordState,
        applicantLandlordZipCode: result.formData?.applicantLandlordZipCode || result.applicantLandlordZipCode,
        applicantLandlordPhone: result.formData?.applicantLandlordPhone || result.applicantLandlordPhone,
        applicantLandlordEmail: result.formData?.applicantLandlordEmail || result.applicantLandlordEmail,
        applicantCurrentRent: result.formData?.applicantCurrentRent || result.applicantCurrentRent,
        applicantReasonForMoving: result.formData?.applicantReasonForMoving || result.applicantReasonForMoving,
        applicantEmploymentType: result.formData?.applicantEmploymentType || result.applicantEmploymentType,
        applicantPosition: result.formData?.applicantPosition || result.applicantPosition,
        applicantStartDate: result.formData?.applicantStartDate || result.applicantStartDate,
        applicantBankInformation: result.formData?.applicantBankInformation || result.applicantBankInformation,
        applicantDocuments: result.formData?.applicantDocuments || result.applicantDocuments,
        hasCoApplicant: result.formData?.hasCoApplicant || result.hasCoApplicant,
        coApplicantName: result.formData?.coApplicantName || result.coApplicantName,
        coApplicantRelationship: result.formData?.coApplicantRelationship || result.coApplicantRelationship,
        coApplicantDob: result.formData?.coApplicantDob || result.coApplicantDob,
        coApplicantSsn: result.formData?.coApplicantSsn || result.coApplicantSsn,
        coApplicantPhone: result.formData?.coApplicantPhone || result.coApplicantPhone,
        coApplicantEmail: result.formData?.coApplicantEmail || result.coApplicantEmail,
        coApplicantLicense: result.formData?.coApplicantLicense || result.coApplicantLicense,
        coApplicantLicenseState: result.formData?.coApplicantLicenseState || result.coApplicantLicenseState,
        coApplicantCity: result.formData?.coApplicantCity || result.coApplicantCity,
        coApplicantState: result.formData?.coApplicantState || result.coApplicantState,
        coApplicantZip: result.formData?.coApplicantZip || result.coApplicantZip,
        coApplicantLengthAtAddressYears: result.formData?.coApplicantLengthAtAddressYears || result.coApplicantLengthAtAddressYears,
        coApplicantLengthAtAddressMonths: result.formData?.coApplicantLengthAtAddressMonths || result.coApplicantLengthAtAddressMonths,
        coApplicantLandlordName: result.formData?.coApplicantLandlordName || result.coApplicantLandlordName,
        coApplicantLandlordAddressLine1: result.formData?.coApplicantLandlordAddressLine1 || result.coApplicantLandlordAddressLine1,
        coApplicantLandlordAddressLine2: result.formData?.coApplicantLandlordAddressLine2 || result.coApplicantLandlordAddressLine2,
        coApplicantLandlordCity: result.formData?.coApplicantLandlordCity || result.coApplicantLandlordCity,
        coApplicantLandlordState: result.formData?.coApplicantLandlordState || result.coApplicantLandlordState,
        coApplicantLandlordZipCode: result.formData?.coApplicantLandlordZipCode || result.coApplicantLandlordZipCode,
        coApplicantLandlordPhone: result.formData?.coApplicantLandlordPhone || result.coApplicantLandlordPhone,
        coApplicantLandlordEmail: result.formData?.coApplicantLandlordEmail || result.coApplicantLandlordEmail,
        coApplicantCurrentRent: result.formData?.coApplicantCurrentRent || result.coApplicantCurrentRent,
        coApplicantReasonForMoving: result.formData?.coApplicantReasonForMoving || result.coApplicantReasonForMoving,
        coApplicantEmploymentType: result.formData?.coApplicantEmploymentType || result.coApplicantEmploymentType,
        coApplicantPosition: result.formData?.coApplicantPosition || result.coApplicantPosition,
        coApplicantStartDate: result.formData?.coApplicantStartDate || result.coApplicantStartDate,
        coApplicantBankInformation: result.formData?.coApplicantBankInformation || result.coApplicantBankInformation,
        coApplicantDocuments: result.formData?.coApplicantDocuments || result.coApplicantDocuments,
        otherOccupants: result.formData?.otherOccupants || result.otherOccupants,
        hasGuarantor: result.formData?.hasGuarantor || result.hasGuarantor,
        guarantorName: result.formData?.guarantorName || result.guarantorName,
        guarantorRelationship: result.formData?.guarantorRelationship || result.guarantorRelationship,
        guarantorDob: result.formData?.guarantorDob || result.guarantorDob,
        guarantorSsn: result.formData?.guarantorSsn || result.guarantorSsn,
        guarantorPhone: result.formData?.guarantorPhone || result.guarantorPhone,
        guarantorEmail: result.formData?.guarantorEmail || result.guarantorEmail,
        guarantorLicense: result.formData?.guarantorLicense || result.guarantorLicense,
        guarantorLicenseState: result.formData?.guarantorLicenseState || result.guarantorLicenseState,
        guarantorAddress: result.formData?.guarantorAddress || result.guarantorAddress,
        guarantorCity: result.formData?.guarantorCity || result.guarantorCity,
        guarantorState: result.formData?.guarantorState || result.guarantorState,
        guarantorZip: result.formData?.guarantorZip || result.guarantorZip,
        guarantorLengthAtAddressYears: result.formData?.guarantorLengthAtAddressYears || result.guarantorLengthAtAddressYears,
        guarantorLengthAtAddressMonths: result.formData?.guarantorLengthAtAddressMonths || result.guarantorLengthAtAddressMonths,
        guarantorLandlordName: result.formData?.guarantorLandlordName || result.guarantorLandlordName,
        guarantorLandlordAddressLine1: result.formData?.guarantorLandlordAddressLine1 || result.guarantorLandlordAddressLine1,
        guarantorLandlordAddressLine2: result.formData?.guarantorLandlordAddressLine2 || result.guarantorLandlordAddressLine2,
        guarantorLandlordCity: result.formData?.guarantorLandlordCity || result.guarantorLandlordCity,
        guarantorLandlordState: result.formData?.guarantorLandlordState || result.guarantorLandlordState,
        guarantorLandlordZipCode: result.formData?.guarantorLandlordZipCode || result.guarantorLandlordZipCode,
        guarantorLandlordPhone: result.formData?.guarantorLandlordPhone || result.guarantorLandlordPhone,
        guarantorLandlordEmail: result.formData?.guarantorLandlordEmail || result.guarantorLandlordEmail,
        guarantorCurrentRent: result.formData?.guarantorCurrentRent || result.guarantorCurrentRent,
        guarantorReasonForMoving: result.formData?.guarantorReasonForMoving || result.guarantorReasonForMoving,
        guarantorEmploymentType: result.formData?.guarantorEmploymentType || result.guarantorEmploymentType,
        guarantorPosition: result.formData?.guarantorPosition || result.guarantorPosition,
        guarantorStartDate: result.formData?.guarantorStartDate || result.guarantorStartDate,
        guarantorBankInformation: result.formData?.guarantorBankInformation || result.guarantorBankInformation,
        guarantorDocuments: result.formData?.guarantorDocuments || result.guarantorDocuments,
        signatures: result.signatures,
        signatureTimestamps: result.signatureTimestamps,
        webhookResponses: result.webhookResponses || {},
        uploadedFilesMetadata: result.uploadedFilesMetadata || {}
      };
      
      return {
        success: true,
        data: draftData
      };
      
    } catch (error) {
      console.error('❌ Failed to load draft:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Auto-save draft with debouncing
   */
  private static saveTimeout: NodeJS.Timeout | null = null;
  
  static autoSaveDraft(draftData: DraftData, delay: number = 2000): void {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Set new timeout for auto-save
    this.saveTimeout = setTimeout(async () => {
      console.log('🔄 Auto-saving draft...');
      await this.saveDraft(draftData);
    }, delay);
  }
  
  /**
   * Clear auto-save timeout
   */
  static clearAutoSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }
  
  /**
   * Create draft data from form state
   */
  static createDraftData(formData: any, applicantId: string, currentStep: number): DraftData {
    console.log('🔧 Creating draft data from form:', { formData, applicantId, currentStep });
    
    const draftData: DraftData = {
      applicantId,
      currentStep,
      lastSaved: new Date().toISOString(),
      isComplete: false,
      version: '1.0',
      compressed: false,
      
      // Step 1: Application Info - extract from flat structure
      buildingAddress: formData.buildingAddress,
      apartmentNumber: formData.apartmentNumber,
      moveInDate: formData.moveInDate,
      monthlyRent: formData.monthlyRent,
      apartmentType: formData.apartmentType,
      howDidYouHear: formData.howDidYouHear,
      
      // Step 2: Primary Applicant - extract from flat structure
      applicantName: formData.applicantName,
      applicantDob: formData.applicantDob,
      applicantSsn: formData.applicantSsn,
      applicantPhone: formData.applicantPhone,
      applicantEmail: formData.applicantEmail,
      applicantLicense: formData.applicantLicense,
      applicantLicenseState: formData.applicantLicenseState,
      applicantAddress: formData.applicantAddress,
      applicantCity: formData.applicantCity,
      applicantState: formData.applicantState,
      applicantZip: formData.applicantZip,
      applicantLengthAtAddressYears: formData.applicantLengthAtAddressYears,
      applicantLengthAtAddressMonths: formData.applicantLengthAtAddressMonths,
      applicantLandlordName: formData.applicantLandlordName,
      applicantLandlordAddressLine1: formData.applicantLandlordAddressLine1,
      applicantLandlordAddressLine2: formData.applicantLandlordAddressLine2,
      applicantLandlordCity: formData.applicantLandlordCity,
      applicantLandlordState: formData.applicantLandlordState,
      applicantLandlordZipCode: formData.applicantLandlordZipCode,
      applicantLandlordPhone: formData.applicantLandlordPhone,
      applicantLandlordEmail: formData.applicantLandlordEmail,
      applicantCurrentRent: formData.applicantCurrentRent,
      applicantReasonForMoving: formData.applicantReasonForMoving,
      
      // Step 3: Primary Applicant Financial - extract from flat structure
      applicantEmploymentType: formData.applicantEmploymentType,
      applicantPosition: formData.applicantPosition,
      applicantStartDate: formData.applicantStartDate,
      applicantBankInformation: formData.applicantBankInformation,
      
      // Step 4: Primary Applicant Documents - extract from flat structure
      applicantDocuments: formData.applicantDocuments,
      
      // Step 5: Co-Applicant (conditional) - extract from flat structure
      hasCoApplicant: formData.hasCoApplicant,
      coApplicantName: formData.coApplicantName,
      coApplicantRelationship: formData.coApplicantRelationship,
      coApplicantDob: formData.coApplicantDob,
      coApplicantSsn: formData.coApplicantSsn,
      coApplicantPhone: formData.coApplicantPhone,
      coApplicantEmail: formData.coApplicantEmail,
      coApplicantLicense: formData.coApplicantLicense,
      coApplicantLicenseState: formData.coApplicantLicenseState,
      coApplicantCity: formData.coApplicantCity,
      coApplicantState: formData.coApplicantState,
      coApplicantZip: formData.coApplicantZip,
      coApplicantLengthAtAddressYears: formData.coApplicantLengthAtAddressYears,
      coApplicantLengthAtAddressMonths: formData.coApplicantLengthAtAddressMonths,
      coApplicantLandlordName: formData.coApplicantLandlordName,
      coApplicantLandlordAddressLine1: formData.coApplicantLandlordAddressLine1,
      coApplicantLandlordAddressLine2: formData.coApplicantLandlordAddressLine2,
      coApplicantLandlordCity: formData.coApplicantLandlordCity,
      coApplicantLandlordState: formData.coApplicantLandlordState,
      coApplicantLandlordZipCode: formData.coApplicantLandlordZipCode,
      coApplicantLandlordPhone: formData.coApplicantLandlordPhone,
      coApplicantLandlordEmail: formData.coApplicantLandlordEmail,
      coApplicantCurrentRent: formData.coApplicantCurrentRent,
      coApplicantReasonForMoving: formData.coApplicantReasonForMoving,
      
      // Step 6: Co-Applicant Financial (conditional) - extract from flat structure
      coApplicantEmploymentType: formData.coApplicantEmploymentType,
      coApplicantPosition: formData.coApplicantPosition,
      coApplicantStartDate: formData.coApplicantStartDate,
      coApplicantBankInformation: formData.coApplicantBankInformation,
      
      // Step 7: Co-Applicant Documents (conditional) - extract from flat structure
      coApplicantDocuments: formData.coApplicantDocuments,
      
      // Step 8: Other Occupants - extract from flat structure
      otherOccupants: formData.otherOccupants || formData.occupants,
      otherOccupantsDocuments: formData.otherOccupantsDocuments,
      
      // Step 9: Guarantor (conditional) - extract from nested structure
      hasGuarantor: formData.hasGuarantor,
      guarantorName: formData.guarantor?.name,
      guarantorRelationship: formData.guarantor?.relationship,
      guarantorDob: formData.guarantor?.dob,
      guarantorSsn: formData.guarantor?.ssn,
      guarantorPhone: formData.guarantor?.phone,
      guarantorEmail: formData.guarantor?.email,
      guarantorLicense: formData.guarantor?.license,
      guarantorLicenseState: formData.guarantor?.licenseState,
      guarantorAddress: formData.guarantor?.address,
      guarantorCity: formData.guarantor?.city,
      guarantorState: formData.guarantor?.state,
      guarantorZip: formData.guarantor?.zip,
      guarantorLengthAtAddressYears: formData.guarantor?.lengthAtAddressYears,
      guarantorLengthAtAddressMonths: formData.guarantor?.lengthAtAddressMonths,
      guarantorLandlordName: formData.guarantor?.landlordName,
      guarantorLandlordAddressLine1: formData.guarantor?.landlordAddressLine1,
      guarantorLandlordAddressLine2: formData.guarantor?.landlordAddressLine2,
      guarantorLandlordCity: formData.guarantor?.landlordCity,
      guarantorLandlordState: formData.guarantor?.landlordState,
      guarantorLandlordZipCode: formData.guarantor?.landlordZipCode,
      guarantorLandlordPhone: formData.guarantor?.landlordPhone,
      guarantorLandlordEmail: formData.guarantor?.landlordEmail,
      guarantorCurrentRent: formData.guarantor?.currentRent,
      guarantorReasonForMoving: formData.guarantor?.reasonForMoving,
      
      // Step 10: Guarantor Financial (conditional) - extract from nested structure
      guarantorEmploymentType: formData.guarantor?.employmentType,
      guarantorPosition: formData.guarantor?.position,
      guarantorStartDate: formData.guarantor?.startDate,
      guarantorBankInformation: formData.guarantor?.bankInformation,
      
      // Step 11: Guarantor Documents (conditional) - extract from nested structure
      guarantorDocuments: formData.documents?.guarantor,
      
      // Step 12: Digital Signatures - extract from nested structure
      signatures: formData.signatures,
      signatureTimestamps: formData.signatureTimestamps,
      
      // File management - extract from nested structure or use provided values
      webhookResponses: formData.webhookResponses || {},
      uploadedFilesMetadata: formData.uploadedFilesMetadata || {},
      
      // Legacy field names for backward compatibility
      documents: formData.documents || {},
      bankInformation: formData.bankInformation || {},
    };
    
    console.log('📋 Draft data created:', {
      applicantId: draftData.applicantId,
      currentStep: draftData.currentStep,
      hasApplicationInfo: !!draftData.buildingAddress,
      hasApplicantInfo: !!draftData.applicantName,
      hasCoApplicant: draftData.hasCoApplicant,
      hasGuarantor: draftData.hasGuarantor,
      hasDocuments: !!draftData.documents,
      hasWebhookResponses: !!draftData.webhookResponses,
      dataSize: JSON.stringify(draftData).length
    });
    
    return draftData;
  }
}
