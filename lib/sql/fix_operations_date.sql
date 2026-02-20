
-- 1. Ajout sécurisé de la colonne 'date' si elle n'existe pas
DO $$ 
BEGIN 
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operations' AND column_name='date') THEN
      ALTER TABLE public.operations ADD COLUMN date TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 2. Indexation pour les performances de tri (Tableau de bord)
CREATE INDEX IF NOT EXISTS idx_operations_date ON public.operations (date DESC);

-- 3. Note pour Supabase : Si l'erreur persiste après exécution, 
-- allez dans "Database" -> "API" -> "Schema Cache" -> "Reload Schema"
