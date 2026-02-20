
-- ==========================================================
-- MTMAP-FO : RPC ADMINISTRATION (V7.0)
-- ==========================================================

-- 1. Annuaire complet pour l'Admin
CREATE OR REPLACE FUNCTION public.get_user_directory()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    last_sign_in TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    is_active BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
BEGIN
    -- Sécurité : Uniquement si l'appelant est Admin dans son JWT
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN
        RAISE EXCEPTION 'Accès refusé.';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email::TEXT,
        p.full_name,
        p.role,
        u.last_sign_in_at,
        p.created_at,
        p.is_active
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE u.deleted_at IS NULL
    ORDER BY p.created_at DESC;
END;
$$;

-- 2. Création d'Agent par Admin
-- Note: On insère uniquement dans auth.users, le trigger s'occupe du reste.
CREATE OR REPLACE FUNCTION public.admin_create_user(
    target_email TEXT,
    target_password TEXT,
    target_full_name TEXT,
    target_role TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Vérification Admin
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN
        RAISE EXCEPTION 'Action réservée aux administrateurs.';
    END IF;

    -- Création technique du compte (Provisioning Auth)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at, confirmation_token, recovery_token, is_super_admin
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', 
        gen_random_uuid(), 
        'authenticated', 
        'authenticated', 
        target_email, 
        extensions.crypt(target_password, extensions.gen_salt('bf')), 
        now(), 
        '{"provider":"email","providers":["email"]}', 
        jsonb_build_object('full_name', target_full_name, 'role', LOWER(target_role)),
        now(), now(), '', '', false
    )
    RETURNING id INTO new_user_id;

    -- Note : On ne fait pas d'INSERT manuel dans public.profiles ici.
    -- Le trigger 'on_auth_user_created' le fait automatiquement et proprement.

    RETURN new_user_id;
END;
$$;
