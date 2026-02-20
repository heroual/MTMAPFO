import { supabase } from '../supabase';
import { Equipment, FiberCable, EquipmentType, Coordinates, ClientProfile, FieldOperation, EquipmentStatus } from '../../types';
import { computeLogicalPath } from '../network-path';
import { AuditService, ActionType } from './audit-service';

// Helpers PostGIS sécurisés
const toPoint = (coords?: Coordinates) => coords ? { type: 'Point', coordinates: [coords.lng, coords.lat] } : null;
const toLineString = (path: Coordinates[]) => (path?.length >= 2) ? { type: 'LineString', coordinates: path.map(p => [p.lng, p.lat]) } : null;

/**
 * Sécurise l'extraction d'UUID pour les IDs virtuels
 */
const extractUuid = (id: string | null | undefined): string => {
  if (!id || typeof id !== 'string') return '';
  return id.includes('::') ? id.split('::')[0] : id;
};

export const NetworkService = {
  /**
   * Récupère l'état complet avec optimisation Map O(1) et gestion des clients sans port_id
   */
  async fetchFullState() {
    const [eqRes, cbRes, clRes] = await Promise.all([
      supabase.from('equipments').select('*').eq('is_deleted', false),
      supabase.from('cables').select('*').eq('is_deleted', false),
      supabase.from('clients').select('*')
    ]);

    if (eqRes.error) throw eqRes.error;
    if (cbRes.error) throw cbRes.error;

    const rawEquipments = eqRes.data || [];
    const rawCables = cbRes.data || [];
    const rawClients = clRes.data || [];

    // 1. Groupement des clients par équipement
    const clientsByEq = new Map<string, any[]>();
    rawClients.forEach(c => {
      if (c.equipment_id) {
        const list = clientsByEq.get(c.equipment_id) || [];
        list.push(c);
        clientsByEq.set(c.equipment_id, list);
      }
    });

    // 2. Mapping des équipements
    const mappedEq = rawEquipments.map((e: any) => {
      const baseEq = {
        ...e,
        parentId: e.parent_id,
        location: e.location?.coordinates ? { lat: e.location.coordinates[1], lng: e.location.coordinates[0] } : undefined,
        totalPorts: e.capacity_total || 8,
        usedPorts: e.capacity_used || 0
      };

      if (e.type === EquipmentType.PCO) {
        const eqClients = clientsByEq.get(e.id) || [];
        
        // Initialisation des ports (Priorité Métadonnées > Défaut)
        let ports = Array.isArray(e.metadata?.ports) 
            ? JSON.parse(JSON.stringify(e.metadata.ports)) 
            : Array.from({length: baseEq.totalPorts}, (_, i) => ({ id: i+1, status: 'FREE' }));

        // SYNC DES CLIENTS : Gestion intelligente des port_id NULL
        const unassignedClients: any[] = [];
        
        eqClients.forEach((cl: any) => {
          const clientObj = {
            id: cl.id,
            login: cl.login,
            name: cl.name,
            ontSerial: cl.contract_info?.ontSerial || '',
            offer: cl.contract_info?.offer,
            clientType: cl.contract_info?.clientType,
            phone: cl.contact_info?.phone,
            email: cl.contact_info?.email,
            status: 'ACTIVE',
            installedAt: cl.created_at,
            isTentative: cl.port_id === null // Marqueur pour l'UI
          };

          if (cl.port_id !== null) {
            const portIdx = ports.findIndex((p: any) => p.id === cl.port_id);
            if (portIdx !== -1) {
              ports[portIdx] = { ...ports[portIdx], status: 'USED', client: clientObj };
            } else {
              unassignedClients.push(clientObj);
            }
          } else {
            unassignedClients.push(clientObj);
          }
        });

        // AUTO-ALLOCATION MÉMOIRE pour les clients sans port_id (évite qu'ils soient invisibles)
        unassignedClients.forEach(cl => {
            const firstFreeIdx = ports.findIndex((p: any) => p.status === 'FREE');
            if (firstFreeIdx !== -1) {
                ports[firstFreeIdx] = { ...ports[firstFreeIdx], status: 'USED', client: cl };
            }
        });
        
        baseEq.ports = ports;
        baseEq.usedPorts = eqClients.length; 
      }
      return baseEq;
    });

    // 3. Mapping des câbles
    const mappedCables = rawCables.map((c: any) => ({
      ...c,
      fiberCount: c.fiber_count,
      lengthMeters: c.length_meters,
      startNodeId: c.start_node_id,
      endNodeId: c.end_node_id,
      path: c.path_geometry?.coordinates ? c.path_geometry.coordinates.map((p: any) => ({ lat: p[1], lng: p[0] })) : []
    }));

    return { equipments: mappedEq, cables: mappedCables };
  },

  async fetchOperations() {
    // Utilise 'created_at' comme fallback si 'date' est instable, et sélectionne toutes les colonnes
    const { data, error } = await supabase.from('operations').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map((op: any) => ({
      ...op,
      // Mapping vers le modèle de données frontend (FieldOperation)
      technicianName: op.technician,
      targetEntityId: op.target_entity_id || op.target_id, // Supporte les deux variantes de colonnes
      createdEntityId: op.created_entity_id,
      comments: op.details || (op.metadata?.comments ? op.metadata.comments : ''),
      date: op.date || op.created_at,
      mapSnapshot: op.metadata?.mapSnapshot
    }));
  },

  async createEquipment(eq: Equipment) {
    const payload = {
      id: eq.id,
      name: eq.name,
      type: eq.type,
      parent_id: eq.parentId,
      location: toPoint(eq.location),
      status: eq.status,
      capacity_total: eq.totalPorts || 0,
      capacity_used: eq.usedPorts || 0,
      metadata: eq.metadata,
      is_deleted: false
    };
    const { error } = await supabase.from('equipments').insert(payload as any);
    if (error) throw error;
  },

  async updateEquipment(id: string, updates: Partial<Equipment>) {
    const payload: any = { ...updates };
    if (updates.location) payload.location = toPoint(updates.location);
    if (updates.parentId !== undefined) payload.parent_id = updates.parentId;
    if (updates.totalPorts !== undefined) payload.capacity_total = updates.totalPorts;
    if (updates.usedPorts !== undefined) payload.capacity_used = updates.usedPorts;
    
    delete payload.parentId;
    delete payload.location;
    delete payload.totalPorts;
    delete payload.usedPorts;

    const { error } = await supabase.from('equipments').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteEquipment(id: string) {
    const { error } = await supabase.from('equipments').update({ is_deleted: true } as any).eq('id', id);
    if (error) throw error;
  },

  async createCable(cable: FiberCable) {
    const payload = {
        id: cable.id,
        name: cable.name,
        category: cable.category,
        start_node_id: extractUuid(cable.startNodeId),
        end_node_id: extractUuid(cable.endNodeId), 
        // Fix: Use correct property name from FiberCable interface (line 182 in original file)
        fiber_count: cable.fiberCount,
        status: cable.status,
        path_geometry: toLineString(cable.path), 
        // Fix: Use correct property name from FiberCable interface (line 185 in original file)
        length_meters: cable.lengthMeters,
        metadata: cable.metadata
    };

    const { error } = await (supabase.from('cables') as any).insert(payload);
    if (error) throw error;

    await AuditService.log({
        action: ActionType.CREATE,
        entity_type: EquipmentType.CABLE,
        entity_id: cable.id,
        new_data: { name: cable.name, start: cable.startNodeId, end: cable.endNodeId },
        user_email: (await supabase.auth.getUser()).data.user?.email || 'system'
    });
  },

  async updateCable(id: string, updates: Partial<FiberCable>) {
    const payload: any = { ...updates };
    if (updates.path) payload.path_geometry = toLineString(updates.path);
    if (updates.fiberCount) payload.fiber_count = updates.fiberCount;
    if (updates.lengthMeters) payload.length_meters = updates.lengthMeters;

    delete payload.path;
    delete payload.fiberCount;
    delete payload.lengthMeters;

    const { error } = await supabase.from('cables').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteCable(id: string) {
    const { error } = await supabase.from('cables').update({ is_deleted: true } as any).eq('id', id);
    if (error) throw error;
  },

  async createOperation(op: FieldOperation) {
    const { error } = await supabase.from('operations').insert({
      id: op.id,
      type: op.type,
      status: op.status,
      technician: op.technicianName,
      target_entity_id: op.targetEntityId,
      date: op.date,
      details: op.comments,
      metadata: { 
        name: op.name,
        mapSnapshot: op.mapSnapshot,
        comments: op.comments
      }
    } as any);
    if (error) throw error;
  },

  async updateOperation(id: string, updates: Partial<FieldOperation>) {
    const payload: any = {};
    if (updates.technicianName) payload.technician = updates.technicianName;
    if (updates.status) payload.status = updates.status;
    if (updates.comments !== undefined) payload.details = updates.comments;
    if (updates.date) payload.date = updates.date;
    
    // Construct metadata from updates to avoid losing existing fields if passed
    if (updates.name || updates.mapSnapshot || updates.comments !== undefined) {
        payload.metadata = {
            name: updates.name,
            mapSnapshot: updates.mapSnapshot,
            comments: updates.comments
        };
        // Remove undefined keys
        Object.keys(payload.metadata).forEach(key => payload.metadata[key] === undefined && delete payload.metadata[key]);
    }

    const { error } = await supabase.from('operations').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteOperation(id: string) {
    const { error } = await supabase.from('operations').delete().eq('id', id);
    if (error) throw error;
  },

  async createClient(pcoId: string, portId: number, client: any) {
    const { error: clErr } = await supabase.from('clients').insert({
      id: client.id,
      equipment_id: pcoId,
      port_id: portId,
      login: client.login,
      name: client.name,
      contact_info: { phone: client.phone, email: client.email },
      contract_info: { offer: client.offer, ontSerial: client.ontSerial, clientType: client.clientType }
    } as any);
    
    if (clErr) throw clErr;

    const { data: pco } = await supabase.from('equipments').select('capacity_used').eq('id', pcoId).single();
    const newUsed = (pco?.capacity_used || 0) + 1;
    await supabase.from('equipments').update({ capacity_used: newUsed } as any).eq('id', pcoId);

    return { success: true };
  },

  async updateClient(clientId: string, client: any) {
    const { error } = await supabase.from('clients').update({
      login: client.login,
      name: client.name,
      contact_info: { phone: client.phone, email: client.email },
      contract_info: { offer: client.offer, ontSerial: client.ontSerial, clientType: client.clientType }
    } as any).eq('id', clientId);
    if (error) throw error;
    return { success: true };
  },

  async deleteClient(clientId: string, pcoId: string) {
    const { error: delErr } = await supabase.from('clients').delete().eq('id', clientId);
    if (delErr) throw delErr;

    const { data: pco } = await supabase.from('equipments').select('capacity_used').eq('id', pcoId).single();
    const newUsed = Math.max(0, (pco?.capacity_used || 0) - 1);
    await supabase.from('equipments').update({ capacity_used: newUsed } as any).eq('id', pcoId);

    return { success: true };
  }
};
