
-- ==========================================================
-- MTMAP-FO : USER MANAGEMENT ENGINE (ADMIN ONLY)
-- ==========================================================

-- 1. Fonction pour lister les utilisateurs (Auth + Profile)
-- Comme auth.users n'est pas accessible en direct via RLS pour tous, 
-- cette fonction permet aux Admins de voir l'annuaire complet.
CREATE OR REPLACE FUNCTION public.get_user_directory()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    last_sign_in TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER -- S'exécute avec les droits postgres
AS $$
BEGIN
    -- Vérification stricte du rôle de l'appelant via JWT
    IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'ADMIN' THEN
        RAISE EXCEPTION 'Accès refusé: Privilèges Administrateur requis.';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email::TEXT,
        (u.raw_user_meta_data->>'full_name')::TEXT as full_name,
        p.role::TEXT,
        u.last_sign_in_at as last_sign_in,
        u.created_at
    FROM auth.users u
    JOIN public.profiles p ON u.id = p.id
    ORDER BY u.created_at DESC;
END;
$$;

-- 2. Fonction de création d'un utilisateur par un Admin
CREATE OR REPLACE FUNCTION public.admin_create_user(
    target_email TEXT,
    target_password TEXT,
    target_full_name TEXT,
    target_role TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Vérification Admin
    IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'ADMIN' THEN
        RAISE EXCEPTION 'Action interdite.';
    END IF;

    -- Création dans auth.users
    -- Note: auth.admin.create_user est idéal mais nécessite l'extension auth.admin
    -- Ici nous utilisons une approche compatible standard Supabase
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at, confirmation_token, recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
        target_email, crypt(target_password, gen_salt('bf')), 
        now(), '{"provider":"email","providers":["email"]}', 
        jsonb_build_object('full_name', target_full_name, 'role', target_role),
        now(), now(), '', ''
    )
    RETURNING id INTO new_user_id;

    -- Le trigger sync_user_role_to_metadata s'occupera du profil public.
    
    RETURN new_user_id;
END;
$$;
