/**
 * Tests for signature utilities
 */

import { 
  processSignatureData, 
  extractSignaturesForPDF, 
  validateSignatures, 
  prepareSignaturesForSubmission,
  isValidImageSignature,
  getSignatureDisplayText
} from './signature-utils';

describe('Signature Utilities', () => {
  describe('processSignatureData', () => {
    it('should process base64 image signatures', () => {
      const base64Signature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const result = processSignatureData(base64Signature);
      
      expect(result.type).toBe('image');
      expect(result.data).toBe(base64Signature);
      expect(result.displayText).toBe('[SIGNATURE IMAGE]');
    });

    it('should process text signatures', () => {
      const textSignature = 'John Doe';
      const result = processSignatureData(textSignature);
      
      expect(result.type).toBe('text');
      expect(result.data).toBe(textSignature);
      expect(result.displayText).toBe('John Doe');
    });

    it('should handle empty signatures', () => {
      const emptySignature = '';
      const result = processSignatureData(emptySignature);
      
      expect(result.type).toBe('none');
      expect(result.displayText).toBe('[NOT SIGNED]');
    });

    it('should handle null/undefined signatures', () => {
      const nullSignature = null;
      const result = processSignatureData(nullSignature);
      
      expect(result.type).toBe('none');
      expect(result.displayText).toBe('[NOT SIGNED]');
    });
  });

  describe('extractSignaturesForPDF', () => {
    it('should extract applicant signature', () => {
      const formData = {
        signatures: {
          applicant: 'data:image/png;base64,test',
          coApplicants: {},
          guarantors: {}
        }
      };
      
      const result = extractSignaturesForPDF(formData);
      
      expect(result.applicant).toBe('data:image/png;base64,test');
      expect(result.coApplicants).toEqual({});
      expect(result.guarantors).toEqual({});
    });

    it('should extract co-applicant signatures', () => {
      const formData = {
        signatures: {
          applicant: null,
          coApplicants: {
            '0': 'data:image/png;base64,co1',
            '1': 'data:image/png;base64,co2'
          },
          guarantors: {}
        }
      };
      
      const result = extractSignaturesForPDF(formData);
      
      expect(result.applicant).toBeUndefined();
      expect(result.coApplicants).toEqual({
        '0': 'data:image/png;base64,co1',
        '1': 'data:image/png;base64,co2'
      });
    });

    it('should handle missing signatures object', () => {
      const formData = {};
      
      const result = extractSignaturesForPDF(formData);
      
      expect(result.applicant).toBeUndefined();
      expect(result.coApplicants).toBeUndefined();
      expect(result.guarantors).toBeUndefined();
    });
  });

  describe('validateSignatures', () => {
    it('should validate complete signatures', () => {
      const signatures = {
        applicant: 'data:image/png;base64,test',
        coApplicants: {
          '0': 'data:image/png;base64,co1'
        },
        guarantors: {
          '0': 'data:image/png;base64,guarantor1'
        }
      };
      
      const result = validateSignatures(signatures);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing applicant signature', () => {
      const signatures = {
        applicant: null,
        coApplicants: {},
        guarantors: {}
      };
      
      const result = validateSignatures(signatures);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Primary applicant signature is required');
    });

    it('should detect missing co-applicant signatures', () => {
      const signatures = {
        applicant: 'data:image/png;base64,test',
        coApplicants: {
          '0': null,
          '1': 'data:image/png;base64,co2'
        },
        guarantors: {}
      };
      
      const result = validateSignatures(signatures);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Co-applicant 1 signature is required');
    });
  });

  describe('prepareSignaturesForSubmission', () => {
    it('should prepare signatures for submission', () => {
      const signatures = {
        applicant: 'data:image/png;base64,test',
        coApplicants: {
          '0': 'data:image/png;base64,co1'
        },
        guarantors: {
          '0': 'data:image/png;base64,guarantor1'
        }
      };
      
      const result = prepareSignaturesForSubmission(signatures);
      
      expect(result.applicant).toBe('data:image/png;base64,test');
      expect(result.coApplicants).toEqual({
        '0': 'data:image/png;base64,co1'
      });
      expect(result.guarantors).toEqual({
        '0': 'data:image/png;base64,guarantor1'
      });
    });

    it('should handle empty signature objects', () => {
      const signatures = {
        applicant: null,
        coApplicants: {},
        guarantors: {}
      };
      
      const result = prepareSignaturesForSubmission(signatures);
      
      expect(result.applicant).toBeUndefined();
      expect(result.coApplicants).toBeUndefined();
      expect(result.guarantors).toBeUndefined();
    });
  });

  describe('isValidImageSignature', () => {
    it('should validate valid base64 image signatures', () => {
      const validSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      expect(isValidImageSignature(validSignature)).toBe(true);
    });

    it('should reject invalid signatures', () => {
      const invalidSignatures = [
        'not-a-signature',
        'data:image/png;base64,',
        'data:text/plain;base64,test',
        '',
        null
      ];
      
      invalidSignatures.forEach(signature => {
        expect(isValidImageSignature(signature as string)).toBe(false);
      });
    });
  });

  describe('getSignatureDisplayText', () => {
    it('should return signature image text for base64', () => {
      const base64Signature = 'data:image/png;base64,test';
      
      expect(getSignatureDisplayText(base64Signature)).toBe('[SIGNATURE IMAGE]');
    });

    it('should return signature text for text signatures', () => {
      const textSignature = 'John Doe';
      
      expect(getSignatureDisplayText(textSignature)).toBe('John Doe');
    });

    it('should return not signed for empty/null', () => {
      expect(getSignatureDisplayText('')).toBe('[NOT SIGNED]');
      expect(getSignatureDisplayText(null as any)).toBe('[NOT SIGNED]');
    });
  });
});
