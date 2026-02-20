
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, HardHat, ChevronRight, CheckCircle2, Box, FileText, 
  MapPin, Printer, AlertCircle, ArrowRight, Save, Network, 
  Plus, Trash2, Cable as CableIcon, Map as MapIcon, ShieldCheck, 
  Settings, Loader2, Ruler, Layout, Send, GitMerge, MousePointer2, Navigation, Sparkles, Camera,
  // Added missing Search icon to imports
  RotateCcw, Info, Upload, Image as ImageIcon, Briefcase, PlusCircle, Search
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { 
  OperationType, EquipmentType, Coordinates, MaterialItem, 
  FieldOperation, OperationStatus, CableCategory, CableType, EquipmentStatus 
} from '../../types';
import { getRoute } from '../../lib/gis/routing';
import { OperationUtils } from '../../lib/operation-utils';

interface FieldOperationModalProps {
  initialLocation?: Coordinates | null;
  onClose: () => void;
}

const FieldOperationModal: React.FC<FieldOperationModalProps> = ({ initialLocation, onClose }) => {
  const { activeOperation, updateActiveOperation, commitOperation, equipments } = useNetwork();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // État local pour les formulaires
  const [searchEquip, setSearchEquip] = useState('');
  const [customMatName, setCustomMatName] = useState('');
  const [customMatRef, setCustomMatRef] = useState('');
  const [customMatQty, setCustomMatQty] = useState(1);

  const [nodeType, setNodeType] = useState<EquipmentType>(EquipmentType.PCO);
  const [nodeName, setNodeName] = useState('');
  const [isPlacingOnMap, setIsPlacingOnMap] = useState(false);
  const [tempCoords, setTempCoords] = useState<Coordinates | null>(null);

  const [cableStartId, setCableStartId] = useState('');
  const [cableEndId, setCableEndId] = useState('');
  const [cableType, setCableType] = useState<CableType>(CableType.FO48);
  const [cableMode, setCableMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Écoute du clic sur la carte pour placer un équipement draft
  useEffect(() => {
    const handleMapClick = (e: any) => {
      if (isPlacingOnMap && e.detail) {
        setTempCoords(e.detail);
        setIsPlacingOnMap(false); 
      }
    };
    window.addEventListener('gpon-map-click', handleMapClick);
    return () => window.removeEventListener('gpon-map-click', handleMapClick);
  }, [isPlacingOnMap]);

  // Pré-chargement des matériels suggérés au changement de type
  useEffect(() => {
    if (activeOperation && activeOperation.materials.length === 0) {
        const suggested = OperationUtils.getSuggestedMaterials(activeOperation.type);
        updateActiveOperation({ materials: suggested });
    }
  }, [activeOperation?.type]);

  const addMaterial = () => {
      if (!customMatName || !activeOperation) return;
      const newItem: MaterialItem = {
          id: `mat-${Date.now()}`,
          name: customMatName,
          reference: customMatRef || 'REF-GEN',
          quantity: customMatQty,
          unit: 'pcs',
          status: 'PLANNED'
      };
      updateActiveOperation({ materials: [...activeOperation.materials, newItem] });
      setCustomMatName(''); setCustomMatRef(''); setCustomMatQty(1);
  };

  const removeMaterial = (id: string) => {
      if (!activeOperation) return;
      updateActiveOperation({ materials: activeOperation.materials.filter(m => m.id !== id) });
  };

  const addDraftNode = () => {
    if (!nodeName || !activeOperation || !tempCoords) return;
    const newNode = {
      id: crypto.randomUUID(),
      name: nodeName,
      type: nodeType,
      status: EquipmentStatus.PLANNED,
      location: tempCoords,
      metadata: { operationId: activeOperation.id }
    };
    updateActiveOperation({ draftEquipments: [...activeOperation.draftEquipments, newNode] });
    setNodeName('');
    setTempCoords(null); 
  };

  const addDraftLink = async () => {
    if (!cableStartId || !cableEndId || !activeOperation) return;
    const allAvailableNodes = [...equipments, ...activeOperation.draftEquipments];
    const startNode = allAvailableNodes.find(n => n.id === cableStartId);
    const endNode = allAvailableNodes.find(n => n.id === cableEndId);
    if (!startNode || !endNode || !startNode.location || !endNode.location) return;

    let path = [startNode.location, endNode.location];
    let distance = 100;

    if (cableMode === 'AUTO') {
      setIsCalculatingRoute(true);
      const routeData = await getRoute(startNode.location, endNode.location, 'walking');
      if (routeData) {
        path = routeData.geometry.coordinates.map((c: any) => ({ lat: c[1], lng: c[0] }));
        distance = routeData.distance;
      }
      setIsCalculatingRoute(false);
    }

    const transportTypes = [EquipmentType.SITE, EquipmentType.OLT, EquipmentType.OLT_BIG, EquipmentType.OLT_MINI, EquipmentType.MSAN];
    const isHead = transportTypes.includes(startNode.type) || transportTypes.includes(endNode.type);
    const isPassiveToSplitter = (startNode.type === EquipmentType.SPLITTER && (endNode.type === EquipmentType.JOINT || endNode.type === EquipmentType.CHAMBER)) ||
                                (endNode.type === EquipmentType.SPLITTER && (startNode.type === EquipmentType.JOINT || startNode.type === EquipmentType.CHAMBER));
    
    const isTransport = isHead || isPassiveToSplitter;

    const newCable = {
      id: crypto.randomUUID(),
      name: `CBL-${isTransport ? 'T' : 'D'}-${startNode.name}-${endNode.name}`.toUpperCase(),
      type: EquipmentType.CABLE,
      status: EquipmentStatus.PLANNED,
      startNodeId: cableStartId,
      endNodeId: cableEndId,
      cableType: cableType,
      category: isTransport ? CableCategory.TRANSPORT : CableCategory.DISTRIBUTION,
      fiberCount: parseInt(cableType.replace('FO', '')) || 48,
      lengthMeters: Math.round(distance),
      path: path,
      metadata: { operationId: activeOperation.id }
    };
    updateActiveOperation({ draftCables: [...activeOperation.draftCables, newCable] });
    setCableStartId('');
    setCableEndId('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          updateActiveOperation({ mapSnapshot: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const captureSnapshot = () => {
    if (!activeOperation) return;
    setIsCapturing(true);
    // Simuler un rendu canvas différé pour la démo
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1280; canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,1280,720);
      ctx.fillStyle = '#e30613'; ctx.font = 'bold 40px Montserrat';
      ctx.fillText('AS-BUILT BLUEPRINT', 50, 80);
      ctx.fillStyle = '#64748b'; ctx.font = '20px JetBrains Mono';
      ctx.fillText(`GEO-DATA SYNC: ${new Date().toLocaleString()}`, 50, 120);
      const dataUrl = canvas.toDataURL('image/png');
      updateActiveOperation({ mapSnapshot: dataUrl });
      setIsCapturing(false);
    }, 1500);
  };

  const handleCommit = async () => {
    if (!activeOperation) return;
    setIsSubmitting(true);
    await commitOperation({ ...activeOperation, status: OperationStatus.VALIDATED });
    setIsSubmitting(false);
    onClose();
  };

  if (!activeOperation) return null;

  const filteredEquipments = equipments.filter(e => 
    e.name.toLowerCase().includes(searchEquip.toLowerCase()) || 
    e.type.toLowerCase().includes(searchEquip.toLowerCase())
  );

  return (
    <div className={`fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all ${isPlacingOnMap ? 'pointer-events-none' : 'pointer-events-auto'}`}>
      <div className={`bg-white dark:bg-slate-900 w-full max-w-5xl h-[720px] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all ${isPlacingOnMap ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
        
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-iam-red rounded-2xl shadow-xl">
              <HardHat className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none">Dossier de Chantier</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {activeOperation.id.substring(0,8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Steps */}
            <div className="w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 p-6 space-y-3">
                {[1,2,3,4,5].map(i => {
                    const labels = ["Identité", "Équipement Cible", "Matériels", "Ingénierie", "Validation"];
                    const icons = [FileText, MapPin, Briefcase, Network, ShieldCheck];
                    const StepIcon = icons[i-1];
                    return (
                        <div 
                          key={i} 
                          onClick={() => i < step && setStep(i)}
                          className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer ${step === i ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-iam-red shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 shrink-0 ${step === i ? 'border-iam-red bg-iam-red text-white' : 'border-slate-200 dark:border-slate-800'}`}>
                                <StepIcon size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">Étape {i}</span>
                                <span className="text-xs font-black uppercase leading-none">{labels[i-1]}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex-1 overflow-y-auto p-10 relative custom-scrollbar">
                
                {/* STEP 1: IDENTITÉ */}
                {step === 1 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de l'Opération</label>
                                <input 
                                    value={activeOperation.name} 
                                    onChange={e => updateActiveOperation({ name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-iam-red rounded-2xl px-5 py-4 font-bold text-sm outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type d'Intervention</label>
                                <select 
                                    value={activeOperation.type}
                                    onChange={e => updateActiveOperation({ type: e.target.value as OperationType })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-iam-red rounded-2xl px-5 py-4 font-bold text-sm outline-none cursor-pointer"
                                >
                                    {Object.values(OperationType).map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secteur / Zone</label>
                                <input 
                                    value={activeOperation.zone} 
                                    onChange={e => updateActiveOperation({ zone: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-iam-red rounded-2xl px-5 py-4 font-bold text-sm outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Prévue</label>
                                <input 
                                    type="datetime-local"
                                    value={activeOperation.date.slice(0, 16)} 
                                    onChange={e => updateActiveOperation({ date: new Date(e.target.value).toISOString() })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-iam-red rounded-2xl px-5 py-4 font-bold text-sm outline-none transition-all" 
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: CIBLE */}
                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                placeholder="Rechercher l'équipement cible (OLT, Splitter, PCO...)" 
                                value={searchEquip}
                                onChange={e => setSearchEquip(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-iam-red rounded-2xl pl-12 pr-5 py-4 font-bold text-sm outline-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredEquipments.map(eq => (
                                <div 
                                    key={eq.id}
                                    onClick={() => updateActiveOperation({ targetEntityId: eq.id })}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${activeOperation.targetEntityId === eq.id ? 'border-iam-red bg-red-50 dark:bg-red-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-400">
                                            <Box size={20} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-slate-800 dark:text-white">{eq.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{eq.type} • {eq.id.substring(0,8)}</div>
                                        </div>
                                    </div>
                                    {activeOperation.targetEntityId === eq.id && <CheckCircle2 className="text-iam-red" size={20} />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: MATÉRIELS */}
                {step === 3 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                            <input placeholder="Désignation" value={customMatName} onChange={e => setCustomMatName(e.target.value)} className="bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                            <input placeholder="Référence" value={customMatRef} onChange={e => setCustomMatRef(e.target.value)} className="bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                            <div className="flex gap-2">
                                <input type="number" value={customMatQty} onChange={e => setCustomMatQty(parseInt(e.target.value))} className="w-20 bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-xs font-bold" />
                                <button onClick={addMaterial} className="flex-1 bg-iam-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700 transition-colors">
                                    <Plus size={16} /> Ajouter
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {activeOperation.materials.map(mat => (
                                <div key={mat.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400">
                                            <Briefcase size={18} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-slate-800 dark:text-white">{mat.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">{mat.reference}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-sm font-black text-slate-900 dark:text-white">x{mat.quantity}</div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{mat.unit}</div>
                                        </div>
                                        <button onClick={() => removeMaterial(mat.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 4: INGÉNIERIE DRAFT */}
                {step === 4 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-3xl flex items-start gap-4">
                            <Info className="text-blue-500 shrink-0" size={20} />
                            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                Ajoutez ici les équipements et câbles qui seront **déployés** physiquement lors de cette opération. Ils apparaîtront en pointillés sur la carte jusqu'à la validation.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Box size={14}/> Nouvel Équipement Draft</h4>
                                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm space-y-4">
                                    <select value={nodeType} onChange={e => setNodeType(e.target.value as EquipmentType)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold">
                                        <option value={EquipmentType.PCO}>PCO / NAP</option>
                                        <option value={EquipmentType.SPLITTER}>Splitter</option>
                                        <option value={EquipmentType.JOINT}>Joint (Boite)</option>
                                    </select>
                                    <input placeholder="Désignation (ex: PCO-01)" value={nodeName} onChange={e => setNodeName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold" />
                                    <button 
                                        onClick={() => setIsPlacingOnMap(true)} 
                                        className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-black transition-all ${tempCoords ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-iam-red hover:text-iam-red'}`}
                                    >
                                        {tempCoords ? <><CheckCircle2 size={16}/> Coordonnées Prêtes</> : <><MapPin size={16}/> Placer sur Carte</>}
                                    </button>
                                    <button onClick={addDraftNode} disabled={!nodeName || !tempCoords} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-20 transition-all active:scale-95">Ajouter au Projet</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><CableIcon size={14}/> Nouvelle Liaison Draft</h4>
                                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <select value={cableStartId} onChange={e => setCableStartId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-3 text-[10px] font-bold">
                                            <option value="">Source</option>
                                            {[...equipments, ...activeOperation.draftEquipments].map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                                        </select>
                                        <select value={cableEndId} onChange={e => setCableEndId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-3 text-[10px] font-bold">
                                            <option value="">Cible</option>
                                            {[...equipments, ...activeOperation.draftEquipments].map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                                        </select>
                                    </div>
                                    <select value={cableType} onChange={e => setCableType(e.target.value as CableType)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold">
                                        {Object.values(CableType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <button onClick={addDraftLink} disabled={!cableStartId || !cableEndId || isCalculatingRoute} className="w-full py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-30">
                                        {isCalculatingRoute ? <Loader2 size={16} className="animate-spin" /> : <><GitMerge size={16}/> Créer Liaison</>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Récap Projet */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
                                <span className="text-[9px] font-black text-slate-400 uppercase block mb-3">Équipements à créer ({activeOperation.draftEquipments.length})</span>
                                <div className="flex flex-wrap gap-2">
                                    {activeOperation.draftEquipments.map(e => (
                                        <span key={e.id} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">{e.name}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
                                <span className="text-[9px] font-black text-slate-400 uppercase block mb-3">Câbles à créer ({activeOperation.draftCables.length})</span>
                                <div className="flex flex-wrap gap-2">
                                    {activeOperation.draftCables.map(c => (
                                        <span key={c.id} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">{c.name}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* STEP 5: VALIDATION & RAPPORT */}
                {step === 5 && (
                    <div className="space-y-10 animate-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
                            <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50 dark:bg-slate-950/50 flex flex-col items-center justify-center min-h-[400px] group transition-all hover:border-iam-red hover:bg-white shadow-inner relative">
                                {activeOperation.mapSnapshot ? (
                                    <div className="w-full h-full flex flex-col items-center gap-6 animate-in zoom-in-95">
                                        <div className="w-full aspect-video bg-slate-950 rounded-3xl overflow-hidden border-4 border-slate-800 relative shadow-2xl">
                                            <img src={activeOperation.mapSnapshot} alt="As-Built HD" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex gap-4">
                                          <button onClick={captureSnapshot} className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 hover:text-iam-red transition-colors"><RotateCcw size={14}/> Régénérer SIG</button>
                                          <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 hover:text-blue-500 transition-colors"><Upload size={14}/> Changer Image</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-8 w-full max-w-xs">
                                        <button onClick={captureSnapshot} disabled={isCapturing} className="flex flex-col items-center gap-4 text-slate-400 hover:text-iam-red transition-all w-full">
                                            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                              {isCapturing ? <Loader2 size={32} className="animate-spin text-iam-red" /> : <Camera size={32}/>}
                                            </div>
                                            <div className="text-center">
                                              <span className="block text-[11px] font-black uppercase tracking-[0.2em]">Capture SIG</span>
                                            </div>
                                        </button>
                                        
                                        <div className="flex items-center gap-4 w-full"><div className="h-px bg-slate-200 flex-1"></div><span className="text-[10px] font-black text-slate-400">OU</span><div className="h-px bg-slate-200 flex-1"></div></div>

                                        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-4 text-slate-400 hover:text-blue-500 transition-all w-full group/upload">
                                            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center group-hover/upload:scale-110 transition-transform">
                                              <Upload size={32}/>
                                            </div>
                                            <div className="text-center">
                                              <span className="block text-[11px] font-black uppercase tracking-[0.2em]">Uploader Croquis</span>
                                              <span className="text-[9px] font-bold text-slate-400">Image, Photo, Scan</span>
                                            </div>
                                        </button>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </div>
                            
                            <div className="space-y-6 flex flex-col justify-center">
                               <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-6">
                                   <div className="flex items-center gap-4 text-slate-900 dark:text-white">
                                       <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm"><Info size={24} className="text-iam-red" /></div>
                                       <h4 className="text-lg font-black uppercase tracking-tight">Récapitulatif Final</h4>
                                   </div>
                                   <div className="space-y-3">
                                       <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Équipements Cibles</span> <span className="text-slate-900 dark:text-white">{activeOperation.targetEntityId ? 'Défini' : 'Non lié'}</span></div>
                                       <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Matériels BOM</span> <span className="text-slate-900 dark:text-white">{activeOperation.materials.length} Items</span></div>
                                       <div className="flex justify-between text-xs font-bold text-slate-500 uppercase"><span>Draft Assets</span> <span className="text-slate-900 dark:text-white">{activeOperation.draftEquipments.length + activeOperation.draftCables.length} Nouveaux</span></div>
                                   </div>
                               </div>

                               <button 
                                 onClick={() => handleCommit()} 
                                 disabled={!activeOperation.mapSnapshot || isSubmitting} 
                                 className="w-full flex items-center justify-between p-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-2 border-transparent rounded-[2.5rem] hover:bg-iam-red transition-all group shadow-2xl disabled:opacity-20"
                               >
                                  <div className="flex items-center gap-5">
                                     <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors">
                                        {isSubmitting ? <Loader2 className="animate-spin" size={28} /> : <ShieldCheck size={28}/>}
                                     </div>
                                     <div className="text-left">
                                        <div className="text-sm font-black uppercase tracking-tight">Valider l'Intervention</div>
                                        <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest mt-1">Inscrire au patrimoine permanent</div>
                                     </div>
                                  </div>
                                  <ChevronRight size={24} className="group-hover:translate-x-1 transition-all" />
                               </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex justify-between items-center shrink-0">
            <button 
              onClick={() => setStep(s => Math.max(1, s-1))} 
              disabled={step === 1} 
              className="px-8 py-4 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] hover:text-slate-900 transition-colors disabled:opacity-20"
            >
                Précédent
            </button>
            {step < 5 && (
              <button 
                onClick={() => setStep(s => s+1)} 
                className="px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl transition-all active:scale-95 flex items-center gap-4 group"
              >
                Suivant <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default FieldOperationModal;
