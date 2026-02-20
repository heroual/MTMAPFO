
-- ==========================================================
-- MTMAP-FO : MOTEUR DE SAUVEGARDE ET INSTANTANÉS SIG
-- ==========================================================

-- 1. Table des métadonnées des sauvegardes
CREATE TABLE IF NOT EXISTS public.network_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    node_count INT DEFAULT 0,
    cable_count INT DEFAULT 0
);

-- 2. Table de stockage des données gelées (Stockage compressé JSONB)
CREATE TABLE IF NOT EXISTS public.snapshot_data (
    id BIGSERIAL PRIMARY KEY,
    snapshot_id UUID REFERENCES public.network_snapshots(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    data JSONB NOT NULL
);

-- 3. FONCTION : Créer un instantané du réseau entier (Snapshot)
-- Cette fonction garantit l'intégrité référentielle entre les équipements et les câbles.
CREATE OR REPLACE FUNCTION public.take_network_snapshot(snapshot_name TEXT, user_email TEXT)
RETURNS UUID AS $$
DECLARE
    new_snap_id UUID;
    v_node_count INT;
    v_cable_count INT;
BEGIN
    -- Création de l'entête de sauvegarde
    INSERT INTO public.network_snapshots (name, created_by)
    VALUES (snapshot_name, user_email)
    RETURNING id INTO new_snap_id;

    -- Sauvegarde des équipements (Sites, OLT, MSAN, PCO, Splitters)
    INSERT INTO public.snapshot_data (snapshot_id, table_name, record_id, data)
    SELECT new_snap_id, 'equipments', id, to_jsonb(e)
    FROM public.equipments e
    WHERE is_deleted = false;
    
    GET DIAGNOSTICS v_node_count = ROW_COUNT;

    -- Sauvegarde des câbles (Transport et Distribution)
    INSERT INTO public.snapshot_data (snapshot_id, table_name, record_id, data)
    SELECT new_snap_id, 'cables', id, to_jsonb(c)
    FROM public.cables c
    WHERE is_deleted = false;

    GET DIAGNOSTICS v_cable_count = ROW_COUNT;

    -- Mise à jour des compteurs pour le rapport
    UPDATE public.network_snapshots 
    SET node_count = v_node_count, cable_count = v_cable_count 
    WHERE id = new_snap_id;

    -- Log dans la piste d'audit
    INSERT INTO public.audit_logs (user_email, action, entity_type, entity_id, new_data)
    VALUES (user_email, 'SNAPSHOT_CREATED', 'SYSTEM', new_snap_id::text, jsonb_build_object('name', snapshot_name, 'nodes', v_node_count));

    RETURN new_snap_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FONCTION : Restauration complète (Rollback)
-- Attention : Cette fonction remplace l'état actuel par celui de la sauvegarde.
CREATE OR REPLACE FUNCTION public.restore_network_snapshot(target_snap_id UUID, user_email TEXT)
RETURNS boolean AS $$
BEGIN
    -- 1. Sécurité : On crée une sauvegarde de secours de l'état actuel avant d'écraser
    PERFORM public.take_network_snapshot('AUTO_BACKUP_BEFORE_ROLLBACK', user_email);

    -- 2. On marque tout l'actuel comme supprimé pour faire place nette
    UPDATE public.equipments SET is_deleted = true;
    UPDATE public.cables SET is_deleted = true;

    -- 3. Restauration des équipements
    -- On utilise UPSERT pour restaurer les records originaux
    INSERT INTO public.equipments (id, name, type, parent_id, location, status, metadata, is_deleted)
    SELECT 
        (data->>'id')::UUID, 
        data->>'name', 
        data->>'type', 
        (data->>'parent_id')::UUID,
        ST_GeomFromGeoJSON(data->>'location'), -- Re-conversion PostGIS
        data->>'status',
        (data->'metadata')::JSONB,
        false
    FROM public.snapshot_data
    WHERE snapshot_id = target_snap_id AND table_name = 'equipments'
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        parent_id = EXCLUDED.parent_id,
        location = EXCLUDED.location,
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        is_deleted = false,
        updated_at = NOW();

    -- 4. Restauration des câbles
    INSERT INTO public.cables (id, name, type, category, start_node_id, end_node_id, path_geometry, fiber_count, length_meters, metadata, is_deleted)
    SELECT 
        (data->>'id')::UUID, 
        data->>'name', 
        data->>'type', 
        data->>'category', 
        (data->>'start_node_id')::UUID,
        (data->>'end_node_id')::UUID,
        ST_GeomFromGeoJSON(data->>'path_geometry'),
        (data->>'fiber_count')::INT,
        (data->>'length_meters')::FLOAT,
        (data->'metadata')::JSONB,
        false
    FROM public.snapshot_data
    WHERE snapshot_id = target_snap_id AND table_name = 'cables'
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        path_geometry = EXCLUDED.path_geometry,
        is_deleted = false,
        updated_at = NOW();

    -- 5. Audit
    INSERT INTO public.audit_logs (user_email, action, entity_type, entity_id)
    VALUES (user_email, 'ROLLBACK_EXECUTED', 'SYSTEM', target_snap_id::text);

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire d'usage pour le développeur :
-- Pour créer une sauvegarde : SELECT take_network_snapshot('Backup Fin de Phase 1', 'admin@iam.ma');
-- Pour restaurer : SELECT restore_network_snapshot('UUID_ICI', 'admin@iam.ma');
