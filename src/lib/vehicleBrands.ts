export const VEHICLE_BRANDS = {
  auto: [
    'Audi',
    'BMW',
    'Citroën',
    'Dacia',
    'Ford',
    'Honda',
    'Hyundai',
    'Kia',
    'Mazda',
    'Mercedes-Benz',
    'Opel',
    'Porsche',
    'Renault',
    'Skoda',
    'Smart',
    'Toyota',
    'Volkswagen',
    'Volvo',
    'Andere',
  ],
  motorrad: [
    'BMW',
    'Ducati',
    'Honda',
    'Kawasaki',
    'KTM',
    'Suzuki',
    'Yamaha',
    'Andere',
  ],
  baumaschine: [
    'Caterpillar',
    'JCB',
    'Komatsu',
    'Liebherr',
    'Takeuchi',
    'Volvo',
    'Andere',
  ],
} as const;

export const VEHICLE_TYPE_LABELS = {
  auto: 'Fahrzeug',
  motorrad: 'Motorrad',
  baumaschine: 'Baumaschine',
} as const;

export type VehicleType = keyof typeof VEHICLE_BRANDS;
