
-- ==========================================================
-- MTMAP-FO : SETTINGS SECURITY POLICIES (ANTI-RECURSION)
-- Utilisation exclusive du JWT pour les vérifications de rôles
-- ==========================================================

-- Activation du RLS
ALTER TABLE public.settings_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Nettoyage des politiques existantes (si déjà créées par le schéma précédent)
DROP POLICY IF EXISTS "registry_read_public" ON public.settings_registry;
DROP POLICY IF EXISTS "values_read_policy" ON public.settings_values;
DROP POLICY IF EXISTS "values_modify_policy" ON public.settings_values;
DROP POLICY IF EXISTS "flags_read_all" ON public.feature_flags;
DROP POLICY IF EXISTS "flags_admin_all" ON public.feature_flags;

-- 1. POLITIQUES POUR 'settings_registry' (Catalogue)

-- Lecture : Tout le monde voit le public, l'Admin voit tout
CREATE POLICY "registry_select" ON public.settings_registry
FOR SELECT TO authenticated
USING (
    is_public = true 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
);

-- Modification : Admin uniquement
CREATE POLICY "registry_admin_all" ON public.settings_registry
FOR ALL TO authenticated
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN' )
WITH CHECK ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN' );


-- 2. POLITIQUES POUR 'settings_values' (Valeurs)

-- Lecture : Hiérarchie Global/Role/User
-- On récupère le rôle directement depuis le JWT pour éviter la récursion sur 'profiles'
CREATE POLICY "values_select" ON public.settings_values
FOR SELECT TO authenticated
USING (
    scope = 'GLOBAL' 
    OR (scope = 'ROLE' AND role_target = (auth.jwt() -> 'user_metadata' ->> 'role'))
    OR (scope = 'USER' AND user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
);

-- Modification : Utilisateur pour ses propres réglages OU Admin
CREATE POLICY "values_modify" ON public.settings_values
FOR ALL TO authenticated
USING (
    (scope = 'USER' AND user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
)
WITH CHECK (
    (scope = 'USER' AND user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN'
);


-- 3. POLITIQUES POUR 'feature_flags' (Modules)

-- Lecture : Tout le monde (permet à l'app de savoir quel module charger)
CREATE POLICY "flags_select" ON public.feature_flags
FOR SELECT TO authenticated
USING (true);

-- Modification : Admin uniquement
CREATE POLICY "flags_admin" ON public.feature_flags
FOR ALL TO authenticated
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN' )
WITH CHECK ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN' );

-- Note : Ces politiques sont totalement indépendantes de la table 'profiles'.
-- Même si la table 'profiles' est corrompue, le système de settings reste sécurisé 
-- car il se base sur les métadonnées signées du token d'authentification.
