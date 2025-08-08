# Vacant Units API Documentation

This document describes the new vacant units API functionality that fetches units with images, amenities, and filtered subitems.

## API Endpoints

### 1. Netlify Function: `/api/monday/vacant-units`
- **Method**: GET
- **Description**: Fetches vacant units with enhanced filtering and subitems
- **Response**: JSON object with `units` array

### 2. Server Route: `/api/monday/vacant-units`
- **Method**: GET  
- **Description**: Same functionality as Netlify function
- **Response**: JSON object with `units` array

## GraphQL Query Structure

The API uses the exact query structure you requested:

```graphql
query {
  boards(ids: [${BOARD_ID}]) {
    items_page(query_params: {
      rules: [
        {
          column_id: "color_mkp7fmq4",
          compare_value: "Vacant",
          operator: contains_terms
        }
      ]
    }) {
      items {
        id
        name
        column_values(ids: ["text_mksxyax3", "color_mkp7xdce", "color_mkp77nrv", "color_mkp7fmq4", "numeric_mksz7rkz", "long_text_mktjp2nj", "ink_mktj22y9"]) {
          id
          text
        }
        subitems {
          id
          name
          column_values(ids: ["status", "color_mksyqx5h", "color_mkp7fmq4"]) {
            id
            text
            ... on StatusValue {
              label
            }
          }
        }
      }
    }
  }
}
```

## Data Structure

### UnitItem Type
```typescript
type UnitItem = {
  id: string;
  name: string; // Apartment Name
  propertyName: string; // Building Address
  unitType: string; // Apartment Type
  status: string; // Status (Vacant, etc.)
  monthlyRent?: number; // Monthly Rent
  images?: UnitImage[]; // Images from ink_mktj22y9 column
  amenities?: string; // Amenities from long_text_mktjp2nj column
  vacantSubitems?: VacantSubitem[]; // Subitems filtered by vacant status
};
```

### UnitImage Type
```typescript
type UnitImage = {
  id: string;
  name?: string;
  url: string;
  text?: string;
};
```

### VacantSubitem Type
```typescript
type VacantSubitem = {
  id: string;
  name: string;
  status: string;
  applicantType: string;
};
```

## Column Mappings

| Column ID | Purpose | Data Type |
|-----------|---------|-----------|
| `ink_mktj22y9` | Images | JSON array of image objects |
| `long_text_mktjp2nj` | Amenities | Text |
| `color_mkp7fmq4` | Status (Vacant filter) | Text |
| `color_mkp7xdce` | Property Name | Text |
| `color_mkp77nrv` | Unit Type | Text |
| `numeric_mksz7rkz` | Monthly Rent | Number |
| `text_mksxyax3` | Additional text field | Text |

## Client-Side Usage

### Basic Usage
```typescript
import { MondayApiService } from '@/lib/monday-api';

// Fetch vacant units with subitems
const units = await MondayApiService.fetchVacantUnitsWithSubitems();
```

### Helper Methods
```typescript
// Get units with images
const unitsWithImages = MondayApiService.getUnitsWithImages(units);

// Get units with amenities
const unitsWithAmenities = MondayApiService.getUnitsWithAmenities(units);

// Get all vacant subitems across all units
const allVacantSubitems = MondayApiService.getAllVacantSubitems(units);

// Get units by building
const unitsByBuilding = MondayApiService.getUnitsByBuilding(units, buildingAddress);
```

## Subitem Filtering

The API implements your requested filtering logic:

```javascript
const filteredSubitems = items.flatMap(item =>
  item.subitems.filter(sub =>
    sub.column_values.find(cv =>
      cv.id === "color_mkp7fmq4" && cv.text === "Vacant"
    )
  )
);
```

This filters subitems to only include those where the `color_mkp7fmq4` column value is "Vacant".

## Test Component

A test component is available at `/vacant-units-test` to demonstrate the functionality:

- Shows summary statistics
- Displays all vacant units with their details
- Shows images and amenities for each unit
- Lists all vacant subitems
- Provides refresh functionality

## Environment Variables

Make sure these environment variables are set:

- `MONDAY_API_TOKEN`: Your Monday.com API token
- `MONDAY_BOARD_ID`: Your Monday.com board ID (default: "9769934634")

## Error Handling

The API includes comprehensive error handling:

- Network errors are caught and logged
- JSON parsing errors for images are handled gracefully
- Missing data is handled with fallbacks
- Detailed error messages are returned to the client

## Deployment

The functionality is available in both development and production:

- **Development**: Uses server routes in `server/routes.ts`
- **Production**: Uses Netlify functions in `netlify/functions/monday-vacant-units.js`

Both implementations provide the same API interface and data structure.
