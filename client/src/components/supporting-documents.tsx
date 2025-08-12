import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileUpload } from "./ui/file-upload";
import { Badge } from "./ui/badge";
import { CheckCircle, AlertCircle, FileText, DollarSign, Building, User, CreditCard, Shield, UserCheck, Building2, Briefcase, GraduationCap, Eye, Download, X, Upload } from "lucide-react";
import { type EncryptedFile } from "@/lib/file-encryption";
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';

interface DocumentInfo {
  id: string;
  name: string;
  required: boolean;
  acceptedTypes: string;
  multiple?: boolean;
}

interface CategoryInfo {
  category: string;
  icon: JSX.Element;
  documents: DocumentInfo[];
}

interface DocumentStatus {
  status: "uploaded" | "pending";
  count: number;
}

interface SupportingDocumentsProps {
  formData: {
    documents?: {
      applicant?: Record<string, Array<{ filename: string; webhookbodyUrl: string }>>;
      coApplicant?: Record<string, Array<{ filename: string; webhookbodyUrl: string }>>;
      guarantor?: Record<string, Array<{ filename: string; webhookbodyUrl: string }>>;
      otherOccupants?: Record<string, Array<{ filename: string; webhookbodyUrl: string }>>;
    };
    webhookResponses?: Record<string, any>;
    encryptedDocuments?: {
      applicant?: Record<string, any[]>;
      guarantor?: Record<string, any[]>;
      coApplicant?: Record<string, any[]>;
    };
    applicant?: { employmentType?: string };
    coApplicant?: { employmentType?: string };
    guarantor?: { employmentType?: string };
    otherOccupants?: any[];
    uploadedFilesMetadata?: Record<string, any[]>;
  };
  onDocumentChange: (documentType: string, files: File[]) => void;
  onEncryptedDocumentChange?: (documentType: string, encryptedFiles: EncryptedFile[]) => void;
  onWebhookResponse?: (documentType: string, response: any) => void;
  referenceId?: string;
  enableWebhook?: boolean;
  applicationId?: string;
  applicantId?: string;
  zoneinfo?: string;
  showOnlyCoApplicant?: boolean;
  showOnlyGuarantor?: boolean;
  showOnlyApplicant?: boolean;
}

