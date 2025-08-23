import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface S3UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export class S3Service {
  private static s3Client: S3Client | null = null;
  private static bucketName: string;
  private static region: string;

  private static getS3Client(): S3Client {
    if (!this.s3Client) {
      this.bucketName = import.meta.env.VITE_AWS_S3_BUCKET_NAME || 'supportingdocuments-storage-2025';
      this.region = import.meta.env.VITE_AWS_REGION || 'us-east-1';
      
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
          secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
        },
      });
    }
    return this.s3Client;
  }

  /**
   * Upload a file to S3 and return the URL
   */
  static async uploadFile(
    file: File,
    referenceId: string,
    sectionName: string,
    documentName: string
  ): Promise<S3UploadResult> {
    try {
      const s3Client = this.getS3Client();
      
      // Generate unique key for the file
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = `documents/${referenceId}/${sectionName}/${timestamp}_${safeFileName}`;
      
      console.log(`🚀 Starting S3 upload: ${file.name} to ${key}`);
      console.log(`📊 File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          referenceId: referenceId,
          sectionName: sectionName,
          documentName: documentName,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(uploadCommand);
      
      // Generate presigned URL for access
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 }); // 1 hour

      console.log(`✅ S3 upload successful: ${file.name}`);
      console.log(`🔗 S3 URL: ${presignedUrl}`);

      return {
        success: true,
        url: presignedUrl,
        key: key,
      };

    } catch (error) {
      console.error(`❌ S3 upload failed for ${file.name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown S3 upload error',
      };
    }
  }

  /**
   * Upload a PDF from base64 data to S3 using the existing working S3 presign setup
   */
  static async uploadPDFFromBase64(
    pdfBase64: string,
    fileName: string,
    referenceId: string,
    applicationId: string
  ): Promise<S3UploadResult> {
    try {
      console.log(`🚀 Starting PDF S3 upload using existing presign setup: ${fileName}`);
      console.log(`📊 PDF size: ${(pdfBase64.length / 1024 / 1024).toFixed(2)}MB`);

      // Get the current user's zoneinfo from Cognito attributes
      let zoneinfo = applicationId; // fallback
      try {
        const { fetchUserAttributes } = await import('aws-amplify/auth');
        const attributes = await fetchUserAttributes();
        zoneinfo = attributes.zoneinfo || attributes['custom:zoneinfo'] || applicationId;
        console.log(`🌍 Using zoneinfo: ${zoneinfo}`);
      } catch (error) {
        console.warn('⚠️ Could not get user zoneinfo, using applicationId as fallback:', error);
        zoneinfo = applicationId;
      }

      // Convert base64 to File object to use existing working S3 presign flow
      const binaryString = atob(pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create a File object from the binary data
      const pdfFile = new File([bytes], fileName, { type: 'application/pdf' });
      console.log(`📄 Created File object: ${pdfFile.name}, size: ${pdfFile.size} bytes`);

      // Use the existing working S3 presign flow from WebhookService
      const { WebhookService } = await import('./webhook-service');
      
      const result = await WebhookService.uploadFileToS3AndSendToWebhook(
        pdfFile,
        referenceId,
        'pdfs', // sectionName
        applicationId, // documentName - using applicationId as requested
        applicationId, // applicationId
        zoneinfo, // zoneinfo
        undefined // commentId
      );

      if (result.success) {
        console.log(`✅ PDF S3 upload successful using existing presign setup: ${fileName}`);
        console.log(`🔗 S3 URL: ${result.url}`);
        
        return {
          success: true,
          url: result.url!,
          key: result.key!,
        };
      } else {
        throw new Error(result.error || 'S3 upload failed');
      }

    } catch (error) {
      console.error(`❌ PDF S3 upload failed for ${fileName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown PDF S3 upload error',
      };
    }
  }

  /**
   * Upload multiple files to S3
   */
  static async uploadFiles(
    files: File[],
    referenceId: string,
    sectionName: string,
    documentName: string
  ): Promise<S3UploadResult[]> {
    const results: S3UploadResult[] = [];
    
    for (const file of files) {
      const result = await this.uploadFile(file, referenceId, sectionName, documentName);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Generate a new presigned URL for an existing S3 object
   */
  static async getPresignedUrl(key: string): Promise<string | null> {
    try {
      const s3Client = this.getS3Client();
      
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
      return presignedUrl;
      
    } catch (error) {
      console.error(`❌ Failed to generate presigned URL for ${key}:`, error);
      return null;
    }
  }
}
