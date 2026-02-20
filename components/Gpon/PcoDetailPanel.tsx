
import React, { useState, useEffect, useMemo } from 'react';
import { PCO, ClientProfile, ClientStatus, PCOPort, ClientType, CommercialOffer } from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { useAuth } from '../../context/AuthContext';
import { X, User, Wifi, Activity, AlertCircle, Save, Trash2, Power, Router, Phone, Mail, Loader2, Edit2, RefreshCcw, Navigation, Network, Lock, ArrowUp, Check, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PcoDetailPanelProps {
  pco: PCO;
  onClose: () => void;
  defaultSelectedClientId?: string | null;
  onNavigate?: () => void;
}

const PcoDetailPanel: React.FC<PcoDetailPanelProps> = ({ pco: propPco, onClose, defaultSelectedClientId, onNavigate }) => {
  const { t } = useTranslation();
  const { pcos, splitters, addClientToPco, updateClientInPco, removeClientFromPco } = useNetwork();
  const { profile } = useAuth();
  
  const isViewer = profile?.role === 'viewer';

  const pco = useMemo(() => {
      return pcos.find(p => p.id === propPco.id) || propPco;
  }, [pcos, propPco.id]);

  const parentSplitter = useMemo(() => {
      return splitters.find(s => s.id === pco.splitterId);
  }, [splitters, pco.splitterId]);

  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  
  const [login, setLogin] = useState('');
  const [clientName, setClientName] = useState('');
  const [ontSerial, setOntSerial] = useState('');
  const [status, setStatus] = useState<ClientStatus>(ClientStatus.ACTIVE);
  const [clientType, setClientType] = useState<ClientType>(ClientType.RESIDENTIAL);
  const [offer, setOffer] = useState<CommercialOffer>(CommercialOffer.FIBRE_100M);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [routerModel, setRouterModel] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const ports = useMemo(() => {
      const dbPorts = pco.ports || [];
      const capacity = Math.max(pco.totalPorts || 8, 4); 
      
      const fullPorts: PCOPort[] = [];
      for (let i = 1; i <= capacity; i++) {
          const existing = dbPorts.find(p => p.id === i);
          fullPorts.push(existing || { id: i, status: 'FREE' });
      }
      return fullPorts;
  }, [pco]);

  const uplinkStart = (pco as any).metadata?.uplinkPort;

  useEffect(() => {
      if (defaultSelectedClientId) {
          const port = ports.find(p => p.client?.id === defaultSelectedClientId);
          if (port) {
              setSelectedPortId(port.id);
              setIsFormOpen(false);
          }
      }
  }, [defaultSelectedClientId, ports]);

  useEffect(() => {
      setDeleteConfirmationId(null);
  }, [selectedPortId]);

  const handlePortClick = (port: PCOPort) => {
    setSelectedPortId(port.id);
    setFormError(null);
    if (port.status === 'FREE' && !isViewer) {
      resetForm();
      setIsEditingExisting(false);
      setIsFormOpen(true);
    } else {
      setIsEditingExisting(false);
      setIsFormOpen(false);
    }
  };

  const startEdit = (client: ClientProfile) => {
      if (isViewer) return;
      setLogin(client.login);
      setClientName(client.name);
      setOntSerial(client.ontSerial);
      setStatus(client.status);
      setClientType(client.clientType || ClientType.RESIDENTIAL);
      setOffer(client.offer || CommercialOffer.FIBRE_100M);
      setPhone(client.phone || '');
      setEmail(client.email || '');
      setRouterModel(client.routerModel || '');
      setIsEditingExisting(true);
      setIsFormOpen(true);
  };

  const resetForm = () => {
      setLogin(''); setClientName(''); setOntSerial(''); setStatus(ClientStatus.ACTIVE);
      setClientType(ClientType.RESIDENTIAL); setOffer(CommercialOffer.FIBRE_100M);
      setPhone(''); setEmail(''); setRouterModel(''); setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPortId === null || isViewer) return;
    setIsSaving(true);
    setFormError(null);

    if (!login || !clientName) {
        setFormError("Login et Nom requis.");
        setIsSaving(false);
        return;
    }

    const clientData: Partial<ClientProfile> = {
      login, name: clientName, ontSerial, status, clientType, offer, phone, email, routerModel
    };

    try {
        let result;
        if (isEditingExisting) {
            const currentPort = ports.find(p => p.id === selectedPortId);
            if (currentPort?.client?.id) {
                result = await updateClientInPco(pco.id, currentPort.client.id, clientData);
            } else {
                setFormError("Client non trouvé.");
                setIsSaving(false);
                return;
            }
        } else {
            const newClient: ClientProfile = {
                ...clientData,
                id: crypto.randomUUID(),
                address: 'Synced from Map',
                installedAt: new Date().toISOString()
            } as ClientProfile;
            
            result = await addClientToPco(pco.id, selectedPortId, newClient);
        }

        if (result.success) {
          setIsFormOpen(false);
          setIsEditingExisting(false);
        } else {
          setFormError(result.message);
        }
    } catch (err) {
        setFormError('Erreur sauvegarde.');
    } finally {
        setIsSaving(false);
    }
  };

  const executeDelete = async (portId: number, client: ClientProfile) => {
      if (isViewer) return;
      setIsDeleting(true);
      try {
          await removeClientFromPco(pco.id, portId, client.id);
          setIsFormOpen(false); 
          setSelectedPortId(null);
          setDeleteConfirmationId(null);
      } catch (error) {
          console.error("Delete failed", error);
      } finally {
          setIsDeleting(false);
      }
  };

  const renderPort = (port: PCOPort) => {
    const isSelected = selectedPortId === port.id;
    const upstreamPort = uplinkStart ? (uplinkStart + port.id - 1) : '?';
    const isTentative = (port.client as any)?.isTentative;

    let bgClass = 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
    let icon = <Power size={14} className="text-slate-400 dark:text-slate-600" />;
    
    if (port.status === 'USED' && port.client) {
        bgClass = isTentative 
            ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-500/50 hover:bg-amber-100'
            : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-500/50 hover:bg-emerald-100';
        icon = isTentative 
            ? <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
            : <Wifi size={14} className="text-emerald-600 dark:text-emerald-400" />;
    }

    return (
      <div 
        key={port.id}
        onClick={() => port.status !== 'DAMAGED' && handlePortClick(port)}
        className={`relative p-2 rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-between h-20 sm:h-24 group ${bgClass} ${isSelected ? 'ring-2 ring-iam-red dark:ring-cyan-400 ring-offset-2 dark:ring-offset-slate-900 z-10' : ''}`}
      >
        <div className="w-full flex justify-between items-center text-[10px] text-slate-500 font-mono font-bold">
            <span>#{port.id}</span>
            {icon}
        </div>
        
        {port.client ? (
            <div className="text-center w-full">
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate w-full">{port.client.login}</div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate w-full hidden sm:block">
                    {isTentative ? 'Non Brassé' : port.client.name}
                </div>
            </div>
        ) : (
            <div className="text-center text-xs text-slate-400 dark:text-slate-600 font-medium">{t('details_panel.free')}</div>
        )}

        <div className="w-full border-t border-slate-200 dark:border-slate-700 mt-1 pt-1 flex items-center justify-center gap-1 text-[9px] text-purple-600 dark:text-purple-400 font-bold bg-white/50 dark:bg-black/20 rounded-b">
            <ArrowUp size={8} /> SPL #{upstreamPort}
        </div>
      </div>
    );
  };

  const activePort = selectedPortId ? ports.find(p => p.id === selectedPortId) : null;

  return (
    <div className="absolute z-[500] flex flex-col w-full md:w-[400px] h-[75vh] md:h-auto md:max-h-[calc(100%-2rem)] bottom-0 md:bottom-auto md:top-4 md:right-4 animate-in slide-in-from-bottom-10 md:slide-in-from-right-4 duration-300">
      <div className="bg-white dark:bg-slate-950 rounded-t-2xl md:rounded-2xl border-t md:border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col h-full">
        
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-600/20 border border-emerald-200 flex items-center justify-center shadow-sm">
                    <Router className="text-emerald-600 dark:text-emerald-400" size={20} />
                </div>
                <div>
                    <h3 className="text-slate-900 dark:text-white font-black text-sm leading-tight uppercase tracking-tight">Gestion {pco.name}</h3>
                    <div className="text-[10px] text-slate-500 font-bold">{pco.usedPorts}/{pco.totalPorts} Ports Occupés</div>
                </div>
            </div>
            <div className="flex items-center gap-1">
                {onNavigate && <button onClick={onNavigate} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-black flex items-center gap-1"><Navigation size={16} /></button>}
                <button onClick={onClose} className="text-slate-400 p-1"><X size={20} /></button>
            </div>
        </div>

        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 shrink-0 border-b border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-4 gap-2">
                {ports.map(port => renderPort(port))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-slate-950 custom-scrollbar">
            {activePort ? (
                <>
                   {activePort.client && !isFormOpen ? (
                       <div className="space-y-4 animate-in fade-in">
                           <div className="flex items-center justify-between">
                               <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                                   <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs">#{activePort.id}</span>
                                   Abonné Connecté
                               </h4>
                               {!isViewer && (
                                 <div className="flex gap-2">
                                     <button onClick={() => startEdit(activePort.client!)} className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"><Edit2 size={10} className="inline mr-1"/> Modifier</button>
                                     <button onClick={() => setDeleteConfirmationId(activePort.client!.id)} className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100"><Trash2 size={10} className="inline mr-1"/> Retirer</button>
                                 </div>
                               )}
                           </div>

                           {(activePort.client as any).isTentative && (
                               <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl flex gap-3 items-center">
                                   <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                                   <p className="text-[10px] text-amber-800 dark:text-amber-200 font-bold leading-tight">
                                       ATTENTION : Ce client n'a pas de position physique définie en base. Il a été alloué au Port #{activePort.id} pour l'affichage.
                                   </p>
                               </div>
                           )}

                           <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
                               <div className="flex items-start justify-between">
                                   <div>
                                       <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{activePort.client.name}</div>
                                       <div className="text-xs text-iam-red dark:text-cyan-400 font-black uppercase font-mono tracking-tighter mt-1">{activePort.client.login}</div>
                                   </div>
                                   <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100">
                                       {activePort.client.clientType}
                                   </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                                   <div className="flex gap-2"><Router size={14} className="text-slate-400" /> <span>ONT: <b className="text-slate-800 dark:text-slate-200">{activePort.client.ontSerial}</b></span></div>
                                   <div className="flex gap-2"><Activity size={14} className="text-slate-400" /> <span>Offre: <b className="text-slate-800 dark:text-slate-200">{activePort.client.offer}</b></span></div>
                                   <div className="flex gap-2"><Phone size={14} className="text-slate-400" /> <span className="dark:text-slate-300">{activePort.client.phone || '-'}</span></div>
                                   <div className="flex gap-2"><Mail size={14} className="text-slate-400" /> <span className="truncate dark:text-slate-300">{activePort.client.email || '-'}</span></div>
                               </div>
                           </div>

                           {deleteConfirmationId === activePort.client.id && (
                               <div className="p-4 bg-rose-600 rounded-2xl text-white flex items-center justify-between animate-in zoom-in-95">
                                   <span className="text-[10px] font-black uppercase">Confirmer suppression ?</span>
                                   <div className="flex gap-2">
                                       <button onClick={() => executeDelete(activePort.id, activePort.client!)} disabled={isDeleting} className="px-4 py-1.5 bg-white text-rose-600 rounded-xl font-black text-[10px] uppercase shadow-lg">OUI</button>
                                       <button onClick={() => setDeleteConfirmationId(null)} className="px-4 py-1.5 bg-rose-700 text-white rounded-xl font-black text-[10px] uppercase">NON</button>
                                   </div>
                               </div>
                           )}
                       </div>
                   ) : (
                       !isViewer && (
                         <div className="space-y-4 animate-in fade-in">
                             <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Assignation Port #{activePort.id}</h4>
                             {formError && <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-[10px] font-bold flex items-center gap-2"><AlertCircle size={14} /> {formError}</div>}
                             <form onSubmit={handleSubmit} className="space-y-3">
                                 <input required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-iam-red rounded-xl px-4 py-3 text-sm font-bold outline-none" placeholder="Nom Complet de l'Abonné" />
                                 <input required value={login} onChange={e => setLogin(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-iam-red rounded-xl px-4 py-3 text-sm font-bold font-mono outline-none" placeholder="LOGIN_FIBRE" />
                                 <div className="grid grid-cols-2 gap-3">
                                     <select value={clientType} onChange={e => setClientType(e.target.value as ClientType)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold outline-none">
                                         {Object.values(ClientType).map(t => <option key={t} value={t}>{t}</option>)}
                                     </select>
                                     <select value={offer} onChange={e => setOffer(e.target.value as CommercialOffer)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold outline-none">
                                         {Object.values(CommercialOffer).map(o => <option key={o} value={o}>{(o as string).replace('_', ' ')}</option>)}
                                     </select>
                                 </div>
                                 <input required value={ontSerial} onChange={e => setOntSerial(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-iam-red rounded-xl px-4 py-3 text-sm font-black uppercase font-mono outline-none" placeholder="ONT SN (ALCL... / HWTC...)" />
                                 
                                 <button type="submit" disabled={isSaving} className="w-full py-4 bg-iam-red hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl transition-all active:scale-95 flex justify-center items-center gap-3">
                                     {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} ACTIVATION IMMÉDIATE
                                 </button>
                             </form>
                         </div>
                       )
                   )}
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-6 py-12">
                    <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                        <Wifi size={64} className="opacity-20" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 text-center max-w-[200px]">Cliquez sur un FO pour gérer l'abonné</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PcoDetailPanel;
