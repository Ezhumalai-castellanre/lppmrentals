  import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { FormMessage } from './form';
import { 
  validatePhoneNumber, 
  formatPhoneNumber, 
  validateSSN, 
  formatSSN, 
  validateEmail,
  validateDriverLicense,
  validateIncome,
  validateZIPCode,
  formatZIPCode
} from '../../lib/validation';

interface ValidatedInputProps {
  label: string;
  value: string | undefined | null;
  onChange: (value: string) => void;
  type: 'phone' | 'ssn' | 'email' | 'license' | 'income' | 'zip' | 'text' | 'number';
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value,
  onChange,
  type,
  placeholder,
  required = false,
  error,
  className = '',
  disabled = false
}) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>('');

  const validateField = (inputValue: string | undefined | null): { isValid: boolean; message: string } => {
    // Handle null/undefined cases
    if (!inputValue || typeof inputValue !== 'string') {
      return { isValid: required ? false : true, message: required ? `${label} is required` : '' };
    }
    
    if (!inputValue.trim()) {
      return { isValid: required ? false : true, message: required ? `${label} is required` : '' };
    }

    switch (type) {
      case 'phone':
        // Require exactly 10 digits
        const digits = inputValue.replace(/\D/g, '');
        if (digits.length !== 10) {
          return { isValid: false, message: 'Phone number must be exactly 10 digits' };
        }
        if (!validatePhoneNumber(inputValue)) {
          return { isValid: false, message: 'Please enter a valid US phone number (e.g., (555) 123-4567)' };
        }
        break;
      
      case 'ssn':
        if (!validateSSN(inputValue)) {
          return { isValid: false, message: 'Please enter a valid 9-digit Social Security Number' };
        }
        break;
      
      
      case 'email':
        if (!validateEmail(inputValue)) {
          return { isValid: false, message: 'Please enter a valid email address' };
        }
        break;
      
      case 'license':
        if (!validateDriverLicense(inputValue)) {
          return { isValid: false, message: 'Please enter a valid driver\'s license number (5-15 alphanumeric characters)' };
        }
        break;
      
      case 'income':
        if (!validateIncome(inputValue)) {
          return { isValid: false, message: 'Please enter a valid positive number' };
        }
        break;
      
      case 'zip':
        if (!validateZIPCode(inputValue)) {
          return { isValid: false, message: 'Please enter a valid ZIP code (5 or 9 digits)' };
        }
        break;
    }

    return { isValid: true, message: '' };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Apply formatting based on type
    switch (type) {
      case 'phone':
        // Remove all non-digits and format
        const phoneDigits = inputValue.replace(/\D/g, '');
        // Limit to 10 digits hard cap while typing
        inputValue = phoneDigits.slice(0, 10);
        break;
      
      case 'ssn':
        // Remove all non-digits and limit to 9
        inputValue = inputValue.replace(/\D/g, '').slice(0, 9);
        break;
      
      
      case 'income':
        // Allow only numbers and decimal point
        inputValue = inputValue.replace(/[^\d.]/g, '');
        // Prevent multiple decimal points
        const parts = inputValue.split('.');
        if (parts.length > 2) {
          inputValue = parts[0] + '.' + parts.slice(1).join('');
        }
        break;
      
      case 'zip':
        // Allow only digits and limit to 9 characters
        inputValue = inputValue.replace(/\D/g, '').slice(0, 9);
        break;
    }

    onChange(inputValue);
  };

  const handleBlur = () => {
    const validation = validateField(value);
    setIsValid(validation.isValid);
    setValidationMessage(validation.message);
  };

  const getDisplayValue = (): string => {
    switch (type) {
      case 'phone':
        return value ? formatPhoneNumber(value) : '';
      case 'ssn':
        return value ? formatSSN(value) : '';
      case 'zip':
        return value ? formatZIPCode(value) : '';
      default:
        return value || '';
    }
  };

  const getInputType = (): string => {
    switch (type) {
      case 'email':
        return 'email';
      case 'income':
        return 'number';
      default:
        return 'text';
    }
  };

  const getPlaceholder = (): string => {
    if (placeholder) return placeholder;
    
    switch (type) {
      case 'phone':
        return '(555) 123-4567';
      case 'ssn':
        return 'XXX-XX-XXXX';
      case 'email':
        return 'email@example.com';
      case 'license':
        return 'License number';
      case 'income':
        return '0.00';
      case 'zip':
        return '12345';
      default:
        return '';
    }
  };

  return (
    <>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Input
        type={getInputType()}
        value={getDisplayValue()}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={getPlaceholder()}
        disabled={disabled}
        className={`${isValid === false ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
      />
      {(error || validationMessage) && (
        <FormMessage className="text-red-500 text-sm">
          {error || validationMessage}
        </FormMessage>
      )}
    </>
  );
};

// Specialized components for common use cases
export const PhoneInput: React.FC<Omit<ValidatedInputProps, 'type'> & { name: string }> = (props) => (
  <ValidatedInput {...props} type="phone" />
);

export const SSNInput: React.FC<Omit<ValidatedInputProps, 'type'> & { name: string }> = (props) => (
  <ValidatedInput {...props} type="ssn" />
);


export const EmailInput: React.FC<Omit<ValidatedInputProps, 'type'> & { name: string }> = (props) => (
  <ValidatedInput {...props} type="email" />
);

export const LicenseInput: React.FC<Omit<ValidatedInputProps, 'type'> & { name: string }> = (props) => (
  <ValidatedInput {...props} type="license" />
);

export const IncomeInput: React.FC<Omit<ValidatedInputProps, 'type'> & { name: string }> = (props) => (
  <ValidatedInput {...props} type="income" />
);

export const ZIPInput: React.FC<Omit<ValidatedInputProps, 'type'> & { name: string }> = (props) => (
  <ValidatedInput {...props} type="zip" />
);

// Enhanced Income Input with frequency selector
interface IncomeWithFrequencyProps {
  name: string;
  label: string;
  value: string | undefined | null;
  frequency: string;
  onValueChange: (value: string) => void;
  onFrequencyChange: (frequency: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const IncomeWithFrequencyInput: React.FC<IncomeWithFrequencyProps> = ({
  name,
  label,
  value,
  frequency,
  onValueChange,
  onFrequencyChange,
  placeholder,
  required = false,
  error,
  className = '',
  disabled = false
}) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>('');

  const frequencyOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const validateField = (inputValue: string | undefined | null): { isValid: boolean; message: string } => {
    // Handle null/undefined cases
    if (!inputValue || typeof inputValue !== 'string') {
      return { isValid: required ? false : true, message: required ? `${label} is required` : '' };
    }
    
    if (!inputValue.trim()) {
      return { isValid: required ? false : true, message: required ? `${label} is required` : '' };
    }

    if (!validateIncome(inputValue)) {
      return { isValid: false, message: 'Please enter a valid positive number' };
    }

    return { isValid: true, message: '' };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // Allow only numbers and decimal point
    inputValue = inputValue.replace(/[^\d.]/g, '');
    // Prevent multiple decimal points
    const parts = inputValue.split('.');
    if (parts.length > 2) {
      inputValue = parts[0] + '.' + parts.slice(1).join('');
    }

    onValueChange(inputValue);
  };

  const handleBlur = () => {
    const validation = validateField(value);
    setIsValid(validation.isValid);
    setValidationMessage(validation.message);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="flex flex-row gap-2 items-center" style={{ marginTop: '19px' }}>
        <div className="flex-1 min-w-0">
          <Input
            type="number"
            value={value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder || '0.00'}
            disabled={disabled}
            className={`w-full ${isValid === false ? 'border-red-500 focus:border-red-500' : ''}`}
          />
        </div>
        <div className="w-28 flex-shrink-0">
          <select
            value={frequency}
            onChange={(e) => onFrequencyChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm h-10"
          >
            {frequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {(error || validationMessage) && (
        <FormMessage className="text-red-500 text-sm">
          {error || validationMessage}
        </FormMessage>
      )}
    </div>
  );
}; 