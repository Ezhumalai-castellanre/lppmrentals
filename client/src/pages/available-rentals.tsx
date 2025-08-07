import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MondayApiService, RentalItem } from '../lib/monday-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Image, Building, MapPin, DollarSign, Home, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function AvailableRentalsPage() {
  const [, setLocation] = useLocation();
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showVacantOnly, setShowVacantOnly] = useState(false);
  const [selectedRental, setSelectedRental] = useState<RentalItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const fetchRentals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const availableRentals = await MondayApiService.fetchAvailableRentals();
      setRentals(availableRentals);
      console.log('Fetched available rentals:', availableRentals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rentals');
      console.error('Error fetching available rentals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const handleViewDetails = (rental: RentalItem) => {
    setSelectedRental(rental);
    setCurrentMediaIndex(0);
    setIsModalOpen(true);
  };

  const handleApplyNow = (rental: RentalItem) => {
    // Store rental info in sessionStorage for the application process
    sessionStorage.setItem('selectedRental', JSON.stringify(rental));
    console.log('Redirecting to application form for rental:', rental.name);
    setLocation('/application');
  };

  const handlePreviousMedia = () => {
    if (selectedRental && selectedRental.mediaFiles) {
      setCurrentMediaIndex(prev => 
        prev === 0 ? selectedRental.mediaFiles!.length - 1 : prev - 1
      );
    }
  };

  const handleNextMedia = () => {
    if (selectedRental && selectedRental.mediaFiles) {
      setCurrentMediaIndex(prev => 
        prev === selectedRental.mediaFiles!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const getFilteredRentals = () => {
    let filtered = rentals;
    
    // Filter by vacant status only
    if (showVacantOnly) {
      filtered = filtered.filter(rental => rental.status === 'Vacant');
    }
    
    return filtered;
  };

  const renderMediaPreview = (mediaFiles: RentalItem['mediaFiles']) => {
    if (!mediaFiles || mediaFiles.length === 0) {
      return (
        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
          <Image className="w-8 h-8 text-gray-400" />
        </div>
      );
    }

    const firstMedia = mediaFiles[0];
    
    if (firstMedia.isVideo) {
      return (
        <div className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
          <video 
            src={firstMedia.url} 
            className="w-full h-full object-cover"
            controls
          />
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            <Play className="w-3 h-3 inline mr-1" />
            Video
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
        <img 
          src={firstMedia.url} 
          alt={firstMedia.name}
          className="w-full h-full object-cover"
        />
        {mediaFiles.length > 1 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            +{mediaFiles.length - 1} more
          </div>
        )}
      </div>
    );
  };

  const renderAmenities = (amenities: string) => {
    if (!amenities) return null;
    
    const amenityList = amenities.split('\n').filter(line => line.trim().startsWith('•'));
    
    return (
      <div className="mt-4">
        <h4 className="font-semibold text-sm mb-2 flex items-center">
          <Home className="w-4 h-4 mr-1" />
          Amenities
        </h4>
        <div className="text-xs text-gray-600 space-y-1">
          {amenityList.slice(0, 5).map((amenity, idx) => (
            <div key={idx} className="flex items-start">
              <span className="text-blue-500 mr-1">•</span>
              <span>{amenity.replace('•', '').trim()}</span>
            </div>
          ))}
          {amenityList.length > 5 && (
            <div className="text-blue-500 text-xs">
              +{amenityList.length - 5} more amenities
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDetailedAmenities = (amenities: string) => {
    if (!amenities) return null;
    
    const amenityList = amenities.split('\n').filter(line => line.trim().startsWith('•'));
    
    return (
      <div className="mt-4">
        <h4 className="font-semibold text-sm mb-3 flex items-center">
          <Home className="w-4 h-4 mr-2" />
          Amenities
        </h4>
        <div className="text-sm text-gray-700 space-y-2">
          {amenityList.map((amenity, idx) => (
            <div key={idx} className="flex items-start">
              <span className="text-blue-500 mr-2 mt-0.5">•</span>
              <span>{amenity.replace('•', '').trim()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vacant units...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Button 
            onClick={fetchRentals}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const filteredRentals = getFilteredRentals();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Rentals</h1>
          <p className="text-gray-600">Discover your perfect home from our available properties</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex justify-center">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="vacant-only"
              checked={showVacantOnly}
              onChange={(e) => setShowVacantOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="vacant-only" className="text-sm font-medium text-gray-700">
              Show Vacant Only
            </label>
          </div>
        </div>

        {/* Rental Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRentals.map((rental) => (
              <Card key={rental.id} className="border rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">{rental.name}</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>Property:</strong> {rental.propertyName}</div>
                  <div><strong>Type:</strong> {rental.unitType}</div>
                  <div><strong>Status:</strong> {rental.status}</div>
                  <div><strong>Rent:</strong> {rental.monthlyRent || 'Contact for pricing'}</div>
                  
                  {rental.amenities && (
                    <div>
                      <strong>Amenities:</strong>
                      <div className="text-xs text-gray-600 mt-1">{rental.amenities}</div>
                    </div>
                  )}
                  
                  {rental.mediaFiles && rental.mediaFiles.length > 0 && (
                    <div>
                      <strong>Images:</strong>
                      <div className="flex gap-2 mt-1">
                        {rental.mediaFiles.map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img.url} 
                            alt={img.name || `Image ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <Button 
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleViewDetails(rental)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button 
                      size="sm"
                      className="w-full"
                      onClick={() => handleApplyNow(rental)}
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

      {/* Detailed View Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedRental?.name} - {selectedRental?.propertyName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedRental && (
            <div className="space-y-6">
              {/* Media Gallery */}
              {selectedRental.mediaFiles && selectedRental.mediaFiles.length > 0 && (
                <div className="relative">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {selectedRental.mediaFiles[currentMediaIndex].isVideo ? (
                      <video 
                        src={selectedRental.mediaFiles[currentMediaIndex].url}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        onError={(e) => {
                          console.error('Video loading error:', e);
                          const target = e.target as HTMLVideoElement;
                          target.style.display = 'none';
                          // Show fallback message
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full flex items-center justify-center bg-gray-200 text-gray-600';
                          fallback.innerHTML = `
                            <div class="text-center">
                              <div class="text-2xl mb-2">🎥</div>
                              <div class="text-sm">Video not available</div>
                              <div class="text-xs text-gray-500">${selectedRental.mediaFiles[currentMediaIndex].name}</div>
                            </div>
                          `;
                          target.parentNode?.appendChild(fallback);
                        }}
                      />
                    ) : (
                      <img 
                        src={selectedRental.mediaFiles[currentMediaIndex].url}
                        alt={selectedRental.mediaFiles[currentMediaIndex].name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image loading error:', e);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          // Show fallback message
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full flex items-center justify-center bg-gray-200 text-gray-600';
                          fallback.innerHTML = `
                            <div class="text-center">
                              <div class="text-2xl mb-2">🖼️</div>
                              <div class="text-sm">Image not available</div>
                              <div class="text-xs text-gray-500">${selectedRental.mediaFiles[currentMediaIndex].name}</div>
                            </div>
                          `;
                          target.parentNode?.appendChild(fallback);
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Navigation Controls */}
                  {selectedRental.mediaFiles.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={handlePreviousMedia}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={handleNextMedia}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      
                      {/* Media Counter */}
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        {currentMediaIndex + 1} / {selectedRental.mediaFiles.length}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Rental Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Rental Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit:</span>
                      <span className="font-medium">{selectedRental.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property:</span>
                      <span className="font-medium">{selectedRental.propertyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{selectedRental.unitType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={selectedRental.status === 'Vacant' ? 'default' : 'secondary'}>
                        {selectedRental.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Rent:</span>
                      <span className="font-semibold text-green-600">
                        {selectedRental.monthlyRent || 'Contact for pricing'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Media Files</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRental.mediaFiles?.map((media, index) => (
                      <div
                        key={media.id}
                        className={`relative cursor-pointer rounded overflow-hidden ${
                          index === currentMediaIndex ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setCurrentMediaIndex(index)}
                      >
                        {media.isVideo ? (
                          <div className="aspect-square bg-gray-200 flex items-center justify-center">
                            <Play className="h-6 w-6 text-gray-600" />
                          </div>
                        ) : (
                          <img
                            src={media.url}
                            alt={media.name}
                            className="w-full h-20 object-cover"
                          />
                        )}
                        <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {renderDetailedAmenities(selectedRental.amenities)}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  onClick={() => handleApplyNow(selectedRental)}
                  className="flex-1"
                >
                  Apply Now
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
