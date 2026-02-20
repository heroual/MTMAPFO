
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { 
  Equipment, FiberCable, FieldOperation, OperationStatus, NetworkState, TraceResult,
  PhysicalSite, MSAN, OLT, Slot, GponPort, Splitter, PCO, EquipmentType, NetworkSnapshot, Coordinates
} from '../types';
import { NetworkService } from '../lib/service/network-service';
import { AuditService } from '../lib/service/audit-service';
import { GovernanceService } from '../lib/service/governance-service';
import { TraceService } from '../lib/fibre-trace-engine/trace-service';
import { useAuth } from './AuthContext';

interface NetworkContextType {
  equipments: Equipment[];
  cables: FiberCable[];
  operations: FieldOperation[];
  activeOperation: FieldOperation | null;
  loading: boolean;
  dbStatus: string;
  sites: PhysicalSite[];
  msans: MSAN[];
  olts: OLT[];
  slots: Slot[];
  ports: GponPort[];
  splitters: Splitter[];
  pcos: PCO[];
  joints: Equipment[];
  chambers: Equipment[];
  auditLogs: any[];
  snapshots: NetworkSnapshot[];
  isSnapshotMode: boolean;
  activeSnapshotId: string | null;
  mapFocusLocation: Coordinates | null;
  setMapFocusLocation: (loc: Coordinates | null) => void;
  startOperation: (op: Partial<FieldOperation>) => void;
  updateActiveOperation: (updates: Partial<FieldOperation>) => void;
  addDraftEquipment: (eq: any) => void;
  addDraftCable: (cable: any) => void;
  cancelOperation: () => void;
  commitOperation: (op: FieldOperation) => Promise<void>;
  updateExistingOperation: (id: string, updates: Partial<FieldOperation>) => Promise<void>;
  deleteExistingOperation: (id: string) => Promise<void>;
  addEquipment: (eq: Equipment) => Promise<void>;
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  addCable: (cable: FiberCable) => Promise<void>;
  updateCable: (id: string, updates: Partial<FiberCable>) => Promise<void>;
  deleteCable: (id: string) => Promise<void>;
  addClientToPco: (pcoId: string, portId: number, client: any) => Promise<any>;
  updateClientInPco: (pcoId: string, clientId: string, client: any) => Promise<any>;
  removeClientFromPco: (pcoId: string, portId: number, clientId: string) => Promise<any>;
  createSnapshot: (name: string, desc: string) => Promise<void>;
  viewSnapshot: (id: string | null) => void;
  restoreSnapshot: (id: string) => Promise<void>;
  traceFiberPath: (cableId: string, fiberIndex: number) => Promise<void>;
  clearTrace: () => void;
  traceResult: TraceResult | null;
  isTracing: boolean;
  refresh: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [cables, setCables] = useState<FiberCable[]>([]);
  const [operations, setOperations] = useState<FieldOperation[]>([]);
  const [activeOperation, setActiveOperation] = useState<FieldOperation | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('DISCONNECTED');
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<NetworkSnapshot[]>([]);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
  const [mapFocusLocation, setMapFocusLocation] = useState<Coordinates | null>(null);

  // Memoization haute performance des sous-parcs
  const sites = useMemo(() => equipments.filter(e => e.type === EquipmentType.SITE) as PhysicalSite[], [equipments]);
  const msans = useMemo(() => equipments.filter(e => e.type === EquipmentType.MSAN) as MSAN[], [equipments]);
  const olts = useMemo(() => equipments.filter(e => [EquipmentType.OLT, EquipmentType.OLT_BIG, EquipmentType.OLT_MINI].includes(e.type)) as OLT[], [equipments]);
  const splitters = useMemo(() => equipments.filter(e => e.type === EquipmentType.SPLITTER) as Splitter[], [equipments]);
  const pcos = useMemo(() => equipments.filter(e => e.type === EquipmentType.PCO) as PCO[], [equipments]);
  const joints = useMemo(() => equipments.filter(e => e.type === EquipmentType.JOINT), [equipments]);
  const chambers = useMemo(() => equipments.filter(e => e.type === EquipmentType.CHAMBER), [equipments]);
  const slots = useMemo(() => equipments.filter(e => e.type === EquipmentType.SLOT) as Slot[], [equipments]);
  const ports = useMemo(() => equipments.filter(e => e.type === EquipmentType.GPON_PORT) as GponPort[], [equipments]);

