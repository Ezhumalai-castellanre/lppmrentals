export interface DraftData {
  applicantId: string;
  formData: any;
  lastUpdated?: string;
  dataSize?: number;
}

export interface SaveDraftResponse {
  message: string;
  dataSize: number;
}

export class DraftService {
  private static readonly API_BASE = import.meta.env.DEV 
    ? 'http://localhost:5002' 
    : '/.netlify/functions';

  /**
   * Save draft data to DynamoDB
   */
  static async saveDraft(applicantId: string, formData: any): Promise<SaveDraftResponse> {
    try {
      const endpoint = import.meta.env.DEV ? '/api/drafts' : '/save-draft';
      const fullUrl = `${this.API_BASE}${endpoint}`;
      
      console.log('🔄 Saving draft to:', fullUrl);
      console.log('📊 Draft data size:', JSON.stringify(formData).length, 'bytes');
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicantId,
          formData,
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving draft:', error);
      throw new Error(`Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load draft data from DynamoDB
   */
  static async loadDraft(applicantId: string): Promise<DraftData | null> {
    try {
      const endpoint = import.meta.env.DEV 
        ? `/api/drafts/${encodeURIComponent(applicantId)}` 
        : `/load-draft?applicantId=${encodeURIComponent(applicantId)}`;
      const fullUrl = `${this.API_BASE}${endpoint}`;
      
      console.log('🔄 Loading draft from:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Load response status:', response.status);

      if (response.status === 404) {
        return null; // No draft found
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading draft:', error);
      throw new Error(`Failed to load draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a draft exists for the given applicant
   */
  static async draftExists(applicantId: string): Promise<boolean> {
    try {
      const draft = await this.loadDraft(applicantId);
      return draft !== null;
    } catch (error) {
      console.error('Error checking draft existence:', error);
      return false;
    }
  }

  /**
   * Get draft metadata (last updated, size) without loading full data
   */
  static async getDraftMetadata(applicantId: string): Promise<{ lastUpdated: string; dataSize: number } | null> {
    try {
      const draft = await this.loadDraft(applicantId);
      if (draft) {
        return {
          lastUpdated: draft.lastUpdated || '',
          dataSize: draft.dataSize || 0,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting draft metadata:', error);
      return null;
    }
  }

  /**
   * Delete a draft (if needed in the future)
   */
  static async deleteDraft(applicantId: string): Promise<void> {
    // This would require implementing a delete-draft function
    // For now, we'll just overwrite with empty data
    try {
      await this.saveDraft(applicantId, {});
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw new Error(`Failed to delete draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default DraftService;
