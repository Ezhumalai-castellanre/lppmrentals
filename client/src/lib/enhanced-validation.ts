import { validatePhoneNumber, validateSSN, validateZIPCode, validateEmail, validateDriverLicense, validateIncome, validateBirthDate, validateMoveInDate } from './validation';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  message: string;
  field?: string;
  code?: string;
}

// Validation error types
export enum ValidationErrorType {
  REQUIRED = 'required',
  INVALID_FORMAT = 'invalid_format',
  INVALID_LENGTH = 'invalid_length',
  INVALID_RANGE = 'invalid_range',
  INVALID_PATTERN = 'invalid_pattern',
  CUSTOM = 'custom'
}

// Enhanced validation functions with detailed error messages
export const validateRequired = (value: any, fieldName: string): ValidationResult => {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      message: `${fieldName} is required`,
      code: ValidationErrorType.REQUIRED
    };
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return {
      isValid: false,
      message: `${fieldName} cannot be empty`,
      code: ValidationErrorType.REQUIRED
    };
  }
  
  return { isValid: true, message: '' };
};

export const validateName = (name: string | undefined | null, fieldName: string = 'Name'): ValidationResult => {
  const required = validateRequired(name, fieldName);
  if (!required.isValid) return required;
  
  const cleanName = name!.trim();
  
  // Check minimum length
  if (cleanName.length < 2) {
    return {
      isValid: false,
      message: `${fieldName} must be at least 2 characters long`,
      code: ValidationErrorType.INVALID_LENGTH
    };
  }
  
  // Check maximum length
  if (cleanName.length > 50) {
    return {
      isValid: false,
      message: `${fieldName} must be less than 50 characters`,
      code: ValidationErrorType.INVALID_LENGTH
    };
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(cleanName)) {
    return {
      isValid: false,
      message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
      code: ValidationErrorType.INVALID_PATTERN
    };
  }
  
  return { isValid: true, message: '' };
};

export const validatePhone = (phone: string | undefined | null, fieldName: string = 'Phone number'): ValidationResult => {
  if (!phone || phone.trim() === '') {
    return { isValid: true, message: '' }; // Optional field
  }
  
  if (!validatePhoneNumber(phone)) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid US phone number (e.g., (555) 123-4567)`,
      code: ValidationErrorType.INVALID_FORMAT
    };
  }
  
  return { isValid: true, message: '' };
};

export const validateSSNField = (ssn: string | undefined | null, fieldName: string = 'Social Security Number'): ValidationResult => {
  if (!ssn || ssn.trim() === '') {
    return { isValid: true, message: '' }; // Optional field
  }
  
  if (!validateSSN(ssn)) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid 9-digit number (e.g., 123-45-6789)`,
      code: ValidationErrorType.INVALID_FORMAT
    };
  }
  
  return { isValid: true, message: '' };
};

export const validateEmailField = (email: string | undefined | null, fieldName: string = 'Email address'): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: true, message: '' }; // Optional field
  }
  
  if (!validateEmail(email)) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid email address (e.g., user@example.com)`,
      code: ValidationErrorType.INVALID_FORMAT
    };
  }
  
  return { isValid: true, message: '' };
};

export const validateZIP = (zip: string | undefined | null, fieldName: string = 'ZIP code'): ValidationResult => {
  if (!zip || zip.trim() === '') {
    return { isValid: true, message: '' }; // Optional field
  }
  
  if (!validateZIPCode(zip)) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid 5 or 9-digit ZIP code (e.g., 12345 or 12345-6789)`,
      code: ValidationErrorType.INVALID_FORMAT
    };
  }
  
  return { isValid: true, message: '' };
};

export const validateLicense = (license: string | undefined | null, fieldName: string = 'Driver\'s license'): ValidationResult => {
  if (!license || license.trim() === '') {
    return { isValid: true, message: '' }; // Optional field
  }
  
  if (!validateDriverLicense(license)) {
    return {
      isValid: false,
      message: `${fieldName} must be 5-15 alphanumeric characters`,
      code: ValidationErrorType.INVALID_FORMAT
    };
  }
  
  return { isValid: true, message: '' };
};

