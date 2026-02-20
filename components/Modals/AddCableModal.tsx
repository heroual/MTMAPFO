
import React, { useState, useEffect, useMemo } from 'react';
import { Cable as CableIcon, Save, X, AlertTriangle, Loader2, Zap, GitMerge, Spline, Network } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { EquipmentType, CableType, CableCategory, PhysicalEntity, EquipmentStatus, Coordinates, InstallationMode } from '../../types';
import { CablingRules } from '../../lib/cabling-rules';
import { getRoute } from '../../lib/gis/routing';
import CableManualDrawer from '../Map/tools/CableManualDrawer';
import { useTranslation } from 'react-i18next';

// Re-using the HierarchySelector component structure from current file for brevity, 
// focusing on the AddCableModal logic updates.

interface AddCableModalProps {
  onClose: () => void;
  onStartDrawing: (draftState: any) => void; // Not used in new logic if we embed drawer
  manualDrawingData: any; // Legacy compatibility
  draftState?: any;
}

const AddCableModal: React.FC<AddCableModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { sites, joints, pcos, msans, splitters, olts, addCable, refresh } = useNetwork();
  
  const [startId, setStartId] = useState('');
  const [endId, setEndId] = useState('');
  const [startEntity, setStartEntity] = useState<PhysicalEntity | null>(null);
  const [endEntity, setEndEntity] = useState<PhysicalEntity | null>(null);
  
  const [cableType, setCableType] = useState<CableType>(CableType.FO48);
  const [cableCategory, setCableCategory] = useState<CableCategory>(CableCategory.DISTRIBUTION);
  const [name, setName] = useState('');
  const [installMode, setInstallMode] = useState<InstallationMode>(InstallationMode.UNDERGROUND);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState<Coordinates[]>([]);
  const [distance, setDistance] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const endpoints = useMemo(() => {
    const hasLoc = (e: any) => e && e.location && typeof e.location.lat === 'number';
    return [...sites, ...olts, ...joints, ...pcos, ...splitters, ...msans].filter(hasLoc) as PhysicalEntity[];
  }, [sites, joints, pcos, msans, splitters, olts]);

  const validation = useMemo(() => {
      if (!startEntity || !endEntity) return { valid: false, reason: 'Sélectionnez la source et la cible.' };
      return CablingRules.validateConnection(startEntity, endEntity);
  }, [startEntity, endEntity]);

  useEffect(() => {
    if (validation.valid && validation.suggestedCategory) {
        setCableCategory(validation.suggestedCategory);
    }
  }, [validation]);

  const handleFinishDrawing = (result: any) => {
      setPath(result.path);
      setDistance(result.distance);
      setIsDrawing(false);
  };

  const handleSubmit = async () => {
    if (!validation.valid || path.length < 2) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
        const cableId = crypto.randomUUID();
        // Le backend (via RPC ou Service) doit gérer la transaction
        await addCable({
            id: cableId,
            name: name || `CBL-${cableCategory.charAt(0)}-${startEntity!.name}-${endEntity!.name}`.toUpperCase(),
            type: EquipmentType.CABLE,
            cableType,
            category: cableCategory,
            fiberCount: CablingRules.getFiberCount(cableType),
            lengthMeters: distance,
            status: EquipmentStatus.AVAILABLE,
            startNodeId: startId,
            endNodeId: endId,
            path: path,
            installationMode: installMode,
            metadata: { 
                originalStartId: startId, 
                originalEndId: endId, 
                cableType: cableType,
                deploymentDate: new Date().toISOString()
            }
        } as any);

        await refresh();
        onClose();
    } catch (e: any) {
        setErrorMsg(e.message || "Erreur de déploiement.");
    } finally {
        setIsSaving(false);
    }
  };

  if (isDrawing && startEntity && endEntity) {
      return (
          <CableManualDrawer 
             map={(window as any).L_MAP_INSTANCE} // Accès global ou via ref (implémentation simplifiée)
             startEntity={startEntity}
             endEntity={endEntity}
             onFinish={handleFinishDrawing}
             onCancel={() => setIsDrawing(false)}
          />
      );
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg"><CableIcon size={24} /></div>
                <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Nouvelle Liaison Fibre</h2>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={24}/></button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
            {/* 1. Sélection des extrémités */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Équipement Source (A)</label>
                    <select 
                        value={startId} 
                        onChange={e => { 
                            setStartId(e.target.value); 
                            setStartEntity(endpoints.find(x => x.id === e.target.value) || null); 
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 font-bold text-sm outline-none focus:border-blue-500"
                    >
                        <option value="">-- Choisir Source --</option>
                        {endpoints.map(e => <option key={e.id} value={e.id}>{e.name} ({e.type})</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Équipement Cible (B)</label>
                    <select 
                        value={endId} 
                        onChange={e => { 
                            setEndId(e.target.value); 
                            setEndEntity(endpoints.find(x => x.id === e.target.value) || null); 
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 font-bold text-sm outline-none focus:border-blue-500"
                    >
                        <option value="">-- Choisir Cible --</option>
                        {endpoints.map(e => <option key={e.id} value={e.id}>{e.name} ({e.type})</option>)}
                    </select>
                </div>
            </div>

            {/* 2. Validation de cohérence */}
            {startEntity && endEntity && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in ${validation.valid ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/10' : 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/10'}`}>
                    {validation.valid ? <Zap size={18} /> : <AlertTriangle size={18} />}
                    <span className="text-xs font-black uppercase tracking-wide">
                        {validation.valid ? `Liaison ${validation.suggestedCategory} possible` : validation.reason}
                    </span>
                </div>
            )}

            {/* 3. Paramètres Techniques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structure Câble</label>
                    <select value={cableType} onChange={e => setCableType(e.target.value as CableType)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold">
                        {Object.values(CableType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Désignation</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="CBL-..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode de Pose</label>
                    <select value={installMode} onChange={e => setInstallMode(e.target.value as InstallationMode)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold">
                        {Object.values(InstallationMode).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>

            {/* 4. Statut du Tracé */}
            <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-4">
                {path.length < 2 ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center"><Spline size={32} /></div>
                        <div className="space-y-1">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Géométrie Manquante</h3>
                            <p className="text-xs text-slate-500">Définissez le trajet du câble sur la carte.</p>
                        </div>
                        <button 
                            type="button" 
                            disabled={!validation.valid}
                            onClick={() => setIsDrawing(true)}
                            className="mt-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-500 transition-all disabled:opacity-30"
                        >
                            Démarrer le tracé SIG
                        </button>
                    </>
                ) : (
                    <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center"><Network size={24} /></div>
                            <div>
                                <div className="text-[10px] font-black text-emerald-600 uppercase">Tracé Validé</div>
                                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">{distance}m</div>
                            </div>
                        </div>
                        <button onClick={() => setIsDrawing(true)} className="text-[10px] font-black text-blue-500 uppercase hover:underline">Modifier le tracé</button>
                    </div>
                )}
            </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-4 shrink-0">
            {errorMsg && <div className="flex-1 flex items-center gap-2 text-rose-600 text-[10px] font-black uppercase"><AlertTriangle size={14}/> {errorMsg}</div>}
            <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold text-xs uppercase">Annuler</button>
            <button 
                onClick={handleSubmit} 
                disabled={isSaving || !validation.valid || path.length < 2} 
                className="px-10 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl disabled:opacity-30 transition-all active:scale-95 flex items-center gap-3"
            >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                DÉPLOYER LA LIAISON
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddCableModal;
