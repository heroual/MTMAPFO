
import { NetworkEntity, EquipmentType, CableCategory, FiberCable } from '../types';

/**
 * Cabling Logic Engine - V2 Stricte
 * Enforces valid connections in the FTTH topology
 */

interface ConnectionCheck {
  valid: boolean;
  reason?: string;
  suggestedCategory?: CableCategory;
}

export const CablingRules = {
  
  getFiberCount: (typeCode: string): number => {
    const num = parseInt(typeCode.replace('FO', ''), 10);
    return isNaN(num) ? 0 : num;
  },

  /**
   * Validation stricte de la hiérarchie FTTH
   */
  validateConnection: (start: NetworkEntity, end: NetworkEntity): ConnectionCheck => {
    if (!start || !end) return { valid: false, reason: 'Équipements invalides.' };
    if (start.id === end.id) return { valid: false, reason: 'Boucle interdite : Source = Destination.' };

    const t1 = start.type;
    const t2 = end.type;

    const transportTypes = [EquipmentType.SITE, EquipmentType.OLT, EquipmentType.OLT_BIG, EquipmentType.OLT_MINI, EquipmentType.MSAN, EquipmentType.GPON_PORT];

    // --- RÈGLE 1 : TRANSPORT (Feeder) ---
    // Si l'une des extrémités est un équipement de tête (OLT/MSAN/Site)
    // OU si on relie un équipement passif (Joint/Chamber) à un Splitter (segment Feeder vers SRO)
    const isHead = transportTypes.includes(t1) || transportTypes.includes(t2);
    const isPassiveToSplitter = (t1 === EquipmentType.SPLITTER && (t2 === EquipmentType.JOINT || t2 === EquipmentType.CHAMBER)) ||
                                (t2 === EquipmentType.SPLITTER && (t1 === EquipmentType.JOINT || t1 === EquipmentType.CHAMBER));

    if (isHead || isPassiveToSplitter) {
        // Exception: OLT vers PCO direct est interdit
        if ((transportTypes.includes(t1) && t2 === EquipmentType.PCO) || (transportTypes.includes(t2) && t1 === EquipmentType.PCO)) {
            return { valid: false, reason: 'Topologie Invalide : L\'OLT/MSAN ne peut pas alimenter directement un PCO. Un Splitter est requis.' };
        }
        return { valid: true, suggestedCategory: CableCategory.TRANSPORT };
    }

    // --- RÈGLE 2 : DISTRIBUTION (Access) ---
    // Source ou Cible: Splitter (et l'autre n'est pas un transportType ou un Joint déjà géré au dessus)
    if (t1 === EquipmentType.SPLITTER || t2 === EquipmentType.SPLITTER) {
        return { valid: true, suggestedCategory: CableCategory.DISTRIBUTION };
    }

    // --- RÈGLE 3 : INTERMÉDIAIRE (Joint/Chamber) ---
    if (t1 === EquipmentType.JOINT || t1 === EquipmentType.CHAMBER) {
        // La catégorie dépend de ce qui arrive dans le Joint (on garde Distribution par défaut si ambigu)
        return { valid: true, suggestedCategory: CableCategory.DISTRIBUTION };
    }

    // --- RÈGLE 4 : PCO (Terminaison) ---
    if (t1 === EquipmentType.PCO) {
        return { valid: false, reason: 'Topologie Invalide : Un PCO est un point de terminaison, il ne peut pas être source d\'un câble réseau.' };
    }

    return { valid: true, suggestedCategory: CableCategory.DISTRIBUTION };
  },

  calculateLength: (path: {lat: number, lng: number}[]): number => {
    if (!path || path.length < 2) return 0;
    let total = 0;
    const R = 6371e3;
    for (let i = 0; i < path.length - 1; i++) {
        const c1 = path[i];
        const c2 = path[i+1];
        const φ1 = (c1.lat * Math.PI) / 180;
        const φ2 = (c2.lat * Math.PI) / 180;
        const Δφ = ((c2.lat - c1.lat) * Math.PI) / 180;
        const Δλ = ((c2.lng - c1.lng) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        total += R * c;
    }
    return Math.round(total);
  }
};
