-- ================================================================
-- Make Body - Supabase SQL 全テーブル一括作成 v2
-- ================================================================

-- ── 1. profiles テーブルに必要なカラムを追加 ─────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_memory text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;


-- ── 2. AI利用回数テーブル ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key   text NOT NULL,
  day_key     text NOT NULL,
  month_count int  DEFAULT 0,
  day_count   int  DEFAULT 0,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, month_key)
);

CREATE INDEX IF NOT EXISTS ai_usage_user_month ON ai_usage(user_id, month_key);
CREATE INDEX IF NOT EXISTS ai_usage_user_day   ON ai_usage(user_id, day_key);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_usage' AND policyname = 'ai_usage_own'
  ) THEN
    CREATE POLICY "ai_usage_own" ON ai_usage FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- ── 3. 運営者アラート送信履歴テーブル ────────────────────────────
CREATE TABLE IF NOT EXISTS admin_alerts (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_key    text NOT NULL UNIQUE,
  threshold    int,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  sent_to      text NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_alerts_key ON admin_alerts(alert_key);
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;


-- ── 4. 解約・退会フィードバックテーブル ──────────────────────────
CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email             text,
  is_pro            boolean DEFAULT false,
  reason            text,
  comment           text,
  plan_type         text,
  app_language      text,
  days_since_signup int,
  total_ai_usage    int DEFAULT 0,
  last_login_at     timestamptz,
  created_at        timestamptz DEFAULT now(),
  nickname          text,
  fitness_level     text,
  coach_id          text,
  body_goal_id      text
);

CREATE INDEX IF NOT EXISTS cf_user_id    ON cancellation_feedback(user_id);
CREATE INDEX IF NOT EXISTS cf_created_at ON cancellation_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS cf_is_pro     ON cancellation_feedback(is_pro);
ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY;


-- ── 5. アカウント削除申請テーブル ────────────────────────────────
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email        text,
  is_pro       boolean DEFAULT false,
  reason       text,
  comment      text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  status       text NOT NULL DEFAULT 'pending',
  delete_by    timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS adr_user_id   ON account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS adr_status    ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS adr_delete_by ON account_deletion_requests(delete_by);
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
