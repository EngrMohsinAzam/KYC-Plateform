// Comprehensive Country and City data
export interface Country {
  value: string
  label: string
  cities: City[]
  code: string // ISO country code
}

export interface City {
  value: string
  label: string
}

// Comprehensive list of countries with their major cities
export const countries: Country[] = [
  // North America
  {
    value: 'us',
    label: 'United States',
    code: 'US',
    cities: [
      { value: 'new-york', label: 'New York' },
      { value: 'los-angeles', label: 'Los Angeles' },
      { value: 'chicago', label: 'Chicago' },
      { value: 'houston', label: 'Houston' },
      { value: 'phoenix', label: 'Phoenix' },
      { value: 'philadelphia', label: 'Philadelphia' },
      { value: 'san-antonio', label: 'San Antonio' },
      { value: 'san-diego', label: 'San Diego' },
      { value: 'dallas', label: 'Dallas' },
      { value: 'san-jose', label: 'San Jose' },
      { value: 'austin', label: 'Austin' },
      { value: 'jacksonville', label: 'Jacksonville' },
      { value: 'fort-worth', label: 'Fort Worth' },
      { value: 'columbus', label: 'Columbus' },
      { value: 'charlotte', label: 'Charlotte' },
      { value: 'san-francisco', label: 'San Francisco' },
      { value: 'indianapolis', label: 'Indianapolis' },
      { value: 'seattle', label: 'Seattle' },
      { value: 'denver', label: 'Denver' },
      { value: 'washington', label: 'Washington' },
    ],
  },
  {
    value: 'ca',
    label: 'Canada',
    code: 'CA',
    cities: [
      { value: 'toronto', label: 'Toronto' },
      { value: 'montreal', label: 'Montreal' },
      { value: 'vancouver', label: 'Vancouver' },
      { value: 'calgary', label: 'Calgary' },
      { value: 'edmonton', label: 'Edmonton' },
      { value: 'ottawa', label: 'Ottawa' },
      { value: 'winnipeg', label: 'Winnipeg' },
      { value: 'quebec-city', label: 'Quebec City' },
      { value: 'hamilton', label: 'Hamilton' },
      { value: 'kitchener', label: 'Kitchener' },
    ],
  },
  {
    value: 'mx',
    label: 'Mexico',
    code: 'MX',
    cities: [
      { value: 'mexico-city', label: 'Mexico City' },
      { value: 'guadalajara', label: 'Guadalajara' },
      { value: 'monterrey', label: 'Monterrey' },
      { value: 'puebla', label: 'Puebla' },
      { value: 'tijuana', label: 'Tijuana' },
      { value: 'leon', label: 'León' },
      { value: 'juarez', label: 'Juárez' },
      { value: 'torreon', label: 'Torreón' },
    ],
  },
  
  // Europe
  {
    value: 'uk',
    label: 'United Kingdom',
    code: 'GB',
    cities: [
      { value: 'london', label: 'London' },
      { value: 'manchester', label: 'Manchester' },
      { value: 'birmingham', label: 'Birmingham' },
      { value: 'glasgow', label: 'Glasgow' },
      { value: 'liverpool', label: 'Liverpool' },
      { value: 'leeds', label: 'Leeds' },
      { value: 'edinburgh', label: 'Edinburgh' },
      { value: 'bristol', label: 'Bristol' },
      { value: 'sheffield', label: 'Sheffield' },
      { value: 'cardiff', label: 'Cardiff' },
    ],
  },
  {
    value: 'de',
    label: 'Germany',
    code: 'DE',
    cities: [
      { value: 'berlin', label: 'Berlin' },
      { value: 'munich', label: 'Munich' },
      { value: 'hamburg', label: 'Hamburg' },
      { value: 'frankfurt', label: 'Frankfurt' },
      { value: 'cologne', label: 'Cologne' },
      { value: 'stuttgart', label: 'Stuttgart' },
      { value: 'dusseldorf', label: 'Düsseldorf' },
      { value: 'dortmund', label: 'Dortmund' },
      { value: 'essen', label: 'Essen' },
      { value: 'leipzig', label: 'Leipzig' },
    ],
  },
  {
    value: 'fr',
    label: 'France',
    code: 'FR',
    cities: [
      { value: 'paris', label: 'Paris' },
      { value: 'lyon', label: 'Lyon' },
      { value: 'marseille', label: 'Marseille' },
      { value: 'toulouse', label: 'Toulouse' },
      { value: 'nice', label: 'Nice' },
      { value: 'nantes', label: 'Nantes' },
      { value: 'strasbourg', label: 'Strasbourg' },
      { value: 'montpellier', label: 'Montpellier' },
      { value: 'bordeaux', label: 'Bordeaux' },
      { value: 'lille', label: 'Lille' },
    ],
  },
  {
    value: 'it',
    label: 'Italy',
    code: 'IT',
    cities: [
      { value: 'rome', label: 'Rome' },
      { value: 'milan', label: 'Milan' },
      { value: 'naples', label: 'Naples' },
      { value: 'turin', label: 'Turin' },
      { value: 'palermo', label: 'Palermo' },
      { value: 'genoa', label: 'Genoa' },
      { value: 'bologna', label: 'Bologna' },
      { value: 'florence', label: 'Florence' },
      { value: 'bari', label: 'Bari' },
      { value: 'catania', label: 'Catania' },
    ],
  },
  {
    value: 'es',
    label: 'Spain',
    code: 'ES',
    cities: [
      { value: 'madrid', label: 'Madrid' },
      { value: 'barcelona', label: 'Barcelona' },
      { value: 'valencia', label: 'Valencia' },
      { value: 'seville', label: 'Seville' },
      { value: 'zaragoza', label: 'Zaragoza' },
      { value: 'malaga', label: 'Málaga' },
      { value: 'murcia', label: 'Murcia' },
      { value: 'palma', label: 'Palma' },
      { value: 'las-palmas', label: 'Las Palmas' },
      { value: 'bilbao', label: 'Bilbao' },
    ],
  },
  {
    value: 'nl',
    label: 'Netherlands',
    code: 'NL',
    cities: [
      { value: 'amsterdam', label: 'Amsterdam' },
      { value: 'rotterdam', label: 'Rotterdam' },
      { value: 'the-hague', label: 'The Hague' },
      { value: 'utrecht', label: 'Utrecht' },
      { value: 'eindhoven', label: 'Eindhoven' },
      { value: 'groningen', label: 'Groningen' },
      { value: 'tilburg', label: 'Tilburg' },
      { value: 'almere', label: 'Almere' },
    ],
  },
  {
    value: 'pl',
    label: 'Poland',
    code: 'PL',
    cities: [
      { value: 'warsaw', label: 'Warsaw' },
      { value: 'krakow', label: 'Kraków' },
      { value: 'lodz', label: 'Łódź' },
      { value: 'wroclaw', label: 'Wrocław' },
      { value: 'poznan', label: 'Poznań' },
      { value: 'gdansk', label: 'Gdańsk' },
      { value: 'szczecin', label: 'Szczecin' },
      { value: 'bydgoszcz', label: 'Bydgoszcz' },
    ],
  },
  {
    value: 'ru',
    label: 'Russia',
    code: 'RU',
    cities: [
      { value: 'moscow', label: 'Moscow' },
      { value: 'saint-petersburg', label: 'Saint Petersburg' },
      { value: 'novosibirsk', label: 'Novosibirsk' },
      { value: 'yekaterinburg', label: 'Yekaterinburg' },
      { value: 'kazan', label: 'Kazan' },
      { value: 'nizhny-novgorod', label: 'Nizhny Novgorod' },
      { value: 'chelyabinsk', label: 'Chelyabinsk' },
      { value: 'samara', label: 'Samara' },
    ],
  },
  
  // Asia
  {
    value: 'cn',
    label: 'China',
    code: 'CN',
    cities: [
      { value: 'beijing', label: 'Beijing' },
      { value: 'shanghai', label: 'Shanghai' },
      { value: 'guangzhou', label: 'Guangzhou' },
      { value: 'shenzhen', label: 'Shenzhen' },
      { value: 'chengdu', label: 'Chengdu' },
      { value: 'hangzhou', label: 'Hangzhou' },
      { value: 'wuhan', label: 'Wuhan' },
      { value: 'xi-an', label: "Xi'an" },
      { value: 'nanjing', label: 'Nanjing' },
      { value: 'tianjin', label: 'Tianjin' },
    ],
  },
  {
    value: 'in',
    label: 'India',
    code: 'IN',
    cities: [
      { value: 'mumbai', label: 'Mumbai' },
      { value: 'delhi', label: 'Delhi' },
      { value: 'bangalore', label: 'Bangalore' },
      { value: 'hyderabad', label: 'Hyderabad' },
      { value: 'chennai', label: 'Chennai' },
      { value: 'kolkata', label: 'Kolkata' },
      { value: 'pune', label: 'Pune' },
      { value: 'ahmedabad', label: 'Ahmedabad' },
      { value: 'jaipur', label: 'Jaipur' },
      { value: 'surat', label: 'Surat' },
    ],
  },
  {
    value: 'jp',
    label: 'Japan',
    code: 'JP',
    cities: [
      { value: 'tokyo', label: 'Tokyo' },
      { value: 'yokohama', label: 'Yokohama' },
      { value: 'osaka', label: 'Osaka' },
      { value: 'nagoya', label: 'Nagoya' },
      { value: 'sapporo', label: 'Sapporo' },
      { value: 'fukuoka', label: 'Fukuoka' },
      { value: 'kobe', label: 'Kobe' },
      { value: 'kyoto', label: 'Kyoto' },
      { value: 'kawasaki', label: 'Kawasaki' },
      { value: 'saitama', label: 'Saitama' },
    ],
  },
  {
    value: 'kr',
    label: 'South Korea',
    code: 'KR',
    cities: [
      { value: 'seoul', label: 'Seoul' },
      { value: 'busan', label: 'Busan' },
      { value: 'incheon', label: 'Incheon' },
      { value: 'daegu', label: 'Daegu' },
      { value: 'daejeon', label: 'Daejeon' },
      { value: 'gwangju', label: 'Gwangju' },
      { value: 'suwon', label: 'Suwon' },
      { value: 'ulsan', label: 'Ulsan' },
    ],
  },
  {
    value: 'pk',
    label: 'Pakistan',
    code: 'PK',
    cities: [
      { value: 'karachi', label: 'Karachi' },
      { value: 'lahore', label: 'Lahore' },
      { value: 'islamabad', label: 'Islamabad' },
      { value: 'rawalpindi', label: 'Rawalpindi' },
      { value: 'faisalabad', label: 'Faisalabad' },
      { value: 'multan', label: 'Multan' },
      { value: 'peshawar', label: 'Peshawar' },
      { value: 'quetta', label: 'Quetta' },
      { value: 'sialkot', label: 'Sialkot' },
      { value: 'gujranwala', label: 'Gujranwala' },
    ],
  },
  {
    value: 'bd',
    label: 'Bangladesh',
    code: 'BD',
    cities: [
      { value: 'dhaka', label: 'Dhaka' },
      { value: 'chittagong', label: 'Chittagong' },
      { value: 'khulna', label: 'Khulna' },
      { value: 'rajshahi', label: 'Rajshahi' },
      { value: 'sylhet', label: 'Sylhet' },
      { value: 'barisal', label: 'Barisal' },
      { value: 'comilla', label: 'Comilla' },
      { value: 'mymensingh', label: 'Mymensingh' },
    ],
  },
  {
    value: 'id',
    label: 'Indonesia',
    code: 'ID',
    cities: [
      { value: 'jakarta', label: 'Jakarta' },
      { value: 'surabaya', label: 'Surabaya' },
      { value: 'bandung', label: 'Bandung' },
      { value: 'medan', label: 'Medan' },
      { value: 'semarang', label: 'Semarang' },
      { value: 'makassar', label: 'Makassar' },
      { value: 'palembang', label: 'Palembang' },
      { value: 'tangerang', label: 'Tangerang' },
    ],
  },
  {
    value: 'th',
    label: 'Thailand',
    code: 'TH',
    cities: [
      { value: 'bangkok', label: 'Bangkok' },
      { value: 'chiang-mai', label: 'Chiang Mai' },
      { value: 'phuket', label: 'Phuket' },
      { value: 'pattaya', label: 'Pattaya' },
      { value: 'hat-yai', label: 'Hat Yai' },
      { value: 'nakhon-ratchasima', label: 'Nakhon Ratchasima' },
      { value: 'udon-thani', label: 'Udon Thani' },
      { value: 'khon-kaen', label: 'Khon Kaen' },
    ],
  },
  {
    value: 'vn',
    label: 'Vietnam',
    code: 'VN',
    cities: [
      { value: 'ho-chi-minh', label: 'Ho Chi Minh City' },
      { value: 'hanoi', label: 'Hanoi' },
      { value: 'da-nang', label: 'Da Nang' },
      { value: 'haiphong', label: 'Haiphong' },
      { value: 'can-tho', label: 'Can Tho' },
      { value: 'nha-trang', label: 'Nha Trang' },
      { value: 'hue', label: 'Hue' },
      { value: 'vung-tau', label: 'Vung Tau' },
    ],
  },
  {
    value: 'ph',
    label: 'Philippines',
    code: 'PH',
    cities: [
      { value: 'manila', label: 'Manila' },
      { value: 'quezon-city', label: 'Quezon City' },
      { value: 'cebu', label: 'Cebu' },
      { value: 'davao', label: 'Davao' },
      { value: 'caloocan', label: 'Caloocan' },
      { value: 'zamboanga', label: 'Zamboanga' },
      { value: 'antipolo', label: 'Antipolo' },
      { value: 'pasig', label: 'Pasig' },
    ],
  },
  {
    value: 'my',
    label: 'Malaysia',
    code: 'MY',
    cities: [
      { value: 'kuala-lumpur', label: 'Kuala Lumpur' },
      { value: 'george-town', label: 'George Town' },
      { value: 'ipoh', label: 'Ipoh' },
      { value: 'shah-alam', label: 'Shah Alam' },
      { value: 'petaling-jaya', label: 'Petaling Jaya' },
      { value: 'johor-bahru', label: 'Johor Bahru' },
      { value: 'melaka', label: 'Melaka' },
      { value: 'kuching', label: 'Kuching' },
    ],
  },
  {
    value: 'sg',
    label: 'Singapore',
    code: 'SG',
    cities: [
      { value: 'singapore', label: 'Singapore' },
    ],
  },
  {
    value: 'ae',
    label: 'United Arab Emirates',
    code: 'AE',
    cities: [
      { value: 'dubai', label: 'Dubai' },
      { value: 'abu-dhabi', label: 'Abu Dhabi' },
      { value: 'sharjah', label: 'Sharjah' },
      { value: 'al-ain', label: 'Al Ain' },
      { value: 'ajman', label: 'Ajman' },
      { value: 'ras-al-khaimah', label: 'Ras Al Khaimah' },
    ],
  },
  {
    value: 'sa',
    label: 'Saudi Arabia',
    code: 'SA',
    cities: [
      { value: 'riyadh', label: 'Riyadh' },
      { value: 'jeddah', label: 'Jeddah' },
      { value: 'mecca', label: 'Mecca' },
      { value: 'medina', label: 'Medina' },
      { value: 'dammam', label: 'Dammam' },
      { value: 'khobar', label: 'Khobar' },
      { value: 'taif', label: 'Taif' },
      { value: 'abha', label: 'Abha' },
    ],
  },
  {
    value: 'tr',
    label: 'Turkey',
    code: 'TR',
    cities: [
      { value: 'istanbul', label: 'Istanbul' },
      { value: 'ankara', label: 'Ankara' },
      { value: 'izmir', label: 'İzmir' },
      { value: 'bursa', label: 'Bursa' },
      { value: 'antalya', label: 'Antalya' },
      { value: 'konya', label: 'Konya' },
      { value: 'adana', label: 'Adana' },
      { value: 'gaziantep', label: 'Gaziantep' },
    ],
  },
  
  // Oceania
  {
    value: 'au',
    label: 'Australia',
    code: 'AU',
    cities: [
      { value: 'sydney', label: 'Sydney' },
      { value: 'melbourne', label: 'Melbourne' },
      { value: 'brisbane', label: 'Brisbane' },
      { value: 'perth', label: 'Perth' },
      { value: 'adelaide', label: 'Adelaide' },
      { value: 'gold-coast', label: 'Gold Coast' },
      { value: 'newcastle', label: 'Newcastle' },
      { value: 'canberra', label: 'Canberra' },
      { value: 'sunshine-coast', label: 'Sunshine Coast' },
      { value: 'wollongong', label: 'Wollongong' },
    ],
  },
  {
    value: 'nz',
    label: 'New Zealand',
    code: 'NZ',
    cities: [
      { value: 'auckland', label: 'Auckland' },
      { value: 'wellington', label: 'Wellington' },
      { value: 'christchurch', label: 'Christchurch' },
      { value: 'hamilton', label: 'Hamilton' },
      { value: 'napier', label: 'Napier' },
      { value: 'dunedin', label: 'Dunedin' },
      { value: 'tauranga', label: 'Tauranga' },
      { value: 'lower-hutt', label: 'Lower Hutt' },
    ],
  },
  
  // South America
  {
    value: 'br',
    label: 'Brazil',
    code: 'BR',
    cities: [
      { value: 'sao-paulo', label: 'São Paulo' },
      { value: 'rio-de-janeiro', label: 'Rio de Janeiro' },
      { value: 'brasilia', label: 'Brasília' },
      { value: 'salvador', label: 'Salvador' },
      { value: 'fortaleza', label: 'Fortaleza' },
      { value: 'belo-horizonte', label: 'Belo Horizonte' },
      { value: 'manaus', label: 'Manaus' },
      { value: 'curitiba', label: 'Curitiba' },
      { value: 'recife', label: 'Recife' },
      { value: 'porto-alegre', label: 'Porto Alegre' },
    ],
  },
  {
    value: 'ar',
    label: 'Argentina',
    code: 'AR',
    cities: [
      { value: 'buenos-aires', label: 'Buenos Aires' },
      { value: 'cordoba', label: 'Córdoba' },
      { value: 'rosario', label: 'Rosario' },
      { value: 'mendoza', label: 'Mendoza' },
      { value: 'tucuman', label: 'Tucumán' },
      { value: 'la-plata', label: 'La Plata' },
      { value: 'mar-del-plata', label: 'Mar del Plata' },
      { value: 'salta', label: 'Salta' },
    ],
  },
  {
    value: 'co',
    label: 'Colombia',
    code: 'CO',
    cities: [
      { value: 'bogota', label: 'Bogotá' },
      { value: 'medellin', label: 'Medellín' },
      { value: 'cali', label: 'Cali' },
      { value: 'barranquilla', label: 'Barranquilla' },
      { value: 'cartagena', label: 'Cartagena' },
      { value: 'cucuta', label: 'Cúcuta' },
      { value: 'bucaramanga', label: 'Bucaramanga' },
      { value: 'pereira', label: 'Pereira' },
    ],
  },
  {
    value: 'cl',
    label: 'Chile',
    code: 'CL',
    cities: [
      { value: 'santiago', label: 'Santiago' },
      { value: 'valparaiso', label: 'Valparaíso' },
      { value: 'concepcion', label: 'Concepción' },
      { value: 'la-serena', label: 'La Serena' },
      { value: 'antofagasta', label: 'Antofagasta' },
      { value: 'temuco', label: 'Temuco' },
      { value: 'valdivia', label: 'Valdivia' },
      { value: 'arica', label: 'Arica' },
    ],
  },
  
  // Africa
  {
    value: 'eg',
    label: 'Egypt',
    code: 'EG',
    cities: [
      { value: 'cairo', label: 'Cairo' },
      { value: 'alexandria', label: 'Alexandria' },
      { value: 'giza', label: 'Giza' },
      { value: 'shubra-el-kheima', label: 'Shubra El Kheima' },
      { value: 'port-said', label: 'Port Said' },
      { value: 'suez', label: 'Suez' },
      { value: 'luxor', label: 'Luxor' },
      { value: 'aswan', label: 'Aswan' },
    ],
  },
  {
    value: 'za',
    label: 'South Africa',
    code: 'ZA',
    cities: [
      { value: 'johannesburg', label: 'Johannesburg' },
      { value: 'cape-town', label: 'Cape Town' },
      { value: 'durban', label: 'Durban' },
      { value: 'pretoria', label: 'Pretoria' },
      { value: 'port-elizabeth', label: 'Port Elizabeth' },
      { value: 'pietermaritzburg', label: 'Pietermaritzburg' },
      { value: 'bloemfontein', label: 'Bloemfontein' },
      { value: 'east-london', label: 'East London' },
    ],
  },
  {
    value: 'ng',
    label: 'Nigeria',
    code: 'NG',
    cities: [
      { value: 'lagos', label: 'Lagos' },
      { value: 'kano', label: 'Kano' },
      { value: 'ibadan', label: 'Ibadan' },
      { value: 'abuja', label: 'Abuja' },
      { value: 'port-harcourt', label: 'Port Harcourt' },
      { value: 'benin-city', label: 'Benin City' },
      { value: 'kaduna', label: 'Kaduna' },
      { value: 'abuja', label: 'Abuja' },
    ],
  },
  {
    value: 'ke',
    label: 'Kenya',
    code: 'KE',
    cities: [
      { value: 'nairobi', label: 'Nairobi' },
      { value: 'mombasa', label: 'Mombasa' },
      { value: 'kisumu', label: 'Kisumu' },
      { value: 'nakuru', label: 'Nakuru' },
      { value: 'eldoret', label: 'Eldoret' },
      { value: 'thika', label: 'Thika' },
      { value: 'malindi', label: 'Malindi' },
      { value: 'kitale', label: 'Kitale' },
    ],
  },
]

// Get cities for a country
export function getCitiesForCountry(countryValue: string): City[] {
  const country = countries.find(c => c.value === countryValue)
  return country?.cities || []
}

// Get all countries as options for select
export function getCountryOptions() {
  return countries.map(c => ({ value: c.value, label: c.label }))
}

// Get country by value
export function getCountryByValue(countryValue: string): Country | undefined {
  return countries.find(c => c.value === countryValue)
}

// Search countries by name (for future search functionality)
export function searchCountries(query: string) {
  const lowerQuery = query.toLowerCase()
  return countries.filter(c => 
    c.label.toLowerCase().includes(lowerQuery) ||
    c.code.toLowerCase().includes(lowerQuery)
  )
}
