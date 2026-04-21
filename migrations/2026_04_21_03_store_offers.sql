-- 1. Create the offers table (was missing from schema)
CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  how_to_activate TEXT,
  category VARCHAR(100) DEFAULT 'عام',
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read offers"
  ON offers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated write offers"
  ON offers FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE offers;

-- 2. Store ↔ Offers junction table (many-to-many)
CREATE TABLE IF NOT EXISTS store_offers (
  id SERIAL PRIMARY KEY,
  store_id VARCHAR(50) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_id, offer_id)
);

ALTER TABLE store_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read store_offers"
  ON store_offers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated write store_offers"
  ON store_offers FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE store_offers;
