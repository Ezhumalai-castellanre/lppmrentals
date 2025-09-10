/**
 * Test file for separate webhook submission functionality
 * This file can be used to test the new separate webhook submission logic
 */

import { WebhookService } from './webhook-service';

// Mock form data for testing
const mockFormData = {
  application: {
    buildingAddress: "123 Test St",
    apartmentNumber: "Apt 1",
    monthlyRent: 2000,
    moveInDate: "2024-02-01"
  },
  applicant: {
    name: "John Doe",
    email: "john@example.com",
    phone: "555-1234",
    address: "123 Test St",
    city: "Test City",
    state: "CA",
    zip: "12345",
    dob: "1990-01-01",
    ssn: "123-45-6789",
    income: "50000",
    incomeFrequency: "yearly",
    bankRecords: []
  },
  coApplicants: [
    {
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "555-5678",
      address: "123 Test St",
      city: "Test City",
      state: "CA",
      zip: "12345",
      dob: "1992-01-01",
      ssn: "987-65-4321",
      income: "45000",
      incomeFrequency: "yearly",
      bankRecords: []
    }
  ],
  guarantors: [
    {
      name: "Bob Smith",
      email: "bob@example.com",
      phone: "555-9999",
      address: "456 Other St",
      city: "Other City",
      state: "CA",
      zip: "54321",
      dob: "1985-01-01",
      ssn: "111-22-3333",
      income: "80000",
      incomeFrequency: "yearly",
      bankRecords: []
    }
  ],
  hasCoApplicant: true,
  hasGuarantor: true,
  coApplicantCount: 1,
  guarantorCount: 1,
  landlordTenantLegalAction: "No",
  brokenLease: "No",
  signatures: {
    applicantSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
  }
};

const mockUploadedFiles = {
  supporting_w9_forms: [
    {
      file_name: "w9-form.pdf",
      file_size: 1024,
      mime_type: "application/pdf",
      upload_date: "2024-01-15T10:00:00Z"
    }
  ],
  coApplicant_w9_forms: [
    {
      file_name: "coapplicant-w9-form.pdf",
      file_size: 1024,
      mime_type: "application/pdf",
      upload_date: "2024-01-15T10:00:00Z"
    }
  ],
  guarantor_w9_forms: [
    {
      file_name: "guarantor-w9-form.pdf",
      file_size: 1024,
      mime_type: "application/pdf",
      upload_date: "2024-01-15T10:00:00Z"
    }
  ]
};

/**
 * Test function to verify separate webhook submissions
 */
export async function testSeparateWebhookSubmissions() {
  console.log('🧪 Testing separate webhook submissions...');
  
  const referenceId = `test_${Date.now()}`;
  const applicationId = `app_${Date.now()}`;
  
  try {
    // Test the separate webhook submission
    const result = await WebhookService.sendSeparateWebhooks(
      mockFormData,
      referenceId,
      applicationId,
      'America/New_York',
      mockUploadedFiles
    );
    
    console.log('📊 Test Results:', {
      success: result.success,
      error: result.error,
      applicantSuccess: result.results.applicant.success,
      coApplicantCount: result.results.coApplicants.length,
      guarantorCount: result.results.guarantors.length,
      coApplicantSuccess: result.results.coApplicants.every(r => r.success),
      guarantorSuccess: result.results.guarantors.every(r => r.success)
    });
    
    if (result.success) {
      console.log('✅ All separate webhook submissions successful!');
    } else {
      console.log('❌ Some webhook submissions failed:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: {
        applicant: { success: false, error: 'Test failed' },
        coApplicants: [],
        guarantors: []
      }
    };
  }
}

/**
 * Test individual webhook submissions
 */
export async function testIndividualWebhookSubmissions() {
  console.log('🧪 Testing individual webhook submissions...');
  
  const referenceId = `test_${Date.now()}`;
  const applicationId = `app_${Date.now()}`;
  
  try {
    // Test applicant webhook
    console.log('📤 Testing applicant webhook...');
    const applicantResult = await WebhookService.sendApplicantWebhook(
      mockFormData,
      referenceId,
      applicationId,
      'America/New_York',
      mockUploadedFiles
    );
    console.log('📥 Applicant result:', applicantResult);
    
    // Test co-applicant webhook
    if (mockFormData.coApplicants && mockFormData.coApplicants.length > 0) {
      console.log('📤 Testing co-applicant webhook...');
      const coApplicantResult = await WebhookService.sendCoApplicantWebhook(
        mockFormData.coApplicants[0],
        0,
        mockFormData,
        referenceId,
        applicationId,
        'America/New_York',
        mockUploadedFiles
      );
      console.log('📥 Co-applicant result:', coApplicantResult);
    }
    
    // Test guarantor webhook
    if (mockFormData.guarantors && mockFormData.guarantors.length > 0) {
      console.log('📤 Testing guarantor webhook...');
      const guarantorResult = await WebhookService.sendGuarantorWebhook(
        mockFormData.guarantors[0],
        0,
        mockFormData,
        referenceId,
        applicationId,
        'America/New_York',
        mockUploadedFiles
      );
      console.log('📥 Guarantor result:', guarantorResult);
    }
    
    console.log('✅ Individual webhook tests completed!');
    
  } catch (error) {
    console.error('❌ Individual webhook test failed:', error);
  }
}

// Export for use in console or other test files
export { mockFormData, mockUploadedFiles };
