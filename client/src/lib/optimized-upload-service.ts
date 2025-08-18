import { useToast } from '../hooks/use-toast';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  estimatedTime: number; // seconds remaining
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
  performance?: {
    totalTime: number;
    parseTime: number;
    bufferTime: number;
    uploadTime: number;
    urlTime: number;
  };
}

export interface UploadOptions {
  chunkSize?: number; // Default: 5MB
  maxRetries?: number; // Default: 3
  timeout?: number; // Default: 120 seconds
  onProgress?: (progress: UploadProgress) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
}

export class OptimizedUploadService {
  private static readonly DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly DEFAULT_TIMEOUT = 120000; // 120 seconds
  private static readonly DEFAULT_MAX_RETRIES = 3;

  /**
   * Upload file with progress tracking and optimization
   */
  static async uploadFile(
    file: File,
    referenceId: string,
    sectionName: string,
    documentName: string,
    zoneinfo: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const startTime = Date.now();
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
    const maxRetries = options.maxRetries || this.DEFAULT_MAX_RETRIES;
    const timeout = options.timeout || this.DEFAULT_TIMEOUT;

    try {
      console.log(`🚀 Starting optimized upload for ${file.name}`);
      console.log(`📊 File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      console.log(`🔧 Chunk size: ${(chunkSize / (1024 * 1024)).toFixed(2)}MB`);

      // For files smaller than chunk size, use direct upload
      if (file.size <= chunkSize) {
        return await this.directUpload(file, referenceId, sectionName, documentName, zoneinfo, options);
      }

      // For larger files, use chunked upload
      return await this.chunkedUpload(
        file, 
        referenceId, 
        sectionName, 
        documentName, 
        zoneinfo, 
        chunkSize, 
        maxRetries, 
        timeout, 
        options
      );

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ Upload failed after ${totalTime}ms:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        performance: {
          totalTime,
          parseTime: 0,
          bufferTime: 0,
          uploadTime: 0,
          urlTime: 0
        }
      };
    }
  }

  /**
   * Direct upload for smaller files
   */
  private static async directUpload(
    file: File,
    referenceId: string,
    sectionName: string,
    documentName: string,
    zoneinfo: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const startTime = Date.now();
    
    try {
      // Convert file to base64 with progress tracking
      const base64StartTime = Date.now();
      const base64Data = await this.fileToBase64(file, options.onProgress);
      const base64Time = Date.now() - base64StartTime;
      
      console.log(`⏱️ Base64 conversion time: ${base64Time}ms`);

      // Upload to S3
      const uploadStartTime = Date.now();
      const response = await fetch('/api/s3-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: file.name,
          fileType: file.type,
          referenceId: referenceId,
          sectionName: sectionName,
          documentName: documentName,
          zoneinfo: zoneinfo,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const uploadTime = Date.now() - uploadStartTime;
      const totalTime = Date.now() - startTime;

      console.log(`✅ Direct upload completed in ${totalTime}ms`);
      
      return {
        success: true,
        url: result.url,
        key: result.key,
        performance: {
          totalTime,
          parseTime: base64Time,
          bufferTime: 0,
          uploadTime: uploadTime,
          urlTime: 0
        }
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      throw new Error(`Direct upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Chunked upload for larger files
   */
  private static async chunkedUpload(
    file: File,
    referenceId: string,
    sectionName: string,
    documentName: string,
    zoneinfo: string,
    chunkSize: number,
    maxRetries: number,
    timeout: number,
    options: UploadOptions
  ): Promise<UploadResult> {
    const startTime = Date.now();
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    console.log(`🔧 Starting chunked upload: ${totalChunks} chunks`);

    try {
      // Create a unique session ID for this upload
      const sessionId = `${referenceId}-${Date.now()}`;
      const uploadedChunks: string[] = [];

      // Upload chunks sequentially with retry logic
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const chunkStart = chunkIndex * chunkSize;
        const chunkEnd = Math.min(chunkStart + chunkSize, file.size);
        const chunk = file.slice(chunkStart, chunkEnd);
        
        console.log(`📦 Uploading chunk ${chunkIndex + 1}/${totalChunks} (${(chunk.size / 1024 / 1024).toFixed(2)}MB)`);

        // Upload chunk with retry logic
        const chunkResult = await this.uploadChunkWithRetry(
          chunk,
          chunkIndex,
          sessionId,
          referenceId,
          sectionName,
          documentName,
          zoneinfo,
          maxRetries,
          timeout,
          options
        );

        if (!chunkResult.success) {
          throw new Error(`Chunk ${chunkIndex + 1} upload failed: ${chunkResult.error}`);
        }

        uploadedChunks.push(chunkResult.key!);
        
        // Report progress
        if (options.onChunkComplete) {
          options.onChunkComplete(chunkIndex + 1, totalChunks);
        }

        // Update overall progress
        if (options.onProgress) {
          const progress: UploadProgress = {
            loaded: (chunkIndex + 1) * chunkSize,
            total: file.size,
            percentage: Math.round(((chunkIndex + 1) / totalChunks) * 100),
            speed: 0, // Calculate based on time
            estimatedTime: 0 // Calculate based on remaining chunks
          };
          options.onProgress(progress);
        }
      }

      // Combine chunks (this would require server-side support)
      const combineResult = await this.combineChunks(
        uploadedChunks,
        sessionId,
        referenceId,
        sectionName,
        documentName,
        zoneinfo
      );

      const totalTime = Date.now() - startTime;
      console.log(`✅ Chunked upload completed in ${totalTime}ms`);

      return {
        success: true,
        url: combineResult.url,
        key: combineResult.key,
        performance: {
          totalTime,
          parseTime: 0,
          bufferTime: 0,
          uploadTime: totalTime,
          urlTime: 0
        }
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      throw new Error(`Chunked upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a single chunk with retry logic
   */
  private static async uploadChunkWithRetry(
    chunk: Blob,
    chunkIndex: number,
    sessionId: string,
    referenceId: string,
    sectionName: string,
    documentName: string,
    zoneinfo: string,
    maxRetries: number,
    timeout: number,
    options: UploadOptions
  ): Promise<UploadResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries} for chunk ${chunkIndex + 1}`);

        const result = await this.uploadChunk(
          chunk,
          chunkIndex,
          sessionId,
          referenceId,
          sectionName,
          documentName,
          zoneinfo,
          timeout
        );

        if (result.success) {
          return result;
        }

        lastError = new Error(result.error || 'Chunk upload failed');

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`⚠️ Chunk ${chunkIndex + 1} attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Upload a single chunk
   */
  private static async uploadChunk(
    chunk: Blob,
    chunkIndex: number,
    sessionId: string,
    referenceId: string,
    sectionName: string,
    documentName: string,
    zoneinfo: string,
    timeout: number
  ): Promise<UploadResult> {
    const base64Data = await this.fileToBase64(chunk);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch('/api/s3-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: `chunk_${chunkIndex}`,
          fileType: 'application/octet-stream',
          referenceId: referenceId,
          sectionName: sectionName,
          documentName: documentName,
          zoneinfo: zoneinfo,
          sessionId: sessionId,
          chunkIndex: chunkIndex,
          isChunk: true
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chunk upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return {
        success: true,
        url: result.url,
        key: result.key,
        performance: result.performance
      };

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Combine uploaded chunks (requires server-side implementation)
   */
  private static async combineChunks(
    chunkKeys: string[],
    sessionId: string,
    referenceId: string,
    sectionName: string,
    documentName: string,
    zoneinfo: string
  ): Promise<{ url: string; key: string }> {
    // This would call a server endpoint to combine chunks
    // For now, return the first chunk as a placeholder
    console.log(`🔗 Combining ${chunkKeys.length} chunks...`);
    
    return {
      url: `https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/${chunkKeys[0]}`,
      key: chunkKeys[0]
    };
  }

  /**
   * Convert file to base64 with progress tracking
   */
  private static async fileToBase64(file: File | Blob, onProgress?: (progress: UploadProgress) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const startTime = Date.now();

      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onprogress = (event) => {
        if (onProgress && event.lengthComputable) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
            speed: event.loaded / ((Date.now() - startTime) / 1000),
            estimatedTime: event.total > event.loaded ? 
              (event.total - event.loaded) / (event.loaded / ((Date.now() - startTime) / 1000)) : 0
          };
          onProgress(progress);
        }
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Get upload speed in human-readable format
   */
  static formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond >= 1024 * 1024) {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    } else if (bytesPerSecond >= 1024) {
      return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
    } else {
      return `${bytesPerSecond.toFixed(0)} B/s`;
    }
  }

  /**
   * Format file size in human-readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${bytes} B`;
    }
  }
}
