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
      guarantor?: Record<string, any[]>;
      coApplicant?: Record<string, any[]>;
    };
    applicant?: { employmentType?: string };
    coApplicant?: { employmentType?: string };
    guarantor?: { employmentType?: string };
    otherOccupants?: any[];
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
        
        // For self-employed: show Accountant Letter, hide Employment Letter
        if (employmentType === 'self-employed') {
          return document.id !== 'employment_letter';
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
                          <span className="text-xs">{docStatus.count} file(s)</span>
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
