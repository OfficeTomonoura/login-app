-- ============================================
-- Supabase Database Schema for 25JC
-- ============================================
-- Created: 2026-01-24
-- Description: Complete database schema including
--              profiles, posts, and master tables
--              (Idempotent version: Safe to run multiple times)
-- ============================================

-- ============================================
-- 1. profiles テーブル
-- ============================================
-- ユーザーの基本プロフィール情報
-- auth.users と id で紐付け

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  name text NOT NULL,
  avatar_url text,
  phone text,
  address text,
  company_name text,
  last_name text,
  first_name text,
  last_name_kana text,
  first_name_kana text,
  birth_date date,
  committees jsonb DEFAULT '[]'::jsonb,
  is_first_login boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 既存テーブルへのカラム追加（マイグレーション用）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
    ALTER TABLE profiles ADD COLUMN company_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name_kana') THEN
    ALTER TABLE profiles ADD COLUMN last_name_kana text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name_kana') THEN
    ALTER TABLE profiles ADD COLUMN first_name_kana text;
  END IF;
END $$;

-- RLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- プロフィールの閲覧: 全員可能
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- プロフィールの更新: 本人のみ
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- プロフィールの作成: 本人のみ（Upsert用）
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- 2. posts テーブル
-- ============================================
-- 掲示板の投稿データ

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('report', 'request', 'notice')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  author_name text,
  author_avatar text,
  reactions jsonb DEFAULT '[]'::jsonb,
  favorites jsonb DEFAULT '[]'::jsonb,
  target_users jsonb DEFAULT '[]'::jsonb,
  target_committees jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- RLS有効化
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 投稿の閲覧: 全員可能
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

-- 投稿の作成: 認証済みユーザー
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- 投稿の更新: 作成者のみ
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

-- 投稿の削除: 作成者のみ
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);

-- ============================================
-- 3. master_committees テーブル
-- ============================================
-- 委員会マスターデータ

CREATE TABLE IF NOT EXISTS master_committees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  name text NOT NULL,
  category text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(year, name)
);

-- RLS有効化
ALTER TABLE master_committees ENABLE ROW LEVEL SECURITY;

-- 委員会マスターの閲覧: 全員可能
DROP POLICY IF EXISTS "Committees are viewable by everyone" ON master_committees;
CREATE POLICY "Committees are viewable by everyone"
  ON master_committees FOR SELECT
  USING (true);

-- 委員会マスターの追加: 認証済みユーザー
DROP POLICY IF EXISTS "Authenticated users can create committees" ON master_committees;
CREATE POLICY "Authenticated users can create committees"
  ON master_committees FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- インデックス
CREATE INDEX IF NOT EXISTS idx_master_committees_year ON master_committees(year DESC);
CREATE INDEX IF NOT EXISTS idx_master_committees_name ON master_committees(name);

-- ============================================
-- 4. master_roles テーブル
-- ============================================
-- 役職マスターデータ

CREATE TABLE IF NOT EXISTS master_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_order integer,
  created_at timestamptz DEFAULT now()
);

-- RLS有効化
ALTER TABLE master_roles ENABLE ROW LEVEL SECURITY;

-- 役職マスターの閲覧: 全員可能
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON master_roles;
CREATE POLICY "Roles are viewable by everyone"
  ON master_roles FOR SELECT
  USING (true);

-- 役職マスターの追加: 認証済みユーザー
DROP POLICY IF EXISTS "Authenticated users can create roles" ON master_roles;
CREATE POLICY "Authenticated users can create roles"
  ON master_roles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- インデックス
CREATE INDEX IF NOT EXISTS idx_master_roles_display_order ON master_roles(display_order);

-- ============================================
-- 5. トリガー関数
-- ============================================

-- プロフィール自動作成トリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, is_first_login)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー作成（既存のトリガーがあれば削除して再作成）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 更新日時の自動設定
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- postsテーブルに適用
DROP TRIGGER IF EXISTS set_updated_at ON posts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. 初期データ投入
-- ============================================

-- 役職マスターの初期データ
INSERT INTO master_roles (name, display_order) VALUES
  ('委員長', 1),
  ('副委員長', 2),
  ('幹事', 3),
  ('委員長兼チーフセクレタリー', 4),
  ('幹事兼セクレタリー', 5),
  ('理事長',6),
  ('直前理事長',7),
  ('副理事長',8),
  ('専務理事',9),
  ('監事',10)
