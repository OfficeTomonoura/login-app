-- システム設定用のテーブル作成
CREATE TABLE IF NOT EXISTS public.system_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- RLS設定 (管理者のみ閲覧・編集可能にするための準備)
-- とりあえず開発用に全ての認証済みユーザーが読み書きできるように設定
-- 本番では適宜制限をかける
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to read system_settings" 
ON public.system_settings FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated to update system_settings" 
ON public.system_settings FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated to insert system_settings" 
ON public.system_settings FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 初期データの投入
INSERT INTO public.system_settings (key, value)
VALUES 
    ('maintenance_mode', 'false'::jsonb),
    ('line_recipients', '["Ub148ee0fa695c962d0a83b777aa56c45"]'::jsonb)
ON CONFLICT (key) DO NOTHING;
