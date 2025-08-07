import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { MondayApiService, RentalItem } from '@/lib/monday-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Loader2, Home, MapPin, DollarSign, Image, Eye, Play, ChevronLeft, ChevronRight, X, Send, Square, Wifi, Car, Shield, Wrench, ChefHat, Bath, Sparkles, Users, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PropertyMap } from '@/components/property-map';

// PropertyCard Component with enhanced UI
function PropertyCard({ rental, onViewDetails, onApplyNow }: {
  rental: RentalItem;
  onViewDetails: (rental: RentalItem) => void;
  onApplyNow: (rental: RentalItem) => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = rental.mediaFiles?.map(file => file.url) || [];
  const hasImages = images.length > 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };



  return (
    <div className="max-w-md mx-auto">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md">
        {/* Images Slider - Top Section */}
        <div className="relative">
          <div className="relative group">
            {/* Main Image */}
            <div className="relative h-48 bg-muted">
              {hasImages ? (
                <img 
                  src={images[currentImageIndex]} 
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
              {hasImages && images.length > 1 && (
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
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
            
            {/* Dots Indicator */}
            {hasImages && images.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3 px-4">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex 
                        ? 'bg-primary w-6' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Thumbnail Strip */}
            {hasImages && images.length > 1 && (
              <div className="flex gap-2 mt-3 px-4 overflow-x-auto pb-1 justify-center">
                {images.map((src, index) => (
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
                  <h3 className="text-xl font-bold text-foreground">{rental.name}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="w-3 h-3" />
                    <span>{rental.propertyName}</span>
                  </div>
                </div>
              </div>
              <Badge 
                variant={rental.status === 'Vacant' ? 'secondary' : 'outline'} 
                className={rental.status === 'Vacant' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
              >
                <div className={`w-2 h-2 rounded-full mr-1 ${rental.status === 'Vacant' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                {rental.status}
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
                  <p className="font-semibold text-sm">{rental.unitType || 'STD'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="bg-green-100 p-1.5 rounded">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Rent</p>
                  <p className="font-bold text-sm">{rental.monthlyRent || 'Contact'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Separator />
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

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showVacantOnly, setShowVacantOnly] = useState(true);
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

  const handleViewDetails = (rental: RentalItem) => {
    // Show detailed modal for all users
    console.log('Opening detailed view for rental:', rental.name);
    setSelectedRental(rental);
    setCurrentMediaIndex(0);
    setIsModalOpen(true);
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
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, #dbeef8 0%, #daf7ef 100%)'
      }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading available rentals...</p>
        </div>
      </div>
    );
  }

  const filteredRentals = getFilteredRentals();

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #dbeef8 0%, #daf7ef 100%)'
    }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <img 
              src="https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/image.png"
              alt="Liberty Place Property Management Logo"
              className="h-32 w-auto object-contain drop-shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                // Show fallback text if image fails to load
                const fallback = document.createElement('div');
                fallback.className = 'text-4xl font-bold text-blue-600';
                fallback.textContent = 'Liberty Place Property Management';
                target.parentNode?.appendChild(fallback);
              }}
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {isAuthenticated ? 'Available Rentals' : 'Liberty Place Property Management'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {isAuthenticated 
              ? 'Browse our available properties and start your application today.'
              : 'Discover beautiful properties in prime locations. Sign in to apply.'
            }
          </p>
        </div>

        {/* Property Map - Top Section */}
        {filteredRentals.length > 0 && (
          <div className="mb-12">
            <PropertyMap
              rentals={filteredRentals}
              onViewDetails={handleViewDetails}
              onApplyNow={handleApplyNow}
            />
          </div>
        )}

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
                              <div class="text-xs text-gray-500">${selectedRental.mediaFiles?.[currentMediaIndex]?.name || 'Unknown'}</div>
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
                              <div class="text-xs text-gray-500">${selectedRental.mediaFiles?.[currentMediaIndex]?.name || 'Unknown'}</div>
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
                  {renderDetailedAmenities(selectedRental.amenities || '')}
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
