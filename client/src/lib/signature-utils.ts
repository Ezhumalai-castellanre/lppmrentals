/**
 * Signature utilities for handling form submissions and PDF generation
 */

export interface SignatureData {
  applicant?: string;
  coApplicants?: { [key: string]: string | null };
  guarantors?: { [key: string]: string | null };
}

export interface ProcessedSignature {
  type: 'image' | 'text' | 'none';
  data?: string;
  displayText: string;
}

/**
 * Process raw signature data to determine type and format for PDF generation
 */
export function processSignatureData(signatureData: any): ProcessedSignature {
    console.log('🔍 processSignatureData called with:', {
        type: typeof signatureData,
        isNull: signatureData === null,
        isUndefined: signatureData === undefined,
        isString: typeof signatureData === 'string',
        length: typeof signatureData === 'string' ? signatureData.length : 'N/A',
        startsWithDataImage: typeof signatureData === 'string' ? signatureData.startsWith('data:image/') : false,
        preview: typeof signatureData === 'string' ? signatureData.substring(0, 100) + '...' : signatureData
    });
    
    if (!signatureData) {
        console.log('🔍 No signature data, returning none');
        return { type: 'none', displayText: '[NOT SIGNED]' };
    }

    if (typeof signatureData === 'string') {
        if (signatureData.startsWith('data:image/')) {
            console.log('🔍 Base64 image signature detected');
            return { 
                type: 'image', 
                data: signatureData, 
                displayText: '[SIGNATURE IMAGE]' 
            };
        } else if (signatureData.trim() === '') {
            console.log('🔍 Empty string signature, returning none');
            return { type: 'none', displayText: '[NOT SIGNED]' };
        } else {
            console.log('🔍 Text signature detected:', signatureData);
            return { 
                type: 'text', 
                data: signatureData, 
                displayText: signatureData 
            };
        }
    }

    console.log('🔍 Non-string signature data, returning none');
    return { type: 'none', displayText: '[NOT SIGNED]' };
}

/**
 * Extract and organize signatures from form data for PDF generation
 */
export function extractSignaturesForPDF(formData: any): SignatureData {
    const signatures: SignatureData = {};
    
    console.log('🔍 Extracting signatures from form data:', formData);
    console.log('🔍 Raw signatures object:', formData.signatures);
    console.log('🔍 Co-applicants in form data:', formData.coApplicants?.length || 0);
    console.log('🔍 Guarantors in form data:', formData.guarantors?.length || 0);

    // Extract applicant signature
    if (formData.signatures?.applicant) {
        console.log('🔍 Applicant signature found:', typeof formData.signatures.applicant);
        signatures.applicant = formData.signatures.applicant;
    } else {
        console.log('🔍 No applicant signature found');
    }

    // Extract co-applicant signatures - ensure ALL co-applicants are represented
    if (formData.coApplicants && formData.coApplicants.length > 0) {
        console.log('🔍 Processing co-applicants for signatures:', formData.coApplicants.length);
        signatures.coApplicants = {};
        
        // Process ALL co-applicants, not just ones with signatures
        formData.coApplicants.forEach((co: any, index: number) => {
            const signatureKey = index.toString();
            console.log(`🔍 Processing co-applicant ${index + 1} with key:`, signatureKey);
            
            if (formData.signatures?.coApplicants?.[signatureKey]) {
                console.log(`🔍 Co-applicant ${index + 1} signature found:`, typeof formData.signatures.coApplicants[signatureKey]);
                signatures.coApplicants![signatureKey] = formData.signatures.coApplicants[signatureKey];
            } else {
                console.log(`🔍 Co-applicant ${index + 1} no signature found, adding placeholder`);
                signatures.coApplicants![signatureKey] = null; // This will show signature line in PDF
            }
        });
        
        console.log('🔍 Final co-applicant signatures object:', signatures.coApplicants);
    }

    // Extract guarantor signatures - ensure ALL guarantors are represented
    if (formData.guarantors && formData.guarantors.length > 0) {
        console.log('🔍 Processing guarantors for signatures:', formData.guarantors.length);
        signatures.guarantors = {};
        
        // Process ALL guarantors, not just ones with signatures
        formData.guarantors.forEach((g: any, index: number) => {
            const signatureKey = index.toString();
            console.log(`🔍 Processing guarantor ${index + 1} with key:`, signatureKey);
            
            if (formData.signatures?.guarantors?.[signatureKey]) {
                console.log(`🔍 Guarantor ${index + 1} signature found:`, typeof formData.signatures.guarantors[signatureKey]);
                signatures.guarantors![signatureKey] = formData.signatures.guarantors[signatureKey];
            } else {
                console.log(`🔍 Guarantor ${index + 1} no signature found, adding placeholder`);
                signatures.guarantors![signatureKey] = null; // This will show signature line in PDF
            }
        });
        
        console.log('🔍 Final guarantor signatures object:', signatures.guarantors);
    }

    console.log('🔍 Final extracted signatures:', signatures);
    return signatures;
}

/**
 * Validate signature data before form submission
 */
export function validateSignatures(signatures: SignatureData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if primary applicant has signed
  if (!signatures.applicant) {
    errors.push('Primary applicant signature is required');
  }

  // Check if all co-applicants have signed
  if (signatures.coApplicants) {
    Object.entries(signatures.coApplicants).forEach(([index, signature]) => {
      if (!signature) {
        errors.push(`Co-applicant ${parseInt(index) + 1} signature is required`);
      }
    });
  }

  // Check if all guarantors have signed
  if (signatures.guarantors) {
    Object.entries(signatures.guarantors).forEach(([index, signature]) => {
      if (!signature) {
        errors.push(`Guarantor ${parseInt(index) + 1} signature is required`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Convert signature data to a format suitable for server submission
 */
export function prepareSignaturesForSubmission(signatures: SignatureData): any {
  const submissionData: any = {};

  // Include applicant signature
  if (signatures.applicant) {
    submissionData.applicant = signatures.applicant;
  }

  // Include co-applicant signatures
  if (signatures.coApplicants && Object.keys(signatures.coApplicants).length > 0) {
    submissionData.coApplicants = signatures.coApplicants;
  }

  // Include guarantor signatures
  if (signatures.guarantors && Object.keys(signatures.guarantors).length > 0) {
    submissionData.guarantors = signatures.guarantors;
  }

  return submissionData;
}

/**
 * Check if a signature is a valid image data URL
 */
export function isValidImageSignature(signature: string): boolean {
  if (typeof signature !== 'string') return false;
  
  // Check if it's a valid data URL format
  const dataUrlRegex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
  if (!dataUrlRegex.test(signature)) return false;
  
  // Check if base64 data is present
  const base64Data = signature.split(',')[1];
  if (!base64Data || base64Data.length === 0) return false;
  
  return true;
}

/**
 * Get signature display text for PDF generation
 */
export function getSignatureDisplayText(signature: string): string {
  if (isValidImageSignature(signature)) {
    return '[SIGNATURE IMAGE]';
  }
  
  if (signature && signature.trim() !== '') {
    return signature.trim();
  }
  
  return '[NOT SIGNED]';
}
