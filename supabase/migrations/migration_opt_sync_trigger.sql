-- ============================================================
-- Migration: Add Trigger for Profile -> JC Member Sync
-- Description: profilesテーブルが更新された（初回ログイン/Onboarding完了など）タイミングで、
--              自動的に jc_members テーブルの情報も同期・更新するトリガーを作成します。
-- ============================================================

-- トリガー関数の定義
CREATE OR REPLACE FUNCTION public.sync_profile_to_member()
RETURNS trigger AS $$
BEGIN
  -- すでに profile_id が紐付いたメンバーがいるか確認
  IF EXISTS (SELECT 1 FROM public.jc_members WHERE profile_id = new.id) THEN
      -- 存在する場合は更新 (UPDATE)
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
  ELSE
      -- 存在しない場合は新規作成 (INSERT)
      INSERT INTO public.jc_members (
        name, last_name, first_name, last_name_kana, first_name_kana,
        email, phone, address, company_name, birth_date, committees, avatar_url,
        is_profile_linked, profile_id, updated_at
      )
      VALUES (
        new.name, new.last_name, new.first_name, new.last_name_kana, new.first_name_kana,
        new.email, new.phone, new.address, new.company_name, new.birth_date, new.committees, new.avatar_url,
        true, new.id, now()
      );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成（既存があれば削除して再作成）
DROP TRIGGER IF EXISTS sync_profile_to_member_trigger ON profiles;

CREATE TRIGGER sync_profile_to_member_trigger
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_member();

-- 確認用コメント
COMMENT ON TRIGGER sync_profile_to_member_trigger ON profiles IS 'Syncs profile changes (onboarding etc) to jc_members table';
