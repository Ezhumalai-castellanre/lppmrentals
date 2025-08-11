import React, { useState } from 'react';
import { Button } from './button';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import { DraftService } from '../../lib/draft-service';
import { useToast } from '../../hooks/use-toast';

interface SaveDraftButtonProps {
  applicantId: string;
  formData: any;
  onSave?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

export function SaveDraftButton({
  applicantId,
  formData,
  onSave,
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false,
}: SaveDraftButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();

  const handleSaveDraft = async () => {
    if (!applicantId || !formData) {
      toast({
        title: "Error",
        description: "Missing applicant ID or form data",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await DraftService.saveDraft(applicantId, formData);
      
      setLastSaved(new Date());
      
      toast({
        title: "Success",
        description: `Draft saved successfully (${(response.dataSize / 1024).toFixed(1)} KB)`,
        variant: "default",
      });

      // Call the optional onSave callback
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save draft",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getButtonText = () => {
    if (isSaving) return 'Saving...';
    if (lastSaved) return 'Saved!';
    return 'Save Draft';
  };

  const getButtonIcon = () => {
    if (isSaving) return <Save className="w-4 h-4 animate-pulse" />;
    if (lastSaved) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <Save className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSaveDraft}
        disabled={disabled || isSaving}
        variant={variant}
        size={size}
        className={className}
      >
        {getButtonIcon()}
        <span className="ml-2">{getButtonText()}</span>
      </Button>
      
      {lastSaved && (
        <span className="text-xs text-muted-foreground">
          Last saved: {lastSaved.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

export default SaveDraftButton;
