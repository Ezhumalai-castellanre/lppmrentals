import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { DraftService, DraftData } from '@/lib/draft-service';
import { toast } from '@/hooks/use-toast';

export default function DebugDraft() {
  const { user } = useAuth();
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Sample form data to test mapping
  const sampleFormData = {
    application: {
      buildingAddress: 'Test Building',
      apartmentNumber: 'A1',
      moveInDate: '2025-08-15T00:00:00.000Z',
      monthlyRent: 2500,
      apartmentType: 'STD',
      howDidYouHear: 'Website'
    },
    applicant: {
      name: 'John Doe',
      dob: '1990-01-01T00:00:00.000Z',
      ssn: '123-45-6789',
      phone: '+1234567890',
      email: 'john@example.com',
      license: 'DL123456',
      licenseState: 'CA',
      address: '123 Main St',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90210',
      lengthAtAddressYears: 2,
      lengthAtAddressMonths: 6,
      landlordName: 'Jane Smith',
      landlordAddressLine1: '456 Oak Ave',
      landlordAddressLine2: 'Suite 100',
      landlordCity: 'Los Angeles',
      landlordState: 'CA',
      landlordZipCode: '90210',
      landlordPhone: '+1987654321',
      landlordEmail: 'jane@example.com',
      currentRent: 2200,
      reasonForMoving: 'Job relocation',
      employmentType: 'salaried',
      position: 'Software Engineer',
      startDate: '2023-01-15T00:00:00.000Z',
      bankInformation: {
        bankRecords: [
          {
            bankName: 'Chase',
            accountType: 'checking'
          }
        ],
        totalBankRecords: 1,
        hasBankRecords: true
      }
    },
    hasCoApplicant: true,
    coApplicant: {
      name: 'Jane Doe',
      dob: '1992-05-15T00:00:00.000Z',
      ssn: '987-65-4321',
      phone: '+1234567891',
      email: 'jane@example.com',
      license: 'DL654321',
      licenseState: 'CA',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90210',
      lengthAtAddressYears: 2,
      lengthAtAddressMonths: 6,
      landlordName: 'Jane Smith',
      landlordAddressLine1: '456 Oak Ave',
      landlordAddressLine2: 'Suite 100',
      landlordCity: 'Los Angeles',
      landlordState: 'CA',
      landlordZipCode: '90210',
      landlordPhone: '+1987654321',
      landlordEmail: 'jane@example.com',
      currentRent: 2200,
      reasonForMoving: 'Job relocation',
      employmentType: 'salaried',
      position: 'Designer',
      startDate: '2023-02-01T00:00:00.000Z',
      bankInformation: {
        bankRecords: [
          {
            bankName: 'Wells Fargo',
            accountType: 'savings'
          }
        ],
        totalBankRecords: 1,
        hasBankRecords: true
      }
    },
    hasGuarantor: true,
    guarantor: {
      name: 'Bob Smith',
      dob: '1965-12-25T00:00:00.000Z',
      ssn: '111-22-3333',
      phone: '+1555123456',
      email: 'bob@example.com',
      license: 'DL999999',
      licenseState: 'CA',
      address: '789 Pine St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      lengthAtAddressYears: 10,
      lengthAtAddressMonths: 0,
      landlordName: 'Mary Johnson',
      landlordAddressLine1: '321 Elm St',
      landlordAddressLine2: 'Apt 5B',
      landlordCity: 'San Francisco',
      landlordState: 'CA',
      landlordZipCode: '94102',
      landlordPhone: '+1555987654',
      landlordEmail: 'mary@example.com',
      currentRent: 3500,
      reasonForMoving: 'Retirement',
      employmentType: 'retired',
      position: 'Retired',
      startDate: null,
      bankInformation: {
        bankRecords: [
          {
            bankName: 'Bank of America',
            accountType: 'checking'
          }
        ],
        totalBankRecords: 1,
        hasBankRecords: true
      }
    },
    otherOccupants: [
      {
        name: 'Baby Doe',
        relationship: 'child',
        dob: '2020-03-10T00:00:00.000Z',
        ssn: '000-00-0000',
        license: 'N/A',
        age: 3,
        ssnDocument: null,
        ssnEncryptedDocument: null
      }
    ],
    documents: {
      applicant: {
        photo_id: [
          {
            filename: 'john_license.pdf',
            webhookbodyUrl: 'https://example.com/john_license.pdf'
          }
        ]
      },
      coApplicant: {
        photo_id: [
          {
            filename: 'jane_license.pdf',
            webhookbodyUrl: 'https://example.com/jane_license.pdf'
          }
        ]
      },
      guarantor: {
        photo_id: [
          {
            filename: 'bob_license.pdf',
            webhookbodyUrl: 'https://example.com/bob_license.pdf'
          }
        ]
      }
    },
    signatures: {
      applicant: 'SIGNED',
      coApplicant: 'SIGNED',
      guarantor: 'SIGNED'
    },
    signatureTimestamps: {
      applicant: '2025-08-11T10:00:00.000Z',
      coApplicant: '2025-08-11T10:05:00.000Z',
      guarantor: '2025-08-11T10:10:00.000Z'
    },
    webhookResponses: {
      applicant_photo_id: 'https://example.com/john_license.pdf',
      coApplicant_photo_id: 'https://example.com/jane_license.pdf',
      guarantor_photo_id: 'https://example.com/bob_license.pdf'
    },
    uploadedFilesMetadata: {
      applicant_photo_id: [
        {
          file_name: 'john_license.pdf',
          file_size: 1024000,
          mime_type: 'application/pdf',
          upload_date: '2025-08-11T10:00:00.000Z'
        }
      ],
      coApplicant_photo_id: [
        {
          file_name: 'jane_license.pdf',
          file_size: 987000,
          mime_type: 'application/pdf',
          upload_date: '2025-08-11T10:05:00.000Z'
        }
      ],
      guarantor_photo_id: [
        {
          file_name: 'bob_license.pdf',
          file_size: 1150000,
          mime_type: 'application/pdf',
          upload_date: '2025-08-11T10:10:00.000Z'
        }
      ]
    }
  };

  const handleSaveDraft = async () => {
    if (!user?.applicantId) {
      toast({
        title: "Error",
        description: "No applicant ID available",
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('💾 Saving draft with sample data...');
      const draft = DraftService.createDraftData(
        sampleFormData,
        user.applicantId,
        4
      );

      console.log('📋 Draft created:', draft);
      const result = await DraftService.saveDraft(draft);
      console.log('📋 Save draft result:', result);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Draft saved successfully with complete form data",
          variant: 'default',
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save draft",
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Save draft error:', error);
      toast({
        title: "Error",
        description: `Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDraft = async () => {
    if (!user?.applicantId) {
      toast({
        title: "Error",
        description: "No applicant ID available",
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('📖 Loading draft...');
      const result = await DraftService.loadDraft(user.applicantId);
      if (result.success && result.data) {
        setDraftData(result.data);
        toast({
          title: "Success",
          description: "Draft loaded successfully",
          variant: 'default',
        });
      } else {
        toast({
          title: "Info",
          description: "No draft found",
          variant: 'default',
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load draft",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestMapping = () => {
    console.log('🧪 Testing field mapping...');
    
    // Test creating draft data
    const testDraft = DraftService.createDraftData(
      sampleFormData,
      'TEST-123',
      4
    );
    
    console.log('📋 Test draft created:', testDraft);
    
    // Test specific field mappings
    console.log('🔍 Field mapping test results:');
    console.log('- Application Info:', {
      buildingAddress: testDraft.buildingAddress,
      apartmentNumber: testDraft.apartmentNumber,
      monthlyRent: testDraft.monthlyRent
    });
    console.log('- Applicant Info:', {
      name: testDraft.applicantName,
      email: testDraft.applicantEmail,
      phone: testDraft.applicantPhone
    });
    console.log('- Co-Applicant Info:', {
      hasCoApplicant: testDraft.hasCoApplicant,
      name: testDraft.coApplicantName,
      email: testDraft.coApplicantEmail
    });
    console.log('- Guarantor Info:', {
      hasGuarantor: testDraft.hasGuarantor,
      name: testDraft.guarantorName,
      email: testDraft.guarantorEmail
    });
    console.log('- Documents:', {
      applicantDocs: testDraft.applicantDocuments,
      coApplicantDocs: testDraft.coApplicantDocuments,
      guarantorDocs: testDraft.guarantorDocuments
    });
    console.log('- Webhook Responses:', testDraft.webhookResponses);
    console.log('- File Metadata:', testDraft.uploadedFilesMetadata);
    
    toast({
      title: "Mapping Test Complete",
      description: "Check console for detailed field mapping results",
      variant: 'default',
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">🔍 Draft System Debug & Field Mapping Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>🧪 Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleTestMapping}
              className="w-full"
              variant="outline"
            >
              Test Field Mapping
            </Button>
            
            <Button 
              onClick={handleSaveDraft}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Saving...' : 'Save Draft with Complete Data'}
            </Button>
            
            <Button 
              onClick={handleLoadDraft}
              disabled={isLoading}
              className="w-full"
              variant="secondary"
            >
              {isLoading ? 'Loading...' : 'Load Draft'}
            </Button>
          </CardContent>
        </Card>

        {/* Sample Data Preview */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Sample Form Data Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div><strong>Application Info:</strong> Building, Apartment, Rent, etc.</div>
              <div><strong>Primary Applicant:</strong> Personal, Address, Financial, Documents</div>
              <div><strong>Co-Applicant:</strong> Personal, Address, Financial, Documents</div>
              <div><strong>Guarantor:</strong> Personal, Address, Financial, Documents</div>
              <div><strong>Other Occupants:</strong> Additional people</div>
              <div><strong>Signatures:</strong> Digital signatures</div>
              <div><strong>Files:</strong> Webhook URLs & metadata</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Draft Data Display */}
      {draftData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📖 Loaded Draft Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Core Info</h4>
                <div className="text-sm">
                  <div><strong>Applicant ID:</strong> {draftData.applicantId}</div>
                  <div><strong>Current Step:</strong> {draftData.currentStep}</div>
                  <div><strong>Last Saved:</strong> {new Date(draftData.lastSaved).toLocaleString()}</div>
                  <div><strong>Version:</strong> {draftData.version}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Application Info</h4>
                <div className="text-sm">
                  <div><strong>Building:</strong> {draftData.buildingAddress || 'N/A'}</div>
                  <div><strong>Apartment:</strong> {draftData.apartmentNumber || 'N/A'}</div>
                  <div><strong>Rent:</strong> {draftData.monthlyRent || 'N/A'}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Applicant Info</h4>
                <div className="text-sm">
                  <div><strong>Name:</strong> {draftData.applicantName || 'N/A'}</div>
                  <div><strong>Email:</strong> {draftData.applicantEmail || 'N/A'}</div>
                  <div><strong>Phone:</strong> {draftData.applicantPhone || 'N/A'}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Co-Applicant</h4>
                <div className="text-sm">
                  <div><strong>Has Co-Applicant:</strong> {draftData.hasCoApplicant ? 'Yes' : 'No'}</div>
                  <div><strong>Name:</strong> {draftData.coApplicantName || 'N/A'}</div>
                  <div><strong>Email:</strong> {draftData.coApplicantEmail || 'N/A'}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Guarantor</h4>
                <div className="text-sm">
                  <div><strong>Has Guarantor:</strong> {draftData.hasGuarantor ? 'Yes' : 'No'}</div>
                  <div><strong>Name:</strong> {draftData.guarantorName || 'N/A'}</div>
                  <div><strong>Email:</strong> {draftData.guarantorEmail || 'N/A'}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Documents & Files</h4>
                <div className="text-sm">
                  <div><strong>Webhook Responses:</strong> {Object.keys(draftData.webhookResponses || {}).length}</div>
                  <div><strong>File Metadata:</strong> {Object.keys(draftData.uploadedFilesMetadata || {}).length}</div>
                  <div><strong>Data Size:</strong> {JSON.stringify(draftData).length} chars</div>
                </div>
              </div>
            </div>
            
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">📄 Full Draft Data (JSON)</summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(draftData, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
