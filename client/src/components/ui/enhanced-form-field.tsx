// Enhanced Form Field Component with Integrated Validation
import React, { useState, useCallback, useEffect } from 'react';
import { UseFormReturn, Path, FieldValues } from 'react-hook-form';
import { Input } from './input';
import { Label } from './label';
import { FormItem, FormLabel, FormControl, FormMessage } from './form';
import { FieldErrorDisplay } from './enhanced-error-display';
import { useFieldValidation } from '../../hooks/use-enhanced-validation';
import { ValidationResult, getFieldValidation } from '../../lib/enhanced-validation';
import { cn } from '../../lib/utils';

// Enhanced form field props
interface EnhancedFormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'password';
  required?: boolean;
  disabled?: boolean;
  className?: string;
  validation?: {
    custom?: (value: any) => ValidationResult;
    debounceMs?: number;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
  };
  format?: {
    type: 'phone' | 'ssn' | 'zip' | 'currency' | 'percentage';
    options?: any;
  };
  helpText?: string;
  showValidationIcon?: boolean;
}

// Enhanced form field component
export function EnhancedFormField<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  className,
  validation = {},
  format,
  helpText,
  showValidationIcon = true
}: EnhancedFormFieldProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const {
    validate,
    clearValidation,
    isValidating,
    validationResult,
    hasError,
    errorMessage
  } = useFieldValidation(form, name);

  const fieldValue = form.watch(name);
  const formError = form.formState.errors[name];

  // Format value for display
  const formatValue = useCallback((value: any): string => {
    if (!value) return '';
    
    if (format) {
      switch (format.type) {
        case 'phone':
          return formatPhoneNumber(value);
        case 'ssn':
          return formatSSN(value);
        case 'zip':
          return formatZIPCode(value);
        case 'currency':
          return formatCurrency(value, format.options);
        case 'percentage':
          return formatPercentage(value, format.options);
        default:
          return value.toString();
      }
    }
    
    return value.toString();
  }, [format]);

  // Parse value for form
  const parseValue = useCallback((value: string): any => {
    if (!value) return '';
    
    if (format) {
      switch (format.type) {
        case 'phone':
        case 'ssn':
        case 'zip':
          return value.replace(/\D/g, '');
        case 'currency':
          return parseFloat(value.replace(/[^0-9.-]/g, ''));
        case 'percentage':
          return parseFloat(value.replace(/[^0-9.-]/g, ''));
        default:
          return value;
      }
    }
    
    if (type === 'number') {
      return value === '' ? '' : parseFloat(value);
    }
    
    return value;
  }, [format, type]);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const parsedValue = parseValue(rawValue);
    
    form.setValue(name, parsedValue as any, { shouldValidate: false });
    
    if (validation.validateOnChange && hasInteracted) {
      validate(parsedValue);
    }
  }, [form, name, parseValue, validation.validateOnChange, hasInteracted, validate]);

  // Handle input blur
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setHasInteracted(true);
    setIsFocused(false);
    
    if (validation.validateOnBlur !== false) {
      validate(fieldValue);
    }
  }, [fieldValue, validate, validation.validateOnBlur]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // Validate on mount if needed
  useEffect(() => {
    if (fieldValue && hasInteracted) {
      const timeoutId = setTimeout(() => {
        validate(fieldValue);
      }, validation.debounceMs || 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [fieldValue, hasInteracted, validate, validation.debounceMs]);

  // Get display value
  const displayValue = formatValue(fieldValue);

  // Get input type
  const getInputType = (): string => {
    if (type === 'tel' && format?.type === 'phone') return 'tel';
    if (type === 'number' || format?.type === 'currency' || format?.type === 'percentage') return 'text';
    return type;
  };

  // Get placeholder
  const getPlaceholder = (): string => {
    if (placeholder) return placeholder;
    
    if (format) {
      switch (format.type) {
        case 'phone':
          return '(555) 123-4567';
        case 'ssn':
          return '123-45-6789';
        case 'zip':
          return '12345 or 12345-6789';
        case 'currency':
          return '$0.00';
        case 'percentage':
          return '0%';
        default:
          return '';
      }
    }
    
    switch (type) {
      case 'email':
        return 'email@example.com';
      case 'tel':
        return '(555) 123-4567';
      case 'number':
        return '0';
      case 'date':
        return 'MM/DD/YYYY';
      default:
        return '';
    }
  };

  // Get error message
  const getErrorMessage = (): string | undefined => {
    if (formError?.message) return formError.message;
    if (errorMessage) return errorMessage;
    return undefined;
  };

  // Get validation state
  const getValidationState = () => {
    if (isValidating) return 'validating';
    if (hasError || formError) return 'error';
    if (hasInteracted && !hasError && !formError && fieldValue) return 'success';
    return 'default';
  };

  const validationState = getValidationState();

  return (
    <FormItem className={className}>
      {label && (
        <FormLabel className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </FormLabel>
      )}
      
      <FormControl>
        <div className="relative">
          <Input
            type={getInputType()}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={cn(
              'transition-colors',
              validationState === 'error' && 'border-red-500 focus:border-red-500',
              validationState === 'success' && 'border-green-500 focus:border-green-500',
              isFocused && 'ring-2 ring-blue-500/20',
              showValidationIcon && 'pr-8'
            )}
          />
          
          {showValidationIcon && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              {validationState === 'validating' && (
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              )}
              {validationState === 'error' && (
                <div className="h-4 w-4 text-red-500">✕</div>
              )}
              {validationState === 'success' && (
                <div className="h-4 w-4 text-green-500">✓</div>
              )}
            </div>
          )}
        </div>
      </FormControl>
      
      {getErrorMessage() && (
        <FieldErrorDisplay error={getErrorMessage()} />
      )}
      
      {helpText && !getErrorMessage() && (
        <p className="text-sm text-gray-600">{helpText}</p>
      )}
    </FormItem>
  );
}

// Formatting utility functions
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function formatSSN(ssn: string): string {
  const digits = ssn.replace(/\D/g, '');
  if (digits.length >= 5) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  } else if (digits.length >= 3) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits;
}

function formatZIPCode(zip: string): string {
  const digits = zip.replace(/\D/g, '');
  if (digits.length >= 6) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
  }
  return digits.slice(0, 5);
}

function formatCurrency(value: number, options: any = {}): string {
  const { currency = 'USD', locale = 'en-US' } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value);
}

function formatPercentage(value: number, options: any = {}): string {
  const { decimals = 0, locale = 'en-US' } = options;
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}
