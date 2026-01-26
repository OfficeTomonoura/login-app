-- ============================================================
-- Force Release Locks (Kill Connections)
-- description: データベースのデッドロックやゾンビプロセスによる待機状態を解消するため、
--              アクティブな接続を強制的に切断します。
-- ============================================================

-- 現在のデータベースに対する自分以外の全ての接続を切断する
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
  AND datname = current_database();
