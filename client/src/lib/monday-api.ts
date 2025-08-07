

export type UnitImage = {
  id: string;
  name?: string;
  url: string;
  text?: string;
};

export type VacantSubitem = {
  id: string;
  name: string;
  status: string;
  applicantType: string;
};

export type MediaFile = {
  id: string;
  name: string;
  url: string;
  type: string;
  isVideo: boolean;
};

export type RentalItem = {
  id: string;
  name: string; // Apartment Name
  propertyName: string; // Building Address
  unitType: string; // Apartment Type
  status: string; // Status (Vacant, etc.)
  monthlyRent?: string; // Monthly Rent
  amenities?: string; // Amenities from long_text_mktjp2nj column
  mediaFiles?: MediaFile[]; // Media files from subitems
};

export type UnitItem = {
  id: string;
  name: string; // Apartment Name
  propertyName: string; // Building Address
  unitType: string; // Apartment Type
  status: string; // Status (Vacant, etc.)
  monthlyRent?: number; // Monthly Rent (column ID: numeric_mksz7rkz)
  images?: UnitImage[]; // Images from ink_mktj22y9 column
  amenities?: string; // Amenities from long_text_mktjp2nj column
  vacantSubitems?: VacantSubitem[]; // Subitems filtered by vacant status
};

export class MondayApiService {
  static async fetchVacantUnits(): Promise<UnitItem[]> {
    try {
      const response = await fetch('/api/monday/units', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API response from /api/monday/units:', result);
      return result.units || [];
    } catch (error) {
      console.error('Error fetching vacant units:', error);
      return [];
    }
  }

  // New method to fetch vacant units with enhanced filtering and subitems
  static async fetchVacantUnitsWithSubitems(): Promise<UnitItem[]> {
    try {
      const response = await fetch('/api/monday/vacant-units', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API response from /api/monday/vacant-units:', result);
      return result.units || [];
    } catch (error) {
      console.error('Error fetching vacant units with subitems:', error);
      return [];
    }
  }

  // Method to fetch available rentals with media files
  static async fetchAvailableRentals(): Promise<RentalItem[]> {
    try {
      const response = await fetch('/api/monday/available-rentals', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API response from /api/monday/available-rentals:', result);
      return result.rentals || [];
    } catch (error) {
      console.error('Error fetching available rentals:', error);
      return [];
    }
  }

  static getUniqueBuildingAddresses(units: UnitItem[]): string[] {
    return Array.from(new Set(units.map(unit => unit.propertyName))).filter(Boolean);
  }

  static getUnitsByBuilding(units: UnitItem[], buildingAddress: string): UnitItem[] {
    return units.filter(unit => unit.propertyName === buildingAddress);
  }

  // Helper method to get all vacant subitems across all units
  static getAllVacantSubitems(units: UnitItem[]): VacantSubitem[] {
    return units.flatMap(unit => unit.vacantSubitems || []);
  }

  // Helper method to get units with images
  static getUnitsWithImages(units: UnitItem[]): UnitItem[] {
    return units.filter(unit => unit.images && unit.images.length > 0);
  }

  // Helper method to get units with amenities
  static getUnitsWithAmenities(units: UnitItem[]): UnitItem[] {
    return units.filter(unit => unit.amenities && unit.amenities.trim() !== '');
  }

  // Helper methods for rental items
  static getRentalsWithMedia(rentals: RentalItem[]): RentalItem[] {
    return rentals.filter(rental => rental.mediaFiles && rental.mediaFiles.length > 0);
  }

  static getRentalsWithAmenities(rentals: RentalItem[]): RentalItem[] {
    return rentals.filter(rental => rental.amenities && rental.amenities.trim() !== '');
  }

  static getRentalsByProperty(rentals: RentalItem[], propertyName: string): RentalItem[] {
    return rentals.filter(rental => rental.propertyName === propertyName);
  }

  static getUniquePropertyNames(rentals: RentalItem[]): string[] {
    return Array.from(new Set(rentals.map(rental => rental.propertyName))).filter(Boolean);
  }
}