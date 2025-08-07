import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { MondayApiService, RentalItem } from '@/lib/monday-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Home, MapPin, DollarSign, Image, Eye, Play, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showVacantOnly, setShowVacantOnly] = useState(false);
  const [selectedRental, setSelectedRental] = useState<RentalItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const rentalsData = await MondayApiService.fetchAvailableRentals();
      setRentals(rentalsData);
      

      
              console.log('Fetched rentals:', rentalsData);
    } catch (error) {
      console.error('Error fetching rentals:', error);
      toast({
        title: "Error",
        description: "Failed to load available rentals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyNow = (rental: RentalItem) => {
    if (isAuthenticated) {
      // For authenticated users, redirect to application form
      sessionStorage.setItem('selectedRental', JSON.stringify(rental));
      console.log('Redirecting to application form for rental:', rental.name);
      setLocation('/application');
    } else {
      // For non-authenticated users, redirect to login
      sessionStorage.setItem('selectedRental', JSON.stringify(rental));
      console.log('Redirecting to login page for rental:', rental.name);
      setLocation('/login');
    }
  };

  const handleViewDetails = (rental: RentalItem) => {
    if (isAuthenticated) {
      // For authenticated users, show detailed modal
      setSelectedRental(rental);
      setCurrentMediaIndex(0);
      setIsModalOpen(true);
    } else {
      // For non-authenticated users, redirect to login
      sessionStorage.setItem('selectedRental', JSON.stringify(rental));
      console.log('Redirecting to login page for rental details:', rental.name);
      setLocation('/login');
    }
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

  const formatRent = (rent: string | undefined) => {
    if (!rent || rent === '') return 'Contact for pricing';
    const num = parseFloat(rent);
    if (isNaN(num)) return 'Contact for pricing';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const renderMediaPreview = (mediaFiles: RentalItem['mediaFiles']) => {
    if (!mediaFiles || mediaFiles.length === 0) {
      return (
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          <Image className="h-12 w-12 text-gray-400" />
        </div>
      );
    }

    const firstMedia = mediaFiles[0];
    
    if (firstMedia.isVideo) {
      return (
        <div className="relative h-48 bg-gray-100 overflow-hidden">
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
      <div className="relative h-48 bg-gray-100 overflow-hidden">
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
      <div className="mt-3">
        <div className="text-xs text-gray-600 space-y-1">
          {amenityList.slice(0, 3).map((amenity, index) => (
            <div key={index} className="flex items-center">
              <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
              {amenity.trim().substring(1).trim()}
            </div>
          ))}
          {amenityList.length > 3 && (
            <div className="text-xs text-gray-500">
              +{amenityList.length - 3} more amenities
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
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Amenities</h4>
        <div className="text-sm text-gray-700 space-y-1">
          {amenityList.map((amenity, index) => (
            <div key={index} className="flex items-start">
              <span className="w-1 h-1 bg-blue-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
              <span>{amenity.trim().substring(1).trim()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f2f8fe' }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading available rentals...</p>
        </div>
      </div>
    );
  }

  const filteredRentals = getFilteredRentals();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f2f8fe' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isAuthenticated ? 'Available Rentals' : 'Find Your Perfect Home'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isAuthenticated 
              ? 'Browse our available properties and start your application today.'
              : 'Discover beautiful properties in prime locations. Sign in to apply.'
            }
          </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRentals.map((rental) => (
            <Card key={rental.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {renderMediaPreview(rental.mediaFiles)}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{rental.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                      {rental.propertyName}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={rental.status === 'Vacant' ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {rental.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                    <span className="font-semibold text-green-600">
                      {formatRent(rental.monthlyRent)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{rental.unitType}</span>
                </div>
                
                {renderAmenities(rental.amenities)}
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={() => handleViewDetails(rental)}
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button 
                    onClick={() => handleApplyNow(rental)}
                    size="sm"
                    className="flex-1"
                  >
                    Apply Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRentals.length === 0 && (
          <div className="text-center py-12">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more results.</p>
          </div>
        )}
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
                  <h3 className="text-lg font-semibold mb-4">Property Details</h3>
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
                      <span className="font-medium text-green-600">
                        {formatRent(selectedRental.monthlyRent)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  {renderDetailedAmenities(selectedRental.amenities)}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
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
