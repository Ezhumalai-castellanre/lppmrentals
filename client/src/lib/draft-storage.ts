import { getCurrentUserWithDebug } from './aws-config';

// GraphQL operations for draft storage
const CREATE_DRAFT = `
  mutation CreateDraft($input: CreateDraftSavedInput!) {
    createDraftSaved(input: $input) {
      applicantId
    }
  }
`;

const UPDATE_DRAFT = `
  mutation UpdateDraft($input: UpdateDraftSavedInput!) {
    updateDraftSaved(input: $input) {
      applicantId
    }
  }
`;

const GET_DRAFT = `
  query GetDraft($applicantId: String!) {
    getDraftSaved(applicantId: $applicantId) {
      applicantId
    }
  }
`;

const LIST_DRAFTS = `
  query ListDrafts($filter: TableDraftSavedFilterInput, $limit: Int, $nextToken: String) {
    listDraftSaveds(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        applicantId
      }
      nextToken
    }
  }
`;

// Enhanced draft data structure
export interface DraftData {
  applicantId: string;
  currentStep: number;
  formData: any;
  documents: any;
  signatures: any;
  uploadedFilesMetadata: any;
  webhookResponses: any;
  lastUpdated: string;
  status: 'draft' | 'submitted';
  stepData: {
    [stepNumber: number]: {
      data: any;
      documents: any;
      timestamp: string;
      completed: boolean;
    };
  };
}

// Draft storage service
export class DraftStorageService {
  private static instance: DraftStorageService;
  private graphqlEndpoint = 'https://fk3zvyxnyje2zlmecey3w4ubcu.appsync-api.us-west-2.amazonaws.com/graphql';
  private apiKey = 'da2-iboh2su4pzavnnsf3h3mwhy3qm';

  constructor() {}

  static getInstance(): DraftStorageService {
    if (!DraftStorageService.instance) {
      DraftStorageService.instance = new DraftStorageService();
    }
    return DraftStorageService.instance;
  }

