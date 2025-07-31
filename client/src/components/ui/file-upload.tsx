import { useState, useCallback } from "react";
import { Button } from "./button";
import { Card } from "./card";
import { Upload, X, FileText, Shield, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { encryptFiles, validateFileForEncryption, type EncryptedFile } from "@/lib/file-encryption";
import { WebhookService } from "@/lib/webhook-service";

interface FileUploadProps {
  onFileChange: (files: File[]) => void;
  onEncryptedFilesChange?: (encryptedFiles: EncryptedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  label: string;
  description?: string;
  className?: string;
  enableEncryption?: boolean;
  referenceId?: string;
  sectionName?: string;
  documentName?: string;
  enableWebhook?: boolean;
  applicationId?: string;
  applicantId?: string;
  zoneinfo?: string;
}

export function FileUpload({
  onFileChange,
  onEncryptedFilesChange,
  accept = ".pdf,.jpg,.jpeg,.png",
  multiple = false,
  maxFiles = multiple ? 10 : 1,
  maxSize = 10,
  label,
  description,
  className,
  enableEncryption = false,
  referenceId,
  sectionName,
  documentName,
  enableWebhook = false,
  applicationId,
  applicantId,
  zoneinfo
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [encryptedFiles, setEncryptedFiles] = useState<EncryptedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'uploading' | 'success' | 'error' }>({});

  const validateFile = (file: File): string | null => {
    if (enableEncryption) {
      return validateFileForEncryption(file, maxSize);
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `File ${file.name} is too large. Maximum size is ${maxSize}MB.`;
    }
    
    const acceptedTypes = accept.split(",").map(type => type.trim());
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    
    if (!acceptedTypes.includes(fileExtension)) {
      return `File ${file.name} has an unsupported format.`;
    }
    
    return null;
  };

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    console.log('FileUpload handleFiles called:', {
      filesCount: newFiles.length,
      sectionName,
      enableWebhook,
      referenceId,
      enableEncryption
    });
    
    setError("");
    setIsEncrypting(true);
    
    try {
      const fileArray = Array.from(newFiles);
      const validFiles: File[] = [];
      
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          setError(error);
          setIsEncrypting(false);
          return;
        }
        validFiles.push(file);
      }
      
      if (files.length + validFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} file(s) allowed.`);
        setIsEncrypting(false);
        return;
      }
      
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(updatedFiles);
      onFileChange(updatedFiles);
      
      // Encrypt files if encryption is enabled
      if (enableEncryption && onEncryptedFilesChange) {
        try {
          const encrypted = await encryptFiles(validFiles);
          const updatedEncryptedFiles = multiple 
            ? [...encryptedFiles, ...encrypted] 
            : encrypted;
          
          setEncryptedFiles(updatedEncryptedFiles);
          onEncryptedFilesChange(updatedEncryptedFiles);
        } catch (encryptError) {
          setError(`Failed to encrypt files: ${encryptError}`);
        }
      }

      // Send files to webhook immediately if enabled
      console.log('FileUpload webhook check:', { enableWebhook, referenceId, sectionName, applicationId, applicantId });
      
      // Special debugging for guarantor documents
      if (sectionName && sectionName.startsWith('guarantor_')) {
        console.log('🎯 GUARANTOR FileUpload processing:', {
          enableWebhook,
          referenceId,
          sectionName,
          applicationId,
          filesCount: validFiles.length,
          fileNames: validFiles.map(f => f.name)
        });
      }
      
      if (enableWebhook && referenceId && sectionName) {
        for (const file of validFiles) {
          const fileKey = `${file.name}-${file.size}`;
          setUploadStatus(prev => ({ ...prev, [fileKey]: 'uploading' }));
          
          try {
            const result = await WebhookService.sendFileToWebhook(file, referenceId, sectionName, documentName || 'Unknown Document', applicationId, zoneinfo);
            if (result.success) {
              setUploadStatus(prev => ({ ...prev, [fileKey]: 'success' }));
              console.log(`✅ Webhook upload successful for ${file.name}`);
            } else {
              setUploadStatus(prev => ({ ...prev, [fileKey]: 'error' }));
              console.error(`❌ Webhook upload failed for ${file.name}:`, result.error);
              
              // Don't retry if it's a duplicate or previously failed upload
              if (result.error?.includes('already in progress') || result.error?.includes('previously failed')) {
                console.log(`⏭️ Skipping retry for ${file.name}: ${result.error}`);
              }
            }
          } catch (webhookError) {
            setUploadStatus(prev => ({ ...prev, [fileKey]: 'error' }));
            console.error(`❌ Webhook upload error for ${file.name}:`, webhookError);
          }
        }
      }
    } catch (error) {
      setError(`Failed to process files: ${error}`);
    } finally {
      setIsEncrypting(false);
    }
  }, [files, encryptedFiles, multiple, maxFiles, onFileChange, onEncryptedFilesChange, enableEncryption, enableWebhook, referenceId, sectionName, applicationId, applicantId, zoneinfo]);

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFileChange(updatedFiles);
    
    // Also remove from encrypted files if encryption is enabled
    if (enableEncryption && onEncryptedFilesChange) {
      const updatedEncryptedFiles = encryptedFiles.filter((_, i) => i !== index);
      setEncryptedFiles(updatedEncryptedFiles);
      onEncryptedFilesChange(updatedEncryptedFiles);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('FileUpload handleInputChange called:', {
      filesCount: e.target.files?.length,
      sectionName,
      enableWebhook,
      referenceId
    });
    
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary",
          error ? "border-destructive" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          console.log('FileUpload area clicked:', {
            label,
            sectionName,
            enableWebhook,
            referenceId,
            fileInputId: `file-input-${label}`
          });
          const fileInput = document.getElementById(`file-input-${label}`);
          console.log('File input element found:', !!fileInput);
          fileInput?.click();
        }}
      >
        {isEncrypting ? (
          <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
        ) : enableEncryption ? (
          <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
        ) : (
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        )}
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
        <p className="text-xs text-gray-500 mt-1">
          Max {maxFiles} file{maxFiles > 1 ? 's' : ''}, {maxSize}MB each • {accept.replace(/\./g, '').toUpperCase()}
        </p>
        {enableEncryption && (
          <p className="text-xs text-green-600 mt-1">
            <Shield className="inline w-3 h-3 mr-1" />
            Files will be encrypted before upload
          </p>
        )}
        <Button type="button" variant="link" className="mt-2" disabled={isEncrypting}>
          {isEncrypting ? 'Encrypting...' : `Choose File${multiple ? 's' : ''}`}
        </Button>
        <input
          id={`file-input-${label}`}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          aria-label={label}
          title={label}
          onClick={(e) => {
            console.log('File input clicked:', {
              label,
              sectionName,
              enableWebhook,
              referenceId
            });
          }}
        />
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const fileKey = `${file.name}-${file.size}`;
            const status = uploadStatus[fileKey];
            
            return (
              <Card key={index} className="p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  {enableWebhook && status && (
                    <div className="flex items-center space-x-1">
                      {status === 'uploading' && (
                        <>
                          <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                          <span className="text-xs text-blue-500">Uploading...</span>
                        </>
                      )}
                      {status === 'success' && (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-500">Uploaded</span>
                        </>
                      )}
                      {status === 'error' && (
                        <>
                          <AlertCircle className="w-3 h-3 text-red-500" />
                          <span className="text-xs text-red-500">Failed</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
