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
                  <p className="font-bold text-sm">
                    {rental.monthlyRent && rental.monthlyRent.trim() !== '' 
                      ? `$${rental.monthlyRent}` 
                      : 'Contact for pricing'
                    }
                  </p>
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

  const renderDetailedAmenities = (amenities: string) => {
    if (!amenities || amenities.trim() === '') {
      return (
        <div className="mt-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center">
            <Home className="w-4 h-4 mr-2" />
            Amenities
          </h4>
          <div className="text-sm text-gray-500 italic">
            Amenities information not available
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
    } else {
      // Display as paragraphs for non-bulleted text
      return (
        <div className="mt-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center">
            <Home className="w-4 h-4 mr-2" />
            Property Description
          </h4>
          <div className="text-sm text-gray-700 space-y-3">
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
        <div className="space-y-8 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Available Properties
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Browse our selection of premium rental properties in prime locations
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

      {/* Footer with Social Media Links */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img 
                src="https://supportingdocuments-storage-2025.s3.us-east-1.amazonaws.com/image.png"
                alt="LPPM Rentals Logo"
                className="h-16 w-auto object-contain"
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
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.7-1.35 3.83-.82 1.13-1.87 2.02-3.07 2.71-1.2.69-2.49 1.13-3.8 1.33-.62.09-1.24.13-1.86.14-1.3-.01-2.6-.28-3.76-.77-1.16-.49-2.18-1.18-3.04-2.03-.86-.85-1.54-1.87-2.03-3.03-.49-1.16-.76-2.46-.77-3.76.01-1.3.28-2.6.77-3.76.49-1.16 1.18-2.18 2.03-3.04.86-.86 1.88-1.54 3.04-2.03 1.16-.49 2.46-.76 3.76-.77-.62-.01-1.24-.05-1.86-.14-1.31-.2-2.6-.64-3.8-1.33-1.2-.69-2.25-1.58-3.07-2.71-.81-1.13-1.27-2.43-1.35-3.83-.03-2.91-.03-5.83-.02-8.75-.52.34-1.05.67-1.62.93-1.31.62-2.76.92-4.2.97V6.11c1.54-.17 3.12-.68 4.24-1.79 1.12-1.08 1.67-2.64 1.75-4.17z"/>
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
              
              <a 
                href="https://www.linkedin.com/company/liberty-place-property-management/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
            
            <div className="text-gray-400 text-sm">
              <p>© 2025 Liberty Place Property Management, LLC. All rights reserved.</p>
              <p className="mt-2">1841 Broadway, Suite 400, New York, NY 10023</p>
            </div>
          </div>
        </div>
      </footer>

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
            <div className="space-y-8">
              {/* Media Gallery */}
              {selectedRental.mediaFiles && selectedRental.mediaFiles.length > 0 && (
                <div className="relative">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {selectedRental.mediaFiles[currentMediaIndex]?.isVideo ? (
                      <video 
                        src={selectedRental.mediaFiles[currentMediaIndex]?.url}
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
                        src={selectedRental.mediaFiles[currentMediaIndex]?.url}
                        alt={selectedRental.mediaFiles[currentMediaIndex]?.name || 'Property image'}
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
                  {selectedRental.mediaFiles && selectedRental.mediaFiles.length > 1 && (
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

              {/* Amenities Section - Now First */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Property Description</h3>
                {renderDetailedAmenities(selectedRental.amenities || '')}
              </div>

              {/* Property Details Section - Now Second */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Property Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Unit:</span>
                      <span className="font-semibold text-gray-900">{selectedRental.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Property:</span>
                      <span className="font-semibold text-gray-900">{selectedRental.propertyName}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Type:</span>
                      <span className="font-semibold text-gray-900">{selectedRental.unitType}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Status:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <div className="w-2 h-2 rounded-full mr-1 bg-green-500"></div>
                        Available Now
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Monthly Rent:</span>
                      <span className="font-bold text-green-600 text-lg">
                        {selectedRental.monthlyRent && selectedRental.monthlyRent.trim() !== '' 
                          ? `$${selectedRental.monthlyRent}` 
                          : 'Contact for pricing'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Media Files:</span>
                      <span className="font-semibold text-gray-900">{selectedRental.mediaFiles?.length || 0} files</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media Files Thumbnails */}
              {selectedRental.mediaFiles && selectedRental.mediaFiles.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Media Gallery</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {selectedRental.mediaFiles?.map((media, index) => (
                      <div
                        key={media.id}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                          index === currentMediaIndex ? 'border-blue-500' : 'border-gray-200'
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
                            className="w-full h-24 object-cover"
                          />
                        )}
                        <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6 border-t">
                <Button 
                  onClick={() => handleApplyNow(selectedRental)}
                  className="flex-1 bg-primary hover:bg-primary/90 text-lg py-3"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Apply Now
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-lg py-3"
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
