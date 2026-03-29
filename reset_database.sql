-- ============================================================
-- FULL RESET SCRIPT — Activity Registry
-- ⚠️  يمسح كل البيانات والجداول والـ policies القديمة
-- شغّله في Supabase → SQL Editor
-- ============================================================

-- 1. إزالة الـ Realtime subscriptions (نتجاهل الخطأ إذا الجدول مو موجود)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE stores;         EXCEPTION WHEN undefined_table OR sqlstate '42P01' OR others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE calls;          EXCEPTION WHEN undefined_table OR sqlstate '42P01' OR others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE zones;          EXCEPTION WHEN undefined_table OR sqlstate '42P01' OR others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE store_categories; EXCEPTION WHEN undefined_table OR sqlstate '42P01' OR others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE library_links;  EXCEPTION WHEN undefined_table OR sqlstate '42P01' OR others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE targets;        EXCEPTION WHEN undefined_table OR sqlstate '42P01' OR others THEN NULL;
END $$;

-- 2. حذف الجداول (CASCADE يحذف كل الـ FK dependencies تلقائياً)
DROP TABLE IF EXISTS targets          CASCADE;
DROP TABLE IF EXISTS library_links    CASCADE;
DROP TABLE IF EXISTS calls            CASCADE;
DROP TABLE IF EXISTS stores           CASCADE;
DROP TABLE IF EXISTS call_outcomes    CASCADE;
DROP TABLE IF EXISTS zones            CASCADE;
DROP TABLE IF EXISTS store_categories CASCADE;

-- ============================================================
-- إعادة البناء من الصفر
-- ============================================================

-- 1. Call Outcome Types
CREATE TABLE call_outcomes (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO call_outcomes (name) VALUES
  ('POS Issue'),
  ('Menu Update'),
  ('Accounting Query'),
  ('Contractual Negotiation'),
  ('No Answer');

-- 2. Stores / Restaurants
CREATE TABLE stores (
  id                        VARCHAR(50)  PRIMARY KEY,
  name                      VARCHAR(255) NOT NULL,
  category                  VARCHAR(100),
  owner_name                VARCHAR(255),
  phone                     VARCHAR(50),
  zone                      VARCHAR(100),
  area                      VARCHAR(100),
  address                   TEXT,
  map_link                  TEXT,
  cashier_phone             VARCHAR(50),
  accounts_manager_phone    VARCHAR(50),
  restaurant_manager_phone  VARCHAR(50),
  has_pos                   BOOLEAN DEFAULT FALSE,
  has_sim                   BOOLEAN DEFAULT FALSE,
  is_active                 BOOLEAN DEFAULT TRUE,
  created_at                TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Calls / Activities
CREATE TABLE calls (
  id             UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id       VARCHAR(50) REFERENCES stores(id) ON DELETE CASCADE,
  outcome_id     INTEGER REFERENCES call_outcomes(id),
  notes          TEXT,
  follow_up_date DATE,
  is_resolved    BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Zones
CREATE TABLE zones (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Store Categories
CREATE TABLE store_categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO store_categories (name) VALUES
  ('مطاعم'),
  ('متجر فواكه'),
  ('سوبر ماركت'),
  ('سكائر و نراكيل');

-- 6. Library Links
CREATE TABLE library_links (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  url         TEXT         NOT NULL,
  description TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Targets
CREATE TABLE targets (
  id              SERIAL PRIMARY KEY,
  month_year      VARCHAR(7) NOT NULL UNIQUE,
  weekly_goal     INTEGER    NOT NULL DEFAULT 50,
  include_weekend BOOLEAN    DEFAULT FALSE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Row Level Security — authenticated users only
-- ============================================================

ALTER TABLE call_outcomes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls           ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_links   ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_call_outcomes"   ON call_outcomes   FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_call_outcomes"  ON call_outcomes   FOR ALL    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_stores"          ON stores          FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_stores"         ON stores          FOR ALL    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_calls"           ON calls           FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_calls"          ON calls           FOR ALL    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_zones"           ON zones           FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_zones"          ON zones           FOR ALL    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_categories"      ON store_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_categories"     ON store_categories FOR ALL    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_library_links"   ON library_links   FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_library_links"  ON library_links   FOR ALL    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_targets"         ON targets         FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_write_targets"        ON targets         FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE stores;
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE zones;
ALTER PUBLICATION supabase_realtime ADD TABLE store_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE library_links;
ALTER PUBLICATION supabase_realtime ADD TABLE targets;
