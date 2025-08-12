import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Utensils, 
  ShoppingBag, 
  GraduationCap, 
  Car, 
  Bus, 
  TreePine, 
  Building2,
  Filter,
  X
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Amenity {
  id: string;
  name: string;
  type: 'restaurant' | 'shopping' | 'school' | 'transportation' | 'park' | 'healthcare';
  coordinates: [number, number];
  rating?: number;
  distance?: string;
  description?: string;
}

interface PropertyAmenitiesMapProps {
  propertyName: string;
  propertyCoordinates: [number, number];
  className?: string;
}

// Sample amenity data - in a real app, this would come from a mapping API like Google Places or Foursquare
const generateNearbyAmenities = (propertyCoords: [number, number]): Amenity[] => {
  const [lat, lng] = propertyCoords;
  
  return [
    // Restaurants
    {
      id: 'rest1',
      name: 'The Local Bistro',
      type: 'restaurant',
      coordinates: [lat + 0.002, lng + 0.001],
      rating: 4.5,
      distance: '0.2 mi',
      description: 'Upscale American cuisine with outdoor seating'
    },
    {
      id: 'rest2',
      name: 'Pizza Palace',
      type: 'restaurant',
      coordinates: [lat - 0.001, lng + 0.003],
      rating: 4.2,
      distance: '0.3 mi',
      description: 'Authentic Italian pizza and pasta'
    },
    {
      id: 'rest3',
      name: 'Sushi Express',
      type: 'restaurant',
      coordinates: [lat + 0.003, lng - 0.002],
      rating: 4.7,
      distance: '0.4 mi',
      description: 'Fresh sushi and Japanese cuisine'
    },
    
    // Shopping
    {
      id: 'shop1',
      name: 'Downtown Mall',
      type: 'shopping',
      coordinates: [lat + 0.004, lng + 0.002],
      rating: 4.3,
      distance: '0.5 mi',
      description: 'Multi-level shopping center with major retailers'
    },
    {
      id: 'shop2',
      name: 'Grocery Mart',
      type: 'shopping',
      coordinates: [lat - 0.002, lng - 0.001],
      rating: 4.1,
      distance: '0.2 mi',
      description: 'Full-service grocery store with pharmacy'
    },
    {
      id: 'shop3',
      name: 'Boutique Row',
      type: 'shopping',
      coordinates: [lat + 0.001, lng + 0.004],
      rating: 4.6,
      distance: '0.4 mi',
      description: 'Collection of boutique shops and cafes'
    },
    
    // Schools
    {
      id: 'school1',
      name: 'Lincoln Elementary',
      type: 'school',
      coordinates: [lat + 0.005, lng - 0.003],
      rating: 4.8,
      distance: '0.6 mi',
      description: 'Highly-rated public elementary school'
    },
    {
      id: 'school2',
      name: 'Central High School',
      type: 'school',
      coordinates: [lat - 0.003, lng + 0.005],
      rating: 4.4,
      distance: '0.7 mi',
      description: 'Public high school with strong academic programs'
    },
    
    // Transportation
    {
      id: 'trans1',
      name: 'Central Station',
      type: 'transportation',
      coordinates: [lat + 0.006, lng + 0.001],
      rating: 4.2,
      distance: '0.7 mi',
      description: 'Main transit hub with bus and train connections'
    },
    {
      id: 'trans2',
      name: 'Park & Ride',
      type: 'transportation',
      coordinates: [lat - 0.004, lng - 0.002],
      rating: 4.0,
      distance: '0.5 mi',
      description: 'Free parking with shuttle service to downtown'
    },
    
    // Parks
    {
      id: 'park1',
      name: 'Riverside Park',
      type: 'park',
      coordinates: [lat + 0.003, lng + 0.006],
      rating: 4.9,
      distance: '0.7 mi',
      description: 'Beautiful riverside park with walking trails'
    },
    {
      id: 'park2',
      name: 'Community Gardens',
      type: 'park',
      coordinates: [lat - 0.001, lng + 0.007],
      rating: 4.5,
      distance: '0.8 mi',
      description: 'Community gardens and picnic areas'
    },
    
    // Healthcare
    {
      id: 'health1',
      name: 'Medical Center',
      type: 'healthcare',
      coordinates: [lat + 0.007, lng - 0.001],
      rating: 4.6,
      distance: '0.8 mi',
      description: 'Full-service medical center with urgent care'
    }
  ];
};

const amenityIcons: Record<string, React.ReactNode> = {
  restaurant: <Utensils className="w-4 h-4" />,
  shopping: <ShoppingBag className="w-4 h-4" />,
  school: <GraduationCap className="w-4 h-4" />,
  transportation: <Bus className="w-4 h-4" />,
  park: <TreePine className="w-4 h-4" />,
  healthcare: <Building2 className="w-4 h-4" />
};

