"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Clock, AlertCircle, FileText, DollarSign, CreditCard, ChevronLeft, Users, RefreshCw } from "lucide-react"
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
    
    // Extract financial information
    const monthlyIncome = applicant.income || applicant.monthlyIncome || 0;
    
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
      monthlyIncome,
      missingDocuments,
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
                {allApplications.length} Active Applications
              </Badge>
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
            
            <div className="grid gap-6 md:grid-cols-3">
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
                    {Math.round(
                      (allApplications.filter((app) => app.status === "approved").length / allApplications.length) *
                        100,
                    )}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Credit Verification</CardTitle>
                  <CardDescription>Review credit scores and card validation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allApplications.map((app) => {
                      const appData = getApplicationData(app);
                      return (
                        <div key={appData.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{appData.applicantName}</p>
                              <p className="text-sm text-muted-foreground">{appData.id}</p>
                            </div>
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
                          <div className="flex items-center justify-between pt-2 border-t">
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
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Income Verification</CardTitle>
                  <CardDescription>Review monthly income and employment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allApplications.map((app) => {
                      const appData = getApplicationData(app);
                      return (
                        <div key={appData.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{appData.applicantName}</p>
                            <p className="text-sm text-muted-foreground">{appData.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">${appData.monthlyIncome ? appData.monthlyIncome.toLocaleString() : 'N/A'}</p>
                            <Badge variant={appData.monthlyIncome && appData.monthlyIncome >= 5000 ? "default" : "secondary"}>
                              {appData.monthlyIncome && appData.monthlyIncome >= 5000 ? "Strong" : "Moderate"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
