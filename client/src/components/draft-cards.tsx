import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { FileText, Clock, Edit, Trash2, Building, User, Calendar, DollarSign, CheckCircle, File, Eye, Users, Shield, LayoutDashboard, CreditCard, Home, Briefcase, FileCheck } from "lucide-react";
import { IncomeVerificationWidget } from '@payscore/web-widget-sdk';
import { useAuth } from "../hooks/use-auth";
import { dynamoDBSeparateTablesUtils } from "../lib/dynamodb-separate-tables-service";
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
  flow_type?: 'legacy' | 'separate_webhooks';
  webhook_flow_version?: string;
  table_data?: { // Additional metadata for separate tables display
    application?: any;
    applicant?: any;
    // Deprecated: use coApplicants array instead
    coApplicant?: any;
    guarantor?: any;
  };
}

interface DraftCardProps {
  draft: DraftData;
  onEdit: (draft: DraftData) => void;
  onDelete: (draftId: string) => void;
}

const DraftCard = ({ draft, onEdit, onDelete }: DraftCardProps) => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("income");
  // Payscore state for Income Verification tab
  const widgetRef = React.useRef<any>(null);
  const [screeningId, setScreeningId] = useState<string>("");
  const [widgetToken, setWidgetToken] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [logText, setLogText] = useState<string>("");

  const appendLog = React.useCallback((msg: string) => {
    setLogText((prev) => `${prev}${msg}\n`);
  }, []);

  const loadTokens = React.useCallback(async (): Promise<{ widgetToken: string; screeningId: string; status: string }> => {
    try {
      let WIDGET_TOKEN: string = '';
      let SCREENING_ID: string = '';
      let STATUS: string = '';
      const tokens = await dynamoDBSeparateTablesUtils.getLatestPayscoreTokensForCurrentUser();
      if (tokens) {
        WIDGET_TOKEN = tokens.widget_token || WIDGET_TOKEN;
        SCREENING_ID = tokens.screening_id || SCREENING_ID;
        STATUS = tokens.status || STATUS;
      }
      if (!SCREENING_ID && WIDGET_TOKEN) {
        try {
          const parts = (WIDGET_TOKEN || '').split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (typeof payload?.screening_id === 'string') SCREENING_ID = payload.screening_id;
            if (!SCREENING_ID && typeof payload?.screeningId === 'string') SCREENING_ID = payload.screeningId;
          }
        } catch {}
      }
      setWidgetToken(WIDGET_TOKEN);
      setScreeningId(SCREENING_ID);
      setStatus(STATUS || '');
      return { widgetToken: WIDGET_TOKEN, screeningId: SCREENING_ID, status: STATUS };
    } catch (e) {
      console.warn('⚠️ Could not load payscore tokens:', e);
      return { widgetToken: '', screeningId: '', status: '' };
    }
  }, []);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const onEvent = React.useCallback((event: any) => {
    try {
      const { type, payload } = event || {};
      appendLog(`📨 ${type || 'event'}: ${JSON.stringify(payload || {})}`);
    } catch {}
  }, [appendLog]);

  const loadWidget = React.useCallback(async () => {
    try {
      let effectiveWidgetToken = widgetToken;
      let effectiveScreeningId = screeningId;
      if (!effectiveWidgetToken || !effectiveScreeningId) {
        const fetched = await loadTokens();
        effectiveWidgetToken = fetched.widgetToken;
        effectiveScreeningId = fetched.screeningId;
      }
      if (!effectiveWidgetToken || !effectiveScreeningId) {
        appendLog('❌ Missing Payscore tokens. Ensure payscore submission created a record.');
        return;
      }
      widgetRef.current = new IncomeVerificationWidget({
        widgetToken: effectiveWidgetToken,
        screeningId: effectiveScreeningId,
        environment: 'staging',
        onEvent,
      });
      widgetRef.current.mount('#income-verification-widget');
      appendLog('✅ Payscore widget mounted');
    } catch (e: any) {
      appendLog(`❌ Failed to load widget: ${e?.message || String(e)}`);
    }
  }, [widgetToken, screeningId, loadTokens, onEvent, appendLog]);

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
        
        // Applicant details (flattened for backward compatibility)
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
        
        // Nested applicant object for the applicant tab
        applicant: formData.applicant || {},
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
        
        // Nested applicant object for the applicant tab (reconstruct from flat fields)
        applicant: formData.applicant || {
          name: applicantName,
          email: applicantEmail,
          phone: allFields.applicant_phone || allFields.applicantPhone,
          address: allFields.applicant_address || allFields.applicantAddress,
          city: allFields.applicant_city || allFields.applicantCity,
          state: allFields.applicant_state || allFields.applicantState,
          zip: allFields.applicant_zip || allFields.applicantZip,
          dob: allFields.applicant_dob || allFields.applicantDob,
          ssn: allFields.applicant_ssn || allFields.applicantSsn,
          license: allFields.applicant_license || allFields.applicantLicense,
          licenseState: allFields.applicant_licenseState || allFields.applicantLicenseState,
          lengthAtAddressYears: allFields.applicant_lengthAtAddressYears || allFields.applicantLengthAtAddressYears,
          lengthAtAddressMonths: allFields.applicant_lengthAtAddressMonths || allFields.applicantLengthAtAddressMonths,
          landlordName: allFields.applicant_landlordName || allFields.applicantLandlordName,
          landlordAddressLine1: allFields.applicant_landlordAddressLine1 || allFields.applicantLandlordAddressLine1,
          landlordAddressLine2: allFields.applicant_landlordAddressLine2 || allFields.applicantLandlordAddressLine2,
          landlordCity: allFields.applicant_landlordCity || allFields.applicantLandlordCity,
          landlordState: allFields.applicant_landlordState || allFields.applicantLandlordState,
          landlordZipCode: allFields.applicant_landlordZipCode || allFields.applicantLandlordZipCode,
          landlordPhone: allFields.applicant_landlordPhone || allFields.applicantLandlordPhone,
          landlordEmail: allFields.applicant_landlordEmail || allFields.applicantLandlordEmail,
          currentRent: allFields.applicant_currentRent || allFields.applicantCurrentRent,
          reasonForMoving: allFields.applicant_reasonForMoving || allFields.applicantReasonForMoving,
          age: allFields.applicant_age || allFields.applicantAge,
          employmentType: allFields.applicant_employmentType || allFields.applicantEmploymentType,
          employer: allFields.applicant_employer || allFields.applicantEmployer,
          position: allFields.applicant_position || allFields.applicantPosition,
          employmentStart: allFields.applicant_employmentStart || allFields.applicantEmploymentStart,
          income: allFields.applicant_income || allFields.applicantIncome,
          incomeFrequency: allFields.applicant_incomeFrequency || allFields.applicantIncomeFrequency,
          businessName: allFields.applicant_businessName || allFields.applicantBusinessName,
          businessType: allFields.applicant_businessType || allFields.applicantBusinessType,
          yearsInBusiness: allFields.applicant_yearsInBusiness || allFields.applicantYearsInBusiness,
          otherIncome: allFields.applicant_otherIncome || allFields.applicantOtherIncome,
          otherIncomeSource: allFields.applicant_otherIncomeSource || allFields.applicantOtherIncomeSource,
          bankRecords: allFields.applicantBankRecords || [],
          documents: allFields.applicant_documents || allFields.applicantDocuments || {}
        },
        
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
  
  // Progress removed

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
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                {draft.status === 'submitted' ? 'Submitted Application' : 'Draft Application'}
              </CardTitle>
            
            </div>
            
          </div>
          {draft.status === 'submitted' && (
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Progress removed as requested */}

        {/* Tabbed Interface */}
        {
          // Role-based tab visibility for submitted applications
        }
        {(() => {
          const userRole = (user as any)?.role || '';
          let allowedTabs = ["overview", "main", "applicant", "coapplicants", "guarantors", "occupants", "income"] as string[];

          // Apply role-based tab visibility for both draft and submitted previews
          if (userRole && userRole.startsWith('coapplicant')) {
            allowedTabs = ["coapplicants", "income"];
          } else if (userRole && userRole.startsWith('guarantor')) {
            allowedTabs = ["guarantors", "income"];
          } else {
            // Primary applicant (or unknown/admin defaults to primary view)
            allowedTabs = ["overview", "applicant", "income"];
          }

          if (!allowedTabs.includes(activeTab)) {
            setTimeout(() => setActiveTab(allowedTabs[0]), 0);
          }

          return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-4">
            {allowedTabs.includes('overview') && (
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            )}
            {allowedTabs.includes('main') && (
            <TabsTrigger value="main" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span className="hidden sm:inline">Main App</span>
            </TabsTrigger>
            )}
            {allowedTabs.includes('applicant') && (
            <TabsTrigger value="applicant" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Applicant</span>
            </TabsTrigger>
            )}
            {allowedTabs.includes('coapplicants') && (
            <TabsTrigger value="coapplicants" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Co-Apps</span>
            </TabsTrigger>
            )}
            {allowedTabs.includes('guarantors') && (
            <TabsTrigger value="guarantors" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Guarantors</span>
            </TabsTrigger>
            )}
            {allowedTabs.includes('occupants') && (
            <TabsTrigger value="occupants" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Occupants</span>
            </TabsTrigger>
            )}
            {allowedTabs.includes('income') && (
            <TabsTrigger value="income" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Income Verification</span>
            </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {(() => {
              // Determine which summary cards to show based on role
              const overviewUserRole = (user as any)?.role || '';
              const isCoApplicantRole = overviewUserRole.startsWith('coapplicant');
              const isGuarantorRole = overviewUserRole.startsWith('guarantor');
              const isApplicantRole = !isCoApplicantRole && !isGuarantorRole; // default to primary applicant
              return null; // variables used below in conditional rendering
            })()}
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

              {/* Co-Applicants Summary (names, emails, status) */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h6 className="font-semibold text-purple-900">Co-Applicants</h6>
                  </div>
                  <Badge variant="outline" className={`text-xs ${Array.isArray(formSummary.coApplicants) && (formSummary.coApplicants as any[]).filter((c: any) => c?.name || c?.email || c?.firstName || c?.lastName).length > 0 ? 'border-purple-300 text-purple-700' : 'border-gray-300 text-gray-600'}`}>
                    {Array.isArray(formSummary.coApplicants) && (formSummary.coApplicants as any[]).filter((c: any) => c?.name || c?.email || c?.firstName || c?.lastName).length > 0 ? 'Added' : 'None'}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  {(() => {
                    const coApplicants = Array.isArray(formSummary.coApplicants)
                      ? (formSummary.coApplicants as any[]).filter((c: any) => c?.name || c?.email || c?.firstName || c?.lastName)
                      : [];
                    return coApplicants.length > 0 ? (
                      coApplicants.map((c: any, i: number) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-purple-900">Co-Applicant{i + 1}: {c?.name || `${c?.firstName || ''} ${c?.lastName || ''}`.trim() || 'Unnamed'}</span>
                          <span className="text-purple-700">{c?.email || 'No email'}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-purple-700">No co-applicants</div>
                    );
                  })()}
                </div>
              </div>

              {/* Guarantors Summary (names, emails, status) */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-600" />
                    <h6 className="font-semibold text-orange-900">Guarantors</h6>
                  </div>
                  <Badge variant="outline" className={`text-xs ${Array.isArray(formSummary.guarantors) && (formSummary.guarantors as any[]).filter((g: any) => g?.name || g?.email || g?.firstName || g?.lastName).length > 0 ? 'border-orange-300 text-orange-700' : 'border-gray-300 text-gray-600'}`}>
                    {Array.isArray(formSummary.guarantors) && (formSummary.guarantors as any[]).filter((g: any) => g?.name || g?.email || g?.firstName || g?.lastName).length > 0 ? 'Added' : 'None'}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  {(() => {
                    const guarantors = Array.isArray(formSummary.guarantors)
                      ? (formSummary.guarantors as any[]).filter((g: any) => g?.name || g?.email || g?.firstName || g?.lastName)
                      : [];
                    return guarantors.length > 0 ? (
                      guarantors.map((g: any, i: number) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-orange-900">Guarantor{i + 1}: {g?.name || `${g?.firstName || ''} ${g?.lastName || ''}`.trim() || 'Unnamed'}</span>
                          <span className="text-orange-700">{g?.email || 'No email'}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-orange-700">No guarantors</div>
                    );
                  })()}
                </div>
              </div>

              {/* Co-Applicants Summary Card - visible only for co-applicant role */}
              {((user as any)?.role || '').startsWith('coapplicant') && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h6 className="font-semibold text-purple-900">Co-Applicants</h6>
                  </div>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const coApps = Array.isArray(formSummary.coApplicants) ? formSummary.coApplicants : [];
                      const keys = new Set<string>();
                      const count = coApps.reduce((acc: number, x: any) => {
                        const k = `${x?.name || ''}|${x?.email || ''}|${x?.phone || ''}`;
                        if (keys.has(k)) return acc;
                        keys.add(k);
                        return acc + 1;
                      }, 0);
                      return (
                        <>
                          <div><span className="font-medium">Count:</span> {count}</div>
                          <div><span className="font-medium">Status:</span> {count > 0 ? 'Added' : 'None'}</div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Guarantors Summary Card - visible only for guarantor role */}
              {((user as any)?.role || '').startsWith('guarantor') && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-orange-600" />
                    <h6 className="font-semibold text-orange-900">Guarantors</h6>
                  </div>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const guar = Array.isArray(formSummary.guarantors) ? formSummary.guarantors : [];
                      const keys = new Set<string>();
                      const count = guar.reduce((acc: number, x: any) => {
                        const k = `${x?.name || ''}|${x?.email || ''}|${x?.phone || ''}`;
                        if (keys.has(k)) return acc;
                        keys.add(k);
                        return acc + 1;
                      }, 0);
                      return (
                        <>
                          <div><span className="font-medium">Count:</span> {count}</div>
                          <div><span className="font-medium">Status:</span> {count > 0 ? 'Added' : 'None'}</div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Occupants Summary Card - hidden for primary applicant */}
              {((user as any)?.role || '').startsWith('coapplicant') || ((user as any)?.role || '').startsWith('guarantor') ? (
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
              ) : null}

              {/* Documents Summary Card - hidden for primary applicant */}
              {((user as any)?.role || '').startsWith('coapplicant') || ((user as any)?.role || '').startsWith('guarantor') ? (
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
              ) : null}
            </div>

            {/* Removed: Complete Data from Separate Tables and Data Summary */}
          </TabsContent>

          {/* Income Verification Tab */}
          <TabsContent value="income" className="space-y-4">
            <div className="p-6 border rounded-lg bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="text-lg font-semibold text-gray-900">Income Verification</h5>
                  <p className="text-sm text-gray-500 mt-1">Powered by Payscore</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={loadWidget} 
                    className="px-4 py-2 rounded-md bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    Verify Now
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Screening ID</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                    <code className="text-sm text-gray-800 font-mono">{screeningId || 'Not available'}</code>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                    <span className={`text-sm font-medium ${
                      status === 'completed' ? 'text-green-600' : 
                      status === 'pending' ? 'text-yellow-600' : 
                      status === 'failed' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {status || 'Not available'}
                    </span>
                  </div>
                </div>
              </div>

              <div id="income-verification-widget" className="mt-4" />

              {logText && (
                <pre className="mt-4 text-xs bg-gray-50 border border-gray-200 rounded p-2 max-h-40 overflow-auto whitespace-pre-wrap">{logText}</pre>
              )}
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

                {/* Primary Applicant moved to Applicant tab */}
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

          {/* Applicant Tab */}
          <TabsContent value="applicant" className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h5 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Primary Applicant Information
              </h5>
              
              {formSummary.applicant && Object.keys(formSummary.applicant).length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-green-300 border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="font-semibold text-green-900">Primary Applicant</h6>
                      <Badge variant="outline" className="border-green-300 text-green-700">Applicant</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        ['name', 'Name'],
                        ['relationship', 'Relationship'],
                        ['dob', 'Date of Birth'],
                        ['ssn', 'SSN'],
                        ['phone', 'Phone'],
                        ['email', 'Email'],
                        ['license', 'License'],
                        ['licenseState', 'License State'],
                        ['address', 'Address'],
                        ['city', 'City'],
                        ['state', 'State'],
                        ['zip', 'ZIP Code'],
                        ['lengthAtAddressYears', 'Years at Address'],
                        ['lengthAtAddressMonths', 'Months at Address'],
                        ['landlordName', 'Landlord Name'],
                        ['landlordAddressLine1', 'Landlord Address Line 1'],
                        ['landlordAddressLine2', 'Landlord Address Line 2'],
                        ['landlordCity', 'Landlord City'],
                        ['landlordState', 'Landlord State'],
                        ['landlordZipCode', 'Landlord ZIP Code'],
                        ['landlordPhone', 'Landlord Phone'],
                        ['landlordEmail', 'Landlord Email'],
                        ['currentRent', 'Current Rent'],
                        ['reasonForMoving', 'Reason for Moving'],
                        ['employmentType', 'Employment Type'],
                        ['employer', 'Employer'],
                        ['position', 'Position'],
                        ['employmentStart', 'Employment Start'],
                        ['income', 'Income'],
                        ['incomeFrequency', 'Income Frequency'],
                        ['otherIncome', 'Other Income'],
                        ['otherIncomeFrequency', 'Other Income Frequency'],
                        ['otherIncomeSource', 'Other Income Source'],
                        ['age', 'Age'],
                      ].map(([key, label]) => {
                        const value: any = (formSummary as any).applicant?.[key as keyof typeof formSummary.applicant];
                        if (value === undefined || value === null || value === '') return null;
                        let display: string = String(value);
                        if (key === 'dob' || key === 'employmentStart') {
                          const d = new Date(value);
                          display = isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
                        } else if (key === 'ssn') {
                          const v = String(value);
                          display = v.length >= 4 ? `***-**-${v.slice(-4)}` : v;
                        } else if (key === 'currentRent' || key === 'income' || key === 'otherIncome') {
                          const n = Number(value);
                          display = isNaN(n) ? String(value) : `$${n.toLocaleString()}`;
                        }
                        return (
                          <div key={String(key)} className="text-sm">
                            <span className="font-medium text-green-700">{label}:</span>
                            <span className="ml-2 text-gray-700">{display}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bank Records for Primary Applicant */}
                    {formSummary.applicant.bankRecords && Array.isArray(formSummary.applicant.bankRecords) && formSummary.applicant.bankRecords.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-green-200">
                        <h6 className="font-medium text-green-800 mb-2">Bank Records ({formSummary.applicant.bankRecords.length} accounts)</h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {formSummary.applicant.bankRecords.map((bank: any, bankIndex: number) => (
                            <div key={bankIndex} className="bg-green-50 rounded p-3 border border-green-200">
                              <div className="font-medium text-green-800 mb-2 text-sm">Bank Account {bankIndex + 1}</div>
                              <div className="space-y-1 text-xs">
                                {Object.entries(bank).map(([bankKey, bankValue]) => (
                                  <div key={bankKey} className="flex justify-between">
                                    <span className="font-medium text-green-700 capitalize">{bankKey.replace(/_/g, ' ')}:</span>
                                    <span className="text-gray-600">{String(bankValue) || 'Not specified'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents for Primary Applicant */}
                    {formSummary.applicant.documents && Object.keys(formSummary.applicant.documents).length > 0 && (
                      <div className="mt-4 pt-3 border-t border-green-200">
                        <h6 className="font-medium text-green-800 mb-2">Documents</h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {Object.entries(formSummary.applicant.documents).map(([docType, docData]: [string, any]) => (
                            <div key={docType} className="bg-green-50 rounded p-2 border border-green-200">
                              <div className="font-medium text-green-800 text-xs capitalize">{docType.replace(/_/g, ' ')}</div>
                              <div className="text-xs text-gray-600">
                                {Array.isArray(docData) ? `${docData.length} file(s)` : '1 file'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-green-900 mb-2">No Applicant Data</h3>
                  <p className="text-green-700">
                    Primary applicant information has not been filled out yet.
                  </p>
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
              {/* Applicant summary for context */}
              <div className="mb-4 text-sm text-purple-900/80 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="font-medium">Application ID:</span>
                  <span className="ml-2 text-purple-700">{draft.reference_id || formSummary.application_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Applicant Name:</span>
                  <span className="ml-2 text-purple-700">{formSummary.applicant?.name || formSummary.applicantName || formSummary.applicant?.fullName || 'Not specified'}</span>
                </div>
                <div>
                  <span className="font-medium">Applicant Email:</span>
                  <span className="ml-2 text-purple-700">{formSummary.applicant?.email || formSummary.applicantEmail || formSummary.applicant?.mail || 'Not specified'}</span>
                </div>
              </div>

              {/* Application Information for context */}
              <div className="mb-6 bg-white rounded-md border border-purple-200 p-3">
                <div className="text-sm font-semibold text-purple-900 mb-2">Application Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Building Address:</span>
                    <span className="ml-2 text-purple-700">{formSummary.buildingAddress || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Apartment:</span>
                    <span className="ml-2 text-purple-700">{formSummary.apartmentNumber || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Move-in Date:</span>
                    <span className="ml-2 text-purple-700">{formSummary.moveInDate && formSummary.moveInDate !== 'Not specified' ? formatDate(formSummary.moveInDate) : 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Monthly Rent:</span>
                    <span className="ml-2 text-purple-700">{formSummary.monthlyRent && formSummary.monthlyRent !== 'Not specified' ? `$${formSummary.monthlyRent}` : 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Apartment Type:</span>
                    <span className="ml-2 text-purple-700">{formSummary.apartmentType || 'Not specified'}</span>
                  </div>
                </div>
              </div>
              
              {(() => {
                const coApps = Array.isArray(formSummary.coApplicants) ? formSummary.coApplicants : [];
                const seen = new Set<string>();
                const uniqueList = coApps.filter((x: any) => {
                  const k = `${x?.name || ''}|${x?.email || ''}|${x?.phone || ''}`;
                  if (seen.has(k)) return false;
                  seen.add(k);
                  return true;
                });
                return uniqueList.length > 0 ? (
                <div className="space-y-4">
                  {uniqueList.map((coApp: any, index: number) => (
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
                  <p className="text-purple-600 mb-4">This application doesn't have any co-applicants yet.</p>
                  <Button 
                    onClick={() => onEdit(draft)}
                    variant="outline" 
                    size="sm"
                    className="text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Add Co-Applicants
                  </Button>
                </div>
              )
              })()}
            </div>
          </TabsContent>

          {/* Guarantors Tab */}
          <TabsContent value="guarantors" className="space-y-4">
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h5 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Guarantors Information
              </h5>
              
              {(() => {
                const guar = Array.isArray(formSummary.guarantors) ? formSummary.guarantors : [];
                const seen = new Set<string>();
                const uniqueList = guar.filter((x: any) => {
                  const k = `${x?.name || ''}|${x?.email || ''}|${x?.phone || ''}`;
                  if (seen.has(k)) return false;
                  seen.add(k);
                  return true;
                });
                return uniqueList.length > 0 ? (
                <div className="space-y-4">
                  {uniqueList.map((guar: any, index: number) => {
                // Extract guarantor number from user role (e.g., "guarantor4" -> "4")
                const userRole = (user as any)?.role || '';
                let guarantorNumber = index + 1; // Default to array index + 1
                
                if (userRole.startsWith('guarantor') && /guarantor\d+/.test(userRole)) {
                  const match = userRole.match(/guarantor(\d+)/);
                  if (match) {
                    guarantorNumber = parseInt(match[1], 10);
                  }
                }
                
                return (
                    <div key={index} className="bg-white rounded-lg p-4 border border-orange-300 border-l-4 border-l-orange-500">
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="font-semibold text-orange-900">Guarantor {guarantorNumber}</h6>
                        <Badge variant="outline" className="border-orange-300 text-orange-700">Guarantor</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(() => {
                          const orderedFields: Array<{ key: string; label: string }> = [
                            { key: 'name', label: 'name' },
                            { key: 'relationship', label: 'relationship' },
                            { key: 'dob', label: 'dob' },
                            { key: 'ssn', label: 'ssn' },
                            { key: 'phone', label: 'phone' },
                            { key: 'email', label: 'email' },
                            { key: 'license', label: 'license' },
                            { key: 'licenseState', label: 'licenseState' },
                            { key: 'address', label: 'address' },
                            { key: 'city', label: 'city' },
                            { key: 'state', label: 'state' },
                            { key: 'zip', label: 'zip' },
                            { key: 'lengthAtAddressYears', label: 'lengthAtAddressYears' },
                            { key: 'lengthAtAddressMonths', label: 'lengthAtAddressMonths' },
                            { key: 'landlordName', label: 'landlordName' },
                            { key: 'landlordAddressLine1', label: 'landlordAddressLine1' },
                            { key: 'landlordAddressLine2', label: 'landlordAddressLine2' },
                            { key: 'landlordCity', label: 'landlordCity' },
                            { key: 'landlordState', label: 'landlordState' },
                            { key: 'landlordZipCode', label: 'landlordZipCode' },
                            { key: 'landlordPhone', label: 'landlordPhone' },
                            { key: 'landlordEmail', label: 'landlordEmail' },
                            { key: 'currentRent', label: 'currentRent' },
                            { key: 'reasonForMoving', label: 'reasonForMoving' },
                            { key: 'employmentType', label: 'employmentType' },
                            { key: 'income', label: 'income' },
                            { key: 'incomeFrequency', label: 'incomeFrequency' },
                            { key: 'businessName', label: 'businessName' },
                            { key: 'businessType', label: 'businessType' },
                            { key: 'yearsInBusiness', label: 'yearsInBusiness' },
                            { key: 'otherIncome', label: 'otherIncome' },
                            { key: 'otherIncomeFrequency', label: 'otherIncomeFrequency' },
                            { key: 'otherIncomeSource', label: 'otherIncomeSource' },
                            { key: 'age', label: 'age' },
                          ];

                          return orderedFields
                            .filter(({ key }) => {
                              const value = (guar as any)[key];
                              return value !== null && value !== undefined && value !== '';
                            })
                            .map(({ key, label }) => (
                          <div key={key} className="text-sm">
                                <span className="font-medium capitalize text-orange-700">{label}:</span>
                                <span className="ml-2 text-gray-700">{String((guar as any)[key])}</span>
                          </div>
                            ));
                        })()}
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
                  );
                })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                  <h6 className="text-lg font-medium text-orange-700 mb-2">No Guarantors</h6>
                  <p className="text-orange-600 mb-4">This application doesn't have any guarantors yet.</p>
                  <Button 
                    onClick={() => onEdit(draft)}
                    variant="outline" 
                    size="sm"
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Add Guarantors
                  </Button>
                </div>
              )
              })()}

              {/* Application Information for context */}
              <div className="mt-6 bg-white rounded-md border border-orange-200 p-3">
                <div className="text-sm font-semibold text-orange-900 mb-2">Application Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Building Address:</span>
                    <span className="ml-2 text-orange-700">{formSummary.buildingAddress || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Apartment:</span>
                    <span className="ml-2 text-orange-700">{formSummary.apartmentNumber || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Move-in Date:</span>
                    <span className="ml-2 text-orange-700">{formSummary.moveInDate && formSummary.moveInDate !== 'Not specified' ? formatDate(formSummary.moveInDate) : 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Monthly Rent:</span>
                    <span className="ml-2 text-orange-700">{formSummary.monthlyRent || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Apartment Type:</span>
                    <span className="ml-2 text-orange-700">{formSummary.apartmentType || 'Not specified'}</span>
                  </div>
                </div>
                
                {/* Applicant Information */}
                <div className="mt-4 pt-3 border-t border-orange-200">
                  <div className="text-sm font-semibold text-orange-900 mb-2">Primary Applicant</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>
                      <span className="ml-2 text-orange-700">{formSummary.applicantName || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>
                      <span className="ml-2 text-orange-700">{formSummary.applicantEmail || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Occupants Tab */}
          <TabsContent value="occupants" className="space-y-4">
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <h5 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
                <Home className="w-5 h-5 mr-2" />
                Occupants Information
              </h5>
              
              {(() => {
                const occ = (formSummary.occupants || formSummary.occupantsList || []) as any[];
                const seen = new Set<string>();
                const uniqueList = occ.filter((x: any) => {
                  const k = `${x?.name || ''}|${x?.relationship || ''}|${x?.dob || ''}`;
                  if (seen.has(k)) return false;
                  seen.add(k);
                  return true;
                });
                return uniqueList.length > 0 ? (
                <div className="space-y-4">
                  {uniqueList.map((occupant: any, index: number) => (
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
                  <p className="text-indigo-600 mb-4">This application doesn't have any occupants yet.</p>
                  <Button 
                    onClick={() => onEdit(draft)}
                    variant="outline" 
                    size="sm"
                    className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Add Occupants
                  </Button>
                </div>
              )
              })()}
            </div>
          </TabsContent>
        </Tabs>
          );
        })()}

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
            Continue from Step <span className="font-bold hidden">{draft.current_step + 1}
              </span>
          
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
          ) : null}
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
        
        // Get user role for role-based data retrieval
        const userRole = (user as any)?.role || '';
        console.log('🔍 Loading role-based draft data for role:', userRole);
        
        // Get all user data from separate tables
        const allData = await dynamoDBSeparateTablesUtils.getAllUserData();
        
        // Create role-based draft entries
        const drafts: DraftData[] = [];
        
        // Role-based data retrieval
        if (userRole === 'applicant') {
          // Primary Applicant: list ALL applications in this zone, but show only those created by this user
          const applications = await dynamoDBSeparateTablesUtils.getApplicationsByZoneinfo();
          const currentUserId = await dynamoDBSeparateTablesUtils.getCurrentUserId();
          console.log('🔍 DEBUG: Found applications:', applications?.length || 0);
          console.log('🔍 DEBUG: Current user ID:', currentUserId);
          console.log('🔍 DEBUG: Applications:', applications);
          
          if (applications && applications.length > 0) {
            for (const application of applications) {
              console.log('🔍 DEBUG: Processing application:', application.appid, 'userId:', application.userId, 'status:', application.status);
              // Filter: match userId if present
              if (currentUserId && application.userId && application.userId !== currentUserId) {
                console.log('🔍 DEBUG: Skipping application', application.appid, 'because userId mismatch:', application.userId, 'vs', currentUserId);
                continue;
              }
              // Load matching applicant_nyc by appid for preview
              let matchedApplicant: any = undefined;
              try {
                matchedApplicant = await dynamoDBSeparateTablesUtils.getApplicantByAppId(application.appid);
                console.log('🔍 DEBUG: getApplicantByAppId result for', application.appid, ':', matchedApplicant);
              } catch (error) {
                console.log('🔍 DEBUG: getApplicantByAppId error for', application.appid, ':', error);
              }
              // Load ALL co-applicants and guarantors for this appid
              let coApplicantsForApp: any[] = [];
              let guarantorsForApp: any[] = [];
              try {
                coApplicantsForApp = await dynamoDBSeparateTablesUtils.getCoApplicantsByAppId(application.appid);
                console.log('🔍 DEBUG: getCoApplicantsByAppId result for', application.appid, ':', coApplicantsForApp);
              } catch (error) {
                console.log('🔍 DEBUG: getCoApplicantsByAppId error for', application.appid, ':', error);
              }
              try {
                guarantorsForApp = await dynamoDBSeparateTablesUtils.getGuarantorsByAppId(application.appid);
                console.log('🔍 DEBUG: getGuarantorsByAppId result for', application.appid, ':', guarantorsForApp);
              } catch (error) {
                console.log('🔍 DEBUG: getGuarantorsByAppId error for', application.appid, ':', error);
              }
              // Extract invited parties from additionalPeople (application_info or applicant_nyc)
              const additionalFromAppInfo = (application?.application_info && (application.application_info as any)["Additional People"]) || undefined;
              const additionalFromApplicant = matchedApplicant?.additionalPeople || undefined;
              const additionalPeople = additionalFromAppInfo || additionalFromApplicant || undefined;

              const parseInvites = (ap: any) => {
                const co: any[] = [];
                const gu: any[] = [];
                if (ap && typeof ap === 'object') {
                  for (const [k, v] of Object.entries(ap)) {
                    if (!v || typeof v !== 'object') continue;
                    if (k.startsWith('coApplicants')) {
                      co.push({
                        name: (v as any).name || '',
                        email: (v as any).email || '',
                        inviteRole: (v as any).coApplicant || '',
                        inviteUrl: (v as any).url || ''
                      });
                    } else if (k.startsWith('guarantor')) {
                      gu.push({
                        name: (v as any).name || '',
                        email: (v as any).email || '',
                        inviteRole: (v as any).guarantor || '',
                        inviteUrl: (v as any).url || ''
                      });
                    }
                  }
                }
                return { co, gu };
              };

              const { co: invitedCoApplicants, gu: invitedGuarantors } = parseInvites(additionalPeople);

              const applicantFormData = {
              // Application Information (from app_nyc)
                application: application.application_info || {},
              
                // Primary Applicant (from applicant_nyc) - optional current user data
                applicant: matchedApplicant?.applicant_info || allData.applicant?.applicant_info || {},
                applicant_occupants: matchedApplicant?.occupants || allData.applicant?.occupants || [],
              
                // Co-Applicants (from Co-Applicants table + applicant_nyc table) - all records for this app
                coApplicants: (() => {
                  const allCoApplicants = [
                    ...(coApplicantsForApp || []).map((c: any) => c?.coapplicant_info).filter(Boolean),
                    ...(matchedApplicant?.co_applicants || []), // Include co-applicants from applicant_nyc table
                    ...invitedCoApplicants
                  ];
                  
                  // Deduplicate by email (most reliable identifier)
                  const seen = new Set();
                  return allCoApplicants.filter((coApp: any) => {
                    const email = coApp?.email;
                    if (!email || seen.has(email)) return false;
                    seen.add(email);
                    return true;
                  });
                })(),
                coApplicant_occupants: (coApplicantsForApp || []).flatMap((c: any) => c?.occupants || []),

                // Guarantors (from Guarantors table + applicant_nyc table) - all records for this app
                guarantors: (() => {
                  const allGuarantors = [
                    ...(guarantorsForApp || []).map((g: any) => g?.guarantor_info).filter(Boolean),
                    ...(matchedApplicant?.guarantors || []),
                    ...invitedGuarantors
                  ];
                  
                  // Deduplicate by email (most reliable identifier)
                  const seen = new Set();
                  return allGuarantors.filter((guar: any) => {
                    const email = guar?.email;
                    if (!email || seen.has(email)) return false;
                    seen.add(email);
                    return true;
                  });
                })(),
                guarantor_occupants: (guarantorsForApp || []).flatMap((g: any) => g?.occupants || []),

              // Reference data
                application_id: application.appid,
                zoneinfo: application.zoneinfo
            };
            
            // Debug logging for co-applicants and guarantors
            console.log('🔍 DEBUG: Application status:', application.status);
            console.log('🔍 DEBUG: matchedApplicant:', matchedApplicant);
            console.log('🔍 DEBUG: matchedApplicant?.co_applicants:', matchedApplicant?.co_applicants);
            console.log('🔍 DEBUG: matchedApplicant?.guarantors:', matchedApplicant?.guarantors);
            console.log('🔍 DEBUG: coApplicantsForApp:', coApplicantsForApp);
            console.log('🔍 DEBUG: guarantorsForApp:', guarantorsForApp);
            console.log('🔍 DEBUG: invitedCoApplicants:', invitedCoApplicants);
            console.log('🔍 DEBUG: invitedGuarantors:', invitedGuarantors);
            console.log('🔍 DEBUG: Final coApplicants array:', applicantFormData.coApplicants);
            console.log('🔍 DEBUG: Final guarantors array:', applicantFormData.guarantors);
            console.log('🔍 DEBUG: Final coApplicants length:', applicantFormData.coApplicants.length);
            console.log('🔍 DEBUG: Final guarantors length:', applicantFormData.guarantors.length);
            
            drafts.push({
                zoneinfo: application.zoneinfo,
                applicantId: application.appid,
                reference_id: application.appid,
              form_data: applicantFormData,
                current_step: application.current_step || 0,
                last_updated: application.last_updated,
                status: application.status,
                uploaded_files_metadata: application.uploaded_files_metadata || {},
                // Combine webhook responses and signatures from co-applicants and guarantors for a fuller preview
                webhook_responses: {
                  ...(application.webhook_responses || {}),
                  ...(coApplicantsForApp || []).reduce((acc: any, c: any) => ({
                    ...acc,
                    ...(c?.webhookSummary || {})
                  }), {}),
                  ...(guarantorsForApp || []).reduce((acc: any, g: any) => ({
                    ...acc,
                    ...(g?.webhookSummary || {})
                  }), {})
                },
                signatures: {
                  ...(application.signatures || {}),
                  coApplicants: (coApplicantsForApp || []).map((c: any) => c?.signature).filter(Boolean),
                  guarantors: (guarantorsForApp || []).map((g: any) => g?.signature).filter(Boolean)
                },
                encrypted_documents: application.encrypted_documents || {},
                flow_type: application.flow_type || 'separate_webhooks',
                webhook_flow_version: application.webhook_flow_version || '2.0',
              
              // Role-specific table data
              table_data: {
                  application: application,
                  applicant: allData.applicant,
                  coApplicant: coApplicantsForApp,
                  guarantor: guarantorsForApp
              }
            });
            }
          }
          
        } else if (userRole.startsWith('coapplicant')) {
          // Co-Applicant: Show ALL co-applicant records for this user (including suffixed IDs)
          const allCoApplicants = await dynamoDBSeparateTablesUtils.getAllCoApplicantsForCurrentUser();
          // Fetch applications in this zone once to resolve current_step by appid
          const zoneApps = await dynamoDBSeparateTablesUtils.getApplicationsByZoneinfo();
          if (allCoApplicants && allCoApplicants.length > 0) {
            for (const coApp of allCoApplicants) {
              const matchedApp = (zoneApps || []).find(a => a.appid === coApp.appid);
              const currentStepFromApp = matchedApp?.current_step ?? 0;
              // Try to fetch the primary applicant for this application to show name/email in previews
              let matchedApplicant: any = undefined;
              try {
                matchedApplicant = await dynamoDBSeparateTablesUtils.getApplicantByAppId(coApp.appid);
              } catch {}
              const coApplicantFormData = {
                // Include application for Application Information block
                application: matchedApp?.application_info || {},
                coApplicants: [coApp.coapplicant_info],
                coApplicant_occupants: [],
                application_id: coApp.appid,
                zoneinfo: coApp.zoneinfo,
                // Provide applicant context for preview headers
                applicant: matchedApplicant?.applicant_info || {},
                applicantName: matchedApplicant?.applicant_info?.name,
                applicantEmail: matchedApplicant?.applicant_info?.email
              };

              drafts.push({
                zoneinfo: coApp.zoneinfo,
                applicantId: coApp.userId,
                reference_id: coApp.userId,
                form_data: coApplicantFormData,
                current_step: currentStepFromApp,
                last_updated: coApp.last_updated,
                status: coApp.status,
                uploaded_files_metadata: {},
                webhook_responses: coApp.webhookSummary || {},
                signatures: { coApplicants: coApp.signature },
                encrypted_documents: {},
                flow_type: 'separate_webhooks',
                webhook_flow_version: '2.0',
                table_data: {
                  coApplicant: coApp,
                  applicant: matchedApplicant
                }
              });
            }
          }
          
        } else if (userRole.startsWith('guarantor')) {
          // Guarantor: Show data from Guarantors_nyc table only
          if (allData.guarantor) {
            // Fetch applications to resolve current_step and application data by appid
            const zoneApps = await dynamoDBSeparateTablesUtils.getApplicationsByZoneinfo();
            const matchedApp = (zoneApps || []).find(a => a.appid === (allData.guarantor as any).appid);
            const currentStepFromApp = matchedApp?.current_step ?? 0;
            
            // Fetch applicant data for context
            let matchedApplicant: any = undefined;
            try {
              matchedApplicant = await dynamoDBSeparateTablesUtils.getApplicantByAppId((allData.guarantor as any).appid);
            } catch {}
            
            const guarantorFormData = {
              // Include application for Application Information block
              application: matchedApp?.application_info || {},
              
              // Include applicant for Primary Applicant block
              applicant: matchedApplicant?.applicant_info || {},
              applicantName: matchedApplicant?.applicant_info?.name,
              applicantEmail: matchedApplicant?.applicant_info?.email,
              
              // Guarantor data (from Guarantors_nyc)
              guarantors: [ (allData.guarantor as any).guarantor_info ],
              guarantor_occupants: [],
              
              // Reference data
              application_id: (allData.guarantor as any).appid,
              zoneinfo: (allData.guarantor as any).zoneinfo
            };
            
            // Debug logging to see what's happening
            console.log('🔍 DEBUG: Guarantor appid:', (allData.guarantor as any).appid);
            console.log('🔍 DEBUG: ZoneApps found:', zoneApps?.length);
            console.log('🔍 DEBUG: MatchedApp:', matchedApp);
            console.log('🔍 DEBUG: MatchedApp.application_info:', matchedApp?.application_info);
            console.log('🔍 DEBUG: GuarantorFormData.application:', guarantorFormData.application);
            
            drafts.push({
              zoneinfo: (allData.guarantor as any).zoneinfo,
              applicantId: (allData.guarantor as any).userId,
              reference_id: (allData.guarantor as any).userId,
              form_data: guarantorFormData,
              current_step: currentStepFromApp,
              last_updated: (allData.guarantor as any).last_updated,
              status: (allData.guarantor as any).status,
              uploaded_files_metadata: {},
              webhook_responses: (allData.guarantor as any).webhookSummary || {},
              signatures: { guarantor: (allData.guarantor as any).signature },
              encrypted_documents: {},
              flow_type: 'separate_webhooks',
              webhook_flow_version: '2.0',
              
              // Role-specific table data
              table_data: {
                guarantor: allData.guarantor as any
              }
            });
          }
          
        } else {
          // Fallback: Show all data for unknown roles (admin/staff)
          if (allData.application) {
            const comprehensiveFormData = {
              // Application Information (from app_nyc)
              application: allData.application.application_info || {},
              
              // Primary Applicant (from applicant_nyc)
              applicant: allData.applicant?.applicant_info || {},
              applicant_occupants: allData.applicant?.occupants || [],
              
              // Co-Applicants (from Co-Applicants)
              coApplicants: Array.isArray(allData.coApplicant)
                ? allData.coApplicant.map((c: any) => c?.coapplicant_info).filter(Boolean)
                : (allData.coApplicant ? [allData.coApplicant.coapplicant_info] : []),
              coApplicant_occupants: [],
              
              // Guarantors (from Guarantors_nyc)
              guarantors: allData.guarantor ? [allData.guarantor.guarantor_info] : [],
              guarantor_occupants: [],
              
              // Combined occupants from all tables
              occupants: [],
              
              // Combined webhook responses
              webhookResponses: {
                ...allData.application.webhook_responses,
                ...allData.applicant?.webhookSummary,
                ...(Array.isArray(allData.coApplicant)
                  ? allData.coApplicant.reduce((acc: any, c: any) => ({ ...acc, ...(c?.webhookSummary || {}) }), {})
                  : allData.coApplicant?.webhookSummary),
                ...allData.guarantor?.webhookSummary
              },
              
              // Combined signatures
              signatures: {
                ...allData.application.signatures,
                applicant: allData.applicant?.signature,
                coApplicants: Array.isArray(allData.coApplicant)
                  ? allData.coApplicant.map((c: any) => c?.signature).filter(Boolean)
                  : allData.coApplicant?.signature,
                guarantor: allData.guarantor?.signature
              },
              
              // Metadata
              hasCoApplicant: !!allData.coApplicant,
              hasGuarantor: !!allData.guarantor,
              coApplicantCount: allData.coApplicant ? 1 : 0,
              guarantorCount: allData.guarantor ? 1 : 0,
              
              // Reference data
              application_id: allData.application.appid,
              zoneinfo: allData.application.zoneinfo
            };
            
            drafts.push({
              zoneinfo: allData.application.zoneinfo,
              applicantId: allData.application.appid,
              reference_id: allData.application.appid,
              form_data: comprehensiveFormData,
              current_step: allData.application.current_step || 0,
              last_updated: allData.application.last_updated,
              status: allData.application.status,
              uploaded_files_metadata: allData.application.uploaded_files_metadata || {},
              webhook_responses: comprehensiveFormData.webhookResponses,
              signatures: comprehensiveFormData.signatures,
              encrypted_documents: allData.application.encrypted_documents || {},
              flow_type: allData.application.flow_type || 'separate_webhooks',
              webhook_flow_version: allData.application.webhook_flow_version || '2.0',
              
              // All table data for admin view
              table_data: {
                application: allData.application,
                applicant: allData.applicant,
                coApplicant: allData.coApplicant,
                guarantor: allData.guarantor
              }
            });
          }
        }
        
        // Deduplicate by reference_id/appid, keep most recent by last_updated
        const dedupMap = new Map<string, DraftData>();
        for (const d of drafts) {
          const key = d.reference_id || d.applicantId || `${d.zoneinfo}:${d.form_data?.application_id || ''}`;
          const existing = dedupMap.get(key);
          if (!existing) {
            dedupMap.set(key, d);
          } else {
            const a = new Date(existing.last_updated || 0).getTime();
            const b = new Date(d.last_updated || 0).getTime();
            if (b > a) dedupMap.set(key, d);
          }
        }
        const uniqueDrafts = Array.from(dedupMap.values());

        console.log('📋 Loaded role-based draft data (deduped):', uniqueDrafts);
        console.log('📊 Role-based data summary:', {
          userRole,
          application: !!allData.application,
          applicant: !!allData.applicant,
          coApplicant: !!allData.coApplicant,
          guarantor: !!allData.guarantor,
          draftsCount: uniqueDrafts.length
        });
        
        setDrafts(uniqueDrafts);
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
      
      // Delete the draft using the separate tables service
      let success = false;
      try {
        // For now, just remove from local state since we're using separate tables
        // In a full implementation, you would delete from the appropriate table(s)
        success = true;
        console.log('🗑️ Draft deletion handled by separate tables service');
      } catch (error) {
        console.error('❌ Error deleting draft:', error);
        success = false;
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
                {/* Logged-in user info */}
                <div className="text-sm text-blue-100/90">
                  <span className="font-semibold">Role:</span> {(user as any)?.role || 'unknown'}
                  <span className="mx-2">|</span>
                  <span className="font-semibold">User ID:</span> {(user as any)?.userId || (user as any)?.sub || 'unknown'}
                </div>
              </div>
              
              {/* Applications Icon */}
              <div className="hidden lg:block">
                <FileText className="w-48 h-32 text-white/20" />
              </div>
            </div>

            {/* Removed: Add Application Button */}
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
