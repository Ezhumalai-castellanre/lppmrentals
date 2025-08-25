import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
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
const GOOGLE_MAPS_JS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyA4xghdRPy2jN6K2oCw_BccNsXqrgPdL-E';
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || GOOGLE_MAPS_JS_API_KEY || 'AIzaSyA4xghdRPy2jN6K2oCw_BccNsXqrgPdL-E';

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
      resolve();
      return;
    }
    const existing = document.getElementById('google-maps-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
}

// Simple mapping to Places API includedTypes
const typeToPlacesType: Record<string, string> = {
  restaurant: 'restaurant',
  shopping: 'shopping_mall',
  school: 'school',
  transportation: 'transit_station',
  park: 'park',
  healthcare: 'hospital'
};

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

// Helper to compute distance string and haversine distance
const metersToMiles = (m: number) => `${(m / 1609.34).toFixed(1)} mi`;
const toRad = (deg: number) => (deg * Math.PI) / 180;
function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

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

const amenityHexColors: Record<string, string> = {
  restaurant: '#f97316', // orange-500
  shopping: '#3b82f6',   // blue-500
  school: '#22c55e',     // green-500
  transportation: '#a855f7', // purple-500
  park: '#10b981',       // emerald-500
  healthcare: '#ef4444'  // red-500
};

