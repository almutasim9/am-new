-- ============================================================
-- Migration: Auto-cleanup of stores in Recycle Bin after 30 days
-- Task: T1.1 (Phase 1)
-- Date: 2026-04-16
-- ============================================================
-- Run this in the Supabase SQL Editor.
-- Requires the pg_cron extension (enable it once in Database > Extensions).

-- 1. Enable pg_cron (safe to re-run)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_deleted_stores()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM stores
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
$$;

-- 3. Schedule it to run daily at 03:00 UTC (06:00 Baghdad)
--    Unschedule any previous run with the same name first (idempotent)
SELECT cron.unschedule('cleanup-deleted-stores')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-deleted-stores'
);

SELECT cron.schedule(
  'cleanup-deleted-stores',
  '0 3 * * *',
  $$ SELECT public.cleanup_deleted_stores(); $$
);

-- Verify:
-- SELECT * FROM cron.job WHERE jobname = 'cleanup-deleted-stores';
