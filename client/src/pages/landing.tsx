import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MondayApiService, UnitItem } from '@/lib/monday-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Home, MapPin, DollarSign, Users, Image, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { UnitDetailModal } from '@/components/unit-detail-modal';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [buildings, setBuildings] = useState<string[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const unitsData = await MondayApiService.fetchVacantUnits();
      setUnits(unitsData);
      
      // Get unique building addresses
      const buildingAddresses = MondayApiService.getUniqueBuildingAddresses(unitsData);
      setBuildings(buildingAddresses);
      
      console.log('Fetched units:', unitsData);
      console.log('Buildings:', buildingAddresses);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast({
        title: "Error",
        description: "Failed to load available units. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnitClick = (unit: UnitItem) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  const handleApplyFromModal = (unit: UnitItem) => {
    // Store unit info in sessionStorage for the application process
    sessionStorage.setItem('selectedUnit', JSON.stringify(unit));
    console.log('Redirecting to login page for unit:', unit.name);
    
    // Debug: Log current location
    console.log('Current location before redirect:', window.location.pathname);
    
    // Try multiple approaches to ensure redirect works
    try {
      // First try wouter navigation
      console.log('Attempting wouter navigation...');
      setLocation('/login');
      console.log('Wouter navigation called successfully');
    } catch (error) {
      console.log('Wouter navigation failed, trying direct navigation:', error);
      // Fallback to direct navigation
      window.location.href = '/login';
    }
  };

  const filteredUnits = selectedBuilding === 'all' 
    ? units 
    : MondayApiService.getUnitsByBuilding(units, selectedBuilding);

  const formatRent = (rent: string | number) => {
    if (!rent) return 'Contact for pricing';
    const num = typeof rent === 'string' ? parseFloat(rent) : rent;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading available units...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Home className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Available Rentals</h1>
                <p className="text-gray-600">Find your perfect home</p>
              </div>
            </div>
            <Button
              onClick={() => {
                try {
                  setLocation('/login');
                } catch (error) {
                  window.location.href = '/login';
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Apply Now
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      {buildings.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter by building:</span>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by building"
            >
              <option value="all">All Buildings</option>
              {buildings.map((building) => (
                <option key={building} value={building}>
                  {building}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Units Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredUnits.length === 0 ? (
          <div className="text-center py-12">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No units available</h3>
            <p className="text-gray-600">Check back later for new listings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUnits.map((unit) => (
              <Card
                key={unit.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-0 shadow-md bg-white overflow-hidden"
                onClick={() => handleUnitClick(unit)}
              >
                {/* Unit Image */}
                {unit.images && unit.images.length > 0 ? (
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={unit.images[0].url}
                      alt={unit.images[0].name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100">
                      <Image className="h-12 w-12 text-gray-400" />
                    </div>
                    {unit.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        +{unit.images.length - 1} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <Image className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {unit.name}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                        {unit.propertyName}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={unit.status === 'Vacant' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {unit.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium text-gray-900">{unit.unitType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Monthly Rent:</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatRent(unit.monthlyRent)}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex space-x-2">
                      <Button 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Apply Now button clicked for unit:', unit.name);
                          handleApplyFromModal(unit);
                        }}
                      >
                        Apply Now
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnitClick(unit);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to apply?
            </h3>
            <p className="text-gray-600 mb-4">
              Click on any unit above to start your application process.
            </p>
            <Button
              onClick={() => {
                try {
                  setLocation('/login');
                } catch (error) {
                  window.location.href = '/login';
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Unit Detail Modal */}
      <UnitDetailModal
        unit={selectedUnit}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={handleApplyFromModal}
      />
    </div>
  );
}
