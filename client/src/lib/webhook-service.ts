export interface FileUploadWebhookData {
  reference_id: string;
  file_name: string;
  section_name: string;
  document_name: string;
  file_base64: string;
  application_id: string;
}

export interface FormDataWebhookData {
  reference_id: string;
  application_id: string;
  form_data: any;
  uploaded_files: {
    supporting_w9_forms: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    supporting_photo_id: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    supporting_social_security: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    supporting_bank_statement: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    supporting_tax_returns: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    supporting_employment_letter: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    supporting_pay_stubs: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    supporting_credit_report: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    coApplicant_w9_forms: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    coApplicant_photo_id: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    coApplicant_social_security: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    coApplicant_bank_statement: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    coApplicant_tax_returns: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    coApplicant_employment_letter: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    coApplicant_pay_stubs: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    coApplicant_credit_report: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    guarantor_w9_forms: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    guarantor_photo_id: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    guarantor_social_security: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    guarantor_bank_statement: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    guarantor_tax_returns: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    guarantor_employment_letter: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    guarantor_pay_stubs: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    guarantor_credit_report: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
    other_occupants_identity: {
      file_name: string;
      file_size: number;
      mime_type: string;
      upload_date: string;
    }[];
  };
  submission_type: 'form_data';
}

export interface PDFWebhookData {
  reference_id: string;
  application_id: string;
  file_name: string;
  file_base64: string;
  submission_type: 'pdf_generation';
}

export class WebhookService {
  private static readonly FILE_WEBHOOK_URL = 'https://hook.us1.make.com/2vu8udpshhdhjkoks8gchub16wjp7cu3';
  private static readonly FORM_WEBHOOK_URL = 'https://hook.us1.make.com/og5ih0pl1br72r1pko39iimh3hdl31hk';

