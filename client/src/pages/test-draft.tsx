import React, { useState } from 'react';
import { SaveDraftButton } from '../components/ui/save-draft-button';
import { LoadDraftButton } from '../components/ui/load-draft-button';
import { DraftService } from '../lib/draft-service';

export default function TestDraftPage() {
  const [testData, setTestData] = useState({
    name: 'Test User',
    email: 'test@example.com',
    message: 'This is a test message'
  });
  const [loadedData, setLoadedData] = useState<any>(null);
  const [applicantId, setApplicantId] = useState('TEST-USER-001');

  const handleInputChange = (field: string, value: string) => {
    setTestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLoadDraft = (formData: any) => {
    setLoadedData(formData);
    console.log('Draft loaded:', formData);
  };

  const handleSaveDraft = () => {
    console.log('Draft saved successfully');
  };

  const testDirectService = async () => {
    try {
      console.log('Testing direct service calls...');
      
      // Test save
      const saveResult = await DraftService.saveDraft(applicantId, testData);
      console.log('Save result:', saveResult);
      
      // Test load
      const loadResult = await DraftService.loadDraft(applicantId);
      console.log('Load result:', loadResult);
      
      // Test metadata
      const metadata = await DraftService.getDraftMetadata(applicantId);
      console.log('Metadata:', metadata);
      
      // Test existence
      const exists = await DraftService.draftExists(applicantId);
      console.log('Draft exists:', exists);
      
    } catch (error) {
      console.error('Service test failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Draft Functionality Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Data</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applicant ID
              </label>
              <input
                type="text"
                value={applicantId}
                onChange={(e) => setApplicantId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={testData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={testData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={testData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Draft Buttons</h2>
          <div className="flex items-center gap-4">
            <SaveDraftButton
              applicantId={applicantId}
              formData={testData}
              onSave={handleSaveDraft}
              variant="default"
            />
            <LoadDraftButton
              applicantId={applicantId}
              onLoad={handleLoadDraft}
              variant="outline"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Direct Service Test</h2>
          <button
            onClick={testDirectService}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Test Direct Service Calls
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Loaded Data</h2>
          {loadedData ? (
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
              {JSON.stringify(loadedData, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500">No data loaded yet</p>
          )}
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Enter test data in the form fields above</li>
            <li>Click "Save Draft" to save the data</li>
            <li>Change some data and save again</li>
            <li>Click "Load Draft" to restore the saved data</li>
            <li>Check the console for detailed logs</li>
            <li>Use "Test Direct Service Calls" to test the service directly</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
