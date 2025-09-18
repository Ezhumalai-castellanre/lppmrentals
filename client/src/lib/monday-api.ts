

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
  // Enriched content for details page
  about?: string;
  apartmentFeatures?: string; // newline-separated
  buildingDetails?: string; // newline-separated
  neighborhood?: string; // newline-separated
  whyYoullLoveIt?: string; // newline-separated
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
  // Helper method to determine if we're in development
  private static isDevelopment(): boolean {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  // Helper method to get the appropriate endpoint
  private static getEndpoint(path: string): string {
    const isDev = this.isDevelopment();
    if (isDev) {
      return `/api/monday/${path}`;
    } else {
      // Map local endpoints to AWS Lambda functions via API Gateway
      const endpointMap: Record<string, string> = {
        'units': 'monday-units',
        'vacant-units': 'monday-vacant-units', 
        'available-rentals': 'monday-available-rentals'
      };
      const functionName = endpointMap[path] || path;
      return `https://9yo8506w4h.execute-api.us-east-1.amazonaws.com/prod/api/${functionName}`;
    }
  }

  static async fetchVacantUnits(): Promise<UnitItem[]> {
    try {
      const endpoint = this.getEndpoint('units');
      const response = await fetch(endpoint, {
        method: this.isDevelopment() ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`API response from ${endpoint}:`, result);
      return result.units || [];
    } catch (error) {
      console.error('Error fetching vacant units:', error);
      return [];
    }
  }

  // New method to fetch vacant units with enhanced filtering and subitems
  static async fetchVacantUnitsWithSubitems(): Promise<UnitItem[]> {
    try {
      const endpoint = this.getEndpoint('vacant-units');
      const response = await fetch(endpoint, {
        method: this.isDevelopment() ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`API response from ${endpoint}:`, result);
      return result.units || [];
    } catch (error) {
      console.error('Error fetching vacant units with subitems:', error);
      return [];
    }
  }

  // Method to fetch available rentals with media files
  static async fetchAvailableRentals(): Promise<RentalItem[]> {
    try {
      const response = await fetch('https://5sdpaqwf0f.execute-api.us-east-1.amazonaws.com/dev/getnyclisting', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "Stage": "Active"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API response from NYC listings endpoint:', result);
      
      // Handle the new API response structure
      let rentals: RentalItem[] = [];
      
      if (result.body) {
        try {
          // Parse the body if it's a JSON string
          const bodyData = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
          
          // Check if we have items array
          if (bodyData.items && Array.isArray(bodyData.items)) {
            rentals = bodyData.items.map((item: any) => {
              const id = item?.id?.S || item?.id || String(Math.random());
              const name = item?.name?.S || item?.unit?.S || item?.name || 'Unknown Unit';
              const address = item?.address?.S || item?.propertyName?.S || item?.address || 'Unknown Property';
              const unitType = item?.unit_type?.S || item?.unit_type || 'Unknown';
              const priceN = item?.price?.N || item?.price;
              const monthlyRent = priceN ? `$${priceN}` : 'Contact';
              const amenities = item?.description?.S || item?.short_description?.S || item?.description || item?.short_description || '';

              // Build images from multiple possible sources
              const subitemsL = Array.isArray(item?.subitems?.L) ? item.subitems.L : [];
              const imagesFromSubitems = subitemsL
                .map((e: any) => e?.M?.url?.S)
                .filter((u: any) => !!u);
              const imagesL = Array.isArray(item?.images?.L) ? item.images.L : [];
              const imagesFromImages = imagesL
                .map((e: any) => e?.S)
                .filter((u: any) => !!u);
              const flatSubitems = Array.isArray(item?.subitems) ? item.subitems : [];
              const imagesFromFlat = flatSubitems
                .map((s: any) => s?.url)
                .filter((u: any) => !!u);
              const allImages: string[] = imagesFromSubitems.length || imagesFromImages.length
                ? [...imagesFromImages, ...imagesFromSubitems]
                : imagesFromFlat;

              return {
                id,
                name,
                propertyName: address,
                unitType,
                status: item?.Stage?.S || item?.Stage || 'Available',
                monthlyRent,
                amenities,
                about: item?.about?.S || item?.about,
                apartmentFeatures: item?.apartment_feature?.S || item?.apartment_feature,
                buildingDetails: item?.building_details?.S || item?.building_details || item?.description?.S || item?.description,
                neighborhood: item?.neighbor?.S || item?.neighbor,
                whyYoullLoveIt: item?.why_love?.S || item?.why_love,
                mediaFiles: allImages.map((url, idx) => ({
                  id: String(idx),
                  name: 'Media',
                  url,
                  type: 'Media',
                  isVideo: false,
                })),
              } as RentalItem;
            });
          }
        } catch (parseError) {
          console.error('Error parsing API response body:', parseError);
        }
      }
      
      // Fallback: check if result has rentals or items directly
      if (rentals.length === 0) {
        if (result.rentals && Array.isArray(result.rentals)) {
          rentals = result.rentals;
        } else if (result.items && Array.isArray(result.items)) {
          rentals = result.items.map((item: any) => {
            const id = item?.id?.S || item?.id || String(Math.random());
            const name = item?.name?.S || item?.unit?.S || item?.name || 'Unknown Unit';
            const address = item?.address?.S || item?.propertyName?.S || item?.address || 'Unknown Property';
            const unitType = item?.unit_type?.S || item?.unitType || 'Unknown';
            const priceN = item?.price?.N || item?.price;
            const monthlyRent = priceN ? `$${priceN}` : 'Contact';
            const amenities = item?.description?.S || item?.short_description?.S || item?.description || item?.short_description || '';

            const subitemsL = Array.isArray(item?.subitems?.L) ? item.subitems.L : [];
            const imagesFromSubitems = subitemsL
              .map((e: any) => e?.M?.url?.S)
              .filter((u: any) => !!u);
            const imagesL = Array.isArray(item?.images?.L) ? item.images.L : [];
            const imagesFromImages = imagesL
              .map((e: any) => e?.S)
              .filter((u: any) => !!u);
            const flatSubitems = Array.isArray(item?.subitems) ? item.subitems : [];
            const imagesFromFlat = flatSubitems
              .map((s: any) => s?.url)
              .filter((u: any) => !!u);
            const allImages: string[] = imagesFromSubitems.length || imagesFromImages.length
              ? [...imagesFromImages, ...imagesFromSubitems]
              : imagesFromFlat;

            return {
              id,
              name,
              propertyName: address,
              unitType,
              status: item?.Stage?.S || item?.Stage || 'Available',
              monthlyRent,
              amenities,
              about: item?.about?.S || item?.about,
              apartmentFeatures: item?.apartment_feature?.S || item?.apartment_feature,
              buildingDetails: item?.building_details?.S || item?.building_details || item?.description?.S || item?.description,
              neighborhood: item?.neighbor?.S || item?.neighbor,
              whyYoullLoveIt: item?.why_love?.S || item?.why_love,
              mediaFiles: allImages.map((url, idx) => ({
                id: String(idx),
                name: 'Media',
                url,
                type: 'Media',
                isVideo: false,
              })),
            } as RentalItem;
          });
        }
      }
      
      console.log('Processed rentals:', rentals);
      return rentals;
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