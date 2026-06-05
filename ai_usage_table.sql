-- SupabaseのSQL Editorで実行してください
-- AI利用回数管理テーブル（UTC基準）

CREATE TABLE IF NOT EXISTS ai_usage (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_key     text NOT NULL,    -- UTC日付 "YYYY-MM-DD"
  month_key   text NOT NULL,    -- UTC年月 "YYYY-MM"
  day_count   int  NOT NULL DEFAULT 0,
  month_count int  NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, day_key)
);

-- インデックス（高速検索用）
CREATE INDEX IF NOT EXISTS ai_usage_user_day   ON ai_usage(user_id, day_key);
CREATE INDEX IF NOT EXISTS ai_usage_user_month ON ai_usage(user_id, month_key);

-- RLS有効化（Service Keyのみアクセス可能にする）
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ読める（参照用）
CREATE POLICY "Users can read own usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- 書き込みはService Key（サーバー側API）のみ
-- → クライアントからの直接操作を防ぎ不正防止

-- 月次リセット不要（day_key/month_keyで自然に分離される）
