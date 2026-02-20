
-- OPTIMISATION DES JOINTURES LOGIQUES PCOS <-> CLIENTS
CREATE INDEX IF NOT EXISTS idx_clients_equipment_id ON public.clients (equipment_id);
CREATE INDEX IF NOT EXISTS idx_clients_port_id ON public.clients (port_id);
CREATE INDEX IF NOT EXISTS idx_clients_login_search ON public.clients (login);

-- OPTIMISATION DE LA HIÉRARCHIE ÉQUIPEMENTS
CREATE INDEX IF NOT EXISTS idx_equipments_parent_active ON public.equipments (parent_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_equipments_type_status ON public.equipments (type, status) WHERE is_deleted = false;

-- OPTIMISATION DE LA TOPOLOGIE CÂBLES
CREATE INDEX IF NOT EXISTS idx_cables_nodes ON public.cables (start_node_id, end_node_id);

-- ANALYSE POUR L'OPTIMISEUR DE REQUÊTES
ANALYZE public.equipments;
ANALYZE public.clients;
ANALYZE public.cables;
