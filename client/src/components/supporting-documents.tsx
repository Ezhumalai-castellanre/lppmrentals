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
  isPayStubs?: boolean;
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
      otherOccupants?: Record<string, any[]>;
    };
    applicant?: { employmentType?: string; incomeFrequency?: string };
    coApplicant?: { employmentType?: string; incomeFrequency?: string };
    coApplicants?: Array<{ employmentType?: string; incomeFrequency?: string }>;
    guarantor?: { employmentType?: string; incomeFrequency?: string };
    guarantors?: Array<{ employmentType?: string; incomeFrequency?: string }>;
    otherOccupants?: any[];
    uploadedFilesMetadata?: Record<string, any[]>;
  };
  // Add access to original webhook responses for proper document mapping
  originalWebhookResponses?: Record<string, any>;
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
  index?: number; // Add index parameter for array-based people (coApplicants, guarantors)
}

export const SupportingDocuments = ({
  formData,
  originalWebhookResponses,
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
  showOnlyApplicant = false,
  index
}: SupportingDocumentsProps): JSX.Element => {
  
  // Debug component props
  console.log(`🏗️ SupportingDocuments component props:`, {
    showOnlyCoApplicant,
    showOnlyGuarantor,
    showOnlyApplicant,
    referenceId,
    applicationId,
    index,
    hasOriginalWebhookResponses: !!originalWebhookResponses,
    originalWebhookResponsesKeys: originalWebhookResponses ? Object.keys(originalWebhookResponses) : []
  });
  
  // Debug index parameter specifically
  if (index !== undefined) {
    console.log(`🔍 SupportingDocuments: Index parameter received: ${index} (type: ${typeof index})`);
    console.log(`🔍 SupportingDocuments: This should be for ${showOnlyCoApplicant ? 'Co-Applicant' : showOnlyGuarantor ? 'Guarantor' : 'Unknown'} ${index + 1}`);
  } else {
    console.log(`🔍 SupportingDocuments: No index parameter received`);
  }

  // Helper function to get person type from document ID
  const getPersonType = (documentId: string): 'applicant' | 'coApplicant' | 'guarantor' | 'otherOccupants' => {
    if (documentId.startsWith('applicant_')) return 'applicant';
    if (documentId.startsWith('coApplicant_')) return 'coApplicant';
    if (documentId.startsWith('guarantor_')) return 'guarantor';
    if (documentId.startsWith('occupants_')) return 'otherOccupants';
    return 'applicant'; // default fallback
  };

  // Helper function to get person type and index from document ID
  const getPersonTypeAndIndex = (documentId: string): { personType: string; index?: number } => {
    if (documentId.startsWith('applicant_')) return { personType: 'applicant' };
    if (documentId.startsWith('coApplicant_')) {
      const match = documentId.match(/^coApplicant_(\d+)_/);
      return { personType: 'coApplicant', index: match ? parseInt(match[1]) : undefined };
    }
    if (documentId.startsWith('guarantor_')) {
      const match = documentId.match(/^guarantor_(\d+)_/);
      return { personType: 'guarantor', index: match ? parseInt(match[1]) : undefined };
    }
    if (documentId.startsWith('occupants_')) return { personType: 'otherOccupants' };
    return { personType: 'applicant' };
  };

  // Debug formData structure
  console.log(`🏗️ SupportingDocuments formData structure:`, {
    hasApplicant: !!formData?.applicant,
    hasCoApplicant: !!formData?.coApplicant,
    hasCoApplicants: !!formData?.coApplicants,
    coApplicantsLength: formData?.coApplicants?.length,
    hasGuarantor: !!formData?.guarantor,
    hasGuarantors: !!formData?.guarantors,
    guarantorsLength: formData?.guarantors?.length,
    applicantEmploymentType: formData?.applicant?.employmentType,
    coApplicantEmploymentType: formData?.coApplicant?.employmentType,
    firstCoApplicantEmploymentType: formData?.coApplicants?.[0]?.employmentType,
    guarantorEmploymentType: formData?.guarantor?.employmentType,
    firstGuarantorEmploymentType: formData?.guarantors?.[0]?.employmentType
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

  // Track which documents have been requested for re-upload
  const [reuploadRequested, setReuploadRequested] = useState<Record<string, boolean>>({});

  // Pay Stubs frequency options and their corresponding counts
  const payStubsFrequencyOptions = [
    { value: 'weekly', label: 'Weekly', count: 4 },
    { value: 'bi-weekly', label: 'Every 2 weeks', count: 2 },
    { value: 'monthly', label: 'Monthly', count: 1 },
    { value: 'quarterly', label: 'Quarterly', count: 1 },
    { value: 'yearly', label: 'Yearly', count: 1 }
  ];

  // Function to get current income frequency based on context
  const getCurrentIncomeFrequency = (): string => {
    if (showOnlyCoApplicant && formData.coApplicant?.incomeFrequency) {
      return formData.coApplicant.incomeFrequency;
    } else if (showOnlyGuarantor && formData.guarantor?.incomeFrequency) {
      return formData.guarantor.incomeFrequency;
    } else if (formData.applicant?.incomeFrequency) {
      return formData.applicant.incomeFrequency;
    }
    return 'monthly'; // Default fallback
  };

  // Function to generate Pay Stubs sections based on frequency
  const generatePayStubsSections = (frequency: string): DocumentInfo[] => {
    const count = payStubsFrequencyOptions.find(opt => opt.value === frequency)?.count || 1;
    const sections: DocumentInfo[] = [];
    
    for (let i = 1; i <= count; i++) {
      sections.push({
        id: `pay_stubs_${i}`,
        name: `Pay Stubs ${i}`,
        required: true,
        acceptedTypes: ".jpg,.jpeg,.png,.pdf",
        isPayStubs: true
      });
    }
    
    return sections;
  };

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
          required: false, // Will be conditionally required based on employment type
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        },
        {
          id: "pay_stubs",
          name: "Pay Stubs",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf",
          isPayStubs: true
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
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
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
    // Debug logging to help troubleshoot
    console.log(`🔍 getDocumentStatus called for documentId: ${documentId}`, {
      webhookResponses: formData.webhookResponses,
      originalWebhookResponses: (formData as any).originalWebhookResponses,
      currentContext: getCurrentContext()
    });
    
    // Special handling for Pay Stubs sections
    if (documentId.startsWith('pay_stubs_')) {
      // Check if this specific Pay Stubs section has been uploaded
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
      
      // Check for documents with person prefix (including indexed versions)
      const personPrefixes = ['applicant_', 'coApplicants_', 'guarantors_', 'occupants_'];
      for (const prefix of personPrefixes) {
        // Handle both old format (coApplicant_) and new format (coApplicants_1_, coApplicants_2_, etc.)
        if (prefix === 'coApplicants_') {
          // Check for coApplicants_1_, coApplicants_2_, etc.
          for (let i = 1; i <= 4; i++) {
            const indexedPrefix = `coApplicants_${i}_`;
            const prefixedDocumentId = indexedPrefix + documentId;
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
        } else if (prefix === 'guarantors_') {
          // Check for guarantors_1_, guarantors_2_, etc.
          for (let i = 1; i <= 4; i++) {
            const indexedPrefix = `guarantors_${i}_`;
            const prefixedDocumentId = indexedPrefix + documentId;
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
        } else {
          // Handle applicant_ and occupants_ normally
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
      }
      
      return {
        status: "pending",
        count: 0
      };
    }
    
    // First check webhookResponses for direct S3 URLs (this handles transformed keys from filtered webhookResponses)
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
    
    // Check original webhook responses if available (for proper document mapping)
    // This is crucial for co-applicant documents where the prefix might be filtered out
    if ((formData as any).originalWebhookResponses) {
      const originalWebhookResponses = (formData as any).originalWebhookResponses;
      
      // Check for the document ID directly in original webhook responses
      if (originalWebhookResponses[documentId]) {
        let fileUrl = '';
        const response = originalWebhookResponses[documentId];
        if (typeof response === 'string') {
          fileUrl = response;
        } else if (response && response.body) {
          fileUrl = response.body;
        } else if (response && response.url) {
          fileUrl = response.url;
        }
        
        if (fileUrl && fileUrl.trim()) {
          return {
            status: "uploaded",
            count: 1
          };
        }
      }
      
      // Check for documents with person prefix in original webhook responses
      const personPrefixes = ['applicant_', 'coApplicant_', 'coApplicants_', 'guarantor_', 'guarantors_', 'occupants_'];
      for (const prefix of personPrefixes) {
        if (prefix === 'coApplicants_') {
          // Check for coApplicants_1_, coApplicants_2_, etc.
          for (let i = 1; i <= 4; i++) {
            const indexedPrefix = `coApplicants_${i}_`;
            const prefixedDocumentId = indexedPrefix + documentId;
            const prefixedWebhookResponse = originalWebhookResponses[prefixedDocumentId];
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
        } else if (prefix === 'guarantors_') {
          // Check for guarantors_1_, guarantors_2_, etc.
          for (let i = 1; i <= 4; i++) {
            const indexedPrefix = `guarantors_${i}_`;
            const prefixedDocumentId = indexedPrefix + documentId;
            const prefixedWebhookResponse = originalWebhookResponses[prefixedDocumentId];
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
        } else {
          // Handle applicant_, coApplicant_, and occupants_ normally
          const prefixedDocumentId = prefix + documentId;
          const prefixedWebhookResponse = originalWebhookResponses[prefixedDocumentId];
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
      }
    }
    
    // Check for documents with person prefix in webhookResponses (including indexed versions)
    const personPrefixes = ['applicant_', 'coApplicant_', 'coApplicants_', 'guarantor_', 'guarantors_', 'occupants_'];
    for (const prefix of personPrefixes) {
      // Handle both old format (coApplicant_) and new format (coApplicant_1_, coApplicant_2_, etc.)
      if (prefix === 'coApplicant_') {
        // Check for coApplicant_1_, coApplicant_2_, etc.
        for (let i = 1; i <= 4; i++) {
          const indexedPrefix = `coApplicant_${i}_`;
          const prefixedDocumentId = indexedPrefix + documentId;
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
      } else if (prefix === 'guarantor_') {
        // Check for guarantor_1_, guarantor_2_, etc.
        for (let i = 1; i <= 4; i++) {
          const indexedPrefix = `guarantor_${i}_`;
          const prefixedDocumentId = indexedPrefix + documentId;
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
      } else {
        // Handle applicant_ and occupants_ normally
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
      // Check for documents with person prefix in encryptedDocuments (including indexed versions)
      for (const prefix of personPrefixes) {
        if (prefix === 'coApplicant_') {
          // Check for coApplicant_1_, coApplicant_2_, etc. in encryptedDocuments
          for (let i = 1; i <= 4; i++) {
            const indexedPrefix = `coApplicant_${i}_`;
            const cleanPerson = 'coApplicant' as keyof typeof encryptedDocuments;
            const personDocs = encryptedDocuments[cleanPerson];
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
        } else if (prefix === 'guarantor_') {
          // Check for guarantor_1_, guarantor_2_, etc. in encryptedDocuments
          for (let i = 1; i <= 4; i++) {
            const indexedPrefix = `guarantor_${i}_`;
            const cleanPerson = 'guarantor' as keyof typeof encryptedDocuments;
            const personDocs = encryptedDocuments[cleanPerson];
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
        } else {
          // Handle applicant_ and occupants_ normally
          const cleanPerson = prefix.replace('_', '') as keyof typeof encryptedDocuments;
          const personDocs = encryptedDocuments[cleanPerson];
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
      
      // Also check for the specific document ID directly
      const personType = getPersonType(documentId);
      const personDocs = encryptedDocuments[personType as keyof typeof encryptedDocuments];
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
    
    // Special handling for Pay Stubs sections
    if (documentId.startsWith('pay_stubs_')) {
      // Check webhookResponses for this specific Pay Stubs section
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
          const filename = `${currentContext}_${documentId}_document`;
          console.log(`📁 Adding Pay Stubs document with context-aware filename: ${filename}`);
          uploadedDocs.push({
            filename: filename,
            webhookbodyUrl: fileUrl
          });
        }
      }
      
      // Check for documents with person prefix (including indexed versions)
      const personPrefixes = ['applicant_', 'coApplicants_', 'guarantors_', 'occupants_'];
      for (const prefix of personPrefixes) {
        // Only process documents for the current context
        if (currentContext === 'applicant' && prefix !== 'applicant_') continue;
        if (currentContext === 'coApplicant' && prefix !== 'coApplicants_') continue;
        if (currentContext === 'guarantor' && prefix !== 'guarantors_') continue;
        if (currentContext === 'occupants' && prefix !== 'occupants_') continue;
        
        if (prefix === 'coApplicants_') {
          // Check for coApplicants_1_, coApplicants_2_, etc.
          for (let i = 1; i <= 4; i++) {
            const indexedPrefix = `coApplicants_${i}_`;
            const prefixedDocumentId = indexedPrefix + documentId;
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
                console.log(`📁 Adding Pay Stubs document with indexed filename: ${filename} for ${prefixedDocumentId}`);
                uploadedDocs.push({
                  filename: filename,
                  webhookbodyUrl: fileUrl
                });
              }
            }
          }
        } else if (prefix === 'guarantors_') {
          // Check for guarantors_1_, guarantors_2_, etc.
          for (let i = 1; i <= 4; i++) {
            const indexedPrefix = `guarantors_${i}_`;
            const prefixedDocumentId = indexedPrefix + documentId;
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
                console.log(`📁 Adding Pay Stubs document with indexed filename: ${filename} for ${prefixedDocumentId}`);
                uploadedDocs.push({
                  filename: filename,
                  webhookbodyUrl: fileUrl
                });
              }
            }
          }
        } else {
          // Handle applicant_ and occupants_ normally
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
              console.log(`📁 Adding Pay Stubs document with prefixed filename: ${filename} for ${prefixedDocumentId}`);
              uploadedDocs.push({
                filename: filename,
                webhookbodyUrl: fileUrl
              });
            }
          }
        }
      }
      
      return uploadedDocs;
    }
    
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
    
    // Check original webhook responses if available (for proper document mapping)
    // This is crucial for co-applicant documents where the prefix might be filtered out
    if ((formData as any).originalWebhookResponses) {
      const originalWebhookResponses = (formData as any).originalWebhookResponses;
      
      // Check for the document ID directly in original webhook responses
      if (originalWebhookResponses[documentId]) {
        let fileUrl = '';
        const response = originalWebhookResponses[documentId];
        if (typeof response === 'string') {
          fileUrl = response;
        } else if (response && response.body) {
          fileUrl = response.body;
        } else if (response && response.url) {
          fileUrl = response.url;
        }
        
        if (fileUrl && fileUrl.trim()) {
          // Create filename with person type prefix based on current context
          const filename = `${currentContext}_${documentId}_document`;
          console.log(`📁 Adding document with original webhook response: ${filename}`);
          uploadedDocs.push({
            filename: filename,
            webhookbodyUrl: fileUrl
          });
        }
      }
      
      // Check for documents with person prefix in original webhook responses
      const personPrefixes = ['applicant_', 'coApplicant_', 'coApplicants_', 'guarantor_', 'guarantors_', 'occupants_'];
      for (const prefix of personPrefixes) {
        // Only process documents for the current context
        if (currentContext === 'applicant' && prefix !== 'applicant_') continue;
        if (currentContext === 'coApplicant' && prefix !== 'coApplicants_') continue;
        if (currentContext === 'guarantor' && prefix !== 'guarantors_') continue;
        if (currentContext === 'occupants' && prefix !== 'occupants_') continue;
        
        if (prefix === 'coApplicants_') {
          // Check for coApplicants_1_, coApplicants_2_, etc.
          for (let i = 1; i <= 4; i++) {
            const indexedPrefix = `coApplicants_${i}_`;
            const prefixedDocumentId = indexedPrefix + documentId;
            const prefixedWebhookResponse = originalWebhookResponses[prefixedDocumentId];
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
                console.log(`📁 Adding document with indexed filename: ${filename} for ${prefixedDocumentId}`);
                uploadedDocs.push({
                  filename: filename,
                  webhookbodyUrl: fileUrl
                });
              }
            }
          }
        } else if (prefix === 'guarantors_') {
          // Check for guarantors_1_, guarantors_2_, etc.
          for (let i = 1; i <= 4; i++) {
            const indexedPrefix = `guarantors_${i}_`;
            const prefixedDocumentId = indexedPrefix + documentId;
            const prefixedWebhookResponse = originalWebhookResponses[prefixedDocumentId];
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
                console.log(`📁 Adding document with indexed filename: ${filename} for ${prefixedDocumentId}`);
                uploadedDocs.push({
                  filename: filename,
                  webhookbodyUrl: fileUrl
                });
              }
            }
          }
        } else {
          // Handle applicant_, coApplicant_, and occupants_ normally
          const prefixedDocumentId = prefix + documentId;
          const prefixedWebhookResponse = originalWebhookResponses[prefixedDocumentId];
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
      }
    }
    
    // Check for documents with person prefix in webhookResponses (this handles the case where webhookResponses contain all person types)
    const personPrefixes = ['applicant_', 'coApplicants_', 'guarantors_', 'occupants_'];
    for (const prefix of personPrefixes) {
      // Only process documents for the current context
      if (currentContext === 'applicant' && prefix !== 'applicant_') continue;
      if (currentContext === 'coApplicant' && prefix !== 'coApplicants_') continue;
      if (currentContext === 'guarantor' && prefix !== 'guarantors_') continue;
      if (currentContext === 'occupants' && prefix !== 'occupants_') continue;
      
      if (prefix === 'coApplicants_') {
        // Check for coApplicants_1_, coApplicants_2_, etc.
        for (let i = 1; i <= 4; i++) {
          const indexedPrefix = `coApplicants_${i}_`;
          const prefixedDocumentId = indexedPrefix + documentId;
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
              console.log(`📁 Adding document with indexed filename: ${filename} for ${prefixedDocumentId}`);
              uploadedDocs.push({
                filename: filename,
                webhookbodyUrl: fileUrl
              });
            }
          }
        }
      } else if (prefix === 'guarantors_') {
        // Check for guarantors_1_, guarantors_2_, etc.
        for (let i = 1; i <= 4; i++) {
          const indexedPrefix = `guarantors_${i}_`;
          const prefixedDocumentId = indexedPrefix + documentId;
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
              console.log(`📁 Adding document with indexed filename: ${filename} for ${prefixedDocumentId}`);
              uploadedDocs.push({
                filename: filename,
                webhookbodyUrl: fileUrl
              });
            }
          }
        }
      } else {
        // Handle applicant_ and occupants_ normally
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
    }
    
    // Check encryptedDocuments for uploaded files
    const encryptedDocuments = formData.encryptedDocuments;
    if (encryptedDocuments && uploadedDocs.length === 0) {
      const personType = getPersonType(documentId);
      const personDocs = encryptedDocuments[personType as keyof typeof encryptedDocuments];
      if (personDocs && personDocs[documentId]) {
        const files = personDocs[documentId];
        if (Array.isArray(files) && files.length > 0) {
          console.log(`📁 Adding encrypted documents: ${files.length} files for ${documentId}`);
          // For encrypted documents, we don't have webhook URLs, so we'll create placeholder entries
          files.forEach((file, index) => {
            uploadedDocs.push({
              filename: file.filename || `${personType}_${documentId}_${index}`,
              webhookbodyUrl: file.fileUrl || '' // Use fileUrl if available, otherwise empty
            });
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
    
    // Look for person-specific document IDs (including indexed versions)
    if (documentIds.some(id => id.startsWith('coApplicants_') || id.startsWith('coApplicants_1_') || id.startsWith('coApplicants_2_') || id.startsWith('coApplicants_3_') || id.startsWith('coApplicants_4_'))) {
      return 'coApplicant';
    } else if (documentIds.some(id => id.startsWith('guarantors_') || id.startsWith('guarantors_1_') || id.startsWith('guarantors_2_') || id.startsWith('guarantors_3_') || id.startsWith('guarantors_4_'))) {
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
    
    // Check if the document ID contains person-specific information (including indexed versions)
    if (documentId.includes('coApplicants') || documentId.includes('co-applicant') || documentId.match(/coApplicants_\d+/)) {
      console.log(`🔍 Document ${documentId} identified as coApplicant`);
      return 'coApplicant';
    } else if (documentId.includes('guarantors') || documentId.match(/guarantors_\d+/)) {
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
  
  // Handle new co-applicant array structure
  let coApplicantEmploymentType: string | undefined;
  if (showOnlyCoApplicant && formData?.coApplicants && Array.isArray(formData.coApplicants)) {
    // Get the first co-applicant's employment type when showing only co-applicant
    coApplicantEmploymentType = formData.coApplicants[0]?.employmentType;
  } else {
    // Fallback to legacy structure
    coApplicantEmploymentType = formData?.coApplicant?.employmentType;
  }
  
  // Handle new guarantor array structure
  let guarantorEmploymentType: string | undefined;
  if (showOnlyGuarantor && formData?.guarantors && Array.isArray(formData.guarantors)) {
    // Get the first guarantor's employment type when showing only guarantor
    guarantorEmploymentType = formData.guarantors[0]?.employmentType;
  } else {
    // Fallback to legacy structure
    guarantorEmploymentType = formData?.guarantor?.employmentType;
  }

  // Helper to filter documents based on employment type
  function filterDocumentsByEmploymentType(documents: CategoryInfo[], employmentType: string | undefined) {
    if (!employmentType) return documents;
    
    // Filter documents based on employment type
    return documents.map(category => {
      if (category.category === 'Employment Documents') {
        let filteredDocuments = [...category.documents];
        
        if (employmentType === 'self-employed') {
          // Self-Employed: Remove Employment Letter, keep only Pay Stubs
          filteredDocuments = filteredDocuments.filter(doc => doc.id !== 'employment_letter');
        } else if (employmentType === 'student' || employmentType === 'salaried') {
          // Student and Salaried: Make Employment Letter required
          filteredDocuments = filteredDocuments.map(doc => {
            if (doc.id === 'employment_letter') {
              return { ...doc, required: true };
            }
            return doc;
          });
        }
        
        return {
          ...category,
          documents: filteredDocuments
        };
      } else if (category.category === 'Financial Documents') {
        let filteredDocuments = [...category.documents];
        
        if (employmentType === 'student' || employmentType === 'salaried') {
          // Student and Salaried: Remove Accountant Letter
          filteredDocuments = filteredDocuments.filter(doc => doc.id !== 'accountant_letter');
        }
        // Self-Employed: Keep Accountant Letter (no filtering needed)
        
        return {
          ...category,
          documents: filteredDocuments
        };
      }
      return category;
    });
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

  // Process Pay Stubs sections based on frequency
  const processedDocuments = (filteredDocuments || []).map(category => {
    if (category.category === 'Employment Documents') {
      return {
        ...category,
        documents: category.documents.flatMap(document => {
          if (document.isPayStubs) {
            // Generate Pay Stubs sections based on frequency
            return generatePayStubsSections(getCurrentIncomeFrequency());
          }
          return [document];
        })
      };
    }
    return category;
  });

  // Add Other Occupant Documents category if there are other occupants
  const otherOccupants = Array.isArray(formData?.otherOccupants) ? formData.otherOccupants : [];
  let filteredDocumentsWithOccupants = [...(processedDocuments || [])];
  if (otherOccupants && otherOccupants.length > 0) {
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
      {(filteredDocumentsWithOccupants || []).map((category) => (
        <div key={category.category} className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            {category.icon}
            <h3 className="font-medium text-gray-800">{category.category}</h3>
          </div>
          
          {/* Employment Type Info Note */}
          {category.category === 'Employment Documents' && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-green-700">
                <span className="font-medium">Employment Type Requirements:</span> 
                {(() => {
                  if (relevantEmploymentType === 'self-employed') {
                    return ' Self-Employed: Pay Stubs only (no Employment Letter), Accountant Letter required.';
                  } else if (relevantEmploymentType === 'student') {
                    return ' Student: Employment Letter + Pay Stubs (no Accountant Letter).';
                  } else if (relevantEmploymentType === 'salaried') {
                    return ' Salaried: Employment Letter + Pay Stubs (no Accountant Letter).';
                  }
                  return ' Please select your employment type in the Financial Information section to see specific requirements.';
                })()}
              </div>
            </div>
          )}
          
          {/* Pay Stubs Info Note */}
          {category.category === 'Employment Documents' && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-700">
                <span className="font-medium">Pay Stubs Info:</span> Based on your income frequency selection in the Financial Information section, {payStubsFrequencyOptions.find(opt => opt.value === getCurrentIncomeFrequency())?.count} Pay Stubs section{payStubsFrequencyOptions.find(opt => opt.value === getCurrentIncomeFrequency())?.count !== 1 ? 's' : ''} will be created for you to upload.
              </div>
            </div>
          )}
          

          
          <div className="grid grid-cols-1 gap-4">
            {(category.documents || []).map((document) => {
              const docStatus = getDocumentStatus(document.id);
              return (
                <div key={document.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-gray-900 break-words">{document.name}</h4>
                        {document.required && (
                          <Badge variant="destructive" className="text-xs flex-shrink-0">Required</Badge>
                        )}
                        {!document.required && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Optional</Badge>
                        )}
                        {/* Show person type badge */}
                        <Badge 
                          variant="outline" 
                          className={`text-xs flex-shrink-0 ${
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
                      {docStatus.status === "uploaded" ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs font-medium">Uploaded ({docStatus.count} file{docStatus.count > 1 ? 's' : ''})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs">Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                  

                  <div>
                    {/* Check if document is uploaded (either via webhook or encrypted documents) */}
                    {(() => {
                      // Use the same logic as getDocumentStatus to determine if document is uploaded
                      const docStatus = getDocumentStatus(document.id);
                      const isUploaded = docStatus.status === "uploaded";
                      
                      if (isUploaded && !reuploadRequested[document.id]) {
                        // Show preview and re-upload option when document is uploaded
                        const uploadedDocs = getUploadedDocuments(document.id);
                        const hasWebhookUrl = uploadedDocs.length > 0 && uploadedDocs[0]?.webhookbodyUrl;
                        
                        return (
                          <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                  <span className="text-sm font-medium text-green-800">
                                    Document uploaded successfully
                                  </span>
                                </div>
                                
                                {/* File information */}
                                {hasWebhookUrl && (
                                  <div className="flex items-center gap-2 p-2 bg-white rounded border border-green-100">
                                    <FileText className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-green-700 font-medium">
                                      {uploadedDocs[0].filename}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex flex-col gap-2 flex-shrink-0">
                                {hasWebhookUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreviewDocument(
                                      uploadedDocs[0].filename, 
                                      uploadedDocs[0].webhookbodyUrl, 
                                      document.name
                                    )}
                                    className="h-8 px-3 text-xs border-green-200 text-green-700 hover:bg-green-50"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Preview
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReuploadRequested(prev => ({
                                      ...prev,
                                      [document.id]: true
                                    }));
                                  }}
                                  className="h-8 px-3 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  Re-upload
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      } else if (!isUploaded || reuploadRequested[document.id]) {
                        // Show FileUpload when re-upload is requested or document is not uploaded
                        return (
                          <>
                            <FileUpload
                              onFileChange={(files) => {
                                // Always pass the original document ID to the parent function
                                // The parent function will handle the index parameter separately
                                console.log(`🔑 SupportingDocuments: Calling onDocumentChange for ${document.id} with index ${index}`);
                                console.log(`🔑 SupportingDocuments: Files to upload:`, files.map(f => ({ name: f.name, size: f.size, lastModified: f.lastModified })));
                                console.log(`🔑 SupportingDocuments: This should upload to ${showOnlyCoApplicant ? 'Co-Applicant' : showOnlyGuarantor ? 'Guarantor' : 'Unknown'} ${index !== undefined ? index + 1 : 'Unknown'}`);
                                
                                // For co-applicants and guarantors, we need to create a custom function that includes the index
                                if (showOnlyCoApplicant && index !== undefined) {
                                  // Create a custom document change handler that includes the index
                                  const customDocumentChange = (documentType: string, files: File[]) => {
                                    console.log(`🔑 Custom co-applicant document change: ${documentType} with index ${index}`);
                                    // Call the parent's onDocumentChange with the index
                                    (onDocumentChange as any)(documentType, files, index);
                                  };
                                  customDocumentChange(document.id, files);
                                } else if (showOnlyGuarantor && index !== undefined) {
                                  // Create a custom document change handler that includes the index
                                  const customDocumentChange = (documentType: string, files: File[]) => {
                                    console.log(`🔑 Custom guarantor document change: ${documentType} with index ${index}`);
                                    // Call the parent's onDocumentChange with the index
                                    (onDocumentChange as any)(documentType, files, index);
                                  };
                                  customDocumentChange(document.id, files);
                                } else {
                                  // For regular applicants, call normally
                                  onDocumentChange(document.id, files);
                                }
                              }}
                              onEncryptedFilesChange={(encryptedFiles) => {
                                // Always pass the original document ID to the parent function
                                // The parent function will handle the index parameter separately
                                console.log(`🔑 SupportingDocuments: Calling onEncryptedDocumentChange for ${document.id} with index ${index}`);
                                console.log(`🔑 SupportingDocuments: Encrypted files to upload:`, encryptedFiles.map(f => ({ 
                                  filename: f.filename, 
                                  size: f.encryptedData.length,
                                  originalSize: f.originalSize,
                                  uploadDate: f.uploadDate
                                })));
                                console.log(`🔑 SupportingDocuments: This should upload to ${showOnlyCoApplicant ? 'Co-Applicant' : showOnlyGuarantor ? 'Guarantor' : 'Unknown'} ${index !== undefined ? index + 1 : 'Unknown'}`);
                                
                                // For co-applicants and guarantors, we need to create a custom function that includes the index
                                if (showOnlyCoApplicant && index !== undefined) {
                                  // Create a custom encrypted document change handler that includes the index
                                  const customEncryptedDocumentChange = (documentType: string, encryptedFiles: EncryptedFile[]) => {
                                    console.log(`🔑 Custom co-applicant encrypted document change: ${documentType} with index ${index}`);
                                    // Call the parent's onEncryptedDocumentChange with the index
                                    (onEncryptedDocumentChange as any)?.(documentType, encryptedFiles, index);
                                  };
                                  customEncryptedDocumentChange(document.id, encryptedFiles);
                                } else if (showOnlyGuarantor && index !== undefined) {
                                  // Create a custom encrypted document change handler that includes the index
                                  const customEncryptedDocumentChange = (documentType: string, encryptedFiles: EncryptedFile[]) => {
                                    console.log(`🔑 Custom guarantor encrypted document change: ${documentType} with index ${index}`);
                                    // Call the parent's onEncryptedDocumentChange with the index
                                    (onEncryptedDocumentChange as any)?.(documentType, encryptedFiles, index);
                                  };
                                  customEncryptedDocumentChange(document.id, encryptedFiles);
                                } else {
                                  // For regular applicants, call normally
                                  onEncryptedDocumentChange?.(document.id, encryptedFiles);
                                }
                              }}
                              onWebhookResponse={(response) => {
                                // Clear re-upload state when file is uploaded
                                setReuploadRequested(prev => ({
                                  ...prev,
                                  [document.id]: false
                                }));
                                // Always pass the original document ID to the parent function
                                // The parent function will handle the index parameter separately
                                console.log(`🔑 SupportingDocuments: Calling onWebhookResponse for ${document.id} with index ${index}`);
                                
                                // For co-applicants and guarantors, we need to create a custom function that includes the index
                                if (showOnlyCoApplicant && index !== undefined) {
                                  // Create a custom webhook response handler that includes the index
                                  const customWebhookResponse = (documentType: string, response: any) => {
                                    console.log(`🔑 Custom co-applicant webhook response: ${documentType} with index ${index}`);
                                    // Call the parent's onWebhookResponse with the index
                                    (onWebhookResponse as any)?.(documentType, response, index);
                                  };
                                  customWebhookResponse(document.id, response);
                                } else if (showOnlyGuarantor && index !== undefined) {
                                  // Create a custom webhook response handler that includes the index
                                  const customWebhookResponse = (documentType: string, response: any) => {
                                    console.log(`🔑 Custom guarantor webhook response: ${documentType} with index ${index}`);
                                    // Call the parent's onWebhookResponse with the index
                                    (onWebhookResponse as any)?.(documentType, response, index);
                                  };
                                  customWebhookResponse(document.id, response);
                                } else {
                                  // For regular applicants, call normally
                                  onWebhookResponse?.(document.id, response);
                                }
                              }}
                              initialWebhookResponse={
                                // For indexed people (coApplicants, guarantors), we need to look up the webhook response
                                // using the original webhook responses with the indexed key
                                (() => {
                                  if (index !== undefined && (showOnlyCoApplicant || showOnlyGuarantor) && originalWebhookResponses) {
                                    const indexedKey = `${showOnlyCoApplicant ? 'coApplicants' : 'guarantors'}_${index}_${document.id}`;
                                    const response = originalWebhookResponses[indexedKey];
                                    console.log(`🔍 SupportingDocuments: Looking up webhook response for ${indexedKey}:`, response);
                                    return response;
                                  } else {
                                    const response = formData.webhookResponses?.[document.id];
                                    console.log(`🔍 SupportingDocuments: Looking up webhook response for ${document.id}:`, response);
                                    return response;
                                  }
                                })()
                              }
                              accept={document.acceptedTypes}
                              multiple={false}
                              maxFiles={1}
                              maxSize={50}
                              label={
                                // For co-applicants and guarantors, include the index in the label
                                (() => {
                                  if (showOnlyCoApplicant && index !== undefined) {
                                    return `Upload Co-Applicant ${index + 1} - ${document.name}`;
                                  } else if (showOnlyGuarantor && index !== undefined) {
                                    return `Upload Guarantor ${index + 1} - ${document.name}`;
                                  } else {
                                    return `Upload ${document.name}`;
                                  }
                                })()
                              }
                              className="mt-2"
                              enableEncryption={true}
                              referenceId={
                                // For co-applicants and guarantors, include the index in the reference ID
                                (() => {
                                  if (showOnlyCoApplicant && index !== undefined) {
                                    return `${referenceId}_coApplicant_${index}`;
                                  } else if (showOnlyGuarantor && index !== undefined) {
                                    return `${referenceId}_guarantor_${index}`;
                                  } else {
                                    return referenceId;
                                  }
                                })()
                              }
                              sectionName={
                                // For co-applicants and guarantors, include the index in the section name
                                (() => {
                                  if (showOnlyCoApplicant && index !== undefined) {
                                    return `coApplicants_${index}_${document.id}`;
                                  } else if (showOnlyGuarantor && index !== undefined) {
                                    return `guarantors_${index}_${document.id}`;
                                  } else {
                                    return document.id;
                                  }
                                })()
                              }
                              documentName={
                                // For co-applicants and guarantors, include the index in the document name
                                (() => {
                                  if (showOnlyCoApplicant && index !== undefined) {
                                    return `Co-Applicant ${index + 1} - ${document.name}`;
                                  } else if (showOnlyGuarantor && index !== undefined) {
                                    return `Guarantor ${index + 1} - ${document.name}`;
                                  } else {
                                    return document.name;
                                  }
                                })()
                              }
                              enableWebhook={enableWebhook}
                              applicationId={
                                // For co-applicants and guarantors, include the index in the application ID
                                (() => {
                                  if (showOnlyCoApplicant && index !== undefined) {
                                    return `${applicationId}_coApplicant_${index}`;
                                  } else if (showOnlyGuarantor && index !== undefined) {
                                    return `${applicationId}_guarantor_${index}`;
                                  } else {
                                    return applicationId;
                                  }
                                })()
                              }
                              zoneinfo={
                                // For co-applicants and guarantors, include the index in the zoneinfo
                                (() => {
                                  if (showOnlyCoApplicant && index !== undefined) {
                                    return `${zoneinfo}_coApplicant_${index}`;
                                  } else if (showOnlyGuarantor && index !== undefined) {
                                    return `${zoneinfo}_guarantor_${index}`;
                                  } else {
                                    return zoneinfo;
                                  }
                                })()
                              }
                              commentId={
                                // For co-applicants and guarantors, include the index in the comment ID
                                (() => {
                                  if (showOnlyCoApplicant && index !== undefined) {
                                    return `coApplicants_${index}_${document.id}`;
                                  } else if (showOnlyGuarantor && index !== undefined) {
                                    return `guarantors_${index}_${document.id}`;
                                  } else {
                                    return document.id;
                                  }
                                })()
                              }
                            />
                            {/* Show cancel button when re-upload is requested */}
                            {reuploadRequested[document.id] && (
                              <div className="mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReuploadRequested(prev => ({
                                      ...prev,
                                      [document.id]: false
                                    }));
                                  }}
                                  className="h-6 px-2 text-xs border-gray-200 text-gray-700 hover:bg-gray-50 flex-shrink-0"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel Re-upload
                                </Button>
                              </div>
                            )}
                          </>
                        );
                      }
                      
                      return null;
                    })()}
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
