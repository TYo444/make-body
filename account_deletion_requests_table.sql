-- SupabaseのSQL Editorで実行してください
-- アカウント削除申請テーブル

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email        text,
  is_pro       boolean DEFAULT false,
  reason       text,          -- 解約理由（カンマ区切り）
  comment      text,          -- 自由記述
  requested_at timestamptz NOT NULL DEFAULT now(),
  status       text NOT NULL DEFAULT 'pending',   -- "pending" | "completed"
  delete_by    timestamptz NOT NULL               -- requested_at + 30日
);

CREATE INDEX IF NOT EXISTS adr_user_id    ON account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS adr_status     ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS adr_delete_by  ON account_deletion_requests(delete_by);

ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
-- Service Keyのみアクセス可能
