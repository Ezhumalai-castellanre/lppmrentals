import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/card';

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

interface PropertyAmenitiesMapProps {
  propertyName: string;
  propertyCoordinates: [number, number];
  className?: string;
}

export function PropertyAmenitiesMap({ 
  propertyName, 
  propertyCoordinates, 
  className = "" 
}: PropertyAmenitiesMapProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
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
      
      // Only add the property location marker
      new google.maps.Marker({ 
        position: { lat, lng }, 
        map, 
        title: propertyName,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#3b82f6',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8,
        }
      });
      
      // Add a circle around the property location
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
    })();
    return () => { isMounted = false };
  }, [propertyCoordinates, propertyName]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
        </div>
        <p className="text-sm text-gray-600">
          Property Location
        </p>
      </CardHeader>
      
      <CardContent>
        {/* Map Container - Google Maps */}
        <div className="relative">
          <div ref={mapDivRef} className="h-96 rounded-lg overflow-hidden border" />
        </div>
      </CardContent>
    </Card>
  )
}
