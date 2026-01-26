-- ============================================================
-- Safe Kill Locks (Targets App Roles Only)
-- description: システム管理者権限（Superuser）がないユーザーでも実行可能なように、
--              アプリケーション関連のロールに限定して接続を切断します。
-- ============================================================

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND datname = current_database()
  -- 権限エラーを回避するため、自分たちが操作可能なロールに限定
  AND usename IN ('postgres', 'authenticated', 'anon', 'service_role', 'authenticator');
