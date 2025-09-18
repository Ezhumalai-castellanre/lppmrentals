"use client"

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MondayApiService, RentalItem } from '../lib/monday-api';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
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
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PropertyAmenitiesMap } from '../components/property-amenities-map'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'

export default function PropertyDetailsPage() {
  const [, setLocation] = useLocation();
  const [rental, setRental] = useState<RentalItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAmenityFilter, setSelectedAmenityFilter] = useState<string | null>(null);
  const [openGalleryDialog, setOpenGalleryDialog] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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



  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested property could not be found.'}</p>
          <Button onClick={() => setLocation('/drafts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Drafts
          </Button>
        </div>
      </div>
    );
  }

  // Prefer enriched fields from processed rentals
  const displayPropertyName: string = rental.propertyName || '';
  const displayUnitName: string = rental.name || '';
  const displayMonthlyRent: string = rental.monthlyRent || '';
  const unitTypeText: string = rental.unitType || '';

  const aboutText: string | undefined = rental.about || undefined;
  const apartmentFeaturesText: string | undefined = rental.apartmentFeatures || undefined;
  const buildingDetailsText: string | undefined = rental.buildingDetails || undefined;
  const neighborText: string | undefined = rental.neighborhood || undefined;
  const whyLoveText: string | undefined = rental.whyYoullLoveIt || undefined;

  const effectiveImages: string[] = (rental.mediaFiles?.map(f => f.url) || []) as string[];

  const neighborhoodItems: string[] = neighborText
    ? neighborText.split('\n').map(s => s.trim()).filter(Boolean)
    : [];

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
            Back to Home
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

      {/* Image Slider */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-4">
          <img
            src={(effectiveImages[currentImageIndex] || "/placeholder.svg") as string}
            alt={displayUnitName || rental.name}
            className="w-full h-full object-cover"
          />

          {/* Overlay summary card (desktop) */}
          <div className="hidden lg:block absolute right-6 bottom-6">
            <Card className="shadow-xl">
              <CardContent className="p-6 w-[360px]">
                <div className="mb-3">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 border border-emerald-200">Available Now</span>
                </div>
                <div className="flex items-baseline gap-3 mb-4">
                  <div className="text-4xl font-bold tracking-tight text-gray-900">{displayMonthlyRent || 'Contact'}</div>
                  <div className="text-gray-500">per month</div>
                </div>
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                    onClick={() => window.open('https://forms.monday.com/forms/8c6c6cd6c030c82856c14ef4439c61df?r=use1&color_mktgkr4e=East+30th+Street&short_text800omovg=6B', '_blank')}
                  >
                    Apply Now
                  </Button>
                  <div className="text-[13px] text-gray-500 text-center">{displayPropertyName}</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Navigation Buttons */}
          {effectiveImages.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-600 hover:text-cyan-600"
                onClick={() => setCurrentImageIndex((prev) => prev === 0 ? effectiveImages.length - 1 : prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-600 hover:text-cyan-600"
                onClick={() => setCurrentImageIndex((prev) => prev === effectiveImages.length - 1 ? 0 : prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {/* Image Counter */}
          {effectiveImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {effectiveImages.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'bg-white scale-125' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}
          
          {/* View All Photos Button */}
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/80 hover:bg-white text-gray-600 hover:text-red-500"
              onClick={() => setOpenGalleryDialog(true)}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* View All Photos Button */}
        <div className="text-center">
          <Button variant="outline" className="bg-transparent" onClick={() => setOpenGalleryDialog(true)}>
            View All Photos ({effectiveImages.length})
          </Button>
        </div>
        <Dialog open={openGalleryDialog} onOpenChange={setOpenGalleryDialog}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Photos — {displayUnitName || rental.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {effectiveImages.length > 0 ? (
                effectiveImages.map((src, idx) => (
                  <div key={idx} className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                    <img src={src} alt={`${displayUnitName || rental.name} - Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-600 py-12">No photos available</div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Email Contact Form Dialog */}
        <Dialog open={showEmailForm} onOpenChange={setShowEmailForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Contact About {rental.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Tell us about your interest in this property..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => {
                    // Handle email submission here
                    alert('Thank you! We will contact you soon.');
                    setShowEmailForm(false);
                  }}
                >
                  Send Message
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEmailForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title and Location */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-gray-700" />
                <h1 className="text-3xl font-bold text-gray-900" style={{ fontSize: '0.875rem' }}>{displayUnitName || rental.name}</h1>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-cyan-600 mb-1" style={{ fontSize: '1.575rem' }}>{displayPropertyName || rental.propertyName}</span>
                </div>
              </div>
            </div>


            {/* About */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-cyan-600 mb-1" style={{ fontSize: '0.875rem' }}>About</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {aboutText || (rental.amenities ? rental.amenities.split('\n').slice(0, 3).join(' ') : 'Beautiful property with modern amenities. Contact us for more details.')}
              </p>
              <p className="text-gray-600 leading-relaxed">
                This stunning property offers the perfect blend of comfort and convenience. 
                Located in a prime area, you'll have easy access to all the amenities you need.
                Contact us to learn more about this exceptional property.
              </p>
            </div>

            {/* Apartment Features */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-cyan-600 mb-1" style={{ fontSize: '0.875rem' }}>Apartment Features</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {unitTypeText || rental.unitType || 'Standard'}
                </Badge>
              </div>
              {apartmentFeaturesText && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {apartmentFeaturesText
                    .split('\n')
                    .map(s => s.trim())
                    .filter(s => s.length > 0)
                    .map((line, i) => (
                      <div key={i} className="text-gray-600">{line.startsWith('•') ? line : `• ${line}`}</div>
                    ))}
                </div>
              )}
            </div>

            {/* Building Details */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-cyan-600 mb-1 flex items-center gap-2" style={{ fontSize: '0.875rem' }}>
              
                Building Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(buildingDetailsText ? buildingDetailsText.split('\n') : ['Elevator building', 'Laundry in building', 'Secure entry', 'On-site maintenance'])
                  .map(s => s.trim())
                  .filter(s => s.length > 0)
                  .map((line, i) => (
                    <div key={i} className="text-gray-600">{line.startsWith('•') ? line : `• ${line}`}</div>
                  ))}
              </div>
            </div>


            {/* Neighborhood & Transit */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-cyan-600 mb-1" style={{ fontSize: '0.875rem' }}>Neighborhood & Transit</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4" style={{
                display: 'flex',
                flexWrap: 'wrap'
              }}>
                {(neighborhoodItems.length ? neighborhoodItems : (rental.amenities ? rental.amenities.split('\n') : ['WiFi','Air Conditioning','Modern Kitchen','Balcony','Elevator','Security']))
                  .slice(0, 6)
                  .map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-gray-600">{amenity.trim().startsWith('•') ? amenity.trim() : `• ${amenity.trim()}`}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Why You’ll Love It */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-cyan-600 mb-1" style={{ fontSize: '0.875rem' }}>Why You’ll Love It</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {(whyLoveText ? whyLoveText.split('\n') : [
                  'Bright, modern design with functional layout',
                  'Close to dining, parks, and transit',
                  'Professional management and responsive maintenance'
                ]).filter(Boolean).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>

            {/* Map moved to sidebar in Location card */}

           
          </div>

          {/* Sidebar (Location + Contact) */}
          <div className="hidden lg:block">
            <div className="space-y-6 sticky top-24">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 text-gray-600">◎</span>
                    <h3 className="font-semibold text-gray-900">Location</h3>
                  </div>
                  <div className="h-64 rounded-lg overflow-hidden border">
                    <PropertyAmenitiesMap
                      propertyName={displayPropertyName}
                      propertyCoordinates={getPropertyCoordinates(displayPropertyName)}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-3">{displayPropertyName}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Phone:</span>
                      <a href="tel:+16465456731" className="text-cyan-600 hover:text-cyan-700 font-medium">(646) 545-6731</a>
                    </div>
                    <div className="flex items-center gap-2 break-all">
                      <span className="text-gray-500">Email:</span>
                      <a href="mailto:libertyleasing@libertyplacepm.com" className="text-cyan-600 hover:text-cyan-700 font-medium">libertyleasing@libertyplacepm.com</a>
                    </div>
                    <div>
                   
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Apply Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          className="w-16 h-16 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={() => window.open('https://forms.monday.com/forms/8c6c6cd6c030c82856c14ef4439c61df?r=use1&color_mktgkr4e=East+30th+Street&short_text800omovg=6B', '_blank')}
        >
          <span className="text-2xl">📝</span>
        </Button>
      </div>
    </div>
  );
}
