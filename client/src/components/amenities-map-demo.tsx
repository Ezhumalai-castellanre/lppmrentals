import React from 'react';
import { PropertyAmenitiesMap } from './property-amenities-map';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function AmenitiesMapDemo() {
  // Sample coordinates for demo purposes
  const demoCoordinates: [number, number] = [40.7589, -73.9851]; // Manhattan area
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gray-900">
            🗺️ Amenities Map Demo
          </CardTitle>
          <p className="text-center text-gray-600 text-lg">
            Interactive map showing nearby restaurants, shopping, schools, and more
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium">Restaurants</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Shopping</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Schools</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium">Transportation</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm font-medium">Parks</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Healthcare</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>• Click on the Filters button to show/hide different amenity types</p>
              <p>• Click on amenity markers for detailed information</p>
              <p>• Blue circle shows 0.5 mile walking radius</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <PropertyAmenitiesMap
        propertyName="Demo Property"
        propertyCoordinates={demoCoordinates}
      />
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Interactive Map</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Real-time filtering by amenity type</li>
                <li>• Clickable markers with detailed information</li>
                <li>• Walking distance radius visualization</li>
                <li>• Responsive design for all devices</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Amenity Categories</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 🍽️ Restaurants & Dining</li>
                <li>• 🛍️ Shopping & Retail</li>
                <li>• 🎓 Schools & Education</li>
                <li>• 🚌 Transportation & Transit</li>
                <li>• 🌳 Parks & Recreation</li>
                <li>• 🏥 Healthcare & Medical</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
