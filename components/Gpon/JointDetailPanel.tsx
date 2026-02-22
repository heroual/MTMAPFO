
import React, { useState, useMemo } from 'react';
import { FiberCable, Equipment } from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';
import { X, Link, Trash2, ArrowRight, ArrowLeftRight, Cable, Lock, Navigation, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FiberStandards } from '../../lib/fiber-standards';

interface JointDetailPanelProps {
  joint: Equipment;
  onClose: () => void;
  onNavigate?: () => void;
}

const JointDetailPanel: React.FC<JointDetailPanelProps> = ({ joint: propJoint, onClose, onNavigate }) => {
  const { t } = useTranslation();
  const { cables, updateEquipment, updateCable, equipments } = useNetwork();
  const { profile } = useAuth();
  
  const isViewer = profile?.role === 'viewer';

  const joint = useMemo(() => {
      return equipments.find(e => e.id === propJoint.id) || propJoint;
  }, [equipments, propJoint]);

  const [selectedIn, setSelectedIn] = useState<{ cableId: string, fiberIdx: number } | null>(null);
  const [selectedOut, setSelectedOut] = useState<{ cableId: string, fiberIdx: number } | null>(null);

  const { allCables } = useMemo(() => {
      const related = cables.filter(c => !c.isDeleted && (c.startNodeId === joint.id || c.endNodeId === joint.id));
      return { allCables: related };
  }, [cables, joint]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredCables = useMemo(() => {
      if (!searchTerm) return allCables;
      return allCables.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allCables, searchTerm]);

  const isFiberUsed = (cableId: string, fiberIdx: number) => {
      return splices.some(s => (s.cableIn === cableId && s.fiberIn === fiberIdx) || (s.cableOut === cableId && s.fiberOut === fiberIdx));
  };

  const splices = useMemo(() => (joint.metadata?.splices || []) as { cableIn: string, fiberIn: number, cableOut: string, fiberOut: number }[], [joint]);

  const handleSplice = async () => {
      if (!selectedIn || !selectedOut || isViewer) return;
      
      // Empêcher de souder la même fibre à elle-même
      if (selectedIn.cableId === selectedOut.cableId && selectedIn.fiberIdx === selectedOut.fiberIdx) {
          return;
      }

      const cIn = cables.find(c => c.id === selectedIn.cableId);
      const cOut = cables.find(c => c.id === selectedOut.cableId);
      if (!cIn || !cOut) return;

      const newSplice = {
          cableIn: selectedIn.cableId,
          fiberIn: selectedIn.fiberIdx,
          cableOut: selectedOut.cableId,
          fiberOut: selectedOut.fiberIdx,
          id: crypto.randomUUID(),
          date: new Date().toISOString()
      };

      const updatedSplices = [...splices, newSplice];
      
      // 1. Update Joint FIRST for immediate UI feedback
      await updateEquipment(joint.id, {
          metadata: { ...joint.metadata, splices: updatedSplices }
      });

      // 2. Update Cables
      if (cIn.id === cOut.id) {
          // Same cable on both sides
          const newFibers = { ...(cIn.metadata?.fibers || {}) };
          
          const portKeyIn = cIn.endNodeId === joint.id ? 'downstreamPort' : 'upstreamPort';
          const idKeyIn = cIn.endNodeId === joint.id ? 'downstreamId' : 'upstreamId';
          if (newFibers[selectedIn.fiberIdx]) {
              newFibers[selectedIn.fiberIdx] = { 
                  ...newFibers[selectedIn.fiberIdx],
                  status: 'USED',
                  [portKeyIn]: `SPLICE:${selectedOut.cableId}:${selectedOut.fiberIdx}`,
                  [idKeyIn]: joint.id
              };
          }

          const portKeyOut = cOut.endNodeId === joint.id ? 'downstreamPort' : 'upstreamPort';
          const idKeyOut = cOut.endNodeId === joint.id ? 'downstreamId' : 'upstreamId';
          if (newFibers[selectedOut.fiberIdx]) {
              newFibers[selectedOut.fiberIdx] = {
                  ...newFibers[selectedOut.fiberIdx],
                  status: 'USED',
                  [portKeyOut]: `SPLICE:${selectedIn.cableId}:${selectedIn.fiberIdx}`,
                  [idKeyOut]: joint.id
              };
          }

          await updateCable(cIn.id, { metadata: { ...cIn.metadata, fibers: newFibers } });
      } else {
          // Different cables
          const newFibersIn = { ...(cIn.metadata?.fibers || {}) };
          const portKeyIn = cIn.endNodeId === joint.id ? 'downstreamPort' : 'upstreamPort';
          const idKeyIn = cIn.endNodeId === joint.id ? 'downstreamId' : 'upstreamId';
          if (newFibersIn[selectedIn.fiberIdx]) {
              newFibersIn[selectedIn.fiberIdx] = {
                  ...newFibersIn[selectedIn.fiberIdx],
                  status: 'USED',
                  [portKeyIn]: `SPLICE:${selectedOut.cableId}:${selectedOut.fiberIdx}`,
                  [idKeyIn]: joint.id
              };
          }
          await updateCable(cIn.id, { metadata: { ...cIn.metadata, fibers: newFibersIn } });

          const newFibersOut = { ...(cOut.metadata?.fibers || {}) };
          const portKeyOut = cOut.endNodeId === joint.id ? 'downstreamPort' : 'upstreamPort';
          const idKeyOut = cOut.endNodeId === joint.id ? 'downstreamId' : 'upstreamId';
          if (newFibersOut[selectedOut.fiberIdx]) {
              newFibersOut[selectedOut.fiberIdx] = {
                  ...newFibersOut[selectedOut.fiberIdx],
                  status: 'USED',
                  [portKeyOut]: `SPLICE:${selectedIn.cableId}:${selectedIn.fiberIdx}`,
                  [idKeyOut]: joint.id
              };
          }
          await updateCable(cOut.id, { metadata: { ...cOut.metadata, fibers: newFibersOut } });
      }

      setSelectedIn(null);
      setSelectedOut(null);
  };

  const handleUnsplice = async (spliceIdx: number) => {
      if (isViewer) return;
      
      const splice = splices[spliceIdx];
      if (!splice) return;

      if (!confirm(t('common.confirm') || 'Voulez-vous vraiment supprimer ce raccordement ?')) return;

      // 1. Prepare updates
      const updatedSplices = splices.filter((_, i) => i !== spliceIdx);
      const cIn = cables.find(c => c.id === splice.cableIn);
      const cOut = cables.find(c => c.id === splice.cableOut);
      
      const updatePromises: Promise<any>[] = [];

      // Update Joint
      updatePromises.push(updateEquipment(joint.id, {
          metadata: { ...joint.metadata, splices: updatedSplices }
      }));

      // Update Cables
      if (cIn && cOut && cIn.id === cOut.id) {
          // Same cable
          const newFibers = { ...(cIn.metadata?.fibers || {}) };
          
          const portKeyIn = cIn.endNodeId === joint.id ? 'downstreamPort' : 'upstreamPort';
          if (newFibers[splice.fiberIn]) {
              const fiber = { ...newFibers[splice.fiberIn] };
              delete fiber[portKeyIn];
              if (!fiber.upstreamPort && !fiber.downstreamPort) {
                  fiber.status = 'FREE';
              }
              newFibers[splice.fiberIn] = fiber;
          }

          const portKeyOut = cOut.endNodeId === joint.id ? 'downstreamPort' : 'upstreamPort';
          if (newFibers[splice.fiberOut]) {
              const fiber = { ...newFibers[splice.fiberOut] };
              delete fiber[portKeyOut];
              if (!fiber.upstreamPort && !fiber.downstreamPort) {
                  fiber.status = 'FREE';
              }
              newFibers[splice.fiberOut] = fiber;
          }

          updatePromises.push(updateCable(cIn.id, { metadata: { ...cIn.metadata, fibers: newFibers } }));
      } else {
          // Different cables
          if (cIn) {
              const newFibersIn = { ...(cIn.metadata?.fibers || {}) };
              const portKeyIn = cIn.endNodeId === joint.id ? 'downstreamPort' : 'upstreamPort';
              if (newFibersIn[splice.fiberIn]) {
                  const fiber = { ...newFibersIn[splice.fiberIn] };
                  delete fiber[portKeyIn];
                  if (!fiber.upstreamPort && !fiber.downstreamPort) fiber.status = 'FREE';
                  newFibersIn[splice.fiberIn] = fiber;
              }
              updatePromises.push(updateCable(cIn.id, { metadata: { ...cIn.metadata, fibers: newFibersIn } }));
          }

          if (cOut) {
              const newFibersOut = { ...(cOut.metadata?.fibers || {}) };
              const portKeyOut = cOut.endNodeId === joint.id ? 'downstreamPort' : 'upstreamPort';
              if (newFibersOut[splice.fiberOut]) {
                  const fiber = { ...newFibersOut[splice.fiberOut] };
                  delete fiber[portKeyOut];
                  if (!fiber.upstreamPort && !fiber.downstreamPort) fiber.status = 'FREE';
                  newFibersOut[splice.fiberOut] = fiber;
              }
              updatePromises.push(updateCable(cOut.id, { metadata: { ...cOut.metadata, fibers: newFibersOut } }));
          }
      }

      try {
          await Promise.all(updatePromises);
      } catch (error) {
          console.error('Error unsplicing:', error);
          alert('Erreur lors de la suppression du raccordement');
      }
  };

  const renderFiberList = (cablesList: FiberCable[], side: 'IN' | 'OUT') => {
      if (cablesList.length === 0) {
          return <div className="text-center text-xs text-slate-400 py-4 italic">{t('joint.no_cables')}</div>;
      }

      return (
          <div className="space-y-4">
              {cablesList.map(cable => (
                  <div key={cable.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 truncate max-w-[150px]">
                              <Cable size={12} /> {cable.name}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">{cable.cableType} • {cable.fiberCount}FO</span>
                      </div>
                      <div className="p-2 grid grid-cols-6 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
                          {Array.from({ length: cable.fiberCount }).map((_, i) => {
                              const fiberIdx = i + 1;
                              const used = isFiberUsed(cable.id, fiberIdx);
                              const isSelected = side === 'IN' 
                                  ? selectedIn?.cableId === cable.id && selectedIn?.fiberIdx === fiberIdx
                                  : selectedOut?.cableId === cable.id && selectedOut?.fiberIdx === fiberIdx;
                              
                              const struct = FiberStandards.getStructure(cable.cableType, fiberIdx);
                              const colorDef = struct.fiberColor;

                              return (
                                  <button
                                      key={fiberIdx}
                                      onClick={() => !used && !isViewer && (side === 'IN' ? setSelectedIn({ cableId: cable.id, fiberIdx }) : setSelectedOut({ cableId: cable.id, fiberIdx }))}
                                      disabled={(used && !isSelected) || isViewer}
                                      className={`
                                          h-6 rounded text-[9px] font-bold relative border transition-all flex items-center justify-between px-1
                                          ${isSelected 
                                              ? 'ring-2 ring-emerald-500 z-10 scale-110 bg-white dark:bg-slate-800 shadow-md border-emerald-500' 
                                              : used 
                                                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-80' 
                                                  : isViewer 
                                                      ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-default'
                                                      : 'hover:scale-105 bg-white dark:bg-slate-800 hover:border-slate-300 border-slate-200 dark:border-slate-700'}
                                      `}
                                      style={{ borderColor: isSelected ? '#10b981' : undefined }}
                                      title={`Tube: ${struct.tubeColor.name}, Fiber: ${struct.fiberColor.name}`}
                                  >
                                      <div className="flex items-center h-full w-full">
                                          <div 
                                            className="w-2 h-4 rounded-sm mr-1 border border-black/10" 
                                            style={{ backgroundColor: colorDef.hex }}
                                          ></div>
                                          <span className={`${used ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>{fiberIdx}</span>
                                      </div>
                                      {used && <Lock size={8} className="text-slate-400 absolute right-1" />}
                                  </button>
                              );
                          })}
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  return (
    <div className="absolute z-[500] flex flex-col w-full md:w-[850px] h-[90vh] md:h-[800px] bottom-0 md:bottom-auto md:top-4 md:right-4 animate-in slide-in-from-bottom-10 md:slide-in-from-right-4 duration-300">
      <div className="bg-white dark:bg-slate-950 rounded-t-[2.5rem] md:rounded-[2.5rem] border-t md:border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col h-full">
        
        {/* Header */}
        <div className="p-6 bg-amber-50 dark:bg-slate-900/90 border-b border-amber-100 dark:border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-600/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center shadow-inner">
                    <Link className="text-amber-600 dark:text-amber-400" size={24} />
                </div>
                <div>
                    <h3 className="text-slate-900 dark:text-white font-black text-lg leading-tight uppercase tracking-tight">{t('joint.title')}</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">{joint.name}</div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative hidden md:block">
                    <input 
                        type="text" 
                        placeholder="Rechercher câble..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 ring-amber-500/20 w-48 transition-all"
                    />
                </div>
                {onNavigate && (
                    <button 
                        onClick={onNavigate}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 text-xs font-black flex items-center gap-2"
                        title={t('navigation.route_btn')}
                    >
                        <Navigation size={16} /> <span className="hidden sm:inline">{t('navigation.route_btn')}</span>
                    </button>
                )}
                <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <X size={20} />
                </button>
            </div>
        </div>

        {/* Workspace - Stack on mobile, Row on desktop */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Inputs */}
            <div className="flex-1 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/30 dark:bg-slate-900/10">
                <div className="p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    {t('joint.input')}
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {renderFiberList(filteredCables, 'IN')}
                </div>
            </div>

            {/* Center: Controls */}
            {!isViewer && (
              <div className="w-full md:w-16 h-16 md:h-full bg-white dark:bg-slate-950 flex flex-row md:flex-col items-center justify-center gap-4 z-10 shadow-2xl border-y md:border-y-0 md:border-x border-slate-100 dark:border-slate-800 shrink-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${selectedIn ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300'}`}>
                      <span className="text-xs font-black">{selectedIn?.fiberIdx || 'IN'}</span>
                  </div>
                  
                  <ArrowRight size={16} className="text-slate-200 hidden md:block" />
                  <ArrowDown size={16} className="text-slate-200 md:hidden" />
                  
                  <button 
                      onClick={handleSplice}
                      disabled={!selectedIn || !selectedOut}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${selectedIn && selectedOut ? 'bg-iam-red text-white shadow-xl shadow-red-500/40 scale-110 cursor-pointer hover:bg-red-700 hover:rotate-12' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed'}`}
                  >
                      <Link size={20} />
                  </button>
                  
                  <ArrowRight size={16} className="text-slate-200 hidden md:block" />
                  <ArrowDown size={16} className="text-slate-200 md:hidden" />

                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${selectedOut ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300'}`}>
                      <span className="text-xs font-black">{selectedOut?.fiberIdx || 'OUT'}</span>
                  </div>
              </div>
            )}

            {/* Right: Outputs */}
            <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/10">
                <div className="p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    {t('joint.output')}
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {renderFiberList(filteredCables, 'OUT')}
                </div>
            </div>
        </div>

        {/* Splice Table (Footer) */}
        <div className="h-48 md:h-48 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <ArrowLeftRight size={12} /> {t('joint.plan')} ({splices.length})
                </span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 sticky top-0 font-semibold">
                        <tr>
                            <th className="px-4 py-2">{t('joint.source_cable')}</th>
                            <th className="px-2 py-2 text-center">{t('joint.strand')}</th>
                            <th className="px-2 py-2 text-center"></th>
                            <th className="px-2 py-2 text-center">{t('joint.strand')}</th>
                            <th className="px-4 py-2 text-right">{t('joint.dest_cable')}</th>
                            {!isViewer && <th className="px-4 py-2 w-10"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {splices.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-400 italic">{t('joint.no_splices')}</td></tr>
                        ) : splices.map((splice, idx) => {
                            const cIn = cables.find(c => c.id === splice.cableIn);
                            const cOut = cables.find(c => c.id === splice.cableOut);
                            
                            const colorIn = cIn ? FiberStandards.getStructure(cIn.cableType, splice.fiberIn).fiberColor : null;
                            const colorOut = cOut ? FiberStandards.getStructure(cOut.cableType, splice.fiberOut).fiberColor : null;

                            return (
                                <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px] sm:max-w-[120px]">{cIn?.name || splice.cableIn}</td>
                                    <td className="px-2 py-2">
                                        <div className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded py-0.5" title={colorIn?.name}>
                                            <div className="w-2 h-2 rounded-full border border-black/10" style={{backgroundColor: colorIn?.hex || '#ccc'}}></div>
                                            <span className="font-mono font-bold">{splice.fiberIn}</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 text-center text-slate-300"><Link size={12} /></td>
                                    <td className="px-2 py-2">
                                        <div className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded py-0.5" title={colorOut?.name}>
                                            <div className="w-2 h-2 rounded-full border border-black/10" style={{backgroundColor: colorOut?.hex || '#ccc'}}></div>
                                            <span className="font-mono font-bold">{splice.fiberOut}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px] sm:max-w-[120px]">{cOut?.name || splice.cableOut}</td>
                                    {!isViewer && (
                                      <td className="px-4 py-2 text-right">
                                          <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUnsplice(idx);
                                            }} 
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                            title="Supprimer le raccordement"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};

export default JointDetailPanel;
