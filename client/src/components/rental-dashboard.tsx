"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

import { CheckCircle, Clock, AlertCircle, FileText, DollarSign, CreditCard, ChevronLeft, Users, RefreshCw, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "../hooks/use-auth"
import { dynamoDBService } from "../lib/dynamodb-service"
// import { VerificationCard } from "./ui/verification-card" // Hidden

type ApplicationCardProps = {
  appId: string
  property: string
  lastUpdated: string
  status: string
}

const statusClasses = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-primary text-primary-foreground",
  completed: "bg-secondary text-secondary-foreground",
  rejected: "bg-destructive text-destructive-foreground",
} as const

function humanizeStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function ApplicationCard({ appId, property, lastUpdated, status }: ApplicationCardProps) {
  return (
    <section aria-label="Application summary" className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground text-balance">Application: {appId}</h3>
          <p className="text-sm text-foreground/90">Property: {property}</p>
          <p className="text-xs text-muted-foreground">Last Updated: {lastUpdated}</p>
        </div>

        <div className="text-right">
          <span
            className={cn(
              "inline-flex items-center rounded-full border border-transparent font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-sm px-3 py-1",
              statusClasses[status as keyof typeof statusClasses] ?? "bg-muted text-muted-foreground",
            )}
            aria-label={`Status: ${humanizeStatus(status)}`}
            data-status={status}
          >
            {humanizeStatus(status)}
          </span>
        </div>
      </div>
    </section>
  )
}

// Helper function to transform database data to verification format
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
        
        // Transform database data to verification format
        const transformedApplications = userApplications.map(transformApplicationData);
        console.log('📊 Transformed applications for verification:', transformedApplications);
        
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
            <h2 className="text-xl font-semibold mb-2">Loading Verification...</h2>
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
            <h2 className="text-xl font-semibold mb-2">Error Loading Verification</h2>
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

  // Helper function to determine verification status - Hidden
  // const getVerificationStatus = (status: string, hasData: boolean) => {
  //   if (status === 'completed' || status === 'approved') return 'verified'
  //   if (status === 'in_progress' || status === 'pending') return 'pending'
  //   if (status === 'failed' || status === 'rejected') return 'failed'
  //   if (hasData) return 'pending'
  //   return 'not_started'
  // }

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


      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-green-300/50 p-8" style={{ background: 'linear-gradient(to right, #34af3d, #2d9a35, #26852d)' }}>
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
                  Rental Applications
                </h1>
                <p className="text-xl text-purple-100 max-w-2xl leading-relaxed">
                  View and manage your rental applications
                </p>
                    </div>
              
              {/* Face Recognition Security Illustration */}
              <div className="hidden lg:block">
                <img 
                  src="https://rentobjectsphotos.s3.us-east-1.amazonaws.com/face-recognition-security-illustration-svg-png-download-4309034.webp"
                  alt="Face Recognition Security - Credit and Income Verification"
                  className="w-48 h-32 object-contain"
                />
                    </div>
                  </div>
                  </div>
            </div>

        <div className="space-y-6">
                {allApplications && allApplications.length > 0 ? (
              allApplications.map((app) => {
                      const appData = getApplicationData(app);
                      return (
                                      <div key={appData.id} className="space-y-6">
                      {/* Application Header */}
                      <ApplicationCard
                        appId="app_1756224999898_sqkk94dgn"
                        property="East 30th Street 11A"
                        lastUpdated="29/08/2025"
                        status="not_started"
                      />

                    {/* Verification Grid - Hidden */}
                    {/* <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <VerificationCard
                        role="Applicant"
                        personName={appData.applicantName}
                        creditStatus={getVerificationStatus(appData.screeningStatus || 'not_started', !!appData.creditScore)}
                        incomeStatus={getVerificationStatus(appData.screeningStatus || 'not_started', !!appData.monthlyIncome)}
                        creditScore={appData.creditScore}
                        monthlyIncome={appData.monthlyIncome}
                        updatedAt={appData.submittedDate}
                      />
                    </div> */}


                          </div>
                        );
              })
                  ) : (
                    <div className="text-center py-8">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Applications Found</h3>
                      <p className="text-muted-foreground">
                  Submit an application to see your application details.
                      </p>
                    </div>
                  )}
            </div>
      </div>
    </div>
  )
}
