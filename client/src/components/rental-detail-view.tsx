"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  MapPin,
  Star,
  Heart,
  Share2,
  Bed,
  Bath,
  Square,
  Car,
  Filter,
  Utensils,
  ShoppingBag,
  GraduationCap,
  Bus,
  Trees,
  Hospital,
} from "lucide-react"
import { useState } from "react"

// Sample rental data (in a real app, this would come from an API or database)
const rentals = [
  {
    id: 1,
    title: "Charming Downtown Apartment",
    location: "Downtown District",
    price: "$2,400",
    period: "month",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    rating: 4.8,
    reviews: 24,
    images: [
      "/modern-downtown-apartment.png",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    features: ["Pet Friendly", "Parking", "Gym"],
    amenities: ["WiFi", "Air Conditioning", "Dishwasher", "Washer/Dryer", "Balcony", "Elevator"],
    description:
      "Enjoy morning coffee on your private balcony overlooking the park. This beautifully appointed apartment features modern finishes, an open floor plan, and abundant natural light. Located in the heart of downtown, you'll be walking distance to restaurants, shopping, and public transportation.",
    fullDescription:
      "This stunning 2-bedroom, 2-bathroom apartment offers the perfect blend of urban convenience and comfortable living. The open-concept living area flows seamlessly from the modern kitchen with stainless steel appliances to the spacious living room with floor-to-ceiling windows. The master bedroom includes an en-suite bathroom and walk-in closet, while the second bedroom is perfect for guests or a home office. Building amenities include a fitness center, rooftop terrace, and 24-hour concierge service.",
    nearbyAmenities: {
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
    },
  },
  {
    id: 2,
    title: "Spacious Family Home with Garden",
    location: "Suburban Heights",
    price: "$3,200",
    period: "month",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2400,
    rating: 4.9,
    reviews: 18,
    images: [
      "/spacious-family-house.png",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    features: ["Garden", "Garage", "Fireplace"],
    amenities: ["WiFi", "Central Air", "Dishwasher", "Washer/Dryer", "Fireplace", "2-Car Garage", "Fenced Yard"],
    description: "Perfect family home with a beautiful garden and modern amenities.",
    fullDescription:
      "This beautiful 4-bedroom, 3-bathroom family home sits on a quiet tree-lined street in the desirable Suburban Heights neighborhood. The home features a spacious open floor plan with hardwood floors throughout, a gourmet kitchen with granite countertops, and a cozy living room with fireplace. The master suite includes a walk-in closet and luxurious en-suite bathroom. Outside, enjoy the beautifully landscaped garden and covered patio perfect for entertaining.",
    nearbyAmenities: {
      dining: [
        "Family Diner - 0.5 miles",
        "Pizza Corner - 0.3 miles",
        "Garden Restaurant - 0.7 miles",
        "Coffee House - 0.4 miles",
      ],
      shopping: [
        "Suburban Plaza - 0.8 miles",
        "Grocery Store - 0.5 miles",
        "Hardware Store - 0.6 miles",
        "Pharmacy - 0.4 miles",
      ],
      education: [
        "Maple Elementary - 0.3 miles",
        "Heights Middle School - 0.6 miles",
        "Suburban High - 1.0 miles",
        "Community College - 2.0 miles",
      ],
      transportation: [
        "Bus Route 15 - 0.4 miles",
        "Park & Ride - 0.8 miles",
        "Highway 101 - 1.2 miles",
        "Train Station - 1.5 miles",
      ],
      recreation: [
        "Neighborhood Park - 0.2 miles",
        "Golf Course - 1.0 miles",
        "Swimming Pool - 0.6 miles",
        "Walking Trails - 0.3 miles",
      ],
      healthcare: [
        "Family Clinic - 0.8 miles",
        "Suburban Hospital - 1.5 miles",
        "Pediatric Office - 0.7 miles",
        "Veterinary Clinic - 0.5 miles",
      ],
    },
  },
]

const amenityCategories = [
  { key: "dining", label: "Dining & Entertainment", icon: Utensils, color: "text-orange-600" },
  { key: "shopping", label: "Shopping & Retail", icon: ShoppingBag, color: "text-purple-600" },
  { key: "education", label: "Education", icon: GraduationCap, color: "text-blue-600" },
  { key: "transportation", label: "Transportation", icon: Bus, color: "text-green-600" },
  { key: "recreation", label: "Recreation", icon: Trees, color: "text-teal-600" },
  { key: "healthcare", label: "Healthcare", icon: Hospital, color: "text-red-600" },
]

interface RentalDetailViewProps {
  rentalId: number;
  onBack?: () => void;
}

export function RentalDetailView({ rentalId, onBack }: RentalDetailViewProps) {
  const rental = rentals.find((r) => r.id === rentalId)
  const [selectedAmenityFilter, setSelectedAmenityFilter] = useState<string | null>(null)

  if (!rental) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Rental Not Found</h1>
          <Button onClick={onBack}>Back to Listings</Button>
        </div>
      </div>
    )
  }

  const filteredAmenities = selectedAmenityFilter
    ? amenityCategories.filter((cat) => cat.key === selectedAmenityFilter)
    : amenityCategories

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
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
              src={rental.images[0] || "/placeholder.svg"}
              alt={rental.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src={rental.images[1] || "/placeholder.svg?height=300&width=400"}
                alt={`${rental.title} - Image 2`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-[4/3] rounded-lg overflow-hidden">
              <img
                src={rental.images[2] || "/placeholder.svg?height=300&width=400"}
                alt={`${rental.title} - Image 3`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="col-span-2">
              <Button variant="outline" className="w-full h-20 bg-transparent">
                View All Photos
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title and Rating */}
            <div className="mb-6">
              <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">{rental.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{rental.rating}</span>
                  <span className="text-gray-500">({rental.reviews} reviews)</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{rental.location}</span>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{rental.bedrooms}</div>
                      <div className="text-sm text-gray-500">Bedrooms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{rental.bathrooms}</div>
                      <div className="text-sm text-gray-500">Bathrooms</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{rental.sqft}</div>
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
              <p className="text-gray-600 leading-relaxed mb-4">{rental.description}</p>
              <p className="text-gray-600 leading-relaxed">{rental.fullDescription}</p>
            </div>

            {/* Features */}
            <div className="mb-6">
              <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Features</h2>
              <div className="flex flex-wrap gap-2">
                {rental.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="px-3 py-1">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-6">
              <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {rental.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                    <span className="text-gray-600">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Location & Nearby</h2>
              <Card className="mb-6">
                <CardContent className="p-0">
                  <div className="aspect-[16/9] rounded-lg overflow-hidden">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.1234567890123!2d-74.0059413!3d40.7127753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a316e5b7c5d%3A0x1234567890abcdef!2sNew%20York%2C%20NY!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map showing location of ${rental.title}`}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{rental.location}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Explore what's nearby - from dining and shopping to schools and healthcare
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter by category:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedAmenityFilter === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedAmenityFilter(null)}
                    className={selectedAmenityFilter === null ? "bg-cyan-600 hover:bg-cyan-700" : "bg-transparent"}
                  >
                    All
                  </Button>
                  {amenityCategories.map((category) => (
                    <Button
                      key={category.key}
                      variant={selectedAmenityFilter === category.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedAmenityFilter(category.key)}
                      className={
                        selectedAmenityFilter === category.key ? "bg-cyan-600 hover:bg-cyan-700" : "bg-transparent"
                      }
                    >
                      <category.icon className="h-3 w-3 mr-1" />
                      {category.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Nearby Amenities List */}
              <div className="space-y-4">
                {filteredAmenities.map((category) => (
                  <div key={category.key}>
                    <h3 className="font-semibold text-gray-900">{category.label}</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {rental.nearbyAmenities[category.key as keyof typeof rental.nearbyAmenities].map(
                        (item, index) => (
                          <li key={index}>{item}</li>
                        ),
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-cyan-600 mb-1">{rental.price}</div>
                  <div className="text-gray-500">per {rental.period}</div>
                </div>

                <div className="space-y-3 mb-6">
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700">Schedule Tour</Button>
                  <Button
                    variant="outline"
                    className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50 bg-transparent"
                  >
                    Contact Owner
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
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
  )
}
