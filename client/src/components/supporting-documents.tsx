import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileUpload } from "./ui/file-upload";
import { Badge } from "./ui/badge";
import { CheckCircle, AlertCircle, FileText, DollarSign, Building, User, CreditCard, Shield, UserCheck } from "lucide-react";
import { type EncryptedFile } from "@/lib/file-encryption";

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
    documents?: Record<string, File[]>;
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
    
    // Check for uploaded documents from draft data
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
    
    // Check for encrypted documents from draft data
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
    
    // Check for direct file uploads
    if (documents && documents.length > 0) {
      return {
        status: "uploaded",
        count: documents.length
      };
    }
    
    // Check for webhook responses with person prefixes
    const personPrefixes = ['applicant_', 'coApplicant_', 'guarantor_'];
    for (const prefix of personPrefixes) {
      const prefixedDocumentId = prefix + documentId;
      const prefixedWebhookResponse = formData.webhookResponses?.[prefixedDocumentId];
      if (prefixedWebhookResponse && typeof prefixedWebhookResponse === 'string' && prefixedWebhookResponse.trim()) {
        return {
          status: "uploaded",
          count: 1
        };
      }
    }
    
    return {
      status: "pending",
      count: 0
    };
  };

  // Helper to get uploaded files for a specific document from draft data
  const getUploadedFilesForDocument = (documentId: string) => {
    const uploadedFilesMetadata = formData.uploadedFilesMetadata;
    const webhookResponses = formData.webhookResponses;
    
    // Check for documents in uploadedFilesMetadata
    if (uploadedFilesMetadata) {
      const uploadedFiles = uploadedFilesMetadata[documentId];
      if (uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
        return uploadedFiles;
      }
      
      // Check for documents with person prefix (e.g., applicant_photo_id, guarantor_photo_id)
      const personPrefixes = ['applicant_', 'coApplicant_', 'guarantor_'];
      for (const prefix of personPrefixes) {
        const prefixedDocumentId = prefix + documentId;
        const prefixedFiles = uploadedFilesMetadata[prefixedDocumentId];
        if (prefixedFiles && Array.isArray(prefixedFiles) && prefixedFiles.length > 0) {
          return prefixedFiles;
        }
      }
    }
    
    // Check for webhook responses
    if (webhookResponses) {
      // Check direct webhook response
      const webhookResponse = webhookResponses[documentId];
      if (webhookResponse && typeof webhookResponse === 'string' && webhookResponse.trim()) {
        return [{
          filename: `Uploaded Document`,
          webhookbodyUrl: webhookResponse,
          file_name: `Uploaded Document`,
          upload_date: new Date().toISOString()
        }];
      }
      
      // Check for webhook responses with person prefixes
      const personPrefixes = ['applicant_', 'coApplicant_', 'guarantor_'];
      for (const prefix of personPrefixes) {
        const prefixedDocumentId = prefix + documentId;
        const prefixedWebhookResponse = webhookResponses[prefixedDocumentId];
        if (prefixedWebhookResponse && typeof prefixedWebhookResponse === 'string' && prefixedWebhookResponse.trim()) {
          return [{
            filename: `Uploaded ${documentId.replace(/_/g, ' ')}`,
            webhookbodyUrl: prefixedWebhookResponse,
            file_name: `Uploaded ${documentId.replace(/_/g, ' ')}`,
            upload_date: new Date().toISOString()
          }];
        }
      }
    }
    
    return null;
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
                        {docStatus.count} file{docStatus.count > 1 ? 's' : ''} uploaded from draft
                      </p>
                      
                      {/* Show uploaded files preview */}
                      {(() => {
                        const uploadedFiles = getUploadedFilesForDocument(document.id);
                        if (uploadedFiles && uploadedFiles.length > 0) {
                          return (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-medium text-green-800">Uploaded Files:</p>
                              <div className="space-y-1">
                                {uploadedFiles.map((file, index) => (
                                  <div key={index} className="flex items-center gap-2 text-xs text-green-700 bg-green-100 rounded px-2 py-1">
                                    <FileText className="h-3 w-3" />
                                    <span className="truncate">{file.filename || file.file_name || `File ${index + 1}`}</span>
                                    {file.webhookbodyUrl && (
                                      <a 
                                        href={file.webhookbodyUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline"
                                      >
                                        View
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
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
    </div>
  );
};
