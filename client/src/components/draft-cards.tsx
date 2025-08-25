import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { FileText, Clock, Edit, Trash2, Building, User, Calendar, DollarSign, CheckCircle, File, Eye, Users, Shield } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { dynamoDBService } from "../lib/dynamodb-service";
import { format } from "date-fns";

interface DraftData {
  zoneinfo: string;
  applicantId: string;
  reference_id: string;
  form_data: any;
  current_step: number;
  last_updated: string;
  status: 'draft' | 'submitted';
  uploaded_files_metadata?: any;
  webhook_responses?: any;
  signatures?: any;
  encrypted_documents?: any;
}

interface DraftCardProps {
  draft: DraftData;
  onEdit: (draft: DraftData) => void;
  onDelete: (draftId: string) => void;
}

const DraftCard = ({ draft, onEdit, onDelete }: DraftCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateInput: string | Date) => {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return 'Invalid date';
      // Normalize to UTC date (midday) to avoid timezone shifting the displayed day
      const utcYear = date.getUTCFullYear();
      const utcMonth = date.getUTCMonth();
      const utcDay = date.getUTCDate();
      const stableUtcMidday = new Date(Date.UTC(utcYear, utcMonth, utcDay, 12));
      return format(stableUtcMidday, 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return <Badge className="bg-green-100 text-green-800"><FileText className="w-3 h-3 mr-1" />Submitted</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Normalize form_data (parse JSON string if needed)
  const rawFormData = draft.form_data;
  let normalizedFormData: any = {};
  try {
    normalizedFormData = typeof rawFormData === 'string' ? JSON.parse(rawFormData) : (rawFormData || {});
    console.log('🔍 Raw form_data:', rawFormData);
    console.log('🔍 Normalized form_data:', normalizedFormData);
    console.log('🔍 Form_data type:', typeof rawFormData);
    
    // Deep inspection of the applicant section
    if (normalizedFormData.applicant) {
      console.log('🔍 Applicant section found:', normalizedFormData.applicant);
      console.log('🔍 Applicant name:', normalizedFormData.applicant.name);
      console.log('🔍 Applicant email:', normalizedFormData.applicant.email);
      console.log('🔍 Applicant section keys:', Object.keys(normalizedFormData.applicant));
    } else {
      console.log('⚠️ No applicant section found in normalizedFormData');
      console.log('🔍 Available top-level keys:', Object.keys(normalizedFormData));
    }
  } catch (e) {
    console.warn('Failed to parse draft.form_data JSON:', e);
    normalizedFormData = {};
  }

  // Parse webhook_responses to get document count
  let parsedResponses: any = {};
  try {
    if (draft.webhook_responses) {
      parsedResponses = typeof draft.webhook_responses === 'string' 
        ? JSON.parse(draft.webhook_responses) 
        : draft.webhook_responses;
    }
  } catch (e) {
    console.warn('Failed to parse draft.webhook_responses JSON:', e);
    parsedResponses = {};
  }

  // Get the number of documents from webhook_responses
  const documentCount = Object.keys(parsedResponses).length;
  console.log('📄 Document count from webhook_responses:', documentCount);

  // Enhanced form data parsing with all fields
  const getFormDataSummary = (formData: any) => {
    if (!formData) return {} as any;
    
    // Handle both old flat format and new nested format
    const isNewFormat = formData.application && formData.applicant;
    
    if (isNewFormat) {
      // New nested format - extract from nested objects
      return {
        // Application Info
        buildingAddress: formData.application?.buildingAddress || 'Not specified',
        apartmentNumber: formData.application?.apartmentNumber || 'Not specified',
        apartmentType: formData.application?.apartmentType || 'Not specified',
        monthlyRent: formData.application?.monthlyRent || 'Not specified',
        moveInDate: formData.application?.moveInDate || 'Not specified',
        howDidYouHear: formData.application?.howDidYouHear || 'Not specified',
        
        // Applicant Info
        applicantName: formData.applicant?.name || formData.applicantName || 'Not specified',
        applicantEmail: formData.applicant?.email || formData.applicantEmail || 'Not specified',
        
        // Applicant details
        applicant_phone: formData.applicant?.phone,
        applicant_address: formData.applicant?.address,
        applicant_city: formData.applicant?.city,
        applicant_state: formData.applicant?.state,
        applicant_zip: formData.applicant?.zip,
        applicant_dob: formData.applicant?.dob,
        applicant_ssn: formData.applicant?.ssn,
        applicant_license: formData.applicant?.license,
        applicant_licenseState: formData.applicant?.licenseState,
        applicant_lengthAtAddressYears: formData.applicant?.lengthAtAddressYears,
        applicant_lengthAtAddressMonths: formData.applicant?.lengthAtAddressMonths,
        applicant_landlordName: formData.applicant?.landlordName,
        applicant_landlordAddressLine1: formData.applicant?.landlordAddressLine1,
        applicant_landlordAddressLine2: formData.applicant?.landlordAddressLine2,
        applicant_landlordCity: formData.applicant?.landlordCity,
        applicant_landlordState: formData.applicant?.landlordState,
        applicant_landlordZipCode: formData.applicant?.landlordZipCode,
        applicant_landlordPhone: formData.applicant?.landlordPhone,
        applicant_landlordEmail: formData.applicant?.landlordEmail,
        applicant_currentRent: formData.applicant?.currentRent,
        applicant_reasonForMoving: formData.applicant?.reasonForMoving,
        applicant_age: formData.applicant?.age,
        applicant_employmentType: formData.applicant?.employmentType,
        applicant_employer: formData.applicant?.employer,
        applicant_position: formData.applicant?.position,
        applicant_employmentStart: formData.applicant?.employmentStart,
        applicant_income: formData.applicant?.income,
        applicant_incomeFrequency: formData.applicant?.incomeFrequency,
        applicant_businessName: formData.applicant?.businessName,
        applicant_businessType: formData.applicant?.businessType,
        applicant_yearsInBusiness: formData.applicant?.yearsInBusiness,
        applicant_otherIncome: formData.applicant?.otherIncome,
        applicant_otherIncomeSource: formData.applicant?.otherIncomeSource,
        applicant_bankRecords: formData.applicant?.bankRecords,
        
        // Co-Applicants (new format)
        coApplicants: formData.coApplicants || [],
        
        // Co-Applicants Bank Records (extracted from nested structure)
        coApplicantsBankRecords: (formData.coApplicants || []).map((coApp: any) => coApp.bankRecords || []).flat().filter((record: any) => record && Object.keys(record).length > 0),
        
        // Guarantors (new format)
        guarantors: formData.guarantors || [],
        
        // Guarantors Bank Records (extracted from nested structure)
        guarantorsBankRecords: (formData.guarantors || []).map((guar: any) => guar.bankRecords || []).flat(),
        

        
        // Occupants
        occupants: formData.occupants || [],
        
        // Additional fields
        hasCoApplicant: formData.hasCoApplicant,
        hasGuarantor: formData.hasGuarantor,
        coApplicantCount: formData.coApplicantCount,
        guarantorCount: formData.guarantorCount,
        landlordTenantLegalAction: formData.landlordTenantLegalAction,
        brokenLease: formData.brokenLease,
        application_id: formData.application_id,
        applicantId: formData.applicantId,
        zoneinfo: formData.zoneinfo,
        webhookSummary: formData.webhookSummary,
      };
    } else {
      // Old flat format - extract all available fields dynamically
      const allFields: any = {};
      
      // Recursively extract all nested fields
      const extractFields = (obj: any, prefix = '') => {
        if (obj && typeof obj === 'object') {
          Object.entries(obj).forEach(([key, value]) => {
            // Skip webhookSummary completely
            if (key === 'webhookSummary') {
              return;
            }
            
            const fieldKey = prefix ? `${prefix}_${key}` : key;
            
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              extractFields(value, fieldKey);
            } else if (value !== null && value !== undefined && value !== '') {
              // Special handling for fields that might be stringified objects/arrays
              if (typeof value === 'string' && (value.includes('[object Object]') || value.includes('[') && value.includes(']'))) {
                                  try {
                    const parsed = JSON.parse(value);
                    allFields[fieldKey] = parsed;
                  } catch (e) {
                    allFields[fieldKey] = value;
                  }
              } else {
                allFields[fieldKey] = value;
              }
            }
          });
        }
      };
      
      extractFields(formData);
      
      // Special handling for bankRecords - extract from nested structure
      if (formData.applicant && formData.applicant.bankRecords) {
        allFields.applicantBankRecords = formData.applicant.bankRecords;
      }
      if (formData.coApplicants && formData.coApplicants.length > 0) {
        allFields.coApplicantsBankRecords = formData.coApplicants.map((coApp: any) => coApp.bankRecords || []).flat();
      }
      if (formData.guarantors && formData.guarantors.length > 0) {
        allFields.guarantorsBankRecords = formData.guarantors.map((guar: any) => guar.bankRecords || []).flat();
      }
      
      // Enhanced applicant field extraction with comprehensive fallbacks
      const applicantName = formData.applicant?.name ?? 
                           formData.applicantName ?? 
                           allFields.applicant_name ?? 
                           allFields.applicantName ?? 
                           allFields.name ?? 
                           'Not specified';
                           
      const applicantEmail = formData.applicant?.email ?? 
                            formData.applicantEmail ?? 
                            allFields.applicant_email ?? 
                            allFields.applicantEmail ?? 
                            allFields.email ?? 
                            'Not specified';
      
      return {
        // Core application fields
        buildingAddress: formData.buildingAddress ?? formData.application?.buildingAddress ?? 'Not specified',
        apartmentNumber: formData.apartmentNumber ?? formData.application?.apartmentNumber ?? 'Not specified',
        apartmentType: formData.apartmentType ?? formData.application?.apartmentType ?? 'Not specified',
        monthlyRent: formData.monthlyRent ?? formData.application?.monthlyRent ?? 'Not specified',
        moveInDate: formData.moveInDate ?? formData.application?.moveInDate ?? 'Not specified',
        howDidYouHear: formData.howDidYouHear ?? formData.application?.howDidYouHear ?? 'Not specified',
        applicantName,
        applicantEmail,
        
        // All other fields
        ...allFields
      };
    }
  };

  // Enhanced webhook responses parsing
  const getWebhookDataSummary = (webhookData: any) => {
    if (!webhookData) return {};
    
    const parsedData: any = {};
    
    try {
      const responses = typeof webhookData === 'string' ? JSON.parse(webhookData) : webhookData;
      
      Object.entries(responses).forEach(([section, data]: [string, any]) => {
        if (data && typeof data === 'object') {
          parsedData[section] = {
            status: data.status || 'Processing',
            documentType: data.documentType || 'Unknown',
            fileCount: data.files ? data.files.length : 0,
            processingDate: data.processingDate || data.timestamp,
            results: data.results || data.data || {},
            errors: data.errors || [],
            pdfInfo: data.pdfInfo || data.metadata || {}
          };
        }
      });
    } catch (e) {
      console.warn('Failed to parse webhook responses:', e);
    }
    
    return parsedData;
  };

  const formSummary = getFormDataSummary(normalizedFormData);
  const webhookSummary = getWebhookDataSummary(draft.webhook_responses);
  
  const progressPercentage = Math.round((draft.current_step / 12) * 100); // Assuming 8 total steps

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await onDelete(draft.reference_id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              {draft.status === 'submitted' ? 'Submitted Application' : 'Draft Application'}
            </CardTitle>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {draft.status === 'submitted' ? 'Application has been submitted successfully' : 'Application in progress'}
            </p>
          </div>
          {draft.status === 'submitted' && (
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="text-gray-900 font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-gray-500">
            Step {draft.current_step} of 12 sections completed
          </p>
        </div>

        {/* Enhanced Form Data Summary */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Application Details</h4>
          
          {/* Vertical Layout - One Section at a Time */}
          <div className="space-y-4">
            
            {/* Application Section - Enhanced with all fields */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <Building className="w-4 h-4 mr-2 text-blue-600" />
                Application Details
              </h5>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">Address:</span>
            <span className="text-gray-700 text-xs sm:text-sm">{formSummary.buildingAddress}</span>
          </div>
          <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">Apt:</span>
                    <span className="text-gray-700 text-xs sm:text-sm">{formSummary.apartmentNumber}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">Type:</span>
                    <span className="text-gray-700 text-xs sm:text-sm">{formSummary.apartmentType}</span>
          </div>
          <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">Rent:</span>
            <span className="text-gray-700 text-xs sm:text-sm">
              {typeof formSummary.monthlyRent === 'number' 
                ? `$${formSummary.monthlyRent}/month` 
                : formSummary.monthlyRent}
            </span>
          </div>
                  <div className="flex items-center space-x-2 col-span-1 sm:col-span-2">
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">Move-in:</span>
            <span className="text-gray-700 text-xs sm:text-sm">
              {formSummary.moveInDate !== 'Not specified' 
                ? formatDate(formSummary.moveInDate) 
                : 'Not specified'}
            </span>
          </div>
                  <div className="flex items-center space-x-2 col-span-1 sm:col-span-2">
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">How did you hear:</span>
                    <span className="text-gray-700 text-xs sm:text-sm">{formSummary.howDidYouHear || 'Not specified'}</span>
                  </div>
                </div>
                
                {/* Additional application fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-gray-200">
                  {Object.entries(formSummary).filter(([key, value]) => 
                    key.startsWith('application') && 
                    !['buildingAddress', 'apartmentNumber', 'apartmentType', 'monthlyRent', 'moveInDate', 'howDidYouHear'].includes(key) &&
                    value !== 'Not specified' && value !== null && value !== undefined
                  ).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <span className="text-gray-600 font-medium capitalize text-xs sm:text-sm">{key.replace('application', '').replace(/_/g, ' ')}:</span>
                      <span className="text-gray-700 text-xs sm:text-sm">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Applicant Section */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2 text-green-600" />
                Applicant Information
              </h5>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">Name:</span>
                    <span className="text-gray-700 text-xs sm:text-sm">{formSummary.applicantName || 'Not specified'}</span>
          </div>
          <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">Email:</span>
                    <span className="text-gray-700 text-xs sm:text-sm">{formSummary.applicantEmail || 'Not specified'}</span>
                  </div>
                </div>
                
                {/* Additional applicant fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-gray-200">
                  {Object.entries(formSummary).filter(([key, value]) => 
                    key.startsWith('applicant') && 
                    !['applicantName', 'applicantEmail', 'applicant_bankRecords', 'Id', 'BankRecords'].includes(key) &&
                    value !== 'Not specified' && value !== null && value !== undefined
                  ).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <span className="text-gray-600 font-medium capitalize text-xs sm:text-sm">{key.replace('applicant', '').replace(/_/g, ' ')}:</span>
                      <span className="text-gray-700 text-xs sm:text-sm">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Co-Applicants Section */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2 text-purple-600" />
                Co-Applicants Information
              </h5>
              <div className="space-y-3 text-sm">
                {formSummary.coApplicants && Array.isArray(formSummary.coApplicants) && formSummary.coApplicants.length > 0 ? (
                  <div className="space-y-3">
                    {formSummary.coApplicants.map((coApp: any, index: number) => (
                      <div key={index} className="bg-white rounded p-2 sm:p-3 border border-gray-200 border-l-4 border-l-purple-500">
                        <div className="font-medium text-gray-700 mb-2 text-xs sm:text-sm">Co-Applicant {index + 1}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                          {Object.entries(coApp).filter(([key, value]) => 
                            value !== null && value !== undefined && value !== '' && 
                            !['documents', 'bankRecords'].includes(key)
                          ).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <span className="text-gray-600 font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-gray-700">{String(value) || 'Not specified'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs sm:text-sm italic">No co-applicants information</p>
                )}
              </div>
            </div>

            {/* Guarantors Section */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-orange-600" />
                Guarantors Information
              </h5>
              <div className="space-y-3 text-sm">
                {formSummary.guarantors && Array.isArray(formSummary.guarantors) && formSummary.guarantors.length > 0 ? (
                  <div className="space-y-3">
                    {formSummary.guarantors.map((guar: any, index: number) => (
                      <div key={index} className="bg-white rounded p-2 sm:p-3 border border-gray-200 border-l-4 border-l-orange-500">
                        <div className="font-medium text-gray-700 mb-2 text-xs sm:text-sm">Guarantor {index + 1}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                          {Object.entries(guar).filter(([key, value]) => 
                            value !== null && value !== undefined && value !== '' && 
                            !['documents', 'bankRecords'].includes(key)
                          ).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <span className="text-gray-600 font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-gray-700">{String(value) || 'Not specified'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs sm:text-sm italic">No guarantors information</p>
                )}
              </div>
            </div>

            {/* Occupants Section */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2 text-indigo-600" />
                Occupants Information
              </h5>
              <div className="space-y-3 text-sm">
                {(formSummary.occupants && Array.isArray(formSummary.occupants) && formSummary.occupants.length > 0) || 
                 (formSummary.occupantsList && Array.isArray(formSummary.occupantsList) && formSummary.occupantsList.length > 0) ? (
                  <div className="space-y-3">
                    {(formSummary.occupants || formSummary.occupantsList || []).map((occupant: any, index: number) => (
                      <div key={index} className="bg-white rounded p-2 sm:p-3 border border-gray-200 border-l-4 border-l-blue-500">
                        <div className="font-medium text-gray-700 mb-2 text-xs sm:text-sm">Occupant {index + 1}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                          {Object.entries(occupant).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <span className="text-gray-600 font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-gray-700">{String(value) || 'Not specified'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs sm:text-sm italic">No occupants information</p>
                )}
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-purple-600" />
                Additional Information
              </h5>
              <div className="space-y-3 text-sm">
                
                {/* Special handling for bank records */}
                {(formSummary.applicantBankRecords || formSummary.applicant_bankRecords) && Array.isArray(formSummary.applicantBankRecords || formSummary.applicant_bankRecords) && (
                  <div className="space-y-2">
                    <div className="font-medium text-gray-700 capitalize border-b border-gray-200 pb-1 text-xs sm:text-sm">
                      Applicant Bank Records ({(formSummary.applicantBankRecords || formSummary.applicant_bankRecords).length} accounts):
                    </div>
                    <div className="grid grid-cols-1 gap-2 pl-2 sm:pl-4">
                      {(formSummary.applicantBankRecords || formSummary.applicant_bankRecords).map((bank: any, index: number) => (
                        <div key={index} className="bg-white rounded p-2 sm:p-3 border border-gray-200">
                          <div className="font-medium text-gray-700 mb-2 text-xs sm:text-sm">Bank Account {index + 1}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                            {Object.entries(bank).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <span className="text-gray-600 font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="text-gray-700">{String(value) || 'Not specified'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Co-Applicants Bank Records */}
                {formSummary.coApplicantsBankRecords && Array.isArray(formSummary.coApplicantsBankRecords) && formSummary.coApplicantsBankRecords.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium text-gray-700 capitalize border-b border-gray-200 pb-1 text-xs sm:text-sm">
                      Co-Applicants Bank Records ({formSummary.coApplicantsBankRecords.length} accounts):
                    </div>
                    <div className="grid grid-cols-1 gap-2 pl-2 sm:pl-4">
                      {formSummary.coApplicantsBankRecords.map((bank: any, index: number) => (
                        <div key={index} className="bg-white rounded p-2 sm:p-3 border border-gray-200">
                          <div className="font-medium text-gray-700 mb-2 text-xs sm:text-sm">Bank Account {index + 1}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                            {Object.entries(bank).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <span className="text-gray-600 font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="text-gray-700">{String(value) || 'Not specified'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                

                
                {/* Guarantors Bank Records */}
                {formSummary.guarantorsBankRecords && Array.isArray(formSummary.guarantorsBankRecords) && formSummary.guarantorsBankRecords.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium text-gray-700 capitalize border-b border-gray-200 pb-1 text-xs sm:text-sm">
                      Guarantors Bank Records ({formSummary.guarantorsBankRecords.length} accounts):
                    </div>
                    <div className="grid grid-cols-1 gap-2 pl-2 sm:pl-4">
                      {formSummary.guarantorsBankRecords.map((bank: any, index: number) => (
                        <div key={index} className="bg-white rounded p-2 sm:p-3 border border-gray-200">
                          <div className="font-medium text-gray-700 mb-2 text-xs sm:text-sm">Bank Account {index + 1}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                            {Object.entries(bank).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <span className="text-gray-600 font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="text-gray-700">{String(value) || 'Not specified'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                

                

                
                {/* Other fields */}
                {Object.entries(formSummary).filter(([key, value]) => 
                  !['buildingAddress', 'apartmentNumber', 'apartmentType', 'monthlyRent', 'moveInDate', 'howDidYouHear', 'applicantName', 'applicantEmail', 'occupants', 'occupantsList', 'bankRecords', 'applicantBankRecords', 'coApplicantsBankRecords', 'guarantorsBankRecords', 'webhookSummary', 'coApplicants', 'guarantors', 'hasCoApplicant', 'hasGuarantor', 'coApplicantCount', 'guarantorCount', 'landlordTenantLegalAction', 'brokenLease', 'application_id', 'applicantId', 'zoneinfo'].includes(key) &&
                  !key.startsWith('applicant') &&
                  !key.startsWith('application') &&
                  !key.startsWith('coApplicant') &&
                  !key.startsWith('guarantor') &&
                  value !== 'Not specified' && value !== null && value !== undefined
                ).map(([key, value]) => {
                  // Handle list/array fields like bankRecords
                  if (Array.isArray(value)) {
                    return (
                      <div key={key} className="space-y-2">
                        <div className="font-medium text-gray-700 capitalize border-b border-gray-200 pb-1 text-xs sm:text-sm">
                          {key.replace(/_/g, ' ')}:
                        </div>
                        <div className="grid grid-cols-1 gap-2 pl-2 sm:pl-4">
                          {value.map((item: any, index: number) => (
                            <div key={index} className="bg-white rounded p-2 sm:p-3 border border-gray-200">
                              {typeof item === 'object' && item !== null ? (
                                <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                                  {Object.entries(item).map(([itemKey, itemValue]) => (
                                    <div key={itemKey} className="flex items-center space-x-2">
                                      <span className="text-gray-600 font-medium capitalize">{itemKey.replace(/_/g, ' ')}:</span>
                                      <span className="text-gray-700">{String(itemValue)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-700">{String(item)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle stringified arrays/objects (like "[object Object],[object Object]")
                  if (typeof value === 'string' && (value.includes('[object Object]') || value.includes('[') && value.includes(']'))) {
                    try {
                      // Try to parse as JSON if it looks like a stringified array/object
                      const parsedValue = JSON.parse(value);
                      if (Array.isArray(parsedValue)) {
                        return (
                          <div key={key} className="space-y-2">
                            <div className="font-medium text-gray-700 capitalize border-b border-gray-200 pb-1 text-xs sm:text-sm">
                              {key.replace(/_/g, ' ')}:
                            </div>
                            <div className="grid grid-cols-1 gap-2 pl-2 sm:pl-4">
                              {parsedValue.map((item: any, index: number) => (
                                <div key={index} className="bg-white rounded p-2 sm:p-3 border border-gray-200">
                                  {typeof item === 'object' && item !== null ? (
                                    <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                                      {Object.entries(item).map(([itemKey, itemValue]) => (
                                        <div key={itemKey} className="flex items-center space-x-2">
                                          <span className="text-gray-600 font-medium capitalize">{itemKey.replace(/_/g, ' ')}:</span>
                                          <span className="text-gray-700">{String(itemValue)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-700">{String(item)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    } catch (e) {
                      // If parsing fails, show as regular string
                      console.warn(`Failed to parse ${key} as JSON:`, e);
                    }
                  }
                  
                  // Handle object fields
                  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return (
                      <div key={key} className="space-y-2">
                        <div className="font-medium text-gray-700 capitalize border-b border-gray-200 pb-1 text-xs sm:text-sm">
                          {key.replace(/_/g, ' ')}:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4">
                          {Object.entries(value).map(([itemKey, itemValue]) => (
                            <div key={itemKey} className="flex items-center space-x-2">
                              <span className="text-gray-600 font-medium capitalize text-xs sm:text-sm">{itemKey.replace(/_/g, ' ')}:</span>
                              <span className="text-gray-700 text-xs sm:text-sm">{String(itemValue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle regular string/number fields
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <span className="text-gray-600 font-medium capitalize text-xs sm:text-sm">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-gray-700 text-xs sm:text-sm">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Preview All Button - Replaces Uploaded Documents section */}
        {draft.status === 'draft' && (
          <div className="pt-4 border-t border-gray-100">
            <div className="text-center">
           
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {draft.status === 'submitted' ? 'Submitted' : 'Last updated'}: {formatDate(draft.last_updated)}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          {draft.status === 'draft' ? (
            <>
          <Button 
                onClick={() => onEdit(draft)}
            variant="outline" 
            size="sm" 
            className="flex-1"
          >
                <Edit className="w-4 h-4 mr-2" />
            Continue from Step {draft.current_step + 1}
          </Button>
          <Button 
                onClick={handleDelete}
            variant="outline" 
            size="sm"
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
            </>
          ) : (
            // Hide View Full Application button for submitted applications
            null
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const DraftCards = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDrafts = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get all drafts for the current user
        console.log('🔍 About to call getAllDrafts');
        
        if (!user?.applicantId) {
          console.log('⚠️ No applicantId available, trying to get zoneinfo');
          // Try to get zoneinfo from the user object
          const zoneinfo = user?.zoneinfo;
          if (zoneinfo) {
            console.log('🔍 Using zoneinfo:', zoneinfo);
            const userDrafts = await dynamoDBService.getAllDrafts(zoneinfo);
            console.log('📋 Raw drafts from DynamoDB (zoneinfo):', userDrafts);
            setDrafts(userDrafts || []);
          } else {
            console.log('⚠️ No zoneinfo available either');
            setDrafts([]);
          }
        } else {
          console.log('🔍 Using applicantId:', user.applicantId);
          const userDrafts = await dynamoDBService.getAllDrafts(user.applicantId);
          console.log('📋 Raw drafts from DynamoDB (applicantId):', userDrafts);
          console.log('📋 Drafts length:', userDrafts?.length || 0);
          console.log('📋 Drafts type:', typeof userDrafts);
          console.log('📋 Drafts is array:', Array.isArray(userDrafts));
          setDrafts(userDrafts || []);
        }
        
        console.log('📋 State will be updated with drafts');
      } catch (err) {
        console.error('❌ Error loading drafts:', err);
        setError('Failed to load drafts');
      } finally {
        setIsLoading(false);
      }
    };

    loadDrafts();
  }, [user]);

  // Debug: Monitor drafts state changes
  useEffect(() => {
    console.log('📋 Drafts state updated:', drafts);
    console.log('📋 Drafts length in state:', drafts?.length || 0);
  }, [drafts]);

  const handleEdit = (draft: DraftData) => {
    // Navigate to the application form with the draft data
    console.log('📝 Editing draft:', draft);
    
    // Store the draft reference ID in sessionStorage for the application form to pick up
    sessionStorage.setItem('draftToLoad', draft.reference_id);
    
    // Navigate to the application form with the current step parameter
    // This will ensure the user continues from where they left off
    const currentStep = draft.current_step || 0;
    setLocation(`/application?step=${currentStep}&continue=true`);
  };

  const handleDelete = async (draftId: string) => {
    try {
      console.log('🗑️ Deleting draft:', draftId);
      
      // Delete the draft using the service directly
      let success = false;
      if (user?.applicantId) {
        success = await dynamoDBService.deleteDraft(user.applicantId, draftId);
      } else if (user?.zoneinfo) {
        success = await dynamoDBService.deleteDraft(user.zoneinfo, draftId);
      }
      
      if (success) {
        // Remove from local state
        setDrafts(prev => prev.filter(draft => draft.reference_id !== draftId));
        console.log('✅ Draft deleted successfully');
      } else {
        console.error('❌ Failed to delete draft');
      }
    } catch (err) {
      console.error('❌ Error deleting draft:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-600">Loading your applications...</p>
        </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Draft Applications</h1>
            <p className="text-red-600">Error loading drafts: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-4 sm:py-8">
      <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
                  <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            My Applications
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Continue working on your saved applications
          </p>
        </div>
        </div>

        {/* Drafts Grid */}
        {drafts && drafts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-8">
            {drafts.map((draft) => (
              <DraftCard 
                key={draft.reference_id} 
                draft={draft} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 max-w-md mx-auto">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                You haven't started any applications yet.
              </p>
              <Button asChild>
                <a href="/application">Start New Application</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftCards;
