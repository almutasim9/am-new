-- ============================================================
-- Migration: Performance indexes on hot query paths
-- Task: T2.1 (Phase 2)
-- Date: 2026-04-17
-- ============================================================
-- Run in Supabase SQL Editor. All statements use IF NOT EXISTS so
-- this migration is idempotent (safe to re-run).
-- ============================================================

-- Calls: the heaviest table. Queried by store_id (timeline view)
-- and ordered by created_at DESC (activity log list).
CREATE INDEX IF NOT EXISTS idx_calls_store_created
  ON calls(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calls_created_at
  ON calls(created_at DESC);

-- Filters on unresolved tasks (overdue banner, pending count)
CREATE INDEX IF NOT EXISTS idx_calls_unresolved
  ON calls(store_id, created_at DESC)
  WHERE is_resolved = false;

-- Follow-up date queries (overdue list)
CREATE INDEX IF NOT EXISTS idx_calls_follow_up
  ON calls(follow_up_date)
  WHERE follow_up_date IS NOT NULL AND is_resolved = false;

-- Stores: category/zone filters used in list + stats views
CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);
CREATE INDEX IF NOT EXISTS idx_stores_zone     ON stores(zone);

-- Soft-delete filter — most store queries filter deleted_at IS NULL.
-- Partial index keeps it small and fast.
CREATE INDEX IF NOT EXISTS idx_stores_active
  ON stores(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stores_deleted
  ON stores(deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

-- Lookup tables — small but queried on every app load
CREATE INDEX IF NOT EXISTS idx_call_outcomes_name     ON call_outcomes(name);
CREATE INDEX IF NOT EXISTS idx_store_categories_name  ON store_categories(name);
CREATE INDEX IF NOT EXISTS idx_zones_name             ON zones(name);

-- Targets lookup (month_year already unique, but add composite for RLS)
-- The owner_id index was already created in migration 02.

-- Analyze to refresh planner statistics
ANALYZE calls;
ANALYZE stores;

-- Verify:
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE schemaname = 'public' ORDER BY tablename, indexname;
