
-- SCRIPT DE RÉPARATION DU SCHÉMA 'OPERATIONS'
-- Ce script vérifie chaque colonne individuellement pour éviter les erreurs 42703

DO $$ 
BEGIN 
  -- 1. Vérification / Ajout de la colonne 'date'
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operations' AND column_name='date') THEN
      ALTER TABLE public.operations ADD COLUMN date TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- 2. Vérification / Ajout de la colonne 'details'
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operations' AND column_name='details') THEN
      ALTER TABLE public.operations ADD COLUMN details TEXT;
  END IF;

  -- 3. Vérification / Ajout de la colonne 'target_id'
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operations' AND column_name='target_id') THEN
      ALTER TABLE public.operations ADD COLUMN target_id UUID;
  END IF;

  -- 4. Sécurité : s'assurer que target_id n'est pas NOT NULL
  ALTER TABLE public.operations ALTER COLUMN target_id DROP NOT NULL;

END $$;

-- Mise à jour des index de performance
CREATE INDEX IF NOT EXISTS idx_operations_date_sort ON public.operations (date DESC);
CREATE INDEX IF NOT EXISTS idx_operations_type_filter ON public.operations (type);

-- RAPPEL : Si l'erreur "column not found" persiste dans l'application après ce script :
-- Allez dans Supabase -> Dashboard -> API Settings -> "Reload Schema Cache"
