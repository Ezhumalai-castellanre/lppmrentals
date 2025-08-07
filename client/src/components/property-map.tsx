import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { RentalItem } from '@/lib/monday-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, DollarSign, Eye, Send } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    // Force map re-render when rentals change
    setMapKey(prev => prev + 1);
  }, [rentals]);

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

  // Calculate center point from all properties
  const coordinates = rentals.map(rental => getPropertyCoordinates(rental.propertyName));
  const centerLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
  const centerLng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;

  return (
    <Card className="w-full">
              <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Liberty Place Property Management - Interactive Map
          </CardTitle>
        </CardHeader>
      <CardContent>
        <div className="map-container">
          <MapContainer
            key={mapKey}
            center={[centerLat, centerLng]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
            
            {rentals.map((rental) => {
              const coordinates = getPropertyCoordinates(rental.propertyName);
              return (
                <Marker
                  key={rental.id}
                  position={coordinates}
                  icon={new Icon({
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                  })}
                >
                  <Popup>
                    <div className="min-w-64">
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-sm">{rental.name || 'Unit not specified'}</h3>
                      </div>
                      
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{rental.propertyName || 'Address not available'}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <DollarSign className="w-3 h-3" />
                          <span>{rental.monthlyRent || 'Contact for pricing'}</span>
                        </div>
                        
                        <Badge 
                          variant="secondary"
                          className="text-xs bg-green-100 text-green-800"
                        >
                          Available Now
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDetails(rental)}
                          className="flex-1 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onApplyNow(rental)}
                          className="flex-1 text-xs"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
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