export function PropertyAmenitiesMap({ 
  propertyName, 
  propertyCoordinates, 
  className = "" 
}: PropertyAmenitiesMapProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [filteredAmenities, setFilteredAmenities] = useState<Amenity[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set([
    'restaurant', 'shopping', 'school', 'transportation', 'park', 'healthcare'
  ]));
  const [showFilters, setShowFilters] = useState(false);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersByTypeRef = useRef<Record<string, any[]>>({});
  const geocodeCacheRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  async function geocodePropertyName(propertyName: string, unitName?: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const key = unitName ? `${propertyName}|${unitName}` : propertyName;
      if (geocodeCacheRef.current.has(key)) {
        return geocodeCacheRef.current.get(key)!;
      }
      const google = (window as any).google;
      if (google?.maps?.places) {
        const query = unitName ? `${propertyName} ${unitName}, New York, NY` : `${propertyName}, New York, NY`;
        const coord = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
          const svc = new google.maps.places.PlacesService(document.createElement('div'));
          svc.findPlaceFromQuery({ query, fields: ['geometry'] }, (results: any, status: any) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]?.geometry?.location) {
              const loc = results[0].geometry.location;
              resolve({ lat: loc.lat(), lng: loc.lng() });
            } else {
              resolve(null);
            }
          });
        });
        if (coord) {
          geocodeCacheRef.current.set(key, coord);
          return coord;
        }
      }
      // REST fallback
      try {
        const textQuery = unitName ? `${propertyName} ${unitName}, New York, NY` : `${propertyName}, New York, NY`;
        const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.location',
          },
          body: JSON.stringify({ textQuery }),
        });
        const data = await resp.json();
        const loc = data?.places?.[0]?.location;
        if (loc?.latitude && loc?.longitude) {
          const coord = { lat: loc.latitude, lng: loc.longitude };
          geocodeCacheRef.current.set(key, coord);
          return coord;
        }
      } catch {}
    } catch (e) {
      // ignore
    }
    return null;
  }

  useEffect(() => {
    const filtered = amenities.filter(amenity => activeFilters.has(amenity.type));
    setFilteredAmenities(filtered);
  }, [activeFilters, amenities]);

  // Initialize Google Map
  useEffect(() => {
    let isMounted = true;
    (async () => {
      let lat = propertyCoordinates[0];
      let lng = propertyCoordinates[1];
      const geo = await geocodePropertyName(propertyName);
      if (geo) { lat = geo.lat; lng = geo.lng; }
      await loadGoogleMapsScript(GOOGLE_MAPS_JS_API_KEY);
      if (!isMounted || !mapDivRef.current) return;
      const google = (window as any).google;
      const map = new google.maps.Map(mapDivRef.current, {
        center: { lat, lng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapRef.current = map;
      new google.maps.Marker({ position: { lat, lng }, map, title: propertyName });
      new google.maps.Circle({
        center: { lat, lng },
        radius: 800,
        map,
        strokeColor: '#3b82f6',
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
      });
      // After centering map, fetch places immediately
      refreshPlaces();
    })();
    return () => { isMounted = false };
  }, [propertyCoordinates, propertyName]);

  // Fetch places for active filters
  const refreshPlaces = async () => {
    if (!mapRef.current) return;
    const google = (window as any).google;
    const center = mapRef.current.getCenter();
    const reqBase = {
      locationRestriction: {
        circle: {
          center: { latitude: center.lat(), longitude: center.lng() },
          radius: 800.0,
        },
      },
      maxResultCount: 10,
    } as any;

    // Clear existing markers
    Object.values(markersByTypeRef.current).forEach(arr => arr.forEach(m => m.setMap(null)));
    markersByTypeRef.current = {};

    const results: Amenity[] = [];
    for (const type of Array.from(activeFilters)) {
      const includedType = typeToPlacesType[type];
      if (!includedType) continue;
      const body = { ...reqBase, includedTypes: [includedType] };
      try {
        const resp = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.location,places.rating',
          },
          body: JSON.stringify(body),
        });
        const data = await resp.json();
        const markers: any[] = [];
        if (data?.places?.length) {
          data.places.forEach((p: any, idx: number) => {
            const pos = p.location ? { lat: p.location.latitude, lng: p.location.longitude } : null;
            if (!pos) return;
            const marker = new google.maps.Marker({
              position: pos,
              map: mapRef.current,
              title: p.displayName?.text || 'Place',
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: amenityHexColors[type],
                fillOpacity: 0.9,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 6,
              },
            });
            const center = mapRef.current.getCenter();
            const distanceMeters = haversineMeters({ lat: center.lat(), lng: center.lng() }, pos);
            const distance = metersToMiles(distanceMeters);
            const rating = p.rating;
            const info = new google.maps.InfoWindow({
              content: `<div style="min-width:180px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                  <span>${(amenityIcons as any)[type]?.props?.children || ''}</span>
                  <strong style="font-size:12px;">${p.displayName?.text || 'Place'}</strong>
                </div>
                ${distance ? `<div style=\"font-size:11px;color:#4b5563\">📍 ${distance}</div>` : ''}
                ${rating ? `<div style=\"font-size:11px;color:#4b5563\">★ ${rating}</div>` : ''}
                <div style="margin-top:6px;"><span style="background:${amenityHexColors[type]};color:white;padding:2px 6px;border-radius:8px;font-size:10px;">${getAmenityTypeLabel(type)}</span></div>
              </div>`
            });
            marker.addListener('click', () => info.open({ anchor: marker, map: mapRef.current }));
            markers.push(marker);
            results.push({
              id: `${type}-${idx}`,
              name: p.displayName?.text || 'Place',
              type: type as any,
              coordinates: [pos.lat, pos.lng],
              rating,
              distance,
            });
          });
        }
        markersByTypeRef.current[type] = markers;
      } catch (e) {
        // ignore errors silently
      }
    }
    setAmenities(results);
  };

  const toggleFilter = (type: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setActiveFilters(newFilters);
    // Refresh places after toggling
    setTimeout(() => refreshPlaces(), 0);
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

        {/* Map Container - Google Maps */}
        <div className="relative">
          <div ref={mapDivRef} className="h-96 rounded-lg overflow-hidden border" />
        </div>
        
        {/* Amenity Summary */}
        <div className="mt-4">
          <Separator className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(amenityIcons).map(([type, icon]) => {
              const count = filteredAmenities.filter(a => a.type === type).length;
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
