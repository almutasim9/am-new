-- ============================================================
-- Migration: Multi-tenant isolation via owner_id + stricter RLS
-- Task: T1.3 (Phase 1)
-- Date: 2026-04-16
-- ============================================================
-- IMPORTANT: Read before running!
--
-- This migration adds owner_id to all user-owned tables and tightens
-- RLS policies so each user sees only their own records.
--
-- BEFORE running:
--   1. Take a Supabase backup snapshot.
--   2. Decide who owns EXISTING rows. The BACKFILL_OWNER_ID below must
--      be replaced with a real auth.users.id (run `SELECT id, email FROM auth.users;`).
--   3. If you have multiple users already using the app, you MUST partition
--      existing rows manually before running the UPDATE statements.
--
-- Lookup tables (call_outcomes, zones, store_categories, closure_reasons)
-- remain shared across users — they are platform-wide settings.
-- ============================================================

-- ======================================================
-- STEP 0: Set the user who will own all existing rows
-- ======================================================
-- Replace the UUID below with the auth.users.id of the primary user.
-- Example: SELECT id, email FROM auth.users;
DO $$
DECLARE
  BACKFILL_OWNER_ID UUID := '00000000-0000-0000-0000-000000000000'::uuid;  -- <<< REPLACE ME
BEGIN
  IF BACKFILL_OWNER_ID = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION 'Set BACKFILL_OWNER_ID to a real auth.users.id before running this migration.';
  END IF;

  -- ==================================================
  -- STEP 1: Add owner_id column to user-owned tables
  -- ==================================================
  ALTER TABLE stores         ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  ALTER TABLE calls          ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  ALTER TABLE targets        ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  ALTER TABLE library_links  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  ALTER TABLE offers         ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

  -- ==================================================
  -- STEP 2: Backfill existing rows
  -- ==================================================
  UPDATE stores         SET owner_id = BACKFILL_OWNER_ID WHERE owner_id IS NULL;
  UPDATE calls          SET owner_id = BACKFILL_OWNER_ID WHERE owner_id IS NULL;
  UPDATE targets        SET owner_id = BACKFILL_OWNER_ID WHERE owner_id IS NULL;
  UPDATE library_links  SET owner_id = BACKFILL_OWNER_ID WHERE owner_id IS NULL;
  UPDATE offers         SET owner_id = BACKFILL_OWNER_ID WHERE owner_id IS NULL;
END $$;

-- ==================================================
-- STEP 3: Enforce NOT NULL + default to current user
-- ==================================================
ALTER TABLE stores         ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE stores         ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE calls          ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE calls          ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE targets        ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE targets        ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE library_links  ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE library_links  ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE offers         ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE offers         ALTER COLUMN owner_id SET DEFAULT auth.uid();

-- ==================================================
-- STEP 4: Indexes for RLS performance
-- ==================================================
CREATE INDEX IF NOT EXISTS idx_stores_owner_id        ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_calls_owner_id         ON calls(owner_id);
CREATE INDEX IF NOT EXISTS idx_targets_owner_id       ON targets(owner_id);
CREATE INDEX IF NOT EXISTS idx_library_links_owner_id ON library_links(owner_id);
CREATE INDEX IF NOT EXISTS idx_offers_owner_id        ON offers(owner_id);

-- ==================================================
-- STEP 5: Replace permissive RLS policies
-- ==================================================
-- stores
DROP POLICY IF EXISTS "Authenticated read stores"  ON stores;
DROP POLICY IF EXISTS "Authenticated write stores" ON stores;
CREATE POLICY "own_stores_select" ON stores FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own_stores_write"  ON stores FOR ALL    TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- calls
DROP POLICY IF EXISTS "Authenticated read calls"  ON calls;
DROP POLICY IF EXISTS "Authenticated write calls" ON calls;
CREATE POLICY "own_calls_select" ON calls FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own_calls_write"  ON calls FOR ALL    TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- targets
DROP POLICY IF EXISTS "Authenticated read targets"  ON targets;
DROP POLICY IF EXISTS "Authenticated write targets" ON targets;
CREATE POLICY "own_targets_select" ON targets FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own_targets_write"  ON targets FOR ALL    TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- library_links
DROP POLICY IF EXISTS "Authenticated read library_links"  ON library_links;
DROP POLICY IF EXISTS "Authenticated write library_links" ON library_links;
CREATE POLICY "own_library_select" ON library_links FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own_library_write"  ON library_links FOR ALL    TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- offers (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated read offers"  ON offers';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated write offers" ON offers';
    EXECUTE 'CREATE POLICY "own_offers_select" ON offers FOR SELECT TO authenticated USING (owner_id = auth.uid())';
    EXECUTE 'CREATE POLICY "own_offers_write"  ON offers FOR ALL    TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid())';
  END IF;
END $$;

-- ==================================================
-- STEP 6: Unique constraints that must include owner
-- ==================================================
-- Old: month_year was globally unique. New: unique per user.
ALTER TABLE targets DROP CONSTRAINT IF EXISTS targets_month_year_key;
ALTER TABLE targets ADD CONSTRAINT targets_owner_month_unique UNIQUE (owner_id, month_year);

-- ==================================================
-- Verify
-- ==================================================
-- SELECT tablename, policyname, qual FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
