
import { Equipment, EquipmentType, NetworkEntity } from '../types';
import { EquipmentArchitectureFactory } from './factory/equipment-architecture';

/**
 * Computes the official logical path for any network element
 * Format: [SITE]/[EQUIPMENT]/S[slot]/B[board]/P[port]/SP[splitter]/PCO[pco]/C[client]
 */
export const computeLogicalPath = (
  entity: NetworkEntity | Equipment,
  allEntities: (NetworkEntity | Equipment)[]
): string => {
  const parts: string[] = [];
  let current: (NetworkEntity | Equipment) | undefined = entity;

  // Safety break to prevent infinite loops in malformed data
  let depth = 0;

  while (current && depth < 10) {
    let segment = '';

    // Handle Virtual Items using Regex on ID
    if (current.isVirtual && current.id) {
       const eq = current as Equipment;
       if (current.id.includes('::P::')) segment = `P${eq.portNumber || 0}`;
       else if (current.id.includes('::B::')) segment = `B${eq.boardNumber || 1}`;
       else if (current.id.includes('::S::')) segment = `S${eq.slotNumber || 0}`;
    } else {
        // Physical Items - Fix: Use (current.name || '') to prevent toUpperCase error
        const name = (current.name || 'Unknown').toUpperCase();
        switch (current.type) {
        case EquipmentType.SITE:
            segment = name;
            break;
        case EquipmentType.OLT_BIG:
        case EquipmentType.OLT_MINI:
        case EquipmentType.MSAN:
            segment = name;
            break;
        case EquipmentType.SPLITTER:
            segment = `SP-${name}`;
            break;
        case EquipmentType.PCO:
            segment = name;
            break;
        default:
            segment = name;
        }
    }

    if (segment) parts.unshift(segment);

    // Navigate up
    if (current.isVirtual && current.parentId) {
        if (current.type === EquipmentType.SLOT) {
             current = allEntities.find(e => e.id === current?.parentId);
        } else {
             const rootId = EquipmentArchitectureFactory.getRootId(current.id);
             const root = allEntities.find(e => e.id === rootId);
             if (root) {
                 parts.unshift((root.name || 'ROOT').toUpperCase());
                 current = undefined; // Stop
             } else {
                 current = undefined;
             }
        }
    } else {
        current = allEntities.find(e => e.id === current?.parentId);
    }
    
    depth++;
  }

  return parts.join('/');
};