ON CONFLICT (name) DO NOTHING;

-- 委員会マスターの初期データ（2026年度）
INSERT INTO master_committees (year, name, category) VALUES
  (2026, 'We Play 未来創造委員会', '委員会'),
  (2026, 'We Play 未来人材育成委員会', '委員会'),
  (2026, 'We Grow アカデミー委員会', '委員会'),
  (2026, 'We Go 渉外委員会', '委員会'),
  (2026, 'We Go Connect 広報委員会', '委員会'),
  (2026, 'We Believe 総務・セクレタリー委員会', '委員会')
ON CONFLICT (year, name) DO NOTHING;

-- ============================================
-- 7. Storage Bucket Configuration
-- ============================================

-- Create a public bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage.objects
-- Note: Replace with actual policies if needed, but these are common for public avatar buckets

-- Allow public access to read avatars
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
CREATE POLICY "Avatar Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
-- We restrict this to a folder structure like "users/{user_id}/..." for security
DROP POLICY IF EXISTS "Avatar Authenticated Upload" ON storage.objects;
CREATE POLICY "Avatar Authenticated Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- ============================================
-- 8. jc_members テーブル (新規追加: 2026-01-24)
-- ============================================
-- アプリのログインアカウントとは独立したメンバー名簿
-- profilesテーブルの内容も含み、未登録ユーザーの情報も管理可能

CREATE TABLE IF NOT EXISTS jc_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  last_name text,
  first_name text,
  last_name_kana text,
  first_name_kana text,
  email text,
  phone text,
  address text,
  company_name text,
  birth_date date,
  committees jsonb DEFAULT '[]'::jsonb,
  avatar_url text,
  is_profile_linked boolean DEFAULT false,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- RLS有効化
ALTER TABLE jc_members ENABLE ROW LEVEL SECURITY;

-- 閲覧: 全員可能
DROP POLICY IF EXISTS "Members are viewable by everyone" ON jc_members;
CREATE POLICY "Members are viewable by everyone"
  ON jc_members FOR SELECT
  USING (true);

-- 作成・更新: 認証済みユーザー（運用ルールとして）
DROP POLICY IF EXISTS "Authenticated users can manage members" ON jc_members;
CREATE POLICY "Authenticated users can manage members"
  ON jc_members FOR ALL
  USING (auth.role() = 'authenticated');

-- インデックス
CREATE INDEX IF NOT EXISTS idx_jc_members_profile_id ON jc_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_jc_members_name ON jc_members(name);

-- トリガー: profiles作成・更新時にjc_membersにも反映（同期）
CREATE OR REPLACE FUNCTION public.sync_profile_to_member()
RETURNS trigger AS $$
BEGIN
  -- insert or update jc_members
  -- profile_idが一致するレコードがあれば更新、なければ挿入
  INSERT INTO public.jc_members (
    name, last_name, first_name, last_name_kana, first_name_kana,
    email, phone, address, company_name, birth_date, committees, avatar_url,
    is_profile_linked, profile_id, updated_at
  )
  VALUES (
    new.name, new.last_name, new.first_name, new.last_name_kana, new.first_name_kana,
    new.email, new.phone, new.address, new.company_name, new.birth_date, new.committees, new.avatar_url,
    true, new.id, now()
  )
  ON CONFLICT DO NOTHING; -- 注: idが一致しないのでUpdateにはならない。ここでは簡易的に「新規は即反映」とする
  
  -- 既存データの同期（Update時）
  UPDATE public.jc_members SET
    name = new.name,
    last_name = new.last_name,
    first_name = new.first_name,
    last_name_kana = new.last_name_kana,
    first_name_kana = new.first_name_kana,
    email = new.email,
    phone = new.phone,
    address = new.address,
    company_name = new.company_name,
    birth_date = new.birth_date,
    committees = new.committees,
    avatar_url = new.avatar_url,
    updated_at = now()
  WHERE profile_id = new.id;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー適用 (profilesテーブル)
DROP TRIGGER IF EXISTS sync_profile_to_member_trigger ON profiles;
CREATE TRIGGER sync_profile_to_member_trigger
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_member();
