
import React, { useMemo, useState } from 'react';
import { Splitter, PCO, EquipmentType, ClientProfile } from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';
import { X, Network, Box, Search, Zap, Navigation, Lock, User, RefreshCw, Link as LinkIcon, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SplitterDetailPanelProps {
  splitter: Splitter;
  onClose: () => void;
  onSelectPco: (pco: PCO) => void;
  onNavigate?: () => void;
}

interface PortData {
  pco: PCO | undefined;
  pcoPortIdx: number;
  clientLogin?: string; 
  isLocked: boolean;
  cableId: string;
  isGhost?: boolean;
}

const SplitterDetailPanel: React.FC<SplitterDetailPanelProps> = ({ splitter: propSplitter, onClose, onSelectPco, onNavigate }) => {
  const { t } = useTranslation();
  const { pcos, traceFiberPath, cables, updateEquipment, splitters } = useNetwork();
  const { profile } = useAuth();
  const [processingPort, setProcessingPort] = useState<number | null>(null);

  const isViewer = profile?.role === 'viewer';

  const splitter = useMemo(() => {
      return splitters.find(s => s.id === propSplitter.id) || propSplitter;
  }, [splitters, propSplitter.id]);

  const totalPorts = useMemo(() => {
    const ratioStr = splitter.ratio || splitter.metadata?.ratio || '1:32';
    const parts = ratioStr.split(':');
    return parseInt(parts[1]) || 32;
  }, [splitter]);

  const portMapping = useMemo(() => {
    const map = new Map<number, PortData>();
    const connections = splitter.metadata?.connections || {};

    Object.keys(connections).forEach(key => {
        const portNum = parseInt(key.replace(/[^0-9]/g, ''));
        const conn = connections[key];
        
        if (!isNaN(portNum) && conn.status === 'USED') {
             const pco = pcos.find(p => p.id === conn.connectedToId);
             const isGhost = !pco && !!conn.connectedToId;
             const pcoPortIdx = conn.pcoFiberIndex || 0;

             let clientLogin = undefined;
             // RÉCURSION TOPO : Chercher le client sur le port du PCO
             if (pco && pco.ports && pcoPortIdx > 0) {
                 const targetPort = pco.ports.find((p: any) => p.id === pcoPortIdx);
                 if (targetPort && targetPort.client) {
                     clientLogin = targetPort.client.login;
                 }
             }

             map.set(portNum, { 
                 pco: pco, 
                 pcoPortIdx: pcoPortIdx, 
                 clientLogin: clientLogin,
                 isLocked: true, 
                 cableId: conn.cableId,
                 isGhost
             });
        }
    });

    return map;
  }, [splitter, pcos]);

  const usedCount = Array.from(portMapping.values()).filter((v: PortData) => !v.isGhost).length;
  const freeCount = Math.max(0, totalPorts - usedCount);
  const utilization = Math.round((usedCount / totalPorts) * 100);

  const handleTrace = (portId: number) => {
      const info = portMapping.get(portId);
      if (info && info.cableId) {
          const conn = splitter.metadata?.connections?.[`P${portId}`];
          const fiberIdx = conn?.fiberIndex || 1;
          traceFiberPath(info.cableId, fiberIdx);
      }
  };

  const handleFreePort = async (portId: number) => {
      if (isViewer) return;
      if (confirm("Voulez-vous vraiment libérer ce port manuellement ?")) {
          setProcessingPort(portId);
          try {
              const currentMetadata = JSON.parse(JSON.stringify(splitter.metadata || {}));
              if (currentMetadata.connections) {
                  delete currentMetadata.connections[`P${portId}`];
              }
              await updateEquipment(splitter.id, {
                  metadata: currentMetadata
              });
          } catch (e) {
              console.error("Erreur libération port:", e);
              alert("Erreur lors de la mise à jour.");
          } finally {
              setProcessingPort(null);
          }
      }
  };

  return (
    <div className="absolute z-[500] flex flex-col w-full md:w-[440px] h-[85vh] md:h-auto md:max-h-[calc(100%-2rem)] bottom-0 md:bottom-auto md:top-4 md:right-4 animate-in slide-in-from-bottom-10 md:slide-in-from-right-4 duration-300">
      <div className="bg-white dark:bg-slate-950 rounded-t-[2.5rem] md:rounded-[2.5rem] border-t md:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full">
        
        <div className="p-6 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xl shadow-purple-500/20">
                    <Network size={24} />
                </div>
                <div>
                    <h3 className="text-slate-900 dark:text-white font-black text-base leading-tight uppercase tracking-tight">Splitter {splitter.ratio || splitter.metadata?.ratio}</h3>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mt-0.5">
                        {splitter.name}
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2"><X size={24}/></button>
        </div>

        <div className="px-6 py-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DISPONIBILITÉ PORTS</span>
                 <span className={`text-[10px] font-black px-3 py-1 rounded-full ${freeCount === 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {freeCount} LIBRES / {totalPorts} TOTAL
                 </span>
             </div>
             <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
                 <div className="h-full bg-rose-500 transition-all duration-700 shadow-[0_0_10px_rgba(244,63,94,0.5)]" style={{width: `${utilization}%`}}></div>
                 <div className="h-full bg-emerald-500 transition-all duration-700" style={{width: `${100 - utilization}%`}}></div>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50 dark:bg-slate-900/30 custom-scrollbar">
            <div className="grid grid-cols-1 gap-1">
                {Array.from({ length: totalPorts }).map((_, i) => {
                    const portId = i + 1;
                    const data = portMapping.get(portId);
                    const isGhost = data?.isGhost;
                    
                    return (
                        <div 
                            key={portId} 
                            className={`group p-3 rounded-2xl flex items-center gap-4 transition-all border border-transparent ${data && !isGhost ? 'bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-500 shadow-sm cursor-pointer' : 'bg-slate-50 dark:bg-slate-900/40 opacity-60'}`}
                            onClick={() => data?.pco && onSelectPco(data.pco)}
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black font-mono border-2 transition-all ${
                                data 
                                ? (isGhost ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800')
                                : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                            }`}>
                                {portId}
                            </div>

                            <div className="flex-1 min-w-0">
                                {data ? (
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            {data.pco ? (
                                                <>
                                                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{data.pco.name}</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-600 text-[10px] font-black uppercase">
                                                    <AlertTriangle size={12} />
                                                    <span>Nœud Inaccessible</span>
                                                </div>
                                            )}
                                        </div>

                                        {data.clientLogin && (
                                            <div className="flex items-center gap-1.5 mt-0.5 animate-in slide-in-from-left-1">
                                                <div className="px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[8px] font-black uppercase flex items-center gap-1">
                                                   <User size={8} /> CONNECTÉ
                                                </div>
                                                <span className="text-[11px] font-mono font-black text-emerald-600 dark:text-emerald-400 truncate">
                                                    {data.clientLogin}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                                            {isGhost 
                                                ? `BLOQUÉ: ID ${String(splitter.metadata?.connections?.[`P${portId}`]?.connectedToId).substring(0,8)}...` 
                                                : `PCO PORT #${data.pcoPortIdx}`
                                            }
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] animate-pulse">
                                        LIBRE
                                    </div>
                                )}
                            </div>

                            {data && !isGhost && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleTrace(portId); }}
                                        className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        title="Tracer continuité"
                                    >
                                        <Zap size={16} fill="currentColor" />
                                    </button>
                                </div>
                            )}

                            {isGhost && !isViewer && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleFreePort(portId); }}
                                    className="p-2 bg-rose-500 text-white rounded-xl shadow-lg transition-all hover:scale-110 active:scale-95"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

      </div>
    </div>
  );
};

export default SplitterDetailPanel;
