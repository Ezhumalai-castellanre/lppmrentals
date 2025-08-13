"use client"

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MondayApiService, RentalItem } from '../lib/monday-api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  MapPin,
  Heart,
  Share2,
  Home,
  DollarSign,
  Square,
  Car,
  Filter,
  Utensils,
  ShoppingBag,
  GraduationCap,
  Bus,
  TreePine,
  Building2
} from 'lucide-react';
import { PropertyAmenitiesMap } from '@/components/property-amenities-map'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function PropertyDetailsPage() {
  const [, setLocation] = useLocation();
  const [rental, setRental] = useState<RentalItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAmenityFilter, setSelectedAmenityFilter] = useState<string | null>(null);
  const [openGalleryDialog, setOpenGalleryDialog] = useState(false);

  // Generate nearby amenities data based on property location
  const generateNearbyAmenities = () => {
    const baseAmenities = {
      dining: [
        "The Gourmet Bistro - 0.2 miles",
        "Café Luna - 0.3 miles",
        "Steakhouse Prime - 0.4 miles",
        "Sushi Zen - 0.5 miles",
      ],
      shopping: [
        "Downtown Mall - 0.3 miles",
        "Whole Foods Market - 0.4 miles",
        "Target - 0.6 miles",
        "Local Boutiques - 0.2 miles",
      ],
      education: [
        "Lincoln Elementary - 0.5 miles",
        "Central High School - 0.8 miles",
        "Downtown University - 1.2 miles",
        "Public Library - 0.3 miles",
      ],
      transportation: [
        "Metro Station - 0.2 miles",
        "Bus Stop - 0.1 miles",
        "Highway Access - 0.5 miles",
        "Bike Share Station - 0.1 miles",
      ],
      recreation: [
        "Central Park - 0.3 miles",
        "Riverside Trail - 0.4 miles",
        "Community Center - 0.6 miles",
        "Tennis Courts - 0.5 miles",
      ],
      healthcare: [
        "City Medical Center - 0.7 miles",
        "Urgent Care Clinic - 0.4 miles",
        "Downtown Pharmacy - 0.2 miles",
        "Dental Office - 0.3 miles",
      ],
    };
    return baseAmenities;
  };

  const amenityCategories = [
    { key: "dining", label: "Dining & Entertainment", icon: Utensils, color: "text-orange-600" },
    { key: "shopping", label: "Shopping & Retail", icon: ShoppingBag, color: "text-purple-600" },
    { key: "education", label: "Education", icon: GraduationCap, color: "text-blue-600" },
    { key: "transportation", label: "Transportation", icon: Bus, color: "text-green-600" },
    { key: "recreation", label: "Recreation", icon: TreePine, color: "text-teal-600" },
    { key: "healthcare", label: "Healthcare", icon: Building2, color: "text-red-600" },
  ];

  const nearbyAmenities = generateNearbyAmenities();
  const filteredAmenities = selectedAmenityFilter
    ? amenityCategories.filter((cat) => cat.key === selectedAmenityFilter)
    : amenityCategories;

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
    
    // Map property name to color_mktgkr4e parameter (e.g., "East 30th Street")
    if (rental.propertyName) {
      params.append('color_mktgkr4e', rental.propertyName);
    }
    
    // Map unit number to short_text800omovg parameter (e.g., "6B")
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
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
  
  const getPropertyCoordinates = (propertyName: string): [number, number] => {
    const hash = propertyName.split('').reduce((acc, ch) => {
      acc = ((acc << 5) - acc) + ch.charCodeAt(0);
      return acc & acc;
    }, 0);
    const baseLat = 40.7589;
    const baseLng = -73.9851;
    const lat = baseLat + ((hash % 100) * 0.001);
    const lng = baseLng + (((hash >> 3) % 100) * 0.001);
    return [lat, lng];
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation('/')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Listings
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="aspect-[4/3] rounded-lg overflow-hidden">
            <img
              src={images[0] || "/placeholder.svg"}
              alt={rental.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src={images[1] || "/placeholder.svg?height=300&width=400"}
                alt={`${rental.name} - Image 2`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src={images[2] || "/placeholder.svg?height=300&width=400"}
                alt={`${rental.name} - Image 3`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="col-span-2">
              <Button variant="outline" className="w-full h-20 bg-transparent" onClick={() => setOpenGalleryDialog(true)}>
                View All Photos
              </Button>
            </div>
          </div>
        </div>
        <Dialog open={openGalleryDialog} onOpenChange={setOpenGalleryDialog}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Photos — {rental.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {images.length > 0 ? (
                images.map((src, idx) => (
                  <div key={idx} className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                    <img src={src} alt={`${rental.name} - Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-600 py-12">No photos available</div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title and Rating */}
            <div className="mb-6">
              <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">{rental.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{rental.propertyName}</span>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{rental.unitType || 'STD'}</div>
                      <div className="text-sm text-gray-500">Type</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{rental.monthlyRent || 'Contact'}</div>
                      <div className="text-sm text-gray-500">Monthly Rent</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Contact</div>
                      <div className="text-sm text-gray-500">Sq Ft</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Yes</div>
                      <div className="text-sm text-gray-500">Parking</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <div className="mb-6">
              <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">About This Property</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {rental.amenities ? 
                  rental.amenities.split('\n').slice(0, 3).join(' ') : 
                  'Beautiful property with modern amenities. Contact us for more details.'
                }
              </p>
              <p className="text-gray-600 leading-relaxed">
                This stunning property offers the perfect blend of comfort and convenience. 
                Located in a prime area, you'll have easy access to all the amenities you need.
                Contact us to schedule a tour and learn more about this exceptional property.
              </p>
            </div>

            {/* Features */}
            <div className="mb-6">
              <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Features</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {rental.unitType || 'Standard'}
                </Badge>
                {rental.mediaFiles && rental.mediaFiles.length > 0 && (
                  <Badge variant="secondary" className="px-3 py-1">
                    {rental.mediaFiles.length} Photos
                  </Badge>
                )}
                <Badge variant="secondary" className="px-3 py-1">
                  Available Now
                </Badge>
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-6">
              <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {rental.amenities ? 
                  rental.amenities.split('\n').slice(0, 6).map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                      <span className="text-gray-600">{amenity.trim()}</span>
                    </div>
                  )) : 
                  ['WiFi', 'Air Conditioning', 'Modern Kitchen', 'Balcony', 'Elevator', 'Security'].map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                      <span className="text-gray-600">{amenity}</span>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="mb-6">
              <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Location & Nearby</h2>
              <Card className="mb-6">
                <CardContent className="p-0">
                  <PropertyAmenitiesMap
                    propertyName={rental.propertyName || rental.name}
                    propertyCoordinates={getPropertyCoordinates(rental.propertyName || rental.name)}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-cyan-600 mb-1">
                    {rental.monthlyRent ? `$${rental.monthlyRent}` : 'Contact'}
                  </div>
                  <div className="text-gray-500">per month</div>
                </div>

                <div className="space-y-3 mb-6">
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700">Schedule Tour</Button>
                  <Button
                    variant="outline"
                    className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50 bg-transparent"
                  >
                    Contact Owner
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full bg-transparent"
                    onClick={() => handleApplyNow(rental)}
                  >
                    Apply Now
                  </Button>
                </div>

                <div className="text-center text-sm text-gray-500">
                  <p>Response time: Usually within 2 hours</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
