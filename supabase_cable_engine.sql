
-- ==========================================================
-- MTMAP-FO : MOTEUR TRANSACTIONNEL DE DÉPLOIEMENT CÂBLES
-- ==========================================================

CREATE OR REPLACE FUNCTION public.fn_deploy_cable_secure(
    p_id UUID,
    p_name TEXT,
    p_category TEXT,
    p_start_node_id UUID,
    p_end_node_id UUID,
    p_fiber_count INT,
    p_length_meters FLOAT,
    p_path_geojson JSONB,
    p_metadata JSONB,
    p_user_email TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_exists boolean;
    v_end_exists boolean;
BEGIN
    -- 1. VÉRIFICATION D'EXISTENCE DES EXTRÉMITÉS
    SELECT EXISTS(SELECT 1 FROM public.equipments WHERE id = p_start_node_id AND is_deleted = false) INTO v_start_exists;
    SELECT EXISTS(SELECT 1 FROM public.equipments WHERE id = p_end_node_id AND is_deleted = false) INTO v_end_exists;

    IF NOT v_start_exists OR NOT v_end_exists THEN
        RAISE EXCEPTION 'Échec Topologique : L''une des extrémités du câble n''existe plus ou est supprimée.';
    END IF;

    -- 2. INSERTION DU CÂBLE DANS LA TRANSACTION
    INSERT INTO public.cables (
        id, name, type, category, start_node_id, end_node_id, 
        fiber_count, length_meters, path_geometry, metadata, status
    )
    VALUES (
        p_id, p_name, 'CABLE', p_category, p_start_node_id, p_end_node_id,
        p_fiber_count, p_length_meters, ST_GeomFromGeoJSON(p_path_geojson), p_metadata, 'AVAILABLE'
    );

    -- 3. AUDIT AUTOMATIQUE
    INSERT INTO public.audit_logs (user_email, action, entity_type, entity_id, new_data)
    VALUES (p_user_email, 'CREATE', 'CABLE', p_id::text, jsonb_build_object('name', p_name, 'topo', 'secure_rpc'));

    RETURN true;
EXCEPTION WHEN OTHERS THEN
    -- Transaction automatique Rollback par PostgreSQL
    RAISE NOTICE 'Rollback technique : %', SQLERRM;
    RETURN false;
END;
$$;
