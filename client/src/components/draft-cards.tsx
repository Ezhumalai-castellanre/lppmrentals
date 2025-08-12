import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { FileText, Clock, Edit, Trash2, Building, User, Calendar, DollarSign, CheckCircle, File, Eye } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { dynamoDBService } from "@/lib/dynamodb-service";
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
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
    
    // Extract all available fields dynamically
    const allFields: any = {};
    
    // Recursively extract all nested fields
    const extractFields = (obj: any, prefix = '') => {
      if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          const fieldKey = prefix ? `${prefix}_${key}` : key;
          
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            extractFields(value, fieldKey);
          } else if (value !== null && value !== undefined && value !== '') {
            // Special handling for fields that might be stringified objects/arrays
            if (typeof value === 'string' && (value.includes('[object Object]') || value.includes('[') && value.includes(']'))) {
              try {
                const parsed = JSON.parse(value);
                allFields[fieldKey] = parsed;
                console.log(`🔍 Parsed ${fieldKey} from string:`, parsed);
              } catch (e) {
                allFields[fieldKey] = value;
                console.log(`⚠️ Failed to parse ${fieldKey}:`, value);
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
      console.log('🏦 Found bankRecords in applicant:', allFields.applicantBankRecords);
    }
    if (formData.coApplicant && formData.coApplicant.bankRecords) {
      allFields.coApplicantBankRecords = formData.coApplicant.bankRecords;
      console.log('🏦 Found bankRecords in coApplicant:', allFields.coApplicantBankRecords);
    }
    if (formData.guarantor && formData.guarantor.bankRecords) {
      allFields.guarantorBankRecords = formData.guarantor.bankRecords;
      console.log('🏦 Found bankRecords in guarantor:', allFields.guarantorBankRecords);
    }
    
    // Debug logging for specific fields
    if (allFields.bankRecords) {
      console.log('🏦 bankRecords field:', allFields.bankRecords);
      console.log('🏦 bankRecords type:', typeof allFields.bankRecords);
      console.log('🏦 bankRecords isArray:', Array.isArray(allFields.bankRecords));
    }
    
    return {
      // Core application fields
      buildingAddress: formData.buildingAddress ?? formData.application?.buildingAddress ?? 'Not specified',
      apartmentNumber: formData.apartmentNumber ?? formData.application?.apartmentNumber ?? 'Not specified',
      apartmentType: formData.apartmentType ?? formData.application?.apartmentType ?? 'Not specified',
      monthlyRent: formData.monthlyRent ?? formData.application?.monthlyRent ?? 'Not specified',
      moveInDate: formData.moveInDate ?? formData.application?.moveInDate ?? 'Not specified',
      applicantName: formData.applicant?.name ?? formData.applicantName ?? 'Not specified',
      applicantEmail: formData.applicant?.email ?? formData.applicantEmail ?? 'Not specified',
      
      // All other fields
      ...allFields
    };
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

  // Log the full draft object to see what's available
  console.log('🔍 Full draft object:', draft);
  console.log('🔍 Draft form_data (JSON):', JSON.stringify(normalizedFormData, null, 2));
  console.log('🔍 Draft form_data type:', typeof draft.form_data);
  
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
            <CardTitle className="text-lg font-semibold text-gray-900">
              {draft.status === 'submitted' ? 'Submitted Application' : 'Draft Application'}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {draft.status === 'submitted' ? 'Application has been submitted successfully' : 'Application in progress'}
            </p>
          </div>
          {draft.status === 'submitted' && (
            <CheckCircle className="w-6 h-6 text-green-500" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
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
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <Building className="w-4 h-4 mr-2 text-blue-600" />
                Application Details
              </h5>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium">Address:</span>
            <span className="text-gray-700">{formSummary.buildingAddress}</span>
          </div>
          <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium">Apt:</span>
                    <span className="text-gray-700">{formSummary.apartmentNumber}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium">Type:</span>
                    <span className="text-gray-700">{formSummary.apartmentType}</span>
          </div>
          <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium">Rent:</span>
            <span className="text-gray-700">
              {typeof formSummary.monthlyRent === 'number' 
                ? `$${formSummary.monthlyRent}/month` 
                : formSummary.monthlyRent}
            </span>
          </div>
                  <div className="flex items-center space-x-2 col-span-2">
                    <span className="text-gray-600 font-medium">Move-in:</span>
            <span className="text-gray-700">
              {formSummary.moveInDate !== 'Not specified' 
                ? formatDate(formSummary.moveInDate) 
                : 'Not specified'}
            </span>
          </div>
                  <div className="flex items-center space-x-2 col-span-2">
                    <span className="text-gray-600 font-medium">How did you hear:</span>
                    <span className="text-gray-700">{formSummary.howDidYouHear || 'Not specified'}</span>
                  </div>
                </div>
                
                {/* Additional application fields */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                  {Object.entries(formSummary).filter(([key, value]) => 
                    key.startsWith('application') && 
                    !['buildingAddress', 'apartmentNumber', 'apartmentType', 'monthlyRent', 'moveInDate', 'howDidYouHear'].includes(key) &&
                    value !== 'Not specified' && value !== null && value !== undefined
                  ).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <span className="text-gray-600 font-medium capitalize">{key.replace('application', '').replace(/_/g, ' ')}:</span>
                      <span className="text-gray-700">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Applicant Section */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2 text-green-600" />
                Primary Applicant
              </h5>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium">Name:</span>
                    <span className="text-gray-700">{formSummary.applicantName}</span>
          </div>
          <div className="flex items-center space-x-2">
                    <span className="text-gray-600 font-medium">Email:</span>
                    <span className="text-gray-700">{formSummary.applicantEmail}</span>
                  </div>
                </div>
                
                {/* Additional applicant fields in grid */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                  {Object.entries(formSummary).filter(([key, value]) => 
                    key.startsWith('applicant') && 
                    !['applicantName', 'applicantEmail'].includes(key) &&
                    value !== 'Not specified' && value !== null && value !== undefined
                  ).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <span className="text-gray-600 font-medium capitalize">{key.replace('applicant', '').replace(/_/g, ' ')}:</span>
                      <span className="text-gray-700">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Co-Applicant Section */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2 text-blue-600" />
                Co-Applicant
              </h5>
              <div className="space-y-3 text-sm">
                {(() => {
                  const coApplicantFields = Object.entries(formSummary).filter(([key, value]) => 
                    key.startsWith('coApplicant') &&
                    value !== 'Not specified' && value !== null && value !== undefined
                  );
                  
                  if (coApplicantFields.length === 0) {
                    return <span className="text-gray-500 italic">No co-applicant information</span>;
                  }
                  
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      {coApplicantFields.map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <span className="text-gray-600 font-medium capitalize">{key.replace('coApplicant', '').replace(/_/g, ' ')}:</span>
                          <span className="text-gray-700">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Guarantor Section */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2 text-orange-600" />
                Guarantor
              </h5>
              <div className="space-y-3 text-sm">
                {(() => {
                  const guarantorFields = Object.entries(formSummary).filter(([key, value]) => 
                    key.startsWith('guarantor') &&
                    value !== 'Not specified' && value !== null && value !== undefined
                  );
                  
                  if (guarantorFields.length === 0) {
                    return <span className="text-gray-500 italic">No guarantor information</span>;
                  }
                  
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      {guarantorFields.map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <span className="text-gray-600 font-medium capitalize">{key.replace('guarantor', '').replace(/_/g, ' ')}:</span>
                          <span className="text-gray-700">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Occupants Section - Fixed to show proper list */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2 text-indigo-600" />
                Occupants
              </h5>
              <div className="space-y-3 text-sm">
                {(() => {
                  // Handle occupants data properly
                  const occupantsData = formSummary.occupants || formSummary.occupantsList || [];
                  if (Array.isArray(occupantsData) && occupantsData.length > 0) {
                    return occupantsData.map((occupant: any, index: number) => (
                      <div key={index} className="border-l-2 border-indigo-200 pl-3 bg-white rounded-r p-2">
                        <div className="font-medium text-gray-700 mb-2">Occupant {index + 1}</div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(occupant).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <span className="text-gray-600 font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-gray-700">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  } else if (typeof occupantsData === 'object' && occupantsData !== null) {
                    // Handle single occupant object
                    return (
                      <div className="border-l-2 border-indigo-200 pl-3 bg-white rounded-r p-2">
                        <div className="font-medium text-gray-700 mb-2">Occupant</div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(occupantsData).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2">
                              <span className="text-gray-600 font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-gray-700">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } else {
                    return <span className="text-gray-500 italic">No occupants listed</span>;
                  }
                })()}
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-purple-600" />
                Additional Information
              </h5>
              <div className="space-y-3 text-sm">
                
                {/* Special handling for bank records */}
                {formSummary.applicantBankRecords && Array.isArray(formSummary.applicantBankRecords) && (
                  <div className="space-y-2">
                    <div className="font-medium text-gray-700 capitalize border-b border-gray-200 pb-1">
                      Applicant Bank Records ({formSummary.applicantBankRecords.length} accounts):
                    </div>
                    <div className="grid grid-cols-1 gap-2 pl-4">
                      {formSummary.applicantBankRecords.map((bank: any, index: number) => (
                        <div key={index} className="bg-white rounded p-2 border border-gray-200">
                          <div className="font-medium text-gray-700 mb-2 text-xs">Bank Account {index + 1}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
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
                
                {/* Co-Applicant Bank Records */}
                {formSummary.coApplicantBankRecords && Array.isArray(formSummary.coApplicantBankRecords) && (
                  <div className="space-y-2">
                    <div className="font-medium text-gray-700 capitalize border-b border-gray-200 pb-1">
                      Co-Applicant Bank Records ({formSummary.coApplicantBankRecords.length} accounts):
                    </div>
                    <div className="grid grid-cols-1 gap-2 pl-4">
                      {formSummary.coApplicantBankRecords.map((bank: any, index: number) => (
                        <div key={index} className="bg-white rounded p-2 border border-gray-200">
                          <div className="font-medium text-gray-700 mb-2 text-xs">Bank Account {index + 1}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
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
                
                {/* Guarantor Bank Records */}
                {formSummary.guarantorBankRecords && Array.isArray(formSummary.guarantorBankRecords) && (
                  <div className="space-y-2">
                    <div className="font-medium text-gray-700 capitalize border-b border-gray-200 pb-1">
                      Guarantor Bank Records ({formSummary.guarantorBankRecords.length} accounts):
                    </div>
                    <div className="grid grid-cols-1 gap-2 pl-4">
                      {formSummary.guarantorBankRecords.map((bank: any, index: number) => (
                        <div key={index} className="bg-white rounded p-2 border border-gray-200">
                          <div className="font-medium text-gray-700 mb-2 text-xs">Bank Account {index + 1}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
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
                
                {/* Webhook Summary Section */}
                {formSummary.webhookSummary && (
                  <div className="space-y-2">
                    <div className="font-medium text-gray-700 capitalize border-b border-gray-200 pb-1">
                      Document Processing Summary:
                    </div>
                    <div className="grid grid-cols-2 gap-3 pl-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 font-medium">Total:</span>
                        <span className="text-gray-700">{formSummary.webhookSummary.totalResponses || 0}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 font-medium">Applicant:</span>
                        <span className="text-gray-700">{formSummary.webhookSummary.responsesByPerson?.applicant || 0}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 font-medium">Co-Applicant:</span>
                        <span className="text-gray-700">{formSummary.webhookSummary.responsesByPerson?.coApplicant || 0}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 font-medium">Guarantor:</span>
                        <span className="text-gray-700">{formSummary.webhookSummary.responsesByPerson?.guarantor || 0}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 font-medium">Occupants:</span>
                        <span className="text-gray-700">{formSummary.webhookSummary.responsesByPerson?.occupants || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Other fields */}
                {Object.entries(formSummary).filter(([key, value]) => 
                  !['buildingAddress', 'apartmentNumber', 'apartmentType', 'monthlyRent', 'moveInDate', 'howDidYouHear', 'applicantName', 'applicantEmail', 'occupants', 'occupantsList', 'bankRecords', 'applicantBankRecords', 'coApplicantBankRecords', 'guarantorBankRecords', 'webhookSummary'].includes(key) &&
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
                        <div className="font-medium text-gray-700 capitalize border-b border-gray-200 pb-1">
                          {key.replace(/_/g, ' ')}:
                        </div>
                        <div className="grid grid-cols-1 gap-2 pl-4">
                          {value.map((item: any, index: number) => (
                            <div key={index} className="bg-white rounded p-2 border border-gray-200">
                              {typeof item === 'object' && item !== null ? (
                                <div className="grid grid-cols-2 gap-2 text-xs">
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
                            <div className="font-medium text-gray-700 capitalize border-b border-gray-200 pb-1">
                              {key.replace(/_/g, ' ')}:
                            </div>
                            <div className="grid grid-cols-1 gap-2 pl-4">
                              {parsedValue.map((item: any, index: number) => (
                                <div key={index} className="bg-white rounded p-2 border border-gray-200">
                                  {typeof item === 'object' && item !== null ? (
                                    <div className="grid grid-cols-1 gap-2 text-xs">
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
                        <div className="font-medium text-gray-700 capitalize border-b border-gray-200 pb-1">
                          {key.replace(/_/g, ' ')}:
                        </div>
                        <div className="grid grid-cols-2 gap-2 pl-4">
                          {Object.entries(value).map(([itemKey, itemValue]) => (
                            <div key={itemKey} className="flex items-center space-x-2">
                              <span className="text-gray-600 font-medium capitalize">{itemKey.replace(/_/g, ' ')}:</span>
                              <span className="text-gray-700">{String(itemValue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle regular string/number fields
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <span className="text-gray-600 font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-gray-700">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Preview All Button - Replaces Uploaded Documents section */}
        {draft.status === 'submitted' && (
          <div className="pt-4 border-t border-gray-100">
            <div className="text-center">
              <Button 
                onClick={() => onEdit(draft)}
                variant="outline"
                size="lg"
                className="px-8 py-3"
              >
                <Eye className="w-5 h-5 mr-2" />
                Preview All Application Data
              </Button>
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
            <Button
              onClick={() => onEdit(draft)}
            variant="outline" 
            size="sm"
              className="flex-1"
          >
              <FileText className="w-4 h-4 mr-2" />
              View Full Application
          </Button>
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
      <div className="min-h-screen bg-gray-50 py-8">
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
      <div className="min-h-screen bg-gray-50 py-8">
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
                  <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Applications
          </h1>
          <p className="text-gray-600 mb-4">
            Continue working on your saved applications
          </p>
        </div>
        </div>

        {/* Drafts Grid */}
        {drafts && drafts.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
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
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Draft Applications</h3>
              <p className="text-gray-600 mb-4">
                You don't have any saved draft applications yet.
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
