import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Label } from './label';
import { FormMessage } from './form';
import { USA_STATES, getCitiesForState } from '@/lib/usa-data';

interface StateCitySelectorProps {
  selectedState: string;
  selectedCity: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  stateLabel?: string;
  cityLabel?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const StateCitySelector: React.FC<StateCitySelectorProps> = ({
  selectedState,
  selectedCity,
  onStateChange,
  onCityChange,
  stateLabel = "State",
  cityLabel = "City",
  required = false,
  error,
  className = '',
  disabled = false
}) => {
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Update available cities when state changes
  useEffect(() => {
    if (selectedState) {
      const cities = getCitiesForState(selectedState);
      setAvailableCities(cities);
      
      // Clear city selection if current city is not in the new state
      if (selectedCity && !cities.includes(selectedCity)) {
        onCityChange('');
      }
    } else {
      setAvailableCities([]);
      onCityChange('');
    }
  }, [selectedState, selectedCity, onCityChange]);

  const handleStateChange = (stateCode: string) => {
    onStateChange(stateCode);
  };

  const handleCityChange = (city: string) => {
    onCityChange(city);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {stateLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Select 
          value={selectedState} 
          onValueChange={handleStateChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {USA_STATES.map((state) => (
              <SelectItem key={state.code} value={state.code}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {cityLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Select 
          value={selectedCity} 
          onValueChange={handleCityChange}
          disabled={disabled || !selectedState || availableCities.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={!selectedState ? "Select state first" : availableCities.length === 0 ? "No cities available" : "Select city"} />
          </SelectTrigger>
          <SelectContent>
            {availableCities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <FormMessage className="text-red-500 text-sm">
          {error}
        </FormMessage>
      )}
    </div>
  );
};

// Individual state selector component
interface StateSelectorProps {
  selectedState: string;
  onStateChange: (state: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const StateSelector: React.FC<StateSelectorProps> = ({
  selectedState,
  onStateChange,
  label = "State",
  required = false,
  error,
  className = '',
  disabled = false
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select 
        value={selectedState} 
        onValueChange={onStateChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select state" />
        </SelectTrigger>
        <SelectContent>
          {USA_STATES.map((state) => (
            <SelectItem key={state.code} value={state.code}>
              {state.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <FormMessage className="text-red-500 text-sm">
          {error}
        </FormMessage>
      )}
    </div>
  );
};

// Individual city selector component
interface CitySelectorProps {
  selectedState: string;
  selectedCity: string;
  onCityChange: (city: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const CitySelector: React.FC<CitySelectorProps> = ({
  selectedState,
  selectedCity,
  onCityChange,
  label = "City",
  required = false,
  error,
  className = '',
  disabled = false
}) => {
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    if (selectedState) {
      const cities = getCitiesForState(selectedState);
      setAvailableCities(cities);
      
      // Clear city selection if current city is not in the new state
      if (selectedCity && !cities.includes(selectedCity)) {
        onCityChange('');
      }
    } else {
      setAvailableCities([]);
      onCityChange('');
    }
  }, [selectedState, selectedCity, onCityChange]);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select 
        value={selectedCity} 
        onValueChange={onCityChange}
        disabled={disabled || !selectedState || availableCities.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder={!selectedState ? "Select state first" : availableCities.length === 0 ? "No cities available" : "Select city"} />
        </SelectTrigger>
        <SelectContent>
          {availableCities.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <FormMessage className="text-red-500 text-sm">
          {error}
        </FormMessage>
      )}
    </div>
  );
}; 