// USA Format Validation Utilities

// Phone number validation (USA format)
export const validatePhoneNumber = (phone: string | undefined | null): boolean => {
  // Handle null/undefined cases
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 or 11 digits)
  if (digits.length === 10) {
    return true; // Standard 10-digit number
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return true; // 11-digit number starting with 1 (country code)
  }
  
  return false;
};

// Format phone number for display
export const formatPhoneNumber = (phone: string | undefined | null): string => {
  // Handle null/undefined cases
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  return phone;
};

// Social Security Number validation
export const validateSSN = (ssn: string | undefined | null): boolean => {
  // Handle null/undefined cases
  if (!ssn || typeof ssn !== 'string') {
    return false;
  }
  
  // Remove all non-digit characters
  const digits = ssn.replace(/\D/g, '');
  
  // Check if it's exactly 9 digits
  if (digits.length !== 9) {
    return false;
  }
  
  // Check for invalid SSN patterns
  const invalidPatterns = [
    '000000000', // All zeros
    '111111111', // All ones
    '123456789', // Sequential
    '987654321', // Reverse sequential
  ];
  
  if (invalidPatterns.includes(digits)) {
    return false;
  }
  
  // Check for area numbers that are invalid (000, 666, 900-999)
  const areaNumber = parseInt(digits.slice(0, 3));
  if (areaNumber === 0 || areaNumber === 666 || areaNumber >= 900) {
    return false;
  }
  
  return true;
};

// Format SSN for display
export const formatSSN = (ssn: string | undefined | null): string => {
  // Handle null/undefined cases
  if (!ssn || typeof ssn !== 'string') {
    return '';
  }
  
  const digits = ssn.replace(/\D/g, '');
  
  if (digits.length >= 5) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  } else if (digits.length >= 3) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  
  return digits;
};

// ZIP code validation (USA format)
export const validateZIPCode = (zip: string | undefined | null): boolean => {
  // Handle null/undefined cases
  if (!zip || typeof zip !== 'string') {
    return false;
  }
  
  // Remove all non-digit characters
  const digits = zip.replace(/\D/g, '');
  
  // Check if it's 5 digits (standard) or 9 digits (ZIP+4)
  return digits.length === 5 || digits.length === 9;
};

// Format ZIP code for display
export const formatZIPCode = (zip: string | undefined | null): string => {
  // Handle null/undefined cases
  if (!zip || typeof zip !== 'string') {
    return '';
  }
  
  const digits = zip.replace(/\D/g, '');
  
  if (digits.length >= 6) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
  }
  
  return digits.slice(0, 5);
};

// Email validation
export const validateEmail = (email: string | undefined | null): boolean => {
  // Handle null/undefined cases
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Driver's license validation (basic)
export const validateDriverLicense = (license: string | undefined | null): boolean => {
  // Handle null/undefined cases
  if (!license || typeof license !== 'string') {
    return false;
  }
  
  // Remove spaces and hyphens
  const cleanLicense = license.replace(/[\s-]/g, '');
  
  // Check if it's alphanumeric and reasonable length (5-15 characters)
  const alphanumericRegex = /^[A-Za-z0-9]+$/;
  return alphanumericRegex.test(cleanLicense) && cleanLicense.length >= 5 && cleanLicense.length <= 15;
};

// Income validation (positive number)
export const validateIncome = (income: string | number | undefined | null): boolean => {
  // Handle null/undefined cases
  if (income === null || income === undefined) {
    return false;
  }
  
  const num = typeof income === 'string' ? parseFloat(income) : income;
  return !isNaN(num) && num >= 0;
};

// Age validation (18+ for adults)
export const validateAdultAge = (age: number | undefined | null): boolean => {
  // Handle null/undefined cases
  if (age === null || age === undefined || typeof age !== 'number') {
    return false;
  }
  
  return age >= 18 && age <= 120;
};

// Date validation (not in future for birth dates)
export const validateBirthDate = (date: Date | undefined | null): boolean => {
  // Handle null/undefined cases
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }
  
  const today = new Date();
  return date <= today;
};

// Move-in date validation (not in past)
export const validateMoveInDate = (date: Date | undefined | null): boolean => {
  // Handle null/undefined cases
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  return date >= today;
}; 