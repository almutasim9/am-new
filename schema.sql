-- 1. Platform Settings: Call Outcome Types
CREATE TABLE call_outcomes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE, -- E.g., POS Issue, Menu Update, Accounting, No Answer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default outcomes
INSERT INTO call_outcomes (name) VALUES 
('POS Issue'), ('Menu Update'), ('Accounting Query'), ('Contractual Negotiation'), ('No Answer');

-- 2. Store Management: Restaurant Details
CREATE TABLE stores (
  id VARCHAR(50) PRIMARY KEY, -- User-defined Store ID (e.g., REST-101)
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  owner_name VARCHAR(255),
  phone VARCHAR(50),
  zone VARCHAR(100),
  area VARCHAR(100),
  address TEXT,
  map_link TEXT,
  brand_id TEXT, -- Added for brand tracking
  cashier_phone VARCHAR(50),
  accounts_manager_phone VARCHAR(50),
  restaurant_manager_phone VARCHAR(50),
  has_pos BOOLEAN DEFAULT FALSE,
  has_sim BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE, -- To deactivate without deleting
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete support (Recycle Bin)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 3. Call Registration & Task Management
CREATE TABLE calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id VARCHAR(50) REFERENCES stores(id) ON DELETE CASCADE,
  outcome_id INTEGER REFERENCES call_outcomes(id),
  notes TEXT,
  follow_up_date DATE, -- Optional date for follow-up
  is_resolved BOOLEAN DEFAULT FALSE, -- To mark follow-up tasks as complete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Security: Enable RLS and define policies
ALTER TABLE call_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Authenticated users only (requires Supabase Auth login)
CREATE POLICY "Authenticated read call_outcomes"  ON call_outcomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write call_outcomes" ON call_outcomes FOR ALL    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read stores"  ON stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write stores" ON stores FOR ALL    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read calls"   ON calls FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write calls"  ON calls FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE stores;
ALTER PUBLICATION supabase_realtime ADD TABLE calls;

-- 5. Additional Configurations: Zones and Store Categories
CREATE TABLE zones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE store_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default categories
INSERT INTO store_categories (name) VALUES 
('مطاعم'), ('متجر فواكه'), ('سوبر ماركت'), ('سكائر و نراكيل');

-- RLS for new tables
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read zones"         ON zones            FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write zones"        ON zones            FOR ALL    TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read categories"    ON store_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write categories"   ON store_categories FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- Update Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE zones;
ALTER PUBLICATION supabase_realtime ADD TABLE store_categories;

-- 6. Library: Daily Links Management
CREATE TABLE library_links (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT, -- Added for extra details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE library_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read library_links"  ON library_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write library_links" ON library_links FOR ALL    TO authenticated USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE library_links;

-- 7. Performance Tracking: Targets & Goals
CREATE TABLE targets (
  id SERIAL PRIMARY KEY,
  month_year VARCHAR(7) NOT NULL UNIQUE, -- e.g. '2026-03'
  weekly_goal INTEGER NOT NULL DEFAULT 50,
  include_weekend BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read targets"  ON targets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write targets" ON targets FOR ALL    TO authenticated USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE targets;

-- 8. Closure Reasons Management
CREATE TABLE closure_reasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default closure reasons
INSERT INTO closure_reasons (name) VALUES 
('تغيير نشاط'), ('نقل الموقع'), ('ضعف الإقبال'), ('خسارة مالية'), ('قرار إداري');

ALTER TABLE closure_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read closure_reasons"  ON closure_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write closure_reasons" ON closure_reasons FOR ALL    TO authenticated USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE closure_reasons;

