// Unified types for Kloset Kifayah - combines UI with Supabase backend

// ============================================
// BACKWARDS COMPATIBLE ENUMS (for old code)
// ============================================
export enum ListingCategory {
    HIJAB = 'hijab',
    ABAYA = 'abaya',
    THOBE = 'thobe',
    EVENT_WEAR = 'event_wear',
    PRAYER_ITEMS = 'prayer_items',
    ACCESSORIES = 'accessories'
}

export enum ListingCondition {
    LIKE_NEW = 'like_new',
    GOOD = 'good',
    WORN = 'worn'
}

export enum ListingStatus {
    ACTIVE = 'active',
    RENTED = 'rented',
    INACTIVE = 'inactive'
}

// ============================================
// NEW TYPES (kloset-kifayah style)
// ============================================
export type ListingMode = 'buy' | 'rent' | 'borrow';
export type Category = 'hijab' | 'abaya' | 'thobe' | 'dress' | 'jewelry' | 'decor' | 'event_wear' | 'prayer_items' | 'accessories' | 'other';
export type Condition = 'new' | 'like_new' | 'good' | 'worn';
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'one_size';

// Display names for categories
export const CategoryDisplayNames: Record<string, string> = {
    all: 'All',
    hijab: 'Hijab',
    abaya: 'Abaya',
    thobe: 'Thobe',
    dress: 'Dress',
    jewelry: 'Jewelry',
    decor: 'Decor',
    event_wear: 'Event Wear',
    prayer_items: 'Prayer Items',
    accessories: 'Accessories',
    other: 'Other'
};

// User profile (maps to Supabase profiles table)
export interface User {
    id: string;
    email: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    bio?: string;
    phone?: string;
    is_verified_email?: boolean;
    is_verified_phone?: boolean;
    is_verified_community?: boolean;
    community_code?: string;
    response_rate?: number;
    created_at?: string;
    updated_at?: string;
    // UI-only fields for following feature
    followers?: string[];
    following?: string[];
}

// Listing image
export interface ListingImage {
    id: string;
    listing_id: string;
    image_url: string;
    display_order: number;
    created_at?: string;
}

// Listing (maps to Supabase listings table)
export interface Listing {
    id: string;
    owner_id: string;
    title: string;
    description?: string;
    category: Category | ListingCategory | string;
    subcategory?: string | null;
    size?: Size | string | null;
    color?: string | null;
    brand?: string | null;
    condition: Condition | ListingCondition | string;
    // Pricing - supports buy/rent/borrow modes
    mode?: ListingMode;
    price_per_day: number;        // Rental price
    sell_price?: number | null;          // Buy price (optional)
    deposit_amount?: number | null;      // Borrow deposit
    min_rental_days?: number | null;
    max_rental_days?: number | null;
    // Modesty & features
    is_modest?: boolean | null;
    is_cleaned?: boolean | null;
    is_smoke_free?: boolean | null;
    is_pet_free?: boolean | null;
    tags?: string[] | null;
    // Location
    location: string;
    latitude?: number | null;
    longitude?: number | null;
    pickup_instructions?: string | null;
    women_only_pickup?: boolean | null;
    shipping_available?: boolean | null;
    // Status
    status?: string | ListingStatus;
    is_approved?: boolean | null;
    view_count?: number | null;
    // Timestamps
    created_at?: string;
    updated_at?: string;
    // Relations
    listing_images?: ListingImage[];
    // UI-only: for favorites/saved
    savedBy?: string[];
}

// Message
export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read?: boolean;
    created_at: string;
}

// Conversation/Thread
export interface Conversation {
    id: string;
    listing_id?: string;
    rental_id?: string;
    participant_1: string;
    participant_2: string;
    last_message_at?: string;
    created_at?: string;
    messages?: Message[];
}

// Rental
export interface Rental {
    id: string;
    listing_id: string;
    renter_id: string;
    owner_id: string;
    start_date: string;
    end_date: string;
    total_days: number;
    daily_rate: number;
    deposit_amount: number;
    cleaning_fee?: number;
    service_fee?: number;
    total_amount: number;
    status: string;
    payment_intent_id?: string;
    payment_status?: string;
    created_at?: string;
    updated_at?: string;
}

// Review
export interface Review {
    id: string;
    rental_id: string;
    reviewer_id: string;
    reviewee_id: string;
    rating: number;
    comment?: string;
    review_type: 'renter_to_owner' | 'owner_to_renter';
    is_visible?: boolean;
    created_at?: string;
}

// Favorite
export interface Favorite {
    id: string;
    user_id: string;
    listing_id: string;
    created_at?: string;
}

// Helper: Convert backend listing to UI format
export function listingToUI(listing: Listing): Listing & { photos: string[] } {
    return {
        ...listing,
        photos: listing.listing_images?.map(img => img.image_url) || [],
        mode: listing.sell_price ? 'buy' : listing.deposit_amount ? 'borrow' : 'rent',
        savedBy: listing.savedBy || []
    };
}

// Helper: Format condition for display
export function formatCondition(condition: Condition | ListingCondition | string): string {
    const map: Record<string, string> = {
        'new': 'New',
        'like_new': 'Like New',
        'good': 'Good',
        'worn': 'Worn'
    };
    return map[condition] || condition;
}

// Helper: Format size for display
export function formatSize(size: Size | string): string {
    return size === 'one_size' ? 'One Size' : size;
}
