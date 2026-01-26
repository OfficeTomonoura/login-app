-- Migration: Normalize Categories (ID Reference)

-- 1. Create master_categories table (if not exists)
CREATE TABLE IF NOT EXISTS master_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_order integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE master_categories ENABLE ROW LEVEL SECURITY;

-- Policies for master_categories
DROP POLICY IF EXISTS "Categories select policy" ON master_categories;
CREATE POLICY "Categories select policy" ON master_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Categories modify policy" ON master_categories;
CREATE POLICY "Categories modify policy" ON master_categories FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_master_categories_display_order ON master_categories(display_order);

-- 2. Insert initial data (from existing usage)
-- Ensure '委員会', '三役', '出向', 'その他' exist
INSERT INTO master_categories (name, display_order) VALUES
  ('委員会', 1),
  ('三役', 2),
  ('出向', 3),
  ('その他', 4)
ON CONFLICT (name) DO NOTHING;

-- 3. Add category_id to master_committees
ALTER TABLE master_committees ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES master_categories(id);

-- 4. Migrate data: text -> uuid
-- Update category_id based on the matching name in master_categories
UPDATE master_committees
SET category_id = master_categories.id
FROM master_categories
WHERE master_committees.category = master_categories.name;

-- 5. Drop old text column
-- WARNING: This deletes the old 'category' column. Ensure migration was successful.
ALTER TABLE master_committees DROP COLUMN IF EXISTS category;
