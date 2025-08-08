import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import DynamoDBService, { DraftData } from '@/lib/dynamodb-service';

interface UseDraftOptions {
  autoSaveInterval?: number; // in milliseconds
  enableAutoSave?: boolean;
  onDraftLoaded?: (draft: DraftData) => void;
  onDraftSaved?: (draft: DraftData) => void;
}

export function useDraft(options: UseDraftOptions = {}) {
  const {
    autoSaveInterval = 30000, // 30 seconds default
    enableAutoSave = true,
    onDraftLoaded,
    onDraftSaved,
  } = options;

  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<DraftData | null>(null);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFormDataRef = useRef<any>(null);

  // Load draft on mount
  useEffect(() => {
    if (user?.applicantId) {
      loadDraft();
    }
  }, [user?.applicantId]);

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !user?.applicantId || !hasUnsavedChanges) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (hasUnsavedChanges && lastFormDataRef.current) {
        saveDraft(lastFormDataRef.current, currentDraft?.currentStep || 0, false);
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, user?.applicantId, enableAutoSave, autoSaveInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const loadDraft = useCallback(async () => {
    if (!user?.applicantId) {
      console.log('No applicantId available for loading draft');
      return null;
    }

    setIsLoading(true);
    try {
      const draft = await DynamoDBService.loadDraft(user.applicantId);
      
      if (draft) {
        setCurrentDraft(draft);
        setLastSaved(draft.lastSaved);
        setHasUnsavedChanges(false);
        
        // Call callback if provided
        if (onDraftLoaded) {
          onDraftLoaded(draft);
        }

        toast({
          title: 'Draft Loaded',
          description: `Resuming from step ${draft.currentStep + 1}`,
        });

        return draft;
      } else {
        console.log('No existing draft found');
        return null;
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast({
        title: 'Error Loading Draft',
        description: 'Failed to load your saved draft. Starting fresh.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.applicantId, onDraftLoaded, toast]);

  const saveDraft = useCallback(async (
    formData: any, 
    currentStep: number, 
    isComplete: boolean = false,
    showToast: boolean = true
  ) => {
    if (!user?.applicantId) {
      console.log('No applicantId available for saving draft');
      return;
    }

    setIsSaving(true);
    try {
      const draftData: DraftData = {
        applicantId: user.applicantId,
        form_data: formData,
        currentStep,
        lastSaved: new Date().toISOString(),
        isComplete,
      };

      await DynamoDBService.saveDraft(user.applicantId, formData, currentStep, isComplete);
      
      setCurrentDraft(draftData);
      setLastSaved(draftData.lastSaved);
      setHasUnsavedChanges(false);
      lastFormDataRef.current = formData;

      // Call callback if provided
      if (onDraftSaved) {
        onDraftSaved(draftData);
      }

      if (showToast) {
        toast({
          title: 'Draft Saved',
          description: 'Your progress has been saved automatically.',
        });
      }

      return draftData;
    } catch (error) {
      console.error('Error saving draft:', error);
      if (showToast) {
        toast({
          title: 'Error Saving Draft',
          description: 'Failed to save your progress. Please try again.',
          variant: 'destructive',
        });
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [user?.applicantId, onDraftSaved, toast]);

  const updateFormData = useCallback((newFormData: any) => {
    lastFormDataRef.current = newFormData;
    setHasUnsavedChanges(true);
  }, []);

  const deleteDraft = useCallback(async () => {
    if (!user?.applicantId) {
      return;
    }

    try {
      await DynamoDBService.deleteDraft(user.applicantId);
      setCurrentDraft(null);
      setLastSaved(null);
      setHasUnsavedChanges(false);
      lastFormDataRef.current = null;
      
      toast({
        title: 'Draft Deleted',
        description: 'Your saved draft has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: 'Error Deleting Draft',
        description: 'Failed to delete your draft.',
        variant: 'destructive',
      });
    }
  }, [user?.applicantId, toast]);

  const checkDraftExists = useCallback(async () => {
    if (!user?.applicantId) {
      return false;
    }

    try {
      return await DynamoDBService.draftExists(user.applicantId);
    } catch (error) {
      console.error('Error checking draft existence:', error);
      return false;
    }
  }, [user?.applicantId]);

  const getDraftMetadata = useCallback(async () => {
    if (!user?.applicantId) {
      return null;
    }

    try {
      return await DynamoDBService.getDraftMetadata(user.applicantId);
    } catch (error) {
      console.error('Error getting draft metadata:', error);
      return null;
    }
  }, [user?.applicantId]);

  return {
    // State
    isLoading,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    currentDraft,
    
    // Actions
    loadDraft,
    saveDraft,
    updateFormData,
    deleteDraft,
    checkDraftExists,
    getDraftMetadata,
    
    // Utilities
    clearUnsavedChanges: () => setHasUnsavedChanges(false),
  };
} 