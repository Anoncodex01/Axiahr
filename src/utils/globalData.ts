// Global location data structure
export interface LocationData {
  country: string;
  regions: {
    name: string;
    cities: string[];
  }[];
}

// All countries list
export const allCountries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast',
  'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman',
  'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen',
  'Zambia', 'Zimbabwe'
];

// Comprehensive global location data
export const globalLocations: LocationData[] = [
  {
    country: "Tanzania",
    regions: [
      {
        name: "Dar es Salaam",
        cities: ["Dar es Salaam", "Mbezi Beach", "Masaki", "Oyster Bay", "Mikocheni", "Upanga", "Kinondoni", "Ilala", "Temeke", "Kigamboni"]
      },
      {
        name: "Arusha",
        cities: ["Arusha", "Moshi", "Karatu", "Mto wa Mbu", "Usa River", "Ngorongoro", "Longido", "Monduli"]
      },
      {
        name: "Dodoma",
        cities: ["Dodoma", "Kondoa", "Kongwa", "Mpwapwa", "Chamwino", "Chemba", "Bahi"]
      },
      {
        name: "Mwanza",
        cities: ["Mwanza", "Musoma", "Geita", "Sengerema", "Ukerewe", "Magu", "Kwimba", "Misungwi"]
      },
      {
        name: "Mbeya",
        cities: ["Mbeya", "Iringa", "Songea", "Njombe", "Makete", "Ludewa", "Mufindi", "Kilolo"]
      },
      {
        name: "Tanga",
        cities: ["Tanga", "Pangani", "Handeni", "Korogwe", "Lushoto", "Muheza", "Mkinga", "Kilindi"]
      },
      {
        name: "Morogoro",
        cities: ["Morogoro", "Kilosa", "Gairo", "Kilombero", "Mvomero", "Ulanga", "Malinyi"]
      },
      {
        name: "Tabora",
        cities: ["Tabora", "Urambo", "Sikonge", "Nzega", "Igunga", "Kaliua", "Uyui"]
      },
      {
        name: "Kigoma",
        cities: ["Kigoma", "Kasulu", "Kibondo", "Buhigwe", "Kakonko", "Uvinza"]
      },
      {
        name: "Mara",
        cities: ["Musoma", "Tarime", "Serengeti", "Bunda", "Rorya", "Butiama"]
      },
      {
        name: "Kagera",
        cities: ["Bukoba", "Muleba", "Karagwe", "Biharamulo", "Ngara", "Missenyi", "Kyerwa"]
      },
      {
        name: "Shinyanga",
        cities: ["Shinyanga", "Kahama", "Kishapu", "Maswa", "Meatu", "Bariadi"]
      },
      {
        name: "Singida",
        cities: ["Singida", "Manyoni", "Iramba", "Ikungi", "Mkalama", "Itigi"]
      },
      {
        name: "Rukwa",
        cities: ["Sumbawanga", "Nkasi", "Kalambo", "Mpanda"]
      },
      {
        name: "Ruvuma",
        cities: ["Songea", "Mbinga", "Tunduru", "Namtumbo", "Nyasa"]
      },
      {
        name: "Lindi",
        cities: ["Lindi", "Kilwa", "Nachingwea", "Ruangwa", "Liwale"]
      },
      {
        name: "Mtwara",
        cities: ["Mtwara", "Masasi", "Newala", "Tandahimba", "Nanyumbu"]
      },
      {
        name: "Pwani",
        cities: ["Kibaha", "Bagamoyo", "Kisarawe", "Mkuranga", "Rufiji", "Mafia"]
      },
      {
        name: "Zanzibar",
        cities: ["Zanzibar City", "Stone Town", "Nungwi", "Kendwa", "Paje", "Jambiani"]
      }
    ]
  },
  {
    country: "United States",
    regions: [
      {
        name: "California",
        cities: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Fresno", "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim"]
      },
      {
        name: "New York",
        cities: ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica"]
      },
      {
        name: "Texas",
        cities: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo"]
      },
      {
        name: "Florida",
        cities: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee", "Fort Lauderdale", "Port St. Lucie", "Cape Coral"]
      },
      {
        name: "Illinois",
        cities: ["Chicago", "Aurora", "Rockford", "Joliet", "Naperville", "Springfield", "Peoria", "Elgin", "Waukegan", "Cicero"]
      }
    ]
  },
  {
    country: "United Kingdom",
    regions: [
      {
        name: "England",
        cities: ["London", "Birmingham", "Manchester", "Liverpool", "Leeds", "Sheffield", "Bristol", "Nottingham", "Leicester", "Coventry"]
      },
      {
        name: "Scotland",
        cities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Stirling", "Inverness", "Perth", "Dunfermline", "Ayr", "Kilmarnock"]
      },
      {
        name: "Wales",
        cities: ["Cardiff", "Swansea", "Newport", "Wrexham", "Barry", "Caerphilly", "Rhondda", "Merthyr Tydfil", "Bridgend", "Port Talbot"]
      },
      {
        name: "Northern Ireland",
        cities: ["Belfast", "Derry", "Lisburn", "Newtownabbey", "Bangor", "Craigavon", "Castlereagh", "Carrickfergus", "Antrim", "Newry"]
      }
    ]
  },
  {
    country: "Canada",
    regions: [
      {
        name: "Ontario",
        cities: ["Toronto", "Ottawa", "Mississauga", "Hamilton", "Brampton", "London", "Markham", "Vaughan", "Kitchener", "Windsor"]
      },
      {
        name: "Quebec",
        cities: ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Saguenay", "Levis", "Trois-Rivieres", "Terrebonne"]
      },
      {
        name: "British Columbia",
        cities: ["Vancouver", "Surrey", "Burnaby", "Richmond", "Abbotsford", "Coquitlam", "Saanich", "Delta", "Kelowna", "Langley"]
      },
      {
        name: "Alberta",
        cities: ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert", "Medicine Hat", "Grande Prairie", "Airdrie", "Spruce Grove", "Leduc"]
      }
    ]
  },
  {
    country: "Germany",
    regions: [
      {
        name: "Bavaria",
        cities: ["Munich", "Nuremberg", "Augsburg", "Wurzburg", "Regensburg", "Ingolstadt", "Furth", "Erlangen", "Bayreuth", "Bamberg"]
      },
      {
        name: "North Rhine-Westphalia",
        cities: ["Cologne", "Dusseldorf", "Dortmund", "Essen", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Munster"]
      },
      {
        name: "Baden-Wurttemberg",
        cities: ["Stuttgart", "Mannheim", "Karlsruhe", "Freiburg", "Heidelberg", "Heilbronn", "Ulm", "Pforzheim", "Reutlingen", "Tubingen"]
      },
      {
        name: "Hesse",
        cities: ["Frankfurt", "Wiesbaden", "Kassel", "Darmstadt", "Offenbach", "Hanau", "Marburg", "Gießen", "Fulda", "Rüsselsheim"]
      }
    ]
  }
];

// Get all countries
export const getAllCountries = (): string[] => {
  return allCountries;
};

// Get regions by country
export const getRegionsByCountry = (country: string): string[] => {
  const location = globalLocations.find(loc => loc.country === country);
  return location ? location.regions.map(region => region.name) : [];
};

// Get cities by region
export const getCitiesByRegion = (country: string, region: string): string[] => {
  const location = globalLocations.find(loc => loc.country === country);
  if (!location) return [];
  
  const regionData = location.regions.find(r => r.name === region);
  return regionData ? regionData.cities : [];
};

// Get all cities for a country
export const getAllCities = (country: string): string[] => {
  const location = globalLocations.find(loc => loc.country === country);
  if (!location) return [];
  
  return location.regions.flatMap(region => region.cities);
};

// Format location string
export const formatLocation = (city: string, state: string, country: string): string => {
  return `${city}, ${state}, ${country}`;
};

// Search locations
export const searchLocations = (query: string): string[] => {
  const allLocations: string[] = [];
  
  globalLocations.forEach(location => {
    allLocations.push(location.country);
    location.regions.forEach(region => {
      allLocations.push(`${region.name}, ${location.country}`);
      region.cities.forEach(city => {
        allLocations.push(`${city}, ${region.name}, ${location.country}`);
      });
    });
  });
  
  return allLocations.filter(location => 
    location.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);
};

// Search countries
export const searchCountries = (query: string): string[] => {
  return allCountries.filter(country => 
    country.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);
};

// Search regions by country
export const searchRegionsByCountry = (country: string, query: string): string[] => {
  const regions = getRegionsByCountry(country);
  return regions.filter(region => 
    region.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);
};

// Search cities by region
export const searchCitiesByRegion = (country: string, region: string, query: string): string[] => {
  const cities = getCitiesByRegion(country, region);
  return cities.filter(city => 
    city.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);
};
