-- Migration: Add editorial metadata to POIs
-- Date: 2026-05-15

ALTER TABLE pois ADD COLUMN IF NOT EXISTS image_credit TEXT;
ALTER TABLE pois ADD COLUMN IF NOT EXISTS image_license TEXT;

-- Update the view if it's already there (though usually handled by Supabase)
-- NOTE: In a real environment, we'd also check the seo_city_routes view 
-- but here we assume the DB team handles the views sync.
