
-- 0. Activation des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Index composites pour l'inventaire physique (Lookup rapide type/statut)
CREATE INDEX IF NOT EXISTS idx_equipments_perf_lookup ON public.equipments (type, status, is_deleted);
CREATE INDEX IF NOT EXISTS idx_equipments_parent_sync ON public.equipments (parent_id) WHERE is_deleted = false;

-- 2. Index de performance pour les liaisons de câbles (Topologie)
CREATE INDEX IF NOT EXISTS idx_cables_topology ON public.cables (start_node_id, end_node_id, category) WHERE is_deleted = false;

-- 3. Optimisation des recherches plein texte sur les noms (Recherche Globale)
-- Maintenant que pg_trgm est activé, cet index fonctionnera
CREATE INDEX IF NOT EXISTS idx_equipments_name_trgm ON public.equipments USING gin (name gin_trgm_ops);

-- 4. Nettoyage et simplification RLS (Anti-Recursion via JWT)
DROP POLICY IF EXISTS "profiles_v3_fast_select" ON public.profiles;
CREATE POLICY "profiles_v3_fast_select" ON public.profiles 
FOR SELECT TO authenticated 
USING ( id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );

-- 5. Statistiques de planification pour l'optimiseur de requêtes
ANALYZE public.equipments;
ANALYZE public.cables;
