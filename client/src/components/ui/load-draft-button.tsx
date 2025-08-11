import React, { useState } from 'react';
import { Button } from './button';
import { Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { DraftService } from '../../lib/draft-service';
import { useToast } from '../../hooks/use-toast';

interface LoadDraftButtonProps {
  applicantId: string;
  onLoad: (formData: any) => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  showMetadata?: boolean;
}

export function LoadDraftButton({
  applicantId,
  onLoad,
  className = '',
  variant = 'outline',
  size = 'default',
  disabled = false,
  showMetadata = true,
}: LoadDraftButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [draftMetadata, setDraftMetadata] = useState<{ lastUpdated: string; dataSize: number } | null>(null);
  const [hasCheckedDraft, setHasCheckedDraft] = useState(false);
  const { toast } = useToast();

  // Check for draft existence on mount
  React.useEffect(() => {
    if (applicantId && !hasCheckedDraft) {
      checkDraftExistence();
    }
  }, [applicantId, hasCheckedDraft]);

  const checkDraftExistence = async () => {
    try {
      const metadata = await DraftService.getDraftMetadata(applicantId);
      setDraftMetadata(metadata);
      setHasCheckedDraft(true);
    } catch (error) {
      console.error('Failed to check draft existence:', error);
      setHasCheckedDraft(true);
    }
  };

  const handleLoadDraft = async () => {
    if (!applicantId) {
      toast({
        title: "Error",
        description: "Missing applicant ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const draft = await DraftService.loadDraft(applicantId);
      
      if (draft && draft.formData) {
        onLoad(draft.formData);
        
        toast({
          title: "Success",
          description: `Draft loaded successfully (${(draft.dataSize || 0 / 1024).toFixed(1)} KB)`,
          variant: "default",
        });
      } else {
        toast({
          title: "No Draft Found",
          description: "No saved draft was found for this applicant",
          variant: "secondary",
        });
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load draft",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  };

  if (!hasCheckedDraft) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={true}
      >
        <Clock className="w-4 h-4 animate-spin" />
        <span className="ml-2">Checking...</span>
      </Button>
    );
  }

  if (!draftMetadata) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={true}
      >
        <AlertCircle className="w-4 h-4" />
        <span className="ml-2">No Draft Available</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleLoadDraft}
        disabled={disabled || isLoading}
        variant={variant}
        size={size}
        className={className}
      >
        {isLoading ? (
          <Download className="w-4 h-4 animate-pulse" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span className="ml-2">
          {isLoading ? 'Loading...' : 'Load Draft'}
        </span>
      </Button>
      
      {showMetadata && draftMetadata && (
        <div className="text-xs text-muted-foreground">
          <div>Last saved: {formatDate(draftMetadata.lastUpdated)}</div>
          <div>Size: {formatFileSize(draftMetadata.dataSize)}</div>
        </div>
      )}
    </div>
  );
}

export default LoadDraftButton;
