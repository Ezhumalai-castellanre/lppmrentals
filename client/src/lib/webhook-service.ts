

export interface FileUploadWebhookData {
  reference_id: string;
  file_name: string;
  section_name: string;
  document_name: string;
  file_base64: string;
  application_id: string;
  comment_id?: string;
}

export interface FormDataWebhookData {
  reference_id: string;
  application_id: string;
  form_data: {
    application?: {
      buildingAddress?: string;
      apartmentNumber?: string;
      apartmentType?: string;
      monthlyRent?: string | number;
      moveInDate?: string;
      howDidYouHear?: string;
      howDidYouHearOther?: string;
    };
    applicant?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      dob?: string;
      ssn?: string;
      license?: string;
      licenseState?: string;
      lengthAtAddressYears?: number;
      lengthAtAddressMonths?: number;
      landlordName?: string;
      landlordAddressLine1?: string;
      landlordAddressLine2?: string;
      landlordCity?: string;
      landlordState?: string;
      landlordZipCode?: string;
      landlordPhone?: string;
      landlordEmail?: string;
      currentRent?: number;
      reasonForMoving?: string;
      age?: number;
      employmentType?: string;
      employer?: string;
      position?: string;
      employmentStart?: string;
      income?: string;
      incomeFrequency?: string;
      otherIncome?: string;
      otherIncomeSource?: string;
      bankRecords?: Array<{
        bankName?: string;
        accountType?: string;
        accountNumber?: string;
      }>;
    };
    coApplicant?: {
      email?: string;
      phone?: string;
      address?: string;
      zip?: string;
      landlordZipCode?: string;
      landlordPhone?: string;
      landlordEmail?: string;
      city?: string;
      landlordCity?: string;
      name?: string;
      licenseState?: string;
      state?: string;
      relationship?: string;
      dob?: string;
      age?: number;
      ssn?: string;
      license?: string;
      lengthAtAddressYears?: number;
      lengthAtAddressMonths?: number;
      landlordName?: string;
      landlordAddressLine1?: string;
      landlordAddressLine2?: string;
      landlordState?: string;
      currentRent?: number;
      reasonForMoving?: string;
      employmentType?: string;
      employer?: string;
      position?: string;
      employmentStart?: string;
      income?: string;
      incomeFrequency?: string;
      otherIncome?: string;
      otherIncomeSource?: string;
      bankRecords?: Array<{
        bankName?: string;
        accountType?: string;
        accountNumber?: string;
      }>;
    };
    guarantor?: {
      email?: string;
      phone?: string;
      address?: string;
      zip?: string;
      landlordZipCode?: string;
      landlordPhone?: string;
      landlordEmail?: string;
      city?: string;
      landlordCity?: string;
      name?: string;
      licenseState?: string;
      state?: string;
      relationship?: string;
      dob?: string;
      age?: number;
      ssn?: string;
      license?: string;
      lengthAtAddressYears?: number;
      lengthAtAddressMonths?: number;
      landlordName?: string;
      landlordAddressLine1?: string;
      landlordState?: string;
      landlordAddressLine2?: string;
      currentRent?: number;
      reasonForMoving?: string;
      employmentType?: string;
      businessName?: string;
      businessType?: string;
      yearsInBusiness?: string;
      income?: string;
      incomeFrequency?: string;
      otherIncome?: string;
      otherIncomeSource?: string;
      bankRecords?: Array<{
        bankName?: string;
        accountType?: string;
        accountNumber?: string;
      }>;
    };
    occupants?: Array<{
      name?: string;
      relationship?: string;
      dob?: string;
      ssn?: string;
      license?: string;
      age?: number;
      documents?: any;
    }>;
    applicantName?: string;
    applicantEmail?: string;
    application_id?: string;
    applicantId?: string;
    zoneinfo?: string;
    hasCoApplicant?: boolean;
    hasGuarantor?: boolean;
    webhookSummary?: {
      totalResponses?: number;
      responsesByPerson?: {
        applicant?: number;
        coApplicant?: number;
        guarantor?: number;
        occupants?: number;
      };
      webhookResponses?: Record<string, string>;
    };
  };
  uploaded_files: {
    supporting_w9_forms: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    supporting_photo_id: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    supporting_social_security: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    supporting_bank_statement: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    supporting_tax_returns: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    supporting_employment_letter: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    supporting_pay_stubs: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    supporting_credit_report: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    coApplicant_w9_forms: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    coApplicant_photo_id: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    coApplicant_social_security: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    coApplicant_bank_statement: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    coApplicant_tax_returns: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    coApplicant_employment_letter: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    coApplicant_pay_stubs: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    coApplicant_credit_report: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    guarantor_w9_forms: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    guarantor_photo_id: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    guarantor_social_security: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    guarantor_bank_statement: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    guarantor_tax_returns: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    guarantor_employment_letter: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    guarantor_pay_stubs: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    guarantor_credit_report: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
    other_occupants_identity: { file_name: string; file_size: number; mime_type: string; upload_date: string; }[];
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

// Helper function to extract URL from webhook response
const extractWebhookUrl = (response: any, category?: string, sectionName?: string): string | null => {
  if (!response) return null;
  
  // If response is a string URL, return it directly
  if (typeof response === 'string' && response.startsWith('http')) {
    return response;
  }

  try {
    // If response is a JSON string, parse it
    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    
    // If we have category and section info, try to extract from nested structure
    if (category && sectionName) {
      const categoryData = parsed[category];
      if (categoryData && typeof categoryData === 'object') {
        const sectionUrl = categoryData[sectionName];
        if (typeof sectionUrl === 'string' && sectionUrl.startsWith('http')) {
          return sectionUrl;
        }
      }
    }
    
    // Check various possible locations of the URL
    if (typeof parsed === 'string' && parsed.startsWith('http')) {
      return parsed;
    } else if (parsed.body && typeof parsed.body === 'string' && parsed.body.startsWith('http')) {
      return parsed.body;
    } else if (parsed.url && typeof parsed.url === 'string' && parsed.url.startsWith('http')) {
      return parsed.url;
    }

    // Try to find URL in nested structure
    if (typeof parsed === 'object') {
      for (const key in parsed) {
        if (typeof parsed[key] === 'object') {
          const nestedUrl = extractWebhookUrl(parsed[key]);
          if (nestedUrl) return nestedUrl;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to parse webhook response:', e);
  }
  
  return null;
};

// Helper function to clean sensitive data from objects while preserving webhook URLs
const cleanObject = (obj: any) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const fieldsToRemove = [
    'documents',
    'encryptedDocuments',
    'uploaded_documents',
    'applicantBankRecords',
    'coApplicantBankRecords',
    'guarantorBankRecords',
    'guarantor.encryptedDocuments',
    'coApplicant.encryptedDocuments',
    'applicant.encryptedDocuments'
  ];

  // Create a map of webhook responses organized by applicant type
  const webhookUrls: Record<string, Record<string, string>> = {
    applicant: {},
    coApplicant: {},
    guarantor: {}
  };

  if (obj.webhookResponses) {
    // Handle both flat and nested webhook responses
    Object.entries(obj.webhookResponses).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle nested structure
        if (key === 'applicant' || key === 'coApplicant' || key === 'guarantor') {
          Object.entries(value as Record<string, any>).forEach(([sectionName, sectionValue]) => {
            const url = extractWebhookUrl(sectionValue, key, sectionName);
            if (url) {
              webhookUrls[key][sectionName] = url;
              
              // Update metadata if it exists
              if (obj.uploadedFilesMetadata?.[key]?.[sectionName]) {
                obj.uploadedFilesMetadata[key][sectionName].webhook_body = url;
                delete obj.uploadedFilesMetadata[key][sectionName].webhook_status_code;
              }
            }
          });
        }
      } else {
        // Handle flat structure
        const category = key.startsWith('coApplicant_') ? 'coApplicant' :
                        key.startsWith('guarantor_') ? 'guarantor' : 'applicant';
        const baseName = key.replace(/^(coApplicant_|guarantor_)/, '');
        const url = extractWebhookUrl(value);
        if (url) {
          webhookUrls[category][baseName] = url;
          
          // Update metadata if it exists
          if (obj.uploadedFilesMetadata?.[category]?.[baseName]) {
            obj.uploadedFilesMetadata[category][baseName].webhook_body = url;
            delete obj.uploadedFilesMetadata[category][baseName].webhook_status_code;
          }
        }
      }
    });
  }

  // Deep clean the object
  const cleaned = { ...obj };
  fieldsToRemove.forEach(field => {
    const parts = field.split('.');
    let current = cleaned;
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] && typeof current[parts[i]] === 'object') {
        current = current[parts[i]];
      } else {
        break;
      }
    }
    delete current[parts[parts.length - 1]];
  });

  // Update webhook responses with organized structure
  if (cleaned.webhookResponses) {
    cleaned.webhookResponses = webhookUrls;
  }

  // Organize uploadedFilesMetadata by applicant type if it exists
  if (cleaned.uploadedFilesMetadata) {
    const organizedMetadata: Record<string, Record<string, any>> = {
      applicant: {},
      coApplicant: {},
      guarantor: {}
    };

    Object.entries(cleaned.uploadedFilesMetadata).forEach(([key, value]) => {
      const category = key.startsWith('coApplicant_') ? 'coApplicant' :
                      key.startsWith('guarantor_') ? 'guarantor' : 'applicant';
      const baseName = key.replace(/^(coApplicant_|guarantor_)/, '');
      organizedMetadata[category][baseName] = value;
    });

    cleaned.uploadedFilesMetadata = organizedMetadata;
  }

  return cleaned;
};

