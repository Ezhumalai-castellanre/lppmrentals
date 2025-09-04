// Enhanced Form Validation Hook
import { useState, useCallback, useMemo } from 'react';
import { useForm, UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ValidationResult, 
  validateFormSection, 
  getFieldValidation,
  formatValidationErrors 
} from '../lib/enhanced-validation';
import { 
  errorHandler, 
  handleValidationError, 
  aggregateFormErrors,
  AppError,
  ErrorCategory 
} from '../lib/error-handler';

// Enhanced validation hook options
interface UseEnhancedValidationOptions<T extends FieldValues> {
  schema?: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  validateOnMount?: boolean;
  clearErrorsOnChange?: boolean;
  debounceMs?: number;
}

// Enhanced validation hook return type
interface UseEnhancedValidationReturn<T extends FieldValues> extends UseFormReturn<T> {
  // Enhanced validation methods
  validateField: (fieldName: Path<T>, value: any) => ValidationResult;
  validateSection: (section: string, data: any) => ValidationResult[];
  clearFieldError: (fieldName: Path<T>) => void;
  clearSectionErrors: (section: string) => void;
  clearAllErrors: () => void;
  
  // Error state
  hasErrors: boolean;
  errorCount: number;
  fieldErrors: Record<string, string[]>;
  generalErrors: string[];
  errorSummary: string;
  
  // Validation state
  isValidating: boolean;
  isValid: boolean;
  
  // Enhanced error handling
  getFieldError: (fieldName: Path<T>) => string | undefined;
  getFieldErrors: (fieldName: Path<T>) => string[];
  hasFieldError: (fieldName: Path<T>) => boolean;
  
  // Form submission with enhanced error handling
  handleSubmitWithValidation: (
    onSubmit: (data: T) => Promise<void> | void,
    onError?: (errors: AppError[]) => void
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export function useEnhancedValidation<T extends FieldValues = FieldValues>(
  options: UseEnhancedValidationOptions<T> = {}
): UseEnhancedValidationReturn<T> {
  const {
    schema,
    defaultValues,
    mode = 'onBlur',
    reValidateMode = 'onChange',
    validateOnMount = false,
    clearErrorsOnChange = true,
    debounceMs = 300
  } = options;

  // Form instance
  const form = useForm<T>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode,
    reValidateMode
  });

  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<AppError[]>([]);

  // Enhanced validation methods
  const validateField = useCallback((fieldName: Path<T>, value: any): ValidationResult => {
    const result = getFieldValidation(fieldName as string, value);
    
    if (!result.isValid) {
      const error = handleValidationError(result, fieldName as string);
      setValidationErrors(prev => {
        const filtered = prev.filter(e => e.field !== fieldName);
        return [...filtered, error];
      });
    } else {
      setValidationErrors(prev => prev.filter(e => e.field !== fieldName));
    }
    
    return result;
  }, []);

  const validateSection = useCallback((section: string, data: any): ValidationResult[] => {
    const results = validateFormSection(section, data);
    
    // Clear existing section errors
    setValidationErrors(prev => prev.filter(e => e.context?.section !== section));
    
    // Add new errors
    results.forEach(result => {
      if (!result.isValid) {
        const error = handleValidationError(result, result.field, { section });
        setValidationErrors(prev => [...prev, error]);
      }
    });
    
    return results;
  }, []);

  // Error clearing methods
  const clearFieldError = useCallback((fieldName: Path<T>) => {
    setValidationErrors(prev => prev.filter(e => e.field !== fieldName));
    form.clearErrors(fieldName);
  }, [form]);

  const clearSectionErrors = useCallback((section: string) => {
    setValidationErrors(prev => prev.filter(e => e.context?.section !== section));
  }, []);

  const clearAllErrors = useCallback(() => {
    setValidationErrors([]);
    form.clearErrors();
    errorHandler.clearErrors();
  }, [form]);

  // Enhanced error getters
  const getFieldError = useCallback((fieldName: Path<T>): string | undefined => {
    // Check form errors first
    const formError = form.formState.errors[fieldName];
    if (formError?.message) {
      return formError.message;
    }
    
    // Check validation errors
    const validationError = validationErrors.find(e => e.field === fieldName);
    return validationError?.userMessage || validationError?.message;
  }, [form.formState.errors, validationErrors]);

