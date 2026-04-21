-- Add offers_target_pct to targets table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'targets'
        AND column_name = 'offers_target_pct'
    ) THEN
        ALTER TABLE public.targets
        ADD COLUMN offers_target_pct NUMERIC DEFAULT 0;
    END IF;
END $$;
