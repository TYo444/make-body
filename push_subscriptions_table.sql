-- Push通知購読テーブル
-- SupabaseダッシュボードのSQL Editorで実行してください

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null unique,
  subscription jsonb not null,
  lang        text default 'ja',
  coach_id    text default 'bro',
  nickname    text default '',
  created_at  timestamptz default now()
);

-- RLS有効化（クライアント直アクセスは全拒否。API経由のservice_roleのみ操作可能）
alter table push_subscriptions enable row level security;
