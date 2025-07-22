import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileUpload } from "./ui/file-upload";
import { Badge } from "./ui/badge";
import { CheckCircle, AlertCircle, FileText, DollarSign, Building, User, CreditCard, Shield } from "lucide-react";
import { type EncryptedFile } from "@/lib/file-encryption";

interface SupportingDocumentsProps {
  formData: any;
  onDocumentChange: (documentType: string, files: File[]) => void;
  onEncryptedDocumentChange?: (documentType: string, encryptedFiles: EncryptedFile[]) => void;
  referenceId?: string;
  enableWebhook?: boolean;
  applicationId?: string;
}

export function SupportingDocuments({ formData, onDocumentChange, onEncryptedDocumentChange, referenceId, enableWebhook, applicationId }: SupportingDocumentsProps) {
  const requiredDocuments = [
    {
      category: "Identity Documents",
      icon: <User className="h-4 w-4" />,
      documents: [
        {
          id: "photo_id",
          name: "Driver's License",
          description: "Driver's license, state ID, or passport (all applicants 18+)",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        },
        {
          id: "social_security",
          name: "Social Security Card",
          description: "Original or certified copy",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        }
      ]
    },
    {
      category: "Financial Documents",
      icon: <DollarSign className="h-4 w-4" />,
      documents: [
        {
          id: "bank_statement",
          name: "Bank Statement",
          description: "Most recent bank statement (checking/savings)",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        },
        {
          id: "tax_returns",
          name: "Tax Returns",
          description: "Previous year tax returns (first page)",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        }
      ]
    },
    {
      category: "Employment Verification",
      icon: <Building className="h-4 w-4" />,
      documents: [
        {
          id: "employment_letter",
          name: "Employment Letter",
          description: "Letter on company letterhead with salary, position, and employment length",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        },
        {
          id: "pay_stubs",
          name: "Pay Stubs",
          description: "Last 4 pay stubs (weekly) or last 2 pay stubs (bi-weekly/semi-monthly)",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        }
      ]
    },
    {
      category: "Self-Employed Documents",
      icon: <FileText className="h-4 w-4" />,
      documents: [
        {
          id: "accountant_letter",
          name: "Accountant Letter",
          description: "Notarized letter from accountant on company letterhead",
          required: false,
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
          description: "Recent credit report (optional but recommended)",
          required: true, // Now required
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        },
        {
          id: "w9_forms",
          name: "W9",
          description: "Previous year 1099 forms (if self-employed)",
          required: false,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        },
        {
          id: "reference_letters",
          name: "Reference Letters",
          description: "Personal or professional references",
          required: false,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        }
      ]
    }
  ];

  const getDocumentStatus = (documentId: string) => {
    const files = formData.documents?.[documentId];
    if (files && files.length > 0) {
      return { status: "uploaded", count: files.length };
    }
    return { status: "pending", count: 0 };
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Supporting Documents</CardTitle>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-800">
            <span className="font-medium">🔒 Security Notice:</span> All documents uploaded in this section will be encrypted before transmission to ensure your privacy and data security.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {requiredDocuments.map((category) => (
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
                        <p className="text-sm text-gray-600 mt-1">{document.description}</p>
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
                    
                    <FileUpload
                      onFileChange={(files) => onDocumentChange(document.id, files)}
                      onEncryptedFilesChange={(encryptedFiles) => onEncryptedDocumentChange?.(document.id, encryptedFiles)}
                      accept={document.acceptedTypes}
                      multiple={true}
                      maxFiles={5}
                      maxSize={10}
                      label={`Upload ${document.name}`}
                      description="Max 5 files, 10MB each. Accepted: JPG, PNG, PDF - Encrypted"
                      className="mt-2"
                      enableEncryption={true}
                      referenceId={referenceId}
                      sectionName={`supporting_${document.id}`}
                      documentName={document.name}
                      enableWebhook={enableWebhook}
                      applicationId={applicationId}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Important Notes:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Documents must be current and legible</li>
            <li>• Corporate applicants require additional documentation</li>
            <li>• Self-employed applicants need accountant verification</li>
            <li>• Incomplete applications will delay processing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}