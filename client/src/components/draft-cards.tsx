import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { FileText, Clock, Edit, Trash2, Building, User, Calendar, DollarSign, CheckCircle, File, Eye, Users, Shield, LayoutDashboard, CreditCard, Home, Briefcase, FileCheck } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("overview");

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
      <CardHeader className="pb-3 relative">
        <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
        <div className="flex justify-between items-start relative z-10">
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

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="main" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span className="hidden sm:inline">Main App</span>
            </TabsTrigger>
            <TabsTrigger value="coapplicants" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Co-Apps</span>
            </TabsTrigger>
            <TabsTrigger value="guarantors" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Guarantors</span>
            </TabsTrigger>
            <TabsTrigger value="occupants" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Occupants</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Application Summary Card */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-5 h-5 text-blue-600" />
                  <h6 className="font-semibold text-blue-900">Property</h6>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Address:</span> {formSummary.buildingAddress}</div>
                  <div><span className="font-medium">Apt:</span> {formSummary.apartmentNumber}</div>
                  <div><span className="font-medium">Rent:</span> ${formSummary.monthlyRent}/month</div>
                </div>
              </div>

              {/* Applicant Summary Card */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-green-600" />
                  <h6 className="font-semibold text-green-900">Primary Applicant</h6>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {formSummary.applicantName}</div>
                  <div><span className="font-medium">Email:</span> {formSummary.applicantEmail}</div>
                  <div><span className="font-medium">Status:</span> {draft.status}</div>
                </div>
              </div>

              {/* Co-Applicants Summary Card */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h6 className="font-semibold text-purple-900">Co-Applicants</h6>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Count:</span> {formSummary.coApplicants?.length || 0}</div>
                  <div><span className="font-medium">Status:</span> {formSummary.coApplicants?.length > 0 ? 'Added' : 'None'}</div>
                </div>
              </div>

              {/* Guarantors Summary Card */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-orange-600" />
                  <h6 className="font-semibold text-orange-900">Guarantors</h6>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Count:</span> {formSummary.guarantors?.length || 0}</div>
                  <div><span className="font-medium">Status:</span> {formSummary.guarantors?.length > 0 ? 'Added' : 'None'}</div>
                </div>
              </div>

              {/* Occupants Summary Card */}
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <Home className="w-5 h-5 text-indigo-600" />
                  <h6 className="font-semibold text-indigo-900">Occupants</h6>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Count:</span> {formSummary.occupants?.length || 0}</div>
                  <div><span className="font-medium">Status:</span> {formSummary.occupants?.length > 0 ? 'Added' : 'None'}</div>
                </div>
              </div>

              {/* Documents Summary Card */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck className="w-5 h-5 text-gray-600" />
                  <h6 className="font-semibold text-gray-900">Documents</h6>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Uploaded:</span> {documentCount}</div>
                  <div><span className="font-medium">Status:</span> {documentCount > 0 ? 'In Progress' : 'Pending'}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Main Application Tab */}
          <TabsContent value="main" className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h5 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Main Application Details
              </h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <h6 className="font-medium text-blue-800 border-b border-blue-300 pb-1">Property Information</h6>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Building Address:</span> {formSummary.buildingAddress}</div>
                    <div><span className="font-medium">Apartment Number:</span> {formSummary.apartmentNumber}</div>
                    <div><span className="font-medium">Apartment Type:</span> {formSummary.apartmentType}</div>
                    <div><span className="font-medium">Monthly Rent:</span> ${formSummary.monthlyRent}/month</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h6 className="font-medium text-blue-800 border-b border-blue-300 pb-1">Move-in Details</h6>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Move-in Date:</span> {formSummary.moveInDate !== 'Not specified' ? formatDate(formSummary.moveInDate) : 'Not specified'}</div>
                    <div><span className="font-medium">How Did You Hear:</span> {formSummary.howDidYouHear || 'Not specified'}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h6 className="font-medium text-blue-800 border-b border-blue-300 pb-1">Primary Applicant</h6>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {formSummary.applicantName}</div>
                    <div><span className="font-medium">Email:</span> {formSummary.applicantEmail}</div>
                    <div><span className="font-medium">Phone:</span> {formSummary.applicant_phone || 'Not specified'}</div>
                  </div>
                </div>
              </div>

              {/* Additional Application Fields */}
              {Object.entries(formSummary).filter(([key, value]) => 
                key.startsWith('application') && 
                !['buildingAddress', 'apartmentNumber', 'apartmentType', 'monthlyRent', 'moveInDate', 'howDidYouHear'].includes(key) &&
                value !== 'Not specified' && value !== null && value !== undefined
              ).length > 0 && (
                <div className="mt-6 pt-4 border-t border-blue-300">
                  <h6 className="font-medium text-blue-800 mb-3">Additional Application Information</h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(formSummary).filter(([key, value]) => 
                      key.startsWith('application') && 
                      !['buildingAddress', 'apartmentNumber', 'apartmentType', 'monthlyRent', 'moveInDate', 'howDidYouHear'].includes(key) &&
                      value !== 'Not specified' && value !== null && value !== undefined
                    ).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium capitalize">{key.replace('application', '').replace(/_/g, ' ')}:</span>
                        <span className="ml-2 text-gray-700">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Co-Applicants Tab */}
          <TabsContent value="coapplicants" className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h5 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Co-Applicants Information
              </h5>
              
              {formSummary.coApplicants && Array.isArray(formSummary.coApplicants) && formSummary.coApplicants.length > 0 ? (
                <div className="space-y-4">
                  {formSummary.coApplicants.map((coApp: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-purple-300 border-l-4 border-l-purple-500">
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="font-semibold text-purple-900">Co-Applicant {index + 1}</h6>
                        <Badge variant="outline" className="border-purple-300 text-purple-700">Co-Applicant</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(coApp).filter(([key, value]) => 
                          value !== null && value !== undefined && value !== '' && 
                          !['documents', 'bankRecords'].includes(key)
                        ).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium capitalize text-purple-700">{key.replace(/_/g, ' ')}:</span>
                            <span className="ml-2 text-gray-700">{String(value) || 'Not specified'}</span>
                          </div>
                        ))}
                      </div>

                      {/* Bank Records for this Co-Applicant */}
                      {coApp.bankRecords && Array.isArray(coApp.bankRecords) && coApp.bankRecords.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-purple-200">
                          <h6 className="font-medium text-purple-800 mb-2">Bank Records ({coApp.bankRecords.length} accounts)</h6>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {coApp.bankRecords.map((bank: any, bankIndex: number) => (
                              <div key={bankIndex} className="bg-purple-50 rounded p-3 border border-purple-200">
                                <div className="font-medium text-purple-800 mb-2 text-sm">Bank Account {bankIndex + 1}</div>
                                <div className="space-y-1 text-xs">
                                  {Object.entries(bank).map(([bankKey, bankValue]) => (
                                    <div key={bankKey} className="flex justify-between">
                                      <span className="font-medium capitalize">{bankKey.replace(/_/g, ' ')}:</span>
                                      <span className="text-gray-700">{String(bankValue)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                  <h6 className="text-lg font-medium text-purple-700 mb-2">No Co-Applicants</h6>
                  <p className="text-purple-600">This application doesn't have any co-applicants yet.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Guarantors Tab */}
          <TabsContent value="guarantors" className="space-y-4">
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h5 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Guarantors Information
              </h5>
              
              {formSummary.guarantors && Array.isArray(formSummary.guarantors) && formSummary.guarantors.length > 0 ? (
                <div className="space-y-4">
                  {formSummary.guarantors.map((guar: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-orange-300 border-l-4 border-l-orange-500">
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="font-semibold text-orange-900">Guarantor {index + 1}</h6>
                        <Badge variant="outline" className="border-orange-300 text-orange-700">Guarantor</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(guar).filter(([key, value]) => 
                          value !== null && value !== undefined && value !== '' && 
                          !['documents', 'bankRecords'].includes(key)
                        ).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium capitalize text-orange-700">{key.replace(/_/g, ' ')}:</span>
                            <span className="ml-2 text-gray-700">{String(value) || 'Not specified'}</span>
                          </div>
                        ))}
                      </div>

                      {/* Bank Records for this Guarantor */}
                      {guar.bankRecords && Array.isArray(guar.bankRecords) && guar.bankRecords.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-orange-200">
                          <h6 className="font-medium text-orange-800 mb-2">Bank Records ({guar.bankRecords.length} accounts)</h6>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {guar.bankRecords.map((bank: any, bankIndex: number) => (
                              <div key={bankIndex} className="bg-orange-50 rounded p-3 border border-orange-200">
                                <div className="font-medium text-orange-800 mb-2 text-sm">Bank Account {bankIndex + 1}</div>
                                <div className="space-y-1 text-xs">
                                  {Object.entries(bank).map(([bankKey, bankValue]) => (
                                    <div key={bankKey} className="flex justify-between">
                                      <span className="font-medium capitalize">{bankKey.replace(/_/g, ' ')}:</span>
                                      <span className="text-gray-700">{String(bankValue)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                  <h6 className="text-lg font-medium text-orange-700 mb-2">No Guarantors</h6>
                  <p className="text-orange-600">This application doesn't have any guarantors yet.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Occupants Tab */}
          <TabsContent value="occupants" className="space-y-4">
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <h5 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                <Home className="w-5 h-5 mr-2" />
                Occupants Information
              </h5>
              
              {(formSummary.occupants && Array.isArray(formSummary.occupants) && formSummary.occupants.length > 0) || 
               (formSummary.occupantsList && Array.isArray(formSummary.occupantsList) && formSummary.occupantsList.length > 0) ? (
                <div className="space-y-4">
                  {(formSummary.occupants || formSummary.occupantsList || []).map((occupant: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-indigo-300 border-l-4 border-l-indigo-500">
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="font-semibold text-indigo-900">Occupant {index + 1}</h6>
                        <Badge variant="outline" className="border-indigo-300 text-indigo-700">Occupant</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(occupant).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium capitalize text-indigo-700">{key.replace(/_/g, ' ')}:</span>
                            <span className="ml-2 text-gray-700">{String(value) || 'Not specified'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Home className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                  <h6 className="text-lg font-medium text-indigo-700 mb-2">No Occupants</h6>
                  <p className="text-indigo-600">This application doesn't have any occupants yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
        {/* Page Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-blue-300/50 p-8" style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb, #1d4ed8)' }}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 20px 20px, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}></div>
            </div>
            
            {/* Content */}
            <div className="relative flex items-center justify-between">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-white tracking-tight">
                  My Applications
                </h1>
                <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
                  Manage and track all your rental applications in one place
                </p>
              </div>
              
              {/* Applications Icon */}
              <div className="hidden lg:block">
                <FileText className="w-48 h-32 text-white/20" />
              </div>
            </div>
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
