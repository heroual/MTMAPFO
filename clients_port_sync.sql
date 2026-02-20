
-- Ajout de la colonne port_id pour lier les clients aux ports physiques des PCO
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS port_id INT;

-- Index pour accélérer la récupération par équipement
CREATE INDEX IF NOT EXISTS idx_clients_equipment_port ON public.clients (equipment_id, port_id);

-- Nettoyage des métadonnées de ports obsolètes dans equipments pour favoriser la table clients source de vérité
-- UPDATE public.equipments SET metadata = metadata - 'ports' WHERE type = 'PCO';
