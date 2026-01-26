-- ============================================================
-- Fix RLS Policies for profiles and members
-- description: プロファイル取得のタイムアウト（フリーズ）を解消するため、
--              関連するテーブルのポリシーをリセット・再適用します。
-- ============================================================

-- 1. Profiles Table Policies (Reset)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. JC Members Table Policies (Reset to verified state)
DROP POLICY IF EXISTS "Authenticated users can manage members" ON jc_members;
DROP POLICY IF EXISTS "Edit manual members" ON jc_members;
DROP POLICY IF EXISTS "Delete manual members" ON jc_members;
DROP POLICY IF EXISTS "Edit own profile linked member" ON jc_members;
DROP POLICY IF EXISTS "Insert members" ON jc_members;
DROP POLICY IF EXISTS "Members are viewable by everyone" ON jc_members;

-- Re-apply simple view policy
CREATE POLICY "Members are viewable by everyone" ON jc_members FOR SELECT USING (true);

-- Re-apply complex edit policies (Corrected)
CREATE POLICY "Edit manual members" ON jc_members
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        profile_id IS NULL
    );

CREATE POLICY "Delete manual members" ON jc_members
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        profile_id IS NULL
    );

CREATE POLICY "Edit own profile linked member" ON jc_members
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        profile_id = auth.uid()
    );

CREATE POLICY "Insert members" ON jc_members
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );
