import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';

interface MondayFormProps {
  propertyName?: string;
  unitNumber?: string;
}

export function MondayForm({ propertyName, unitNumber }: MondayFormProps) {
  const [, setLocation] = useLocation();
  const [formUrl, setFormUrl] = useState<string>('');

  useEffect(() => {
    // Base URL for the Monday.com form
    const baseUrl = 'https://forms.monday.com/forms/embed/8c6c6cd6c030c82856c14ef4439c61df?r=use1';
    
    // Build URL parameters
    const params = new URLSearchParams();
    
    if (propertyName) {
      params.append('color_mktgkr4e', propertyName);
    }
    
    if (unitNumber) {
      params.append('short_text800omovg', unitNumber);
    }
    
    // Construct the final URL
    const finalUrl = params.toString() ? `${baseUrl}&${params.toString()}` : baseUrl;
    setFormUrl(finalUrl);
  }, [propertyName, unitNumber]);

  const handleBack = () => {
    setLocation('/');
  };

  const handleOpenInNewTab = () => {
    if (formUrl) {
      window.open(formUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rentals
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Rental Application</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {propertyName && unitNumber && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Application Details</h3>
                  <div className="text-sm text-blue-800">
                    <p><strong>Property:</strong> {propertyName}</p>
                    <p><strong>Unit:</strong> {unitNumber}</p>
                  </div>
                </div>
              )}
              
              {formUrl && (
                <div className="w-full">
                  <iframe 
                    src={formUrl}
                    width="100%" 
                    height="600" 
                    style={{ 
                      border: '0', 
                      boxShadow: '5px 5px 56px 0px rgba(0,0,0,0.25)',
                      borderRadius: '8px'
                    }}
                    title="Rental Application Form"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
