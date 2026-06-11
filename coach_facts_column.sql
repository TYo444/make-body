-- コーチの構造化記憶（怪我・好み等）をプロフィールに保存するカラム
-- SupabaseダッシュボードのSQL Editorで実行してください

alter table profiles add column if not exists coach_facts jsonb;
