
-- ==========================================================
-- MTMAP-FO : IMMUTABLE SETTINGS AUDIT ENGINE
-- ==========================================================

-- 1. Fonction Trigger pour l'Audit des Settings
CREATE OR REPLACE FUNCTION public.fn_audit_settings_change()
RETURNS TRIGGER AS $$
DECLARE
    v_user_email TEXT;
BEGIN
    -- Récupération de l'email de l'utilisateur depuis le JWT
    v_user_email := coalesce(auth.jwt() ->> 'email', 'system@mtmap.ma');

    -- Log de l'action
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.value IS DISTINCT FROM NEW.value) THEN
            INSERT INTO public.audit_logs (
                user_email, 
                action, 
                entity_type, 
                entity_id, 
                entity_path,
                old_data, 
                new_data
            )
            VALUES (
                v_user_email,
                'SETTING_UPDATE',
                'SETTING',
                NEW.setting_key,
                NEW.scope,
                jsonb_build_object('value', OLD.value),
                jsonb_build_object('value', NEW.value)
            );
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (
            user_email, 
            action, 
            entity_type, 
            entity_id, 
            entity_path,
            new_data
        )
        VALUES (
            v_user_email,
            'SETTING_CREATE',
            'SETTING',
            NEW.setting_key,
            NEW.scope,
            jsonb_build_object('value', NEW.value)
        );
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (
            user_email, 
            action, 
            entity_type, 
            entity_id, 
            entity_path,
            old_data
        )
        VALUES (
            v_user_email,
            'SETTING_DELETE',
            'SETTING',
            OLD.setting_key,
            OLD.scope,
            jsonb_build_object('value', OLD.value)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attachement du Trigger à la table settings_values
DROP TRIGGER IF EXISTS tr_audit_settings ON public.settings_values;
CREATE TRIGGER tr_audit_settings
AFTER INSERT OR UPDATE OR DELETE ON public.settings_values
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_settings_change();

-- 3. Sécurité : Verrouillage de la table Audit pour immuabilité
-- Seul postgres peut modifier/supprimer des logs (Maintenance DB uniquement)
DROP POLICY IF EXISTS "audit_logs_read" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

CREATE POLICY "audit_logs_read" ON public.audit_logs 
FOR SELECT TO authenticated 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'ADMIN' );

CREATE POLICY "audit_logs_insert_system" ON public.audit_logs 
FOR INSERT TO authenticated 
WITH CHECK (true); -- Autorisé pour permettre aux triggers de fonctionner

-- NOTE: Absence de politique UPDATE/DELETE = Action interdite par défaut par PostgreSQL RLS
