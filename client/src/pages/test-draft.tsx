import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DraftService, type DraftData } from '@/lib/draft-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function TestDraft() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testData, setTestData] = useState({
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890'
  });
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      const draft = DraftService.createDraftData(
        user.applicantId,
        1,
        {
          application: {
            buildingAddress: testData.name,
            apartmentNumber: testData.email,
            moveInDate: new Date().toISOString()
          },
          applicant: {
            name: testData.name,
            email: testData.email,
            phone: testData.phone
          }
        },
        {
          test_document: 'https://example.com/test.pdf'
        },
        {
          test_files: [{
            file_name: 'test.pdf',
            file_size: 1024,
            mime_type: 'application/pdf',
            upload_date: new Date().toISOString()
          }]
        }
      );

      console.log('💾 Attempting to save draft:', draft);
      const result = await DraftService.saveDraft(draft);
      console.log('📋 Save draft result:', result);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Draft saved successfully",
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Draft System Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle>Test Form Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={testData.name}
                onChange={(e) => setTestData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={testData.email}
                onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={testData.phone}
                onChange={(e) => setTestData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleSaveDraft} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button onClick={handleLoadDraft} disabled={isLoading} variant="outline">
                {isLoading ? 'Loading...' : 'Load Draft'}
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/test-draft');
                    const data = await response.json();
                    console.log('🧪 Test function response:', data);
                    toast({
                      title: "Test Function",
                      description: data.message || "Test completed",
                      variant: 'default',
                    });
                  } catch (error) {
                    console.error('❌ Test function error:', error);
                    toast({
                      title: "Test Function Error",
                      description: `Failed to test function: ${error instanceof Error ? error.message : 'Unknown error'}`,
                      variant: 'destructive',
                    });
                  }
                }} 
                variant="outline"
              >
                Test Function
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Draft Display */}
        <Card>
          <CardHeader>
            <CardTitle>Draft Data</CardTitle>
          </CardHeader>
          <CardContent>
            {draftData ? (
              <div className="space-y-2 text-sm">
                <div><strong>Applicant ID:</strong> {draftData.applicantId}</div>
                <div><strong>Current Step:</strong> {draftData.currentStep}</div>
                <div><strong>Last Saved:</strong> {new Date(draftData.lastSaved).toLocaleString()}</div>
                <div><strong>Is Complete:</strong> {draftData.isComplete ? 'Yes' : 'No'}</div>
                
                {draftData.applicationInfo && (
                  <div>
                    <strong>Application Info:</strong>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                      {JSON.stringify(draftData.applicationInfo, null, 2)}
                    </pre>
                  </div>
                )}
                
                {draftData.primaryApplicant && (
                  <div>
                    <strong>Primary Applicant:</strong>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                      {JSON.stringify(draftData.primaryApplicant, null, 2)}
                    </pre>
                  </div>
                )}
                
                {draftData.webhookResponses && Object.keys(draftData.webhookResponses).length > 0 && (
                  <div>
                    <strong>Webhook Responses:</strong>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                      {JSON.stringify(draftData.webhookResponses, null, 2)}
                    </pre>
                  </div>
                )}
                
                {draftData.uploadedFilesMetadata && Object.keys(draftData.uploadedFilesMetadata).length > 0 && (
                  <div>
                    <strong>Uploaded Files:</strong>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                      {JSON.stringify(draftData.uploadedFilesMetadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">No draft data loaded</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Username:</strong> {user?.username || 'Not available'}</div>
            <div><strong>Email:</strong> {user?.email || 'Not available'}</div>
            <div><strong>Applicant ID:</strong> {user?.applicantId || 'Not available'}</div>
            <div><strong>Zone Info:</strong> {user?.zoneinfo || 'Not available'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
