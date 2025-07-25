import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileUpload } from "./ui/file-upload";
import { Badge } from "./ui/badge";
import { CheckCircle, AlertCircle, FileText, DollarSign, Building, User, CreditCard, Shield, UserCheck } from "lucide-react";
import { type EncryptedFile } from "@/lib/file-encryption";

interface SupportingDocumentsProps {
  formData: any;
  onDocumentChange: (documentType: string, files: File[]) => void;
  onEncryptedDocumentChange?: (documentType: string, encryptedFiles: EncryptedFile[]) => void;
  referenceId?: string;
  enableWebhook?: boolean;
  applicationId?: string;
  showOnlyCoApplicant?: boolean;
  showOnlyGuarantor?: boolean;
}

export function SupportingDocuments({ formData, onDocumentChange, onEncryptedDocumentChange, referenceId, enableWebhook, applicationId, showOnlyCoApplicant = false, showOnlyGuarantor = false }: SupportingDocumentsProps) {
  const requiredDocuments = [
    {
      category: "Identity Documents",
      icon: <User className="h-4 w-4" />,
      documents: [
        
        {
          id: "photo_id",
          name: "Driver's License",
          description: "Driver's License",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        },
        {
          id: "social_security",
          name: "Social Security Card",
          description: "Original or certified copy",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        },
        {
          id: "w9_forms",
          name: "W9",
          description: "W9 form",
          required: true,
          acceptedTypes: ".jpg,.jpeg,.png,.pdf"
        }
      ]
    },
    {
      category: "Financial Documents",
      icon: <DollarSign className="h-4 w-4" />,
      documents: [
        // W9 removed from here
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
        }
      ]
    }
  ];

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
    allowedCategories = new Set(Array.from(allowedCategories).concat(Array.from(coAllowed)));
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
          description: 'Driver\'s license, state ID, or passport for at least one other occupant',
          required: true,
          acceptedTypes: '.jpg,.jpeg,.png,.pdf'
        }
      ]
    });
  }

  // Co-Applicant Documents logic
  let coApplicantDocuments: any[] = [];
  if (formData?.coApplicant && formData.coApplicant.employmentType) {
    const coAllowedCategories = allowedCategoriesForType(formData.coApplicant.employmentType);
    coApplicantDocuments = requiredDocuments.filter((category) => coAllowedCategories.has(category.category));
  }

  // Guarantor Documents logic
  let guarantorDocuments: any[] = [];
  if (formData?.guarantor && formData.guarantor.employmentType) {
    const guarAllowedCategories = allowedCategoriesForType(formData.guarantor.employmentType);
    guarantorDocuments = requiredDocuments.filter((category) => guarAllowedCategories.has(category.category));
  } else {
    guarantorDocuments = requiredDocuments;
  }

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
        <CardTitle className="text-lg font-medium">
          {showOnlyCoApplicant
            ? 'Co-Applicant Documents'
            : showOnlyGuarantor
            ? 'Guarantor Documents'
            : 'Supporting Documents'}
        </CardTitle>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-800">
            <span className="font-medium">🔒 Security Notice:</span> All documents uploaded in this section will be encrypted before transmission to ensure your privacy and data security.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Only show co-applicant section if showOnlyCoApplicant is true */}
        {showOnlyCoApplicant ? (
          coApplicantDocuments.length > 0 && (
            <div className="space-y-6 mt-8">
              <div className="flex items-center gap-2 pb-2 border-b">
                <UserCheck className="h-4 w-4" />
                <h3 className="font-medium text-gray-800">Co-Applicant Documents</h3>
              </div>
              {coApplicantDocuments.map((category) => (
                <div key={category.category} className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    {category.icon}
                    <h4 className="font-medium text-gray-800">{category.category}</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {category.documents.map((document: any) => {
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
                            sectionName={`coapplicant_${document.id}`}
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
            </div>
          )
        ) : showOnlyGuarantor ? (
          guarantorDocuments.length > 0 && (
            <div className="space-y-6 mt-8">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Shield className="h-4 w-4" />
                <h3 className="font-medium text-gray-800">Guarantor Documents</h3>
              </div>
              {guarantorDocuments.map((category) => (
                <div key={category.category} className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    {category.icon}
                    <h4 className="font-medium text-gray-800">{category.category}</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {category.documents.map((document: any) => {
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
                            sectionName={`guarantor_${document.id}`}
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
            </div>
          )
        ) : (
          <>
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
                        {document.id === 'w9_forms' && (
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
              </div>
            ))}
            {/* Co-Applicant Documents Section */}
            {coApplicantDocuments.length > 0 && (
              <div className="space-y-6 mt-8">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <UserCheck className="h-4 w-4" />
                  <h3 className="font-medium text-gray-800">Co-Applicant Documents</h3>
                </div>
                {coApplicantDocuments.map((category) => (
                  <div key={category.category} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      {category.icon}
                      <h4 className="font-medium text-gray-800">{category.category}</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {category.documents.map((document: any) => {
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
                              sectionName={`coapplicant_${document.id}`}
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
              </div>
            )}
          </>
        )}
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