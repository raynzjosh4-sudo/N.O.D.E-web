export interface ColorVariant {
  label: string;
  color: string;
}

export interface ColorGroup {
  color: ColorVariant;
  sizeQtys: { [size: string]: number };
}

export const DEFAULT_COLOR_VARIANTS: ColorVariant[] = [
  { label: 'Space Gray', color: '#4B4846' },
  { label: 'Matte Black', color: '#1E1E1E' },
  { label: 'Silver Metallic', color: '#D1D5DB' },
  { label: 'Navy Blue', color: '#1E3A8A' },
  { label: 'Rose Gold', color: '#F43F5E' },
];

export const DEFAULT_SIZES = ['Standard', 'Small', 'Medium', 'Large', 'Pack of 5', 'Master Carton (24)'];