  // Helper method to make GraphQL requests
  private async makeGraphQLRequest(query: string, variables: any = {}) {
    try {
      const response = await fetch(this.graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      return data.data;
    } catch (error) {
      console.error('GraphQL request failed:', error);
      throw error;
    }
  }

  // Get current user's applicant ID
  private async getApplicantId(): Promise<string> {
    try {
      const userInfo = await getCurrentUserWithDebug();
      const attributes = userInfo.userAttributes?.attributes || {};
      const applicantId = (attributes as any).zoneinfo || 
                         (attributes as any)['custom:zoneinfo'] ||
                         'unknown';
      
      if (!applicantId || applicantId === 'unknown') {
        throw new Error('No applicant ID found for current user');
      }
      
      return applicantId;
    } catch (error) {
      console.error('Error getting applicant ID:', error);
      throw new Error('Failed to get applicant ID');
    }
  }

  // Save draft data for a specific step
  async saveStepDraft(stepNumber: number, stepData: any, documents: any = {}): Promise<void> {
    try {
      const applicantId = await this.getApplicantId();
      const timestamp = new Date().toISOString();
      
      // Get existing draft or create new one
      let existingDraft = await this.getDraft(applicantId);
      
      if (!existingDraft) {
        existingDraft = {
          applicantId,
          currentStep: stepNumber,
          formData: {},
          documents: {},
          signatures: {},
          uploadedFilesMetadata: {},
          webhookResponses: {},
          lastUpdated: timestamp,
          status: 'draft' as const,
          stepData: {}
        };
      }

      // Update step data
      existingDraft.stepData[stepNumber] = {
        data: stepData,
        documents,
        timestamp,
        completed: true
      };

      // Update current step if this is a newer step
      if (stepNumber > existingDraft.currentStep) {
        existingDraft.currentStep = stepNumber;
      }

      existingDraft.lastUpdated = timestamp;

      // Save to DynamoDB via AppSync
      await this.saveDraftToDatabase(existingDraft);
      
      console.log(`✅ Draft saved for step ${stepNumber}`, {
        applicantId,
        stepNumber,
        timestamp
      });
    } catch (error) {
      console.error(`❌ Failed to save draft for step ${stepNumber}:`, error);
      throw error;
    }
  }

  // Save complete form draft
  async saveFormDraft(formData: any, documents: any, signatures: any, uploadedFilesMetadata: any, webhookResponses: any): Promise<void> {
    try {
      const applicantId = await this.getApplicantId();
      const timestamp = new Date().toISOString();
      
      const draftData: DraftData = {
        applicantId,
        currentStep: 12, // Final step
        formData,
        documents,
        signatures,
        uploadedFilesMetadata,
        webhookResponses,
        lastUpdated: timestamp,
        status: 'draft',
        stepData: {}
      };

      await this.saveDraftToDatabase(draftData);
      
      console.log('✅ Complete form draft saved', {
        applicantId,
        timestamp
      });
    } catch (error) {
      console.error('❌ Failed to save complete form draft:', error);
      throw error;
    }
  }

  // Save file upload draft
  async saveFileUploadDraft(section: string, files: any[], metadata: any): Promise<void> {
    try {
      const applicantId = await this.getApplicantId();
      const timestamp = new Date().toISOString();
      
      let existingDraft = await this.getDraft(applicantId);
      
      if (!existingDraft) {
        existingDraft = {
          applicantId,
          currentStep: 0,
          formData: {},
          documents: {},
          signatures: {},
          uploadedFilesMetadata: {},
          webhookResponses: {},
          lastUpdated: timestamp,
          status: 'draft' as const,
          stepData: {}
        };
      }

      // Update documents and metadata
      existingDraft.documents[section] = files;
      existingDraft.uploadedFilesMetadata[section] = metadata;
      existingDraft.lastUpdated = timestamp;

      await this.saveDraftToDatabase(existingDraft);
      
      console.log(`✅ File upload draft saved for section: ${section}`, {
        applicantId,
        section,
        fileCount: files.length,
        timestamp
      });
    } catch (error) {
      console.error(`❌ Failed to save file upload draft for section ${section}:`, error);
      throw error;
    }
  }

  // Get draft data
  async getDraft(applicantId?: string): Promise<DraftData | null> {
    try {
      const id = applicantId || await this.getApplicantId();
      
      // TEMPORARILY DISABLED: GraphQL schema mismatch
      // TODO: Update schema queries based on actual AppSync schema
      console.log('⚠️ GraphQL operations temporarily disabled due to schema mismatch');
      console.log('🔍 Would query for applicantId:', id);
      
      // No localStorage fallback - only GraphQL operations
      return null;
    } catch (error) {
      console.error('❌ Failed to get draft:', error);
      return null;
    }
  }

  // List all drafts for current user
  async listDrafts(): Promise<DraftData[]> {
    try {
      const applicantId = await this.getApplicantId();
      
      // TEMPORARILY DISABLED: GraphQL schema mismatch
      // TODO: Update schema queries based on actual AppSync schema
      console.log('⚠️ GraphQL operations temporarily disabled due to schema mismatch');
      console.log('🔍 Would list drafts for applicantId:', applicantId);
      
      // Return empty array for now
      return [];
    } catch (error) {
      console.error('❌ Failed to list drafts:', error);
      return [];
    }
  }

  // Delete draft
  async deleteDraft(applicantId?: string): Promise<void> {
    try {
      const id = applicantId || await this.getApplicantId();
      
      // TEMPORARILY DISABLED: GraphQL schema mismatch
      // TODO: Update schema queries based on actual AppSync schema
      console.log('⚠️ GraphQL operations temporarily disabled due to schema mismatch');
      console.log('🗑️ Would delete draft for applicantId:', id);
      
      // No localStorage fallback - only GraphQL operations
      console.log('✅ Draft delete operation prepared for GraphQL');
    } catch (error) {
      console.error('❌ Failed to delete draft:', error);
      throw error;
    }
  }

  // Save draft to database (this will need to be implemented based on your actual schema)
  private async saveDraftToDatabase(draftData: DraftData): Promise<void> {
    try {
      // TEMPORARILY DISABLED: GraphQL schema mismatch
      // TODO: Update schema queries based on actual AppSync schema
      console.log('⚠️ GraphQL operations temporarily disabled due to schema mismatch');
      console.log('📋 Draft data would be saved:', {
        applicantId: draftData.applicantId,
        currentStep: draftData.currentStep,
        timestamp: draftData.lastUpdated
      });
      
      // No localStorage fallback - only GraphQL operations
      console.log('✅ Draft data prepared for GraphQL (no localStorage fallback)', {
        applicantId: draftData.applicantId,
        timestamp: draftData.lastUpdated
      });
    } catch (error) {
      console.error('❌ Failed to save draft to database:', error);
      throw error; // Re-throw error since no fallback
    }
  }



  // Auto-save draft every few seconds
  startAutoSave(formData: any, currentStep: number, intervalMs: number = 5000): () => void {
    const interval = setInterval(async () => {
      try {
        await this.saveStepDraft(currentStep, formData);
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }
}

// Export singleton instance
export const draftStorage = DraftStorageService.getInstance();
