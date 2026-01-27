-- ============================================================
-- Data Migration SQL: profiles -> jc_members
-- 既存のプロフィールデータを新しいメンバー名簿テーブルにコピーします。
-- SupabaseのSQLエディタで実行してください。
-- ============================================================

INSERT INTO jc_members (
    name, 
    last_name, 
    first_name, 
    last_name_kana, 
    first_name_kana,
    email, 
    phone, 
    address, 
    company_name, 
    birth_date, 
    committees, 
    avatar_url, 
    is_profile_linked, 
    profile_id,
    created_at,
    updated_at
)
SELECT 
    name, 
    last_name, 
    first_name, 
    last_name_kana, 
    first_name_kana,
    email, 
    phone, 
    address, 
    company_name, 
    birth_date, 
    committees, 
    avatar_url, 
    true,   -- アカウント紐付けあり
    id,     -- profile_id
    created_at,
    now()
FROM profiles
WHERE NOT EXISTS (
    SELECT 1 FROM jc_members WHERE profile_id = profiles.id
);
