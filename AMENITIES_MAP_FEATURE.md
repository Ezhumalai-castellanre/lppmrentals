# Amenities Map Feature

## Overview

The Amenities Map feature provides an interactive map view for property details, showing nearby amenities like restaurants, shopping centers, schools, transportation, parks, and healthcare facilities. This feature helps potential tenants understand the convenience and lifestyle benefits of a property's location.

**NEW: AI-Powered Content Generation** - The feature now integrates with Google's Gemini AI to automatically generate compelling descriptions and dynamic location captions.

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
  - AI-generated descriptions
  - Category badges
- **Color-coded markers** for easy identification
- **Distance information** in miles for convenience

### 🤖 AI-Powered Features (NEW!)
- **Gemini AI Integration** - Uses Google's Gemini 2.0 Flash model
- **Dynamic Descriptions** - Each amenity gets a unique, engaging description
- **Location Captions** - Intelligent captions that adapt to each property
- **Real-time Regeneration** - Click "Regenerate AI" for fresh content
- **Contextual Content** - AI considers property name, amenity type, and distance

## Implementation

### Components

1. **PropertyAmenitiesMap** (`client/src/components/property-amenities-map.tsx`)
   - Main map component with filtering and display logic
   - Handles amenity data generation and filtering
   - Manages map state and interactions
   - **NEW**: Integrates Gemini AI for content generation

2. **Property Details Page** (`client/src/pages/property-details.tsx`)
   - Integrates the amenities map
   - Shows location benefits and highlights
   - Displays prime location information

3. **Amenities Demo Page** (`client/src/pages/amenities-demo.tsx`)
   - **NEW**: Standalone demo showcasing AI-powered features
   - Multiple property examples with different locations
   - Interactive demonstration of AI capabilities

### Dependencies

- **Leaflet** - Core mapping functionality
- **React-Leaflet** - React wrapper for Leaflet
- **Lucide React** - Icons for amenity types
- **Tailwind CSS** - Styling and responsive design
- **Google Gemini AI API** - **NEW**: AI content generation

### Data Structure

```typescript
interface Amenity {
  id: string;
  name: string;
  type: 'restaurant' | 'shopping' | 'school' | 'transportation' | 'park' | 'healthcare';
  coordinates: [number, number];
  rating?: number;
  distance: string; // Required field
  description?: string; // Fallback description
  aiDescription?: string; // NEW: AI-generated description
}
```

## AI Integration

### Gemini AI API

The feature integrates with Google's Gemini 2.0 Flash model for intelligent content generation:

```typescript
// Generate amenity descriptions
const generateAmenityDescription = async (
  amenityType: string, 
  amenityName: string, 
  distance: string
): Promise<string>

// Generate location captions
const generateLocationCaption = async (
  propertyName: string, 
  amenityCount: number
): Promise<string>
```

### API Endpoint

```bash
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
```

### API Key

The feature uses the provided Gemini AI API key:
- **Key**: `AIzaSyBrcXjJl74fJwtDLgVtZJ3UrEEjUCgaK1U`
- **Model**: `gemini-2.0-flash`
- **Rate Limiting**: Handled gracefully with fallback content

### Content Generation Prompts

#### Amenity Descriptions
```
Generate a brief, engaging description for a {amenityType} called "{amenityName}" 
that is {distance} away from a residential property. Make it sound appealing and 
highlight what makes this location convenient. Keep it under 100 characters.
```

#### Location Captions
```
Generate a compelling, short caption (under 60 characters) for a property called 
"{propertyName}" that highlights its prime location with {amenityCount} nearby 
amenities. Make it sound attractive for potential renters.
```

## Usage

### In Property Details

The amenities map automatically appears on property detail pages, showing:
- The property location as a primary marker
- Nearby amenities within walking distance
- Filterable view of different amenity types
- Walking radius visualization
- **NEW**: AI-generated amenity descriptions and location captions

### AI Content Management

Users can interact with AI-generated content:
- **View AI Descriptions**: Each amenity shows AI-generated descriptions in cards and popups
- **Regenerate Content**: Click "Regenerate AI" button for fresh, unique content
- **Dynamic Captions**: Location captions automatically adapt to each property
- **Fallback Content**: Original descriptions remain as backup if AI generation fails

### Demo Page

Access the dedicated demo page to:
- Experience AI-powered features with multiple property examples
- See how content generation works across different locations
- Understand the AI integration workflow
- Test regeneration functionality

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

### AI Content Display
- **Amenity Cards**: Beautiful grid layout with AI-generated descriptions
- **Sparkles Icon**: Purple sparkles icon indicates AI-generated content
- **Regenerate Button**: Prominent button for refreshing AI content
- **Loading States**: Visual feedback during AI content generation

## Future Enhancements

### Planned Features
- **Real-time data** from mapping APIs (Google Places, Foursquare)
- **User reviews** and ratings integration
- **Directions** to amenities with route planning
- **Amenity photos** in popup displays
- **Search functionality** for specific amenity types
- **Distance calculations** using actual walking routes

### AI Enhancements
- **Multi-language support** for international properties
- **Sentiment analysis** for amenity descriptions
- **Personalized content** based on user preferences
- **Batch processing** for multiple properties
- **Content optimization** based on user engagement

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
- **AI API caching** to reduce redundant requests
- **Fallback content** for offline or API failure scenarios

## Accessibility

- **Keyboard navigation** support
- **Screen reader** compatibility
- **High contrast** color schemes
- **Alternative text** for map elements
- **Focus management** for interactive elements
- **AI content labeling** for screen readers

## Testing

### Manual Testing
1. Navigate to a property details page
2. Verify the amenities map loads correctly
3. Test filter functionality for each amenity type
4. Click on markers to verify popup information
5. Test responsive design on different screen sizes
6. **NEW**: Test AI content generation and regeneration
7. **NEW**: Verify AI descriptions appear in amenity cards

### Automated Testing
- Component rendering tests
- Filter functionality tests
- Map interaction tests
- Responsive design tests
- **NEW**: AI API integration tests
- **NEW**: Content generation tests

## Troubleshooting

### Common Issues
1. **Map not loading**: Check Leaflet CSS imports and dependencies
2. **Markers not appearing**: Verify coordinate data and marker creation
3. **Filters not working**: Check state management and filter logic
4. **Styling issues**: Verify Tailwind CSS classes and custom styles
5. **AI content not generating**: Check Gemini API key and network connectivity

### AI-Specific Issues
1. **API rate limiting**: Implement exponential backoff and retry logic
2. **Content generation failures**: Fallback to original descriptions
3. **Network timeouts**: Set appropriate timeout values for API calls
4. **API key validation**: Verify API key permissions and quotas

### Debug Mode
Enable console logging for debugging:
```typescript
const DEBUG = true;
if (DEBUG) {
  console.log('Amenities:', amenities);
  console.log('Active filters:', activeFilters);
  console.log('AI content:', aiDescriptions);
}
```

## Contributing

When adding new features to the amenities map:

1. **Follow existing patterns** for component structure
2. **Add proper TypeScript types** for new functionality
3. **Include accessibility features** for new interactions
4. **Test on multiple devices** and screen sizes
5. **Update documentation** for new features
6. **Handle AI API failures** gracefully with fallbacks
7. **Optimize API calls** to minimize rate limiting issues

## License

This feature is part of the LPPM Rentals application and follows the same licensing terms.

## AI Integration Credits

- **Gemini AI Model**: Google's Gemini 2.0 Flash
- **API Endpoint**: Google Generative Language API
- **Content Generation**: Intelligent amenity descriptions and location captions
- **Real-time Updates**: Dynamic content regeneration capabilities
