import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MondayApiService, RentalItem } from '../lib/monday-api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  Send, 
  MapPin, 
  Home, 
  DollarSign, 
  Square, 
  Wifi, 
  Car, 
  Shield, 
  Wrench, 
  ChefHat, 
  Bath, 
  Sparkles, 
  Users, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Image, 
  ArrowLeft,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function PropertyDetailsPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [rental, setRental] = useState<RentalItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Get rental ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const rentalId = urlParams.get('id');
    
    if (rentalId) {
      fetchRentalDetails(rentalId);
    } else {
      setError('No rental ID provided');
      setLoading(false);
    }
  }, []);

  const fetchRentalDetails = async (rentalId: string) => {
    try {
      setLoading(true);
      const availableRentals = await MondayApiService.fetchAvailableRentals();
      const foundRental = availableRentals.find(r => r.id === rentalId);
      
      if (foundRental) {
        setRental(foundRental);
      } else {
        setError('Rental not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rental details');
      console.error('Error fetching rental details:', err);
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

  const handlePreviousImage = () => {
    if (rental && rental.mediaFiles) {
      setCurrentImageIndex(prev => 
        prev === 0 ? rental.mediaFiles!.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (rental && rental.mediaFiles) {
      setCurrentImageIndex(prev => 
        prev === rental.mediaFiles!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const renderAmenities = (amenities: string) => {
    if (!amenities) return null;
    
    const amenityList = amenities.split(',').map(item => item.trim()).filter(Boolean);
    
    if (amenityList.length === 0) return null;

    const amenityIcons: { [key: string]: React.ReactNode } = {
      'wifi': <Wifi className="w-4 h-4" />,
      'parking': <Car className="w-4 h-4" />,
      'security': <Shield className="w-4 h-4" />,
      'maintenance': <Wrench className="w-4 h-4" />,
      'kitchen': <ChefHat className="w-4 h-4" />,
      'bathroom': <Bath className="w-4 h-4" />,
      'luxury': <Sparkles className="w-4 h-4" />,
      'community': <Users className="w-4 h-4" />,
      '24/7': <Clock className="w-4 h-4" />,
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {amenityList.map((amenity, index) => {
            const icon = amenityIcons[amenity.toLowerCase()] || <Square className="w-4 h-4" />;
            return (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="text-blue-600">{icon}</div>
                <span className="text-sm font-medium text-gray-700 capitalize">{amenity}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested property could not be found.'}</p>
          <Button onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const images = rental.mediaFiles?.map(file => file.url) || [];
  const hasImages = images.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="mb-4 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{rental.name}</h1>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-lg">{rental.propertyName}</span>
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className="bg-green-100 text-green-800 hover:bg-green-100 text-lg px-4 py-2"
            >
              <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
              Available Now
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-semibold text-gray-900">Property Photos</h2>
              </CardHeader>
              <CardContent>
                {hasImages ? (
                  <div className="relative">
                    <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={images[currentImageIndex]} 
                        alt={`Property image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full flex items-center justify-center bg-gray-200 text-gray-600';
                          fallback.innerHTML = `
                            <div class="text-center">
                              <div class="text-4xl mb-2">🖼️</div>
                              <div class="text-lg">Image not available</div>
                            </div>
                          `;
                          target.parentNode?.appendChild(fallback);
                        }}
                      />
                      
                      {/* Navigation Arrows */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={handlePreviousImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <button
                            onClick={handleNextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </>
                      )}
                      
                      {/* Image Counter */}
                      {images.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      )}
                    </div>
                    
                    {/* Thumbnail Navigation */}
                    {images.length > 1 && (
                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                              index === currentImageIndex 
                                ? 'border-blue-500 ring-2 ring-blue-200' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img 
                              src={image} 
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center bg-gray-200 rounded-lg">
                    <div className="text-center text-gray-600">
                      <Image className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg">No images available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-semibold text-gray-900">Property Details</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Unit:</span>
                      <span className="font-semibold text-gray-900">{rental.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Type: </span>
                      <span className="font-semibold text-gray-900">{rental.unitType}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Availability:</span>
                      <span className="font-semibold text-gray-900">Available Now</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Monthly Rent:</span>
                      <span className="font-bold text-lg text-green-600">
                        {rental.monthlyRent && rental.monthlyRent.trim() !== '' 
                          ? `$${rental.monthlyRent}` 
                          : 'Contact for pricing'
                        }
                      </span>
                    </div>
                  
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            {rental.amenities && (
              <Card>
                <CardContent className="pt-6">
                  {renderAmenities(rental.amenities)}
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <h2 className="text-2xl font-semibold text-gray-900">Contact Information</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <p className="text-gray-600">(555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <Mail className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">info@lppmrentals.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Office Hours</p>
                      <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
                  onClick={() => handleApplyNow(rental)}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Apply Now
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-lg py-3"
                  onClick={() => window.open('tel:+15551234567')}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call Now
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-lg py-3"
                  onClick={() => window.open('mailto:info@lppmrentals.com')}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Send Email
                </Button>
              </CardContent>
            </Card>

            {/* Property Highlights */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold text-gray-900">Property Highlights</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Available for immediate move-in</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Pet-friendly community</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>24/7 maintenance support</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>On-site parking available</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Info */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold text-gray-900">Location</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{rental.propertyName}</p>
                      <p className="text-sm text-gray-600">Prime location with easy access to amenities</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="text-sm text-gray-600">
                    <p>• Walking distance to shopping centers</p>
                    <p>• Close to public transportation</p>
                    <p>• Near parks and recreational areas</p>
                    <p>• Excellent school district</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
