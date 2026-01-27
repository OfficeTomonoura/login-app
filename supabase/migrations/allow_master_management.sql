-- ============================================================
-- Allow Master Data Management (Committees & Roles)
-- description: 認証済みユーザーが委員会・役職マスターを編集・削除できるように
--              RLSポリシーを追加・更新します。
-- ============================================================

-- 1. Master Committees Policies
-- 既存のINSERTポリシーはそのまま維持し、UPDATE/DELETEを追加

DROP POLICY IF EXISTS "Authenticated users can update committees" ON master_committees;
CREATE POLICY "Authenticated users can update committees"
  ON master_committees FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete committees" ON master_committees;
CREATE POLICY "Authenticated users can delete committees"
  ON master_committees FOR DELETE
  USING (auth.role() = 'authenticated');


-- 2. Master Roles Policies

DROP POLICY IF EXISTS "Authenticated users can update roles" ON master_roles;
CREATE POLICY "Authenticated users can update roles"
  ON master_roles FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete roles" ON master_roles;
CREATE POLICY "Authenticated users can delete roles"
  ON master_roles FOR DELETE
  USING (auth.role() = 'authenticated');
