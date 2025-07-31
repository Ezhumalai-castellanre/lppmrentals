import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a timezone-based UUID for ApplicantId
 * Uses timezone information to create a unique identifier
 */
export function generateTimezoneBasedUUID(): string {
  try {
    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const timezoneOffset = now.getTimezoneOffset();
    
    // Create a unique string based on timezone and timestamp
    const timezoneInfo = `${timezone}_${timezoneOffset}_${now.getTime()}`;
    
    // Generate a hash-like string from the timezone info
    let hash = 0;
    for (let i = 0; i < timezoneInfo.length; i++) {
      const char = timezoneInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Create a UUID-like string with timezone info
    const timestamp = now.getTime();
    const randomPart = Math.random().toString(36).substr(2, 9);
    const timezoneHash = Math.abs(hash).toString(36).substr(0, 8);
    
    const uuid = `zone_${timestamp}_${timezoneHash}_${randomPart}`;
    
    console.log('🔧 Generated timezone UUID:', {
      timezone,
      timezoneOffset,
      timestamp,
      timezoneHash,
      randomPart,
      uuid
    });
    
    return uuid;
  } catch (error) {
    console.error('Error generating timezone UUID:', error);
    // Fallback to simple timestamp-based UUID
    return `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Validate if a string is a timezone-based UUID
 */
export function isValidTimezoneUUID(uuid: string): boolean {
  return uuid.startsWith('zone_') && uuid.split('_').length === 4;
}
