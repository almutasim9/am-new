-- Add extra monthly targets: highlights coverage %, discount coverage %, discount ratio %
-- All measured against the Commercial sheet only.
ALTER TABLE targets
  ADD COLUMN IF NOT EXISTS highlights_target_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_coverage_target_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_ratio_target_pct    NUMERIC(5,2) NOT NULL DEFAULT 0;
