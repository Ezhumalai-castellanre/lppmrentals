import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Camera, Home } from 'lucide-react';
import { FileUpload } from '../components/ui/file-upload';
import { encryptFiles, type EncryptedFile } from '../lib/file-encryption';
import { WebhookService } from '../lib/webhook-service';

interface MaintenanceRequestData {
  unit: string;
  tenantName: string;
  tenantEmail: string;
  issueCategory: string;
  issueDescription: string;
  pictures: File[];
}

const ISSUE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Appliances',
  'Structural',
  'Pest Control',
  'Landscaping',
  'Security',
  'Other'
];

export default function MaintenanceRequestPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<MaintenanceRequestData>({
    unit: '',
    tenantName: '',
    tenantEmail: '',
    issueCategory: '',
    issueDescription: '',
    pictures: []
  });

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Maintenance Request
            </h1>
            <p className="text-gray-600 mb-4">
              Please log in to submit a maintenance request
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof MaintenanceRequestData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePictureUpload = (files: File[]) => {
    setFormData(prev => ({
      ...prev,
      pictures: files
    }));
  };

  const handleEncryptedPictureUpload = (encryptedFiles: EncryptedFile[]) => {
    // Handle encrypted files if needed
    console.log('Encrypted pictures uploaded:', encryptedFiles.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.unit || !formData.tenantName || !formData.tenantEmail || !formData.issueCategory || !formData.issueDescription) {
        throw new Error('Please fill in all required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.tenantEmail)) {
        throw new Error('Please enter a valid email address');
      }

      // Create maintenance request data
      const maintenanceData = {
        unit: formData.unit,
        tenantName: formData.tenantName,
        tenantEmail: formData.tenantEmail,
        issueCategory: formData.issueCategory,
        issueDescription: formData.issueDescription,
        submittedBy: user.email,
        submittedAt: new Date().toISOString(),
        status: 'Pending'
      };

      // Upload pictures if any
      if (formData.pictures.length > 0) {
        for (const file of formData.pictures) {
          const result = await WebhookService.sendFileToWebhook(
            file,
            user.zoneinfo || 'unknown',
            'maintenance_request',
            `maintenance_${formData.unit}_${Date.now()}`,
            user.zoneinfo || 'unknown'
          );
          
          if (!result.success) {
            console.warn(`Failed to upload picture: ${result.error}`);
          }
        }
      }

      // Send maintenance request data via webhook
      const webhookResult = await WebhookService.sendFormDataToWebhook(
        maintenanceData,
        user.zoneinfo || user.email,
        user.zoneinfo || user.email,
        user.zoneinfo
      );

      if (!webhookResult.success) {
        throw new Error('Failed to submit maintenance request. Please try again.');
      }

      setSuccess('Maintenance request submitted successfully! We will contact you soon.');
      
      // Reset form
      setFormData({
        unit: '',
        tenantName: '',
        tenantEmail: '',
        issueCategory: '',
        issueDescription: '',
        pictures: []
      });

    } catch (err) {
      console.error('Maintenance request error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit maintenance request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Maintenance Request
            </h1>
            <p className="text-gray-600 mb-4">
              Submit a maintenance request for your unit
            </p>
            {user?.zoneinfo && (
              <div className="bg-blue-50 p-4 rounded-lg max-w-2xl mx-auto">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">👤 User ID:</span> {user.zoneinfo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Maintenance Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Maintenance Request Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Unit Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unit" className="flex items-center gap-2">
                    Unit #️⃣ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unit"
                    type="text"
                    placeholder="Enter unit number"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                {/* Issue Category */}
                <div>
                  <Label htmlFor="issueCategory" className="flex items-center gap-2">
                    Issue Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.issueCategory}
                    onValueChange={(value) => handleInputChange('issueCategory', value)}
                    required
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select issue category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ISSUE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tenant Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenantName" className="flex items-center gap-2">
                    Tenant Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tenantName"
                    type="text"
                    placeholder="Enter tenant name"
                    value={formData.tenantName}
                    onChange={(e) => handleInputChange('tenantName', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="tenantEmail" className="flex items-center gap-2">
                    Tenant Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tenantEmail"
                    type="email"
                    placeholder="Enter tenant email"
                    value={formData.tenantEmail}
                    onChange={(e) => handleInputChange('tenantEmail', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Issue Description */}
              <div>
                <Label htmlFor="issueDescription" className="flex items-center gap-2">
                  Issue Description 🚩 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="issueDescription"
                  placeholder="Please describe the issue in detail"
                  value={formData.issueDescription}
                  onChange={(e) => handleInputChange('issueDescription', e.target.value)}
                  required
                  className="mt-1 min-h-[120px]"
                />
              </div>

              {/* Pictures Upload */}
              <div>
                <Label className="flex items-center gap-2">
                  Pictures 📷
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Please add any pictures that could help us understand the issue
                </p>
                <FileUpload
                  onFileChange={handlePictureUpload}
                  onEncryptedFilesChange={handleEncryptedPictureUpload}
                  accept=".jpg,.jpeg,.png,.gif"
                  multiple={true}
                  maxFiles={5}
                  maxSize={50}
                  label="Upload Pictures"
                                      description="Max 50MB each. Accepted: JPG, PNG, GIF - Up to 5 files"
                  className="mb-3"
                  enableEncryption={true}
                  referenceId={user.zoneinfo || user.email}
                  sectionName="maintenance_request"
                  documentName="pictures"
                  enableWebhook={true}
                  applicationId={user.zoneinfo || user.email}
                  zoneinfo={user?.zoneinfo}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Submit Maintenance Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 