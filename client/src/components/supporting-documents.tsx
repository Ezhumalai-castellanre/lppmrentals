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
    // Check for regular documents
    const files = formData.documents?.[documentId];
    if (files && files.length > 0) {
      return { status: "uploaded", count: files.length };
    }
    
    // Check for webhook responses
    const webhookResponses = formData.webhookResponses?.[documentId];
    if (webhookResponses) {
      return { status: "uploaded", count: Array.isArray(webhookResponses) ? webhookResponses.length : 1 };
    }
    
    // Check for encrypted documents (for guarantor, co-applicant, etc.)
    if (showOnlyGuarantor && formData.encryptedDocuments?.guarantor?.[documentId]) {
      const encryptedFiles = formData.encryptedDocuments.guarantor[documentId];
      return { status: "uploaded", count: encryptedFiles.length };
    }
    
    if (showOnlyCoApplicant && formData.encryptedDocuments?.coApplicant?.[documentId]) {
      const encryptedFiles = formData.encryptedDocuments.coApplicant[documentId];
      return { status: "uploaded", count: encryptedFiles.length };
    }
    
    return { status: "pending", count: 0 };
  };

  // Determine employment type for applicant and co-applicant
  const applicantEmploymentType = formData?.applicant?.employmentType;
  const coApplicantEmploymentType = formData?.coApplicant?.employmentType;

  // Helper to get allowed categories for a given employment type
  function allowedCategoriesForType(type: string | undefined) {
    if (!type) return new Set(requiredDocuments.map(c => c.category));
    if (type === 'salaried' || type === 'employed') {
      // Hide Self-Employed Documents
      return new Set(requiredDocuments.map(c => c.category).filter(cat => cat !== 'Self-Employed Documents'));
    }
    if (type === 'self-employed') {
      // Hide Employment Verification
      return new Set(requiredDocuments.map(c => c.category).filter(cat => cat !== 'Employment Verification'));
    }
    if (["unemployed", "retired", "student"].includes(type)) {
      return new Set(requiredDocuments.map(c => c.category).filter(cat => cat !== 'Employment Verification' && cat !== 'Self-Employed Documents'));
    }
    return new Set(requiredDocuments.map(c => c.category));
  }

  // Compute allowed categories (union if both applicant and co-applicant)
  let allowedCategories = allowedCategoriesForType(applicantEmploymentType);
  if (coApplicantEmploymentType) {
    const coAllowed = allowedCategoriesForType(coApplicantEmploymentType);
    allowedCategories = new Set([...Array.from(allowedCategories), ...Array.from(coAllowed)]);
  }

  // Filter requiredDocuments based on allowed categories
  const filteredDocuments = requiredDocuments.filter((category) => allowedCategories.has(category.category));

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
                      multiple={false}
                      maxFiles={1}
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
