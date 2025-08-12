import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from './ui/button';
import { FileText, Clock, Edit, Trash2, Building, User, Calendar, DollarSign } from "lucide-react";
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

  const getFormDataSummary = (formData: any) => {
    // Log the full formData to see what's available
    console.log('🔍 Full formData:', formData);
    console.log('🔍 formData type:', typeof formData);
    console.log('🔍 formData keys:', formData ? Object.keys(formData) : 'No formData');
    
    if (!formData) return {} as any;
    
    // Calculate annual income based on pay frequency
    const calculateAnnualIncome = (income: any, otherIncome: any, payFrequency: string = 'monthly') => {
      if (!income || income === 'Not specified') return 'Not specified';
      
      const numIncome = parseFloat(income) || 0;
      const numOtherIncome = parseFloat(otherIncome) || 0;
      const totalIncome = numIncome + numOtherIncome;
      
      if (totalIncome === 0) return 'Not specified';
      
      // If the income values seem unusually high (over $100,000), they might already be annual
      // This is a heuristic to handle cases where frequency wasn't specified
      const isLikelyAnnual = totalIncome > 100000;
      
      let annualIncome: number;
      if (isLikelyAnnual && payFrequency === 'monthly') {
        // If income seems high and frequency is monthly, assume it's already annual
        annualIncome = totalIncome;
        console.log('💰 High income detected, assuming already annual:', totalIncome);
      } else {
        switch (payFrequency.toLowerCase()) {
          case 'weekly':
            annualIncome = totalIncome * 52;
            break;
          case 'bi-weekly':
          case 'biweekly':
          case 'every 2 weeks':
            annualIncome = totalIncome * 26;
            break;
          case 'monthly':
          default:
            annualIncome = totalIncome * 12;
            break;
          case 'quarterly':
            annualIncome = totalIncome * 4;
            break;
          case 'yearly':
            annualIncome = totalIncome * 1;
            break;
        }
      }
      
      return Math.round(annualIncome);
    };
    
    // Get income data from applicant section
    const applicantIncome = formData.applicant?.income ?? 'Not specified';
    const applicantOtherIncome = formData.applicant?.otherIncome ?? 'Not specified';
    
    // Try to get pay frequency from various possible field names
    const payFrequency = formData.applicant?.incomeFrequency ?? 
                        formData.applicant?.payFrequency ?? 
                        'monthly'; // Default to monthly if not specified
    
    // Log the income calculation for debugging
    console.log('💰 Income calculation:', {
      income: applicantIncome,
      otherIncome: applicantOtherIncome,
      payFrequency: payFrequency,
      calculatedAnnual: calculateAnnualIncome(applicantIncome, applicantOtherIncome, payFrequency)
    });
    
    return {
      // Prefer top-level fields, fallback to application.*
      buildingAddress: formData.buildingAddress ?? formData.application?.buildingAddress ?? 'Not specified',
      apartmentNumber: formData.apartmentNumber ?? formData.application?.apartmentNumber ?? 'Not specified',
      apartmentType: formData.apartmentType ?? formData.application?.apartmentType ?? 'Not specified',
      monthlyRent: formData.monthlyRent ?? formData.application?.monthlyRent ?? 'Not specified',
      moveInDate: formData.moveInDate ?? formData.application?.moveInDate ?? 'Not specified',
      annualIncome: calculateAnnualIncome(applicantIncome, applicantOtherIncome, payFrequency),
      incomeFrequency: payFrequency, // Add this for display purposes
      applicantName: formData.applicant?.name ?? 'Not specified',
      applicantEmail: formData.applicant?.email ?? 'Not specified'
    };
  };

  // Log the full draft object to see what's available
  console.log('🔍 Full draft object:', draft);
  console.log('🔍 Draft form_data (JSON):', JSON.stringify(normalizedFormData, null, 2));
  console.log('🔍 Draft form_data type:', typeof draft.form_data);
  
  const formSummary = getFormDataSummary(normalizedFormData);
  const progressPercentage = Math.round((draft.current_step / 8) * 100); // Assuming 8 total steps

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              myApplication
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {formSummary.buildingAddress} - Apt {formSummary.apartmentNumber}
            </p>
          </div>
          {getStatusBadge(draft.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">Step {draft.current_step} of 13</p>
        </div>

        {/* Form Data Summary */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{formSummary.buildingAddress}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Apt {formSummary.apartmentNumber}</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {typeof formSummary.monthlyRent === 'number' 
                ? `$${formSummary.monthlyRent}/month` 
                : formSummary.monthlyRent}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {formSummary.moveInDate !== 'Not specified' 
                ? formatDate(formSummary.moveInDate) 
                : 'Not specified'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <div className="flex flex-col">
              <span className="text-gray-700">
                {typeof formSummary.annualIncome === 'number' 
                  ? `$${formSummary.annualIncome.toLocaleString()}/year` 
                  : formSummary.annualIncome}
              </span>
              {typeof formSummary.annualIncome === 'number' && (
                <span className="text-xs text-gray-500">
                  Based on {formSummary.incomeFrequency} income
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {documentCount} documents
            </span>
          </div>
        </div>

        {/* Last Updated */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Last updated: {formatDate(draft.last_updated)}</span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="pt-2 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit(draft)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Continue
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDelete(draft.reference_id)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
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
    
    // Navigate to the application form
    setLocation('/application');
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Draft Applications</h1>
            <p className="text-gray-600">Loading your draft applications...</p>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Draft Applications
            </h1>
            <p className="text-gray-600 mb-4">
              Continue working on your saved applications
            </p>
          </div>
        </div>

        {/* Drafts Grid */}
        {drafts && drafts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
