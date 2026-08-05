# asset
【supabase 現在のテーブル確認SQL】

SELECT schemaname, tablename, tableowner FROM pg_tables WHERE schemaname = 'public';

「各テーブルの具体的なカラム構成（データ型やデフォルト値）」を調べるためのSQL文

SELECT table_name, column_name, ordinal_position, is_nullable, data_type, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('messages', 'items', 'users') ORDER BY table_name, ordinal_position;

ゲームカード

https://mygan-six.vercel.app/cards/small.html

https://asset-bay-six.vercel.app/

https://asset-bay-six.vercel.app/host.html

APIキー

Project URL

https://dtgfdtsiggljqczvqcgy.supabase.co

Publishable key

sb_publishable_8NKvxlnYvvD1ImNdYyj6Bg_DofuOnn1


