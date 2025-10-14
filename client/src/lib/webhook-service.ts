import { S3Service } from './s3-service';

export interface FileUploadWebhookData {
  reference_id: string;
  file_name: string;
  section_name: string;
  document_name: string;
  file_base64: string;
  application_id: string;
  id: string;                    // Document subitem ID
  comment_id?: string;
  // Additional S3-specific fields (optional for backward compatibility)
  s3_url?: string;
  s3_key?: string;
  file_size?: number;
  file_type?: string;
  uploaded_at?: string;
}

export interface FormDataWebhookData {
  reference_id: string;
  application_id: string;
  role: string;
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
      creditScore?: string;
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
      otherIncomeFrequency?: string;
      otherIncomeSource?: string;
      creditScore?: string;
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
      creditScore?: string;
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
    coApplicantCount?: number;
    guarantorCount?: number;
    coApplicants?: any[];
    guarantors?: any[];
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
  uploaded_files?: {
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
  submission_type: 'form_data' | 'applicant_only' | 'coapplicant_only' | 'guarantor_only';
}

export interface PDFWebhookData {
  reference_id: string;
  application_id: string;
  applicant_id?: string;
  file_name: string;
  file_base64: string;
  submission_type: 'pdf_generation';
  s3_url?: string; // Added for S3 uploads
  s3_key?: string; // Added for S3 uploads
  file_size?: number; // Added for S3 uploads
  file_type?: string; // Added for S3 uploads
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
  // BULLETPROOF: Hardcode AWS endpoints to fix CSP issue immediately
  // TODO: Remove these hardcoded URLs once environment detection is working
  private static readonly WEBHOOK_PROXY_URL = 'https://9yo8506w4h.execute-api.us-east-1.amazonaws.com/prod/webhook-proxy';
  private static readonly S3_PRESIGN_URL = 'https://9yo8506w4h.execute-api.us-east-1.amazonaws.com/prod/s3-presign';
  // Direct Make.com hook for application submission
  private static readonly MAKE_COM_WEBHOOK_URL = 'https://hook.us1.make.com/og5ih0pl1br72r1pko39iimh3hdl31hk';
  
  // Comment out the dynamic URL methods for now
  // private static readonly WEBHOOK_PROXY_URL = this.getWebhookProxyUrl();
  // private static readonly S3_PRESIGN_URL = this.getS3PresignUrl();
  
  // Log the URLs being used
  static {
    console.log('🔗 WebhookService initialized with BULLETPROOF hardcoded AWS endpoints:');
    console.log('  - S3 Presign URL:', WebhookService.S3_PRESIGN_URL);
    console.log('  - Webhook Proxy URL:', WebhookService.WEBHOOK_PROXY_URL);
    console.log('  - These URLs are HARDCODED and cannot be changed by any method calls');
  }
  
  // Override any potential method calls with getters that always return AWS endpoints
  static get S3_PRESIGN_URL_OVERRIDE() {
    console.log('🔗 S3 Presign URL getter called - returning hardcoded AWS endpoint');
    return 'https://9yo8506w4h.execute-api.us-east-1.amazonaws.com/prod/s3-presign';
  }
  
  static get WEBHOOK_PROXY_URL_OVERRIDE() {
    console.log('🔗 Webhook Proxy URL getter called - returning hardcoded AWS endpoint');
    return 'https://9yo8506w4h.execute-api.us-east-1.amazonaws.com/prod/webhook-proxy';
  }
  
  // REMOVED: Old getWebhookProxyUrl method that could potentially return localhost URLs
  
  // REMOVED: Old getS3PresignUrl method that could potentially return localhost URLs
  
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
    commentId?: string,
    id?: string
  ): Promise<{ success: boolean; error?: string; url?: string; key?: string; webhookResponse?: string }> {
    const submissionId = `${referenceId}-${sectionName}-${documentName}-${file.name}`;
    
    // Check if already submitting
    if (this.ongoingSubmissions.has(submissionId)) {
      return {
        success: false,
        error: 'Upload already in progress for this file'
      };
    }

    this.ongoingSubmissions.add(submissionId);

    try {
      // Use pre-signed URL method (CORS-safe, no direct S3 access from browser)
      console.log('⏭️ Using pre-signed URL method to avoid CORS issues');

      console.log(`🚀 Requesting S3 presigned URL for ${file.name}`);
      console.log(`🔗 Using S3 Presign URL: ${this.S3_PRESIGN_URL}`);

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
        headers: {
          'Content-Type': file.type,
          // Send only headers that are part of the presign signature
          'x-amz-server-side-encryption': 'AES256',
        },
        body: file,
      });

      if (!putRes.ok) {
        const text = await putRes.text();
        console.error('❌ S3 PUT failed:', putRes.status, text);
        return { success: false, error: `S3 PUT failed: ${putRes.status}` };
      }

