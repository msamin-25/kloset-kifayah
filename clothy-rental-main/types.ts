
export enum Category {
  WOMEN = 'Women',
  MEN = 'Men',
  MODEST_WOMEN = 'Modest (Women)',
  MODEST_MEN = 'Modest (Men)',
  ACCESSORIES = 'Accessories'
}

export enum ListingType {
  RENT = 'Rent',
  SELL = 'Buy'
}

export interface Product {
  id: string;
  name: string;
  description: string;
  rentPrice: number;
  sellPrice: number;
  category: Category;
  image: string;
  isIslamic: boolean;
  rentalPeriod: string;
  brand: string;
  tags: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
