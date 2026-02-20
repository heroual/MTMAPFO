
-- Add updated_at column to clients table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='updated_at') THEN
      ALTER TABLE public.clients ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;