export const SupportingDocuments = ({
  formData,
  onDocumentChange,
  onEncryptedDocumentChange,
  onWebhookResponse,
  referenceId,
  enableWebhook,
  applicationId,
  applicantId,
  zoneinfo,
  showOnlyCoApplicant = false,
  showOnlyGuarantor = false,
  showOnlyApplicant = false
}: SupportingDocumentsProps): JSX.Element => {
  
  // Debug component props
  console.log(`🏗️ SupportingDocuments component props:`, {
    showOnlyCoApplicant,
    showOnlyGuarantor,
    showOnlyApplicant,
    referenceId,
    applicationId
  });
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    filename: string;
    fileType: string;
  }>({
    isOpen: false,
    title: '',
    url: '',
    filename: '',
    fileType: ''
  });

  const requiredDocuments: CategoryInfo[] = [
    {
      category: "Identity Documents",
      icon: <User className="h-4 w-4" />,
      documents: [
        {
          id: "photo_id",
          name: "Driver's License (Photo ID)",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        },
        {
          id: "social_security",
          name: "Social Security Card",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        },
        {
          id: "w9_forms",
          name: "W9 Form",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        }
      ]
    },
    {
      category: "Employment Documents",
      icon: <Building className="h-4 w-4" />,
      documents: [
        {
          id: "employment_letter",
          name: "Employment Letter",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        },
        {
          id: "pay_stubs",
          name: "Pay Stubs (Last 2-4)",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf",
          multiple: true
        }
      ]
    },
    {
      category: "Financial Documents",
      icon: <DollarSign className="h-4 w-4" />,
      documents: [
        {
          id: "tax_returns",
          name: "Tax Returns (Previous Year)",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        },
        {
          id: "bank_statements",
          name: "Bank Statements",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf",
          multiple: true
        },
        {
          id: "accountant_letter",
          name: "Accountant Letter",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        }
      ]
    },
    {
      category: "Additional Documents",
      icon: <CreditCard className="h-4 w-4" />,
      documents: [
        {
          id: "credit_report",
          name: "Credit Report",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        }
      ]
    }
  ];

  const getDocumentStatus = (documentId: string): DocumentStatus => {
    // First check webhookResponses for direct S3 URLs
    const webhookResponse = formData.webhookResponses?.[documentId];
    if (webhookResponse) {
      let fileUrl = '';
      if (typeof webhookResponse === 'string') {
        fileUrl = webhookResponse;
      } else if (webhookResponse && webhookResponse.body) {
        fileUrl = webhookResponse.body;
      } else if (webhookResponse && webhookResponse.url) {
        fileUrl = webhookResponse.url;
      }
      
      if (fileUrl && fileUrl.trim()) {
      return {
        status: "uploaded",
          count: 1
        };
      }
    }
    
    // Check for documents with person prefix in webhookResponses
    const personPrefixes = ['applicant_', 'coApplicant_', 'guarantor_', 'occupants_'];
    for (const prefix of personPrefixes) {
      const prefixedDocumentId = prefix + documentId;
      const prefixedWebhookResponse = formData.webhookResponses?.[prefixedDocumentId];
      if (prefixedWebhookResponse) {
        let fileUrl = '';
        if (typeof prefixedWebhookResponse === 'string') {
          fileUrl = prefixedWebhookResponse;
        } else if (prefixedWebhookResponse && prefixedWebhookResponse.body) {
          fileUrl = prefixedWebhookResponse.body;
        } else if (prefixedWebhookResponse && prefixedWebhookResponse.url) {
          fileUrl = prefixedWebhookResponse.url;
        }
        
        if (fileUrl && fileUrl.trim()) {
          return {
            status: "uploaded",
            count: 1
          };
        }
      }
    }
    
    // Check uploadedFilesMetadata
    const uploadedFilesMetadata = formData.uploadedFilesMetadata;
    if (uploadedFilesMetadata) {
      // Check for documents in uploadedFilesMetadata
      const uploadedFiles = uploadedFilesMetadata[documentId];
      if (uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
        return {
          status: "uploaded",
          count: uploadedFiles.length
        };
      }
      
      // Check for documents with person prefix
      for (const prefix of personPrefixes) {
        const prefixedDocumentId = prefix + documentId;
        const prefixedFiles = uploadedFilesMetadata[prefixedDocumentId];
        if (prefixedFiles && Array.isArray(prefixedFiles) && prefixedFiles.length > 0) {
          return {
            status: "uploaded",
            count: prefixedFiles.length
          };
        }
      }
    }
    
    // Check encryptedDocuments
    const encryptedDocuments = formData.encryptedDocuments;
    if (encryptedDocuments) {
      for (const person of personPrefixes) {
        const cleanPerson = person.replace('_', '');
        const personDocs = encryptedDocuments[cleanPerson as keyof typeof encryptedDocuments];
        if (personDocs && personDocs[documentId]) {
          const files = personDocs[documentId];
          if (Array.isArray(files) && files.length > 0) {
            return {
              status: "uploaded",
              count: files.length
            };
          }
        }
      }
    }
    
    // Fall back to checking actual files
    const documents = formData.documents;
    if (documents) {
      // Check applicant documents
      if (documents.applicant && documents.applicant[documentId]) {
        const files = documents.applicant[documentId];
        if (Array.isArray(files) && files.length > 0) {
          return {
            status: "uploaded",
            count: files.length
          };
        }
      }
      
      // Check co-applicant documents
      if (documents.coApplicant && documents.coApplicant[documentId]) {
        const files = documents.coApplicant[documentId];
        if (Array.isArray(files) && files.length > 0) {
          return {
            status: "uploaded",
            count: files.length
          };
        }
      }
      
      // Check guarantor documents
      if (documents.guarantor && documents.guarantor[documentId]) {
        const files = documents.guarantor[documentId];
        if (Array.isArray(files) && files.length > 0) {
          return {
            status: "uploaded",
            count: files.length
          };
        }
      }
    }
    
    return {
      status: "pending",
      count: 0
    };
  };

  const getUploadedDocuments = (documentId: string) => {
    const uploadedDocs: Array<{ filename: string; webhookbodyUrl: string }> = [];
    
    // Get the current context to filter documents appropriately
    const currentContext = getCurrentContext();
    console.log(`🔍 getUploadedDocuments called for documentId: ${documentId}, currentContext: ${currentContext}`);
    
    // First check webhookResponses for direct S3 URLs (this handles the case where webhookResponses are already filtered by person type)
    const webhookResponse = formData.webhookResponses?.[documentId];
    if (webhookResponse) {
      let fileUrl = '';
      if (typeof webhookResponse === 'string') {
        fileUrl = webhookResponse;
      } else if (webhookResponse && webhookResponse.body) {
        fileUrl = webhookResponse.body;
      } else if (webhookResponse && webhookResponse.url) {
        fileUrl = webhookResponse.url;
      }
      
      if (fileUrl && fileUrl.trim()) {
        // Create filename with person type prefix based on current context
        const filename = `${currentContext}_${documentId}_document`;
        console.log(`📁 Adding document with context-aware filename: ${filename}`);
        uploadedDocs.push({
          filename: filename,
          webhookbodyUrl: fileUrl
        });
      }
    }
    
    // Check for documents with person prefix in webhookResponses (this handles the case where webhookResponses contain all person types)
    const personPrefixes = ['applicant_', 'coApplicant_', 'guarantor_', 'occupants_'];
    for (const prefix of personPrefixes) {
      // Only process documents for the current context
      if (currentContext === 'applicant' && prefix !== 'applicant_') continue;
      if (currentContext === 'coApplicant' && prefix !== 'coApplicant_') continue;
      if (currentContext === 'guarantor' && prefix !== 'guarantor_') continue;
      if (currentContext === 'occupants' && prefix !== 'occupants_') continue;
      
      const prefixedDocumentId = prefix + documentId;
      const prefixedWebhookResponse = formData.webhookResponses?.[prefixedDocumentId];
      if (prefixedWebhookResponse) {
        let fileUrl = '';
        if (typeof prefixedWebhookResponse === 'string') {
          fileUrl = prefixedWebhookResponse;
        } else if (prefixedWebhookResponse && prefixedWebhookResponse.body) {
          fileUrl = prefixedWebhookResponse.body;
        } else if (prefixedWebhookResponse && prefixedWebhookResponse.url) {
          fileUrl = prefixedWebhookResponse.url;
        }
        
        if (fileUrl && fileUrl.trim()) {
          const filename = `${prefixedDocumentId}_document`;
          console.log(`📁 Adding document with prefixed filename: ${filename} for ${prefixedDocumentId}`);
          uploadedDocs.push({
            filename: filename,
            webhookbodyUrl: fileUrl
          });
        }
      }
    }
    
    // Fall back to checking documents structure if no webhook responses
    const documents = formData.documents;
    if (documents && uploadedDocs.length === 0) {
      // Only check documents for the current context
      if (currentContext === 'applicant' && documents.applicant && documents.applicant[documentId]) {
        const files = documents.applicant[documentId];
        if (Array.isArray(files)) {
          console.log(`📁 Adding applicant documents from documents structure: ${files.length} files`);
          uploadedDocs.push(...files);
        }
      }
      
      if (currentContext === 'coApplicant' && documents.coApplicant && documents.coApplicant[documentId]) {
        const files = documents.coApplicant[documentId];
        if (Array.isArray(files)) {
          console.log(`📁 Adding coApplicant documents from documents structure: ${files.length} files`);
          uploadedDocs.push(...files);
        }
      }
      
      if (currentContext === 'guarantor' && documents.guarantor && documents.guarantor[documentId]) {
        const files = documents.guarantor[documentId];
        if (Array.isArray(files)) {
          console.log(`📁 Adding guarantor documents from documents structure: ${files.length} files`);
          uploadedDocs.push(...files);
        }
      }
    }
    
    // Check other occupants documents only if in occupants context
    if (currentContext === 'occupants' && documents?.otherOccupants) {
      Object.entries(documents.otherOccupants).forEach(([key, files]) => {
        if (key.includes(documentId) && Array.isArray(files)) {
          console.log(`📁 Adding occupant documents from documents structure: ${files.length} files`);
          uploadedDocs.push(...files);
        }
      });
    }

    console.log(`📁 getUploadedDocuments returning ${uploadedDocs.length} documents for ${documentId} in ${currentContext} context:`, uploadedDocs);
    return uploadedDocs;
  };

  const handlePreviewDocument = (filename: string, webhookbodyUrl: string, documentName: string) => {
    // Check if the URL is accessible before opening preview
    if (!webhookbodyUrl) {
      console.error('❌ No webhook URL provided for preview');
      return;
    }

    // Validate URL format
    try {
      new URL(webhookbodyUrl);
    } catch (error) {
      console.error('❌ Invalid URL format:', webhookbodyUrl);
      return;
    }

    // Test URL accessibility
    fetch(webhookbodyUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          // URL is accessible, open preview
          const fileType = getFileTypeFromFilename(filename);
    setPreviewModal({
      isOpen: true,
      title: documentName,
      url: webhookbodyUrl,
            filename: filename,
            fileType: fileType
          });
          
          // Set a timeout to automatically show fallback if iframe fails
          setTimeout(() => {
            const iframe = document.querySelector('iframe');
            const fallback = document.getElementById('fallback-content');
            if (iframe && fallback && !iframe.contentDocument?.body?.innerHTML) {
              console.log('⏰ Timeout reached, showing fallback content');
              fallback.classList.remove('hidden');
            }
          }, 5000); // 5 second timeout
        } else {
          // URL is not accessible, show error
          console.error('❌ URL not accessible:', response.status, response.statusText);
          alert(`Unable to preview document. Error: ${response.status} ${response.statusText}`);
        }
      })
      .catch(error => {
        console.error('❌ Error accessing URL:', error);
        // Try to open in new tab as fallback
        try {
          window.open(webhookbodyUrl, '_blank');
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          alert('Unable to preview document. Please try downloading instead.');
        }
    });
  };

  const handleDownloadDocument = (webhookbodyUrl: string, filename: string) => {
    if (!webhookbodyUrl) {
      console.error('❌ No webhook URL provided for download');
      alert('No download URL available for this document.');
      return;
    }

    // Validate URL format
    try {
      new URL(webhookbodyUrl);
    } catch (error) {
      console.error('❌ Invalid URL format for download:', webhookbodyUrl);
      alert('Invalid download URL. Please contact support.');
      return;
    }

    // Test URL accessibility before downloading
    fetch(webhookbodyUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          // URL is accessible, proceed with download
    const link = document.createElement('a');
    link.href = webhookbodyUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
        } else {
          // URL is not accessible, show error
          console.error('❌ Download URL not accessible:', response.status, response.statusText);
          alert(`Unable to download document. Error: ${response.status} ${response.statusText}`);
        }
      })
      .catch(error => {
        console.error('❌ Error accessing download URL:', error);
        // Try direct download as fallback
        try {
          window.open(webhookbodyUrl, '_blank');
        } catch (fallbackError) {
          console.error('❌ Download fallback also failed:', fallbackError);
          alert('Unable to download document. Please try again later.');
        }
      });
  };

  // Helper function to determine person type from document ID
  const getPersonTypeFromDocumentId = (documentId: string): string => {
    if (documentId.startsWith('applicant_')) {
      return 'applicant';
    } else if (documentId.startsWith('coApplicant_')) {
      return 'coApplicant';
    } else if (documentId.startsWith('guarantor_')) {
      return 'guarantor';
    } else if (documentId.startsWith('occupants_')) {
      return 'occupants';
    } else {
      // Default to applicant for backward compatibility
      return 'applicant';
    }
  };

  const handleClosePreview = () => {
    setPreviewModal(prev => ({ ...prev, isOpen: false }));
  };

  // Function to get file type from filename
  const getFileTypeFromFilename = (filename: string): string => {
    if (!filename) return 'unknown';
    
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
        return 'image';
      case 'png':
        return 'image';
      case 'gif':
        return 'image';
      case 'bmp':
        return 'image';
      case 'webp':
        return 'image';
      case 'doc':
      case 'docx':
        return 'document';
      case 'xls':
      case 'xlsx':
        return 'spreadsheet';
      case 'ppt':
      case 'pptx':
        return 'presentation';
      case 'txt':
        return 'text';
      default:
        return 'unknown';
    }
  };

  // Function to determine current context based on props and document IDs
  const getCurrentContext = (): string => {
    // Check if we're showing only specific person types
    if (showOnlyApplicant) {
      return 'applicant';
    } else if (showOnlyCoApplicant) {
      return 'coApplicant';
    } else if (showOnlyGuarantor) {
      return 'guarantor';
    }
    
    // Check document IDs to determine context
    const documentIds = requiredDocuments.flatMap(cat => cat.documents.map(doc => doc.id));
    
    // Look for person-specific document IDs
    if (documentIds.some(id => id.startsWith('coApplicant_'))) {
      return 'coApplicant';
    } else if (documentIds.some(id => id.startsWith('guarantor_'))) {
      return 'guarantor';
    } else if (documentIds.some(id => id.startsWith('occupants_'))) {
      return 'occupants';
    } else if (documentIds.some(id => id.startsWith('applicant_'))) {
      return 'applicant';
    }
    
    // Check if we're in a specific person's document section by looking at the current document being processed
    // This helps when the component is used in different contexts
    if (documentIds.length > 0) {
      const firstDocId = documentIds[0];
      if (firstDocId.includes('coApplicant') || firstDocId.includes('co-applicant')) {
        return 'coApplicant';
      } else if (firstDocId.includes('guarantor')) {
        return 'guarantor';
      } else if (firstDocId.includes('occupants') || firstDocId.includes('occupant')) {
        return 'occupants';
      }
    }
    
    // Default to applicant for supporting documents
    return 'applicant';
  };

  // Function to get context for a specific document
  const getDocumentContext = (documentId: string): string => {
    console.log(`🔍 Analyzing document ID for context: ${documentId}`);
    
    // Check if the document ID contains person-specific information
    if (documentId.includes('coApplicant') || documentId.includes('co-applicant')) {
      console.log(`🔍 Document ${documentId} identified as coApplicant`);
      return 'coApplicant';
    } else if (documentId.includes('guarantor')) {
      console.log(`🔍 Document ${documentId} identified as guarantor`);
      return 'guarantor';
    } else if (documentId.includes('occupants') || documentId.includes('occupant')) {
      console.log(`🔍 Document ${documentId} identified as occupants`);
      return 'occupants';
    } else if (documentId.includes('applicant')) {
      console.log(`🔍 Document ${documentId} identified as applicant`);
      return 'applicant';
    }
    
    // Check if we're in a specific section by looking at the document ID patterns
    // For Co-Applicant documents, the ID might be something like "photo_id" but we're in co-applicant context
    if (showOnlyCoApplicant) {
      console.log(`🔍 Document ${documentId} in co-applicant context (showOnlyCoApplicant: true)`);
      return 'coApplicant';
    } else if (showOnlyGuarantor) {
      console.log(`🔍 Document ${documentId} in guarantor context (showOnlyGuarantor: true)`);
      return 'guarantor';
    }
    
    console.log(`🔍 Document ${documentId} context unknown, using fallback`);
    // Fallback to global context
    return getCurrentContext();
  };

  // Function to validate and test webhook URLs
  const validateWebhookUrl = async (url: string): Promise<{ isValid: boolean; error?: string }> => {
    if (!url) {
      return { isValid: false, error: 'No URL provided' };
    }

    try {
      // Validate URL format
      new URL(url);
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }

    try {
      // Test URL accessibility
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        return { isValid: true };
      } else {
        return { 
          isValid: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  };

  // Determine employment type for applicant, co-applicant, and guarantor
  const applicantEmploymentType = formData?.applicant?.employmentType;
  const coApplicantEmploymentType = formData?.coApplicant?.employmentType;
  const guarantorEmploymentType = formData?.guarantor?.employmentType;

  // Helper to filter documents based on employment type
  function filterDocumentsByEmploymentType(documents: CategoryInfo[], employmentType: string | undefined) {
    if (!employmentType) return documents;
    
    return documents.map(category => ({
      ...category,
      documents: category.documents.filter(document => {
        // For salaried/employed: show Employment Letter, hide Accountant Letter
        if (employmentType === 'salaried' || employmentType === 'employed') {
          return document.id !== 'accountant_letter';
        }
        
        // For self-employed: show Financial Documents, hide Employment Documents
        if (employmentType === 'self-employed') {
          return category.category !== 'Employment Documents';
        }
        
        // For other employment types: show all documents
        if (["unemployed", "retired", "student"].includes(employmentType)) {
          return true;
        }
        
        return true;
      })
    })).filter(category => category.documents.length > 0); // Remove empty categories
  }

  // Determine which employment type to use based on the section being displayed
  let relevantEmploymentType: string | undefined;
  
  if (showOnlyCoApplicant) {
    relevantEmploymentType = coApplicantEmploymentType;
  } else if (showOnlyGuarantor) {
    relevantEmploymentType = guarantorEmploymentType;
  } else {
    // For supporting documents section, use applicant employment type
    relevantEmploymentType = applicantEmploymentType;
  }

  // Filter documents based on the relevant employment type
  const filteredDocuments = filterDocumentsByEmploymentType(requiredDocuments, relevantEmploymentType);

  // Add Other Occupant Documents category if there are other occupants
  const otherOccupants = Array.isArray(formData?.otherOccupants) ? formData.otherOccupants : [];
  let filteredDocumentsWithOccupants = [...filteredDocuments];
  if (otherOccupants.length > 0) {
    filteredDocumentsWithOccupants.push({
      category: 'Other Occupant Documents',
      icon: <User className="h-4 w-4" />,
      documents: [
        {
          id: `other_occupants_identity`,
          name: `Proof of Identity for Other Occupants`,
          required: true,
          acceptedTypes: '.jpg,.jpeg,.png,.pdf'
        }
      ]
    });
  }

  return (
    <div className="space-y-6">
      {filteredDocumentsWithOccupants.map((category) => (
        <div key={category.category} className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            {category.icon}
            <h3 className="font-medium text-gray-800">{category.category}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {category.documents.map((document) => {
              const docStatus = getDocumentStatus(document.id);
              return (
                <div key={document.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{document.name}</h4>
                        {document.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                        {!document.required && (
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        )}
                        {/* Show person type badge */}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            document.id.startsWith('applicant_') ? 'border-blue-200 text-blue-700 bg-blue-50' :
                            document.id.startsWith('coApplicant_') ? 'border-purple-200 text-purple-700 bg-purple-50' :
                            document.id.startsWith('guarantor_') ? 'border-orange-200 text-orange-700 bg-orange-50' :
                            document.id.startsWith('occupants_') ? 'border-green-200 text-green-700 bg-green-50' :
                            'border-gray-200 text-gray-700 bg-gray-50'
                          }`}
                        >
                          {document.id.startsWith('applicant_') ? '👤 Applicant' :
                           document.id.startsWith('coApplicant_') ? '👥 Co-Applicant' :
                           document.id.startsWith('guarantor_') ? '🏦 Guarantor' :
                           document.id.startsWith('occupants_') ? '🏠 Occupant' :
                           '📄 Document'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {docStatus.status === "uploaded" ? (
                        <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Uploaded ({docStatus.count} file{docStatus.count > 1 ? 's' : ''})</span>
                          </div>
                          {/* Preview and Re-upload buttons for uploaded documents */}
                          {(() => {
                            const uploadedDocs = getUploadedDocuments(document.id);
                            if (uploadedDocs.length > 0 && uploadedDocs[0]?.webhookbodyUrl) {
                              return (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreviewDocument(
                                      uploadedDocs[0].filename, 
                                      uploadedDocs[0].webhookbodyUrl, 
                                      document.name
                                    )}
                                    className="h-6 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Preview
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Clear the webhook response to allow re-upload
                                      if (onWebhookResponse) {
                                        onWebhookResponse(document.id, null);
                                      }
                                    }}
                                    className="h-6 px-2 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Re-upload
                                  </Button>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs">Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                  

                  <div>
                    <FileUpload
                      onFileChange={(files) => onDocumentChange(document.id, files)}
                      onEncryptedFilesChange={(encryptedFiles) => onEncryptedDocumentChange?.(document.id, encryptedFiles)}
                      onWebhookResponse={(response) => onWebhookResponse?.(document.id, response)}
                      initialWebhookResponse={formData.webhookResponses?.[document.id]}
                      accept={document.acceptedTypes}
                      multiple={document.multiple || false}
                      maxFiles={document.multiple ? 4 : 1}
                      maxSize={10}
                      label={`Upload ${document.name}`}
                      className="mt-2"
                      enableEncryption={true}
                      referenceId={referenceId}
                      sectionName={document.id}
                      documentName={document.name}
                      enableWebhook={enableWebhook}
                      applicationId={applicationId}
                      zoneinfo={zoneinfo}
                      commentId={document.id}
                    />
                    {/* Hidden input field for webhook response data */}
                    {formData.webhookResponses?.[document.id] && (
                      <input 
                        type="hidden"
                        name={`webhook_response_${document.id}`}
                        value={typeof formData.webhookResponses[document.id] === 'string' 
                          ? formData.webhookResponses[document.id]
                          : JSON.stringify(formData.webhookResponses[document.id])
                        }
                        data-document-type={document.id}
                        data-document-name={document.name}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <Dialog open={previewModal.isOpen} onOpenChange={handleClosePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewModal.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewModal.url && (
              <div className="w-full h-full">
                {/* Try iframe first */}
                <iframe
                  src={previewModal.url}
                  className="w-full h-full border-0"
                  title={previewModal.filename}
                  onError={() => {
                    console.log('❌ Iframe failed, showing fallback content');
                    const fallback = document.getElementById('fallback-content');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                  onLoad={(e) => {
                    // Check if content is blocked or iframe is empty
                    const iframe = e.target as HTMLIFrameElement;
                    try {
                      // Try to access iframe content to detect CORS issues
                      if (iframe.contentDocument && iframe.contentDocument.body) {
                        const content = iframe.contentDocument.body.innerHTML;
                        if (content.includes('blocked') || content.includes('Contact the site owner')) {
                          console.log('❌ Content blocked detected, showing fallback');
                          const fallback = document.getElementById('fallback-content');
                          if (fallback) fallback.classList.remove('hidden');
                        }
                      }
                    } catch (error) {
                      // CORS error or content blocked, show fallback
                      console.log('❌ CORS error or content blocked, showing fallback');
                      const fallback = document.getElementById('fallback-content');
                      if (fallback) fallback.classList.remove('hidden');
                    }
                  }}
                />
                
                {/* Fallback content if iframe fails or content is blocked */}
                <div className="hidden" id="fallback-content">
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="text-amber-600 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Preview Unavailable
                    </h3>
                    <p className="text-gray-600 mb-4">
                      The document preview is blocked or unavailable. This can happen due to:
                    </p>
                    <ul className="text-sm text-gray-600 mb-6 text-left space-y-1">
                      <li>• CORS (Cross-Origin) restrictions</li>
                      <li>• S3 bucket security settings</li>
                      <li>• Document access permissions</li>
                      <li>• Network connectivity issues</li>
                    </ul>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => window.open(previewModal.url, '_blank')}
                        variant="outline"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open in New Tab
                      </Button>
                      <Button 
                        onClick={() => handleDownloadDocument(previewModal.url, previewModal.filename)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Document
            </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => handleDownloadDocument(previewModal.url, previewModal.filename)}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handleClosePreview}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
