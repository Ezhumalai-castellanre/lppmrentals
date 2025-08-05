import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DraftContextType {
  isDraftSaved: boolean;
  draftSavedAt: Date | null;
  saveDraft: (draftData?: any) => void;
  clearDraft: () => void;
  setIsDraftSaved: (saved: boolean) => void;
  setDraftSavedAt: (date: Date | null) => void;
  setSaveDraftHandler: (handler: () => void) => void;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export const useDraft = () => {
  const context = useContext(DraftContext);
  if (context === undefined) {
    throw new Error('useDraft must be used within a DraftProvider');
  }
  return context;
};

interface DraftProviderProps {
  children: ReactNode;
}

export const DraftProvider: React.FC<DraftProviderProps> = ({ children }) => {
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [saveDraftHandler, setSaveDraftHandler] = useState<(() => void) | null>(null);

  const saveDraft = (draftData?: any) => {
    if (draftData) {
      try {
        // Use a custom replacer function to handle circular references
        const safeStringify = (obj: any): string => {
          const seen = new WeakSet();
          return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[Circular Reference]';
              }
              seen.add(value);
            }
            // Filter out non-serializable values
            if (value instanceof File || value instanceof Blob) {
              return '[File Object]';
            }
            if (typeof value === 'function') {
              return '[Function]';
            }
            if (value && typeof value === 'object' && value.nodeType) {
              return '[DOM Element]';
            }
            return value;
          });
        };

        localStorage.setItem('rentalApplicationDraft', safeStringify(draftData));
        setIsDraftSaved(true);
        setDraftSavedAt(new Date());
        document.title = `📝 Draft - Rental Application | LPPM Rentals`;
      } catch (error) {
        console.error('Failed to save draft:', error);
        // Fallback: try to save a minimal version
        try {
          const minimalDraft = {
            currentStep: draftData.currentStep,
            hasCoApplicant: draftData.hasCoApplicant,
            hasGuarantor: draftData.hasGuarantor,
            sameAddressGuarantor: draftData.sameAddressGuarantor,
            savedAt: draftData.savedAt,
          };
          localStorage.setItem('rentalApplicationDraft', JSON.stringify(minimalDraft));
          setIsDraftSaved(true);
          setDraftSavedAt(new Date());
          document.title = `📝 Draft - Rental Application | LPPM Rentals`;
        } catch (fallbackError) {
          console.error('Failed to save even minimal draft:', fallbackError);
        }
      }
    } else if (saveDraftHandler) {
      saveDraftHandler();
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('rentalApplicationDraft');
    setIsDraftSaved(false);
    setDraftSavedAt(null);
    document.title = `Rental Application | LPPM Rentals`;
  };

  const value = {
    isDraftSaved,
    draftSavedAt,
    saveDraft,
    clearDraft,
    setIsDraftSaved,
    setDraftSavedAt,
    setSaveDraftHandler,
  };

  return (
    <DraftContext.Provider value={value}>
      {children}
    </DraftContext.Provider>
  );
}; 