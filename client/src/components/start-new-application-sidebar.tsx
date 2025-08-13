import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { dynamoDBService } from '@/lib/dynamodb-service';
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define the steps structure to match the application form
const APPLICATION_STEPS = [
  { id: 0, title: "Instructions", icon: FileText, description: "Read application instructions" },
  { id: 1, title: "Application Info", icon: FileText, description: "Basic rental information" },
  { id: 2, title: "Primary Applicant", icon: UserCheck, description: "Your personal information" },
  { id: 3, title: "Financial Info", icon: CalendarDays, description: "Income and financial details" },
  { id: 4, title: "Supporting Documents", icon: FolderOpen, description: "Required documentation" },
  { id: 5, title: "Co-Applicant", icon: Users, description: "Additional applicant details" },
  { id: 6, title: "Co-Applicant Financial", icon: CalendarDays, description: "Co-applicant finances" },
  { id: 7, title: "Co-Applicant Documents", icon: FolderOpen, description: "Co-applicant documents" },
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
        // Check if user has existing drafts
        const userZoneinfo = user.zoneinfo || user.applicantId;
        if (userZoneinfo) {
          const drafts = await dynamoDBService.getAllDrafts(userZoneinfo);
          const hasDraft = drafts && drafts.length > 0 && drafts.some(draft => draft.status === 'draft');
          setHasExistingDraft(hasDraft);
          
          // Set hasApplications to true if there are any applications (draft or submitted)
          const hasAnyApplications = drafts && drafts.length > 0;
          setHasApplications(hasAnyApplications);
          
          // Set hasSubmittedApplications to true only if there are submitted applications
          const submittedApps = drafts?.filter(draft => draft.status === 'submitted') || [];
          setHasSubmittedApplications(submittedApps.length > 0);
          
          // Get the current step from the most recent draft
          if (hasDraft) {
            const draftDrafts = drafts.filter(draft => draft.status === 'draft');
            
            if (draftDrafts.length > 0) {
              const mostRecentDraft = draftDrafts
                .sort((a, b) => new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime())[0];
              
              if (mostRecentDraft && mostRecentDraft.current_step !== undefined) {
                setCurrentDraftStep(mostRecentDraft.current_step);
              } else {
                setCurrentDraftStep(null);
              }
            } else {
              setCurrentDraftStep(null);
            }
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
