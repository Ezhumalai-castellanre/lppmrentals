import { useState, useEffect, useCallback, useRef } from 'react';
import { draftStorage, DraftData } from '@/lib/draft-storage';
import { useAuth } from './use-auth';

export interface UseDraftStorageReturn {
  // Draft data
  currentDraft: DraftData | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  saveStepDraft: (stepNumber: number, stepData: any, documents?: any) => Promise<void>;
  saveFormDraft: (formData: any, documents: any, signatures: any, uploadedFilesMetadata: any, webhookResponses: any) => Promise<void>;
  saveFileUploadDraft: (section: string, files: any[], metadata: any) => Promise<void>;
  loadDraft: () => Promise<void>;
  deleteDraft: () => Promise<void>;
  restoreDraft: () => Promise<boolean>;
  
  // Auto-save
  startAutoSave: (formData: any, currentStep: number) => void;
  stopAutoSave: () => void;
  
  // Status
  hasUnsavedChanges: boolean;
  lastSaved: string | null;
  isAutoSaving: boolean;
}

export function useDraftStorage(): UseDraftStorageReturn {
  const { user } = useAuth();
  const [currentDraft, setCurrentDraft] = useState<DraftData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFormDataRef = useRef<any>(null);

  // Load draft when user changes
  useEffect(() => {
    if (user) {
      loadDraft();
    } else {
      setCurrentDraft(null);
      setError(null);
    }
  }, [user]);

  // Cleanup auto-save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  const loadDraft = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const draft = await draftStorage.getDraft();
      if (draft) {
        setCurrentDraft(draft);
        setLastSaved(draft.lastUpdated);
        setHasUnsavedChanges(false);
        console.log('📋 Draft loaded successfully:', draft);
      } else {
        // No fallback storage - draft not found
        console.log('📋 No draft found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load draft';
      setError(errorMessage);
      console.error('❌ Error loading draft:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const saveStepDraft = useCallback(async (stepNumber: number, stepData: any, documents: any = {}) => {
    if (!user) return;
    
    try {
      setError(null);
      await draftStorage.saveStepDraft(stepNumber, stepData, documents);
      
      // Update local state
      setLastSaved(new Date().toISOString());
      setHasUnsavedChanges(false);
      
      // Reload draft to get updated data
      await loadDraft();
      
      console.log(`✅ Step ${stepNumber} draft saved successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save step draft';
      setError(errorMessage);
      console.error(`❌ Error saving step ${stepNumber} draft:`, err);
      throw err;
    }
  }, [user, loadDraft]);

  const saveFormDraft = useCallback(async (formData: any, documents: any, signatures: any, uploadedFilesMetadata: any, webhookResponses: any) => {
    if (!user) return;
    
    try {
      setError(null);
      await draftStorage.saveFormDraft(formData, documents, signatures, uploadedFilesMetadata, webhookResponses);
      
      // Update local state
      setLastSaved(new Date().toISOString());
      setHasUnsavedChanges(false);
      
      // Reload draft to get updated data
      await loadDraft();
      
      console.log('✅ Complete form draft saved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save form draft';
      setError(errorMessage);
      console.error('❌ Error saving form draft:', err);
      throw err;
    }
  }, [user, loadDraft]);

  const saveFileUploadDraft = useCallback(async (section: string, files: any[], metadata: any) => {
    if (!user) return;
    
    try {
      setError(null);
      await draftStorage.saveFileUploadDraft(section, files, metadata);
      
      // Update local state
      setLastSaved(new Date().toISOString());
      setHasUnsavedChanges(false);
      
      // Reload draft to get updated data
      await loadDraft();
      
      console.log(`✅ File upload draft saved for section: ${section}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save file upload draft';
      setError(errorMessage);
      console.error(`❌ Error saving file upload draft for section ${section}:`, err);
      throw err;
    }
  }, [user, loadDraft]);

  const deleteDraft = useCallback(async () => {
    if (!user) return;
    
    try {
      setError(null);
      await draftStorage.deleteDraft();
      
      // Clear local state
      setCurrentDraft(null);
      setLastSaved(null);
      setHasUnsavedChanges(false);
      
      console.log('✅ Draft deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete draft';
      setError(errorMessage);
      console.error('❌ Error deleting draft:', err);
      throw err;
    }
  }, [user]);

  const restoreDraft = useCallback(async (): Promise<boolean> => {
    if (!user || !currentDraft) return false;
    
    try {
      // This would restore the draft data to the form
      // Implementation depends on how you want to handle restoration
      console.log('🔄 Draft restoration requested:', currentDraft);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore draft';
      setError(errorMessage);
      console.error('❌ Error restoring draft:', err);
      return false;
    }
  }, [user, currentDraft]);

  const startAutoSave = useCallback((formData: any, currentStep: number) => {
    if (!user) return;
    
    // Stop existing auto-save
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }
    
    // Start new auto-save
    setIsAutoSaving(true);
    autoSaveIntervalRef.current = setInterval(async () => {
      try {
        // Check if form data has changed
        if (JSON.stringify(formData) !== JSON.stringify(lastFormDataRef.current)) {
          await saveStepDraft(currentStep, formData);
          lastFormDataRef.current = JSON.parse(JSON.stringify(formData));
        }
      } catch (err) {
        console.warn('Auto-save failed:', err);
      }
    }, 5000); // Auto-save every 5 seconds
    
    console.log('🔄 Auto-save started for step:', currentStep);
  }, [user, saveStepDraft]);

  const stopAutoSave = useCallback(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
      setIsAutoSaving(false);
      console.log('🛑 Auto-save stopped');
    }
  }, []);

  // Mark form as having unsaved changes
  const markAsUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Expose markAsUnsaved for external use
  useEffect(() => {
    // This allows parent components to mark the form as having unsaved changes
    (window as any).markFormAsUnsaved = markAsUnsaved;
    
    return () => {
      delete (window as any).markFormAsUnsaved;
    };
  }, [markAsUnsaved]);

  return {
    // Draft data
    currentDraft,
    isLoading,
    error,
    
    // Actions
    saveStepDraft,
    saveFormDraft,
    saveFileUploadDraft,
    loadDraft,
    deleteDraft,
    restoreDraft,
    
    // Auto-save
    startAutoSave,
    stopAutoSave,
    
    // Status
    hasUnsavedChanges,
    lastSaved,
    isAutoSaving,
  };
}
