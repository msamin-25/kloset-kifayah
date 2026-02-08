-- ============================================
-- ADD NEW COLUMNS TO LISTINGS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Add sell_price column (for buy option)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sell_price DECIMAL(10, 2);

-- Add is_modest column (for Islamic/modest filter)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_modest BOOLEAN DEFAULT FALSE;

-- Add tags column (array of tags)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listings' 
AND column_name IN ('sell_price', 'is_modest', 'tags');
