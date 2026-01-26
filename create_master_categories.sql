-- Create master_categories table
CREATE TABLE IF NOT EXISTS master_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_order integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE master_categories ENABLE ROW LEVEL SECURITY;

-- Policies
-- Select: Public (everyone can see options)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON master_categories;
CREATE POLICY "Categories are viewable by everyone"
  ON master_categories FOR SELECT
  USING (true);

-- Insert/Update/Delete: Authenticated users only
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON master_categories;
CREATE POLICY "Authenticated users can manage categories"
  ON master_categories FOR ALL
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_master_categories_display_order ON master_categories(display_order);

-- Initial Data (Sync with current hardcoded usage)
INSERT INTO master_categories (name, display_order) VALUES
  ('委員会', 1),
  ('三役', 2),
  ('出向', 3),
  ('その他', 4)
ON CONFLICT (name) DO NOTHING;
