import React, { useEffect, useRef, useState } from 'react';
import { RentalItem } from '../lib/monday-api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Home, MapPin, DollarSign, Eye, Send } from 'lucide-react';

const GOOGLE_MAPS_JS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyA4xghdRPy2jN6K2oCw_BccNsXqrgPdL-E';
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || GOOGLE_MAPS_JS_API_KEY;

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

interface PropertyMapProps {
  rentals: RentalItem[];
  onViewDetails: (rental: RentalItem) => void;
  onApplyNow: (rental: RentalItem) => void;
}

// Sample coordinates for properties (you can replace with real coordinates)
const getPropertyCoordinates = (propertyName: string): [number, number] => {
  const coordinates: Record<string, [number, number]> = {
    // Common property names with realistic coordinates
    '123 Main Street': [40.7589, -73.9851], // Manhattan
    '456 Park Avenue': [40.7505, -73.9934], // Manhattan
    '789 Broadway': [40.7484, -73.9857], // Manhattan
    '321 5th Avenue': [40.7505, -73.9934], // Manhattan
    '654 Madison Avenue': [40.7589, -73.9851], // Manhattan
    '987 Lexington Avenue': [40.7589, -73.9851], // Manhattan
    '147 West 42nd Street': [40.7562, -73.9872], // Times Square area
    '258 East 34th Street': [40.7484, -73.9857], // Midtown
    '369 West 57th Street': [40.7648, -73.9808], // Upper West Side
    '741 East 86th Street': [40.7789, -73.9522], // Upper East Side
    '852 West 110th Street': [40.8015, -73.9644], // Morningside Heights
    '963 East 72nd Street': [40.7687, -73.9588], // Upper East Side
    '159 West 81st Street': [40.7812, -73.9712], // Upper West Side
    '357 East 88th Street': [40.7789, -73.9522], // Upper East Side
    '468 West 95th Street': [40.7942, -73.9707], // Upper West Side
    '579 East 67th Street': [40.7648, -73.9588], // Upper East Side
    '680 West 103rd Street': [40.8015, -73.9644], // Morningside Heights
    '791 East 79th Street': [40.7687, -73.9588], // Upper East Side
    '802 West 89th Street': [40.7812, -73.9712], // Upper West Side
    '913 East 91st Street': [40.7789, -73.9522], // Upper East Side
  };
  
  // Generate coordinates based on property name hash for consistent mapping
  const hash = propertyName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const lat = 40.7589 + (hash % 100) * 0.001; // Small variation in latitude
  const lng = -73.9851 + (hash % 100) * 0.001; // Small variation in longitude
  
  return coordinates[propertyName] || [lat, lng];
};

