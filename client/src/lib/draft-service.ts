export interface DraftData {
  applicantId: string;
  currentStep: number;
  lastSaved: string;
  isComplete: boolean;
  
  // Form data organized by step
  applicationInfo?: {
    buildingAddress?: string;
    apartmentNumber?: string;
    moveInDate?: string;
    monthlyRent?: number;
    apartmentType?: string;
    howDidYouHear?: string;
    howDidYouHearOther?: string;
  };
  
  primaryApplicant?: {
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
  };
  
  primaryApplicantFinancial?: {
    applicantEmploymentType?: string;
    applicantPosition?: string;
    applicantStartDate?: string;
    bankInformation?: {
      applicant?: {
        bankRecords?: Array<{
          bankName: string;
          accountType: string;
        }>;
        totalBankRecords?: number;
        hasBankRecords?: boolean;
      };
    };
  };
  
  primaryApplicantDocuments?: {
    documents?: {
      applicant?: Record<string, Array<{ filename: string; webhookbodyUrl: string }>>;
    };
  };
  
  coApplicant?: {
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
  };
  
  coApplicantFinancial?: {
    coApplicantEmploymentType?: string;
    coApplicantPosition?: string;
    coApplicantStartDate?: string;
    bankInformation?: {
      coApplicant?: {
        bankRecords?: Array<{
          bankName: string;
          accountType: string;
        }>;
        totalBankRecords?: number;
        hasBankRecords?: boolean;
      };
    };
  };
  
  coApplicantDocuments?: {
    documents?: {
      coApplicant?: Record<string, Array<{ filename: string; webhookbodyUrl: string }>>;
    };
  };
  
  otherOccupants?: {
    otherOccupants?: Array<{
      name: string;
      relationship: string;
      dob: string;
      ssn: string;
      license: string;
      age: number;
      ssnDocument?: any;
      ssnEncryptedDocument?: any;
    }>;
    documents?: {
      otherOccupants?: Record<string, Array<{ filename: string; webhookbodyUrl: string }>>;
    };
  };
  
  guarantor?: {
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
  };
  
  guarantorFinancial?: {
    guarantorEmploymentType?: string;
    guarantorPosition?: string;
    guarantorStartDate?: string;
    bankInformation?: {
      guarantor?: {
        bankRecords?: Array<{
          bankName: string;
          accountType: string;
        }>;
        totalBankRecords?: number;
        hasBankRecords?: boolean;
      };
    };
  };
  
  guarantorDocuments?: {
    documents?: {
      guarantor?: Record<string, Array<{ filename: string; webhookbodyUrl: string }>>;
    };
  };
  
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
  
  // Webhook responses for file uploads
  webhookResponses?: Record<string, any>;
  
  // Uploaded files metadata
  uploadedFilesMetadata?: Record<string, any[]>;
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
        lastSaved: result.lastSaved,
        isComplete: result.isComplete || false,
        
        // Map form data from the response
        applicationInfo: result.formData?.application || result.formData?.applicationInfo,
        primaryApplicant: result.formData?.applicant || result.formData?.primaryApplicant,
        primaryApplicantFinancial: result.formData?.applicantFinancial || result.formData?.primaryApplicantFinancial,
        primaryApplicantDocuments: result.formData?.applicantDocuments || result.formData?.primaryApplicantDocuments,
        coApplicant: result.formData?.coApplicant || result.formData?.coApplicant,
        coApplicantFinancial: result.formData?.coApplicantFinancial || result.formData?.coApplicantFinancial,
        coApplicantDocuments: result.formData?.coApplicantDocuments || result.formData?.coApplicantDocuments,
        otherOccupants: result.formData?.otherOccupants || result.formData?.otherOccupants,
        guarantor: result.formData?.guarantor || result.formData?.guarantor,
        guarantorFinancial: result.formData?.guarantorFinancial || result.formData?.guarantorFinancial,
        guarantorDocuments: result.formData?.guarantorDocuments || result.formData?.guarantorDocuments,
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
  static createDraftData(
    applicantId: string,
    currentStep: number,
    formData: any,
    webhookResponses: Record<string, any> = {},
    uploadedFilesMetadata: Record<string, any[]> = {}
  ): DraftData {
    return {
      applicantId,
      currentStep,
      lastSaved: new Date().toISOString(),
      isComplete: false,
      
      // Map form data to draft structure
      applicationInfo: {
        buildingAddress: formData.application?.buildingAddress,
        apartmentNumber: formData.application?.apartmentNumber,
        moveInDate: formData.application?.moveInDate,
        monthlyRent: formData.application?.monthlyRent,
        apartmentType: formData.application?.apartmentType,
        howDidYouHear: formData.application?.howDidYouHear,
        howDidYouHearOther: formData.application?.howDidYouHearOther
      },
      
      primaryApplicant: {
        applicantName: formData.applicant?.name,
        applicantDob: formData.applicant?.dob,
        applicantSsn: formData.applicant?.ssn,
        applicantPhone: formData.applicant?.phone,
        applicantEmail: formData.applicant?.email,
        applicantLicense: formData.applicant?.license,
        applicantLicenseState: formData.applicant?.licenseState,
        applicantAddress: formData.applicant?.address,
        applicantCity: formData.applicant?.city,
        applicantState: formData.applicant?.state,
        applicantZip: formData.applicant?.zip,
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
        applicantReasonForMoving: formData.applicant?.reasonForMoving
      },
      
      primaryApplicantFinancial: {
        applicantEmploymentType: formData.applicant?.employmentType,
        applicantPosition: formData.applicant?.position,
        applicantStartDate: formData.applicant?.startDate,
        bankInformation: formData.applicant?.bankInformation
      },
      
      primaryApplicantDocuments: {
        documents: formData.documents?.applicant
      },
      
      coApplicant: {
        hasCoApplicant: formData.hasCoApplicant,
        coApplicantName: formData.coApplicant?.name,
        coApplicantRelationship: formData.coApplicant?.relationship,
        coApplicantDob: formData.coApplicant?.dob,
        coApplicantSsn: formData.coApplicant?.ssn,
        coApplicantPhone: formData.coApplicant?.phone,
        coApplicantEmail: formData.coApplicant?.email,
        coApplicantLicense: formData.coApplicant?.license,
        coApplicantLicenseState: formData.coApplicant?.licenseState,
        coApplicantCity: formData.coApplicant?.city,
        coApplicantState: formData.coApplicant?.state,
        coApplicantZip: formData.coApplicant?.zip,
        coApplicantLengthAtAddressYears: formData.coApplicant?.lengthAtAddressYears,
        coApplicantLengthAtAddressMonths: formData.coApplicant?.lengthAtAddressMonths,
        coApplicantLandlordName: formData.coApplicant?.landlordName,
        coApplicantLandlordAddressLine1: formData.coApplicant?.landlordAddressLine1,
        coApplicantLandlordAddressLine2: formData.coApplicant?.landlordAddressLine2,
        coApplicantLandlordCity: formData.coApplicant?.landlordCity,
        coApplicantLandlordState: formData.coApplicant?.landlordState,
        coApplicantLandlordZipCode: formData.coApplicant?.landlordZipCode,
        coApplicantLandlordPhone: formData.coApplicant?.landlordPhone,
        coApplicantLandlordEmail: formData.coApplicant?.landlordEmail,
        coApplicantCurrentRent: formData.coApplicant?.currentRent,
        coApplicantReasonForMoving: formData.coApplicant?.reasonForMoving
      },
      
      coApplicantFinancial: {
        coApplicantEmploymentType: formData.coApplicant?.employmentType,
        coApplicantPosition: formData.coApplicant?.position,
        coApplicantStartDate: formData.coApplicant?.startDate,
        bankInformation: formData.coApplicant?.bankInformation
      },
      
      coApplicantDocuments: {
        documents: formData.documents?.coApplicant
      },
      
      otherOccupants: {
        otherOccupants: formData.otherOccupants || formData.occupants,
        documents: formData.documents?.otherOccupants
      },
      
      guarantor: {
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
        guarantorReasonForMoving: formData.guarantor?.reasonForMoving
      },
      
      guarantorFinancial: {
        guarantorEmploymentType: formData.guarantor?.employmentType,
        guarantorPosition: formData.guarantor?.position,
        guarantorStartDate: formData.guarantor?.startDate,
        bankInformation: formData.guarantor?.bankInformation
      },
      
      guarantorDocuments: {
        documents: formData.documents?.guarantor
      },
      
      signatures: formData.signatures,
      signatureTimestamps: formData.signatureTimestamps,
      webhookResponses,
      uploadedFilesMetadata
    };
  }
}