export class WebhookService {
  // Use AWS API Gateway endpoints for production
  private static readonly WEBHOOK_PROXY_URL = 'https://9yo8506w4h.execute-api.us-east-1.amazonaws.com/prod/webhook-proxy';
  private static readonly S3_PRESIGN_URL = this.getS3PresignUrl();
  
  private static getS3PresignUrl(): string {
    // Check if we're in production (AWS Amplify)
    if (window.location.hostname.includes('amplifyapp.com') || 
        window.location.hostname.includes('your-prod-domain.com')) {
      return 'https://9yo8506w4h.execute-api.us-east-1.amazonaws.com/prod/s3-presign';
    }
    // Local development
    return '/api/s3-presign';
  }
  
  // Track ongoing submissions to prevent duplicates
  private static ongoingSubmissions = new Set<string>();
  
  // Track individual file uploads to prevent duplicates
  private static ongoingFileUploads = new Set<string>();
  
  // Track failed uploads to prevent retries
  private static failedUploads = new Set<string>();

  /**
   * Upload a file to S3 and send the URL to webhook
   */
  static async uploadFileToS3AndSendToWebhook(
    file: File,
    referenceId: string,
    sectionName: string,
    documentName: string,
    applicationId?: string,
    zoneinfo?: string,
    commentId?: string
  ): Promise<{ success: boolean; error?: string; url?: string; key?: string; webhookResponse?: string }> {
    const submissionId = `${referenceId}-${sectionName}-${documentName}-${file.name}`;
    
    // Check if already submitting
    if (this.ongoingSubmissions.has(submissionId)) {
      console.log(`⏳ Already uploading ${file.name} for ${submissionId}`);
      return {
        success: false,
        error: 'Upload already in progress for this file'
      };
    }

    this.ongoingSubmissions.add(submissionId);

    try {
      console.log(`🚀 Requesting S3 presigned URL for ${file.name}`);

      // 1) Request a presigned URL
      const presignRes = await fetch(this.S3_PRESIGN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          referenceId,
          sectionName,
          documentName,
          zoneinfo,
        }),
      });

      if (!presignRes.ok) {
        const errorText = await presignRes.text();
        console.error('❌ S3 presign failed:', presignRes.status, errorText);
        return { success: false, error: `S3 presign failed: ${presignRes.status} - ${errorText}` };
      }

      const { url: putUrl, key, cleanUrl } = await presignRes.json();

      // 2) Upload directly to S3 with PUT
      console.log('📤 Uploading file via PUT to S3');
      const putRes = await fetch(putUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!putRes.ok) {
        const text = await putRes.text();
        console.error('❌ S3 PUT failed:', putRes.status, text);
        return { success: false, error: `S3 PUT failed: ${putRes.status}` };
      }

      console.log(`✅ S3 upload successful: ${cleanUrl}`);

      // Send file URL to webhook instead of file data
      const webhookData = {
        reference_id: referenceId,
        file_name: file.name,
        section_name: sectionName,
        document_name: documentName,
        s3_url: cleanUrl,
        s3_key: key,
        file_size: file.size,
        file_type: file.type,
        application_id: applicationId || '',
        comment_id: commentId,
        uploaded_at: new Date().toISOString(),
      };

      console.log(`📤 Sending file URL to webhook: ${file.name}`);
      console.log(`🔗 S3 URL: ${cleanUrl}`);

      const webhookResponse = await fetch(this.WEBHOOK_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookType: 'file_upload',
          webhookData: webhookData
        }),
      });

      const responseBody = await webhookResponse.text();

      if (webhookResponse.ok) {
        console.log('✅ Webhook call successful');
        return {
          success: true,
          url: cleanUrl,
          key: key,
          webhookResponse: responseBody
        };
      } else {
        console.error('❌ Webhook call failed:', webhookResponse.status, responseBody);
        return {
          success: false,
          error: `Webhook failed: ${webhookResponse.status} - ${responseBody}`,
          url: cleanUrl, // Still return S3 URL even if webhook fails
          key: key
        };
      }

    } catch (error) {
      console.error('❌ Error uploading file to S3:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    } finally {
      this.ongoingSubmissions.delete(submissionId);
    }
  }

  /**
   * Sends a file to the webhook immediately upon upload
   */
  static async sendFileToWebhook(
    file: File,
    referenceId: string,
    sectionName: string,
    documentName: string,
    applicationId?: string,
    zoneinfo?: string,
    commentId?: string
  ): Promise<{ success: boolean; error?: string; body?: string }> {
    // Allow larger files (up to 50MB) since Make.com webhook has no payload limits
    // Base64 adds ~33% overhead, so 50MB file -> ~67MB JSON field plus metadata
    const MAX_WEBHOOK_FILE_MB = 50;
    if (file.size > MAX_WEBHOOK_FILE_MB * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      console.error(
        `❌ File too large for webhook: ${file.name} (${fileSizeMB}MB). Max allowed is ${MAX_WEBHOOK_FILE_MB}MB.`
      );
      return { success: false, error: `File too large (${fileSizeMB}MB). Max ${MAX_WEBHOOK_FILE_MB}MB.` };
    }

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
    
    const startTime = Date.now();
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    
    console.log(`🚀 Starting file upload to webhook: ${file.name} (${fileSizeMB}MB)`);
    console.log(`📋 Upload details:`, {
      referenceId,
      sectionName,
      documentName,
      applicationId,
      zoneinfo
    });

    // Convert file to base64
    let fileBase64: string;
    try {
      fileBase64 = await this.fileToBase64(file);
      console.log(`✅ File converted to base64: ${file.name}`);
    } catch (error) {
      console.error(`❌ Error converting file to base64: ${file.name}`, error);
      this.ongoingFileUploads.delete(fileUploadKey);
      return { success: false, error: 'Failed to convert file to base64' };
    }

    // Prepare webhook data
    const webhookData: FileUploadWebhookData = {
      reference_id: referenceId,
      file_name: file.name,
      section_name: sectionName,
      document_name: documentName,
      file_base64: fileBase64,
      application_id: applicationId || '',
      comment_id: commentId
    };

    console.log(`📤 Sending file to webhook: ${file.name}`);
    console.log(`📊 Payload size: ${(JSON.stringify(webhookData).length / 1024).toFixed(2)}KB`);

    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout for large files

    try {
      const response = await fetch(this.WEBHOOK_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookType: 'file_upload',
          webhookData: webhookData
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Log response details
      console.log(`📥 Webhook response received for ${file.name}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Get response body
      const responseBody = await response.text();
      console.log(`📄 Response body:`, responseBody);

      // Parse response details
      const responseDetails = {
        url: this.WEBHOOK_PROXY_URL,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody
      };

      // Extract S3 URL from response body
      let extractedUrl: string | null = null;
      try {
        // Try to parse as JSON first
        const responseJson = JSON.parse(responseBody);
        if (responseJson && typeof responseJson === 'string') {
          extractedUrl = responseJson;
        } else if (responseJson && responseJson.url) {
          extractedUrl = responseJson.url;
        } else if (responseJson && responseJson.body) {
          extractedUrl = responseJson.body;
        }
      } catch (parseError) {
        // If not JSON, treat the entire response as the URL
        console.log('⚠️ Response is not JSON, treating as direct URL');
        extractedUrl = responseBody.trim();
      }

      console.log(`🔗 Extracted URL:`, extractedUrl);

      if (response.ok) {
        console.log('=== WEBHOOK SUCCESS LOG ===');
        console.log(`✅ File ${file.name} uploaded successfully`);
        console.log(`📊 File size: ${fileSizeMB}MB`);
        console.log(`🔗 S3 URL: ${extractedUrl}`);
        console.log(`📋 Section: ${sectionName}`);
        console.log(`📄 Document: ${documentName}`);
        console.log(`🆔 Reference ID: ${referenceId}`);
        console.log(`🆔 Application ID: ${applicationId}`);
        console.log(`🌍 Zoneinfo: ${zoneinfo}`);
        console.log(`📊 Response time: ${Date.now() - startTime}ms`);
        console.log(`📄 Full response:`, responseDetails);
        
        // Try to parse response as JSON for additional details
        try {
          const responseJson = JSON.parse(responseBody);
          console.log(`📋 Parsed response JSON:`, responseJson);
        } catch (parseError) {
          console.log('⚠️ Could not parse response as JSON:', parseError);
          console.log('📄 Raw response body:', responseBody);
        }
        
        console.log('=== END WEBHOOK SUCCESS LOG ===');
        


        const responseTime = Date.now() - startTime;
        console.log(`✅ File ${file.name} sent to webhook successfully in ${responseTime}ms`);
        console.log(`📊 File Upload Performance: ${fileSizeMB}MB file, ${responseTime}ms response time`);
        
        // Remove from ongoing uploads on success
        this.ongoingFileUploads.delete(fileUploadKey);
        
        return { 
          success: true, 
          body: extractedUrl || responseBody 
        };
      } else {
        console.error('Webhook failed:', response.status, responseBody);
        
        // Add to failed uploads to prevent retries
        this.failedUploads.add(fileUploadKey);
        
        return {
          success: false,
          error: `Webhook failed: ${response.status} - ${responseBody}`
        };
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('File webhook request timed out after 120 seconds');
        this.failedUploads.add(fileUploadKey);
        this.ongoingFileUploads.delete(fileUploadKey);
        return {
          success: false,
          error: 'File webhook request timed out'
        };
      }
      
      console.error('Error sending file to webhook:', fetchError);
      this.failedUploads.add(fileUploadKey);
      this.ongoingFileUploads.delete(fileUploadKey);
      
      return {
        success: false,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
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
    zoneinfo?: string,
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
      // Transform the data into the exact structure needed for the webhook
      const transformedData = this.transformFormDataToWebhookFormat(formData, uploadedFiles);
      
      // Format data for external webhook
      const webhookData: FormDataWebhookData = {
        reference_id: referenceId,
        application_id: zoneinfo || applicationId,
        form_data: transformedData,
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
      
      console.log(`📊 Form data payload size: ${payloadSizeMB}MB`);
      
      if (payloadSizeMB > 5) {
        console.warn('⚠️ Large form data payload detected:', payloadSizeMB, 'MB');
      }

      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout for large JSON
      
      try {
        const response = await fetch(this.WEBHOOK_PROXY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            webhookType: 'form_data',
            webhookData: webhookData
          }),
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
          console.error('Form webhook request timed out after 90 seconds');
          return {
            success: false,
            error: 'Form webhook request timed out'
          };
        }
        
        console.error('Error sending form data to webhook:', fetchError);
        
        // Remove from ongoing submissions
        this.ongoingSubmissions.delete(submissionId);
        
        return {
          success: false,
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        };
      }

    } catch (error) {
      console.error('Error in sendFormDataToWebhook:', error);
      this.ongoingSubmissions.delete(submissionId);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Transforms form data into the exact webhook format structure
   */
  private static transformFormDataToWebhookFormat(formData: any, uploadedFiles?: any): any {
    // Extract webhook responses from the form data
    const webhookResponses = formData.webhookResponses || {};
    
    // Debug logging for income fields
    console.log('🔍 === INCOME FIELD DEBUG ===');
    console.log('📊 Form data keys:', Object.keys(formData));
    console.log('📊 Form data applicant section:', formData.applicant);
    console.log('📊 Form data coApplicant section:', formData.coApplicant);
    console.log('📊 Form data guarantor section:', formData.guarantor);
    console.log('📊 Applicant income fields:', {
      nestedIncome: formData.applicant?.income,
      nestedSalary: formData.applicant?.salary,
      flatIncome: formData.applicantSalary,
      nestedFrequency: formData.applicant?.incomeFrequency,
      flatFrequency: formData.applicantIncomeFrequency,
      nestedOtherIncome: formData.applicant?.otherIncome,
      flatOtherIncome: formData.applicantOtherIncome
    });
    
    if (formData.hasCoApplicant) {
      console.log('📊 Co-Applicant income fields:', {
        nestedIncome: formData.coApplicant?.income,
        nestedSalary: formData.coApplicant?.salary,
        flatIncome: formData.coApplicantSalary,
        nestedFrequency: formData.coApplicant?.incomeFrequency,
        flatFrequency: formData.coApplicantIncomeFrequency,
        nestedOtherIncome: formData.coApplicant?.otherIncome,
        flatOtherIncome: formData.coApplicantOtherIncome
      });
    }
    
    if (formData.hasGuarantor) {
      console.log('📊 Guarantor income fields:', {
        nestedIncome: formData.guarantor?.income,
        nestedSalary: formData.guarantor?.salary,
        flatIncome: formData.guarantorSalary,
        nestedFrequency: formData.guarantor?.incomeFrequency,
        flatFrequency: formData.guarantorIncomeFrequency,
        nestedOtherIncome: formData.guarantor?.otherIncome,
        flatOtherIncome: formData.guarantorOtherIncome
      });
    }
    
    // Additional debugging for the specific issue
    console.log('🔍 === DETAILED INCOME FREQUENCY DEBUG ===');
    console.log('📊 Form data structure check:');
    console.log('  - formData.applicant exists:', !!formData.applicant);
    console.log('  - formData.applicant.incomeFrequency:', formData.applicant?.incomeFrequency);
    console.log('  - formData.applicantIncomeFrequency:', formData.applicantIncomeFrequency);
    console.log('  - Final applicant frequency will be:', formData.applicant?.incomeFrequency || formData.applicantIncomeFrequency || "monthly");
    
    if (formData.hasCoApplicant) {
      console.log('  - formData.coApplicant.incomeFrequency:', formData.coApplicant?.incomeFrequency);
      console.log('  - formData.coApplicantIncomeFrequency:', formData.coApplicantIncomeFrequency);
      console.log('  - Final co-applicant frequency will be:', formData.coApplicant?.incomeFrequency || formData.coApplicantIncomeFrequency || "monthly");
    }
    
    if (formData.hasGuarantor) {
      console.log('  - formData.guarantor.incomeFrequency:', formData.guarantor?.incomeFrequency);
      console.log('  - formData.guarantorIncomeFrequency:', formData.guarantorIncomeFrequency);
      console.log('  - Final guarantor frequency will be:', formData.guarantor?.incomeFrequency || formData.guarantorIncomeFrequency || "monthly");
    }
    console.log('=== END DETAILED INCOME FREQUENCY DEBUG ===');
    console.log('=== END INCOME FIELD DEBUG ===');
    
    // Count total responses and responses by person
    let totalResponses = 0;
    const responsesByPerson: { [key: string]: number } = {
      applicant: 0,
      coApplicant: 0,
      guarantor: 0,
      occupants: 0
    };

    // Count responses for each person type
    Object.keys(webhookResponses).forEach(key => {
      if (webhookResponses[key]) {
        totalResponses++;
        if (key.startsWith('applicant_')) {
          responsesByPerson.applicant++;
        } else if (key.startsWith('coApplicant_')) {
          responsesByPerson.coApplicant++;
        } else if (key.startsWith('guarantor_')) {
          responsesByPerson.guarantor++;
        } else if (key.startsWith('occupants_')) {
          responsesByPerson.occupants++;
        }
      }
    });

    // Transform the data into the exact structure needed
    const transformedData = {
      // Application section
      application: {
        buildingAddress: formData.buildingAddress,
        apartmentNumber: formData.apartmentNumber,
        apartmentType: formData.apartmentType,
        monthlyRent: formData.monthlyRent,
        moveInDate: formData.moveInDate,
        howDidYouHear: formData.howDidYouHear,
        howDidYouHearOther: formData.howDidYouHearOther || ""
      },

      // Applicant section
      applicant: {
        name: formData.applicantName,
        email: formData.applicantEmail,
        phone: formData.applicantPhone,
        address: formData.applicantAddress,
        city: formData.applicantCity,
        state: formData.applicantState,
        zip: formData.applicantZip,
        dob: formData.applicantDob,
        ssn: formData.applicantSsn,
        license: formData.applicantLicense,
        licenseState: formData.applicantLicenseState,
        lengthAtAddressYears: formData.applicantLengthAtAddressYears,
        lengthAtAddressMonths: formData.applicantLengthAtAddressMonths,
        landlordName: formData.applicantLandlordName,
        landlordAddressLine1: formData.applicantLandlordAddressLine1,
        landlordAddressLine2: formData.applicantLandlordAddressLine2,
        landlordCity: formData.applicantLandlordCity,
        landlordState: formData.applicantLandlordState,
        landlordZipCode: formData.applicantLandlordZipCode,
        landlordPhone: formData.applicantLandlordPhone,
        landlordEmail: formData.applicantLandlordEmail,
        currentRent: formData.applicantCurrentRent,
        reasonForMoving: formData.applicantReasonForMoving,
        age: formData.applicantAge || 0,
        employmentType: formData.applicantEmploymentType,
        employer: formData.applicantEmployerName,
        position: formData.applicantPosition,
        employmentStart: formData.applicantStartDate,
        // Fix: Use flat fields first since that's where the data actually is
        income: formData.applicantSalary || formData.applicant?.income || formData.applicant?.salary || "",
        incomeFrequency: formData.applicantIncomeFrequency || formData.applicant?.incomeFrequency || "monthly",
        otherIncome: formData.applicantOtherIncome || formData.applicant?.otherIncome || "",
        otherIncomeSource: formData.applicantOtherIncomeSource || formData.applicant?.otherIncomeSource || "",
        bankRecords: formData.applicantBankRecords || []
      },

      // Co-Applicant section (if exists)
      coApplicant: formData.hasCoApplicant ? {
        email: formData.coApplicantEmail,
        phone: formData.coApplicantPhone,
        address: formData.coApplicantAddress || formData.coApplicant?.address || "",
        zip: formData.coApplicantZip,
        landlordZipCode: formData.coApplicantLandlordZipCode,
        landlordPhone: formData.coApplicantLandlordPhone,
        landlordEmail: formData.coApplicantLandlordEmail,
        city: formData.coApplicantCity,
        landlordCity: formData.coApplicantLandlordCity,
        name: formData.coApplicantName,
        licenseState: formData.coApplicantLicenseState,
        state: formData.coApplicantState,
        relationship: formData.coApplicantRelationship,
        dob: formData.coApplicantDob,
        age: formData.coApplicantAge || 0,
        ssn: formData.coApplicantSsn,
        license: formData.coApplicantLicense,
        lengthAtAddressYears: formData.coApplicantLengthAtAddressYears,
        lengthAtAddressMonths: formData.coApplicantLengthAtAddressMonths,
        landlordName: formData.coApplicantLandlordName,
        landlordAddressLine1: formData.coApplicantLandlordAddressLine1,
        landlordAddressLine2: formData.coApplicantLandlordAddressLine2,
        landlordState: formData.coApplicantLandlordState,
        currentRent: formData.coApplicantCurrentRent,
        reasonForMoving: formData.coApplicantReasonForMoving,
        employmentType: formData.coApplicantEmploymentType,
        employer: formData.coApplicantEmployerName,
        position: formData.coApplicantPosition,
        employmentStart: formData.coApplicantStartDate,
        // Fix: Use flat fields first since that's where the data actually is
        income: formData.coApplicantSalary || formData.coApplicant?.income || formData.coApplicant?.salary || "",
        incomeFrequency: formData.coApplicantIncomeFrequency || formData.coApplicant?.incomeFrequency || "monthly",
        otherIncome: formData.coApplicantOtherIncome || formData.coApplicant?.otherIncome || "",
        otherIncomeSource: formData.coApplicantOtherIncomeSource || formData.coApplicant?.otherIncomeSource || "",
        bankRecords: formData.coApplicantBankRecords || []
      } : undefined,

      // Guarantor section (if exists)
      guarantor: formData.hasGuarantor ? {
        email: formData.guarantorEmail,
        phone: formData.guarantorPhone,
        address: formData.guarantorAddress || formData.guarantor?.address || "",
        zip: formData.guarantorZip,
        landlordZipCode: formData.guarantorLandlordZipCode,
        landlordPhone: formData.guarantorLandlordPhone,
        landlordEmail: formData.guarantorLandlordEmail,
        city: formData.guarantorCity,
        landlordCity: formData.guarantorLandlordCity,
        name: formData.guarantorName,
        licenseState: formData.guarantorLicenseState,
        state: formData.guarantorState,
        relationship: formData.guarantorRelationship,
        dob: formData.guarantorDob,
        age: formData.guarantorAge || 0,
        ssn: formData.guarantorSsn,
        license: formData.guarantorLicense,
        lengthAtAddressYears: formData.guarantorLengthAtAddressYears,
        lengthAtAddressMonths: formData.guarantorLengthAtAddressMonths,
        landlordName: formData.guarantorLandlordName,
        landlordAddressLine1: formData.guarantorLandlordAddressLine1,
        landlordState: formData.guarantorLandlordState,
        landlordAddressLine2: formData.guarantorLandlordAddressLine2,
        currentRent: formData.guarantorCurrentRent,
        reasonForMoving: formData.guarantorReasonForMoving,
        employmentType: formData.guarantorEmploymentType,
        businessName: formData.guarantorBusinessName || "",
        businessType: formData.guarantorBusinessType || "",
        yearsInBusiness: formData.guarantorYearsInBusiness || "",
        // Fix: Use flat fields first since that's where the data actually is
        income: formData.guarantorSalary || formData.guarantor?.income || formData.guarantor?.salary || "",
        incomeFrequency: formData.guarantorIncomeFrequency || formData.guarantor?.incomeFrequency || "monthly",
        otherIncome: formData.guarantorOtherIncome || formData.guarantor?.otherIncome || "",
        otherIncomeSource: formData.guarantorOtherIncomeSource || formData.guarantor?.otherIncomeSource || "",
        bankRecords: formData.guarantorBankRecords || []
      } : undefined,

      // Occupants section
      occupants: (formData.otherOccupants || []).map((occupant: any) => ({
        name: occupant.name,
        relationship: occupant.relationship,
        dob: occupant.dob,
        ssn: occupant.ssn,
        license: occupant.license,
        age: occupant.age || 0,
        documents: {
          ssn1: [{}] // Placeholder for document structure
        }
      })),

      // Applicant summary fields
      applicantName: formData.applicantName,
      applicantEmail: formData.applicantEmail,
      application_id: formData.application_id || formData.applicantId,
      applicantId: formData.applicantId,
      zoneinfo: formData.zoneinfo || formData.applicantId,
      hasCoApplicant: formData.hasCoApplicant,
      hasGuarantor: formData.hasGuarantor,

      // Webhook summary
      webhookSummary: {
        totalResponses,
        responsesByPerson,
        webhookResponses
      }
    };

    // Remove undefined sections
    if (!transformedData.coApplicant) {
      delete transformedData.coApplicant;
    }
    if (!transformedData.guarantor) {
      delete transformedData.guarantor;
    }

    // Debug logging for transformed income fields
    console.log('🔍 === TRANSFORMED INCOME FIELDS DEBUG ===');
    console.log('📊 Transformed Applicant income:', {
      income: transformedData.applicant.income,
      incomeFrequency: transformedData.applicant.incomeFrequency,
      otherIncome: transformedData.applicant.otherIncome,
      otherIncomeSource: transformedData.applicant.otherIncomeSource
    });
    
    if (transformedData.coApplicant) {
      console.log('📊 Transformed Co-Applicant income:', {
        income: transformedData.coApplicant.income,
        incomeFrequency: transformedData.coApplicant.incomeFrequency,
        otherIncome: transformedData.coApplicant.otherIncome,
        otherIncomeSource: transformedData.coApplicant.otherIncomeSource
      });
    }
    
    if (transformedData.guarantor) {
      console.log('📊 Transformed Guarantor income:', {
        income: transformedData.guarantor.income,
        incomeFrequency: transformedData.guarantor.incomeFrequency,
        otherIncome: transformedData.guarantor.otherIncome,
        otherIncomeSource: transformedData.guarantor.otherIncomeSource
      });
    }
    console.log('=== END TRANSFORMED INCOME FIELDS DEBUG ===');

    return transformedData;
  }

  /**
   * Sends PDF to webhook
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

      console.log(`Sending PDF to webhook: ${fileName}`);
      console.log(`PDF size: ${Math.round(pdfBase64.length / 1024)} KB`);

      const response = await fetch(this.WEBHOOK_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookType: 'file_upload',
          webhookData: webhookData
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF webhook failed:', response.status, errorText);
        return {
          success: false,
          error: `PDF webhook failed: ${response.status} - ${errorText}`
        };
      }

      console.log('✅ PDF sent to webhook successfully');
      return { success: true };

    } catch (error) {
      console.error('Error sending PDF to webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Converts a file to base64
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
      
      const response = await fetch(this.WEBHOOK_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookType: 'file_upload',
          webhookData: testData
        }),
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