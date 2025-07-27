import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { type EncryptedFile } from "@/lib/file-encryption";

interface DocumentSectionProps {
  title: string;
  person: "applicant" | "coApplicant" | "guarantor";
  onDocumentChange: (person: string, documentType: string, files: File[]) => void;
  onEncryptedDocumentChange?: (person: string, documentType: string, encryptedFiles: EncryptedFile[]) => void;
  referenceId?: string;
  enableWebhook?: boolean;
  applicationId?: string;
}

export function DocumentSection({ title, person, onDocumentChange, onEncryptedDocumentChange, referenceId, enableWebhook, applicationId }: DocumentSectionProps) {
  // Debug logging
  console.log('DocumentSection props:', { title, person, referenceId, enableWebhook, applicationId });
  
  // Special debugging for guarantor
  if (person === 'guarantor') {
    console.log('🔍 GUARANTOR DocumentSection rendered:', {
      title,
      person,
      referenceId,
      enableWebhook,
      applicationId,
      hasOnEncryptedDocumentChange: !!onEncryptedDocumentChange
    });
  }
  
  const documentTypes = [
    {
      key: "id",
      label: "Photo ID / Driver's License",
      accept: ".pdf,.jpg,.jpeg,.png"
    },
    {
      key: "ssn",
      label: "Social Security Card",
      accept: ".pdf,.jpg,.jpeg,.png"
    },
    {
      key: "w9",
      label: "W9 Form",
      accept: ".pdf"
    },
    {
      key: "employmentLetter",
      label: "Employment Letter",
      accept: ".pdf"
    },
    {
      key: "payStubs",
      label: "Pay Stubs (Last 2-4)",
      accept: ".pdf",
      multiple: true
    },
    {
      key: "taxReturns",
      label: "Tax Returns (Previous Year)",
      accept: ".pdf",
      multiple: true
    },
    {
      key: "bankStatements",
      label: "Bank Statements",
      accept: ".pdf",
      multiple: true
    }
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <div className="bg-green-50 p-3 rounded-lg mt-2">
          <p className="text-sm text-green-800">
            <span className="font-medium">🔒 Security Notice:</span> All documents uploaded in this section will be encrypted before transmission to ensure your privacy and data security.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {documentTypes.map((docType) => (
            <div key={docType.key} className="form-field">
              <FileUpload
                label={docType.label}
                accept={docType.accept}
                multiple={docType.multiple || false}
                onFileChange={(files) => onDocumentChange(person, docType.key, files)}
                onEncryptedFilesChange={(encryptedFiles) => onEncryptedDocumentChange?.(person, docType.key, encryptedFiles)}
                enableEncryption={true}
                referenceId={referenceId}
                sectionName={`${person}_${docType.key}`}
                documentName={docType.label}
                enableWebhook={enableWebhook}
                applicationId={applicationId}
              />
              {docType.key === "w9" && (
                <a
                  href="https://www.dropbox.com/scl/fi/oy8nea1nx6k199m5ylpym/fw9-2.pdf?rlkey=ot7y1x1qno3gpwed7lozkpqcv&e=1&st=fd7a1cgj&dl=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-xs mt-1 block"
                >
                  View Sample W9 Form
                </a>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
