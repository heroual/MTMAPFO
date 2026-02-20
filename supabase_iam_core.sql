
-- ==========================================================
-- MTMAP-FO : NOYAU IAM NATIF (V8.0)
-- GESTION PROFESSIONNELLE DES UTILISATEURS ET PROFILS
-- ==========================================================

-- 1. Table des Profils (Miroir métier de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'technician' CHECK (role IN ('admin', 'supervisor', 'technician', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sécurité : Ajout de updated_at si manquante (Correctif erreur Syntax/Schema)
DO $$ 
BEGIN 
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
      ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 2. Moteur de Provisioning Automatique (Niveau Base de Données)
CREATE OR REPLACE FUNCTION public.handle_new_user_provisioning()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Extraction du rôle depuis les métadonnées (passées lors du signup/admin create)
    v_role := LOWER(COALESCE(new.raw_user_meta_data->>'role', 'technician'));

    -- Création du profil public lié
    INSERT INTO public.profiles (id, email, full_name, role, is_active, updated_at)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        v_role,
        true,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();

    -- INJECTION CRITIQUE : On pousse le rôle dans app_metadata
    -- Cela permet au JWT de porter le rôle pour les politiques RLS sans jointure.
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', v_role)
    WHERE id = new.id;

    RETURN new;
END;
$$;

-- Attachement du trigger (Garantit 100% de fiabilité)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_provisioning();

-- 3. Politiques de Sécurité (Anti-Recursion)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "admin_select_all" ON public.profiles FOR SELECT TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_manage_all" ON public.profiles FOR ALL TO authenticated 
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
