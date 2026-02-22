
import React, { useMemo, useState, useEffect } from 'react';
import { FiberCable, EquipmentStatus, CableCategory, EquipmentType, Equipment } from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';
import { X, Activity, Zap, ArrowRight, Edit2, Save, RotateCcw, Server, Network, Lock, Cable as CableIcon, Loader2, Link as LinkIcon, Spline, GitMerge, Radio, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FiberStandards } from '../../lib/fiber-standards';

interface CableDetailPanelProps {
  cable: FiberCable;
  onClose: () => void;
}

const CableDetailPanel: React.FC<CableDetailPanelProps> = ({ cable: initialCable, onClose }) => {
  const { t } = useTranslation();
  const { traceFiberPath, updateCable, updateEquipment, equipments, cables } = useNetwork();
  const { profile } = useAuth();
  
  const isViewer = profile?.role === 'viewer';

  const cable = useMemo(() => cables.find(c => c.id === initialCable.id) || initialCable, [cables, initialCable.id]);
  const startNode = useMemo(() => equipments.find(e => e.id === cable.startNodeId.split('::')[0]), [cable.startNodeId, equipments]);
  const endNode = useMemo(() => equipments.find(e => e.id === cable.endNodeId.split('::')[0]), [cable.endNodeId, equipments]);

  const [isEditing, setIsEditing] = useState(false);
  const [draftMappings, setDraftMappings] = useState<Record<number, { upstreamPort?: string, downstreamPort?: string }>>({}); 
  const [isSaving, setIsSaving] = useState(false);

  // Analyse de tous les ports occupés dans le réseau entier pour le verrouillage
  const globalOccupiedPorts = useMemo(() => {
    const occupied = new Set<string>();
    
    // Scan des équipements pour trouver les ports utilisés par d'AUTRES câbles
    equipments.forEach(eq => {
        const conns = (eq.metadata as any)?.connections || {};
        Object.keys(conns).forEach(portKey => {
            const conn = conns[portKey];
            if (conn.status === 'USED' && conn.cableId !== cable.id) {
                occupied.add(`${eq.id}::${portKey}`);
            }
        });

        // Scan spécifique OLT (Slots/Ports)
        if ((eq.metadata as any)?.slots) {
            const slots = (eq.metadata as any).slots;
            Object.keys(slots).forEach(sNum => {
                const slot = slots[sNum];
                if (slot.ports) {
                    Object.keys(slot.ports).forEach(pNum => {
                        const p = slot.ports[pNum];
                        if (p.status === 'USED' && p.cableId !== cable.id) {
                            occupied.add(`${eq.id}::S${sNum}/P${pNum}`);
                        }
                    });
                }
            });
        }
    });
    return occupied;
  }, [equipments, cable.id]);

  const getOptionsForSide = (node: Equipment | undefined, isUpstream: boolean) => {
    if (!node) return [];
    const options: { label: string, value: string, isUsed: boolean, type: string, isSource?: boolean }[] = [];

    // Cas JOINT : Fibres des autres câbles
    if (node.type === EquipmentType.JOINT) {
        const neighbors = cables.filter(c => c.id !== cable.id && !c.isDeleted && (c.startNodeId === node.id || c.endNodeId === node.id));
        neighbors.forEach(nc => {
            for (let f = 1; f <= nc.fiberCount; f++) {
                // Fix: Cast metadata to any to access fibers property safely
                const fiberMeta = (nc.metadata as any)?.fibers?.[f];
                // Fix: Cast fiberMeta to any to ensure properties status and upstreamPort are accessible
                const hasSignal = (fiberMeta as any)?.status === 'USED' && !!(fiberMeta as any)?.upstreamPort;
                
                // Une fibre est utilisée si elle est déjà soudée à un autre câble (pas celui-ci)
                const splicedToOther = (node.metadata as any)?.splices?.some((s: any) => 
                    ((s.cableIn === nc.id && s.fiberIn === f) || (s.cableOut === nc.id && s.fiberOut === f)) &&
                    (s.cableIn !== cable.id && s.cableOut !== cable.id)
                );

                options.push({
                    label: `${hasSignal ? '⚡ SIGNAL OLT : ' : 'BRIN : '}${nc.name} (F${f})`,
                    value: `SPLICE:${nc.id}:${f}`,
                    isUsed: !!splicedToOther,
                    type: 'JOINT_FIBER',
                    isSource: hasSignal
                });
            }
        });
    }

    // Cas OLT/MSAN
    if (isUpstream && (node.type === EquipmentType.MSAN || node.type.includes('OLT'))) {
        const slots = (node.metadata as any)?.slots || {};
        Object.keys(slots).forEach(sNum => {
            const slot = slots[sNum];
            if (slot.status === 'OCCUPIED' && slot.portCount) {
                for (let i = 0; i < slot.portCount; i++) {
                    const portVal = `S${sNum}/P${i}`;
                    const globalKey = `${node.id}::${portVal}`;
                    options.push({ 
                        label: `PORT OLT S${sNum}/P${i}`, 
                        value: portVal, 
                        isUsed: globalOccupiedPorts.has(globalKey), 
                        type: 'OLT_PORT' 
                    });
                }
            }
        });
    }

    // Cas SPLITTER
    if (node.type === EquipmentType.SPLITTER) {
        const inputKey = `${node.id}::INPUT`;
        options.push({ 
            label: 'ENTRÉE SPLITTER (Uplink)', 
            value: 'INPUT', 
            isUsed: globalOccupiedPorts.has(inputKey), 
            type: 'SPLITTER_IN' 
        });

        const ratio = (node.metadata as any)?.ratio || '1:32';
        const cap = parseInt(String(ratio).split(':')[1]) || 32;
        for (let i = 1; i <= cap; i++) {
            const portKey = `${node.id}::P${i}`;
            options.push({ 
                label: `SORTIE SPLITTER Port ${i}`, 
                value: i.toString(), 
                isUsed: globalOccupiedPorts.has(portKey), 
                type: 'SPLITTER_OUT' 
            });
        }
    }

    // Cas PCO
    if (node.type === EquipmentType.PCO) {
        const totalPorts = (node as any).totalPorts || (node as any).metadata?.totalPorts || 8;
        for (let i = 1; i <= totalPorts; i++) {
            const portKey = `${node.id}::${i}`;
            options.push({ 
                label: `PORT PCO #${i}`, 
                value: i.toString(), 
                isUsed: globalOccupiedPorts.has(portKey), 
                type: 'PCO_PORT' 
            });
        }
    }

    return options;
  };

  const upstreamOptions = useMemo(() => getOptionsForSide(startNode, true), [startNode, cables, cable.id, isEditing, globalOccupiedPorts]);
  const downstreamOptions = useMemo(() => getOptionsForSide(endNode, false), [endNode, cables, cable.id, isEditing, globalOccupiedPorts]);

  useEffect(() => {
      if (isEditing) {
          const initial: Record<number, { upstreamPort?: string, downstreamPort?: string }> = {};
          const fiberMeta = ((cable.metadata as any)?.fibers || {}) as any;
          for (let i = 1; i <= cable.fiberCount; i++) {
              // Fix: Explicitly cast indexed access of any to any to prevent "unknown" inference in some TS environments
              const f = (fiberMeta as any)[i] as any;
              // Fix: cast assignment to any to avoid Property 'upstreamPort' does not exist on type '{}'
              (initial as any)[i] = {
                  upstreamPort: f?.upstreamPort ? String(f.upstreamPort) : undefined,
                  downstreamPort: f?.downstreamPort ? String(f.downstreamPort) : undefined
              };
          }
          setDraftMappings(initial);
      }
  }, [cable, isEditing]);

  const handleSaveMapping = async () => {
      if (isViewer) return;
      setIsSaving(true);
      try {
          // Use any for newFibers to avoid unknown index signature issues
          const newFibers: any = { ...((cable.metadata as any)?.fibers || {}) };
          const startNodeMeta = JSON.parse(JSON.stringify(startNode?.metadata || {}));
          const endNodeMeta = JSON.parse(JSON.stringify(endNode?.metadata || {}));
          
          let jointSplices: any[] = [];
          const activeJoint = startNode?.type === EquipmentType.JOINT ? startNode : (endNode?.type === EquipmentType.JOINT ? endNode : null);
          if (activeJoint) {
              jointSplices = ((activeJoint.metadata as any)?.splices || []).filter((s: any) => s.cableIn !== cable.id && s.cableOut !== cable.id);
          }

          // Use Object.entries to correctly type mapping as { upstreamPort?: string, downstreamPort?: string }
          // Fix: cast entries to any to avoid "unknown" inference on mapping object properties
          (Object.entries(draftMappings) as any[]).forEach(([fKey, mapping]) => {
              const fid = parseInt(fKey);
              const { upstreamPort, downstreamPort } = mapping;

              // --- LOGIQUE DE NETTOYAGE (LIBÉRATION DES PORTS) ---
              // Si le port amont a changé ou a été supprimé, on libère l'ancien port sur l'équipement
              const oldUpstreamPort = (cable.metadata as any)?.fibers?.[fid]?.upstreamPort;
              if (oldUpstreamPort && oldUpstreamPort !== upstreamPort) {
                  const portKey = startNode?.type === EquipmentType.SPLITTER ? `P${oldUpstreamPort}` : oldUpstreamPort;
                  if (startNodeMeta.connections?.[portKey]?.cableId === cable.id) {
                      delete startNodeMeta.connections[portKey];
                  }
              }

              // Si le port aval a changé ou a été supprimé, on libère l'ancien port sur l'équipement
              const oldDownstreamPort = (cable.metadata as any)?.fibers?.[fid]?.downstreamPort;
              if (oldDownstreamPort && oldDownstreamPort !== downstreamPort) {
                  let portKey = oldDownstreamPort;
                  if (endNode?.type === EquipmentType.SPLITTER) {
                      portKey = oldDownstreamPort === 'INPUT' ? 'INPUT' : `P${oldDownstreamPort}`;
                  }
                  if (endNodeMeta.connections?.[portKey]?.cableId === cable.id) {
                      delete endNodeMeta.connections[portKey];
                  }
              }

              newFibers[fid] = {
                  ...newFibers[fid],
                  status: (upstreamPort || downstreamPort) ? 'USED' : 'FREE',
                  upstreamPort,
                  upstreamId: startNode?.id,
                  downstreamPort,
                  downstreamId: endNode?.id
              };

              if (upstreamPort && String(upstreamPort).startsWith('SPLICE:') && startNode?.type === EquipmentType.JOINT) {
                  const [_, otherCableId, otherFiberIdx] = String(upstreamPort).split(':');
                  jointSplices.push({ 
                      cableIn: otherCableId, fiberIn: parseInt(otherFiberIdx), 
                      cableOut: cable.id, fiberOut: fid,
                      type: 'FUSION', date: new Date().toISOString()
                  });
              }

              // ALLOCATION PORT SPLITTER (AMONT)
              if (startNode?.type === EquipmentType.SPLITTER && upstreamPort && !isNaN(parseInt(upstreamPort))) {
                  if (!startNodeMeta.connections) startNodeMeta.connections = {};
                  const pcoPortIdx = (endNode?.type === EquipmentType.PCO && downstreamPort && !isNaN(parseInt(downstreamPort))) ? parseInt(downstreamPort) : undefined;
                  
                  startNodeMeta.connections[`P${upstreamPort}`] = {
                      status: 'USED', cableId: cable.id, fiberIndex: fid, 
                      connectedToId: endNode?.id,
                      connectedTo: endNode?.name || 'Aval', 
                      pcoFiberIndex: pcoPortIdx,
                      updatedAt: new Date().toISOString()
                  };
              }

              if (downstreamPort === 'INPUT' && endNode?.type === EquipmentType.SPLITTER) {
                  if (!endNodeMeta.connections) endNodeMeta.connections = {};
                  endNodeMeta.connections['INPUT'] = {
                      status: 'USED', cableId: cable.id, fiberIndex: fid, 
                      connectedTo: startNode?.name || 'Amont', updatedAt: new Date().toISOString()
                  };
              }

              // ALLOCATION PORT SPLITTER (AVAL)
              if (endNode?.type === EquipmentType.SPLITTER && downstreamPort && !isNaN(parseInt(downstreamPort))) {
                  if (!endNodeMeta.connections) endNodeMeta.connections = {};
                  const pcoPortIdx = (startNode?.type === EquipmentType.PCO && upstreamPort && !isNaN(parseInt(upstreamPort))) ? parseInt(upstreamPort) : undefined;

                  endNodeMeta.connections[`P${downstreamPort}`] = {
                      status: 'USED', cableId: cable.id, fiberIndex: fid, 
                      connectedToId: startNode?.id,
                      connectedTo: startNode?.name || 'Amont', 
                      pcoFiberIndex: pcoPortIdx,
                      updatedAt: new Date().toISOString()
                  };
              }

              if (endNode?.type === EquipmentType.PCO && downstreamPort && !isNaN(parseInt(downstreamPort))) {
                  if (!endNodeMeta.connections) endNodeMeta.connections = {};
                  endNodeMeta.connections[downstreamPort] = {
                      status: 'USED', cableId: cable.id, fiberIndex: fid, 
                      connectedTo: startNode?.name || 'Amont', updatedAt: new Date().toISOString()
                  };
              }
          });

          await updateCable(cable.id, { metadata: { ...cable.metadata, fibers: newFibers } });
          
          if (startNode) {
              if (startNode.type === EquipmentType.JOINT) startNodeMeta.splices = jointSplices;
              await updateEquipment(startNode.id, { metadata: startNodeMeta });
          }
          if (endNode) {
              if (endNode.type === EquipmentType.JOINT) endNodeMeta.splices = jointSplices;
              await updateEquipment(endNode.id, { metadata: endNodeMeta });
          }

          setIsEditing(false);
      } catch (e) {
          console.error("Save Error", e);
      } finally {
          setIsSaving(false);
      }
  };

  const fiberData = useMemo(() => {
      return Array.from({ length: cable.fiberCount }).map((_, i) => {
          const id = i + 1;
          const info = (cable.metadata as any)?.fibers?.[id] || {};
          const struct = FiberStandards.getStructure(cable.cableType, id);
          return { id, ...info, struct };
      });
  }, [cable]);

  // Fix: cast Object.values result to any to avoid property existence checks on partial types
  const currentlySelectedUpstream = useMemo(() => new Set((Object.values(draftMappings) as any[]).map(m => m.upstreamPort).filter(Boolean)), [draftMappings]);
  const currentlySelectedDownstream = useMemo(() => new Set((Object.values(draftMappings) as any[]).map(m => m.downstreamPort).filter(Boolean)), [draftMappings]);

  return (
    <div className="absolute z-[500] flex flex-col w-full md:w-[720px] h-[85vh] md:h-auto md:max-h-[calc(100%-2rem)] bottom-0 md:bottom-auto md:top-4 md:right-4 animate-in slide-in-from-bottom-10 md:slide-in-from-right-4 duration-300">
      <div className="bg-white dark:bg-slate-950 rounded-t-[2rem] md:rounded-[2rem] border-t md:border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col h-full">
        
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex justify-between items-start shrink-0">
            <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${cable.category === CableCategory.TRANSPORT ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>{cable.category}</span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">{cable.cableType}</span>
                </div>
                <h3 className="text-white font-black text-xl leading-tight truncate">{cable.name}</h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-mono font-bold">
                    <span className="truncate max-w-[150px] flex items-center gap-1"><Server size={12}/> {startNode?.name}</span>
                    <ArrowRight size={12} className="text-blue-500" />
                    <span className="truncate max-w-[150px] flex items-center gap-1"><Network size={12}/> {endNode?.name}</span>
                </div>
            </div>
            <div className="flex gap-2">
                {isEditing ? (
                    <>
                        <button onClick={() => setIsEditing(false)} className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"><RotateCcw size={18} /></button>
                        <button onClick={handleSaveMapping} disabled={isSaving} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all active:scale-95">
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ENREGISTRER
                        </button>
                    </>
                ) : (
                    <>
                        {!isViewer && (
                          <button onClick={() => setIsEditing(true)} className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-95">
                              <GitMerge size={16} /> BRASSAGE & SOUDURES
                          </button>
                        )}
                        <button onClick={onClose} className="text-slate-500 hover:text-white p-2 transition-colors"><X size={24} /></button>
                    </>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-950">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800">
                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <th className="p-4 w-14 text-center">FO #</th>
                        <th className="p-4 w-28">Couleur</th>
                        <th className="p-4">Amont ({startNode?.type})</th>
                        <th className="p-4">Aval ({endNode?.type})</th>
                        {!isEditing && <th className="p-4 w-12"></th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {fiberData.map((fiber) => (
                        <tr key={fiber.id} className={`transition-colors ${fiber.status === 'USED' ? 'bg-blue-50/20 dark:bg-blue-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}>
                            <td className="p-4 text-center font-mono font-black text-slate-500">{fiber.id}</td>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-md border shadow-sm shrink-0" style={{ backgroundColor: fiber.struct.fiberColor.hex }}></div>
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${fiber.status === 'USED' ? 'text-blue-500' : 'text-slate-400'}`}>
                                        {fiber.status === 'USED' ? 'PATCHÉ' : 'LIBRE'}
                                    </span>
                                </div>
                            </td>
                            <td className="p-4">
                                {isEditing ? (
                                    <div className="relative group">
                                        <select 
                                            value={draftMappings[fiber.id]?.upstreamPort || ''}
                                            onChange={e => setDraftMappings(prev => ({ ...prev, [fiber.id]: { ...prev[fiber.id], upstreamPort: e.target.value } }))}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 rounded-xl px-2 py-2 text-[11px] font-black outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">-- LIBRE --</option>
                                            {upstreamOptions.map(opt => {
                                                const isTakenInDraft = currentlySelectedUpstream.has(opt.value) && draftMappings[fiber.id]?.upstreamPort !== opt.value;
                                                return (
                                                    <option key={opt.value} value={opt.value} disabled={opt.isUsed || isTakenInDraft} className={opt.isSource ? 'text-emerald-600 font-extrabold' : ''}>
                                                        {opt.isUsed ? '🔒 ' : (isTakenInDraft ? '📎 ' : '')}{opt.label} {opt.isUsed ? '(OCCUPÉ)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500">
                                            <GitMerge size={12} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold truncate max-w-[220px]">
                                        {fiber.upstreamPort ? (
                                            <>
                                                <div className="p-1 bg-blue-100 dark:bg-blue-500/20 rounded text-blue-600 dark:text-blue-400"><Lock size={10}/></div>
                                                <span className="truncate">{String(fiber.upstreamPort).replace('SPLICE:', '')}</span>
                                            </>
                                        ) : <span className="text-slate-300 font-normal italic">Non raccordé</span>}
                                    </div>
                                )}
                            </td>
                            <td className="p-4">
                                {isEditing ? (
                                    <div className="relative group">
                                        <select 
                                            value={draftMappings[fiber.id]?.downstreamPort || ''}
                                            onChange={e => setDraftMappings(prev => ({ ...prev, [fiber.id]: { ...prev[fiber.id], downstreamPort: e.target.value } }))}
                                            className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 dark:focus:border-emerald-400 rounded-xl px-2 py-2 text-[11px] font-black outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">-- LIBRE --</option>
                                            {downstreamOptions.map(opt => {
                                                const isTakenInDraft = currentlySelectedDownstream.has(opt.value) && draftMappings[fiber.id]?.downstreamPort !== opt.value;
                                                return (
                                                    <option key={opt.value} value={opt.value} disabled={opt.isUsed || isTakenInDraft}>
                                                        {opt.isUsed ? '🔒 ' : (isTakenInDraft ? '📎 ' : '')}{opt.label} {opt.isUsed ? '(OCCUPÉ)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-emerald-500">
                                            <ArrowRight size={12} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold truncate max-w-[220px]">
                                        {fiber.downstreamPort ? (
                                            <>
                                                <div className="p-1 bg-emerald-100 dark:bg-emerald-500/20 rounded text-emerald-600 dark:text-emerald-400"><Lock size={10}/></div>
                                                <span className="truncate">{fiber.downstreamPort === 'INPUT' ? 'Entrée Splitter' : 'Port ' + fiber.downstreamPort}</span>
                                            </>
                                        ) : <span className="text-slate-300 font-normal italic">Extrémité libre</span>}
                                    </div>
                                )}
                            </td>
                            {!isEditing && (
                                <td className="p-4 text-right">
                                    {fiber.status === 'USED' && (
                                        <button onClick={() => traceFiberPath(cable.id, fiber.id)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-all active:scale-90" title="Tracer continuité">
                                            <Zap size={16} fill="currentColor" />
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-black tracking-widest shrink-0">
            <div className="flex items-center gap-5">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> SIGNAL OLT DÉTECTÉ</div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> SOUDURE JOINT</div>
                <div className="flex items-center gap-2 text-slate-400"><Lock size={12}/> PORTS VÉRROUILLÉS</div>
            </div>
            <div className="flex items-center gap-2 opacity-50"><Spline size={12} /> MOTEUR DE CONTINUITÉ V2.5</div>
        </div>
      </div>
    </div>
  );
};

export default CableDetailPanel;
