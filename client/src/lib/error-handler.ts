// Enhanced Error Handling System
import { ValidationResult, ValidationErrorType } from './enhanced-validation';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

// Enhanced error interface
export interface AppError {
  id: string;
  message: string;
  details?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  field?: string;
  code?: string;
  timestamp: Date;
  context?: Record<string, any>;
  userMessage?: string;
  actionable?: boolean;
  retryable?: boolean;
}

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: AppError[] = [];
  private maxErrors = 100;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Create error from validation result
  public createValidationError(
    validationResult: ValidationResult,
    field?: string,
    context?: Record<string, any>
  ): AppError {
    return {
      id: this.generateErrorId(),
      message: validationResult.message,
      category: ErrorCategory.VALIDATION,
      severity: this.getSeverityFromValidationCode(validationResult.code),
      field: field || validationResult.field,
      code: validationResult.code,
      timestamp: new Date(),
      context,
      userMessage: this.getUserFriendlyMessage(validationResult.message),
      actionable: true,
      retryable: false
    };
  }

  // Create network error
  public createNetworkError(
    message: string,
    details?: string,
    context?: Record<string, any>
  ): AppError {
    return {
      id: this.generateErrorId(),
      message,
      details,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      timestamp: new Date(),
      context,
      userMessage: 'Network connection issue. Please check your internet connection and try again.',
      actionable: true,
      retryable: true
    };
  }

  // Create authentication error
  public createAuthError(
    message: string,
    details?: string,
    context?: Record<string, any>
  ): AppError {
    return {
      id: this.generateErrorId(),
      message,
      details,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      timestamp: new Date(),
      context,
      userMessage: 'Authentication required. Please sign in to continue.',
      actionable: true,
      retryable: false
    };
  }

  // Create server error
  public createServerError(
    message: string,
    details?: string,
    context?: Record<string, any>
  ): AppError {
    return {
      id: this.generateErrorId(),
      message,
      details,
      category: ErrorCategory.SERVER,
      severity: ErrorSeverity.CRITICAL,
      timestamp: new Date(),
      context,
      userMessage: 'Server error occurred. Please try again later or contact support.',
      actionable: true,
      retryable: true
    };
  }

  // Add error to collection
  public addError(error: AppError): void {
    this.errors.unshift(error);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error added:', error);
    }
  }

  // Get all errors
  public getErrors(): AppError[] {
    return [...this.errors];
  }

  // Get errors by category
  public getErrorsByCategory(category: ErrorCategory): AppError[] {
    return this.errors.filter(error => error.category === category);
  }

  // Get errors by severity
  public getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errors.filter(error => error.severity === severity);
  }

  // Get errors by field
  public getErrorsByField(field: string): AppError[] {
    return this.errors.filter(error => error.field === field);
  }

  // Clear all errors
  public clearErrors(): void {
    this.errors = [];
  }

  // Clear errors by category
  public clearErrorsByCategory(category: ErrorCategory): void {
    this.errors = this.errors.filter(error => error.category !== category);
  }

  // Clear errors by field
  public clearErrorsByField(field: string): void {
    this.errors = this.errors.filter(error => error.field !== field);
  }

  // Get latest error
  public getLatestError(): AppError | null {
    return this.errors.length > 0 ? this.errors[0] : null;
  }

  // Check if there are critical errors
  public hasCriticalErrors(): boolean {
    return this.errors.some(error => error.severity === ErrorSeverity.CRITICAL);
  }

  // Check if there are validation errors
  public hasValidationErrors(): boolean {
    return this.errors.some(error => error.category === ErrorCategory.VALIDATION);
  }

  // Get validation errors summary
  public getValidationErrorsSummary(): string {
    const validationErrors = this.getErrorsByCategory(ErrorCategory.VALIDATION);
    if (validationErrors.length === 0) return '';
    
    const fieldErrors = validationErrors
      .filter(error => error.field)
      .map(error => error.field)
      .filter((field, index, array) => array.indexOf(field) === index); // Remove duplicates
    
    if (fieldErrors.length === 0) return 'Please fix validation errors';
    if (fieldErrors.length === 1) return `Please fix the ${fieldErrors[0]} field`;
    if (fieldErrors.length <= 3) return `Please fix the ${fieldErrors.join(', ')} fields`;
    return `Please fix ${fieldErrors.length} fields with errors`;
  }

  // Private helper methods
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSeverityFromValidationCode(code?: string): ErrorSeverity {
    switch (code) {
      case ValidationErrorType.REQUIRED:
        return ErrorSeverity.HIGH;
      case ValidationErrorType.INVALID_FORMAT:
        return ErrorSeverity.MEDIUM;
      case ValidationErrorType.INVALID_LENGTH:
        return ErrorSeverity.MEDIUM;
      case ValidationErrorType.INVALID_RANGE:
        return ErrorSeverity.MEDIUM;
      case ValidationErrorType.INVALID_PATTERN:
        return ErrorSeverity.MEDIUM;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  private getUserFriendlyMessage(message: string): string {
    // Convert technical messages to user-friendly ones
    const friendlyMessages: Record<string, string> = {
      'is required': 'This field is required',
      'cannot be empty': 'This field cannot be empty',
      'must be a valid': 'Please enter a valid',
      'must be at least': 'Must be at least',
      'must be less than': 'Must be less than',
      'can only contain': 'Can only contain',
      'must be today or in the future': 'Must be today or in the future',
      'must be a valid date in the past': 'Must be a valid date in the past',
      'must be at least 18 years old': 'Must be at least 18 years old',
      'must be a reasonable age': 'Must be a reasonable age'
    };

    let friendlyMessage = message;
    Object.entries(friendlyMessages).forEach(([technical, friendly]) => {
      friendlyMessage = friendlyMessage.replace(technical, friendly);
    });

    return friendlyMessage;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const handleValidationError = (
  validationResult: ValidationResult,
  field?: string,
  context?: Record<string, any>
): AppError => {
  const error = errorHandler.createValidationError(validationResult, field, context);
  errorHandler.addError(error);
  return error;
};

export const handleNetworkError = (
  error: any,
  context?: Record<string, any>
): AppError => {
  const message = error.message || 'Network request failed';
  const details = error.response?.data?.message || error.stack;
  const appError = errorHandler.createNetworkError(message, details, context);
  errorHandler.addError(appError);
  return appError;
};

export const handleAuthError = (
  error: any,
  context?: Record<string, any>
): AppError => {
  const message = error.message || 'Authentication failed';
  const details = error.response?.data?.message || error.stack;
  const appError = errorHandler.createAuthError(message, details, context);
  errorHandler.addError(appError);
  return appError;
};

export const handleServerError = (
  error: any,
  context?: Record<string, any>
): AppError => {
  const message = error.message || 'Server error occurred';
  const details = error.response?.data?.message || error.stack;
  const appError = errorHandler.createServerError(message, details, context);
  errorHandler.addError(appError);
  return appError;
};

// Error boundary helper
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.userMessage) return error.userMessage;
  return 'An unexpected error occurred';
};

// Form error aggregation
export const aggregateFormErrors = (errors: AppError[]): {
  hasErrors: boolean;
  errorCount: number;
  fieldErrors: Record<string, string[]>;
  generalErrors: string[];
  summary: string;
} => {
  const fieldErrors: Record<string, string[]> = {};
  const generalErrors: string[] = [];
  
  errors.forEach(error => {
    if (error.field) {
      if (!fieldErrors[error.field]) {
        fieldErrors[error.field] = [];
      }
      fieldErrors[error.field].push(error.userMessage || error.message);
    } else {
      generalErrors.push(error.userMessage || error.message);
    }
  });
  
  const errorCount = errors.length;
  const hasErrors = errorCount > 0;
  
  let summary = '';
  if (hasErrors) {
    const fieldCount = Object.keys(fieldErrors).length;
    if (fieldCount === 0) {
      summary = generalErrors.length === 1 ? generalErrors[0] : `${generalErrors.length} errors occurred`;
    } else if (fieldCount === 1) {
      const field = Object.keys(fieldErrors)[0];
      summary = `Please fix the ${field} field`;
    } else {
      summary = `Please fix ${fieldCount} fields with errors`;
    }
  }
  
  return {
    hasErrors,
    errorCount,
    fieldErrors,
    generalErrors,
    summary
  };
};
