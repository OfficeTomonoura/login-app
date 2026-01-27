-- ============================================================
-- Update RLS Policies for jc_members
-- 編集権限の厳格化:
-- 1. 手動登録メンバー(profile_id IS NULL) -> 全員編集可能
-- 2. 連携済みメンバー(profile_id IS NOT NULL) -> 本人のみ編集可能
-- ============================================================

-- 既存のオールパーミッションポリシーを削除
DROP POLICY IF EXISTS "Authenticated users can manage members" ON jc_members;

-- 1. 手動登録メンバーは全員編集・削除可能
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

-- 2. 連携済みメンバーは本人のみ編集可能 (他人の連携データを勝手に書き換えられないように)
CREATE POLICY "Edit own profile linked member" ON jc_members
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        profile_id = auth.uid()
    );

-- 3. 新規作成（INSERT）は全員許可（手動登録のため）
CREATE POLICY "Insert members" ON jc_members
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- 注意: SELECTポリシー "Members are viewable by everyone" は変更なし（全員閲覧可能）
