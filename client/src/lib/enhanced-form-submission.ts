// Enhanced Form Submission Handler
import { AppError, ErrorCategory, ErrorSeverity, errorHandler, handleNetworkError, handleServerError } from './error-handler';
import { ValidationResult, validateFormSection } from './enhanced-validation';

// Form submission options
interface FormSubmissionOptions {
  validateBeforeSubmit?: boolean;
  showProgress?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  onProgress?: (progress: number) => void;
  onValidationError?: (errors: AppError[]) => void;
  onNetworkError?: (error: AppError) => void;
  onServerError?: (error: AppError) => void;
  onSuccess?: (data: any) => void;
  onComplete?: () => void;
}

// Form submission result
interface FormSubmissionResult {
  success: boolean;
  data?: any;
  errors: AppError[];
  validationErrors: AppError[];
  networkErrors: AppError[];
  serverErrors: AppError[];
}

// Enhanced form submission handler
export class FormSubmissionHandler {
  private static instance: FormSubmissionHandler;
  private activeSubmissions = new Map<string, AbortController>();

  private constructor() {}

  public static getInstance(): FormSubmissionHandler {
    if (!FormSubmissionHandler.instance) {
      FormSubmissionHandler.instance = new FormSubmissionHandler();
    }
    return FormSubmissionHandler.instance;
  }

  // Submit form with enhanced error handling
  public async submitForm<T = any>(
    submissionId: string,
    formData: any,
    submitFunction: (data: any, signal?: AbortSignal) => Promise<T>,
    options: FormSubmissionOptions = {}
  ): Promise<FormSubmissionResult> {
    const {
      validateBeforeSubmit = true,
      showProgress = true,
      retryAttempts = 3,
      retryDelay = 1000,
      onProgress,
      onValidationError,
      onNetworkError,
      onServerError,
      onSuccess,
      onComplete
    } = options;

    // Create abort controller for this submission
    const abortController = new AbortController();
    this.activeSubmissions.set(submissionId, abortController);

    const result: FormSubmissionResult = {
      success: false,
      errors: [],
      validationErrors: [],
      networkErrors: [],
      serverErrors: []
    };

    try {
      // Step 1: Validation
      if (validateBeforeSubmit) {
        onProgress?.(10);
        const validationErrors = await this.validateFormData(formData);
        
        if (validationErrors.length > 0) {
          result.validationErrors = validationErrors;
          result.errors = [...result.errors, ...validationErrors];
          
          validationErrors.forEach(error => errorHandler.addError(error));
          onValidationError?.(validationErrors);
          
          return result;
        }
      }

      // Step 2: Prepare submission data
      onProgress?.(20);
      const preparedData = await this.prepareSubmissionData(formData);

      // Step 3: Submit with retry logic
      onProgress?.(30);
      let lastError: AppError | null = null;
      
      for (let attempt = 1; attempt <= retryAttempts; attempt++) {
        try {
          const response = await submitFunction(preparedData, abortController.signal);
          
          result.success = true;
          result.data = response;
          onSuccess?.(response);
          onProgress?.(100);
          
          break;
        } catch (error: any) {
          lastError = this.handleSubmissionError(error, attempt, retryAttempts);
          
          if (lastError.category === ErrorCategory.NETWORK) {
            result.networkErrors.push(lastError);
            onNetworkError?.(lastError);
          } else if (lastError.category === ErrorCategory.SERVER) {
            result.serverErrors.push(lastError);
            onServerError?.(lastError);
          }
          
          result.errors.push(lastError);
          errorHandler.addError(lastError);
          
          // Don't retry on validation or authentication errors
          if (lastError.category === ErrorCategory.VALIDATION || 
              lastError.category === ErrorCategory.AUTHENTICATION) {
            break;
          }
          
          // Wait before retry (except on last attempt)
          if (attempt < retryAttempts) {
            await this.delay(retryDelay * attempt);
          }
        }
      }

    } catch (error: any) {
      const appError = this.handleSubmissionError(error, 1, 1);
      result.errors.push(appError);
      errorHandler.addError(appError);
    } finally {
      // Cleanup
      this.activeSubmissions.delete(submissionId);
      onComplete?.();
    }

    return result;
  }

  // Cancel active submission
  public cancelSubmission(submissionId: string): void {
    const controller = this.activeSubmissions.get(submissionId);
    if (controller) {
      controller.abort();
      this.activeSubmissions.delete(submissionId);
    }
  }

  // Cancel all active submissions
  public cancelAllSubmissions(): void {
    this.activeSubmissions.forEach(controller => controller.abort());
    this.activeSubmissions.clear();
  }

  // Validate form data
  private async validateFormData(formData: any): Promise<AppError[]> {
    const errors: AppError[] = [];

    // Validate application section
    if (formData.application) {
      const validationResults = validateFormSection('application', formData.application);
      validationResults.forEach(result => {
        if (!result.isValid) {
          errors.push(errorHandler.createValidationError(result, result.field, { section: 'application' }));
        }
      });
    }

    // Validate applicant section
    if (formData.applicant) {
      const validationResults = validateFormSection('applicant', formData.applicant);
      validationResults.forEach(result => {
        if (!result.isValid) {
          errors.push(errorHandler.createValidationError(result, result.field, { section: 'applicant' }));
        }
      });
    }

    // Validate co-applicants
    if (formData.coApplicants && Array.isArray(formData.coApplicants)) {
      formData.coApplicants.forEach((coApplicant: any, index: number) => {
        const validationResults = validateFormSection('coApplicant', coApplicant);
        validationResults.forEach(result => {
          if (!result.isValid) {
            errors.push(errorHandler.createValidationError(result, result.field, { 
              section: 'coApplicant', 
              index 
            }));
          }
        });
      });
    }

    // Validate guarantors
    if (formData.guarantors && Array.isArray(formData.guarantors)) {
      formData.guarantors.forEach((guarantor: any, index: number) => {
        const validationResults = validateFormSection('guarantor', guarantor);
        validationResults.forEach(result => {
          if (!result.isValid) {
            errors.push(errorHandler.createValidationError(result, result.field, { 
              section: 'guarantor', 
              index 
            }));
          }
        });
      });
    }

    return errors;
  }

  // Prepare submission data
  private async prepareSubmissionData(formData: any): Promise<any> {
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
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T00:00:00.000Z`;
      } catch (error) {
        console.warn('Error converting date to ISO:', dateValue, error);
        return null;
      }
    };

    // Helper function to format phone numbers
    const formatPhoneForPayload = (phone: string | undefined | null): string | null => {
      if (!phone || phone.trim() === '') return null;
      const digits = phone.replace(/\D/g, '');
      return digits.length === 10 ? `+1${digits}` : digits.length === 11 ? `+${digits}` : null;
    };

    // Create complete form data structure
    const completeData = {
      // Application Info
      application: {
        buildingAddress: formData.application?.buildingAddress,
        apartmentNumber: formData.application?.apartmentNumber,
        apartmentType: formData.application?.apartmentType,
        monthlyRent: formData.application?.monthlyRent,
        moveInDate: safeDateToISO(formData.application?.moveInDate),
        howDidYouHear: formData.application?.howDidYouHear,
        howDidYouHearOther: formData.application?.howDidYouHearOther,
      },
      
      // Primary Applicant
      applicant: {
        name: formData.applicant?.name,
        dob: safeDateToISO(formData.applicant?.dob),
        ssn: formData.applicant?.ssn,
        phone: formatPhoneForPayload(formData.applicant?.phone),
        email: formData.applicant?.email,
        license: formData.applicant?.license,
        licenseState: formData.applicant?.licenseState,
        address: formData.applicant?.address,
        city: formData.applicant?.city,
        state: formData.applicant?.state,
        zip: formData.applicant?.zip,
        // ... other applicant fields
      },
      
      // Co-Applicants
      coApplicants: formData.coApplicants?.map((coApplicant: any, index: number) => ({
        coApplicant: (index + 1).toString(), // Dynamic type field
        name: coApplicant.name,
        dob: safeDateToISO(coApplicant.dob),
        ssn: coApplicant.ssn,
        phone: formatPhoneForPayload(coApplicant.phone),
        email: coApplicant.email,
        license: coApplicant.license,
        licenseState: coApplicant.licenseState,
        address: coApplicant.address,
        city: coApplicant.city,
        state: coApplicant.state,
        zip: coApplicant.zip,
        // ... other co-applicant fields
      })) || [],
      
      // Guarantors
      guarantors: formData.guarantors?.map((guarantor: any, index: number) => ({
        guarantor: (index + 1).toString(), // Dynamic type field
        name: guarantor.name,
        dob: safeDateToISO(guarantor.dob),
        ssn: guarantor.ssn,
        phone: formatPhoneForPayload(guarantor.phone),
        email: guarantor.email,
        license: guarantor.license,
        licenseState: guarantor.licenseState,
        address: guarantor.address,
        city: guarantor.city,
        state: guarantor.state,
        zip: guarantor.zip,
        // ... other guarantor fields
      })) || [],
      
      // Other form data
      otherOccupants: formData.otherOccupants || [],
      documents: formData.documents || [],
      signatures: formData.signatures || {},
      
      // Metadata
      submittedAt: new Date().toISOString(),
      version: '1.0'
    };

    return completeData;
  }

  // Handle submission errors
  private handleSubmissionError(error: any, attempt: number, maxAttempts: number): AppError {
    // Check if it's an abort error
    if (error.name === 'AbortError') {
      return errorHandler.createServerError('Submission cancelled', 'User cancelled the submission');
    }

    // Check if it's a network error
    if (!error.response && (error.code === 'NETWORK_ERROR' || error.message?.includes('network'))) {
      return handleNetworkError(error, { attempt, maxAttempts });
    }

    // Check if it's a server error
    if (error.response?.status >= 500) {
      return handleServerError(error, { attempt, maxAttempts });
    }

    // Check if it's an authentication error
    if (error.response?.status === 401) {
      return errorHandler.createAuthError('Authentication failed', error.response?.data?.message);
    }

    // Check if it's an authorization error
    if (error.response?.status === 403) {
      return errorHandler.createServerError('Access denied', error.response?.data?.message);
    }

    // Check if it's a validation error
    if (error.response?.status === 400) {
      return errorHandler.createValidationError(
        { isValid: false, message: error.response?.data?.message || 'Invalid form data' },
        undefined,
        { attempt, maxAttempts }
      );
    }

    // Default to server error
    return handleServerError(error, { attempt, maxAttempts });
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const formSubmissionHandler = FormSubmissionHandler.getInstance();

// Utility function for form submission
export const submitFormWithErrorHandling = async <T = any>(
  submissionId: string,
  formData: any,
  submitFunction: (data: any, signal?: AbortSignal) => Promise<T>,
  options: FormSubmissionOptions = {}
): Promise<FormSubmissionResult> => {
  return formSubmissionHandler.submitForm(submissionId, formData, submitFunction, options);
};
