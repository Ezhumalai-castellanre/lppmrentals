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
import { environment } from '@/config/environment';

// Helper function to determine if a document type supports multiple files
const isMultipleFileDocument = (documentName: string): boolean => {
  const multipleFileDocuments = [
    'Pay Stubs',
    'Pay Stubs (Last 2-4)',
    'Tax Returns',
    'Tax Returns (Previous Year)',
    'Bank Statements',
    'Bank Statement'
  ];
  return multipleFileDocuments.some(name => 
    documentName.toLowerCase().includes(name.toLowerCase())
  );
};

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

// Add interfaces for Monday.com API response
interface MondayColumnValue {
  id: string;
  text: string;
  label?: string;
}

interface MondaySubitem {
  id: string;
  name: string;
  column_values: MondayColumnValue[];
}

interface MondayItem {
  id: string;
  name: string;
  column_values: MondayColumnValue[];
  subitems: MondaySubitem[];
}

interface MondayBoard {
  items_page: {
    items: MondayItem[];
  };
}

interface MondayResponse {
  data: {
    boards: MondayBoard[];
  };
}

export default function MissingDocumentsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [applicantId, setApplicantId] = useState('');
  
  // Log when applicantId changes
  useEffect(() => {
    // Removed console log
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
      const urlParams = new URLSearchParams(window.location.search);
      const applicantIdFromUrl = urlParams.get('applicantId');
      
      if (applicantIdFromUrl) {
        setApplicantId(applicantIdFromUrl);
        setLoadedFromUrl(true);
        // Automatically search for the applicant if ID is provided in URL
        fetchMissingSubitems(applicantIdFromUrl);
      } else if (user?.zoneinfo) {
        setApplicantId(user.zoneinfo);
        // Pass the zoneinfo to fetchMissingSubitems, but it will use user.zoneinfo for API call
        fetchMissingSubitems(user.zoneinfo);
      } else {
        // If no applicant ID in URL or user zoneinfo, try to load from localStorage
        const savedApplicantId = localStorage.getItem('lastApplicantId');
        if (savedApplicantId) {
          setApplicantId(savedApplicantId);
          fetchMissingSubitems(savedApplicantId);
        }
      }
    }, [user]);

  const fetchMissingSubitems = async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Always prioritize user's zoneinfo for the API call
      if (!user?.zoneinfo) {
        setError('User zoneinfo not found. Please ensure you are properly authenticated.');
        return;
      }
      
      const apiId = user.zoneinfo;
      console.log('Searching for applicant ID:', apiId);

      const MONDAY_API_TOKEN = environment.monday.apiToken;
      const BOARD_ID = environment.monday.documentsBoardId;

      console.log('Fetching from Monday.com with token:', MONDAY_API_TOKEN ? 'Present' : 'Missing');
      console.log('Board ID:', BOARD_ID);

      const query = `
        query {
          boards(ids: [${BOARD_ID}]) {
            items_page {
              items {
                id
                name
                column_values(ids: ["text_mksxyax3", "text_mksxn3da", "text_mksxdc76"]) {
                  id
                  text
                }
                subitems {
                  id
                  name
                  column_values(ids: ["status", "color_mksyqx5h", "text_mkt9gepz", "text_mkt9x4qd", "text_mktanfxj", "link_mktsj2d"]) {
                    id
                    text
                    ... on StatusValue {
                      label
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': MONDAY_API_TOKEN,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        console.error('Monday API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Monday API error response:', errorText);
        throw new Error(`Monday API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Monday.com API Response Status:', response.status);
      console.log('Monday.com API Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('Monday.com API Response:', JSON.stringify(result, null, 2));
      
      const items = result?.data?.boards?.[0]?.items_page?.items ?? [];
      
      console.log('📊 Found', items.length, 'total items in the board');
      
      // Log available applicant IDs for debugging
      console.log('🔍 Available Applicant IDs in the board:');
      items.forEach((item: MondayItem, index: number) => {
        const applicantIdValue = item.column_values.find(cv => cv.id === "text_mksxyax3")?.text;
        console.log(`  ${index + 1}. Item: ${item.name} - Applicant ID: "${applicantIdValue}"`);
        
        // Log subitems and their column values for debugging
        if (item.subitems && item.subitems.length > 0) {
          console.log(`    📄 Subitems for ${item.name}:`);
          item.subitems.forEach((subitem: MondaySubitem, subIndex: number) => {
            console.log(`      ${subIndex + 1}. ${subitem.name}:`);
            subitem.column_values.forEach((cv: MondayColumnValue) => {
              console.log(`        - Column ${cv.id}: ${cv.text} (label: ${cv.label || 'N/A'})`);
            });
          });
        }
      });

      // Find items matching the applicant ID (check both new Lppm format and old formats)
      const searchApplicantIds = [apiId];
      
      // If the requested ID is in new Lppm format, also search for old format equivalents
      if (apiId.startsWith('Lppm-')) {
        // Extract date and number from Lppm format
        const match = apiId.match(/^Lppm-(\d{8})-(\d{5})$/);
        if (match) {
          const [, dateStr, numberStr] = match;
          const timestamp = new Date(
            parseInt(dateStr.substring(0, 4)),
            parseInt(dateStr.substring(4, 6)) - 1,
            parseInt(dateStr.substring(6, 8))
          ).getTime();
          
          // Create old format equivalents
          const oldZoneFormat = `zone_${timestamp}_${numberStr}`;
          const oldTempFormat = `temp_${timestamp}_${numberStr}`;
          
          searchApplicantIds.push(oldZoneFormat, oldTempFormat);
          console.log(`🔍 Also searching for old format equivalents: ${oldZoneFormat}, ${oldTempFormat}`);
        }
      }
      
      // If the requested ID is in old format, also search for new Lppm format
      if (apiId.startsWith('zone_') || apiId.startsWith('temp_')) {
        // Extract timestamp and number from old format
        const match = apiId.match(/^(zone_|temp_)(\d+)_(.+)$/);
        if (match) {
          const [, prefix, timestamp, numberStr] = match;
          const date = new Date(parseInt(timestamp));
          const dateStr = date.getFullYear().toString() + 
                         String(date.getMonth() + 1).padStart(2, '0') + 
                         String(date.getDate()).padStart(2, '0');
          
          const newLppmFormat = `Lppm-${dateStr}-${numberStr.padStart(5, '0')}`;
          searchApplicantIds.push(newLppmFormat);
          console.log(`🔍 Also searching for new Lppm format: ${newLppmFormat}`);
        }
      }
      
      console.log(`🔍 Searching for applicant IDs: ${searchApplicantIds.join(', ')}`);
      
      // Find items that have subitems matching any of the possible applicant IDs
      const matchingItems = items.filter((item: MondayItem) => {
        const subitems = item.subitems || [];
        
        // Check if any subitem has the matching applicant ID
        const hasMatchingSubitem = subitems.some((sub: MondaySubitem) => {
          const subitemApplicantId = sub.column_values.find((cv: MondayColumnValue) => cv.id === "text_mkt9gepz")?.text;
          const matches = subitemApplicantId && searchApplicantIds.includes(subitemApplicantId);
          
          if (matches) {
            console.log(`🔍 Found matching subitem in ${item.name}: ${sub.name} with applicant ID: "${subitemApplicantId}"`);
          }
          
          return matches;
        });
        
        if (hasMatchingSubitem) {
          console.log(`✅ Found matching item: ${item.name} with matching subitems`);
        }
        
        return hasMatchingSubitem;
      });

      console.log('📊 Found', matchingItems.length, 'items matching applicant ID', `"${apiId}"`);

      // Process the matching items to extract missing subitems
      const missingSubitems: MissingSubitem[] = [];
      
      matchingItems.forEach((item: MondayItem) => {
        const subitems = item.subitems || [];
        
        subitems.forEach((subitem: MondaySubitem) => {
          const subitemApplicantId = subitem.column_values.find((cv: MondayColumnValue) => cv.id === "text_mkt9gepz")?.text;
          
          // Only include subitems that match the applicant ID
          if (subitemApplicantId && searchApplicantIds.includes(subitemApplicantId)) {
            const status = subitem.column_values.find((cv: MondayColumnValue) => cv.id === "status")?.label || "Missing";
            const applicantType = subitem.column_values.find((cv: MondayColumnValue) => cv.id === "text_mkt9x4qd")?.text || "Applicant";
            const coApplicantName = subitem.column_values.find((cv: MondayColumnValue) => cv.id === "text_mktanfxj")?.text || undefined;
            const guarantorName = subitem.column_values.find((cv: MondayColumnValue) => cv.id === "color_mksyqx5h")?.text || undefined;
            const documentKey = subitem.column_values.find((cv: MondayColumnValue) => cv.id === "link_mktsj2d")?.text || undefined;
            
            // Only include items that are missing or rejected
            if (status === "Missing" || status === "Rejected" || status === "Received") {
              missingSubitems.push({
                id: subitem.id,
                name: subitem.name,
                status: status,
                parentItemId: item.id,
                parentItemName: item.name,
                applicantType: applicantType,
                coApplicantName: coApplicantName,
                guarantorName: guarantorName,
                publicUrl: documentKey,
                previewText: documentKey,
                action: status === "Missing" ? "Upload Required" : "Upload Replacement"
              });
            }
          }
        });
      });

      console.log('📄 Processed missing subitems:', missingSubitems);
      
      setMissingItems(missingSubitems);
      setSearched(true);
      
      // Save applicant ID to localStorage for future use
      localStorage.setItem('lastApplicantId', id);
      
      // Provide feedback about the search
      if (missingSubitems.length === 0) {
        setSuccessMessage(`No missing documents found for applicant ID: ${apiId}. The system searched for multiple formats including: ${searchApplicantIds.join(', ')}`);
      } else {
        setSuccessMessage(`Found ${missingSubitems.length} document(s) for applicant ID: ${apiId}`);
      }
    } catch (err) {
      console.error('Error fetching missing subitems:', err);
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
      } catch (err) {
        // Failed to copy link
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
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
      
    } catch (error) {
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
  
  if (!user) {
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



  return (
    <div className="min-h-screen bg-white py-8">
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

        {/* Success Message - Removed */}

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
                                  {item.applicantType === "Guarantor" && item.coApplicantName && (
                                    <span className="text-blue-600">Guarantor: {item.coApplicantName}</span>
                                  )}
                                  {item.applicantType === "Guarantor" && item.guarantorName && (
                                    <span className="text-green-600">Guarantor: {item.guarantorName}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs" style={{ fontSize: '10px' }}>
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
                                    // Encrypted uploads are handled by onEncryptedFilesChange
                                  }}
                                  onEncryptedFilesChange={(encryptedFiles) => handleEncryptedDocumentChange(item.id, encryptedFiles)}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  multiple={false}
                                  maxFiles={1}
                                  maxSize={50}
                                  label={`Upload ${item.name}`}
                                  description="Max 50MB. Accepted: PDF, JPG, PNG - Encrypted"
                                  className="mb-3"
                                  enableEncryption={true}
                                  referenceId={applicantId}
                                  sectionName={`${item.applicantType}`}
                                  documentName={item.name}
                                  enableWebhook={true}
                                  applicationId={applicantId}
                                  zoneinfo={user?.zoneinfo}
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
                                  maxSize={50}
                                  label={`Upload ${item.name}`}
                                  description="Max 50MB. Accepted: PDF, JPG, PNG - Encrypted"
                                  className="mb-3"
                                  enableEncryption={true}
                                  referenceId={applicantId}
                                  sectionName={`${item.applicantType}`}
                                  documentName={item.name}
                                  enableWebhook={true}
                                  applicationId={applicantId}
                                  zoneinfo={user?.zoneinfo}
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
                                  {item.applicantType === "Guarantor" && item.coApplicantName && (
                                    <span className="text-blue-600">Guarantor: {item.coApplicantName}</span>
                                  )}
                                  {item.applicantType === "Guarantor" && item.guarantorName && (
                                    <span className="text-green-600">Guarantor: {item.guarantorName}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs" style={{ fontSize: '10px' }}>
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
                                  multiple={isMultipleFileDocument(item.name)}
                                  maxFiles={isMultipleFileDocument(item.name) ? 5 : 1}
                                  maxSize={50}
                                  label={`Upload ${item.name}`}
                                  description={`Max 50MB. Accepted: PDF, JPG, PNG - Encrypted${isMultipleFileDocument(item.name) ? ' - Multiple files allowed' : ''}`}
                                  className="mb-3"
                                  enableEncryption={true}
                                  referenceId={applicantId}
                                  sectionName={`${item.applicantType}`}
                                  documentName={item.name}
                                  enableWebhook={true}
                                  applicationId={applicantId}
                                  zoneinfo={user?.zoneinfo}
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
                                  multiple={isMultipleFileDocument(item.name)}
                                  maxFiles={isMultipleFileDocument(item.name) ? 5 : 1}
                                  maxSize={50}
                                  label={`Upload ${item.name}`}
                                  description={`Max 50MB. Accepted: PDF, JPG, PNG - Encrypted${isMultipleFileDocument(item.name) ? ' - Multiple files allowed' : ''}`}
                                  className="mb-3"
                                  enableEncryption={true}
                                  referenceId={applicantId}
                                  sectionName={`${item.applicantType}`}
                                  documentName={item.name}
                                  enableWebhook={true}
                                  applicationId={applicantId}
                                  zoneinfo={user?.zoneinfo}
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