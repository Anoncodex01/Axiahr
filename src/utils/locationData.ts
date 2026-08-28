import { Country, State, City } from 'country-state-city';
import { countryCodes as phoneData } from './countryCodes';

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  phoneCode: string;
  states?: State[];
}

export interface State {
  code: string; // ISO 3166-2 (or provider code)
  name: string;
  cities?: string[];
}

export interface LocationData {
  countries: Country[];
  getStatesByCountry: (countryCode: string) => State[];
  getCitiesByState: (countryCode: string, stateCode: string) => string[];
  getCountryByCode: (countryCode: string) => Country | undefined;
  getCountryByPhoneCode: (phoneCode: string) => Country | undefined;
}

// Build countries list from CSC + phone data. Cache results in memory.
let cachedCountries: Country[] | null = null;

const buildCountries = (): Country[] => {
  if (cachedCountries) return cachedCountries;
  const list = ((Country as any).getAllCountries?.() || []).map((c: any) => {
    const iso2 = c.isoCode as string; // country-state-city uses isoCode
    const name = c.name as string;
    const phone = phoneData.find(pd => pd.code === iso2)?.dialCode || '';
    return { code: iso2, name, phoneCode: phone } as Country;
  });
  cachedCountries = list;
  return list;
};

export const locationData: LocationData = {
  countries: buildCountries(),

  getStatesByCountry: (countryCode: string): State[] => {
    try {
      const states = ((State as any).getStatesOfCountry?.(countryCode) || []).map((s: any) => ({
        code: s.isoCode as string,
        name: s.name as string
      }));
      return states;
    } catch {
      return [];
    }
  },

  getCitiesByState: (countryCode: string, stateCode: string): string[] => {
    try {
      const cities = ((City as any).getCitiesOfState?.(countryCode, stateCode) || []).map((ct: any) => ct.name as string);
      
      // Debug logging
      console.log('getCitiesByState called with:', { countryCode, stateCode, citiesCount: cities.length });
      
      // Add additional cities for Tanzania - Dar es Salaam only
      if (countryCode === 'TZ' && (
        stateCode === '02' ||  // Numeric code for Dar es Salaam
        stateCode === 'DS' || 
        stateCode === 'Dar es Salaam' || 
        stateCode === 'DAR ES SALAAM' ||
        stateCode === 'Dar-es-Salaam' ||
        stateCode === 'Dar_es_Salaam' ||
        stateCode.toLowerCase().includes('dar') ||
        stateCode.toLowerCase().includes('salaam')
      )) {
        const additionalCities = [
          'Dar es Salaam',
          'Magomeni',
          'Kinondoni',
          'Temeke',
          'Ilala',
          'Ubungo',
          'Kigamboni',
          'Mbagala',
          'Mikocheni',
          'Msasani',
          'Oyster Bay',
          'Masaki',
          'Upanga',
          'Kariakoo',
          'Mwananyamala',
          'Sinza',
          'Tabata',
          'Buguruni',
          'Vingunguti',
          'Mchikichini',
          'Manzese',
          'Tandale'
        ];
        
        // Combine library cities with additional cities and remove duplicates
        const allCities = [...new Set([...cities, ...additionalCities])];
        console.log('Enhanced cities for Dar es Salaam:', allCities.length, 'cities');
        return allCities.sort();
      }
      
      
      return cities;
    } catch {
      return [];
    }
  },

  getCountryByCode: (countryCode: string): Country | undefined => {
    return buildCountries().find(c => c.code === countryCode);
  },

  getCountryByPhoneCode: (phoneCode: string): Country | undefined => {
    return buildCountries().find(c => c.phoneCode === phoneCode);
  }
};

// Export commonly used data for easy access
export const countryCodes = locationData.countries.map(country => ({
  code: country.phoneCode,
  name: country.name,
  countryCode: country.code
}));

export const countries = locationData.countries.map(country => ({
  code: country.code,
  name: country.name,
  phoneCode: country.phoneCode
}));

// Helper functions for form components
export const getPhoneCodeOptions = () => {
  // Use phoneData to ensure comprehensive calling codes
  return phoneData.map(pd => ({
    value: pd.dialCode,
    label: `${pd.dialCode} ${pd.name}`,
    countryCode: pd.code
  }));
};

export const getCountryOptions = () => {
  return buildCountries().map(country => ({
    value: country.code,
    label: country.name,
    phoneCode: country.phoneCode
  }));
};

export const getStateOptions = (countryCode: string) => {
  const states = locationData.getStatesByCountry(countryCode);
  return states.map(state => ({
    value: state.code,
    label: state.name
  }));
};

export const getCityOptions = (countryCode: string, stateCode: string) => {
  const cities = locationData.getCitiesByState(countryCode, stateCode);
  return cities.map(city => ({
    value: city,
    label: city
  }));
};
