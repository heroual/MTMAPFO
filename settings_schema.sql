
-- ==========================================================
-- MTMAP-FO : WORKFLOW & VALIDATION CONFIGURATIONS
-- ==========================================================

INSERT INTO public.settings_registry (key, label, description, category, data_type, default_value, is_public)
VALUES 
('workflow.require_manager_validation', 'Validation Managériale Requise', 'Toute opération terrain doit être approuvée par un Superviseur avant inscription au patrimoine.', 'SYSTEM', 'boolean', 'true', true),
('workflow.strict_material_check', 'Contrôle Matériel Strict', 'Bloque la validation si les quantités consommées dépassent les stocks prévus.', 'SYSTEM', 'boolean', 'false', true),
('workflow.auto_capture_extent', 'Auto-Capture Zone SIG', 'Capture automatiquement l''emprise géographique des travaux lors de la validation.', 'GIS', 'boolean', 'true', true),
('workflow.report_template', 'Modèle de Rapport par Défaut', 'Format de sortie pour les Ordres de Travail (OT).', 'SYSTEM', 'string', '"standard_iso"', true),
('workflow.require_photo_doe', 'Photo obligatoire (DOE)', 'Force l''upload d''une preuve visuelle pour valider le dossier d''exécution.', 'SYSTEM', 'boolean', 'true', true)
ON CONFLICT (key) DO UPDATE SET 
    label = EXCLUDED.label,
    description = EXCLUDED.description;

-- Valeurs globales par défaut pour les workflows
INSERT INTO public.settings_values (setting_key, scope, value)
VALUES 
('workflow.require_manager_validation', 'GLOBAL', 'true'),
('workflow.strict_material_check', 'GLOBAL', 'false'),
('workflow.auto_capture_extent', 'GLOBAL', 'true'),
('workflow.report_template', 'GLOBAL', '"standard_iso"'),
('workflow.require_photo_doe', 'GLOBAL', 'true')
ON CONFLICT (setting_key, scope, role_target, user_id) DO NOTHING;