export const validateIncomeField = (income: string | number | undefined | null, fieldName: string = 'Income'): ValidationResult => {
  if (!income || income === '') {
    return { isValid: true, message: '' }; // Optional field
  }
  
  if (!validateIncome(income)) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid positive number`,
      code: ValidationErrorType.INVALID_FORMAT
    };
  }
  
  return { isValid: true, message: '' };
};

export const validateDateOfBirth = (date: Date | undefined | null, fieldName: string = 'Date of birth'): ValidationResult => {
  const required = validateRequired(date, fieldName);
  if (!required.isValid) return required;
  
  if (!validateBirthDate(date)) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid date in the past`,
      code: ValidationErrorType.INVALID_FORMAT
    };
  }
  
  // Check if person is at least 18 years old
  const today = new Date();
  const birthDate = new Date(date!);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
  
  if (actualAge < 18) {
    return {
      isValid: false,
      message: `${fieldName} must be at least 18 years old`,
      code: ValidationErrorType.INVALID_RANGE
    };
  }
  
  if (actualAge > 120) {
    return {
      isValid: false,
      message: `${fieldName} must be a reasonable age (under 120 years)`,
      code: ValidationErrorType.INVALID_RANGE
    };
  }
  
  return { isValid: true, message: '' };
};

export const validateMoveInDateField = (date: Date | undefined | null, fieldName: string = 'Move-in date'): ValidationResult => {
  const required = validateRequired(date, fieldName);
  if (!required.isValid) return required;
  
  if (!validateMoveInDate(date)) {
    return {
      isValid: false,
      message: `${fieldName} must be today or in the future`,
      code: ValidationErrorType.INVALID_RANGE
    };
  }
  
  return { isValid: true, message: '' };
};

export const validateAddress = (address: string | undefined | null, fieldName: string = 'Address'): ValidationResult => {
  if (!address || address.trim() === '') {
    return { isValid: true, message: '' }; // Optional field
  }
  
  const cleanAddress = address.trim();
  
  if (cleanAddress.length < 5) {
    return {
      isValid: false,
      message: `${fieldName} must be at least 5 characters long`,
      code: ValidationErrorType.INVALID_LENGTH
    };
  }
  
  if (cleanAddress.length > 100) {
    return {
      isValid: false,
      message: `${fieldName} must be less than 100 characters`,
      code: ValidationErrorType.INVALID_LENGTH
    };
  }
  
  return { isValid: true, message: '' };
};

