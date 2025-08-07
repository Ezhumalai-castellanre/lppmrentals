"use client"

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MondayApiService, RentalItem } from '../lib/monday-api';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Eye, Send, MapPin, Home, DollarSign, Square, Wifi, Car, Shield, Wrench, ChefHat, Bath, Sparkles, Users, Clock, ChevronLeft, ChevronRight, X, Play, Image, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { PropertyMap } from '@/components/property-map';

// PropertyCard Component
function PropertyCard({ rental, onViewDetails, onApplyNow }: {
  rental: RentalItem;
  onViewDetails: (rental: RentalItem) => void;
  onApplyNow: (rental: RentalItem) => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);

  const images = rental.mediaFiles?.filter(file => file.url && file.url.trim())?.map(file => file.url) || [];
  const hasImages = images.length > 0;
  const displayedImages = showAllImages ? images : images.slice(0, 4);
  const hasMoreImages = images.length > 4;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayedImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayedImages.length) % displayedImages.length);
  };



  return (
    <div className="w-full max-w-sm mx-auto">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md h-full">
        {/* Images Slider - Top Section */}
        <div className="relative">
          <div className="relative group">
            {/* Main Image */}
            <div className="relative h-48 bg-muted mx-4 mt-4 rounded-lg overflow-hidden">
              {hasImages ? (
                <img 
                  src={displayedImages[currentImageIndex]} 
                  alt={`Property image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-all duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'w-full h-full flex items-center justify-center bg-gray-200 text-gray-600';
                    fallback.innerHTML = `
                      <div class="text-center">
                        <div class="text-2xl mb-2">🖼️</div>
                        <div class="text-sm">Image not available</div>
                      </div>
                    `;
                    target.parentNode?.appendChild(fallback);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600">
                  <div className="text-center">
                    <Image className="w-8 h-8 mx-auto mb-2" />
                    <div className="text-sm">No images available</div>
                  </div>
                </div>
              )}
              
              {/* Navigation Arrows */}
              {hasImages && displayedImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Image Counter Overlay */}
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {currentImageIndex + 1} / {displayedImages.length}
                  </div>
                </>
              )}
            </div>
            
            {/* Dots Indicator */}
            {hasImages && displayedImages.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3 px-8">
                {displayedImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex 
                        ? 'bg-primary w-6' 
                        : 'bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>
            )}
            

            
                        {/* Thumbnail Strip */}
            {hasImages && displayedImages.length > 1 && (
              <div className="flex gap-2 mt-3 px-8 overflow-x-auto pb-1 justify-center">
                {displayedImages.map((src, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden transition-all duration-200 ${
                      index === currentImageIndex 
                        ? 'ring-2 ring-primary ring-offset-1' 
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={src} 
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <CardHeader className="pb-4">
          {/* Unit Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{rental.name || 'Unit not specified'}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="w-3 h-3" />
                    <span>{rental.propertyName || 'Address not available'}</span>
                  </div>
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className="bg-green-100 text-green-800 hover:bg-green-100"
              >
                <div className="w-2 h-2 rounded-full mr-1 bg-green-500"></div>
                Available Now
              </Badge>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="bg-blue-100 p-1.5 rounded">
                  <Home className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-semibold text-sm">{rental.unitType || 'Standard'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="bg-green-100 p-1.5 rounded">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Rent</p>
                  <p className="font-bold text-sm">{rental.monthlyRent || 'Contact for pricing'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Separator />
          
          {/* Amenities Preview */}
          {rental.amenities && rental.amenities.trim() && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Amenities</span>
              </div>
              <div className="text-xs text-gray-600 line-clamp-3">
                {rental.amenities.length > 150 
                  ? `${rental.amenities.substring(0, 150)}...` 
                  : rental.amenities
                }
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-6 pb-4 bg-muted/20">
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 hover:bg-muted"
              onClick={() => onViewDetails(rental)}
            >
              <Eye className="w-4 h-4" />
              View Details
            </Button>
            <Button 
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              onClick={() => onApplyNow(rental)}
            >
              <Send className="w-4 h-4" />
              Apply Now
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AvailableRentalsPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [selectedRental, setSelectedRental] = useState<RentalItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Redirect logged-in users
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User is logged in, redirecting from Available Rentals');
      setLocation('/'); // Redirect to root where authenticated users see Applications
    }
  }, [isAuthenticated, user, setLocation]);

  const fetchRentals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const availableRentals = await MondayApiService.fetchAvailableRentals();
      setRentals(availableRentals);
      console.log('Fetched available rentals:', availableRentals);
      
      // Debug: Log each rental's data
      availableRentals.forEach((rental, index) => {
        console.log(`Rental ${index + 1}:`, {
          id: rental.id,
          name: rental.name,
          propertyName: rental.propertyName,
          unitType: rental.unitType,
          status: rental.status,
          monthlyRent: rental.monthlyRent,
          amenities: rental.amenities ? rental.amenities.substring(0, 100) + '...' : 'None',
          mediaFilesCount: rental.mediaFiles?.length || 0
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rentals');
      console.error('Error fetching available rentals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch rentals if user is NOT authenticated
    if (!isAuthenticated) {
      fetchRentals();
    }
  }, [isAuthenticated]);

  const handleViewDetails = (rental: RentalItem) => {
    console.log('Opening detailed view for rental:', rental.name);
    setSelectedRental(rental);
    setCurrentMediaIndex(0);
    setIsModalOpen(true);
  };

  // Reset media index when modal opens/closes
  useEffect(() => {
    if (isModalOpen && selectedRental) {
      const validMediaFiles = selectedRental.mediaFiles?.filter(file => file.url && file.url.trim()) || [];
      if (currentMediaIndex >= validMediaFiles.length) {
        setCurrentMediaIndex(0);
      }
    }
  }, [isModalOpen, selectedRental, currentMediaIndex]);

  const handleApplyNow = (rental: RentalItem) => {
    // Build Monday.com form URL with property name and unit number
    const baseUrl = 'https://forms.monday.com/forms/8c6c6cd6c030c82856c14ef4439c61df?r=use1';
    const params = new URLSearchParams();
    
    // Map property name to color_mktgkr4e parameter
    if (rental.propertyName) {
      params.append('color_mktgkr4e', rental.propertyName);
    }
    
    // Map unit number to short_text800omovg parameter
    if (rental.name) {
      params.append('short_text800omovg', rental.name);
    }
    
    // Construct the final URL
    const formUrl = params.toString() ? `${baseUrl}&${params.toString()}` : baseUrl;
    
    console.log('Opening Monday.com form in new tab for rental:', rental.name);
    console.log('Form URL:', formUrl);
    
    // Open the form in a new tab
    window.open(formUrl, '_blank');
  };

  const handlePreviousMedia = () => {
    if (selectedRental && selectedRental.mediaFiles) {
      const validMediaFiles = selectedRental.mediaFiles.filter(file => file.url && file.url.trim());
      setCurrentMediaIndex(prev => 
        prev === 0 ? validMediaFiles.length - 1 : prev - 1
      );
    }
  };

  const handleNextMedia = () => {
    if (selectedRental && selectedRental.mediaFiles) {
      const validMediaFiles = selectedRental.mediaFiles.filter(file => file.url && file.url.trim());
      setCurrentMediaIndex(prev => 
        prev === validMediaFiles.length - 1 ? 0 : prev + 1
      );
    }
  };

  const getFilteredRentals = () => {
    // Return all rentals without filtering by status
    return rentals;
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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
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

  // If user is authenticated, show a message instead of rentals
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome Back!</h2>
            <p className="text-gray-600 mb-6">
              You're already logged in. Available rentals are only shown to non-authenticated users.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation('/')}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Go to Applications
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation('/application')}
                className="w-full"
              >
                Start New Application
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredRentals = getFilteredRentals();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <img 
              src="https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/image.png"
              alt="LPPM Rentals Logo"
              className="h-20 w-auto object-contain drop-shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                // Show fallback text if image fails to load
                const fallback = document.createElement('div');
                fallback.className = 'text-3xl font-bold text-blue-600';
                fallback.textContent = 'LPPM Rentals';
                target.parentNode?.appendChild(fallback);
              }}
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">Available Rentals</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Discover your perfect home from our available properties
          </p>
          <div className="max-w-2xl mx-auto p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center gap-3 text-blue-800 mb-3">
              <LogIn className="w-6 h-6" />
              <span className="font-semibold text-lg">Not logged in?</span>
            </div>
            <p className="text-blue-700 text-base">
              You can browse all available rentals. To apply for a rental, you'll need to log in first.
            </p>
          </div>
        </div>

        {/* Property Map - Top Section */}
        <div className="mb-12">
          <PropertyMap
            rentals={filteredRentals}
            onViewDetails={handleViewDetails}
            onApplyNow={handleApplyNow}
          />
        </div>

        {/* Rental Cards Section */}
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">
              Available Properties
            </h2>
            <p className="text-gray-600">
              Browse our selection of premium rental properties
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRentals.map((rental) => (
              <PropertyCard
                key={rental.id}
                rental={rental}
                onViewDetails={handleViewDetails}
                onApplyNow={handleApplyNow}
              />
            ))}
          </div>
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
              {selectedRental.mediaFiles && selectedRental.mediaFiles.filter(file => file.url && file.url.trim()).length > 0 && (
                <div className="relative">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {(() => {
                      const validMediaFiles = selectedRental.mediaFiles?.filter(file => file.url && file.url.trim()) || [];
                      const currentMedia = validMediaFiles[currentMediaIndex];
                      
                      if (!currentMedia) {
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600">
                            <div className="text-center">
                              <div className="text-2xl mb-2">🖼️</div>
                              <div className="text-sm">No media available</div>
                            </div>
                          </div>
                        );
                      }
                      
                      if (currentMedia.isVideo) {
                        return (
                          <video 
                            src={currentMedia.url}
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
                                  <div class="text-xs text-gray-500">${currentMedia.name || 'Unknown'}</div>
                                </div>
                              `;
                              target.parentNode?.appendChild(fallback);
                            }}
                          />
                        );
                      } else {
                        return (
                          <img 
                            src={currentMedia.url}
                            alt={currentMedia.name || 'Property image'}
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
                                  <div class="text-xs text-gray-500">${currentMedia.name || 'Unknown'}</div>
                                </div>
                              `;
                              target.parentNode?.appendChild(fallback);
                            }}
                          />
                        );
                      }
                    })()}
                  </div>
                  
                  {/* Navigation Controls */}
                  {(() => {
                    const validMediaFiles = selectedRental.mediaFiles?.filter(file => file.url && file.url.trim()) || [];
                    if (validMediaFiles.length > 1) {
                      return (
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
                            {currentMediaIndex + 1} / {validMediaFiles.length}
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
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
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Available Now
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
                  {(() => {
                    const validMediaFiles = selectedRental.mediaFiles?.filter(file => file.url && file.url.trim()) || [];
                    if (validMediaFiles.length === 0) {
                      return (
                        <div className="text-sm text-gray-500 italic">
                          No media files available for this property.
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        {validMediaFiles.map((media, index) => (
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
                                alt={media.name || `Media ${index + 1}`}
                                className="w-full h-20 object-cover"
                              />
                            )}
                            <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Amenities */}
              {selectedRental.amenities && selectedRental.amenities.trim() && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Amenities</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-700 whitespace-pre-line">
                      {selectedRental.amenities}
                    </div>
                  </div>
                </div>
              )}
              
              {/* No Amenities Message */}
              {(!selectedRental.amenities || !selectedRental.amenities.trim()) && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Amenities</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 italic">
                      Amenities information not available for this property.
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  onClick={() => handleApplyNow(selectedRental)}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4 mr-2" />
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
