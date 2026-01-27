-- ============================================
-- Party Tracker Migration
-- ============================================
-- 懇親会記録機能（Party Tracker）用のテーブルとポリシーを作成します。

-- 1. parties テーブル
CREATE TABLE IF NOT EXISTS parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  name text NOT NULL,
  description text,
  url text,
  address text,
  date date,
  budget text,
  rating integer,
  status text CHECK (status IN ('visited', 'planned')),
  created_by uuid REFERENCES profiles(id),
  committee_id uuid, -- 委員会ID（Optional, 将来的な拡張用）
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS有効化
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

-- 閲覧: 全員可能
DROP POLICY IF EXISTS "Parties are viewable by everyone" ON parties;
CREATE POLICY "Parties are viewable by everyone"
  ON parties FOR SELECT
  USING (true);

-- 作成: 認証済みユーザー
DROP POLICY IF EXISTS "Authenticated users can create parties" ON parties;
CREATE POLICY "Authenticated users can create parties"
  ON parties FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 更新: 作成者のみ
DROP POLICY IF EXISTS "Users can update own parties" ON parties;
CREATE POLICY "Users can update own parties"
  ON parties FOR UPDATE
  USING (auth.uid() = created_by);

-- 削除: 作成者のみ
DROP POLICY IF EXISTS "Users can delete own parties" ON parties;
CREATE POLICY "Users can delete own parties"
  ON parties FOR DELETE
  USING (auth.uid() = created_by);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_parties_date ON parties(date DESC);
CREATE INDEX IF NOT EXISTS idx_parties_created_by ON parties(created_by);
CREATE INDEX IF NOT EXISTS idx_parties_status ON parties(status);


-- 2. party_participants テーブル（中間テーブル）
CREATE TABLE IF NOT EXISTS party_participants (
  party_id uuid REFERENCES parties(id) ON DELETE CASCADE,
  member_id uuid REFERENCES jc_members(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (party_id, member_id)
);

-- RLS有効化
ALTER TABLE party_participants ENABLE ROW LEVEL SECURITY;

-- 閲覧: 全員可能
DROP POLICY IF EXISTS "Party participants are viewable by everyone" ON party_participants;
CREATE POLICY "Party participants are viewable by everyone"
  ON party_participants FOR SELECT
  USING (true);

-- 追加・削除: 認証済みユーザー（自分が作成したPartyに対してのみ、という厳密なルールも可能だが、
-- 運用上、他のメンバーが編集するケースも考慮し、一旦認証ユーザーなら操作可能とするか、
-- あるいはPartyの作成者のみ許可するか。ここではシンプルに認証ユーザー許可とし、アプリ側で制御する）
-- ※より厳密にするなら: USING (EXISTS (SELECT 1 FROM parties WHERE id = party_id AND created_by = auth.uid()))
DROP POLICY IF EXISTS "Authenticated users can manage participants" ON party_participants;
CREATE POLICY "Authenticated users can manage participants"
  ON party_participants FOR ALL
  USING (auth.role() = 'authenticated');


-- 3. Storage Bucket (party-photos)
-- Note: Storage buckets are often managed via UI, but trying SQL insertion here.
INSERT INTO storage.buckets (id, name, public)
VALUES ('party-photos', 'party-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Party Photos Public Access" ON storage.objects;
CREATE POLICY "Party Photos Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'party-photos');

DROP POLICY IF EXISTS "Authenticated users can upload party photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload party photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'party-photos' 
    AND auth.role() = 'authenticated'
  );
