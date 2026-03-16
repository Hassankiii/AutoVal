export interface ScrapeTarget {
  make: string;
  dubizzleMake: string; // URL slug used by Dubizzle
  models: { name: string; dubizzleModel: string }[];
}

export const SCRAPE_TARGETS: ScrapeTarget[] = [
  {
    make: "Toyota",
    dubizzleMake: "toyota",
    models: [
      { name: "Camry", dubizzleModel: "camry" },
      { name: "Corolla", dubizzleModel: "corolla" },
      { name: "Land Cruiser", dubizzleModel: "land-cruiser" },
      { name: "Prado", dubizzleModel: "land-cruiser-prado" },
      { name: "Hilux", dubizzleModel: "hilux" },
      { name: "RAV4", dubizzleModel: "rav-4" },
      { name: "Fortuner", dubizzleModel: "fortuner" },
    ],
  },
  {
    make: "Nissan",
    dubizzleMake: "nissan",
    models: [
      { name: "Patrol", dubizzleModel: "patrol" },
      { name: "Altima", dubizzleModel: "altima" },
      { name: "Sunny", dubizzleModel: "sunny" },
      { name: "X-Trail", dubizzleModel: "x-trail" },
      { name: "Pathfinder", dubizzleModel: "pathfinder" },
      { name: "Navara", dubizzleModel: "navara" },
    ],
  },
  {
    make: "Honda",
    dubizzleMake: "honda",
    models: [
      { name: "Accord", dubizzleModel: "accord" },
      { name: "Civic", dubizzleModel: "civic" },
      { name: "CR-V", dubizzleModel: "cr-v" },
      { name: "Pilot", dubizzleModel: "pilot" },
    ],
  },
  {
    make: "Lexus",
    dubizzleMake: "lexus",
    models: [
      { name: "ES", dubizzleModel: "es" },
      { name: "LX", dubizzleModel: "lx" },
      { name: "RX", dubizzleModel: "rx" },
      { name: "GX", dubizzleModel: "gx" },
      { name: "IS", dubizzleModel: "is" },
    ],
  },
  {
    make: "BMW",
    dubizzleMake: "bmw",
    models: [
      { name: "3 Series", dubizzleModel: "3-series" },
      { name: "5 Series", dubizzleModel: "5-series" },
      { name: "7 Series", dubizzleModel: "7-series" },
      { name: "X5", dubizzleModel: "x5" },
      { name: "X3", dubizzleModel: "x3" },
    ],
  },
  {
    make: "Mercedes-Benz",
    dubizzleMake: "mercedes-benz",
    models: [
      { name: "C-Class", dubizzleModel: "c-class" },
      { name: "E-Class", dubizzleModel: "e-class" },
      { name: "S-Class", dubizzleModel: "s-class" },
      { name: "GLE", dubizzleModel: "gle" },
      { name: "GLC", dubizzleModel: "glc" },
    ],
  },
  {
    make: "Audi",
    dubizzleMake: "audi",
    models: [
      { name: "A4", dubizzleModel: "a4" },
      { name: "A6", dubizzleModel: "a6" },
      { name: "Q5", dubizzleModel: "q5" },
      { name: "Q7", dubizzleModel: "q7" },
    ],
  },
  {
    make: "Volkswagen",
    dubizzleMake: "volkswagen",
    models: [
      { name: "Tiguan", dubizzleModel: "tiguan" },
      { name: "Passat", dubizzleModel: "passat" },
      { name: "Touareg", dubizzleModel: "touareg" },
    ],
  },
  {
    make: "Ford",
    dubizzleMake: "ford",
    models: [
      { name: "F-150", dubizzleModel: "f-150" },
      { name: "Explorer", dubizzleModel: "explorer" },
      { name: "Expedition", dubizzleModel: "expedition" },
      { name: "Mustang", dubizzleModel: "mustang" },
    ],
  },
  {
    make: "Chevrolet",
    dubizzleMake: "chevrolet",
    models: [
      { name: "Tahoe", dubizzleModel: "tahoe" },
      { name: "Suburban", dubizzleModel: "suburban" },
      { name: "Camaro", dubizzleModel: "camaro" },
      { name: "Malibu", dubizzleModel: "malibu" },
    ],
  },
  {
    make: "Dodge",
    dubizzleMake: "dodge",
    models: [
      { name: "Charger", dubizzleModel: "charger" },
      { name: "Challenger", dubizzleModel: "challenger" },
      { name: "Durango", dubizzleModel: "durango" },
    ],
  },
  {
    make: "Hyundai",
    dubizzleMake: "hyundai",
    models: [
      { name: "Sonata", dubizzleModel: "sonata" },
      { name: "Tucson", dubizzleModel: "tucson" },
      { name: "Elantra", dubizzleModel: "elantra" },
      { name: "Santa Fe", dubizzleModel: "santa-fe" },
      { name: "Palisade", dubizzleModel: "palisade" },
    ],
  },
  {
    make: "Kia",
    dubizzleMake: "kia",
    models: [
      { name: "Sportage", dubizzleModel: "sportage" },
      { name: "Sorento", dubizzleModel: "sorento" },
      { name: "Cerato", dubizzleModel: "cerato" },
      { name: "Telluride", dubizzleModel: "telluride" },
    ],
  },
  {
    make: "Mitsubishi",
    dubizzleMake: "mitsubishi",
    models: [
      { name: "Pajero", dubizzleModel: "pajero" },
      { name: "Outlander", dubizzleModel: "outlander" },
      { name: "Eclipse Cross", dubizzleModel: "eclipse-cross" },
    ],
  },
  {
    make: "Land Rover",
    dubizzleMake: "land-rover",
    models: [
      { name: "Defender", dubizzleModel: "defender" },
      { name: "Discovery", dubizzleModel: "discovery" },
      { name: "Range Rover", dubizzleModel: "range-rover" },
      { name: "Range Rover Sport", dubizzleModel: "range-rover-sport" },
    ],
  },
  {
    make: "Porsche",
    dubizzleMake: "porsche",
    models: [
      { name: "Cayenne", dubizzleModel: "cayenne" },
      { name: "Panamera", dubizzleModel: "panamera" },
      { name: "Macan", dubizzleModel: "macan" },
    ],
  },
  {
    make: "Genesis",
    dubizzleMake: "genesis",
    models: [
      { name: "G80", dubizzleModel: "g80" },
      { name: "GV80", dubizzleModel: "gv80" },
      { name: "G70", dubizzleModel: "g70" },
    ],
  },
];

export const SCRAPE_CONFIG = {
  yearsFrom: 2010,
  yearsTo: new Date().getFullYear(),
  maxPagesPerSearch: 10,
  requestDelayMs: 1500,
  baseUrl: "https://uae.dubizzle.com/motors/used-cars/",
};
