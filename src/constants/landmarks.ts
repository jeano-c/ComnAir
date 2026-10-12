export interface Landmark {
  id: string;
  name: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
}

export const REGIONS = [
  "Metro Manila",
  "Central Luzon",
  "Calabarzon (Southern Luzon)",
  "Northern Luzon",
  "Visayas (Cebu / Iloilo)",
  "Mindanao (Davao / CDO)",
] as const;

export type RegionName = (typeof REGIONS)[number];

export const LANDMARKS: Landmark[] = [
  // Metro Manila
  {
    id: "qc-circle",
    name: "Quezon Memorial Circle",
    city: "Quezon City",
    region: "Metro Manila",
    lat: 14.6515,
    lng: 121.0494,
  },
  {
    id: "qc-up-diliman",
    name: "UP Diliman (Katipunan)",
    city: "Quezon City",
    region: "Metro Manila",
    lat: 14.6538,
    lng: 121.0685,
  },
  {
    id: "qc-sm-north",
    name: "SM North EDSA / Trinoma",
    city: "Quezon City",
    region: "Metro Manila",
    lat: 14.6558,
    lng: 121.0315,
  },
  {
    id: "mnl-rizal-park",
    name: "Rizal Park (Luneta)",
    city: "Manila",
    region: "Metro Manila",
    lat: 14.5831,
    lng: 120.9794,
  },
  {
    id: "mnl-ust",
    name: "University of Santo Tomas",
    city: "Manila",
    region: "Metro Manila",
    lat: 14.6099,
    lng: 120.9897,
  },
  {
    id: "mnl-binondo",
    name: "Binondo / Chinatown",
    city: "Manila",
    region: "Metro Manila",
    lat: 14.6001,
    lng: 120.9754,
  },
  {
    id: "tgg-bgc",
    name: "Bonifacio Global City (BGC High Street)",
    city: "Taguig",
    region: "Metro Manila",
    lat: 14.5505,
    lng: 121.0509,
  },
  {
    id: "mkt-ayala-triangle",
    name: "Ayala Triangle Gardens",
    city: "Makati",
    region: "Metro Manila",
    lat: 14.5574,
    lng: 121.0227,
  },
  {
    id: "psg-ortigas-center",
    name: "Ortigas Center (Robinsons Galleria)",
    city: "Pasig",
    region: "Metro Manila",
    lat: 14.5901,
    lng: 121.0601,
  },
  {
    id: "mrk-marikina-riverbanks",
    name: "Marikina Riverbanks Center",
    city: "Marikina",
    region: "Metro Manila",
    lat: 14.6309,
    lng: 121.0858,
  },
  {
    id: "clc-monumento",
    name: "Monumento Circle",
    city: "Caloocan",
    region: "Metro Manila",
    lat: 14.6575,
    lng: 120.9835,
  },
  {
    id: "psy-moa",
    name: "SM Mall of Asia / Bay City",
    city: "Pasay",
    region: "Metro Manila",
    lat: 14.5352,
    lng: 120.9822,
  },
  {
    id: "psy-naia",
    name: "NAIA Terminal 3",
    city: "Pasay",
    region: "Metro Manila",
    lat: 14.5208,
    lng: 121.0152,
  },
  {
    id: "aln-alabang-town",
    name: "Alabang Town Center / Filinvest",
    city: "Muntinlupa",
    region: "Metro Manila",
    lat: 14.4257,
    lng: 121.0298,
  },

  // Central Luzon
  {
    id: "cl-clark-freeport",
    name: "Clark Freeport Zone (CDC)",
    city: "Angeles / Mabalacat",
    region: "Central Luzon",
    lat: 15.1856,
    lng: 120.5404,
  },
  {
    id: "cl-san-fernando",
    name: "San Fernando City Capitol",
    city: "San Fernando",
    region: "Central Luzon",
    lat: 15.0292,
    lng: 120.6908,
  },
  {
    id: "cl-subic-bay",
    name: "Subic Bay Freeport Zone (SBFZ)",
    city: "Olongapo",
    region: "Central Luzon",
    lat: 14.8217,
    lng: 120.2818,
  },
  {
    id: "cl-malolos",
    name: "Barasoain Church / Malolos Historic Center",
    city: "Malolos",
    region: "Central Luzon",
    lat: 14.8466,
    lng: 120.8122,
  },

  // Calabarzon
  {
    id: "cal-tagaytay",
    name: "Tagaytay Ridge / Picnic Grove",
    city: "Tagaytay",
    region: "Calabarzon (Southern Luzon)",
    lat: 14.1352,
    lng: 120.9782,
  },
  {
    id: "cal-nuvali",
    name: "Nuvali Commercial Hub",
    city: "Santa Rosa",
    region: "Calabarzon (Southern Luzon)",
    lat: 14.2415,
    lng: 121.0583,
  },
  {
    id: "cal-antipolo",
    name: "Antipolo Cathedral",
    city: "Antipolo",
    region: "Calabarzon (Southern Luzon)",
    lat: 14.5878,
    lng: 121.1764,
  },
  {
    id: "cal-batangas-port",
    name: "Batangas International Port",
    city: "Batangas City",
    region: "Calabarzon (Southern Luzon)",
    lat: 13.7548,
    lng: 121.0475,
  },

  // Northern Luzon
  {
    id: "nl-baguio-burnham",
    name: "Burnham Park / Session Road",
    city: "Baguio City",
    region: "Northern Luzon",
    lat: 16.4124,
    lng: 120.5936,
  },
  {
    id: "nl-vigan-calle-crisologo",
    name: "Calle Crisologo Heritage District",
    city: "Vigan City",
    region: "Northern Luzon",
    lat: 17.5714,
    lng: 120.3887,
  },
  {
    id: "nl-la-union-san-juan",
    name: "San Juan Surf Town",
    city: "San Juan, La Union",
    region: "Northern Luzon",
    lat: 16.6669,
    lng: 120.3204,
  },

  // Visayas
  {
    id: "vis-cebu-it-park",
    name: "Cebu I.T. Park",
    city: "Cebu City",
    region: "Visayas (Cebu / Iloilo)",
    lat: 10.3297,
    lng: 123.9066,
  },
  {
    id: "vis-cebu-fuente",
    name: "Fuente Osmeña Circle",
    city: "Cebu City",
    region: "Visayas (Cebu / Iloilo)",
    lat: 10.3116,
    lng: 123.8932,
  },
  {
    id: "vis-iloilo-business-park",
    name: "Iloilo Business Park (Megaworld)",
    city: "Iloilo City",
    region: "Visayas (Cebu / Iloilo)",
    lat: 10.7167,
    lng: 122.5489,
  },

  // Mindanao
  {
    id: "min-davao-peoples-park",
    name: "People's Park Davao",
    city: "Davao City",
    region: "Mindanao (Davao / CDO)",
    lat: 7.0706,
    lng: 125.6094,
  },
  {
    id: "min-cdo-divisoria",
    name: "Plaza Divisoria / Gaston Park",
    city: "Cagayan de Oro",
    region: "Mindanao (Davao / CDO)",
    lat: 8.4777,
    lng: 124.6468,
  },
];
