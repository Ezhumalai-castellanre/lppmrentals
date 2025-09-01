"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Clock, AlertCircle, FileText, DollarSign, CreditCard, ChevronLeft, Users, RefreshCw, Shield } from "lucide-react"
import { useAuth } from "../hooks/use-auth"
import { dynamoDBService } from "../lib/dynamodb-service"

// Helper function to transform database data to dashboard format
const transformApplicationData = (draft: any) => {
  try {
    // Parse form_data if it's a string
    let formData = draft.form_data;
    if (typeof formData === 'string') {
      formData = JSON.parse(formData);
    }

    // Extract applicant information
    const applicant = formData?.applicant || formData?.coApplicants?.[0] || {};
    const applicantName = applicant.name || 'Unknown Applicant';
    
    // Extract co-applicants and guarantors information
    const coApplicants = formData?.coApplicants || [];
    const guarantors = formData?.guarantors || [];
    const hasCoApplicants = coApplicants.length > 0;
    const hasGuarantors = guarantors.length > 0;
    
    // Extract property information
    const buildingAddress = formData?.buildingAddress || formData?.application?.buildingAddress || '';
    const apartmentNumber = formData?.apartmentNumber || formData?.application?.apartmentNumber || '';
    const propertyAddress = `${buildingAddress} ${apartmentNumber}`.trim() || 'Property Address Not Specified';
    
    // Calculate progress based on current step
    const progress = Math.round((draft.current_step / 12) * 100); // Assuming 12 total steps
    
    // Determine status based on draft status and progress
    let status = 'draft';
    if (draft.status === 'submitted') {
      if (progress < 100) {
        status = 'pending_documents';
      } else {
        status = 'approved';
      }
    }
    
    // Extract comprehensive financial information
    const income = applicant.income || applicant.salary || applicant.monthlyIncome || 0;
    const incomeFrequency = applicant.incomeFrequency || 'yearly';
    const employmentType = applicant.employmentType || 'unknown';
    const employer = applicant.employer || applicant.employerName || 'Not specified';
    const position = applicant.position || 'Not specified';
    const employmentStart = applicant.employmentStart || applicant.startDate || null;
    const otherIncome = applicant.otherIncome || 0;
    const otherIncomeSource = applicant.otherIncomeSource || '';
    const otherIncomeFrequency = applicant.otherIncomeFrequency || 'monthly';
    
    // Calculate monthly income based on frequency
    let monthlyIncome = 0;
    if (income && incomeFrequency) {
      const incomeNum = parseFloat(income.toString());
      if (!isNaN(incomeNum)) {
        switch (incomeFrequency.toLowerCase()) {
          case 'monthly':
            monthlyIncome = incomeNum;
            break;
          case 'yearly':
            monthlyIncome = incomeNum / 12;
            break;
          case 'weekly':
            monthlyIncome = incomeNum * 4.33; // Average weeks per month
            break;
          case 'biweekly':
            monthlyIncome = incomeNum * 2.17; // Average biweekly periods per month
            break;
          default:
            monthlyIncome = incomeNum;
        }
      }
    }
    
    // Add other income to monthly total
    if (otherIncome && otherIncomeFrequency) {
      const otherIncomeNum = parseFloat(otherIncome.toString());
      if (!isNaN(otherIncomeNum)) {
        switch (otherIncomeFrequency.toLowerCase()) {
          case 'monthly':
            monthlyIncome += otherIncomeNum;
            break;
          case 'yearly':
            monthlyIncome += otherIncomeNum / 12;
            break;
          case 'weekly':
            monthlyIncome += otherIncomeNum * 4.33;
            break;
          case 'biweekly':
            monthlyIncome += otherIncomeNum * 2.17;
            break;
          default:
            monthlyIncome += otherIncomeNum;
        }
      }
    }
    
    // Extract bank information
    const bankRecords = applicant.bankRecords || [];
    const hasBankRecords = bankRecords.length > 0;
    
    // Extract screening data
    const screeningData = draft.data || {};
    const screenings = screeningData.screenings || [];
    const screeningStatus = screeningData.status || 'unknown';
    const approvalRecommendation = screeningData.approval_recommendation || 'unavailable';
    const monthlyRentCents = screeningData.monthly_rent_cents || 0;
    const monthlyRent = monthlyRentCents / 100; // Convert cents to dollars
    const isExpired = screeningData.is_expired || false;
    const isReportExpired = screeningData.is_report_expired || false;
    
    // Match applicant email with screening data
    const applicantEmail = applicant.email || applicant.applicantEmail || '';
    const matchingScreening = screenings.find((screening: any) => 
      screening.applicant_email === applicantEmail
    );
    
    // Parse webhook responses to get missing documents
    let missingDocuments: string[] = [];
    if (draft.webhook_responses) {
      try {
        const webhookData = typeof draft.webhook_responses === 'string' 
          ? JSON.parse(draft.webhook_responses) 
          : draft.webhook_responses;
        
        // Check for missing or failed document processing
        Object.entries(webhookData).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object') {
            if (value.status === 'failed' || value.errors?.length > 0) {
              missingDocuments.push(`${key} - Processing Failed`);
            } else if (value.status === 'pending') {
              missingDocuments.push(`${key} - Pending`);
            }
          }
        });
      } catch (e) {
        console.warn('Failed to parse webhook responses:', e);
      }
    }
    
    return {
      id: draft.reference_id || 'Unknown',
      applicantName,
      propertyAddress,
      status,
      submittedDate: draft.last_updated ? new Date(draft.last_updated).toLocaleDateString() : 'Unknown Date',
      progress,
      monthlyIncome: Math.round(monthlyIncome), // Round to nearest dollar
      missingDocuments,
      // Enhanced financial information
      income,
      incomeFrequency,
      employmentType,
      employer,
      position,
      employmentStart,
      otherIncome,
      otherIncomeSource,
      otherIncomeFrequency,
      hasBankRecords,
      bankRecords,
      // User information
      hasCoApplicants,
      hasGuarantors,
      coApplicants,
      guarantors,
      // Screening information
      applicantEmail,
      matchingScreening,
      screeningStatus,
      approvalRecommendation,
      monthlyRent,
      isExpired,
      isReportExpired,
      // Additional fields from the database
      currentStep: draft.current_step || 0,
      lastUpdated: draft.last_updated,
      applicantId: draft.applicantId || draft.zoneinfo,
      hasUploadedFiles: draft.uploaded_files_metadata ? true : false,
      hasSignatures: draft.signatures ? true : false,
      webhookResponses: draft.webhook_responses ? true : false
    };
  } catch (error) {
    console.error('Error transforming application data:', error);
    return {
      id: draft.reference_id || 'Unknown',
      applicantName: 'Error Loading Data',
      propertyAddress: 'Error Loading Data',
      status: 'error',
      submittedDate: 'Error',
      progress: 0,
      monthlyIncome: 0,
      missingDocuments: ['Data Loading Error'],
      income: 0,
      incomeFrequency: 'unknown',
      employmentType: 'unknown',
      employer: 'Error',
      position: 'Error',
      employmentStart: null,
      otherIncome: 0,
      otherIncomeSource: '',
      otherIncomeFrequency: 'unknown',
      hasBankRecords: false,
      bankRecords: [],
      // User information
      hasCoApplicants: false,
      hasGuarantors: false,
      coApplicants: [],
      guarantors: [],
      // Screening information
      applicantEmail: '',
      matchingScreening: null,
      screeningStatus: 'unknown',
      approvalRecommendation: 'unavailable',
      monthlyRent: 0,
      isExpired: false,
      isReportExpired: false,
      currentStep: 0,
      lastUpdated: null,
      applicantId: null,
      hasUploadedFiles: false,
      hasSignatures: false,
      webhookResponses: false
    };
  }
};