  /**
   * Sends a file to the webhook immediately upon upload
   */
  static async sendFileToWebhook(
    file: File,
    referenceId: string,
    sectionName: string,
    documentName: string,
    applicationId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      const webhookData: FileUploadWebhookData = {
        reference_id: referenceId,
        file_name: file.name,
        section_name: sectionName,
        document_name: documentName,
        file_base64: base64,
        application_id: applicationId || 'unknown'
      };

      console.log(`Sending file ${file.name} to webhook for section ${sectionName} (Document: ${documentName})`);
      console.log('Webhook payload:', JSON.stringify(webhookData, null, 2));
      
      // Special logging for Guarantor documents
      if (sectionName.startsWith('guarantor_')) {
        console.log('🚀 GUARANTOR DOCUMENT UPLOAD:', {
          file_name: file.name,
          section_name: sectionName,
          reference_id: referenceId,
          application_id: applicationId,
          file_size: file.size,
          mime_type: file.type
        });
      }

      // Check file size before sending
      const fileSizeMB = Math.round(file.size / (1024 * 1024) * 100) / 100;
      console.log(`📦 File size: ${fileSizeMB}MB`);
      
      if (fileSizeMB > 10) {
        console.warn('⚠️ Large file detected:', fileSizeMB, 'MB');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for file uploads
      
      try {
        const response = await fetch(this.FILE_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Webhook failed:', response.status, errorText);
        return {
          success: false,
          error: `Webhook failed: ${response.status} - ${errorText}`
        };
      }

      console.log(`File ${file.name} sent to webhook successfully`);
      return { success: true };

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('File webhook request timed out after 60 seconds');
          return {
            success: false,
            error: 'File webhook request timed out'
          };
        }
        
        console.error('Error sending file to webhook:', fetchError);
        return {
          success: false,
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        };
      }

    } catch (error) {
      console.error('Error in sendFileToWebhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sends form data to the webhook
   */
  static async sendFormDataToWebhook(
    formData: any,
    referenceId: string,
    applicationId: string,
    uploadedFiles?: {
      supporting_w9_forms?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      supporting_photo_id?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      supporting_social_security?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      supporting_bank_statement?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      supporting_tax_returns?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      supporting_employment_letter?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      supporting_pay_stubs?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      supporting_credit_report?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      coApplicant_w9_forms?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      coApplicant_photo_id?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      coApplicant_social_security?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      coApplicant_bank_statement?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      coApplicant_tax_returns?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      coApplicant_employment_letter?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      coApplicant_pay_stubs?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      coApplicant_credit_report?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      guarantor_w9_forms?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      guarantor_photo_id?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      guarantor_social_security?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      guarantor_bank_statement?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      guarantor_tax_returns?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      guarantor_employment_letter?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      guarantor_pay_stubs?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      guarantor_credit_report?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
      other_occupants_identity?: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create a clean form data object without large file content
      const cleanFormData = { ...formData };
      
      // Remove large data that could cause payload size issues
      delete cleanFormData.documents;
      delete cleanFormData.encryptedDocuments;
      delete cleanFormData.uploaded_documents;
      delete cleanFormData.applicantBankRecords;
      delete cleanFormData.coApplicantBankRecords;
      delete cleanFormData.guarantorBankRecords;
      
      // Keep only essential metadata for files
      const webhookData: FormDataWebhookData = {
        reference_id: referenceId,
        application_id: applicationId,
        form_data: cleanFormData,
        uploaded_files: {
          supporting_w9_forms: uploadedFiles?.supporting_w9_forms || [],
          supporting_photo_id: uploadedFiles?.supporting_photo_id || [],
          supporting_social_security: uploadedFiles?.supporting_social_security || [],
          supporting_bank_statement: uploadedFiles?.supporting_bank_statement || [],
          supporting_tax_returns: uploadedFiles?.supporting_tax_returns || [],
          supporting_employment_letter: uploadedFiles?.supporting_employment_letter || [],
          supporting_pay_stubs: uploadedFiles?.supporting_pay_stubs || [],
          supporting_credit_report: uploadedFiles?.supporting_credit_report || [],
          coApplicant_w9_forms: uploadedFiles?.coApplicant_w9_forms || [],
          coApplicant_photo_id: uploadedFiles?.coApplicant_photo_id || [],
          coApplicant_social_security: uploadedFiles?.coApplicant_social_security || [],
          coApplicant_bank_statement: uploadedFiles?.coApplicant_bank_statement || [],
          coApplicant_tax_returns: uploadedFiles?.coApplicant_tax_returns || [],
          coApplicant_employment_letter: uploadedFiles?.coApplicant_employment_letter || [],
          coApplicant_pay_stubs: uploadedFiles?.coApplicant_pay_stubs || [],
          coApplicant_credit_report: uploadedFiles?.coApplicant_credit_report || [],
          guarantor_w9_forms: uploadedFiles?.guarantor_w9_forms || [],
          guarantor_photo_id: uploadedFiles?.guarantor_photo_id || [],
          guarantor_social_security: uploadedFiles?.guarantor_social_security || [],
          guarantor_bank_statement: uploadedFiles?.guarantor_bank_statement || [],
          guarantor_tax_returns: uploadedFiles?.guarantor_tax_returns || [],
          guarantor_employment_letter: uploadedFiles?.guarantor_employment_letter || [],
          guarantor_pay_stubs: uploadedFiles?.guarantor_pay_stubs || [],
          guarantor_credit_report: uploadedFiles?.guarantor_credit_report || [],
          other_occupants_identity: uploadedFiles?.other_occupants_identity || []
        },
        submission_type: 'form_data'
      };

      console.log(`Sending form data to webhook for application ${applicationId}`);
      
      // Log payload size for debugging
      const payloadSize = JSON.stringify(webhookData).length;
      const payloadSizeMB = Math.round(payloadSize / (1024 * 1024) * 100) / 100;
      console.log(`📦 Webhook payload size: ${payloadSizeMB}MB`);
      
      if (payloadSize > 5 * 1024 * 1024) { // 5MB limit
        console.warn('⚠️ Webhook payload is large:', payloadSizeMB, 'MB');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(this.FORM_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData),
          signal: controller.signal,
        });
        
                clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Webhook failed:', response.status, errorText);
          return {
            success: false,
            error: `Webhook failed: ${response.status} - ${errorText}`
          };
        }

        console.log(`Form data sent to webhook successfully`);
        return { success: true };

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('Webhook request timed out after 30 seconds');
          return {
            success: false,
            error: 'Webhook request timed out'
          };
        }
        
        console.error('Error sending form data to webhook:', fetchError);
        return {
          success: false,
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        };
      }

    } catch (error) {
      console.error('Error in sendFormDataToWebhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sends PDF generation to the webhook
   */
  static async sendPDFToWebhook(
    pdfBase64: string,
    referenceId: string,
    applicationId: string,
    fileName: string = 'rental-application.pdf'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const webhookData: PDFWebhookData = {
        reference_id: referenceId,
        application_id: applicationId,
        file_name: fileName,
        file_base64: pdfBase64,
        submission_type: 'pdf_generation'
      };

      console.log(`Sending PDF to webhook for application ${applicationId}`);

      // Check PDF size before sending
      const pdfSizeMB = Math.round(pdfBase64.length / (1024 * 1024) * 100) / 100;
      console.log(`📦 PDF size: ${pdfSizeMB}MB`);
      
      if (pdfSizeMB > 10) {
        console.warn('⚠️ Large PDF detected:', pdfSizeMB, 'MB');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for PDFs
      
      try {
        const response = await fetch(this.FILE_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Webhook failed:', response.status, errorText);
        return {
          success: false,
          error: `Webhook failed: ${response.status} - ${errorText}`
        };
      }

      console.log(`PDF sent to webhook successfully`);
      return { success: true };

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('PDF webhook request timed out after 45 seconds');
          return {
            success: false,
            error: 'PDF webhook request timed out'
          };
        }
        
        console.error('Error sending PDF to webhook:', fetchError);
        return {
          success: false,
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        };
      }

    } catch (error) {
      console.error('Error in sendPDFToWebhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Converts a file to base64 string
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
} 