const amenityColors: Record<string, string> = {
  restaurant: 'bg-orange-500',
  shopping: 'bg-blue-500',
  school: 'bg-green-500',
  transportation: 'bg-purple-500',
  park: 'bg-emerald-500',
  healthcare: 'bg-red-500'
};

export function PropertyAmenitiesMap({ 
  propertyName, 
  propertyCoordinates, 
  className = "" 
}: PropertyAmenitiesMapProps) {
  const [amenities] = useState<Amenity[]>(() => generateNearbyAmenities(propertyCoordinates));
  const [filteredAmenities, setFilteredAmenities] = useState<Amenity[]>(amenities);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set([
    'restaurant', 'shopping', 'school', 'transportation', 'park', 'healthcare'
  ]));
  const [showFilters, setShowFilters] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const filtered = amenities.filter(amenity => activeFilters.has(amenity.type));
    setFilteredAmenities(filtered);
  }, [activeFilters, amenities]);

  const toggleFilter = (type: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setActiveFilters(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters(new Set());
  };

  const selectAllFilters = () => {
    setActiveFilters(new Set(['restaurant', 'shopping', 'school', 'transportation', 'park', 'healthcare']));
  };

  const getAmenityTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      restaurant: 'Restaurants',
      shopping: 'Shopping',
      school: 'Schools',
      transportation: 'Transportation',
      park: 'Parks & Recreation',
      healthcare: 'Healthcare'
    };
    return labels[type] || type;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Nearby Amenities
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Prime location with easy access to restaurants, shopping, schools, and more
        </p>
      </CardHeader>
      
      <CardContent>
        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Filter Amenities</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllFilters}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear All
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(amenityIcons).map(([type, icon]) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={activeFilters.has(type)}
                    onCheckedChange={() => toggleFilter(type)}
                  />
                  <Label htmlFor={type} className="flex items-center gap-2 text-sm cursor-pointer">
                    <div className={`p-1 rounded ${amenityColors[type]} text-white`}>
                      {icon}
                    </div>
                    {getAmenityTypeLabel(type)}
                  </Label>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500">
                Showing {filteredAmenities.length} of {amenities.length} nearby amenities
              </p>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="relative">
          <div className="map-container h-96 rounded-lg overflow-hidden border">
            <MapContainer
              center={propertyCoordinates}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Property Marker */}
              <Marker
                position={propertyCoordinates}
                icon={new Icon({
                  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                  iconSize: [32, 41],
                  iconAnchor: [16, 41],
                  popupAnchor: [1, -34],
                })}
              >
                <Popup>
                  <div className="min-w-48">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <h3 className="font-semibold text-sm">{propertyName}</h3>
                    </div>
                    <p className="text-xs text-gray-600">Your selected property</p>
                  </div>
                </Popup>
              </Marker>
              
              {/* Amenity Markers */}
              {filteredAmenities.map((amenity) => (
                <Marker
                  key={amenity.id}
                  position={amenity.coordinates}
                  icon={new Icon({
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    iconSize: [20, 32],
                    iconAnchor: [10, 32],
                    popupAnchor: [1, -34],
                  })}
                >
                  <Popup>
                    <div className="min-w-48">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1 rounded ${amenityColors[amenity.type]} text-white`}>
                          {amenityIcons[amenity.type]}
                        </div>
                        <h3 className="font-semibold text-sm">{amenity.name}</h3>
                      </div>
                      
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{amenity.distance}</span>
                        </div>
                        
                        {amenity.rating && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-yellow-600">★</span>
                            <span className="text-gray-700">{amenity.rating}/5</span>
                          </div>
                        )}
                        
                        {amenity.description && (
                          <p className="text-xs text-gray-600">{amenity.description}</p>
                        )}
                      </div>
                      
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${amenityColors[amenity.type]} text-white`}
                      >
                        {getAmenityTypeLabel(amenity.type)}
                      </Badge>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* Walking radius circle (0.5 mile) */}
              <Circle
                center={propertyCoordinates}
                radius={800} // 0.5 miles ≈ 800 meters
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.1,
                  weight: 2
                }}
              />
            </MapContainer>
          </div>
        </div>
        
        {/* Amenity Summary */}
        <div className="mt-4">
          <Separator className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(amenityIcons).map(([type, icon]) => {
              const count = amenities.filter(a => a.type === type).length;
              const isActive = activeFilters.has(type);
              return (
                <div
                  key={type}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    isActive 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  onClick={() => toggleFilter(type)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded ${amenityColors[type]} text-white`}>
                      {icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{getAmenityTypeLabel(type)}</p>
                      <p className="text-xs text-gray-600">{count} nearby</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Click on amenity markers for details • Blue circle shows 0.5 mile walking radius
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