      console.log(`✅ S3 upload successful: ${cleanUrl}`);

      // Send file URL to webhook instead of file data
      const webhookData: FileUploadWebhookData = {
        reference_id: referenceId,
        file_name: file.name,
        section_name: sectionName,
        document_name: documentName,
        file_base64: '', // Not used for S3 uploads, but required by interface
        application_id: applicationId || '',
        id: id || '',
        comment_id: commentId,
        // Additional S3-specific fields
        s3_url: cleanUrl,
        s3_key: key,
        file_size: file.size,
        file_type: file.type,
        uploaded_at: new Date().toISOString(),
      };

      console.log(`📤 Sending file URL to webhook: ${file.name}`);
      console.log(`🔗 S3 URL: ${cleanUrl}`);
      console.log(`📋 Webhook data with ID:`, JSON.stringify(webhookData, null, 2));
      console.log(`🆔 Document ID being sent:`, id);
      console.log(`💬 Comment ID being sent:`, commentId);

      // Send both structured and flat versions for compatibility
      const webhookPayload = {
        webhookType: 'file_upload',
        webhookData: webhookData,
        // Also include flat structure for webhook receivers that expect direct fields
        ...webhookData
      };

      console.log(`📤 Full webhook payload:`, JSON.stringify(webhookPayload, null, 2));

