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
  documentStatuses?: { [docType: string]: { status: string; publicUrl?: string } };
}

export function DocumentSection({ title, person, onDocumentChange, onEncryptedDocumentChange, referenceId, enableWebhook, applicationId, documentStatuses = {} }: DocumentSectionProps) {
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
      description: "PNG, JPG, PDF up to 10MB - Encrypted",
      accept: ".pdf,.jpg,.jpeg,.png"
    },
    {
      key: "ssn",
      label: "Social Security Card",
      description: "PNG, JPG, PDF up to 10MB - Encrypted",
      accept: ".pdf,.jpg,.jpeg,.png"
    },
    {
      key: "w9",
      label: "W9 Form",
      description: "PDF up to 10MB - Encrypted",
      accept: ".pdf"
    },
    {
      key: "payStubs",
      label: "Pay Stubs (Last 2-4)",
      description: "PDF up to 10MB each - Encrypted",
      accept: ".pdf",
      multiple: true
    },
    {
      key: "taxReturns",
      label: "Tax Returns (Previous Year)",
      description: "PDF up to 10MB - Encrypted",
      accept: ".pdf"
    },
    {
      key: "bankStatements",
      label: "Bank Statements",
      description: "PDF up to 10MB each - Encrypted",
      accept: ".pdf",
      multiple: true
    },
    {
      key: "employmentLetter",
      label: "Employment Letter",
      description: "PDF up to 10MB - Encrypted",
      accept: ".pdf"
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
          {documentTypes.map((docType) => {
            const docStatus = documentStatuses[docType.key] || { status: "Missing" };
            return (
              <div key={docType.key} className="form-field">
                {docStatus.status === "Received" && docStatus.publicUrl ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-green-700 text-sm font-medium flex items-center gap-1">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 text-green-600"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Document received
                    </span>
                    <a
                      href={docStatus.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-xs mt-1 block"
                    >
                      Preview Uploaded File
                    </a>
                  </div>
                ) : (
                  <FileUpload
                    label={docType.label}
                    description={docType.description}
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
                )}
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
