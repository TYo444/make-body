-- SupabaseのSQL Editorで実行してください
-- 運営者向けアラート送信履歴テーブル

CREATE TABLE IF NOT EXISTS admin_alerts (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_key    text NOT NULL UNIQUE,   -- 重複送信防止キー（例: "pro_users_450"）
  threshold    int,                     -- 到達したしきい値
  triggered_at timestamptz NOT NULL DEFAULT now(),
  sent_to      text NOT NULL            -- 送信先メールアドレス
);

-- インデックス（alert_key の高速検索）
CREATE INDEX IF NOT EXISTS admin_alerts_key ON admin_alerts(alert_key);

-- RLS有効化（Service Keyのみアクセス可能）
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

-- 一般ユーザーはアクセス不可（ポリシーなし = 全拒否）
-- Service Key（サーバー側API）のみ読み書き可能
