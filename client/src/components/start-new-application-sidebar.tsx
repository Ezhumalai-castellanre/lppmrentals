import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';
import { dynamoDBSeparateTablesUtils } from '../lib/dynamodb-separate-tables-service';
import { 
  FileText, 
  UserCheck, 
  CalendarDays, 
  FolderOpen, 
  Users, 
  Shield, 
  Check,
  Play,
  ArrowRight,
  Plus,
  Clock,
  Wrench
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from '../components/ui/sidebar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

// Define the steps structure to match the application form
const APPLICATION_STEPS = [
  { id: 0, title: "Instructions", icon: FileText, description: "Read application instructions" },
  { id: 1, title: "Application Info", icon: FileText, description: "Basic rental information" },
  { id: 2, title: "Primary Applicant", icon: UserCheck, description: "Your personal information" },
  { id: 3, title: "Financial Info", icon: CalendarDays, description: "Income and financial details" },
  { id: 4, title: "Supporting Documents", icon: FolderOpen, description: "Required documentation" },
  { id: 5, title: "Guarantor", icon: Users, description: "Additional applicant details" },
{ id: 6, title: "Guarantor Financial", icon: CalendarDays, description: "Guarantor finances" },
{ id: 7, title: "Guarantor Documents", icon: FolderOpen, description: "Guarantor documents" },
  { id: 8, title: "Other Occupants", icon: Users, description: "Additional household members" },
  { id: 9, title: "Guarantor", icon: Shield, description: "Guarantor information" },
  { id: 10, title: "Guarantor Financial", icon: CalendarDays, description: "Guarantor finances" },
  { id: 11, title: "Guarantor Documents", icon: FolderOpen, description: "Guarantor documents" },
  { id: 12, title: "Digital Signatures", icon: Check, description: "Sign and submit" },
];

export function StartNewApplicationSidebar() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [hasExistingDraft, setHasExistingDraft] = useState(false);
  const [currentDraftStep, setCurrentDraftStep] = useState<number | null>(null);
  const [isCheckingDrafts, setIsCheckingDrafts] = useState(false);
  const [hasApplications, setHasApplications] = useState(false);
  const [hasSubmittedApplications, setHasSubmittedApplications] = useState(false);

  if (!user) {
    return null;
  }

  // Check for existing drafts when user changes
  useEffect(() => {
    const checkForExistingDrafts = async () => {
      if (!user) return;
      
      setIsCheckingDrafts(true);
      try {
        // Get all user data from separate tables
        const allData = await dynamoDBSeparateTablesUtils.getAllUserData();
        
        // Check if user has any data in any table
        const hasApplicationData = allData.application !== null;
        const hasApplicantData = allData.applicant !== null;
        const hasCoApplicantData = allData.coApplicant !== null;
        const hasGuarantorData = allData.guarantor !== null;
        
        const hasAnyApplications = hasApplicationData || hasApplicantData || hasCoApplicantData || hasGuarantorData;
        setHasApplications(hasAnyApplications);
        
        // Check for draft applications
        const hasDraft = (allData.application?.status === 'draft') || 
                        (allData.applicant?.status === 'draft') || 
                        (allData.coApplicant?.status === 'draft') || 
                        (allData.guarantor?.status === 'draft');
        setHasExistingDraft(hasDraft);
        
        // Check for submitted applications
        const submittedApps = [];
        if (allData.application?.status === 'submitted') submittedApps.push(allData.application);
        if (allData.applicant?.status === 'submitted') submittedApps.push(allData.applicant);
        if (allData.coApplicant?.status === 'submitted') submittedApps.push(allData.coApplicant);
        if (allData.guarantor?.status === 'submitted') submittedApps.push(allData.guarantor);
        
        setHasSubmittedApplications(submittedApps.length > 0);
        
        // Get the current step from the most recent draft
        if (hasDraft) {
          const draftSteps = [];
          if (allData.application?.status === 'draft') draftSteps.push(allData.application.current_step || 0);
          if (allData.applicant?.status === 'draft') draftSteps.push(allData.applicant.current_step || 0);
          if (allData.coApplicant?.status === 'draft') draftSteps.push(allData.coApplicant.current_step || 0);
          if (allData.guarantor?.status === 'draft') draftSteps.push(allData.guarantor.current_step || 0);
          
          if (draftSteps.length > 0) {
            const maxStep = Math.max(...draftSteps);
            setCurrentDraftStep(maxStep);
          } else {
            setCurrentDraftStep(null);
          }
        }
      } catch (error) {
        console.error('Error checking for existing drafts:', error);
        setHasExistingDraft(false);
      } finally {
        setIsCheckingDrafts(false);
      }
    };

    checkForExistingDrafts();
  }, [user]);

  // Handle starting a completely new application
  const handleStartNewApplication = () => {
    setLocation('/application');
  };

  // Handle continuing from current step
  const handleContinueFromStep = (step: number) => {
    setLocation(`/application?continue=true&step=${step}`);
  };

  // Handle going to a specific step
  const handleGoToStep = (step: number) => {
    setLocation(`/application?step=${step}`);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center px-2">
          <img 
            src="https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/image+(1).png" 
            alt="Logo" 
            className="h-12 w-40 object-contain md:mr-[76px] mr-[109px]"
          />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application Status</SidebarGroupLabel>
          <SidebarGroupContent>
            {hasExistingDraft && currentDraftStep !== null ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Continue Existing Application
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm">Current Step:</span>
                    <Badge variant="secondary">
                      Step {currentDraftStep + 1}
                    </Badge>
                  </div>
                  <Button 
                    onClick={() => handleContinueFromStep(currentDraftStep)}
                    className="w-full"
                    size="sm"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Continue from Step {currentDraftStep + 1}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Start New Application
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleStartNewApplication}
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Start New Application
                  </Button>
                </CardContent>
              </Card>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Application Steps</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {APPLICATION_STEPS.map((step) => {
                const isCurrentStep = currentDraftStep === step.id;
                const isCompleted = currentDraftStep !== null && currentDraftStep > step.id;
                
                return (
                  <SidebarMenuItem key={step.id}>
                    <SidebarMenuButton 
                      tooltip={`${step.title} - ${step.description}`}
                      onClick={() => handleGoToStep(step.id)}
                      className={`relative ${
                        isCurrentStep ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                      }`}
                    >
                      <step.icon className={`h-4 w-4 ${
                        isCurrentStep ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <span className="flex-1 text-left">{step.title}</span>
                      
                      {isCurrentStep && (
                        <Badge variant="default" className="ml-2 text-xs">
                          Current
                        </Badge>
                      )}
                      
                      {isCompleted && (
                        <Check className="h-4 w-4 text-green-500 ml-2" />
                      )}
                      
                      {!isCompleted && !isCurrentStep && (
                        <Play className="h-4 w-4 text-muted-foreground ml-2" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setLocation('/drafts')}>
                  <Clock className="h-4 w-4" />
                  <span>My Applications</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Only show Missing Documents when there are submitted applications */}
              {hasSubmittedApplications && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setLocation('/missing-documents')}>
                    <FileText className="h-4 w-4" />
                    <span>Missing Documents</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {/* Only show Maintenance when there are submitted applications */}
              {hasSubmittedApplications && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setLocation('/maintenance')}>
                    <Wrench className="h-4 w-4" />
                    <span>Maintenance</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
