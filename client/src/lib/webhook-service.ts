export interface FileUploadWebhookData {
  reference_id: string;
  file_name: string;
  section_name: string;
  document_name: string;
  file_base64: string;
  application_id: string;
  applicant_id?: string;
  zoneinfo?: string;
  user_email?: string;
  user_name?: string;
  user_given_name?: string;
  user_family_name?: string;
  user_phone_number?: string;
}

export interface FormDataWebhookData {
  reference_id: string;
  application_id: string;
  applicant_id?: string;
  zoneinfo?: string;
  user_email?: string;
  user_name?: string;
  user_given_name?: string;
  user_family_name?: string;
  user_phone_number?: string;
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
  applicant_id?: string;
  file_name: string;
  file_base64: string;
  submission_type: 'pdf_generation';
}

export class WebhookService {
  private static readonly FILE_WEBHOOK_URL = 'https://hook.us1.make.com/2vu8udpshhdhjkoks8gchub16wjp7cu3';
  private static readonly FORM_WEBHOOK_URL = 'https://hook.us1.make.com/og5ih0pl1br72r1pko39iimh3hdl31hk'; // Use external webhook for form data
  
  // Track ongoing submissions to prevent duplicates
  private static ongoingSubmissions = new Set<string>();
  
  // Track individual file uploads to prevent duplicates
  private static ongoingFileUploads = new Set<string>();
  
  // Track failed uploads to prevent retries
  private static failedUploads = new Set<string>();

  /**
   * Sends a file to the webhook immediately upon upload
   */
  static async sendFileToWebhook(
    file: File,
    referenceId: string,
    sectionName: string,
    documentName: string,
    applicationId?: string,
    applicantId?: string,
    userAttributes?: {
      zoneinfo?: string;
      email?: string;
      name?: string;
      given_name?: string;
      family_name?: string;
      phone_number?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    // Create a unique key for this file upload
    const fileUploadKey = `${referenceId}-${sectionName}-${file.name}-${file.size}`;
    
    // Check if this exact file upload is already in progress
    if (this.ongoingFileUploads.has(fileUploadKey)) {
      console.log(`⚠️ File upload already in progress, skipping: ${file.name}`);
      return { success: false, error: 'File upload already in progress' };
    }
    
    // Check if this file upload previously failed
    if (this.failedUploads.has(fileUploadKey)) {
      console.log(`⚠️ File upload previously failed, skipping: ${file.name}`);
      return { success: false, error: 'File upload previously failed' };
    }
    
    // Add to ongoing uploads
    this.ongoingFileUploads.add(fileUploadKey);
    
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      const webhookData: FileUploadWebhookData = {
        reference_id: referenceId,
        file_name: file.name,
        section_name: sectionName,
        document_name: documentName,
        file_base64: base64,
        application_id: applicationId || 'unknown',
        applicant_id: applicantId,
        zoneinfo: userAttributes?.zoneinfo,
        user_email: userAttributes?.email,
        user_name: userAttributes?.name,
        user_given_name: userAttributes?.given_name,
        user_family_name: userAttributes?.family_name,
        user_phone_number: userAttributes?.phone_number
      };

      console.log(`Sending file ${file.name} to webhook for section ${sectionName} (Document: ${documentName})`);
      
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

      const startTime = Date.now();
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
          
          // Add to failed uploads to prevent retries
          this.failedUploads.add(fileUploadKey);
          
          return {
            success: false,
            error: `Webhook failed: ${response.status} - ${errorText}`
          };
        }

        const responseTime = Date.now() - startTime;
        console.log(`✅ File ${file.name} sent to webhook successfully in ${responseTime}ms`);
        console.log(`📊 File Upload Performance: ${fileSizeMB}MB file, ${responseTime}ms response time`);
        
        // Remove from ongoing uploads on success
        this.ongoingFileUploads.delete(fileUploadKey);
        
        return { success: true };

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('File webhook request timed out after 60 seconds');
          this.failedUploads.add(fileUploadKey);
          return {
            success: false,
            error: 'File webhook request timed out'
          };
        }
        
        console.error('Error sending file to webhook:', fetchError);
        this.failedUploads.add(fileUploadKey);
        