export const validateCity = (city: string | undefined | null, fieldName: string = 'City'): ValidationResult => {
  if (!city || city.trim() === '') {
    return { isValid: true, message: '' }; // Optional field
  }
  
  const cleanCity = city.trim();
  
  if (cleanCity.length < 2) {
    return {
      isValid: false,
      message: `${fieldName} must be at least 2 characters long`,
      code: ValidationErrorType.INVALID_LENGTH
    };
  }
  
  if (cleanCity.length > 50) {
    return {
      isValid: false,
      message: `${fieldName} must be less than 50 characters`,
      code: ValidationErrorType.INVALID_LENGTH
    };
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const cityRegex = /^[a-zA-Z\s\-']+$/;
  if (!cityRegex.test(cleanCity)) {
    return {
      isValid: false,
      message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
      code: ValidationErrorType.INVALID_PATTERN
    };
  }
  
  return { isValid: true, message: '' };
};

export const validateState = (state: string | undefined | null, fieldName: string = 'State'): ValidationResult => {
  if (!state || state.trim() === '') {
    return { isValid: true, message: '' }; // Optional field
  }
  
  const cleanState = state.trim();
  
  if (cleanState.length !== 2) {
    return {
      isValid: false,
      message: `${fieldName} must be a 2-letter state code (e.g., CA, NY)`,
      code: ValidationErrorType.INVALID_LENGTH
    };
  }
  
  const stateRegex = /^[A-Z]{2}$/;
  if (!stateRegex.test(cleanState)) {
    return {
      isValid: false,
      message: `${fieldName} must be uppercase letters only`,
      code: ValidationErrorType.INVALID_PATTERN
    };
  }
  
  return { isValid: true, message: '' };
};

// Comprehensive form validation
export const validateFormSection = (section: string, data: any): ValidationResult[] => {
  const errors: ValidationResult[] = [];
  
  switch (section) {
    case 'applicant':
      errors.push(validateName(data.name, 'Full name'));
      errors.push(validateDateOfBirth(data.dob, 'Date of birth'));
      errors.push(validatePhone(data.phone, 'Phone number'));
      errors.push(validateEmailField(data.email, 'Email address'));
      errors.push(validateSSNField(data.ssn, 'Social Security Number'));
      errors.push(validateLicense(data.license, 'Driver\'s license'));
      errors.push(validateAddress(data.address, 'Address'));
      errors.push(validateCity(data.city, 'City'));
      errors.push(validateState(data.state, 'State'));
      errors.push(validateZIP(data.zip, 'ZIP code'));
      break;
      
    case 'coApplicant':
      errors.push(validateName(data.name, 'Full name'));
      errors.push(validateDateOfBirth(data.dob, 'Date of birth'));
      errors.push(validatePhone(data.phone, 'Phone number'));
      errors.push(validateEmailField(data.email, 'Email address'));
      errors.push(validateSSNField(data.ssn, 'Social Security Number'));
      errors.push(validateLicense(data.license, 'Driver\'s license'));
      errors.push(validateAddress(data.address, 'Address'));
      errors.push(validateCity(data.city, 'City'));
      errors.push(validateState(data.state, 'State'));
      errors.push(validateZIP(data.zip, 'ZIP code'));
      break;
      
    case 'guarantor':
      errors.push(validateName(data.name, 'Full name'));
      errors.push(validateDateOfBirth(data.dob, 'Date of birth'));
      errors.push(validatePhone(data.phone, 'Phone number'));
      errors.push(validateEmailField(data.email, 'Email address'));
      errors.push(validateSSNField(data.ssn, 'Social Security Number'));
      errors.push(validateLicense(data.license, 'Driver\'s license'));
      errors.push(validateAddress(data.address, 'Address'));
      errors.push(validateCity(data.city, 'City'));
      errors.push(validateState(data.state, 'State'));
      errors.push(validateZIP(data.zip, 'ZIP code'));
      break;
      
    case 'application':
      errors.push(validateRequired(data.buildingAddress, 'Building address'));
      errors.push(validateRequired(data.apartmentNumber, 'Apartment number'));
      errors.push(validateMoveInDateField(data.moveInDate, 'Move-in date'));
      errors.push(validateIncomeField(data.monthlyRent, 'Monthly rent'));
      break;
  }
  
  return errors.filter(error => !error.isValid);
};

// Error message formatter
export const formatValidationErrors = (errors: ValidationResult[]): string => {
  if (errors.length === 0) return '';
  
  if (errors.length === 1) {
    return errors[0].message;
  }
  
  const messages = errors.map(error => error.message);
  const lastMessage = messages.pop();
  return `${messages.join(', ')} and ${lastMessage}`;
};

// Field validation helper
export const getFieldValidation = (fieldName: string, value: any, section?: string): ValidationResult => {
  switch (fieldName) {
    case 'name':
      return validateName(value, 'Full name');
    case 'dob':
    case 'dateOfBirth':
      return validateDateOfBirth(value, 'Date of birth');
    case 'phone':
      return validatePhone(value, 'Phone number');
    case 'email':
      return validateEmailField(value, 'Email address');
    case 'ssn':
      return validateSSNField(value, 'Social Security Number');
    case 'license':
      return validateLicense(value, 'Driver\'s license');
    case 'address':
      return validateAddress(value, 'Address');
    case 'city':
      return validateCity(value, 'City');
    case 'state':
      return validateState(value, 'State');
    case 'zip':
      return validateZIP(value, 'ZIP code');
    case 'income':
    case 'monthlyRent':
      return validateIncomeField(value, 'Monthly rent');
    case 'moveInDate':
      return validateMoveInDateField(value, 'Move-in date');
    case 'buildingAddress':
      return validateRequired(value, 'Building address');
    case 'apartmentNumber':
      return validateRequired(value, 'Apartment number');
    default:
      return { isValid: true, message: '' };
  }
};