  const getFieldErrors = useCallback((fieldName: Path<T>): string[] => {
    const errors: string[] = [];
    
    // Add form errors
    const formError = form.formState.errors[fieldName];
    if (formError?.message) {
      errors.push(formError.message);
    }
    
    // Add validation errors
    const fieldValidationErrors = validationErrors.filter(e => e.field === fieldName);
    fieldValidationErrors.forEach(error => {
      const message = error.userMessage || error.message;
      if (!errors.includes(message)) {
        errors.push(message);
      }
    });
    
    return errors;
  }, [form.formState.errors, validationErrors]);

  const hasFieldError = useCallback((fieldName: Path<T>): boolean => {
    return getFieldErrors(fieldName).length > 0;
  }, [getFieldErrors]);

  // Enhanced form submission
  const handleSubmitWithValidation = useCallback((
    onSubmit: (data: T) => Promise<void> | void,
    onError?: (errors: AppError[]) => void
  ) => {
    return async (e?: React.BaseSyntheticEvent) => {
      setIsValidating(true);
      
      try {
        // Clear previous errors
        clearAllErrors();
        
        // Trigger form validation
        const isValid = await form.trigger();
        
        if (!isValid) {
          const formErrors = Object.entries(form.formState.errors).map(([field, error]) => 
            handleValidationError(
              { isValid: false, message: error?.message || 'Invalid value' },
              field
            )
          );
          
          setValidationErrors(formErrors);
          
          if (onError) {
            onError(formErrors);
          }
          
          return;
        }
        
        // Get form data
        const formData = form.getValues();
        
        // Additional validation if needed
        const allErrors = [...validationErrors];
        
        if (allErrors.length > 0) {
          if (onError) {
            onError(allErrors);
          }
          return;
        }
        
        // Submit form
        await onSubmit(formData);
        
      } catch (error) {
        console.error('Form submission error:', error);
        
        const appError = errorHandler.createServerError(
          error instanceof Error ? error.message : 'Form submission failed'
        );
        errorHandler.addError(appError);
        
        if (onError) {
          onError([appError]);
        }
      } finally {
        setIsValidating(false);
      }
    };
  }, [form, validationErrors, clearAllErrors]);

  // Computed error state
  const errorState = useMemo(() => {
    const allErrors = [
      ...validationErrors,
      ...Object.entries(form.formState.errors).map(([field, error]) => 
        errorHandler.createValidationError(
          { isValid: false, message: error?.message || 'Invalid value' },
          field
        )
      )
    ];
    
    return aggregateFormErrors(allErrors);
  }, [validationErrors, form.formState.errors]);

  // Watch for field changes to clear errors
  const watchedFields = form.watch();
  
  // Clear errors on field change
  if (clearErrorsOnChange) {
    Object.keys(watchedFields).forEach(fieldName => {
      if (hasFieldError(fieldName as Path<T>)) {
        // Debounce error clearing
        const timeoutId = setTimeout(() => {
          clearFieldError(fieldName as Path<T>);
        }, debounceMs);
        
        return () => clearTimeout(timeoutId);
      }
    });
  }

  return {
    ...form,
    
    // Enhanced validation methods
    validateField,
    validateSection,
    clearFieldError,
    clearSectionErrors,
    clearAllErrors,
    
    // Error state
    hasErrors: errorState.hasErrors,
    errorCount: errorState.errorCount,
    fieldErrors: errorState.fieldErrors,
    generalErrors: errorState.generalErrors,
    errorSummary: errorState.summary,
    
    // Validation state
    isValidating,
    isValid: form.formState.isValid && validationErrors.length === 0,
    
    // Enhanced error handling
    getFieldError,
    getFieldErrors,
    hasFieldError,
    
    // Enhanced form submission
    handleSubmitWithValidation
  };
}

// Utility hook for field-level validation
export function useFieldValidation<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldName: Path<T>
) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validate = useCallback(async (value: any) => {
    setIsValidating(true);
    
    try {
      const result = getFieldValidation(fieldName as string, value);
      setValidationResult(result);
      
      if (!result.isValid) {
        form.setError(fieldName, { 
          type: 'manual', 
          message: result.message 
        });
      } else {
        form.clearErrors(fieldName);
      }
      
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [form, fieldName]);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
    form.clearErrors(fieldName);
  }, [form, fieldName]);

  return {
    validate,
    clearValidation,
    isValidating,
    validationResult,
    hasError: !!validationResult && !validationResult.isValid,
    errorMessage: validationResult?.message
  };
}
