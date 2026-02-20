
-- OPTIMISATION POUR LE MAPPAGE BOUT EN BOUT
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. Index GIN sur les ports MSAN/OLT pour savoir s'ils sont libres instantanément
CREATE INDEX IF NOT EXISTS idx_equipments_slots_search ON public.equipments USING GIN ((metadata->'slots'));

-- 2. Index GIN sur les soudures dans les joints
CREATE INDEX IF NOT EXISTS idx_equipments_splices_search ON public.equipments USING GIN ((metadata->'splices'));

-- 3. Index GIN sur le mappage des brins de câbles
CREATE INDEX IF NOT EXISTS idx_cables_fibers_search ON public.cables USING GIN ((metadata->'fibers'));

-- 4. Fonction Backend pour nettoyer les connexions orphelines (Maintenance)
CREATE OR REPLACE FUNCTION clean_orphaned_network_links()
RETURNS void AS $$
BEGIN
    -- Logique pour détecter des IDs dans les JSONB qui n'existent plus dans les tables
    -- Utile pour garder le SIG propre après des suppressions massives
END;
$$ LANGUAGE plpgsql;
