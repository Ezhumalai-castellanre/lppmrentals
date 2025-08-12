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

// PropertyCard Component with enhanced UI
function PropertyCard({ rental, onViewDetails, onApplyNow }: {
  rental: RentalItem;
  onViewDetails: (rental: RentalItem) => void;
  onApplyNow: (rental: RentalItem) => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);

  const images = rental.mediaFiles?.map(file => file.url) || [];
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
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
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
    // Navigate to property details page with rental ID
    console.log('Opening detailed view for rental:', rental.name);
    setLocation(`/property-details?id=${rental.id}`);
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
    // Return all rentals without filtering by status
    return rentals;
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
    if (!amenities || amenities.trim() === '') {
      return (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Property Description</h4>
          <div className="text-sm text-gray-500 italic">
            Property description not available
          </div>
        </div>
      );
    }
    
    // Split by newlines and filter out empty lines
    const lines = amenities.split('\n').filter(line => line.trim() !== '');
    
    // Check if the text contains bullet points
    const hasBullets = lines.some(line => line.trim().startsWith('•'));
    
    if (hasBullets) {
      // Display bulleted amenities
      const amenityList = lines.filter(line => line.trim().startsWith('•'));
      
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
    } else {
      // Display as paragraphs for non-bulleted text
      return (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Property Description</h4>
          <div className="text-sm text-gray-700 space-y-2">
            {lines.map((line, idx) => (
              <p key={idx} className="leading-relaxed">
                {line.trim()}
              </p>
            ))}
          </div>
        </div>
      );
    }
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
    <div className="min-h-screen bg-gradient-to-br from-[#dbeef7] to-[#dbf0f5]">
      {/* Header Section */}
      <header className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-8 sm:mb-12 lg:mb-16">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <img 
              src="https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/image+(1).png" 
              alt="Liberty Place Property Management Logo" 
              className="object-contain w-[120px] sm:w-[150px] h-10 sm:h-12 md:h-16 lg:h-20 xl:h-24 md:mr-[76px] mr-[109px]"
            />
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative">
          <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl">
            <img 
              src="https://blog.mipimworld.com/wp-content/uploads/2017/07/10_Hottest_Startups_Cropped.jpg" 
              alt="New York City Skyline" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent">
              <div className="flex items-center h-full">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="max-w-2xl text-white">
                    {/* Mobile: Split layout without card */}
                    <div className="block sm:hidden">
                      <h1 className="text-2xl font-bold mb-3 leading-tight">
                        Liberty Place
                        <span className="block text-lg font-light text-blue-200 mt-1">
                          Property Management
                        </span>
                      </h1>
                      <p className="text-xs mb-4 leading-relaxed text-gray-100">
                        Discover beautiful properties in prime locations. Experience luxury living with our premium property management services.
                      </p>
                      <div className="flex flex-col gap-2">
                          <a target="_blank" href="https://forms.monday.com/forms/8c6c6cd6c030c82856c14ef4439c61df?r=use1&color_mktgkr4e=East+30th+Street&short_text800omovg=6B" className="border-2 border-white text-white px-3 py-2 rounded-lg font-semibold text-xs hover:bg-white hover:text-gray-900 transition-all duration-300">
                            Sign In to Apply
                          </a>
                      </div>
                    </div>
                    
                    {/* Desktop: Card layout */}
                    <div className="hidden sm:block bg-black/20 backdrop-blur-sm rounded-xl p-6 lg:p-8 border border-white/20">
                      <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 lg:mb-6 leading-tight">
                        Liberty Place
                        <span className="block text-xl md:text-2xl lg:text-3xl xl:text-4xl font-light text-blue-200 mt-2">
                          Property Management
                        </span>
                      </h1>
                      <p className="text-sm md:text-base lg:text-lg xl:text-xl mb-6 lg:mb-8 leading-relaxed text-gray-100">
                        Discover beautiful properties in prime locations. Experience luxury living with our premium property management services.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                        <a target="_blank"  href="https://forms.monday.com/forms/8c6c6cd6c030c82856c14ef4439c61df?r=use1&color_mktgkr4e=East+30th+Street&short_text800omovg=6B" className="border-2 border-white text-white px-4 lg:px-6 xl:px-8 py-3 lg:py-4 rounded-lg font-semibold text-sm md:text-base lg:text-lg hover:bg-white hover:text-gray-900 transition-all duration-300">
                          Sign In to Apply
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="absolute -bottom-8 sm:-bottom-12 lg:-bottom-16 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-2 sm:px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Premium Properties</h3>
                <p className="text-xs sm:text-sm text-gray-600">Luxury apartments and condos in the heart of the city</p>
              </div>
              
              <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Verified Listings</h3>
                <p className="text-xs sm:text-sm text-gray-600">All properties are thoroughly vetted and verified</p>
              </div>
              
              <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 sm:col-span-2 lg:col-span-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Quick Application</h3>
                <p className="text-xs sm:text-sm text-gray-600">Streamlined application process for faster approval</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for feature cards */}
      <div className="h-12 sm:h-16 lg:h-24"></div>

      {/* Rental Cards Section */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">
              Available Rentals
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
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <div className="w-2 h-2 rounded-full mr-1 bg-green-500"></div>
                        Available Now
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Rent:</span>
                      <span className="font-medium text-green-600">
                        {selectedRental.monthlyRent && selectedRental.monthlyRent.trim() !== '' 
                          ? `$${selectedRental.monthlyRent}` 
                          : 'Contact for pricing'
                        }
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
      
      {/* Footer with Social Media Links */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img 
                src="https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/image+(1).png"
                alt="Liberty Place Property Management Logo"
                className="h-16 w-auto object-contain md:mr-[76px] mr-[109px]"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'text-2xl font-bold text-white';
                  fallback.textContent = 'LPPM Rentals';
                  target.parentNode?.appendChild(fallback);
                }}
              />
            </div>
            <h3 className="text-2xl font-bold mb-4">Liberty Place Property Management</h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Full service property management company located in Midtown, Manhattan. 
              We manage a growing portfolio of residential and mixed-use retail locations 
              throughout New York City and Westchester County.
            </p>
            
            {/* Social Media Links */}
            <div className="flex justify-center items-center gap-6 mb-8">
              <a 
                href="https://www.tiktok.com/@libertyplacepm?is_from_webapp=1&sender_device=pc" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.7-1.35 3.83-.82 1.13-1.87 2.02-3.07 2.71-1.2.69-2.49 1.13-3.8 1.33-.62.09-1.24.13-1.86.14-1.3-.01-2.6-.28-3.76-.77-1.16-.49-2.18-1.18-3.04-2.03-.86-.85-1.54-1.87-2.03-3.03-.49-1.16-.76-2.46-.77-3.76.01-1.3.28-2.6.77-3.76.49-1.16 1.18-2.18 2.03-3.04.86-.86 1.88-1.54 3.04-2.03 1.16-.49 2.46-.76 3.76-.77.62-.01 1.24-.05 1.86-.14 1.31-.2 2.6-.64 3.8-1.33 1.2-.69 2.25-1.58 3.07-2.71 1.13-1.13 1.67-2.69 1.75-4.22.05-1.26.06-1.64.06-4.849 0-3.205-.012-3.584-.069-4.849-.149-3.225-1.664-4.771-4.919-4.919-1.266-.058-1.644-.07-4.85-.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                TikTok
              </a>
              
              <a 
                href="https://www.instagram.com/p/DM-yYtzohdJ/?utm_source=ig_web_copy_link" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </a>
              

            </div>
            
            <div className="text-gray-400 text-sm">
              <p>© 2025 Liberty Place Property Management, LLC. All rights reserved.</p>
              <p className="mt-2">1841 Broadway, Suite 400, New York, NY 10023</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
