import React, { useEffect, useState } from 'react';
import { MondayForm } from '../components/monday-form';
import { RentalItem } from '../lib/monday-api';

export default function MondayApplicationPage() {
  const [selectedRental, setSelectedRental] = useState<RentalItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get rental information from sessionStorage
    const rentalData = sessionStorage.getItem('selectedRental');
    
    if (rentalData) {
      try {
        const rental = JSON.parse(rentalData);
        setSelectedRental(rental);
      } catch (error) {
        console.error('Error parsing rental data:', error);
      }
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (!selectedRental) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Rental Selected</h2>
          <p className="text-gray-600 mb-4">Please select a rental property to apply for.</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <MondayForm 
      propertyName={selectedRental.propertyName}
      unitNumber={selectedRental.name}
    />
  );
}
