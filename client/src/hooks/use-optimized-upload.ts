import { useState, useCallback, useRef } from 'react';
import { OptimizedUploadService, UploadProgress, UploadResult, UploadOptions } from '../lib/optimized-upload-service';
import { useToast } from './use-toast';

export interface UseOptimizedUploadReturn {
  // Upload state
  isUploading: boolean;
  progress: UploadProgress | null;
  currentFile: string | null;
  uploadedFiles: UploadResult[];
  
  // Upload methods
  uploadFile: (file: File, referenceId: string, sectionName: string, documentName: string, zoneinfo: string) => Promise<UploadResult>;
  uploadFiles: (files: File[], referenceId: string, sectionName: string, documentName: string, zoneinfo: string) => Promise<UploadResult[]>;
  
  // Progress tracking
  resetProgress: () => void;
  clearUploadedFiles: () => void;
  
  // Performance metrics
  averageUploadTime: number;
  totalUploadedSize: number;
  uploadSpeed: number;
}

export interface UseOptimizedUploadOptions {
  chunkSize?: number;
  maxRetries?: number;
  timeout?: number;
  showToast?: boolean;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: string, file: string) => void;
}

export const useOptimizedUpload = (options: UseOptimizedUploadOptions = {}): UseOptimizedUploadReturn => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  
  const uploadStartTime = useRef<number>(0);
  const uploadOptions = useRef<UploadOptions>({});

  // Calculate performance metrics
  const averageUploadTime = uploadedFiles.length > 0 
    ? uploadedFiles.reduce((sum, file) => sum + (file.performance?.totalTime || 0), 0) / uploadedFiles.length
    : 0;

  const totalUploadedSize = uploadedFiles.reduce((sum, file) => sum + (file.performance?.uploadTime || 0), 0);
  
  const uploadSpeed = progress && progress.speed ? progress.speed : 0;

  // Upload a single file
  const uploadFile = useCallback(async (
    file: File,
    referenceId: string,
    sectionName: string,
    documentName: string,
    zoneinfo: string
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setCurrentFile(file.name);
    setProgress(null);
    uploadStartTime.current = Date.now();

    try {
      console.log(`🚀 Starting upload for ${file.name}`);
      
      // Configure upload options
      uploadOptions.current = {
        chunkSize: options.chunkSize,
        maxRetries: options.maxRetries,
        timeout: options.timeout,
        onProgress: (progressData: UploadProgress) => {
          setProgress(progressData);
          console.log(`📊 Upload progress: ${progressData.percentage}% (${OptimizedUploadService.formatSpeed(progressData.speed)})`);
        },
        onChunkComplete: (chunkIndex: number, totalChunks: number) => {
          console.log(`✅ Chunk ${chunkIndex}/${totalChunks} completed`);
        }
      };

      // Perform upload
      const result = await OptimizedUploadService.uploadFile(
        file,
        referenceId,
        sectionName,
        documentName,
        zoneinfo,
        uploadOptions.current
      );

      if (result.success) {
        // Add to uploaded files
        setUploadedFiles(prev => [...prev, result]);
        
        // Show success toast
        if (options.showToast !== false) {
          toast({
            title: "Upload Successful",
            description: `${file.name} uploaded successfully in ${(result.performance?.totalTime || 0)}ms`,
            variant: "default",
          });
        }

        // Call completion callback
        if (options.onUploadComplete) {
          options.onUploadComplete(result);
        }

        console.log(`✅ Upload completed for ${file.name}:`, result);
      } else {
        // Show error toast
        if (options.showToast !== false) {
          toast({
            title: "Upload Failed",
            description: result.error || "Unknown error occurred",
            variant: "destructive",
          });
        }

        // Call error callback
        if (options.onUploadError) {
          options.onUploadError(result.error || "Upload failed", file.name);
        }

        console.error(`❌ Upload failed for ${file.name}:`, result.error);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      // Show error toast
      if (options.showToast !== false) {
        toast({
          title: "Upload Error",
          description: errorMessage,
          variant: "destructive",
        });
      }

      // Call error callback
      if (options.onUploadError) {
        options.onUploadError(errorMessage, file.name);
      }

      console.error(`❌ Upload error for ${file.name}:`, error);
      
      return {
        success: false,
        error: errorMessage,
        performance: {
          totalTime: Date.now() - uploadStartTime.current,
          parseTime: 0,
          bufferTime: 0,
          uploadTime: 0,
          urlTime: 0
        }
      };

    } finally {
      setIsUploading(false);
      setCurrentFile(null);
      setProgress(null);
    }
  }, [options, toast]);

  // Upload multiple files
  const uploadFiles = useCallback(async (
    files: File[],
    referenceId: string,
    sectionName: string,
    documentName: string,
    zoneinfo: string
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      const result = await uploadFile(file, referenceId, sectionName, documentName, zoneinfo);
      results.push(result);
      
      // Small delay between uploads to prevent overwhelming the server
      if (files.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }, [uploadFile]);

  // Reset progress
  const resetProgress = useCallback(() => {
    setProgress(null);
    setCurrentFile(null);
  }, []);

  // Clear uploaded files
  const clearUploadedFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  return {
    // Upload state
    isUploading,
    progress,
    currentFile,
    uploadedFiles,
    
    // Upload methods
    uploadFile,
    uploadFiles,
    
    // Progress tracking
    resetProgress,
    clearUploadedFiles,
    
    // Performance metrics
    averageUploadTime,
    totalUploadedSize,
    uploadSpeed,
  };
};