      const webhookResponse = await fetch(this.WEBHOOK_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      const responseBody = await webhookResponse.text();

      console.log(`📥 Webhook response status: ${webhookResponse.status}`);
      console.log(`📥 Webhook response body:`, responseBody);

      if (webhookResponse.ok) {
        console.log('✅ Webhook call successful');
        console.log(`🔍 Verifying ID field was sent: ${webhookData.id}`);
        return {
          success: true,
          url: cleanUrl,
          key: key,
          webhookResponse: responseBody
        };
      } else {
        console.error('❌ Webhook call failed:', webhookResponse.status, responseBody);
        // Consider the operation successful if S3 upload succeeded.
        // Surface webhook error for logging/telemetry without blocking user.
        return {
          success: true,
          error: `Webhook failed: ${webhookResponse.status} - ${responseBody}`,
          url: cleanUrl,
          key: key,
          webhookResponse: responseBody
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
    commentId?: string,
    id?: string
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
      id: id || '',
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
   * Sends separate webhook for applicant only
   */
  static async sendApplicantWebhook(
    formData: any,
    referenceId: string,
    applicationId: string,
    zoneinfo?: string,
    uploadedFiles?: any
  ): Promise<{ success: boolean; error?: string }> {
    const stableAppId = zoneinfo || applicationId || '';
    const submissionId = `${referenceId}-applicant-${stableAppId}`;
    
    if (this.ongoingSubmissions.has(submissionId)) {
      console.log('⚠️ Duplicate applicant webhook submission detected, skipping:', submissionId);
      return { success: false, error: 'Duplicate submission detected' };
    }
    
    this.ongoingSubmissions.add(submissionId);
    
    try {
      // Create applicant-only payload
      const applicantPayload = this.createApplicantOnlyPayload(formData, uploadedFiles);
      
      const webhookData: FormDataWebhookData = {
        reference_id: referenceId,
        application_id: zoneinfo || applicationId,
        role: 'applicant',
        form_data: applicantPayload,
        uploaded_files: this.filterApplicantFiles(uploadedFiles),
        submission_type: 'applicant_only'
      };

      console.log(`📤 Sending applicant-only webhook for application ${applicationId}`);
      
      const response = await this.sendWebhookRequest(webhookData, 'applicant_only');
      
      this.ongoingSubmissions.delete(submissionId);
      return response;

    } catch (error) {
      console.error('Error in sendApplicantWebhook:', error);
      this.ongoingSubmissions.delete(submissionId);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sends separate webhook for co-applicant
   */
  static async sendCoApplicantWebhook(
    coApplicant: any,
    coApplicantIndex: number,
    formData: any,
    referenceId: string,
    applicationId: string,
    zoneinfo?: string,
    uploadedFiles?: any
  ): Promise<{ success: boolean; error?: string }> {
    const stableAppId = zoneinfo || applicationId || '';
    const submissionId = `${referenceId}-coapplicant-${coApplicantIndex}-${stableAppId}`;
    
    if (this.ongoingSubmissions.has(submissionId)) {
      console.log('⚠️ Duplicate co-applicant webhook submission detected, skipping:', submissionId);
      return { success: false, error: 'Duplicate submission detected' };
    }
    
    this.ongoingSubmissions.add(submissionId);
    
    try {
      // Create co-applicant-only payload
      const coApplicantPayload = this.createCoApplicantOnlyPayload(coApplicant, coApplicantIndex, formData, uploadedFiles);
      
      const webhookData: FormDataWebhookData = {
        reference_id: referenceId,
        application_id: zoneinfo || applicationId,
        role: `coapplicant${coApplicantIndex + 1}`,
        form_data: coApplicantPayload,
        uploaded_files: this.filterCoApplicantFiles(uploadedFiles, coApplicantIndex),
        submission_type: 'coapplicant_only'
      };

      console.log(`📤 Sending co-applicant ${coApplicantIndex + 1} webhook for application ${applicationId}`);
      
      // Attach webhook summary if available from transform (scoped to this co-applicant)
      try {
        const transformed = this.transformFormDataToWebhookFormat({ ...formData, coApplicants: [coApplicant] }, uploadedFiles);
        if (transformed && (transformed as any).webhookSummary) {
          (webhookData as any).webhookSummary = (transformed as any).webhookSummary;
        }
      } catch (e) {
        console.warn('⚠️ Could not attach webhookSummary to co-applicant webhookData:', e instanceof Error ? e.message : String(e));
      }

      const response = await this.sendWebhookRequest(webhookData, 'coapplicant_only');
      
      this.ongoingSubmissions.delete(submissionId);
      return response;

    } catch (error) {
      console.error('Error in sendCoApplicantWebhook:', error);
      this.ongoingSubmissions.delete(submissionId);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sends separate webhook for guarantor
   */
  static async sendGuarantorWebhook(
    guarantor: any,
    guarantorIndex: number,
    formData: any,
    referenceId: string,
    applicationId: string,
    zoneinfo?: string,
    uploadedFiles?: any
  ): Promise<{ success: boolean; error?: string }> {
    const stableAppId = zoneinfo || applicationId || '';
    const submissionId = `${referenceId}-guarantor-${guarantorIndex}-${stableAppId}`;
    
    if (this.ongoingSubmissions.has(submissionId)) {
      console.log('⚠️ Duplicate guarantor webhook submission detected, skipping:', submissionId);
      return { success: false, error: 'Duplicate submission detected' };
    }
    
    this.ongoingSubmissions.add(submissionId);
    
    try {
      // Create guarantor-only payload
      const guarantorPayload = this.createGuarantorOnlyPayload(guarantor, guarantorIndex, formData, uploadedFiles);
      
      const webhookData: FormDataWebhookData = {
        reference_id: referenceId,
        application_id: zoneinfo || applicationId,
        role: `guarantor${guarantorIndex + 1}`,
        form_data: guarantorPayload,
        uploaded_files: this.filterGuarantorFiles(uploadedFiles, guarantorIndex),
        submission_type: 'guarantor_only'
      };

      // Attach webhook summary if available from transform
      try {
        const transformed = this.transformFormDataToWebhookFormat({ ...formData, guarantors: [guarantor] }, uploadedFiles);
        if (transformed && (transformed as any).webhookSummary) {
          (webhookData as any).webhookSummary = (transformed as any).webhookSummary;
        }
      } catch (e) {
        console.warn('⚠️ Could not attach webhookSummary to guarantor webhookData:', e instanceof Error ? e.message : String(e));
      }

      console.log(`📤 Sending guarantor ${guarantorIndex + 1} webhook for application ${applicationId}`);
      
      const response = await this.sendWebhookRequest(webhookData, 'guarantor_only');
      
      this.ongoingSubmissions.delete(submissionId);
      return response;

    } catch (error) {
      console.error('Error in sendGuarantorWebhook:', error);
      this.ongoingSubmissions.delete(submissionId);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sends all webhooks separately for each role
   */
  static async sendSeparateWebhooks(
    formData: any,
    referenceId: string,
    applicationId: string,
    zoneinfo?: string,
    uploadedFiles?: any
  ): Promise<{ 
    success: boolean; 
    error?: string; 
    results: {
      applicant: { success: boolean; error?: string };
      coApplicants: Array<{ success: boolean; error?: string; index: number }>;
      guarantors: Array<{ success: boolean; error?: string; index: number }>;
    }
  }> {
    console.log('🚀 Starting separate webhook submissions for all roles');
    
    const results = {
      applicant: { success: false },
      coApplicants: [] as Array<{ success: boolean; error?: string; index: number }>,
      guarantors: [] as Array<{ success: boolean; error?: string; index: number }>
    };

    try {
      // Send applicant webhook
      console.log('📤 Sending applicant webhook...');
      results.applicant = await this.sendApplicantWebhook(formData, referenceId, applicationId, zoneinfo, uploadedFiles);
      
      // Send co-applicant webhooks
      if (formData.coApplicants && formData.coApplicants.length > 0) {
        console.log(`📤 Sending ${formData.coApplicants.length} co-applicant webhooks...`);
        
        for (let i = 0; i < formData.coApplicants.length; i++) {
          const coApplicant = formData.coApplicants[i];
          if (coApplicant && coApplicant.name) {
            const result = await this.sendCoApplicantWebhook(
              coApplicant, 
              i, 
              formData, 
              referenceId, 
              applicationId, 
              zoneinfo, 
              uploadedFiles
            );
            results.coApplicants.push({ ...result, index: i });
          }
        }
      }
      
      // Send guarantor webhooks
      if (formData.guarantors && formData.guarantors.length > 0) {
        console.log(`📤 Sending ${formData.guarantors.length} guarantor webhooks...`);
        
        for (let i = 0; i < formData.guarantors.length; i++) {
          const guarantor = formData.guarantors[i];
          if (guarantor && guarantor.name) {
            const result = await this.sendGuarantorWebhook(
              guarantor, 
              i, 
              formData, 
              referenceId, 
              applicationId, 
              zoneinfo, 
              uploadedFiles
            );
            results.guarantors.push({ ...result, index: i });
          }
        }
      }

      // Check if all webhooks were successful
      const allSuccessful = results.applicant.success && 
        results.coApplicants.every(r => r.success) && 
        results.guarantors.every(r => r.success);

      console.log('📊 Separate webhook submission results:', {
        applicant: results.applicant.success,
        coApplicants: results.coApplicants.map(r => ({ index: r.index, success: r.success })),
        guarantors: results.guarantors.map(r => ({ index: r.index, success: r.success }))
      });

      return {
        success: allSuccessful,
        error: allSuccessful ? undefined : 'Some webhook submissions failed',
        results
      };

    } catch (error) {
      console.error('Error in sendSeparateWebhooks:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results
      };
    }
  }

  /**
   * Sends webhook(s) based on role
   */
  static async sendRoleBasedWebhook(
    role: 'applicant' | 'coApplicant' | 'guarantor' | 'all',
    formData: any,
    referenceId: string,
    applicationId: string,
    zoneinfo?: string,
    uploadedFiles?: any
  ): Promise<{ success: boolean; error?: string }> {
    if (role === 'applicant') {
      return this.sendApplicantWebhook(formData, referenceId, applicationId, zoneinfo, uploadedFiles);
    }
    if (role === 'coApplicant') {
      if (Array.isArray(formData.coApplicants) && formData.coApplicants.length > 0) {
        const results = [] as Array<{ success: boolean; error?: string }>;
        for (let i = 0; i < formData.coApplicants.length; i++) {
          const res = await this.sendCoApplicantWebhook(formData.coApplicants[i], i, formData, referenceId, applicationId, zoneinfo, uploadedFiles);
          results.push(res);
        }
        return { success: results.every(r => r.success), error: results.find(r => !r.success)?.error };
      }
      return { success: true };
    }
    if (role === 'guarantor') {
      if (Array.isArray(formData.guarantors) && formData.guarantors.length > 0) {
        const results = [] as Array<{ success: boolean; error?: string }>;
        for (let i = 0; i < formData.guarantors.length; i++) {
          const res = await this.sendGuarantorWebhook(formData.guarantors[i], i, formData, referenceId, applicationId, zoneinfo, uploadedFiles);
          results.push(res);
        }
        return { success: results.every(r => r.success), error: results.find(r => !r.success)?.error };
      }
      return { success: true };
    }
    // role === 'all'
    const all = await this.sendSeparateWebhooks(formData, referenceId, applicationId, zoneinfo, uploadedFiles);
    return { success: all.success, error: all.error };
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
    },
    role?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Create a stable submission ID to prevent duplicate sends
    const stableAppId = zoneinfo || applicationId || '';
    const submissionId = `${referenceId}-form-${stableAppId}`;
    
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
      
      // Debug: Log the role parameter
      console.log('🔍 DEBUG: Role parameter received:', role);
      console.log('🔍 DEBUG: Role value being set:', role || 'applicant');
      
      // Format data for external webhook
      const roleValue = role || 'applicant';
      console.log('🔍 DEBUG: Final role value before webhook data creation:', roleValue);
      
      // Normalize counterpart sections to be explicitly empty based on submitting role
      try {
        if (typeof roleValue === 'string') {
          if (roleValue.toLowerCase().startsWith('coapplicant')) {
            // Co-Applicant submission → send empty guarantor section
            (transformedData as any).hasGuarantor = false;
            (transformedData as any).guarantorCount = 0;
            (transformedData as any).guarantors = [];
          } else if (roleValue.toLowerCase().startsWith('guarantor')) {
            // Guarantor submission → send empty co-applicant section
            (transformedData as any).hasCoApplicant = false;
            (transformedData as any).coApplicantCount = 0;
            (transformedData as any).coApplicants = [];
          }

          // Ensure role is also present INSIDE form_data mirroring login role (e.g., guarantor1)
          (transformedData as any).role = roleValue;
        }
      } catch (e) {
        console.warn('Role-based empty section normalization failed', e);
      }
      
      const webhookData: FormDataWebhookData = {
        reference_id: referenceId,
        application_id: zoneinfo || applicationId,
        role: roleValue,
        form_data: transformedData,
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
        // Debug: Log the final webhook data being sent
        console.log('🔍 DEBUG: Final webhook data being sent:', JSON.stringify(webhookData, null, 2));
        console.log('🔍 DEBUG: Role in webhook data:', webhookData.role);
        console.log('🔍 DEBUG: Webhook data keys:', Object.keys(webhookData));
        console.log('🔍 DEBUG: Role attribute exists:', 'role' in webhookData);
        console.log('🔍 DEBUG: Role value type:', typeof webhookData.role);
        
        // Send directly to Make.com for main application submission
        const response = await fetch(this.MAKE_COM_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Post the payload directly without wrapper for Make.com
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
        console.log(`✅ Form data sent to Make.com successfully in ${responseTime}ms`);
        console.log(`📊 Make.com Performance: ${payloadSizeMB}MB payload, ${responseTime}ms response time`);
        
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
   * Creates applicant-only payload with proper form field documents structure
   */
  private static createApplicantOnlyPayload(formData: any, uploadedFiles?: any): any {
    const transformedData = this.transformFormDataToWebhookFormat(formData, uploadedFiles);
    
    // For applicant role, only include applicant data - exclude co-applicants and guarantors
    return {
      role: 'applicant', // Add role attribute at top level
      application: transformedData.application,
      applicant: transformedData.applicant,
      // Include occupants with proper structure
      occupants: transformedData.occupants || [],
      // For applicant role, set all additional people flags to false
      hasCoApplicant: false,
      hasGuarantor: false,
      coApplicantCount: 0,
      guarantorCount: 0,
      // Include Additional People section with only applicant info
      "Additional People": {
        zoneinfo: formData.zoneinfo || formData.applicantId || 'unknown',
        role: 'applicant',
        applicant: transformedData.applicant?.name || 'unknown'
      },
      // Include webhook summary for form field documents
      webhookSummary: transformedData.webhookSummary,
      // Include legal questions
      landlordTenantLegalAction: transformedData.landlordTenantLegalAction,
      brokenLease: transformedData.brokenLease,
      // Include signatures
      signatures: transformedData.signatures
    };
  }

  /**
   * Creates co-applicant-only payload
   */
  private static createCoApplicantOnlyPayload(coApplicant: any, coApplicantIndex: number, formData: any, uploadedFiles?: any): any {
    const transformedData = this.transformFormDataToWebhookFormat(formData, uploadedFiles);
    
    // Guard against missing index in transformedData.coApplicants
    const coApplicantFromTransformed = Array.isArray(transformedData.coApplicants)
      ? transformedData.coApplicants[coApplicantIndex]
      : undefined;
    const safeCoApplicant = coApplicantFromTransformed || coApplicant || {};

    return {
      role: `coapplicant${coApplicantIndex + 1}`, // match login role
      application: transformedData.application,
      // Include only the specific co-applicant
      coApplicants: [safeCoApplicant],
      // Explicit empty counterpart array as required by receiver
      guarantors: [],
      // Include webhook summary so receivers see it inside form_data
      webhookSummary: transformedData.webhookSummary,
      // Include basic application info
      hasCoApplicant: true,
      hasGuarantor: false,
      coApplicantCount: 1,
      guarantorCount: 0,
      // Include legal questions
      landlordTenantLegalAction: transformedData.landlordTenantLegalAction,
      brokenLease: transformedData.brokenLease,
      // Include signatures
      signatures: transformedData.signatures
    };
  }

  /**
   * Creates guarantor-only payload
   */
  private static createGuarantorOnlyPayload(guarantor: any, guarantorIndex: number, formData: any, uploadedFiles?: any): any {
    const transformedData = this.transformFormDataToWebhookFormat(formData, uploadedFiles);
    
    // Guard against missing index in transformedData.guarantors
    const guarantorFromTransformed = Array.isArray(transformedData.guarantors)
      ? transformedData.guarantors[guarantorIndex]
      : undefined;
    const safeGuarantor = guarantorFromTransformed || guarantor || {};
    
    return {
      role: `guarantor${guarantorIndex + 1}`, // match login role
      application: transformedData.application,
      // Include only the specific guarantor
      guarantors: [safeGuarantor],
      // Explicit empty counterpart array as required by receiver
      coApplicants: [],
      // Include webhook summary so receivers see it inside form_data
      webhookSummary: transformedData.webhookSummary,
      // Include basic application info
      hasCoApplicant: false,
      hasGuarantor: true,
      coApplicantCount: 0,
      guarantorCount: 1,
      // Include legal questions
      landlordTenantLegalAction: transformedData.landlordTenantLegalAction,
      brokenLease: transformedData.brokenLease,
      // Include signatures
      signatures: transformedData.signatures
    };
  }

  /**
   * Filters uploaded files for applicant only
   */
  private static filterApplicantFiles(uploadedFiles?: any): any {
    if (!uploadedFiles) return {};
    
    return {
      supporting_w9_forms: uploadedFiles.supporting_w9_forms || [],
      supporting_photo_id: uploadedFiles.supporting_photo_id || [],
      supporting_social_security: uploadedFiles.supporting_social_security || [],
      supporting_bank_statement: uploadedFiles.supporting_bank_statement || [],
      supporting_tax_returns: uploadedFiles.supporting_tax_returns || [],
      supporting_employment_letter: uploadedFiles.supporting_employment_letter || [],
      supporting_pay_stubs: uploadedFiles.supporting_pay_stubs || [],
      supporting_credit_report: uploadedFiles.supporting_credit_report || [],
      other_occupants_identity: uploadedFiles.other_occupants_identity || []
    };
  }

  /**
   * Filters uploaded files for specific co-applicant
   */
  private static filterCoApplicantFiles(uploadedFiles?: any, coApplicantIndex: number = 0): any {
    if (!uploadedFiles) return {};

    // Try indexed structure first if present (e.g., arrays per co-applicant)
    const indexed = Array.isArray(uploadedFiles.coApplicants)
      ? uploadedFiles.coApplicants[coApplicantIndex] || {}
      : {};

    // Merge both generic coApplicant_* buckets and any indexed buckets
    const merged = {
      // Indexed buckets
      ...(indexed || {}),
      // Generic buckets
      coApplicant_w9_forms: uploadedFiles.coApplicant_w9_forms || [],
      coApplicant_photo_id: uploadedFiles.coApplicant_photo_id || [],
      coApplicant_social_security: uploadedFiles.coApplicant_social_security || [],
      coApplicant_bank_statement: uploadedFiles.coApplicant_bank_statement || [],
      coApplicant_tax_returns: uploadedFiles.coApplicant_tax_returns || [],
      coApplicant_employment_letter: uploadedFiles.coApplicant_employment_letter || [],
      coApplicant_pay_stubs: uploadedFiles.coApplicant_pay_stubs || [],
      coApplicant_credit_report: uploadedFiles.coApplicant_credit_report || [],
      // Fallback: include applicant-shared categories if Make scenario expects them
      supporting_w9_forms: uploadedFiles.supporting_w9_forms || [],
      supporting_photo_id: uploadedFiles.supporting_photo_id || [],
      supporting_social_security: uploadedFiles.supporting_social_security || [],
      supporting_bank_statement: uploadedFiles.supporting_bank_statement || [],
      supporting_tax_returns: uploadedFiles.supporting_tax_returns || [],
      supporting_employment_letter: uploadedFiles.supporting_employment_letter || [],
      supporting_pay_stubs: uploadedFiles.supporting_pay_stubs || [],
      supporting_credit_report: uploadedFiles.supporting_credit_report || []
    };

    // Include raw for debugging in Make (non-breaking to receivers that ignore unknown fields)
    (merged as any).raw = uploadedFiles;
    return merged;
  }

  /**
   * Filters uploaded files for specific guarantor
   */
  private static filterGuarantorFiles(uploadedFiles?: any, guarantorIndex: number = 0): any {
    if (!uploadedFiles) return {};

    // Try indexed structure first if present (e.g., arrays per guarantor)
    const indexed = Array.isArray(uploadedFiles.guarantors)
      ? uploadedFiles.guarantors[guarantorIndex] || {}
      : {};

    const merged = {
      // Indexed buckets
      ...(indexed || {}),
      // Generic buckets
      guarantor_w9_forms: uploadedFiles.guarantor_w9_forms || [],
      guarantor_photo_id: uploadedFiles.guarantor_photo_id || [],
      guarantor_social_security: uploadedFiles.guarantor_social_security || [],
      guarantor_bank_statement: uploadedFiles.guarantor_bank_statement || [],
      guarantor_tax_returns: uploadedFiles.guarantor_tax_returns || [],
      guarantor_employment_letter: uploadedFiles.guarantor_employment_letter || [],
      guarantor_pay_stubs: uploadedFiles.guarantor_pay_stubs || [],
      guarantor_credit_report: uploadedFiles.guarantor_credit_report || [],
      // Fallback: include applicant-shared categories if Make scenario expects them
      supporting_w9_forms: uploadedFiles.supporting_w9_forms || [],
      supporting_photo_id: uploadedFiles.supporting_photo_id || [],
      supporting_social_security: uploadedFiles.supporting_social_security || [],
      supporting_bank_statement: uploadedFiles.supporting_bank_statement || [],
      supporting_tax_returns: uploadedFiles.supporting_tax_returns || [],
      supporting_employment_letter: uploadedFiles.supporting_employment_letter || [],
      supporting_pay_stubs: uploadedFiles.supporting_pay_stubs || [],
      supporting_credit_report: uploadedFiles.supporting_credit_report || []
    };

    (merged as any).raw = uploadedFiles;
    return merged;
  }

  /**
   * Sends webhook request with proper error handling
   */
  private static async sendWebhookRequest(webhookData: FormDataWebhookData, webhookType: string): Promise<{ success: boolean; error?: string }> {
    const payloadSize = JSON.stringify(webhookData).length;
    const payloadSizeMB = Math.round(payloadSize / (1024 * 1024) * 100) / 100;
    
    console.log(`📊 ${webhookType} payload size: ${payloadSizeMB}MB`);
    
    if (payloadSizeMB > 5) {
      console.warn(`⚠️ Large ${webhookType} payload detected:`, payloadSizeMB, 'MB');
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout
    
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
        console.error(`${webhookType} webhook failed:`, response.status, errorText);
        return {
          success: false,
          error: `${webhookType} webhook failed: ${response.status} - ${errorText}`
        };
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ ${webhookType} webhook sent successfully in ${responseTime}ms`);
      
      return { success: true };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`${webhookType} webhook request timed out after 90 seconds`);
        return {
          success: false,
          error: `${webhookType} webhook request timed out`
        };
      }
      
      console.error(`Error sending ${webhookType} webhook:`, fetchError);
      
      return {
        success: false,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
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

    // Build role-based documents map from webhookResponses (extract direct URLs)
    const buildDocumentsFromWebhookResponses = (rolePrefix: string): Record<string, string> => {
      const docs: Record<string, string> = {};
      try {
        Object.entries(webhookResponses).forEach(([key, value]) => {
          if (key.startsWith(`${rolePrefix}_`)) {
            const sectionName = key.replace(`${rolePrefix}_`, '');
            const url = extractWebhookUrl(value as any);
            if (url) {
              docs[sectionName] = url;
            }
          }
        });
      } catch (e) {
        console.warn('Failed building documents from webhookResponses for', rolePrefix, e);
      }
      return docs;
    };

    const applicantDocuments = buildDocumentsFromWebhookResponses('applicant');
    const coApplicantDocuments = buildDocumentsFromWebhookResponses('coApplicant');
    const guarantorDocuments = buildDocumentsFromWebhookResponses('guarantor');

    // Transform the data into the exact structure needed
    const transformedData: any = {
      // Application section - use new nested structure if available
      application: formData.application || {
        buildingAddress: formData.buildingAddress,
        apartmentNumber: formData.apartmentNumber,
        apartmentType: formData.apartmentType,
        monthlyRent: formData.monthlyRent,
        moveInDate: formData.moveInDate,
        howDidYouHear: formData.howDidYouHear,
        howDidYouHearOther: formData.howDidYouHearOther || ""
      },

      // Applicant section - use new nested structure if available
      applicant: (formData.applicant ? {
        ...formData.applicant,
        ...(Object.keys(applicantDocuments).length > 0 ? { documents: applicantDocuments } : {})
      } : {
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
        income: formData.applicantSalary || formData.applicant?.income || formData.applicant?.salary || "",
        incomeFrequency: formData.applicantIncomeFrequency || formData.applicant?.incomeFrequency || "monthly",
        businessName: formData.applicant?.businessName || "",
        businessType: formData.applicant?.businessType || "",
        yearsInBusiness: formData.applicant?.yearsInBusiness || "",
        otherIncome: formData.applicantOtherIncome || formData.applicant?.otherIncome || "",
        otherIncomeFrequency: formData.applicant?.otherIncomeFrequency || "monthly",
        otherIncomeSource: formData.applicantOtherIncomeSource || formData.applicant?.otherIncomeSource || "",
        bankRecords: formData.applicantBankRecords || formData.applicant?.bankRecords || [],
        ...(Object.keys(applicantDocuments).length > 0 ? { documents: applicantDocuments } : {})
      }),


      // Occupants section with proper structure
      occupants: (formData.otherOccupants || []).map((occupant: any, index: number) => ({
        occupant: `occupant${index + 1}`,
        name: occupant.name,
        relationship: occupant.relationship,
        dob: occupant.dob,
        ssn: occupant.ssn,
        license: occupant.license,
        age: occupant.age || 0
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
      },
      
      // PDF URL from generated application PDF
      pdfUrl: formData.pdfUrl
    };


    // Add Additional People section if co-applicants or guarantors exist
    if (formData.hasCoApplicant || formData.hasGuarantor) {
      const additionalPeople: any = {
        zoneinfo: formData.zoneinfo || formData.applicantId || 'unknown',
        role: 'applicant',
        applicant: transformedData.applicant?.name || 'unknown',
        applicantEmail: transformedData.applicant?.email || formData.applicantEmail || ''
      };

      // Add all co-applicants as numbered entries
      if (formData.hasCoApplicant && Array.isArray(formData.coApplicants)) {
        formData.coApplicants.forEach((coApp: any, index: number) => {
          const idx = index + 1;
          const key = `coApplicants${idx}`;
          additionalPeople[key] = {
            coApplicant: `coapplicant${idx}`,
            url: `https://www.app.lppmrentals.com/login?role=coapplicant${idx}&zoneinfo=${formData.zoneinfo || formData.applicantId || 'unknown'}`,
            name: coApp?.name || 'Co-Applicant',
            email: coApp?.email || ''
          };
        });
      }

      // Add all guarantors as numbered entries
      if (formData.hasGuarantor && Array.isArray(formData.guarantors)) {
        formData.guarantors.forEach((guar: any, index: number) => {
          const idx = index + 1;
          const key = `guarantor${idx}`;
          additionalPeople[key] = {
            guarantor: `guarantor${idx}`,
            url: `https://www.app.lppmrentals.com/login?role=guarantor${idx}&zoneinfo=${formData.zoneinfo || formData.applicantId || 'unknown'}`,
            name: guar?.name || 'Guarantor',
            email: guar?.email || ''
          };
        });
      }

      (transformedData as any)["Additional People"] = additionalPeople;
    }

    // Debug logging for transformed income fields
    console.log('🔍 === TRANSFORMED INCOME FIELDS DEBUG ===');
    console.log('📊 Transformed Applicant income:', {
      income: transformedData.applicant.income,
      incomeFrequency: transformedData.applicant.incomeFrequency,
      otherIncome: transformedData.applicant.otherIncome,
      otherIncomeSource: transformedData.applicant.otherIncomeSource
    });
    
    if (transformedData.coApplicants && transformedData.coApplicants.length > 0) {
      console.log('📊 Transformed Co-Applicants income:', transformedData.coApplicants.map((co: any) => ({
        coApplicant: co.coApplicant,
        income: co.income,
        incomeFrequency: co.incomeFrequency,
        otherIncome: co.otherIncome,
        otherIncomeSource: co.otherIncomeSource
      })));
    }
    
    if (transformedData.guarantors && transformedData.guarantors.length > 0) {
      console.log('📊 Transformed Guarantors income:', transformedData.guarantors.map((guarantor: any) => ({
        guarantor: guarantor.guarantor,
        income: guarantor.income,
        incomeFrequency: guarantor.incomeFrequency,
        otherIncome: guarantor.otherIncome,
        otherIncomeSource: guarantor.otherIncomeSource
      })));
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
  ): Promise<{ success: boolean; error?: string; s3Url?: string }> {
    try {
      // First, upload PDF to S3
      console.log(`📤 Uploading PDF to S3 first: ${fileName}`);
      const s3Result = await S3Service.uploadPDFFromBase64(
        pdfBase64,
        fileName,
        referenceId,
        applicationId
      );

      if (!s3Result.success) {
        console.error('❌ Failed to upload PDF to S3:', s3Result.error);
        return {
          success: false,
          error: `Failed to upload PDF to S3: ${s3Result.error}`,
          s3Url: undefined
        };
      }

      // Now send the S3 URL in the webhook
      const webhookData: PDFWebhookData = {
        reference_id: referenceId,
        application_id: applicationId,
        applicant_id: applicantId,
        file_name: fileName,
        file_base64: pdfBase64, // Required by interface
        s3_url: s3Result.url,
        s3_key: s3Result.key,
        submission_type: 'pdf_generation',
        file_size: Math.round(pdfBase64.length / 1024), // Size in KB
        file_type: 'application/pdf'
      };

      console.log(`📤 Sending PDF webhook with S3 URL: ${fileName}`);
      console.log(`🔗 S3 URL: ${s3Result.url}`);

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
          error: `PDF webhook failed: ${response.status} - ${errorText}`,
          s3Url: s3Result.url
        };
      }

      console.log('✅ PDF uploaded to S3 and webhook sent successfully');
      return { success: true, s3Url: s3Result.url };

    } catch (error) {
      console.error('Error sending PDF to webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        s3Url: undefined
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