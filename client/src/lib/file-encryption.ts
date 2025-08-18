import CryptoJS from 'crypto-js';

// Secret key for encryption - in production, this should be stored securely
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'your-secret-key-change-in-production';

export interface EncryptedFile {
  encryptedData: string;
  filename: string;
  originalSize: number;
  mimeType: string;
  uploadDate: string;
  fileUrl?: string; // Optional S3 URL from webhook response
}

/**
 * Converts a file to Base64 and encrypts it using AES encryption
 */
export async function encryptFile(file: File): Promise<EncryptedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function() {
      try {
        // Convert file to Base64
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1]; // Remove metadata prefix
        
        // Encrypt the Base64 data
        const encrypted = CryptoJS.AES.encrypt(base64Data, SECRET_KEY).toString();
        
        const encryptedFile: EncryptedFile = {
          encryptedData: encrypted,
          filename: file.name,
          originalSize: file.size,
          mimeType: file.type,
          uploadDate: new Date().toISOString()
        };
        
        resolve(encryptedFile);
      } catch (error) {
        reject(new Error(`Failed to encrypt file: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Encrypts multiple files
 */
export async function encryptFiles(files: File[]): Promise<EncryptedFile[]> {
  const encryptedFiles: EncryptedFile[] = [];
  
  for (const file of files) {
    try {
      const encryptedFile = await encryptFile(file);
      encryptedFiles.push(encryptedFile);
    } catch (error) {
      console.error(`Failed to encrypt file ${file.name}:`, error);
      throw error;
    }
  }
  
  return encryptedFiles;
}

/**
 * Decrypts an encrypted file (for server-side use)
 */
export function decryptFile(encryptedFile: EncryptedFile): Buffer {
  try {
    // Decrypt the data
    const bytes = CryptoJS.AES.decrypt(encryptedFile.encryptedData, SECRET_KEY);
    // Get the raw bytes directly instead of converting to UTF-8 string
    const base64Str = bytes.toString(CryptoJS.enc.Base64);
    
    // Convert Base64 back to buffer
    return Buffer.from(base64Str, 'base64');
  } catch (error) {
    throw new Error(`Failed to decrypt file: ${error}`);
  }
}

/**
 * Validates if a file can be encrypted (size and type checks)
 */
export function validateFileForEncryption(file: File, maxSizeMB: number = 50): string | null {
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File ${file.name} is too large. Maximum size is ${maxSizeMB}MB.`;
  }
  
  const acceptedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (!acceptedTypes.includes(fileExtension)) {
    return `File ${file.name} has an unsupported format. Accepted: ${acceptedTypes.join(', ')}`;
  }
  
  return null;
} 

/**
 * Validates encrypted data structure
 */
export function validateEncryptedData(encryptedData: any): boolean {
  try {
    if (!encryptedData || typeof encryptedData !== 'object') {
      return false;
    }
    
    // Check if it has the required structure
    if (!encryptedData.documents || !encryptedData.allEncryptedFiles) {
      return false;
    }
    
    // Validate allEncryptedFiles array
    if (!Array.isArray(encryptedData.allEncryptedFiles)) {
      return false;
    }
    
    // If there are no encrypted files, the structure is still valid
    if (encryptedData.allEncryptedFiles.length === 0) {
      return true;
    }
    
    // Validate each encrypted file
    for (const file of encryptedData.allEncryptedFiles) {
      if (!file.encryptedData || !file.filename || !file.originalSize || !file.mimeType) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating encrypted data:', error);
    return false;
  }
}

/**
 * Creates a summary of encrypted data for logging and debugging
 */
export function createEncryptedDataSummary(encryptedData: any): any {
  try {
    if (!validateEncryptedData(encryptedData)) {
      return { valid: false, error: 'Invalid encrypted data structure' };
    }
    
    const summary = {
      valid: true,
      totalFiles: encryptedData.allEncryptedFiles.length,
      documentTypes: Object.keys(encryptedData.documents || {}),
      fileTypes: {} as Record<string, number>,
      totalSize: 0,
      encryptionTimestamp: encryptedData.encryptionTimestamp,
      encryptionVersion: encryptedData.encryptionVersion
    };
    
    // Analyze file types and sizes (only if there are files)
    if (encryptedData.allEncryptedFiles.length > 0) {
      for (const file of encryptedData.allEncryptedFiles) {
        const mimeType = file.mimeType;
        summary.fileTypes[mimeType] = (summary.fileTypes[mimeType] || 0) + 1;
        summary.totalSize += file.originalSize;
      }
    }
    
    return summary;
  } catch (error) {
    console.error('Error creating encrypted data summary:', error);
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 