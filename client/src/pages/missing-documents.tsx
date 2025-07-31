import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, ArrowLeft, AlertTriangle, CheckCircle, Clock, Share2, Link, X, Upload, ArrowDownToLine } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { encryptFiles, validateFileForEncryption, type EncryptedFile } from '@/lib/file-encryption';
import { WebhookService } from '@/lib/webhook-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { getAllApplicantIdFormats, isValidLppmNumber } from '@/lib/utils';

interface MissingSubitem {
  id: string;
  name: string;
  status: string;
  parentItemId: string;
  parentItemName: string;
  applicantType: string;
  coApplicantName?: string;
  guarantorName?: string;
  publicUrl?: string;
  previewText?: string;
  action?: string;
}

export default function MissingDocumentsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [applicantId, setApplicantId] = useState('');
  
  // Log when applicantId changes
  useEffect(() => {
    console.log('📝 Missing Documents - applicantId changed to:', applicantId);
  }, [applicantId]);
  const [missingItems, setMissingItems] = useState<MissingSubitem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [loadedFromUrl, setLoadedFromUrl] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState<{ [key: string]: boolean }>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<{ [key: string]: boolean }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'uploaded'>('pending');
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);

  // Split items by status
  const uploadedItems = missingItems.filter(item => item.status === 'Received');
  const pendingItems = missingItems.filter(item => item.status === 'Missing' || item.status === 'Rejected');

  // Auto-switch to pending if any pending, otherwise uploaded
  useEffect(() => {
    if (pendingItems.length > 0) {
      setActiveTab('pending');
    } else if (uploadedItems.length > 0) {
      setActiveTab('uploaded');
    }
  }, [pendingItems.length, uploadedItems.length]);

  // Parse applicant ID from URL query parameters and auto-load
  useEffect(() => {
    console.log('🔍 Missing Documents - User state:', user);
    console.log('🔍 Missing Documents - User zoneinfo:', user?.zoneinfo);
    
    const urlParams = new URLSearchParams(window.location.search);
    const applicantIdFromUrl = urlParams.get('applicantId');
    
    console.log('🔍 Missing Documents - URL applicantId:', applicantIdFromUrl);
    
    if (applicantIdFromUrl) {
      console.log('🔍 Missing Documents - Using URL applicantId:', applicantIdFromUrl);
      setApplicantId(applicantIdFromUrl);
      setLoadedFromUrl(true);
      // Automatically search for the applicant if ID is provided in URL
      fetchMissingSubitems(applicantIdFromUrl);
    } else if (user?.zoneinfo) {
      console.log('🔍 Missing Documents - Using user zoneinfo:', user.zoneinfo);
      setApplicantId(user.zoneinfo);
      console.log('📝 Missing Documents - Set applicantId to zoneinfo value:', user.zoneinfo);
      // Pass the zoneinfo to fetchMissingSubitems, but it will use user.zoneinfo for API call
      fetchMissingSubitems(user.zoneinfo);
    } else {
      console.log('🔍 Missing Documents - No zoneinfo found, checking localStorage');
      // If no applicant ID in URL or user zoneinfo, try to load from localStorage
      const savedApplicantId = localStorage.getItem('lastApplicantId');
      if (savedApplicantId) {
        console.log('🔍 Missing Documents - Using saved applicantId:', savedApplicantId);
        setApplicantId(savedApplicantId);
        fetchMissingSubitems(savedApplicantId);
      } else {
        console.log('🔍 Missing Documents - No applicantId found anywhere');
      }
    }
  }, [user]);

  const fetchMissingSubitems = async (id: string) => {
    console.log('🔍 fetchMissingSubitems called with ID:', id);
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Use the user's zoneinfo directly for the API call
      const apiId = user?.zoneinfo || id;
      console.log(`🔍 Using API ID: "${apiId}" for API call`);
      
      // Get all possible formats for the applicant ID
      const searchFormats = getAllApplicantIdFormats(apiId);
      console.log(`🔍 Searching for applicant ID "${apiId}" with formats:`, searchFormats);
      
      const response = await fetch(`/api/monday/missing-subitems/${apiId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📡 Missing Documents - API Response:', data);
      console.log('📊 Missing Documents - Response Details:', {
        responseStatus: response.status,
        responseOk: response.ok,
        dataLength: data.length,
        dataType: typeof data,
        isArray: Array.isArray(data)
      });
      
      setMissingItems(data);
      setSearched(true);
      
      // Save applicant ID to localStorage for future use
      localStorage.setItem('lastApplicantId', id);
      console.log('💾 Missing Documents - Saved to localStorage:', id);
      
      // Provide feedback about the search
      if (data.length === 0) {
        console.log('📭 Missing Documents - No documents found');
        setSuccessMessage(`No missing documents found for applicant ID: ${id}. The system searched for multiple formats including: ${searchFormats.join(', ')}`);
      } else {
        console.log('📄 Missing Documents - Documents found:', data.length);
        setSuccessMessage(`Found ${data.length} document(s) for applicant ID: ${id}`);
      }
    } catch (err) {
      console.log('❌ Missing Documents - API Error:', err);
      console.log('🚨 Missing Documents - Error Details:', {
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        errorStack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Failed to fetch missing documents');
      setMissingItems([]);
    } finally {
      console.log('🏁 Missing Documents - API call completed');
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 Missing Documents - Search triggered:', { applicantId: applicantId.trim() });
    
    if (applicantId.trim()) {
      // Update URL with applicant ID for sharing
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('applicantId', applicantId.trim());
      window.history.pushState({}, '', newUrl.toString());
      console.log('🔗 Missing Documents - URL updated:', newUrl.toString());
      
      setLoadedFromUrl(false);
      fetchMissingSubitems(applicantId.trim());
    } else {
      console.log('⚠️ Missing Documents - Search attempted with empty applicantId');
    }
  };

  const generateShareableLink = () => {
    if (applicantId.trim()) {
      const shareableUrl = new URL(window.location.href);
      shareableUrl.searchParams.set('applicantId', applicantId.trim());
      return shareableUrl.toString();
    }
    return null;
  };

  const copyShareableLink = async () => {
    const link = generateShareableLink();
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        // You could add a toast notification here
        console.log('Link copied to clipboard:', link);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const clearSearch = () => {
    console.log('🧹 Missing Documents - Clearing search state');
    setApplicantId('');
    setMissingItems([]);
    setSearched(false);
    setError(null);
    setSuccessMessage(null);
    setUploadedDocuments({});
    setUploadingDocuments({});
    setLoadedFromUrl(false);
    
    // Clear URL parameters
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('applicantId');
    window.history.pushState({}, '', newUrl.toString());
    console.log('🔗 Missing Documents - URL cleared:', newUrl.toString());
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'missing':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'received':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'missing':
        return <Badge variant="destructive">Missing</Badge>;
      case 'received':
        return <Badge variant="default" className="bg-green-500">Received</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDocumentUpload = async (documentId: string, files: File[], encryptedFiles: EncryptedFile[]) => {
    if (!applicantId || !files.length) return;

    setUploadingDocuments(prev => ({ ...prev, [documentId]: true }));
    
    try {
      // Find the document details
      const document = missingItems.find(item => item.id === documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Upload each file via webhook
      for (const file of files) {
        const result = await WebhookService.sendFileToWebhook(
          file,
          applicantId,
          `missing_${document.parentItemName}`,
          document.name,
          applicantId
        );
        
        if (!result.success) {
          throw new Error(`Failed to upload ${file.name}: ${result.error}`);
        }
      }

      // Mark as uploaded
      setUploadedDocuments(prev => ({ ...prev, [documentId]: true }));
      
      // Show success message
      setSuccessMessage(`Successfully uploaded ${files.length} file(s) for ${document.name}`);
      console.log(`Successfully uploaded ${files.length} file(s) for ${document.name}`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploadingDocuments(prev => ({ ...prev, [documentId]: false }));
    }
  };

  const handleEncryptedDocumentChange = (documentId: string, encryptedFiles: EncryptedFile[]) => {
    if (encryptedFiles.length > 0) {
      // Find the document details
      const document = missingItems.find(item => item.id === documentId);
      if (!document) {
        setError('Document not found');
        return;
      }

      setUploadingDocuments(prev => ({ ...prev, [documentId]: true }));
      
      // Since encryption is enabled, the FileUpload component will handle the webhook
      // We just need to mark it as uploaded
      setUploadedDocuments(prev => ({ ...prev, [documentId]: true }));
      setSuccessMessage(`Successfully uploaded ${encryptedFiles.length} file(s) for ${document.name}`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
      setUploadingDocuments(prev => ({ ...prev, [documentId]: false }));
    }
  };

  // Helper to check if a string is a URL
  const isUrl = (str?: string) => {
    if (!str) return false;
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const getApplicantIdInfo = (id: string) => {
    const formats = getAllApplicantIdFormats(id);
    const isNewFormat = isValidLppmNumber(id);
    
    return {
      formats,
      isNewFormat,
      formatType: isNewFormat ? 'New Lppm Format' : 'Legacy Format',
      searchCount: formats.length
    };
  };

  // Check if user is authenticated
  console.log('🔍 Missing Documents - Authentication Check:', { user: !!user, userDetails: user });
  
  if (!user) {
    console.log('❌ Missing Documents - User not authenticated, redirecting to login');
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Missing Documents Tracker
            </h1>
            <p className="text-gray-600 mb-4">
              Please log in to view your missing documents
            </p>
            <Button onClick={() => setLocation('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ Missing Documents - User authenticated, rendering page');
  console.log('📊 Missing Documents - Current State:', {
    applicantId,
    missingItems: missingItems.length,
    loading,
    error,
    searched,
    userZoneinfo: user?.zoneinfo,
    userDetails: {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      zoneinfo: user?.zoneinfo,
      applicantId: user?.applicantId
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Missing Documents Tracker
            </h1>
            <p className="text-gray-600 mb-4">
              Track and manage missing documents for rental applications
            </p>
            {user?.zoneinfo && (
              <div className="bg-green-50 p-4 rounded-lg max-w-2xl mx-auto mb-4">
                <p className="text-sm text-green-800">
                  <span className="font-medium">👤 User ID:</span> {user.zoneinfo}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  <span className="font-medium">📝 Applicant ID:</span> {applicantId}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  <span className="font-medium">🔍 API Call:</span> /api/monday/missing-subitems/{user.zoneinfo}
                </p>
              </div>
            )}
            <div className="bg-blue-50 p-4 rounded-lg max-w-2xl mx-auto">
              <p className="text-sm text-blue-800">
                <span className="font-medium">📤 Upload Feature:</span> You can now upload missing documents directly from this page. 
                All files are encrypted and securely transmitted to complete your application.
              </p>
            </div>
          </div>
        </div>

        {/* Search Form - Hidden */}
        {/* <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search by Applicant ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadedFromUrl && (
              <Alert className="mb-4">
                <Link className="h-4 w-4" />
                <AlertDescription>
                  Applicant ID loaded from URL. You can share this link to directly access this applicant's missing documents.
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label htmlFor="applicantId">Applicant ID</Label>
                <Input
                  id="applicantId"
                  type="text"
                  placeholder="Enter applicant ID (e.g., Lppm-20250731-59145)"
                  value={applicantId}
                  onChange={(e) => setApplicantId(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  type="submit" 
                  disabled={loading || !applicantId.trim()}
                  className="flex-1 sm:flex-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search Documents
                    </>
                  )}
                </Button>
                
                {searched && applicantId.trim() && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={copyShareableLink}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share Link
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearSearch}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card> */}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {searched && !loading && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-t font-medium border-b-2 ${activeTab === 'pending' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-500 bg-gray-100'}`}
                onClick={() => setActiveTab('pending')}
                disabled={pendingItems.length === 0}
              >
                Pending ({pendingItems.length})
              </button>
              <button
                className={`px-4 py-2 rounded-t font-medium border-b-2 ${activeTab === 'uploaded' ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-500 bg-gray-100'}`}
                onClick={() => setActiveTab('uploaded')}
                disabled={uploadedItems.length === 0}
              >
                Uploaded ({uploadedItems.length})
              </button>
            </div>
            {/* Tab Content */}
            {activeTab === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle>All Pending Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingItems.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Pending Documents!
                      </h3>
                      <p className="text-gray-600">
                        All documents have been uploaded and received.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingItems.map((item) => (
                        <div
                          key={item.id}
                          className="border rounded-lg bg-white overflow-hidden"
                        >
                          <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(item.status)}
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {item.name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {item.applicantType === "Applicant" && (
                                    <span>Applicant: {item.parentItemName}</span>
                                  )}
                                  {item.applicantType === "Co-Applicant" && item.coApplicantName && (
                                    <span className="text-blue-600">Co-Applicant: {item.coApplicantName}</span>
                                  )}
                                  {item.applicantType === "Guarantor" && item.guarantorName && (
                                    <span className="text-green-600">Guarantor: {item.guarantorName}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.applicantType}
                              </Badge>
                              {uploadedDocuments[item.id] ? (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Uploaded
                                </Badge>
                              ) : (
                                getStatusBadge(item.status)
                              )}
                            </div>
                          </div>
                          {/* Document Preview or Upload Section */}
                          <div className="p-4 bg-gray-50">
                            {item.status === 'Received' && (item.publicUrl || item.previewText) ? (
                              <div className="flex flex-col gap-2">
                                {item.previewText && (
                                  isUrl(item.previewText) ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        className="text-blue-600 underline text-xs font-medium flex items-center gap-1 w-fit"
                                        onClick={() => {
                                          setModalUrl(item.previewText!);
                                          setModalTitle(item.name);
                                          setIframeError(false);
                                        }}
                                      >
                                        <Link className="w-4 h-4" />
                                        Preview
                                      </button>
                                      <a
                                        href={item.previewText}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline text-xs font-medium flex items-center gap-1 w-fit"
                                      >
                                        <Link className="w-4 h-4" />
                                        Preview in New Tab
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-700 bg-gray-100 rounded px-2 py-1 mb-1">
                                      {item.previewText}
                                    </div>
                                  )
                                )}
                                {item.publicUrl && (
                                  <div className="flex items-center gap-3">
                                    <a
                                      href={item.publicUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 underline text-sm font-medium flex items-center gap-1"
                                    >
                                      <Link className="w-4 h-4" />
                                      Preview
                                    </a>
                                    <a
                                      href={item.publicUrl}
                                      download
                                      className="text-green-700 underline text-sm font-medium flex items-center gap-1"
                                    >
                                      <ArrowDownToLine className="w-4 h-4" />
                                      Download
                                    </a>
                                    <span className="text-xs text-green-700">Document received and available for preview or download.</span>
                                  </div>
                                )}
                                {/* Always show upload UI for Received as well */}
                                <div className="mb-3 mt-2">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                                    Upload Replacement Document
                                  </h5>
                                  <p className="text-xs text-gray-500 mb-3">
                                    You may upload a replacement document if needed. Files will be encrypted and securely transmitted.
                                  </p>
                                </div>
                                <FileUpload
                                  onFileChange={(files) => {
                                    // Only handle file change for non-encrypted uploads
                                  }}
                                  onEncryptedFilesChange={(encryptedFiles) => handleEncryptedDocumentChange(item.id, encryptedFiles)}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  multiple={false}
                                  maxFiles={1}
                                  maxSize={10}
                                  label={`Upload ${item.name}`}
                                  description="Max 10MB. Accepted: PDF, JPG, PNG - Encrypted"
                                  className="mb-3"
                                  enableEncryption={true}
                                  referenceId={applicantId}
                                  sectionName={`${item.applicantType}`}
                                  documentName={item.name}
                                  enableWebhook={true}
                                  applicationId={applicantId}
                                />
                                {uploadingDocuments[item.id] && (
                                  <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading document...
                                  </div>
                                )}
                                {uploadedDocuments[item.id] && (
                                  <div className="flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    Document uploaded successfully!
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                <div className="mb-3">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                                    Upload {item.status === 'Rejected' ? 'Replacement' : 'Missing'} Document
                                  </h5>
                                  <p className="text-xs text-gray-500 mb-3">
                                    {item.action === 'Upload Required'
                                      ? 'Upload the required document to complete your application. Files will be encrypted and securely transmitted.'
                                      : 'You may upload a replacement document if needed.'}
                                  </p>
                                </div>
                                <FileUpload
                                  onFileChange={(files) => {
                                    // Only handle file change for non-encrypted uploads
                                    // Encrypted uploads are handled by onEncryptedFilesChange
                                  }}
                                  onEncryptedFilesChange={(encryptedFiles) => handleEncryptedDocumentChange(item.id, encryptedFiles)}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  multiple={false}
                                  maxFiles={1}
                                  maxSize={10}
                                  label={`Upload ${item.name}`}
                                  description="Max 10MB. Accepted: PDF, JPG, PNG - Encrypted"
                                  className="mb-3"
                                  enableEncryption={true}
                                  referenceId={applicantId}
                                  sectionName={`${item.applicantType}`}
                                  documentName={item.name}
                                  enableWebhook={true}
                                  applicationId={applicantId}
                                />
                                {uploadingDocuments[item.id] && (
                                  <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading document...
                                  </div>
                                )}
                                {uploadedDocuments[item.id] && (
                                  <div className="flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    Document uploaded successfully!
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {activeTab === 'uploaded' && (
              <Card>
                <CardHeader>
                  <CardTitle>All Uploaded Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {uploadedItems.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Uploaded Documents
                      </h3>
                      <p className="text-gray-600">
                        No documents have been received yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {uploadedItems.map((item) => (
                        <div
                          key={item.id}
                          className="border rounded-lg bg-white overflow-hidden"
                        >
                          <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(item.status)}
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {item.name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {item.applicantType === "Applicant" && (
                                    <span>Applicant: {item.parentItemName}</span>
                                  )}
                                  {item.applicantType === "Co-Applicant" && item.coApplicantName && (
                                    <span className="text-blue-600">Co-Applicant: {item.coApplicantName}</span>
                                  )}
                                  {item.applicantType === "Guarantor" && item.guarantorName && (
                                    <span className="text-green-600">Guarantor: {item.guarantorName}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.applicantType}
                              </Badge>
                              {uploadedDocuments[item.id] ? (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Uploaded
                                </Badge>
                              ) : (
                                getStatusBadge(item.status)
                              )}
                            </div>
                          </div>
                          {/* Document Preview or Upload Section */}
                          <div className="p-4 bg-gray-50">
                            {item.status === 'Received' && (item.publicUrl || item.previewText) ? (
                              <div className="flex flex-col gap-2">
                                {item.previewText && (
                                  isUrl(item.previewText) ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        className="text-blue-600 underline text-xs font-medium flex items-center gap-1 w-fit"
                                        onClick={() => {
                                          setModalUrl(item.previewText!);
                                          setModalTitle(item.name);
                                          setIframeError(false);
                                        }}
                                      >
                                        <Link className="w-4 h-4" />
                                        Preview
                                      </button>
                                      <a
                                        href={item.previewText}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline text-xs font-medium flex items-center gap-1 w-fit"
                                      >
                                        <Link className="w-4 h-4" />
                                        Preview in New Tab
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-700 bg-gray-100 rounded px-2 py-1 mb-1">
                                      {item.previewText}
                                    </div>
                                  )
                                )}
                                {item.publicUrl && (
                                  <div className="flex items-center gap-3">
                                    <a
                                      href={item.publicUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 underline text-sm font-medium flex items-center gap-1"
                                    >
                                      <Link className="w-4 h-4" />
                                      Preview
                                    </a>
                                    <a
                                      href={item.publicUrl}
                                      download
                                      className="text-green-700 underline text-sm font-medium flex items-center gap-1"
                                    >
                                      <ArrowDownToLine className="w-4 h-4" />
                                      Download
                                    </a>
                                    <span className="text-xs text-green-700">Document received and available for preview or download.</span>
                                  </div>
                                )}
                                {/* Always show upload UI for Received as well */}
                                <div className="mb-3 mt-2">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                                    Upload Replacement Document
                                  </h5>
                                  <p className="text-xs text-gray-500 mb-3">
                                    You may upload a replacement document if needed. Files will be encrypted and securely transmitted.
                                  </p>
                                </div>
                                <FileUpload
                                  onFileChange={(files) => {
                                    // Only handle file change for non-encrypted uploads
                                  }}
                                  onEncryptedFilesChange={(encryptedFiles) => handleEncryptedDocumentChange(item.id, encryptedFiles)}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  multiple={false}
                                  maxFiles={1}
                                  maxSize={10}
                                  label={`Upload ${item.name}`}
                                  description="Max 10MB. Accepted: PDF, JPG, PNG - Encrypted"
                                  className="mb-3"
                                  enableEncryption={true}
                                  referenceId={applicantId}
                                  sectionName={`${item.applicantType}`}
                                  documentName={item.name}
                                  enableWebhook={true}
                                  applicationId={applicantId}
                                />
                                {uploadingDocuments[item.id] && (
                                  <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading document...
                                  </div>
                                )}
                                {uploadedDocuments[item.id] && (
                                  <div className="flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    Document uploaded successfully!
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                <div className="mb-3">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                                    Upload {item.status === 'Rejected' ? 'Replacement' : 'Missing'} Document
                                  </h5>
                                  <p className="text-xs text-gray-500 mb-3">
                                    {item.action === 'Upload Required'
                                      ? 'Upload the required document to complete your application. Files will be encrypted and securely transmitted.'
                                      : 'You may upload a replacement document if needed.'}
                                  </p>
                                </div>
                                <FileUpload
                                  onFileChange={(files) => {
                                    // Only handle file change for non-encrypted uploads
                                    // Encrypted uploads are handled by onEncryptedFilesChange
                                  }}
                                  onEncryptedFilesChange={(encryptedFiles) => handleEncryptedDocumentChange(item.id, encryptedFiles)}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  multiple={false}
                                  maxFiles={1}
                                  maxSize={10}
                                  label={`Upload ${item.name}`}
                                  description="Max 10MB. Accepted: PDF, JPG, PNG - Encrypted"
                                  className="mb-3"
                                  enableEncryption={true}
                                  referenceId={applicantId}
                                  sectionName={`${item.applicantType}`}
                                  documentName={item.name}
                                  enableWebhook={true}
                                  applicationId={applicantId}
                                />
                                {uploadingDocuments[item.id] && (
                                  <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading document...
                                  </div>
                                )}
                                {uploadedDocuments[item.id] && (
                                  <div className="flex items-center gap-2 text-sm text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    Document uploaded successfully!
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      <Dialog open={!!modalUrl} onOpenChange={open => { if (!open) { setModalUrl(null); setIframeError(false); } }}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>{modalTitle || 'Document Preview'}</DialogTitle>
            <DialogClose asChild>
              <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">×</button>
            </DialogClose>
          </DialogHeader>
          {modalUrl && !iframeError && (
            <iframe
              src={modalUrl}
              title="Document Preview"
              className="w-full h-[70vh] rounded border"
              onError={() => setIframeError(true)}
            />
          )}
          {modalUrl && iframeError && (
            <div className="flex flex-col items-center justify-center h-[70vh]">
              <div className="text-red-600 font-semibold mb-2">Preview not available here.</div>
              <a
                href={modalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm font-medium flex items-center gap-1"
              >
                <Link className="w-4 h-4" />
                Open in New Tab
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 