// Enhanced Application Form Example - Integration Guide
import React, { useState } from 'react';
import { useEnhancedValidation } from '../hooks/use-enhanced-validation';
import { EnhancedFormField } from './ui/enhanced-form-field';
import { ErrorsDisplay, ErrorSummary } from './ui/enhanced-error-display';
import { submitFormWithErrorHandling } from '../lib/enhanced-form-submission';
import { errorHandler } from '../lib/error-handler';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { useToast } from '../hooks/use-toast';

// Form data interface
interface ApplicationFormData {
  // Application Info
  buildingAddress: string;
  apartmentNumber: string;
  moveInDate: Date;
  monthlyRent: number;
  apartmentType: string;
  
  // Primary Applicant
  applicantName: string;
  applicantDob: Date;
  applicantPhone: string;
  applicantEmail: string;
  applicantSsn: string;
  applicantLicense: string;
  applicantAddress: string;
  applicantCity: string;
  applicantState: string;
  applicantZip: string;
  
  // Co-Applicants
  coApplicants: Array<{
    name: string;
    dob: Date;
    phone: string;
    email: string;
    ssn: string;
  }>;
  
  // Guarantors
  guarantors: Array<{
    name: string;
    dob: Date;
    phone: string;
    email: string;
    ssn: string;
  }>;
}

