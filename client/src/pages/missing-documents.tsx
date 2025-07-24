import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, ArrowLeft, AlertTriangle, CheckCircle, Clock, Share2, Link, X, Upload } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { encryptFiles, validateFileForEncryption, type EncryptedFile } from '@/lib/file-encryption';
import { WebhookService } from '@/lib/webhook-service';

interface MissingSubitem {
  id: string;
  name: string;
  status: string;
  parentItemId: string;
  parentItemName: string;
  applicantType: string;
  publicUrl?: string;
  previewText?: string;
  action?: string;
}

export default function MissingDocumentsPage() {
  const [, setLocation] = useLocation();
  const [applicantId, setApplicantId] = useState('');
  const [missingItems, setMissingItems] = useState<MissingSubitem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [loadedFromUrl, setLoadedFromUrl] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState<{ [key: string]: boolean }>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<{ [key: string]: boolean }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parse applicant ID from URL query parameters and auto-load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const applicantIdFromUrl = urlParams.get('applicantId');
    
    if (applicantIdFromUrl) {
      setApplicantId(applicantIdFromUrl);
      setLoadedFromUrl(true);
      // Automatically search for the applicant if ID is provided in URL
      fetchMissingSubitems(applicantIdFromUrl);
    } else {
      // If no applicant ID in URL, try to load from localStorage or set a default
      const savedApplicantId = localStorage.getItem('lastApplicantId');
      if (savedApplicantId) {
        setApplicantId(savedApplicantId);
        fetchMissingSubitems(savedApplicantId);
      }
    }
  }, []);

  const fetchMissingSubitems = async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch(`/api/monday/missing-subitems/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMissingItems(data);
      setSearched(true);
      
      // Save applicant ID to localStorage for future use
      localStorage.setItem('lastApplicantId', id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch missing documents');
      setMissingItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (applicantId.trim()) {
      // Update URL with applicant ID for sharing
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('applicantId', applicantId.trim());
      window.history.pushState({}, '', newUrl.toString());
      
      setLoadedFromUrl(false);
      fetchMissingSubitems(applicantId.trim());
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
                  placeholder="Enter applicant ID (e.g., app_1752839426391_2041fkmmy)"
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
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Document Status Summary</span>
                  <div className="flex items-center gap-2">
                    {missingItems.length > 0 && (
                      <Badge variant="outline">
                        {missingItems.length} missing document{missingItems.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {Object.keys(uploadedDocuments).length > 0 && (
                      <Badge variant="default" className="bg-green-500">
                        {Object.keys(uploadedDocuments).length} uploaded
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchMissingSubitems(applicantId)}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {missingItems.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      All Documents Received!
                    </h3>
                    <p className="text-gray-600">
                      No missing documents found for this applicant.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {missingItems.map((item) => (
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
                                Applicant: {item.parentItemName}
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
                                <div className="text-xs text-gray-700 bg-gray-100 rounded px-2 py-1 mb-1">
                                  {item.previewText}
                                </div>
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
                                    Preview Document
                                  </a>
                                  <span className="text-xs text-green-700">Document received and available for preview.</span>
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

                         {/* Applicant Information - Hidden */}
                         {/* {missingItems.length > 0 && (
                           <Card>
                             <CardHeader>
                               <CardTitle>Applicant Information</CardTitle>
                             </CardHeader>
                             <CardContent>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                   <Label className="text-sm font-medium text-gray-500">
                                     Applicant Name
                                   </Label>
                                   <p className="text-gray-900">
                                     {missingItems[0]?.parentItemName || 'N/A'}
                                   </p>
                                 </div>
                                 <div>
                                   <Label className="text-sm font-medium text-gray-500">
                                     Applicant ID
                                   </Label>
                                   <p className="text-gray-900 font-mono text-sm">
                                     {applicantId}
                                   </p>
                                 </div>
                                 <div>
                                   <Label className="text-sm font-medium text-gray-500">
                                     Total Missing Documents
                                   </Label>
                                   <p className="text-gray-900 font-semibold">
                                     {missingItems.length}
                                   </p>
                                 </div>
                                 <div>
                                   <Label className="text-sm font-medium text-gray-500">
                                     Document Types
                                   </Label>
                                   <div className="space-y-1">
                                     {Array.from(new Set(missingItems.map(item => item.applicantType))).map(type => {
                                       const count = missingItems.filter(item => item.applicantType === type).length;
                                       return (
                                         <p key={type} className="text-gray-900 text-sm">
                                           {type}: {count} document{count !== 1 ? 's' : ''}
                                         </p>
                                       );
                                     })}
                                   </div>
                                 </div>
                               </div>
                             </CardContent>
                           </Card>
                         )} */}
          </div>
        )}
      </div>
    </div>
  );
} 