  const fetchData = useCallback(async (isSilent: boolean = false) => {
    if (!profile) return;
    if (!isSilent) setLoading(true);
    
    try {
      const netData = await NetworkService.fetchFullState();
      setEquipments(netData.equipments || []);
      setCables(netData.cables || []);
      setDbStatus('CONNECTED');
      
      if (!isSilent) setLoading(false);

      Promise.all([
        NetworkService.fetchOperations().catch(() => []),
        AuditService.fetchLogs().catch(() => []),
        GovernanceService.fetchSnapshots().catch(() => [])
      ]).then(([ops, logs, snaps]) => {
        setOperations(ops);
        setAuditLogs(logs);
        setSnapshots(snaps);
      });

    } catch (e) {
      console.error("[NetworkContext] Critical error during fetch:", e);
      setDbStatus('ERROR');
      if (!isSilent) setLoading(false);
    }
  }, [profile]);

  useEffect(() => { 
    if (profile) {
        fetchData();
    } else {
        setDbStatus('DISCONNECTED');
    }
  }, [profile, fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
        if (dbStatus === 'CONNECTED') {
            NetworkService.fetchFullState().catch(() => setDbStatus('ERROR'));
        }
    }, 60000);
    return () => clearInterval(interval);
  }, [dbStatus]);

  const addEquipment = async (eq: Equipment) => {
    const backup = [...equipments];
    setEquipments(prev => [...prev, eq]);
    try {
      await NetworkService.createEquipment(eq);
    } catch (e) {
      setEquipments(backup);
      throw e;
    }
  };

  const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
    const backup = [...equipments];
    setEquipments(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    try {
      await NetworkService.updateEquipment(id, updates);
    } catch (e) {
      setEquipments(backup);
      throw e;
    }
  };

  const deleteEquipment = async (id: string) => {
    const backup = [...equipments];
    setEquipments(prev => prev.filter(e => e.id !== id));
    try {
      await NetworkService.deleteEquipment(id);
    } catch (e) {
      setEquipments(backup);
      throw e;
    }
  };

  const addCable = async (cable: FiberCable) => {
    const backup = [...cables];
    setCables(prev => [...prev, cable]);
    try {
      await NetworkService.createCable(cable);
    } catch (e) {
      setCables(backup);
      throw e;
    }
  };

  const updateCable = async (id: string, updates: Partial<FiberCable>) => {
    const backup = [...cables];
    setCables(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    try {
      await NetworkService.updateCable(id, updates);
    } catch (e) {
      setEquipments(backup);
      throw e;
    }
  };

  const deleteCable = async (id: string) => {
    const backup = [...cables];
    setCables(prev => prev.filter(c => c.id !== id));
    try {
      await NetworkService.deleteCable(id);
    } catch (e) {
      setCables(backup);
      throw e;
    }
  };

  const startOperation = (op: Partial<FieldOperation>) => {
    setActiveOperation({
      id: crypto.randomUUID(),
      name: `OP-${Date.now()}`,
      status: OperationStatus.DRAFT,
      date: new Date().toISOString(),
      technicianName: profile?.full_name || 'Admin',
      teamId: 'ALPHA',
      zone: 'Zone Active',
      draftEquipments: [],
      draftCables: [],
      materials: [],
      location: { lat: 0, lng: 0 },
      ...op
    } as FieldOperation);
  };

  const updateActiveOperation = (updates: Partial<FieldOperation>) => setActiveOperation(prev => prev ? { ...prev, ...updates } : null);
  
  const updateExistingOperation = async (id: string, updates: Partial<FieldOperation>) => {
    const backup = [...operations];
    const updatedOps = operations.map(op => op.id === id ? { ...op, ...updates } : op);
    setOperations(updatedOps);
    try {
        const fullOp = updatedOps.find(o => o.id === id);
        if (fullOp) {
            await NetworkService.updateOperation(id, fullOp);
        }
    } catch (e) {
        setOperations(backup);
        throw e;
    }
  };

  const deleteExistingOperation = async (id: string) => {
    const backup = [...operations];
    setOperations(prev => prev.filter(op => op.id !== id));
    try {
        await NetworkService.deleteOperation(id);
    } catch (e) {
        setOperations(backup);
        throw e;
    }
  };

  const addDraftEquipment = (eq: any) => setActiveOperation(prev => prev ? { ...prev, draftEquipments: [...prev.draftEquipments, eq] } : null);
  const addDraftCable = (cable: any) => setActiveOperation(prev => prev ? { ...prev, draftCables: [...prev.draftCables, cable] } : null);
  const cancelOperation = () => setActiveOperation(null);

  const commitOperation = async (op: FieldOperation) => {
    setLoading(true);
    try {
      await NetworkService.createOperation(op);
      await Promise.all([
          ...op.draftEquipments.map(eq => NetworkService.createEquipment({ ...eq, operationId: op.id })),
          ...op.draftCables.map(c => NetworkService.createCable({ ...c, operationId: op.id }))
      ]);
      await fetchData();
      setActiveOperation(null);
    } finally {
      setLoading(false);
    }
  };

  const addClientToPco = async (pcoId: string, portId: number, client: any) => {
    const res = await NetworkService.createClient(pcoId, portId, client);
    await fetchData(true);
    return { success: true };
  };

  const updateClientInPco = async (pcoId: string, clientId: string, client: any) => {
    await NetworkService.updateClient(clientId, client);
    await fetchData(true);
    return { success: true };
  };

  const removeClientFromPco = async (pcoId: string, portId: number, clientId: string) => {
    await NetworkService.deleteClient(clientId, pcoId);
    await fetchData(true);
    return { success: true };
  };

  const createSnapshot = async (name: string, desc: string) => {
    await GovernanceService.createSnapshot(name, desc);
    await fetchData();
  };

  const viewSnapshot = (id: string | null) => setActiveSnapshotId(id);
  const restoreSnapshot = async (id: string) => {
    await GovernanceService.rollback(id);
    await fetchData();
  };

  const traceFiberPath = async (cableId: string, fiberIndex: number) => {
    setIsTracing(true);
    try {
      const state: NetworkState = { equipments, cables, sites, msans, olts, slots, ports, splitters, pcos, joints, chambers };
      const result = await TraceService.traceFiber(cableId, fiberIndex, state);
      setTraceResult(result);
    } finally {
      setIsTracing(false);
    }
  };

  return (
    <NetworkContext.Provider value={{
      equipments, cables, operations, activeOperation, loading, dbStatus,
      sites, msans, olts, slots, ports, splitters, pcos, joints, chambers,
      auditLogs, snapshots, isSnapshotMode: !!activeSnapshotId, activeSnapshotId,
      mapFocusLocation, setMapFocusLocation,
      startOperation, updateActiveOperation, updateExistingOperation, deleteExistingOperation,
      addDraftEquipment, addDraftCable, cancelOperation, commitOperation,
      addEquipment, updateEquipment, deleteEquipment, addCable, updateCable, deleteCable,
      addClientToPco, updateClientInPco, removeClientFromPco,
      createSnapshot, viewSnapshot, restoreSnapshot,
      traceFiberPath, clearTrace: () => setTraceResult(null), traceResult, isTracing, refresh: fetchData
    }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) throw new Error('useNetwork must be used within NetworkProvider');
  return context;
};