// Example enhanced application form component
export function EnhancedApplicationFormExample() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [submissionId] = useState(`submission_${Date.now()}`);

  // Initialize enhanced validation
  const form = useEnhancedValidation<ApplicationFormData>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    validateOnMount: false,
    clearErrorsOnChange: true,
    debounceMs: 300
  });

  // Handle form submission with enhanced error handling
  const handleSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    setSubmissionProgress(0);

    try {
      const result = await submitFormWithErrorHandling(
        submissionId,
        data,
        async (formData, signal) => {
          // Your actual submission function here
          const response = await fetch('/api/submit-application', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
            signal
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return response.json();
        },
        {
          validateBeforeSubmit: true,
          showProgress: true,
          retryAttempts: 3,
          retryDelay: 1000,
          onProgress: setSubmissionProgress,
          onValidationError: (errors) => {
            toast({
              title: 'Validation Errors',
              description: `Please fix ${errors.length} validation error${errors.length !== 1 ? 's' : ''}`,
              variant: 'destructive',
            });
          },
          onNetworkError: (error) => {
            toast({
              title: 'Network Error',
              description: error.userMessage,
              variant: 'destructive',
            });
          },
          onServerError: (error) => {
            toast({
              title: 'Server Error',
              description: error.userMessage,
              variant: 'destructive',
            });
          },
          onSuccess: (data) => {
            toast({
              title: 'Success!',
              description: 'Your application has been submitted successfully.',
            });
          }
        }
      );

      if (result.success) {
        // Handle successful submission
        console.log('Form submitted successfully:', result.data);
      } else {
        // Handle submission failure
        console.error('Form submission failed:', result.errors);
      }

    } catch (error) {
      console.error('Unexpected error during submission:', error);
      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress(0);
    }
  };

  // Get current errors
  const currentErrors = errorHandler.getErrors();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Error Summary */}
      {currentErrors.length > 0 && (
        <ErrorSummary
          errors={currentErrors}
          onDismiss={(errorId) => {
            errorHandler.clearErrors();
          }}
          onClearAll={() => {
            errorHandler.clearErrors();
          }}
        />
      )}

      {/* Progress Bar */}
      {isSubmitting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Submitting application...</span>
                <span>{submissionProgress}%</span>
              </div>
              <Progress value={submissionProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={form.handleSubmitWithValidation(handleSubmit)} className="space-y-6">
        {/* Application Information */}
        <Card>
          <CardHeader>
            <CardTitle>Application Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnhancedFormField
                form={form}
                name="buildingAddress"
                label="Building Address"
                required
                placeholder="Enter building address"
              />
              
              <EnhancedFormField
                form={form}
                name="apartmentNumber"
                label="Apartment Number"
                required
                placeholder="Enter apartment number"
              />
              
              <EnhancedFormField
                form={form}
                name="moveInDate"
                label="Move-in Date"
                type="date"
                required
                validation={{
                  validateOnBlur: true,
                  validateOnChange: false
                }}
              />
              
              <EnhancedFormField
                form={form}
                name="monthlyRent"
                label="Monthly Rent"
                type="number"
                required
                format={{ type: 'currency' }}
                placeholder="$0.00"
              />
              
              <EnhancedFormField
                form={form}
                name="apartmentType"
                label="Apartment Type"
                required
                placeholder="e.g., 1 Bedroom, 2 Bedroom"
              />
            </div>
          </CardContent>
        </Card>

        {/* Primary Applicant */}
        <Card>
          <CardHeader>
            <CardTitle>Primary Applicant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnhancedFormField
                form={form}
                name="applicantName"
                label="Full Name"
                required
                placeholder="Enter full name"
                validation={{
                  validateOnBlur: true,
                  validateOnChange: false
                }}
              />
              
              <EnhancedFormField
                form={form}
                name="applicantDob"
                label="Date of Birth"
                type="date"
                required
                validation={{
                  validateOnBlur: true,
                  validateOnChange: false
                }}
              />
              
              <EnhancedFormField
                form={form}
                name="applicantPhone"
                label="Phone Number"
                type="tel"
                format={{ type: 'phone' }}
                placeholder="(555) 123-4567"
                validation={{
                  validateOnBlur: true,
                  validateOnChange: false
                }}
              />
              
              <EnhancedFormField
                form={form}
                name="applicantEmail"
                label="Email Address"
                type="email"
                required
                placeholder="email@example.com"
                validation={{
                  validateOnBlur: true,
                  validateOnChange: false
                }}
              />
              
              <EnhancedFormField
                form={form}
                name="applicantSsn"
                label="Social Security Number"
                format={{ type: 'ssn' }}
                placeholder="123-45-6789"
                validation={{
                  validateOnBlur: true,
                  validateOnChange: false
                }}
              />
              
              <EnhancedFormField
                form={form}
                name="applicantLicense"
                label="Driver's License"
                placeholder="Enter license number"
                validation={{
                  validateOnBlur: true,
                  validateOnChange: false
                }}
              />
              
              <EnhancedFormField
                form={form}
                name="applicantAddress"
                label="Address"
                placeholder="Enter street address"
                validation={{
                  validateOnBlur: true,
                  validateOnChange: false
                }}
              />
              
              <EnhancedFormField
                form={form}
                name="applicantCity"
                label="City"
                placeholder="Enter city"
                validation={{
                  validateOnBlur: true,
                  validateOnChange: false
                }}
              />
              
              <EnhancedFormField
                form={form}
                name="applicantState"
                label="State"
                placeholder="CA"
                validation={{
                  validateOnBlur: true,
                  validateOnChange: false
                }}
              />
              
              <EnhancedFormField
                form={form}
                name="applicantZip"
                label="ZIP Code"
                format={{ type: 'zip' }}
                placeholder="12345"
                validation={{
                  validateOnBlur: true,
                  validateOnChange: false
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Errors Display */}
        {form.hasErrors && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Please Fix the Following Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorsDisplay
                errors={currentErrors}
                collapsible={currentErrors.length > 3}
                showDetails={false}
                onDismiss={(errorId) => {
                  errorHandler.clearErrors();
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.clearAllErrors();
              form.reset();
            }}
            disabled={isSubmitting}
          >
            Reset Form
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting || !form.isValid}
            className="min-w-[120px]"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Usage example in your main application form:
/*
// Replace your existing form with this enhanced version:

import { EnhancedApplicationFormExample } from './enhanced-application-form-example';

// In your component:
<EnhancedApplicationFormExample />

// Or integrate the enhanced validation into your existing form:
import { useEnhancedValidation } from '../hooks/use-enhanced-validation';
import { EnhancedFormField } from './ui/enhanced-form-field';
import { submitFormWithErrorHandling } from '../lib/enhanced-form-submission';

const form = useEnhancedValidation<YourFormData>({
  mode: 'onBlur',
  reValidateMode: 'onChange',
  clearErrorsOnChange: true
});

// Use EnhancedFormField instead of regular form fields:
<EnhancedFormField
  form={form}
  name="fieldName"
  label="Field Label"
  required
  format={{ type: 'phone' }} // Optional formatting
  validation={{
    validateOnBlur: true,
    validateOnChange: false
  }}
/>

// Use enhanced form submission:
const handleSubmit = async (data) => {
  const result = await submitFormWithErrorHandling(
    'unique-submission-id',
    data,
    yourSubmissionFunction,
    {
      validateBeforeSubmit: true,
      retryAttempts: 3,
      onValidationError: (errors) => {
        // Handle validation errors
      },
      onSuccess: (data) => {
        // Handle success
      }
    }
  );
};
*/
