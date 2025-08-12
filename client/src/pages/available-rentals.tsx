"use client"

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MondayApiService, RentalItem } from '../lib/monday-api';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, Send, MapPin, Home, DollarSign, ChevronLeft, ChevronRight, Image } from 'lucide-react';
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
              <div className="flex justify-center mt-2 space-x-1">
                {displayedImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
            
            {/* Show More Images Button */}
            {hasMoreImages && !showAllImages && (
              <button
                onClick={() => setShowAllImages(true)}
                className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1 rounded-full transition-all duration-200"
              >
                +{images.length - 4} more
              </button>
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
    // Navigate to property details page with rental ID
    setLocation(`/property-details?id=${rental.id}`);
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

  const getFilteredRentals = () => {
    // Return all rentals without filtering by status
    return rentals;
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
            Try Again
          </Button>
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
            Discover your perfect home from our available rentals
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
              Available Rentals
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-xl font-semibold mb-4">LPPM Rentals</h3>
              <p className="text-gray-400 mb-4">
                Your trusted partner in finding the perfect rental property in New York City.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/available-rentals" className="text-gray-400 hover:text-white transition-colors">Available Rentals</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
              <div className="space-y-2 text-gray-400">
                <p>1841 Broadway, Suite 400</p>
                <p>New York, NY 10023</p>
                <p>Phone: (555) 123-4567</p>
                <p>Email: info@lppmrentals.com</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
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
