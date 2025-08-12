# Amenities Map Feature

## Overview

The Amenities Map feature provides an interactive map view for property details, showing nearby amenities like restaurants, shopping centers, schools, transportation, parks, and healthcare facilities. This feature helps potential tenants understand the convenience and lifestyle benefits of a property's location.

## Features

### 🗺️ Interactive Map
- **Leaflet-based mapping** with OpenStreetMap tiles
- **Property marker** showing the selected rental location
- **Amenity markers** for different types of nearby facilities
- **Walking radius circle** (0.5 miles) to show convenient walking distance
- **Responsive design** that works on all device sizes

### 🏷️ Amenity Categories
- **🍽️ Restaurants & Dining** - Various dining options from casual to fine dining
- **🛍️ Shopping & Retail** - Shopping centers, grocery stores, boutiques
- **🎓 Schools & Education** - Elementary, middle, and high schools
- **🚌 Transportation & Transit** - Bus stops, train stations, parking
- **🌳 Parks & Recreation** - Parks, walking trails, outdoor spaces
- **🏥 Healthcare & Medical** - Medical centers, urgent care, pharmacies

### 🔍 Filtering & Controls
- **Toggle filters** to show/hide specific amenity types
- **Select All/Clear All** buttons for quick filter management
- **Real-time updates** as filters are changed
- **Amenity count display** showing how many of each type are nearby

### 📍 Information Display
- **Detailed popups** for each amenity with:
  - Name and type
  - Distance from property
  - Ratings (when available)
  - Descriptions
  - Category badges
- **Color-coded markers** for easy identification
- **Distance information** in miles for convenience

## Implementation

### Components

1. **PropertyAmenitiesMap** (`client/src/components/property-amenities-map.tsx`)
   - Main map component with filtering and display logic
   - Handles amenity data generation and filtering
   - Manages map state and interactions

2. **Property Details Page** (`client/src/pages/property-details.tsx`)
   - Integrates the amenities map
   - Shows location benefits and highlights
   - Displays prime location information

### Dependencies

- **Leaflet** - Core mapping functionality
- **React-Leaflet** - React wrapper for Leaflet
- **Lucide React** - Icons for amenity types
- **Tailwind CSS** - Styling and responsive design

### Data Structure

```typescript
interface Amenity {
  id: string;
  name: string;
  type: 'restaurant' | 'shopping' | 'school' | 'transportation' | 'park' | 'healthcare';
  coordinates: [number, number];
  rating?: number;
  distance?: string;
  description?: string;
}
```

## Usage

### In Property Details

The amenities map automatically appears on property detail pages, showing:
- The property location as a primary marker
- Nearby amenities within walking distance
- Filterable view of different amenity types
- Walking radius visualization

### Customization

To customize the amenities map:

1. **Modify amenity data** in `generateNearbyAmenities()` function
2. **Adjust coordinates** for different property locations
3. **Add new amenity types** by extending the type definitions
4. **Customize styling** using Tailwind CSS classes
5. **Change map tiles** by modifying the TileLayer URL

### Integration with Real APIs

For production use, replace the sample data with real API calls:

```typescript
// Example: Google Places API integration
const fetchNearbyAmenities = async (coordinates: [number, number]) => {
  const response = await fetch(`/api/places/nearby?lat=${coordinates[0]}&lng=${coordinates[1]}`);
  return response.json();
};
```

## Styling

### Color Scheme
- **Restaurants**: Orange (`bg-orange-500`)
- **Shopping**: Blue (`bg-blue-500`)
- **Schools**: Green (`bg-green-500`)
- **Transportation**: Purple (`bg-purple-500`)
- **Parks**: Emerald (`bg-emerald-500`)
- **Healthcare**: Red (`bg-red-500`)

### Map Styling
- **Property marker**: Larger size (32x41) with blue accent
- **Amenity markers**: Smaller size (20x32) with category colors
- **Walking radius**: Blue circle with 10% opacity
- **Popups**: Rounded corners with shadows and proper spacing

## Future Enhancements

### Planned Features
- **Real-time data** from mapping APIs (Google Places, Foursquare)
- **User reviews** and ratings integration
- **Directions** to amenities with route planning
- **Amenity photos** in popup displays
- **Search functionality** for specific amenity types
- **Distance calculations** using actual walking routes

### API Integration
- **Google Places API** for comprehensive amenity data
- **Foursquare API** for venue information and photos
- **OpenStreetMap** for additional location data
- **Transit APIs** for real-time transportation information

## Browser Compatibility

- **Modern browsers** with ES6+ support
- **Mobile devices** with touch gesture support
- **Responsive design** for all screen sizes
- **Progressive enhancement** for older browsers

## Performance Considerations

- **Lazy loading** of map tiles and markers
- **Efficient filtering** with React state management
- **Optimized rendering** for large numbers of amenities
- **Memory management** for map instances

## Accessibility

- **Keyboard navigation** support
- **Screen reader** compatibility
- **High contrast** color schemes
- **Alternative text** for map elements
- **Focus management** for interactive elements

## Testing

### Manual Testing
1. Navigate to a property details page
2. Verify the amenities map loads correctly
3. Test filter functionality for each amenity type
4. Click on markers to verify popup information
5. Test responsive design on different screen sizes

### Automated Testing
- Component rendering tests
- Filter functionality tests
- Map interaction tests
- Responsive design tests

## Troubleshooting

### Common Issues
1. **Map not loading**: Check Leaflet CSS imports and dependencies
2. **Markers not appearing**: Verify coordinate data and marker creation
3. **Filters not working**: Check state management and filter logic
4. **Styling issues**: Verify Tailwind CSS classes and custom styles

### Debug Mode
Enable console logging for debugging:
```typescript
const DEBUG = true;
if (DEBUG) {
  console.log('Amenities:', amenities);
  console.log('Active filters:', activeFilters);
}
```

## Contributing

When adding new features to the amenities map:

1. **Follow existing patterns** for component structure
2. **Add proper TypeScript types** for new functionality
3. **Include accessibility features** for new interactions
4. **Test on multiple devices** and screen sizes
5. **Update documentation** for new features

## License

This feature is part of the LPPM Rentals application and follows the same licensing terms.
