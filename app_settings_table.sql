-- SupabaseのSQL Editorで実行してください
-- アプリ設定テーブル（緊急停止機能）

-- 旧テーブルがあれば削除して作り直す
DROP TABLE IF EXISTS app_settings;

CREATE TABLE app_settings (
  id                   int PRIMARY KEY DEFAULT 1,
  maintenance_mode     boolean NOT NULL DEFAULT false,
  free_signup_enabled  boolean NOT NULL DEFAULT true,
  free_ai_enabled      boolean NOT NULL DEFAULT true,
  trial_enabled        boolean NOT NULL DEFAULT true,
  pro_enabled          boolean NOT NULL DEFAULT true,
  updated_at           timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 初期レコードを1件作成
INSERT INTO app_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS有効化
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "public_read" ON app_settings
  FOR SELECT USING (true);

-- 書き込みはService Keyのみ（ポリシーなし = anon不可）
