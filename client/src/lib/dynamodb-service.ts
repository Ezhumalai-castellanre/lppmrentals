// Client-side DynamoDB service that uses API calls to Netlify functions

// API endpoints
const API_BASE = '/.netlify/functions';
const SAVE_DRAFT_ENDPOINT = `${API_BASE}/save-draft`;
const LOAD_DRAFT_ENDPOINT = `${API_BASE}/load-draft`;
const DELETE_DRAFT_ENDPOINT = `${API_BASE}/delete-draft`;

export interface UploadedDocument {
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
  webhook_response: any;
  extracted_url: string;
  webhook_status: 'success' | 'error';
  webhook_status_code: number;
  comment_id?: string;
}

export interface DraftData {
  applicantId: string;
  form_data?: {
    uploadedFiles?: {
      [sectionName: string]: UploadedDocument[];
    };
    [key: string]: any;
  };
  formData?: {
    uploadedFiles?: {
      [sectionName: string]: UploadedDocument[];
    };
    [key: string]: any;
  };
  currentStep: number;
  lastSaved: string;
  isComplete: boolean;
}

export class DynamoDBService {
  /**
   * Save draft data via API call
   */
  static async saveDraft(applicantId: string, formData: any, currentStep: number, isComplete: boolean = false): Promise<void> {
    try {
      console.log('🔄 Saving draft for applicantId:', applicantId);
      
      const response = await fetch(SAVE_DRAFT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicantId,
          form_data: formData,
          currentStep,
          isComplete,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Draft saved successfully for applicantId:', applicantId);
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      throw new Error(`Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load draft data via API call
   */
  static async loadDraft(applicantId: string): Promise<DraftData | null> {
    try {
      const response = await fetch(`${LOAD_DRAFT_ENDPOINT}?applicantId=${encodeURIComponent(applicantId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      // Handle new response structure where draft data is returned directly
      if (result && (result.form_data || result.formData)) {
        console.log('✅ Draft loaded successfully for applicantId:', applicantId);
        return result as DraftData;
      } else {
        console.log('ℹ️ No draft found for applicantId:', applicantId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading draft:', error);
      throw new Error(`Failed to load draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete draft data via API call
   */
  static async deleteDraft(applicantId: string): Promise<void> {
    try {
      const response = await fetch(DELETE_DRAFT_ENDPOINT, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicantId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      console.log('✅ Draft deleted successfully for applicantId:', applicantId);
    } catch (error) {
      console.error('❌ Error deleting draft:', error);
      throw new Error(`Failed to delete draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if draft exists
   */
  static async draftExists(applicantId: string): Promise<boolean> {
    try {
      const draft = await this.loadDraft(applicantId);
      return draft !== null;
    } catch (error) {
      console.error('❌ Error checking draft existence:', error);
      return false;
    }
  }

  /**
   * Get draft metadata (without full form data)
   */
  static async getDraftMetadata(applicantId: string): Promise<{ currentStep: number; lastSaved: string; isComplete: boolean } | null> {
    try {
      const draft = await this.loadDraft(applicantId);
      if (draft) {
        return {
          currentStep: draft.currentStep,
          lastSaved: draft.lastSaved,
          isComplete: draft.isComplete,
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting draft metadata:', error);
      return null;
    }
  }
}

export default DynamoDBService; 