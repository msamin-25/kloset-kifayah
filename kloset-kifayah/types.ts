
export type ListingMode = 'buy' | 'rent' | 'borrow';
export type Category = 'hijab' | 'abaya' | 'thobe' | 'dress' | 'other';
export type Condition = 'new' | 'like new' | 'good' | 'worn';
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'one size';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  location: string;
  bio: string;
  followers: string[]; // User IDs
  following: string[]; // User IDs
}

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  category: Category;
  mode: ListingMode;
  priceBuy?: number;
  priceRentPerDay?: number;
  depositBorrow?: number;
  size: Size;
  condition: Condition;
  description: string;
  photos: string[];
  location: string;
  shippingAvailable: boolean;
  createdAt: string;
  savedBy: string[]; // User IDs
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface MessageThread {
  id: string;
  listingId: string;
  participantIds: string[];
  messages: Message[];
}