        return {
          success: false,
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        };
      }

    } catch (error) {
      console.error('Error in sendFileToWebhook:', error);
      this.failedUploads.add(fileUploadKey);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      // Remove from ongoing uploads
      this.ongoingFileUploads.delete(fileUploadKey);
    }
  }

  /**
   * Sends form data to the webhook
   */
  static async sendFormDataToWebhook(
    formData: any,
    referenceId: string,
    applicationId: string,
    applicantId?: string,
    userAttributes?: {
      zoneinfo?: string;
      email?: string;
      name?: string;
      given_name?: string;
      family_name?: string;
      phone_number?: string;
    },
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
    // Create a unique submission ID
    const submissionId = `${referenceId}-${applicationId}-${Date.now()}`;
    
    // Check if this submission is already in progress
    if (this.ongoingSubmissions.has(submissionId)) {
      console.log('⚠️ Duplicate webhook submission detected, skipping:', submissionId);
      return { success: false, error: 'Duplicate submission detected' };
    }
    
    // Add to ongoing submissions
    this.ongoingSubmissions.add(submissionId);
    
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
      
      // Format data for external webhook
      const webhookData: FormDataWebhookData = {
        reference_id: referenceId,
        application_id: applicationId,
        applicant_id: applicantId,
        zoneinfo: userAttributes?.zoneinfo,
        user_email: userAttributes?.email,
        user_name: userAttributes?.name,
        user_given_name: userAttributes?.given_name,
        user_family_name: userAttributes?.family_name,
        user_phone_number: userAttributes?.phone_number,
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

      console.log(`Sending form data to external webhook for application ${applicationId}`);
      
      // Log payload size for debugging
      const payloadSize = JSON.stringify(webhookData).length;
      const payloadSizeMB = Math.round(payloadSize / (1024 * 1024) * 100) / 100;
      console.log(`📦 Webhook payload size: ${payloadSizeMB}MB`);
      
      if (payloadSize > 5 * 1024 * 1024) { // 5MB limit
        console.warn('⚠️ Webhook payload is large:', payloadSizeMB, 'MB');
      }

      const startTime = Date.now();

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

        const responseTime = Date.now() - startTime;
        console.log(`✅ Form data sent to Netlify function successfully in ${responseTime}ms`);
        console.log(`📊 Netlify Performance: ${payloadSizeMB}MB payload, ${responseTime}ms response time`);
        
        // Remove from ongoing submissions
        this.ongoingSubmissions.delete(submissionId);
        
        return { success: true };

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('Netlify function request timed out after 30 seconds');
          return {
            success: false,
            error: 'Netlify function request timed out'
          };
        }
        
        console.error('Error sending form data to Netlify function:', fetchError);
        
        // Remove from ongoing submissions
        this.ongoingSubmissions.delete(submissionId);
        
        return {
          success: false,
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        };
      }

    } catch (error) {
      console.error('Error in sendFormDataToNetlify:', error);
      
      // Remove from ongoing submissions
      this.ongoingSubmissions.delete(submissionId);
      
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
    applicantId?: string,
    fileName: string = 'rental-application.pdf'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const webhookData: PDFWebhookData = {
        reference_id: referenceId,
        application_id: applicationId,
        applicant_id: applicantId,
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

      const startTime = Date.now();
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

      const responseTime = Date.now() - startTime;
      console.log(`✅ PDF sent to webhook successfully in ${responseTime}ms`);
      console.log(`📊 PDF Performance: ${pdfSizeMB}MB PDF, ${responseTime}ms response time`);
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

  /**
   * Clears the failed uploads cache
   */
  static clearFailedUploads(): void {
    this.failedUploads.clear();
    console.log('🧹 Cleared failed uploads cache');
  }

  /**
   * Gets the current status of ongoing and failed uploads
   */
  static getUploadStatus(): { ongoing: number; failed: number } {
    return {
      ongoing: this.ongoingFileUploads.size,
      failed: this.failedUploads.size
    };
  }

  /**
   * Debug method to log current webhook state
   */
  static debugWebhookState(): void {
    console.log('🔍 Webhook Service Debug Info:');
    console.log('📊 Ongoing uploads:', this.ongoingFileUploads.size);
    console.log('📊 Failed uploads:', this.failedUploads.size);
    console.log('📊 Ongoing submissions:', this.ongoingSubmissions.size);
    
    if (this.ongoingFileUploads.size > 0) {
      console.log('🔄 Ongoing file uploads:', Array.from(this.ongoingFileUploads));
    }
    
    if (this.failedUploads.size > 0) {
      console.log('❌ Failed uploads:', Array.from(this.failedUploads));
    }
  }

  /**
   * Reset all webhook state (use with caution)
   */
  static resetWebhookState(): void {
    this.ongoingFileUploads.clear();
    this.failedUploads.clear();
    this.ongoingSubmissions.clear();
    console.log('🔄 Reset all webhook state');
  }

  /**
   * Test webhook connectivity
   */
  static async testWebhookConnectivity(): Promise<{ success: boolean; error?: string }> {
    try {
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Webhook connectivity test'
      };

      console.log('🧪 Testing webhook connectivity...');
      
      const response = await fetch(this.FILE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        console.log('✅ Webhook connectivity test successful');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ Webhook connectivity test failed:', response.status, errorText);
        return {
          success: false,
          error: `Test failed: ${response.status} - ${errorText}`
        };
      }
    } catch (error) {
      console.error('❌ Webhook connectivity test error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 