export function PropertyMap({ rentals, onViewDetails, onApplyNow }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const nearbyMarkersRef = useRef<any[]>([]);
  const geocodeCacheRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  async function geocodeRental(r: { propertyName: string; name?: string }): Promise<{ lat: number; lng: number } | null> {
    try {
      const key = `${r.propertyName}|${r.name || ''}`;
      if (geocodeCacheRef.current.has(key)) {
        return geocodeCacheRef.current.get(key)!;
      }
      // Prefer JS PlacesService
      const google = (window as any).google;
      if (google?.maps?.places) {
        const query = r.name ? `${r.propertyName} ${String(r.name)}, New York, NY` : `${r.propertyName}, New York, NY`;
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
      // Fallback REST v1
      try {
        const unitText = r.name ? String(r.name) : '';
        const textQuery = unitText
          ? `${r.propertyName} ${unitText}, New York, NY`
          : `${r.propertyName}, New York, NY`;
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
      // ignore geocode failure; will fallback
    }
    return null;
  }

  useEffect(() => {
    let isMounted = true;
    if (!rentals || rentals.length === 0) return;

    (async () => {
      await loadGoogleMapsScript(GOOGLE_MAPS_JS_API_KEY);
      // Resolve real coordinates where possible
      const coordsList: { rental: typeof rentals[number]; lat: number; lng: number }[] = [];
      for (const r of rentals) {
        const geo = await geocodeRental({ propertyName: r.propertyName, name: r.name });
        if (geo) {
          coordsList.push({ rental: r, lat: geo.lat, lng: geo.lng });
        } else {
          const [lat, lng] = getPropertyCoordinates(r.propertyName);
          coordsList.push({ rental: r, lat, lng });
        }
      }
      const centerLat = coordsList.reduce((sum, c) => sum + c.lat, 0) / coordsList.length;
      const centerLng = coordsList.reduce((sum, c) => sum + c.lng, 0) / coordsList.length;
      if (!isMounted || !mapRef.current) return;
      const google = (window as any).google;
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;

      // Clear old markers
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      // Add markers using resolved coords
      coordsList.forEach(({ rental, lat, lng }) => {
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: rental.name,
        });
        const content = `
            <div style="min-width: 240px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <span style="color:#2563eb;display:flex;align-items:center;">🏠</span>
                <h3 style="font-weight:600;font-size:13px;margin:0">${rental.name}</h3>
              </div>
              <div style="margin-bottom:8px;font-size:12px;color:#4b5563;">
                <div style="display:flex;align-items:center;gap:4px;"><span>📍</span><span>${rental.propertyName}</span></div>
                <div style="display:flex;align-items:center;gap:4px;">
                  <span>💵</span>
                  <span>${rental.monthlyRent && rental.monthlyRent.toString().trim() !== '' ? rental.monthlyRent : 'Contact for pricing'}</span>
                </div>
                <div>
                  <span style="display:inline-flex;align-items:center;gap:4px;background:#dcfce7;color:#166534;font-size:11px;padding:2px 6px;border-radius:8px;">● Available Now</span>
                </div>
              </div>
              <div style="display:flex;gap:8px;">
                <button data-action="details" style="flex:1;border:1px solid #e5e7eb;border-radius:6px;padding:6px 8px;background:#fff;cursor:pointer;font-size:12px;">Details</button>
                <button data-action="apply" style="flex:1;border:0;border-radius:6px;padding:6px 8px;background:#06b6d4;color:#fff;cursor:pointer;font-size:12px;">Apply</button>
              </div>
            </div>
          `;
        const info = new google.maps.InfoWindow({ content });
        marker.addListener('click', () => info.open({ anchor: marker, map }));
        // Delegate button clicks inside infowindow
        google.maps.event.addListener(info, 'domready', () => {
          const container = document.querySelector('.gm-style-iw')?.parentElement?.parentElement;
          if (!container) return;
          const detailsBtn = container.querySelector('button[data-action="details"]') as HTMLButtonElement | null;
          const applyBtn = container.querySelector('button[data-action="apply"]') as HTMLButtonElement | null;
          if (detailsBtn) detailsBtn.onclick = () => onViewDetails(rental);
          if (applyBtn) applyBtn.onclick = () => onApplyNow(rental);
        });
        markersRef.current.push(marker);
      });

      setLoadingMap(false);
    })().catch(() => setLoadingMap(false));

    return () => { isMounted = false };
  }, [rentals, onViewDetails, onApplyNow]);

  const fetchNearbyRestaurants = async () => {
    if (!mapInstanceRef.current) return;
    setNearbyLoading(true);
    // Clear existing nearby markers
    nearbyMarkersRef.current.forEach(m => m.setMap(null));
    nearbyMarkersRef.current = [];
    try {
      const center = mapInstanceRef.current.getCenter();
      const lat = center.lat();
      const lng = center.lng();
      const body = {
        includedTypes: ["restaurant"],
        maxResultCount: 10,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 500.0,
          },
        },
      };
      const resp = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.location',
        },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      const google = (window as any).google;
      if (data?.places?.length) {
        data.places.forEach((p: any) => {
          const pos = p.location ? { lat: p.location.latitude, lng: p.location.longitude } : null;
          if (!pos) return;
          const m = new google.maps.Marker({
            position: pos,
            map: mapInstanceRef.current,
            title: p.displayName?.text || 'Place',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#ef4444',
              fillOpacity: 0.9,
              strokeColor: '#b91c1c',
              strokeWeight: 1,
              scale: 6,
            },
          });
          const info = new google.maps.InfoWindow({ content: `<div style="font-size:12px;font-weight:600;">${p.displayName?.text || 'Place'}</div>` });
          m.addListener('click', () => info.open({ anchor: m, map: mapInstanceRef.current }));
          nearbyMarkersRef.current.push(m);
        });
      }
    } catch (e) {
      // Silent fail for now
    } finally {
      setNearbyLoading(false);
    }
  };

  const toggleNearby = async () => {
    const next = !showNearby;
    setShowNearby(next);
    if (next) {
      await fetchNearbyRestaurants();
    } else {
      // Clear
      nearbyMarkersRef.current.forEach(m => m.setMap(null));
      nearbyMarkersRef.current = [];
    }
  };

  if (!rentals || rentals.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Property Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No properties available to display on map</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
              <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Liberty Place Property Management - Interactive Map
          </CardTitle>
        </CardHeader>
      <CardContent>
        <div className="relative" style={{ height: 400, width: '100%' }}>
          <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
          {loadingMap && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm bg-white/60">
              Loading map...
                      </div>
          )}
          <div className="absolute top-3 right-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleNearby}>
              {showNearby ? 'Hide Nearby' : nearbyLoading ? 'Loading…' : 'Show Nearby Restaurants'}
                        </Button>
                      </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Click on markers to view property details and apply
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
