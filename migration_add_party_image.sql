-- Add image_url column to parties table
ALTER TABLE parties ADD COLUMN IF NOT EXISTS image_url text;
