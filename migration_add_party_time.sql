-- Add time column to parties table
ALTER TABLE parties ADD COLUMN IF NOT EXISTS time text;
