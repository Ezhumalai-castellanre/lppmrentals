import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileUpload } from "./ui/file-upload";
import { Badge } from "./ui/badge";
import { CheckCircle, AlertCircle, FileText, DollarSign, Building, User, CreditCard, Shield, UserCheck, Building2, Briefcase, GraduationCap, Eye, Download, X } from "lucide-react";
import { type EncryptedFile } from "@/lib/file-encryption";
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

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
  showOnlyGuarantor = false
}: SupportingDocumentsProps): JSX.Element => {
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    filename: string;
  }>({
    isOpen: false,
    title: '',
    url: '',
    filename: ''
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
    const documents = formData.documents?.[documentId] || [];
    const webhookResponse = formData.webhookResponses?.[documentId];
    
    // Check if we have a webhook response (S3 URL) indicating successful upload
    if (webhookResponse && typeof webhookResponse === 'string' && webhookResponse.trim()) {
      return {
        status: "uploaded",
        count: 1 // We have a successful upload
      };
    }
    
    
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
      
      // Check for documents with person prefix (e.g., applicant_photo_id, guarantor_photo_id)
      const personPrefixes = ['applicant_', 'coApplicant_', 'guarantor_'];
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
    
    
    const encryptedDocuments = formData.encryptedDocuments;
    if (encryptedDocuments) {
      // Check for documents with person prefix in encryptedDocuments
      if (encryptedDocuments.applicant && encryptedDocuments.applicant[documentId]) {
        const files = encryptedDocuments.applicant[documentId];
        if (Array.isArray(files) && files.length > 0) {
          return {
            status: "uploaded",
            count: files.length
          };
        }
      }
      
      if (encryptedDocuments.coApplicant && encryptedDocuments.coApplicant[documentId]) {
        const files = encryptedDocuments.coApplicant[documentId];
        if (Array.isArray(files) && files.length > 0) {
          return {
            status: "uploaded",
            count: files.length
          };
        }
      }
      
      if (encryptedDocuments.guarantor && encryptedDocuments.guarantor[documentId]) {
        const files = encryptedDocuments.guarantor[documentId];
        if (Array.isArray(files) && files.length > 0) {
          return {
            status: "uploaded",
            count: files.length
          };
        }
      }
    }
    
    // Fall back to checking actual files
    if (documents.length > 0) {
      return {
        status: "uploaded",
        count: documents.length
      };
    }
    
    return {
      status: "pending",
      count: 0
    };
  };

  const getUploadedDocuments = (documentId: string) => {
    const documents = formData.documents;
    if (!documents) return [];

    // Check for documents in the new structure with webhookbodyUrl
    const uploadedDocs: Array<{ filename: string; webhookbodyUrl: string }> = [];
    
    // Check applicant documents
    if (documents.applicant) {
      const applicantDocs = documents.applicant as Record<string, Array<{ filename: string; webhookbodyUrl: string }>>;
      if (applicantDocs[documentId]) {
        uploadedDocs.push(...applicantDocs[documentId]);
      }
    }
    
    // Check co-applicant documents
    if (documents.coApplicant) {
      const coApplicantDocs = documents.coApplicant as Record<string, Array<{ filename: string; webhookbodyUrl: string }>>;
      if (coApplicantDocs[documentId]) {
        uploadedDocs.push(...coApplicantDocs[documentId]);
      }
    }
    
    // Check guarantor documents
    if (documents.guarantor) {
      const guarantorDocs = documents.guarantor as Record<string, Array<{ filename: string; webhookbodyUrl: string }>>;
      if (guarantorDocs[documentId]) {
        uploadedDocs.push(...guarantorDocs[documentId]);
      }
    }
    
    // Check other occupants documents
    if (documents.otherOccupants) {
      const otherOccupantsDocs = documents.otherOccupants as Record<string, Array<{ filename: string; webhookbodyUrl: string }>>;
      Object.entries(otherOccupantsDocs).forEach(([key, files]) => {
        if (key.includes(documentId) && Array.isArray(files)) {
          uploadedDocs.push(...files);
        }
      });
    }

    return uploadedDocs;
  };

  const handlePreviewDocument = (filename: string, webhookbodyUrl: string, documentName: string) => {
    setPreviewModal({
      isOpen: true,
      title: documentName,
      url: webhookbodyUrl,
      filename: filename
    });
  };

  const handleDownloadDocument = (webhookbodyUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = webhookbodyUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClosePreview = () => {
    setPreviewModal(prev => ({ ...prev, isOpen: false }));
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {docStatus.status === "uploaded" ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Already Uploaded ({docStatus.count} file{docStatus.count > 1 ? 's' : ''})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xs">Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Show uploaded files info if available */}
                  {docStatus.status === "uploaded" && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Document uploaded successfully</span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        {docStatus.count} file{docStatus.count > 1 ? 's' : ''} uploaded
                      </p>
                      
                      {/* Show uploaded documents with preview/download options */}
                      {(() => {
                        const uploadedDocs = getUploadedDocuments(document.id);
                        if (uploadedDocs.length > 0) {
                          return (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-medium text-green-800">Uploaded Files:</p>
                              {uploadedDocs.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between bg-white rounded border p-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-green-600" />
                                    <span className="text-xs text-gray-700">{doc.filename}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePreviewDocument(doc.filename, doc.webhookbodyUrl, document.name)}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Preview
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDownloadDocument(doc.webhookbodyUrl, doc.filename)}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewModal.title}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleClosePreview}>
              <X className="h-4 w-4 mr-2" /> Close
            </Button>
            <Button onClick={() => handleDownloadDocument(previewModal.url, previewModal.filename)}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button onClick={() => handlePreviewDocument(previewModal.filename, previewModal.url, previewModal.title)}>
              <Eye className="h-4 w-4 mr-2" /> Preview
            </Button>
          </div>
          {previewModal.url && (
            <iframe
              src={previewModal.url}
              style={{ width: '100%', height: 'calc(100vh - 250px)', border: 'none' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
