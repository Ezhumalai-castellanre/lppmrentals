import React, { useState } from 'react';
import { UnitItem } from '../lib/monday-api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { MapPin, DollarSign, Image, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface UnitDetailModalProps {
  unit: UnitItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (unit: UnitItem) => void;
}

export function UnitDetailModal({ unit, isOpen, onClose, onApply }: UnitDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!unit) return null;

  const formatRent = (rent: string | number) => {
    if (!rent) return 'Contact for pricing';
    const num = typeof rent === 'string' ? parseFloat(rent) : rent;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const nextImage = () => {
    if (unit.images && unit.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % unit.images!.length);
    }
  };

  const prevImage = () => {
    if (unit.images && unit.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + unit.images!.length) % unit.images!.length);
    }
  };

  const handleApply = () => {
    console.log('Modal Apply Now clicked for unit:', unit.name);
    onApply(unit);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{unit.name}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Image Gallery */}
          {unit.images && unit.images.length > 0 && (
            <div className="relative">
              <div className="relative h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={unit.images[currentImageIndex].url}
                  alt={unit.images[currentImageIndex].name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100">
                  <Image className="h-16 w-16 text-gray-400" />
                </div>
                
                {/* Navigation arrows */}
                {unit.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                
                {/* Image counter */}
                {unit.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {currentImageIndex + 1} / {unit.images.length}
                  </div>
                )}
              </div>
              
              {/* Thumbnail navigation */}
              {unit.images.length > 1 && (
                <div className="flex space-x-2 mt-4 overflow-x-auto">
                  {unit.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                        index === currentImageIndex ? 'border-blue-500' : 'border-gray-300'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unit Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{unit.propertyName}</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 rounded-full mr-1 bg-green-500"></div>
                Available Now
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Unit Type</h3>
                <p className="text-gray-600">{unit.unitType}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Monthly Rent</h3>
                <p className="text-green-600 font-semibold text-lg">
                  {unit.monthlyRent && unit.monthlyRent.toString().trim() !== '' 
                    ? `$${unit.monthlyRent}` 
                    : 'Contact for pricing'
                  }
                </p>
              </div>
            </div>

            {/* Amenities Section */}
            {unit.amenities && unit.amenities.trim() !== '' ? (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Property Description</h3>
                <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                  {unit.amenities}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Property Description</h3>
                <p className="text-gray-500 italic">Property description not available</p>
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t">
              <Button
                onClick={handleApply}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Apply Now
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                size="lg"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
