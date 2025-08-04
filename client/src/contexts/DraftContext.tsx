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
      localStorage.setItem('rentalApplicationDraft', JSON.stringify(draftData));
      setIsDraftSaved(true);
      setDraftSavedAt(new Date());
      document.title = `📝 Draft - Rental Application | LPPM Rentals`;
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