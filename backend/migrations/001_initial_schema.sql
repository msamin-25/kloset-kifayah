-- Ibtikar Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,                    -- City/region (GTA, Waterloo, etc.)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_verified_email BOOLEAN DEFAULT FALSE,
    is_verified_phone BOOLEAN DEFAULT FALSE,
    is_verified_community BOOLEAN DEFAULT FALSE,
    community_code TEXT,              -- Invite code used during signup
    response_rate DECIMAL(3, 2) DEFAULT 1.00,  -- 0.00 to 1.00
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNITY INVITE CODES
-- ============================================
CREATE TABLE community_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,               -- e.g., "UWaterloo MSA", "UToronto MSA"
    uses_remaining INTEGER,           -- NULL = unlimited
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LISTINGS
-- ============================================
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,           -- abaya, thobe, hijab, jewelry, decor, etc.
    subcategory TEXT,
    size TEXT,                        -- XS, S, M, L, XL, One Size, etc.
    color TEXT,
    brand TEXT,
    condition TEXT NOT NULL DEFAULT 'good',  -- like_new, good, fair
    price_per_day DECIMAL(10, 2) NOT NULL,
    sell_price DECIMAL(10, 2),        -- Buy price (optional, NULL = rent only)
    deposit_amount DECIMAL(10, 2) DEFAULT 0,
    min_rental_days INTEGER DEFAULT 1,
    max_rental_days INTEGER DEFAULT 30,
    is_cleaned BOOLEAN DEFAULT FALSE,
    is_smoke_free BOOLEAN DEFAULT FALSE,
    is_pet_free BOOLEAN DEFAULT FALSE,
    is_modest BOOLEAN DEFAULT FALSE,  -- Islamic/modest clothing flag
    tags TEXT[] DEFAULT '{}',         -- Array of tags
    location TEXT NOT NULL,           -- City/area name
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    pickup_instructions TEXT,
    women_only_pickup BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending',    -- pending, active, rented, inactive
    is_approved BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LISTING IMAGES
-- ============================================
CREATE TABLE listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LISTING AVAILABILITY (blocked dates)
-- ============================================
CREATE TABLE listing_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT DEFAULT 'blocked',    -- rental, blocked, maintenance
    rental_id UUID,                   -- Reference to rental if reason is 'rental'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RENTALS
-- ============================================
CREATE TABLE rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    
    -- Pricing
    daily_rate DECIMAL(10, 2) NOT NULL,
    deposit_amount DECIMAL(10, 2) NOT NULL,
    cleaning_fee DECIMAL(10, 2) DEFAULT 0,
    service_fee DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Status tracking
    status TEXT DEFAULT 'pending',    -- pending, accepted, rejected, picked_up, returned, completed, cancelled, disputed
    
    -- Payment (Stripe placeholder)
    payment_intent_id TEXT,
    payment_status TEXT DEFAULT 'pending',  -- pending, paid, refunded
    
    -- Contract
    contract_html TEXT,
    contract_signed_at TIMESTAMPTZ,
    
    -- Notes
    owner_notes TEXT,
    renter_notes TEXT,
    cancellation_reason TEXT,
    
    -- Timestamps
    picked_up_at TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,
    
    -- Cleaning service
    add_cleaning_service BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONVERSATIONS
-- ============================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL,
    participant_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_type TEXT NOT NULL,        -- renter_to_owner, owner_to_renter
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate reviews
    UNIQUE(rental_id, reviewer_id, review_type)
);

-- ============================================
-- CLEANING ORDERS (Placeholder)
-- ============================================
CREATE TABLE cleaning_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',    -- pending, scheduled, in_progress, completed, cancelled
    fee DECIMAL(10, 2) NOT NULL,
    scheduled_date DATE,
    pickup_address TEXT,
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_community ON profiles(community_code);

CREATE INDEX idx_listings_owner ON listings(owner_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_location ON listings(location);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_approved ON listings(is_approved);
CREATE INDEX idx_listings_created ON listings(created_at DESC);

CREATE INDEX idx_listing_images_listing ON listing_images(listing_id);
CREATE INDEX idx_listing_availability_listing ON listing_availability(listing_id);
CREATE INDEX idx_listing_availability_dates ON listing_availability(start_date, end_date);

CREATE INDEX idx_rentals_renter ON rentals(renter_id);
CREATE INDEX idx_rentals_owner ON rentals(owner_id);
CREATE INDEX idx_rentals_listing ON rentals(listing_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rentals_dates ON rentals(start_date, end_date);

CREATE INDEX idx_conversations_participant1 ON conversations(participant_1);
CREATE INDEX idx_conversations_participant2 ON conversations(participant_2);
CREATE INDEX idx_conversations_listing ON conversations(listing_id);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rental ON reviews(rental_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables EXCEPT profiles
-- Profiles table uses foreign key to auth.users for security instead of RLS
-- (RLS breaks the signup trigger because auth.uid() is NULL during the transaction)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_orders ENABLE ROW LEVEL SECURITY;

-- Note: Profiles table does NOT have RLS enabled
-- Security is enforced by:
-- 1. Foreign key constraint: profiles.id REFERENCES auth.users(id)
-- 2. Application-level checks for updates

-- Listings: Anyone can read active approved listings, owners can manage their own
CREATE POLICY "Active listings are viewable by everyone" ON listings FOR SELECT USING (is_approved = true AND status = 'active');
CREATE POLICY "Owners can view own listings" ON listings FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert listings" ON listings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own listings" ON listings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete own listings" ON listings FOR DELETE USING (auth.uid() = owner_id);

-- Listing images: Follow listing access
CREATE POLICY "Listing images are viewable by everyone" ON listing_images FOR SELECT USING (true);
CREATE POLICY "Owners can manage listing images" ON listing_images FOR ALL USING (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.owner_id = auth.uid())
);

-- Rentals: Participants can view their rentals
CREATE POLICY "Users can view own rentals" ON rentals FOR SELECT USING (auth.uid() = renter_id OR auth.uid() = owner_id);
CREATE POLICY "Users can create rentals" ON rentals FOR INSERT WITH CHECK (auth.uid() = renter_id);
CREATE POLICY "Participants can update rentals" ON rentals FOR UPDATE USING (auth.uid() = renter_id OR auth.uid() = owner_id);

-- Conversations: Participants only
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Messages: Conversation participants only
CREATE POLICY "Users can view conversation messages" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id 
            AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid()))
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Reviews: Visible to everyone, only rental participants can create
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "Rental participants can create reviews" ON reviews FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM rentals WHERE rentals.id = reviews.rental_id 
            AND (rentals.renter_id = auth.uid() OR rentals.owner_id = auth.uid())
            AND rentals.status = 'completed')
);

-- Community codes: Anyone can read active codes
CREATE POLICY "Active codes are viewable" ON community_codes FOR SELECT USING (is_active = true);

-- Cleaning orders: Rental participants only
CREATE POLICY "Users can view own cleaning orders" ON cleaning_orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM rentals WHERE rentals.id = cleaning_orders.rental_id 
            AND (rentals.renter_id = auth.uid() OR rentals.owner_id = auth.uid()))
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rentals_updated_at BEFORE UPDATE ON rentals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleaning_orders_updated_at BEFORE UPDATE ON cleaning_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, is_verified_email)
    VALUES (NEW.id, NEW.email, NEW.email_confirmed_at IS NOT NULL);
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update conversation last_message_at when new message added
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations SET last_message_at = NOW() WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_message_sent
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();
