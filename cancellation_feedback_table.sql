-- SupabaseのSQL Editorで実行してください
-- 解約・退会フィードバックテーブル

CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email             text,
  is_pro            boolean DEFAULT false,
  reason            text,           -- カンマ区切り（例: "price,time"）
  comment           text,           -- 自由記述（最大1000文字）
  plan_type         text,           -- "pro" | "free"
  app_language      text,           -- "ja" | "en" | "ko" など
  days_since_signup int,            -- 利用日数
  total_ai_usage    int DEFAULT 0,  -- 当月AI利用回数
  last_login_at     timestamptz,
  created_at        timestamptz DEFAULT now(),
  -- 分析用追加カラム
  nickname          text,
  fitness_level     text,        -- "beginner" | "some" | "regular" | "advanced"
  coach_id          text,        -- 使用していたコーチID
  body_goal_id      text         -- 目標体型ID
);

-- インデックス
CREATE INDEX IF NOT EXISTS cf_user_id    ON cancellation_feedback(user_id);
CREATE INDEX IF NOT EXISTS cf_created_at ON cancellation_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS cf_reason     ON cancellation_feedback(reason);
CREATE INDEX IF NOT EXISTS cf_is_pro     ON cancellation_feedback(is_pro);

-- RLS有効化（一般ユーザーからは見えない）
ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- 書き込みはService Key（サーバー側API）のみ
-- 一般ユーザーはアクセス不可（ポリシーなし = 全拒否）
