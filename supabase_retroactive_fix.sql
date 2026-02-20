
-- ==========================================================
-- MTMAP-FO : SCRIPT DE SYNCHRONISATION RÉTROACTIVE
-- À exécuter dans la console SQL Supabase en cas de blocage
-- ==========================================================

-- 1. Insère les profils manquants pour tous les utilisateurs Auth existants
INSERT INTO public.profiles (id, email, full_name, role, is_active, updated_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    COALESCE(LOWER(raw_user_meta_data->>'role'), 'technician'),
    true,
    now()
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Met à jour les métadonnées d'application pour les politiques RLS
-- Indispensable si le trigger n'avait pas injecté le rôle dans app_metadata
UPDATE auth.users u
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE u.id = p.id;

-- 3. Vérification des résultats
SELECT email, role FROM public.profiles;
