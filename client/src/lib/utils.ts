import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a Lppm-number format ID for ApplicantId
 * Format: Lppm-YYYYMMDD-XXXXX (where XXXXX is a 5-digit sequential number)
 */
export function generateLppmNumber(): string {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    // Generate a 5-digit sequential number based on timestamp
    const timestamp = now.getTime();
    const sequentialNumber = (timestamp % 100000).toString().padStart(5, '0');
    
    const lppmNumber = `Lppm-${dateString}-${sequentialNumber}`;
    
    console.log('🔧 Generated Lppm number:', {
      dateString,
      sequentialNumber,
      lppmNumber
    });
    
    return lppmNumber;
  } catch (error) {
    console.error('Error generating Lppm number:', error);
    // Fallback to simple timestamp-based Lppm number
    const fallbackDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fallbackNumber = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `Lppm-${fallbackDate}-${fallbackNumber}`;
  }
}

/**
 * Generate a timezone-based UUID for ApplicantId
 * Uses timezone information to create a unique identifier
 * @deprecated Use generateLppmNumber() instead
 */
export function generateTimezoneBasedUUID(): string {
  // Use the new Lppm number format instead
  return generateLppmNumber();
}

/**
 * Validate if a string is a Lppm number format
 */
export function isValidLppmNumber(lppmNumber: string): boolean {
  const pattern = /^Lppm-\d{8}-\d{5}$/;
  return pattern.test(lppmNumber);
}

/**
 * Convert Lppm number to old format equivalents
 * @param lppmNumber - The Lppm number to convert
 * @returns Array of old format equivalents
 */
export function convertLppmToOldFormats(lppmNumber: string): string[] {
  const equivalents: string[] = [lppmNumber];
  
  if (!lppmNumber.startsWith('Lppm-')) {
    return equivalents;
  }
  
  const match = lppmNumber.match(/^Lppm-(\d{8})-(\d{5})$/);
  if (match) {
    const [, dateStr, numberStr] = match;
    const timestamp = new Date(
      parseInt(dateStr.substring(0, 4)),
      parseInt(dateStr.substring(4, 6)) - 1,
      parseInt(dateStr.substring(6, 8))
    ).getTime();
    
    // Create old format equivalents
    const oldZoneFormat = `zone_${timestamp}_${numberStr}`;
    const oldTempFormat = `temp_${timestamp}_${numberStr}`;
    
    equivalents.push(oldZoneFormat, oldTempFormat);
  }
  
  return equivalents;
}

/**
 * Convert old format applicant ID to Lppm number
 * @param oldApplicantId - The old format applicant ID
 * @returns The Lppm number equivalent
 */
export function convertOldFormatToLppm(oldApplicantId: string): string | null {
  if (oldApplicantId.startsWith('Lppm-')) {
    return oldApplicantId;
  }
  
  const match = oldApplicantId.match(/^(zone_|temp_)(\d+)_(.+)$/);
  if (match) {
    const [, prefix, timestamp, numberStr] = match;
    const date = new Date(parseInt(timestamp));
    const dateStr = date.getFullYear().toString() + 
                   String(date.getMonth() + 1).padStart(2, '0') + 
                   String(date.getDate()).padStart(2, '0');
    
    return `Lppm-${dateStr}-${numberStr.padStart(5, '0')}`;
  }
  
  return null;
}

/**
 * Get all possible applicant ID formats for searching
 * @param applicantId - The applicant ID in any format
 * @returns Array of all possible formats to search for
 */
export function getAllApplicantIdFormats(applicantId: string): string[] {
  const formats: string[] = [applicantId];
  
  if (applicantId.startsWith('Lppm-')) {
    formats.push(...convertLppmToOldFormats(applicantId));
  } else if (applicantId.startsWith('zone_') || applicantId.startsWith('temp_')) {
    const lppmFormat = convertOldFormatToLppm(applicantId);
    if (lppmFormat) {
      formats.push(lppmFormat);
    }
  }
  
  return Array.from(new Set(formats)); // Remove duplicates
}

/**
 * Validate if a string is a timezone-based UUID
 * @deprecated Use isValidLppmNumber() instead
 */
export function isValidTimezoneUUID(uuid: string): boolean {
  return uuid.startsWith('zone_') && uuid.split('_').length === 4;
}