const statusConfig = {
  pending_documents: { label: "Missing Documents", color: "bg-yellow-500", icon: AlertCircle },
  credit_verification: { label: "Credit Verification", color: "bg-blue-500", icon: Clock },
  income_verification: { label: "Income Verification", color: "bg-purple-500", icon: DollarSign },
  approved: { label: "Approved", color: "bg-green-500", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500", icon: AlertCircle },
  draft: { label: "Draft", color: "bg-gray-500", icon: FileText },
  submitted: { label: "Submitted", color: "bg-blue-600", icon: CheckCircle },
  error: { label: "Error", color: "bg-red-600", icon: AlertCircle },
  unknown: { label: "Unknown", color: "bg-gray-400", icon: AlertCircle }
}

interface RentalDashboardProps {
  onBackToForm?: () => void;
  currentApplication?: {
    id: string;
    applicantName: string;
    propertyAddress: string;
    status: string;
    submittedDate: string;
    progress: number;
    creditScore?: number;
    monthlyIncome?: number;
    creditCardType?: string;
    creditCardLast4?: string;
    creditCardValid?: boolean;
    missingDocuments?: string[];
    // Enhanced financial information
    income?: number | string;
    incomeFrequency?: string;
    employmentType?: string;
    employer?: string;
    position?: string;
    employmentStart?: string | null;
    otherIncome?: number | string;
    otherIncomeSource?: string;
    otherIncomeFrequency?: string;
    hasBankRecords?: boolean;
    bankRecords?: any[];
    // User information
    hasCoApplicants?: boolean;
    hasGuarantors?: boolean;
    coApplicants?: any[];
    guarantors?: any[];
    // Screening information
    applicantEmail?: string;
    matchingScreening?: any;
    screeningStatus?: string;
    approvalRecommendation?: string;
    monthlyRent?: number;
    isExpired?: boolean;
    isReportExpired?: boolean;
  };
}

export default function RentalDashboard({ onBackToForm, currentApplication }: RentalDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newApplication, setNewApplication] = useState({
    applicantName: "",
    email: "",
    phone: "",
    propertyAddress: "",
    monthlyIncome: "",
    employmentStatus: "",
    additionalNotes: "",
    creditCardType: "",
    creditCardLast4: "",
    creditCardValid: false,
  });

  // Fetch real applications data
  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        let userApplications: any[] = [];
        
        // Try to get applications using applicantId first, then zoneinfo
        if (user?.applicantId) {
          console.log('🔍 Fetching applications using applicantId:', user.applicantId);
          userApplications = await dynamoDBService.getAllDrafts(user.applicantId);
        } else if (user?.zoneinfo) {
          console.log('🔍 Fetching applications using zoneinfo:', user.zoneinfo);
          userApplications = await dynamoDBService.getAllDrafts(user.zoneinfo);
        }
        
        console.log('📋 Raw applications from database:', userApplications);
        
        // Transform database data to dashboard format
        const transformedApplications = userApplications.map(transformApplicationData);
        console.log('📊 Transformed applications for dashboard:', transformedApplications);
        
        setApplications(transformedApplications);
      } catch (err) {
        console.error('❌ Error fetching applications:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch applications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  // Combine current application with fetched applications if it exists
  const allApplications = currentApplication 
    ? [currentApplication, ...applications]
    : applications;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Loading Dashboard...</h2>
            <p className="text-muted-foreground">Fetching your application data</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to safely get application data with defaults
  const getApplicationData = (app: any) => ({
    id: app.id || 'Unknown',
    applicantName: app.applicantName || 'Unknown Applicant',
    propertyAddress: app.propertyAddress || 'Unknown Address',
    status: app.status || 'unknown',
    submittedDate: app.submittedDate || 'Unknown Date',
    progress: app.progress || 0,
    creditScore: app.creditScore,
    monthlyIncome: app.monthlyIncome,
    creditCardType: app.creditCardType,
    creditCardLast4: app.creditCardLast4,
    creditCardValid: app.creditCardValid,
    missingDocuments: app.missingDocuments || [],
    // Enhanced financial information
    income: app.income,
    incomeFrequency: app.incomeFrequency,
    employmentType: app.employmentType,
    employer: app.employer,
    position: app.position,
    employmentStart: app.employmentStart,
    otherIncome: app.otherIncome,
    otherIncomeSource: app.otherIncomeSource,
    otherIncomeFrequency: app.otherIncomeFrequency,
    hasBankRecords: app.hasBankRecords,
    bankRecords: app.bankRecords || [],
    // User information
    hasCoApplicants: app.hasCoApplicants,
    hasGuarantors: app.hasGuarantors,
    coApplicants: app.coApplicants || [],
    guarantors: app.guarantors || [],
    // Screening information
    applicantEmail: app.applicantEmail,
    matchingScreening: app.matchingScreening,
    screeningStatus: app.screeningStatus,
    approvalRecommendation: app.approvalRecommendation,
    monthlyRent: app.monthlyRent,
    isExpired: app.isExpired,
    isReportExpired: app.isReportExpired,
  });

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] New application submitted:", newApplication)
    // Reset form
    setNewApplication({
      applicantName: "",
      email: "",
      phone: "",
      propertyAddress: "",
      monthlyIncome: "",
      employmentStatus: "",
      additionalNotes: "",
      creditCardType: "",
      creditCardLast4: "",
      creditCardValid: false,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBackToForm && (
                <Button
                  variant="outline"
                  onClick={onBackToForm}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Form
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">LPPM Rental Dashboard</h1>
                <p className="text-muted-foreground">Manage rental applications and verifications</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {allApplications.length} {allApplications.length === 1 ? 'Application' : 'Applications'}
              </Badge>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              {onBackToForm && (
                <Button
                  onClick={() => {
                    // Reset form and go back
                    onBackToForm();
                  }}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Start New Application
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  // This could navigate to a full applications page
                  console.log("View all applications clicked");
                }}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                View All Applications
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Verification
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Current Application Summary */}
            {currentApplication && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Current Application Status
                  </CardTitle>
                  <CardDescription>
                    Your application is currently being processed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Application ID</p>
                      <p className="text-lg font-bold text-blue-800">{currentApplication.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={currentApplication.progress} className="flex-1 h-2" />
                        <span className="text-sm font-medium text-blue-800">{currentApplication.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Status</p>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        {statusConfig[currentApplication.status as keyof typeof statusConfig]?.label || "Processing"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Submitted</p>
                      <p className="text-sm text-blue-800">{currentApplication.submittedDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allApplications.length}</div>
                  <p className="text-xs text-muted-foreground">+2 from last week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allApplications.filter((app) => app.status !== "approved" && app.status !== "rejected").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Requires attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allApplications.length > 0 
                      ? Math.round(
                          (allApplications.filter((app) => app.status === "approved").length / allApplications.length) *
                            100,
                        )
                      : 0
                    }%
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allApplications.filter((app) => app.webhookResponses).length}
                  </div>
                  <p className="text-xs text-muted-foreground">With document processing</p>
                </CardContent>
              </Card>
            </div>

            {/* Applications List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Track the status of all rental applications</CardDescription>
              </CardHeader>
              <CardContent>
                {allApplications && allApplications.length > 0 ? (
                  <div className="space-y-4">
                    {allApplications.map((app) => {
                      const appData = getApplicationData(app);
                      const StatusIcon = statusConfig[appData.status as keyof typeof statusConfig]?.icon || AlertCircle
                      return (
                        <div key={appData.id} className={`flex items-center justify-between p-4 border rounded-lg ${
                          currentApplication && appData.id === currentApplication.id 
                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                            : ''
                        }`}>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="h-4 w-4" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{appData.applicantName}</p>
                                  {currentApplication && appData.id === currentApplication.id && (
                                    <Badge variant="default" className="text-xs">
                                      Current
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{appData.id}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm">{appData.propertyAddress}</p>
                              <p className="text-xs text-muted-foreground">Submitted: {appData.submittedDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">Credit: {appData.creditScore || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">
                                Income: ${appData.monthlyIncome ? appData.monthlyIncome.toLocaleString() : 'N/A'}
                              </p>
                            </div>
                            <div className="w-24">
                              <Progress value={appData.progress} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1">{appData.progress}%</p>
                            </div>
                            <Badge
                              variant="secondary"
                            className={`${statusConfig[appData.status as keyof typeof statusConfig]?.color || 'bg-gray-500'} text-white`}
                          >
                            {statusConfig[appData.status as keyof typeof statusConfig]?.label || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Applications Found</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted any applications yet.
                  </p>
                  <Button asChild>
                    <a href="/application">Start New Application</a>
                  </Button>
                </div>
              )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            {allApplications && allApplications.length > 0 ? (
              allApplications.map((app) => {
                const appData = getApplicationData(app);
                return (
                  <div key={appData.id} className="space-y-6">
                    {/* Application Header */}
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Application: {appData.id}</p>
                          <p className="text-sm text-muted-foreground">Property: {appData.propertyAddress}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              appData.screeningStatus === 'completed' ? 'default' :
                              appData.screeningStatus === 'in_progress' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {appData.screeningStatus || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Primary Applicant */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Primary Applicant - Verification Status</CardTitle>
                        <CardDescription>Credit verification and income verification status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{appData.applicantName}</p>
                              <p className="text-sm text-muted-foreground">{appData.applicantEmail || 'No email'}</p>
                            </div>
                            <Badge variant="default">Primary</Badge>
                          </div>
                          
                          {/* Credit Verification Section */}
                          <div className="pt-2 border-t">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Credit Verification</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Credit Score</span>
                                <div className="text-right">
                                  <p className="text-lg font-bold">{appData.creditScore || 'N/A'}</p>
                                  <Badge
                                    variant={
                                      appData.creditScore && appData.creditScore >= 700
                                        ? "default"
                                        : appData.creditScore && appData.creditScore >= 650
                                          ? "secondary"
                                          : "destructive"
                                    }
                                  >
                                    {appData.creditScore && appData.creditScore >= 700 ? "Excellent" : appData.creditScore && appData.creditScore >= 650 ? "Good" : "Fair"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{appData.creditCardType || 'N/A'}</span>
                                  <span className="text-sm text-muted-foreground">****{appData.creditCardLast4 || '****'}</span>
                                </div>
                                <Badge variant={appData.creditCardValid === true ? "default" : "destructive"}>
                                  {appData.creditCardValid === true ? "Valid Card" : "Invalid Card"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Income Verification Section */}
                          <div className="pt-2 border-t">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Income Verification Status</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                                <p className="text-sm">${appData.monthlyRent ? appData.monthlyRent.toLocaleString() : 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Approval Recommendation</p>
                                <p className="text-sm capitalize">{appData.approvalRecommendation || 'Unavailable'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Screening Expired</p>
                                <p className="text-sm">{appData.isExpired ? 'Yes' : 'No'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Report Expired</p>
                                <p className="text-sm">{appData.isReportExpired ? 'Yes' : 'No'}</p>
                              </div>
                            </div>
                            
                            {appData.matchingScreening && (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Screening Details:</p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {appData.matchingScreening.id}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Status: {appData.matchingScreening.screening_status}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Reason: {appData.matchingScreening.reason_completed}
                                </p>
                                {appData.matchingScreening.document_upload_status && (
                                  <p className="text-xs text-muted-foreground">
                                    Documents: {appData.matchingScreening.document_upload_status}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Co-Applicants */}
                    {appData.hasCoApplicants && appData.coApplicants && appData.coApplicants.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground">Co-Applicants</h3>
                        {appData.coApplicants.map((coApp: any, index: number) => (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle>Co-Applicant {index + 1} - Verification Status</CardTitle>
                              <CardDescription>Credit verification and income verification status</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{coApp.name || 'Unknown'}</p>
                                    <p className="text-sm text-muted-foreground">{coApp.email || 'No email'}</p>
                                    {coApp.phone && <p className="text-xs text-muted-foreground">{coApp.phone}</p>}
                                  </div>
                                  <Badge variant="secondary">Co-Applicant {index + 1}</Badge>
                                </div>
                                
                                {/* Credit Verification Section */}
                                <div className="pt-2 border-t">
                                  <p className="text-sm font-medium text-muted-foreground mb-2">Credit Verification</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">Credit Score</span>
                                      <div className="text-right">
                                        <p className="text-lg font-bold">{coApp.creditScore || 'N/A'}</p>
                                        <Badge
                                          variant={
                                            coApp.creditScore && coApp.creditScore >= 700
                                              ? "default"
                                              : coApp.creditScore && coApp.creditScore >= 650
                                                ? "secondary"
                                                : "destructive"
                                          }
                                        >
                                          {coApp.creditScore && coApp.creditScore >= 700 ? "Excellent" : coApp.creditScore && coApp.creditScore >= 650 ? "Good" : "Fair"}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{coApp.creditCardType || 'N/A'}</span>
                                        <span className="text-sm text-muted-foreground">****{coApp.creditCardLast4 || '****'}</span>
                                      </div>
                                      <Badge variant={coApp.creditCardValid === true ? "default" : "destructive"}>
                                        {coApp.creditCardValid === true ? "Valid Card" : "Invalid Card"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Income Verification Section */}
                                <div className="pt-2 border-t">
                                  <p className="text-sm font-medium text-muted-foreground mb-2">Income Verification Status</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                                      <p className="text-sm">${coApp.monthlyRent ? coApp.monthlyRent.toLocaleString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Approval Recommendation</p>
                                      <p className="text-sm capitalize">{coApp.approvalRecommendation || 'Unavailable'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Screening Expired</p>
                                      <p className="text-sm">{coApp.isExpired ? 'Yes' : 'No'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Report Expired</p>
                                      <p className="text-sm">{coApp.isReportExpired ? 'Yes' : 'No'}</p>
                                    </div>
                                  </div>
                                  
                                  {coApp.matchingScreening && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs font-medium text-muted-foreground">Screening Details:</p>
                                      <p className="text-xs text-muted-foreground">
                                        ID: {coApp.matchingScreening.id}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Status: {coApp.matchingScreening.screening_status}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Reason: {coApp.matchingScreening.reason_completed}
                                      </p>
                                      {coApp.matchingScreening.document_upload_status && (
                                        <p className="text-xs text-muted-foreground">
                                          Documents: {coApp.matchingScreening.document_upload_status}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Guarantors */}
                    {appData.hasGuarantors && appData.guarantors && appData.guarantors.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground">Guarantors</h3>
                        {appData.guarantors.map((guarantor: any, index: number) => (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle>Guarantor {index + 1} - Verification Status</CardTitle>
                              <CardDescription>Credit verification and income verification status</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{guarantor.name || 'Unknown'}</p>
                                    <p className="text-sm text-muted-foreground">{guarantor.email || 'No email'}</p>
                                    {guarantor.phone && <p className="text-xs text-muted-foreground">{guarantor.phone}</p>}
                                  </div>
                                  <Badge variant="outline">Guarantor {index + 1}</Badge>
                                </div>
                                
                                {/* Credit Verification Section */}
                                <div className="pt-2 border-t">
                                  <p className="text-sm font-medium text-muted-foreground mb-2">Credit Verification</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">Credit Score</span>
                                      <div className="text-right">
                                        <p className="text-lg font-bold">{guarantor.creditScore || 'N/A'}</p>
                                        <Badge
                                          variant={
                                            guarantor.creditScore && guarantor.creditScore >= 700
                                              ? "default"
                                              : guarantor.creditScore && guarantor.creditScore >= 650
                                                ? "secondary"
                                                : "destructive"
                                          }
                                        >
                                          {guarantor.creditScore && guarantor.creditScore >= 700 ? "Excellent" : guarantor.creditScore && guarantor.creditScore >= 650 ? "Good" : "Fair"}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{guarantor.creditCardType || 'N/A'}</span>
                                        <span className="text-sm text-muted-foreground">****{guarantor.creditCardLast4 || '****'}</span>
                                      </div>
                                      <Badge variant={guarantor.creditCardValid === true ? "default" : "destructive"}>
                                        {guarantor.creditCardValid === true ? "Valid Card" : "Invalid Card"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Income Verification Section */}
                                <div className="pt-2 border-t">
                                  <p className="text-sm font-medium text-muted-foreground mb-2">Income Verification Status</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                                      <p className="text-sm">${guarantor.monthlyRent ? guarantor.monthlyRent.toLocaleString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Approval Recommendation</p>
                                      <p className="text-sm capitalize">{guarantor.approvalRecommendation || 'Unavailable'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Screening Expired</p>
                                      <p className="text-sm">{guarantor.isExpired ? 'Yes' : 'No'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Report Expired</p>
                                      <p className="text-sm">{guarantor.isReportExpired ? 'Yes' : 'No'}</p>
                                    </div>
                                  </div>
                                  
                                  {guarantor.matchingScreening && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs font-medium text-muted-foreground">Screening Details:</p>
                                      <p className="text-xs text-muted-foreground">
                                        ID: {guarantor.matchingScreening.id}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Status: {guarantor.matchingScreening.screening_status}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Reason: {guarantor.matchingScreening.reason_completed}
                                      </p>
                                      {guarantor.matchingScreening.document_upload_status && (
                                        <p className="text-xs text-muted-foreground">
                                          Documents: {guarantor.matchingScreening.document_upload_status}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Applications to Verify</h3>
                <p className="text-muted-foreground">
                  Submit an application to see verification details.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
