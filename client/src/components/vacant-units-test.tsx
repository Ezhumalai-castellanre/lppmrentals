import React, { useState, useEffect } from 'react';
import { MondayApiService, UnitItem } from '../lib/monday-api';

export default function VacantUnitsTest() {
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVacantUnits = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const vacantUnits = await MondayApiService.fetchVacantUnitsWithSubitems();
      setUnits(vacantUnits);
      console.log('Fetched vacant units:', vacantUnits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch units');
      console.error('Error fetching vacant units:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacantUnits();
  }, []);

  const getUnitsWithImages = () => MondayApiService.getUnitsWithImages(units);
  const getUnitsWithAmenities = () => MondayApiService.getUnitsWithAmenities(units);
  const getAllVacantSubitems = () => MondayApiService.getAllVacantSubitems(units);

  if (loading) {
    return <div className="p-4">Loading vacant units...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={fetchVacantUnits}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Vacant Units Test</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-100 p-3 rounded">
            <div className="font-semibold">Total Units</div>
            <div>{units.length}</div>
          </div>
          <div className="bg-green-100 p-3 rounded">
            <div className="font-semibold">With Images</div>
            <div>{getUnitsWithImages().length}</div>
          </div>
          <div className="bg-yellow-100 p-3 rounded">
            <div className="font-semibold">With Amenities</div>
            <div>{getUnitsWithAmenities().length}</div>
          </div>
          <div className="bg-purple-100 p-3 rounded">
            <div className="font-semibold">Vacant Subitems</div>
            <div>{getAllVacantSubitems().length}</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">All Vacant Units</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <div key={unit.id} className="border rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-lg mb-2">{unit.name}</h3>
              <div className="space-y-1 text-sm">
                <div><strong>Property:</strong> {unit.propertyName}</div>
                <div><strong>Type:</strong> {unit.unitType}</div>
                <div><strong>Status:</strong> Available Now</div>
                <div><strong>Rent:</strong> {unit.monthlyRent}</div>
                
                {unit.amenities && (
                  <div>
                    <strong>Amenities:</strong>
                    <div className="text-xs text-gray-600 mt-1">{unit.amenities}</div>
                  </div>
                )}
                
                {unit.images && unit.images.length > 0 && (
                  <div>
                    <strong>Images:</strong>
                    <div className="flex gap-2 mt-1">
                      {unit.images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img.url} 
                          alt={img.name || `Image ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {unit.vacantSubitems && unit.vacantSubitems.length > 0 && (
                  <div>
                    <strong>Vacant Subitems:</strong>
                    <div className="text-xs text-gray-600 mt-1">
                      {unit.vacantSubitems.map((subitem, idx) => (
                        <div key={subitem.id} className="mb-1">
                          • {subitem.name} ({subitem.applicantType}) - {subitem.status}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">All Vacant Subitems</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getAllVacantSubitems().map((subitem) => (
            <div key={subitem.id} className="border rounded-lg p-3 bg-gray-50">
              <div className="font-semibold">{subitem.name}</div>
              <div className="text-sm text-gray-600">
                <div>Type: {subitem.applicantType}</div>
                <div>Status: {subitem.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}
