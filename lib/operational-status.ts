
import { 
  NetworkEntity, FieldOperation, OperationStatus, OperationType, 
  EquipmentStatus, RiskLevel, PCO, Splitter, EquipmentType, Equipment, FiberCable
} from '../types';

export const OperationalStatusEngine = {
  /**
   * Calcule la saturation d'un équipement ou d'un câble
   */
  computeSaturation: (entity: any): { percent: number; isSaturated: boolean } => {
    let used = 0;
    let total = 0;

    // Extraction robuste des capacités (priorité à la racine, puis metadata, puis noms DB Supabase)
    const getVal = (obj: any, key: string, fallback: number = 0) => {
        // Check standard camelCase UI names
        if (obj[key] !== undefined) return obj[key];
        
        // Check Supabase snake_case names
        const dbKey = key === 'totalPorts' ? 'capacity_total' : (key === 'usedPorts' ? 'capacity_used' : null);
        if (dbKey && obj[dbKey] !== undefined) return obj[dbKey];

        // Check inside metadata
        if (obj.metadata && obj.metadata[key] !== undefined) return obj.metadata[key];
        if (dbKey && obj.metadata && obj.metadata[dbKey] !== undefined) return obj.metadata[dbKey];
        
        return fallback;
    };

    // Logic per type
    if (entity.type === EquipmentType.PCO) {
        total = getVal(entity, 'totalPorts', 8);
        used = getVal(entity, 'usedPorts', 0);
        
        // Si usedPorts n'est pas à jour, on compte les ports réellement occupés dans l'objet
        if (used === 0 && entity.ports) {
            used = entity.ports.filter((p: any) => p.status === 'USED' || p.client).length;
        }
    } else if (entity.type === EquipmentType.SPLITTER) {
        const ratio = entity.ratio || (entity.metadata && entity.metadata.ratio) || '1:32';
        total = parseInt(ratio.split(':')[1] || '32');
        used = Object.values(entity.metadata?.connections || {}).filter((c: any) => c.status === 'USED').length;
    } else if (entity.type === EquipmentType.CABLE) {
        total = entity.fiberCount || 1;
        // Check metadata or db field
        used = Object.values(entity.metadata?.fibers || {}).filter((f: any) => f.status === 'USED').length;
    } else if ([EquipmentType.OLT_BIG, EquipmentType.OLT_MINI, EquipmentType.MSAN, EquipmentType.OLT].includes(entity.type)) {
        total = getVal(entity, 'totalSlots', 17);
        used = Object.values(entity.metadata?.slots || {}).filter((s: any) => s.status === 'OCCUPIED').length;
    } else if (entity.type === EquipmentType.BOARD) {
        total = getVal(entity, 'portCount', 16);
        used = Object.values(entity.metadata?.connections || {}).filter((c: any) => c.status === 'USED').length;
    } else if (entity.type === EquipmentType.JOINT) {
        total = getVal(entity, 'capacityFibers', 144);
        used = (entity.metadata?.splices || []).length;
    }

    // Protection contre division par zéro
    if (total <= 0) return { percent: 0, isSaturated: false };

    const percent = Math.min(100, Math.round((used / total) * 100));
    return { percent, isSaturated: percent >= 100 };
  },

  computeStatus: (entity: NetworkEntity, operations: FieldOperation[]): { status: EquipmentStatus; risk: RiskLevel; riskReason?: string } => {
    const { percent, isSaturated } = OperationalStatusEngine.computeSaturation(entity);
    
    let status = EquipmentStatus.AVAILABLE;
    let risk = RiskLevel.NONE;
    let riskReason = '';

    if (isSaturated) {
        status = EquipmentStatus.SATURATED;
        risk = RiskLevel.CRITICAL;
        riskReason = `Saturation Totale (100%)`;
    } else if (percent >= 80) {
        status = EquipmentStatus.WARNING;
        risk = RiskLevel.HIGH;
        riskReason = `Saturation Imminente (${percent}%)`;
    }

    // Override with maintenance if active op exists
    const activeMaint = operations.find(op => 
        (op.targetEntityId === entity.id || op.createdEntityId === entity.id) && 
        op.status === OperationStatus.IN_PROGRESS
    );
    if (activeMaint) status = EquipmentStatus.MAINTENANCE;

    return { status, risk, riskReason };
  }
};
