

export type UnitItem = {
  id: string;
  name: string; // Apartment Name
  propertyName: string; // Building Address
  unitType: string; // Apartment Type
  status: string; // Status (Vacant, etc.)
  monthlyRent?: number; // Monthly Rent (column ID: numeric_mksz7rkz)
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

  static getUniqueBuildingAddresses(units: UnitItem[]): string[] {
    return Array.from(new Set(units.map(unit => unit.propertyName))).filter(Boolean);
  }

  static getUnitsByBuilding(units: UnitItem[], buildingAddress: string): UnitItem[] {
    return units.filter(unit => unit.propertyName === buildingAddress);
  }
}