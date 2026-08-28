'use client';

import { useState, useRef, useEffect } from 'react';
import { Phone, ChevronDown, Search, X, AlertCircle } from 'lucide-react';
import { getPhoneCodeOptions } from '@/utils/locationData';

interface PhoneNumberSelectorProps {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (number: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export default function PhoneNumberSelector({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  label = 'Phone Number',
  placeholder = 'Enter your phone number',
  required = true,
  error,
  className = ''
}: PhoneNumberSelectorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const allCountryCodes = getPhoneCodeOptions();
  
  // Popular country codes to show by default (5-6 countries)
  const popularCountries = [
    { value: '+255', label: '+255 Tanzania', countryCode: 'TZ' },
    { value: '+254', label: '+254 Kenya', countryCode: 'KE' },
    { value: '+256', label: '+256 Uganda', countryCode: 'UG' },
    { value: '+1', label: '+1 US/Canada', countryCode: 'US' },
    { value: '+44', label: '+44 UK', countryCode: 'GB' },
    { value: '+49', label: '+49 Germany', countryCode: 'DE' }
  ];

  // Filter countries based on search term
  const filteredCountries = searchTerm 
    ? allCountryCodes.filter(country => 
        country.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.value.includes(searchTerm)
      )
    : popularCountries;

  // Set default to Tanzania if no country code is selected
  useEffect(() => {
    if (!countryCode) {
      onCountryCodeChange('+255');
    }
  }, [countryCode, onCountryCodeChange]);

  const handleCountryCodeChange = (code: string) => {
    onCountryCodeChange(code);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and remove any non-digit characters
    let value = e.target.value.replace(/\D/g, '');
    
    // Remove leading zeros
    value = value.replace(/^0+/, '');
    
    onPhoneNumberChange(value);
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      setSearchTerm('');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSelectedCountryCode = () => {
    return countryCode || '+255';
  };

  return (
    <div className={`group ${className}`}>
      <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
        <Phone className="w-4 h-4 mr-2 text-gray-400" />
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="flex gap-3 items-stretch">
        {/* Country Code Selector */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleDropdownToggle}
            className={`w-24 h-full px-4 py-3.5 border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-100 text-center flex items-center justify-center shadow-sm ${
              error 
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100 text-gray-700' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md focus:border-[#114373] text-gray-900'
            } text-sm font-semibold`}
          >
            <span className="text-gray-900 font-semibold text-sm">{getSelectedCountryCode()}</span>
            <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform flex-shrink-0 ml-1.5 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl z-50 max-h-80 overflow-hidden backdrop-blur-sm">
              {/* Search Input */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search country code..."
                    className="w-full pl-11 pr-10 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#114373] focus:border-[#114373] text-sm text-gray-900 placeholder-gray-400 bg-white shadow-sm transition-all duration-300"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Country List */}
              <div className="max-h-64 overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  <div className="py-2">
                    {filteredCountries.map((country, index) => (
                      <button
                        key={country.value}
                        type="button"
                        onClick={() => handleCountryCodeChange(country.value)}
                        className={`w-full px-4 py-3 mx-2 my-1 text-center rounded-xl transition-all duration-200 text-sm font-semibold ${
                          country.value === countryCode 
                            ? 'bg-gradient-to-r from-[#114373] to-[#1e5a8a] text-white shadow-md hover:from-[#0d3559] hover:to-[#114373]' 
                            : 'text-gray-900 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                      >
                        {country.value}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-sm text-gray-500 text-center">
                    <div className="flex flex-col items-center">
                      <Search className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="font-medium">No countries found</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="relative flex-1">
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`w-full h-full px-5 py-3.5 text-sm border-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm ${
              error 
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-100' 
                : isFocused
                  ? 'border-[#114373] shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
            placeholder={placeholder || "Enter phone number"}
            maxLength={15}
          />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}
