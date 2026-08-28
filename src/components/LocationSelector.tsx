'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Search, X } from 'lucide-react';
import { locationData, getCountryOptions, getStateOptions, getCityOptions } from '@/utils/locationData';

interface LocationSelectorProps {
  selectedCountry?: string;
  selectedState?: string;
  selectedCity?: string;
  onCountryChange: (countryCode: string) => void;
  onStateChange: (stateCode: string) => void;
  onCityChange: (city: string) => void;
  showLabels?: boolean;
  className?: string;
  error?: string;
}

export default function LocationSelector({
  selectedCountry = '',
  selectedState = '',
  selectedCity = '',
  onCountryChange,
  onStateChange,
  onCityChange,
  showLabels = true,
  className = '',
  error
}: LocationSelectorProps) {
  const [states, setStates] = useState<Array<{value: string, label: string}>>([]);
  const [cities, setCities] = useState<Array<{value: string, label: string}>>([]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [stateSearchTerm, setStateSearchTerm] = useState('');
  const [citySearchTerm, setCitySearchTerm] = useState('');
  
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const stateDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const previousCountryRef = useRef<string>('');

  const countries = getCountryOptions();

  useEffect(() => {
    if (selectedCountry) {
      // Find country code from name if needed (for backward compatibility)
      const country = countries.find(c => c.value === selectedCountry || c.label === selectedCountry);
      const countryCode = country ? country.value : selectedCountry;
      const stateOptions = getStateOptions(countryCode);
      setStates(stateOptions);
    } else {
      setStates([]);
      setCities([]);
    }
  }, [selectedCountry]);

  // Separate effect to reset state and city when country changes
  useEffect(() => {
    // Only reset if the country actually changed
    if (previousCountryRef.current !== selectedCountry && previousCountryRef.current !== '') {
      if (selectedState) {
        onStateChange('');
      }
      if (selectedCity) {
        onCityChange('');
      }
    }
    previousCountryRef.current = selectedCountry;
  }, [selectedCountry, selectedState, selectedCity, onStateChange, onCityChange]);

  useEffect(() => {
    if (selectedCountry && selectedState) {
      // Find country code from name if needed (for backward compatibility)
      const country = countries.find(c => c.value === selectedCountry || c.label === selectedCountry);
      const countryCode = country ? country.value : selectedCountry;
      // Find state code from name if needed (for backward compatibility)
      const state = states.find(s => s.value === selectedState || s.label === selectedState);
      const stateCode = state ? state.value : selectedState;
      const cityOptions = getCityOptions(countryCode, stateCode);
      setCities(cityOptions);
    } else {
      setCities([]);
    }
  }, [selectedCountry, selectedState, states]);


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
        setCountrySearchTerm('');
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setIsStateDropdownOpen(false);
        setStateSearchTerm('');
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
        setCitySearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search
  const filteredCountries = countrySearchTerm 
    ? countries.filter(country => 
        country.label.toLowerCase().includes(countrySearchTerm.toLowerCase())
      )
    : countries;

  // Filter states based on search
  const filteredStates = stateSearchTerm 
    ? states.filter(state => 
        state.label.toLowerCase().includes(stateSearchTerm.toLowerCase())
      )
    : states;

  // Filter cities based on search
  const filteredCities = citySearchTerm 
    ? cities.filter(city => 
        city.label.toLowerCase().includes(citySearchTerm.toLowerCase())
      )
    : cities;

  const handleCountrySelect = (countryCode: string) => {
    // Find the country label (name) instead of code
    const selectedCountry = countries.find(country => country.value === countryCode);
    const countryName = selectedCountry ? selectedCountry.label : countryCode;
    onCountryChange(countryName); // Pass the name instead of code
    setIsCountryDropdownOpen(false);
    setCountrySearchTerm('');
    // Reset state and city when country changes
    if (selectedState) {
      onStateChange('');
    }
    if (selectedCity) {
      onCityChange('');
    }
  };

  const handleStateSelect = (stateCode: string) => {
    // Find the state label (name) instead of code
    const selectedState = states.find(state => state.value === stateCode);
    const stateName = selectedState ? selectedState.label : stateCode;
    onStateChange(stateName); // Pass the name instead of code
    setIsStateDropdownOpen(false);
    setStateSearchTerm('');
    // Reset city when state changes
    if (selectedCity) {
      onCityChange('');
    }
  };

  const handleCitySelect = (city: string) => {
    onCityChange(city);
    setIsCityDropdownOpen(false);
    setCitySearchTerm('');
  };

  const getSelectedCountryLabel = () => {
    // If selectedCountry is already a name (label), return it directly
    // Otherwise, try to find it by value (code) for backward compatibility
    if (!selectedCountry) return 'Select your country';
    const selected = countries.find(country => country.value === selectedCountry || country.label === selectedCountry);
    return selected ? selected.label : selectedCountry; // Return the name if found, otherwise return as-is
  };

  const getSelectedStateLabel = () => {
    // If selectedState is already a name (label), return it directly
    // Otherwise, try to find it by value (code) for backward compatibility
    if (!selectedState) return 'Select your state/province';
    const selected = states.find(state => state.value === selectedState || state.label === selectedState);
    return selected ? selected.label : selectedState; // Return the name if found, otherwise return as-is
  };

  const getSelectedCityLabel = () => {
    if (!selectedCity) return 'Enter or select your city';
    const selected = cities.find(city => city.value === selectedCity || city.label === selectedCity);
    return selected ? selected.label : selectedCity; // Return custom city name if not in list
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country Selector */}
      <div className="group">
        {showLabels && (
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            Country *
          </label>
        )}
        <div className="relative" ref={countryDropdownRef}>
          <div className="relative">
            <input
              type="text"
              value={selectedCountry || ''}
              onChange={(e) => {
                const value = e.target.value;
                onCountryChange(value);
                if (value) {
                  setIsCountryDropdownOpen(true);
                  setCountrySearchTerm(value);
                } else {
                  setCountrySearchTerm('');
                }
              }}
              onFocus={() => setIsCountryDropdownOpen(true)}
              placeholder="Enter or select your country"
              className={`w-full px-4 py-3 pr-10 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium ${
                error 
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100' 
                  : 'border-gray-200 bg-white hover:border-gray-300 focus:border-[#114373]'
              }`}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {selectedCountry && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCountryChange('');
                    setIsCountryDropdownOpen(false);
                    setCountrySearchTerm('');
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Clear country"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                title="Show country options"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Country Dropdown */}
          {isCountryDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-hidden">
              {/* Search Input */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={countrySearchTerm}
                    onChange={(e) => setCountrySearchTerm(e.target.value)}
                    placeholder="Search countries..."
                    className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#114373] focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                    autoFocus
                  />
                  {countrySearchTerm && (
                    <button
                      type="button"
                      onClick={() => setCountrySearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Country List */}
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.value}
                      type="button"
                      onClick={() => handleCountrySelect(country.value)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium ${
                        country.value === selectedCountry || country.label === selectedCountry
                          ? 'bg-[#114373] text-white hover:bg-[#0d3559]' 
                          : 'text-gray-900 hover:text-gray-700'
                      }`}
                    >
                      {country.label}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-600 text-center font-medium">
                    No countries found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* State/Province Selector - Always show if country is selected, allow custom input */}
      {selectedCountry && (
        <div className="group">
          {showLabels && (
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              State/Province
            </label>
          )}
          <div className="relative" ref={stateDropdownRef}>
            <div className="relative">
              <input
                type="text"
                value={selectedState || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  onStateChange(value);
                  if (value && states.length > 0) {
                    setIsStateDropdownOpen(true);
                    setStateSearchTerm(value);
                  } else {
                    setStateSearchTerm('');
                  }
                }}
                onFocus={() => {
                  if (states.length > 0) {
                    setIsStateDropdownOpen(true);
                  }
                }}
                placeholder="Enter or select your state/province"
                className={`w-full px-4 py-3 pr-10 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium ${
                  error 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100' 
                    : 'border-gray-200 bg-white hover:border-gray-300 focus:border-[#114373]'
                }`}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {selectedState && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStateChange('');
                      setIsStateDropdownOpen(false);
                      setStateSearchTerm('');
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Clear state"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {states.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    title="Show state options"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isStateDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* State Dropdown */}
            {isStateDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-hidden">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={stateSearchTerm}
                      onChange={(e) => setStateSearchTerm(e.target.value)}
                      placeholder="Search states/provinces..."
                      className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#114373] focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                      autoFocus
                    />
                    {stateSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setStateSearchTerm('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* State List */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredStates.length > 0 ? (
                    filteredStates.map((state) => (
                      <button
                        key={state.value}
                        type="button"
                        onClick={() => handleStateSelect(state.value)}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium ${
                          state.value === selectedState || state.label === selectedState
                            ? 'bg-[#114373] text-white hover:bg-[#0d3559]' 
                            : 'text-gray-900 hover:text-gray-700'
                        }`}
                      >
                        {state.label}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-600 text-center font-medium">
                      No states found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* City Selector - Always show if country and state are selected, allow custom input */}
      {selectedCountry && selectedState && (
        <div className="group">
          {showLabels && (
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              City
            </label>
          )}
          <div className="relative" ref={cityDropdownRef}>
            <div className="relative">
              <input
                type="text"
                value={selectedCity || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  onCityChange(value);
                  // Show dropdown when typing
                  if (value && cities.length > 0) {
                    setIsCityDropdownOpen(true);
                    setCitySearchTerm(value);
                  } else {
                    setCitySearchTerm('');
                  }
                }}
                onFocus={() => {
                  if (cities.length > 0) {
                    setIsCityDropdownOpen(true);
                  }
                }}
                placeholder="Enter or select your city"
                className={`w-full px-4 py-3 pr-10 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium ${
                  error 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100' 
                    : 'border-gray-200 bg-white hover:border-gray-300 focus:border-[#114373]'
                }`}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {selectedCity && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCityChange('');
                      setIsCityDropdownOpen(false);
                      setCitySearchTerm('');
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Clear city"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {cities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    title="Show city options"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* City Dropdown */}
            {isCityDropdownOpen && cities.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-hidden">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={citySearchTerm}
                      onChange={(e) => setCitySearchTerm(e.target.value)}
                      placeholder="Search cities..."
                      className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#114373] focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
                      autoFocus
                    />
                    {citySearchTerm && (
                      <button
                        type="button"
                        onClick={() => setCitySearchTerm('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* City List */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <button
                        key={city.value}
                        type="button"
                        onClick={() => handleCitySelect(city.label)}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm font-medium ${
                          city.value === selectedCity || city.label === selectedCity
                            ? 'bg-[#114373] text-white hover:bg-[#0d3559]' 
                            : 'text-gray-900 hover:text-gray-700'
                        }`}
                      >
                        {city.label}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-600 text-center font-medium">
                      {citySearchTerm ? 'No cities found. You can type your own city name.' : 'No cities available. You can type your own city name.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <span className="w-4 h-4 mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}
