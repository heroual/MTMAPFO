
import React, { useState, useMemo } from 'react';
import { 
  HardHat, Search, Filter, Calendar, User, 
  MapPin, CheckCircle2, Clock, XCircle, Printer, 
  ChevronRight, Box, Cable as CableIcon, ArrowUpRight, 
  Settings, Loader2, FileText, Layout, RefreshCcw, Edit2, Trash2, Save, X
} from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';
import { OperationType, OperationStatus, FieldOperation } from '../types';
import { useTranslation } from 'react-i18next';
import { OperationUtils } from '../lib/operation-utils';

const OperationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { operations, equipments, loading, setMapFocusLocation, updateExistingOperation, deleteExistingOperation } = useNetwork();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // État pour l'édition
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<FieldOperation>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredOps = useMemo(() => {
    return operations.filter(op => {
      const opIdentifier = (op.name || op.type || '').toLowerCase();
      const tech = (op.technicianName || '').toLowerCase();
      const zone = (op.zone || '').toLowerCase();
      const id = (op.id || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = opIdentifier.includes(term) || tech.includes(term) || zone.includes(term) || id.includes(term);
      const matchesType = typeFilter === 'ALL' || op.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || op.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [operations, searchTerm, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: operations.length,
      validated: operations.filter(o => o.status === OperationStatus.VALIDATED).length,
      inProgress: operations.filter(o => o.status === OperationStatus.IN_PROGRESS).length,
      planned: operations.filter(o => o.status === OperationStatus.PLANNED).length
    };
  }, [operations]);

  const getStatusColor = (status: OperationStatus) => {
    switch (status) {
      case OperationStatus.VALIDATED: return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800';
      case OperationStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-800';
      case OperationStatus.PLANNED: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case OperationStatus.CANCELLED: return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const handleDownloadReport = (op: FieldOperation) => {
      const allPossibleNodes = [...equipments, ...(op.draftEquipments || [])];
      OperationUtils.downloadReport(op, allPossibleNodes);
  };

  const handleOpenOnMap = (op: FieldOperation) => {
    let targetLocation = op.location;
    if ((!targetLocation || (targetLocation.lat === 0 && targetLocation.lng === 0)) && op.targetEntityId) {
        const targetEq = equipments.find(e => e.id === op.targetEntityId);
        if (targetEq?.location) targetLocation = targetEq.location;
    }
    if ((!targetLocation || (targetLocation.lat === 0 && targetLocation.lng === 0)) && op.draftEquipments?.length > 0) {
        targetLocation = op.draftEquipments[0].location;
    }
    if (targetLocation && targetLocation.lat !== 0) {
        setMapFocusLocation(targetLocation);
    }
    window.location.hash = `/map`;
  };

  const startEdit = (op: FieldOperation) => {
      setEditingId(op.id);
      setEditData({
          name: op.name,
          technicianName: op.technicianName,
          comments: op.comments,
          status: op.status
      });
  };

  const saveEdit = async () => {
      if (!editingId) return;
      setIsProcessing(true);
      try {
          await updateExistingOperation(editingId, editData);
          setEditingId(null);
      } finally {
          setIsProcessing(false);
      }
  };

  const executeDelete = async (id: string) => {
      setIsProcessing(true);
      try {
          await deleteExistingOperation(id);
          setDeletingId(null);
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col space-y-6 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950">
      
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-iam-red rounded-2xl shadow-xl shadow-red-500/20">
                <HardHat className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    {t('operations_page.title')}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
                    {t('operations_page.subtitle')}
                </p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="px-6 py-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-0">
                <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t('operations_page.total_ops')}</div>
            </div>
            <div className="px-6 py-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-0">
                <div className="text-2xl font-black text-emerald-500">{stats.validated}</div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t('operations_page.completed')}</div>
            </div>
            <div className="px-6 py-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-0">
                <div className="text-2xl font-black text-blue-500">{stats.inProgress}</div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t('operations_page.active_now')}</div>
            </div>
            <div className="px-6 py-3 text-center last:border-0">
                <div className="text-2xl font-black text-slate-400">{stats.planned}</div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Planifiées</div>
            </div>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Chercher par ID, Technicien ou Type..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-iam-red/20 transition-all"
              />
          </div>
          <div className="flex gap-2">
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-xs font-black uppercase outline-none cursor-pointer"
              >
                  <option value="ALL">Tous les types</option>
                  {Object.values(OperationType).map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <button 
                onClick={() => { setSearchTerm(''); setTypeFilter('ALL'); setStatusFilter('ALL'); }}
                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-iam-red rounded-2xl transition-colors"
              >
                  <RefreshCcw size={18} />
              </button>
          </div>
      </div>

      <div className="flex-1 min-h-0">
          {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <Loader2 size={48} className="animate-spin text-iam-red mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest">{t('common.loading')}</p>
              </div>
          ) : filteredOps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 text-slate-400">
                  <Layout size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-black uppercase tracking-widest">{t('operations_page.no_ops')}</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {filteredOps.map(op => {
                      const isEditing = editingId === op.id;
                      const hasSnapshot = op.mapSnapshot && op.mapSnapshot.startsWith('data:image');
                      
                      return (
                          <div key={op.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all flex flex-col">
                              <div className="p-6 pb-4 flex justify-between items-start">
                                  <div className="space-y-1 flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getStatusColor(op.status)}`}>
                                              {op.status}
                                          </span>
                                          <span className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-tighter">ID: {op.id.substring(0,8)}</span>
                                      </div>
                                      {isEditing ? (
                                          <input 
                                            value={editData.name || ''} 
                                            onChange={e => setEditData({...editData, name: e.target.value})}
                                            className="w-full text-lg font-black bg-slate-50 dark:bg-slate-800 border border-blue-500 rounded px-2 mt-1 outline-none"
                                          />
                                      ) : (
                                          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase leading-tight group-hover:text-iam-red transition-colors truncate w-full">
                                              {op.name || op.type.replace('_', ' ')}
                                          </h3>
                                      )}
                                      <div className="flex items-center gap-2">
                                          <p className="text-[10px] text-slate-500 font-bold uppercase">{new Date(op.date).toLocaleDateString()} • </p>
                                          {isEditing ? (
                                              <input 
                                                value={editData.technicianName || ''} 
                                                onChange={e => setEditData({...editData, technicianName: e.target.value})}
                                                className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-blue-500 rounded px-1 outline-none"
                                              />
                                          ) : (
                                              <p className="text-[10px] text-slate-500 font-bold uppercase">{op.technicianName || 'Admin'}</p>
                                          )}
                                      </div>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                      {isEditing ? (
                                          <div className="flex gap-1">
                                              <button onClick={saveEdit} className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg"><Save size={16}/></button>
                                              <button onClick={() => setEditingId(null)} className="p-2 bg-slate-200 text-slate-600 rounded-xl"><X size={16}/></button>
                                          </div>
                                      ) : (
                                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => startEdit(op)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 rounded-xl"><Edit2 size={16}/></button>
                                              <button onClick={() => setDeletingId(op.id)} className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-xl"><Trash2 size={16}/></button>
                                          </div>
                                      )}
                                  </div>
                              </div>

                              {hasSnapshot ? (
                                  <div className="px-6 h-48 overflow-hidden">
                                      <div className="w-full h-full bg-slate-950 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 relative group/thumb shadow-lg">
                                          <img src={op.mapSnapshot} className="w-full h-full object-contain transition-all" alt="Croquis" />
                                      </div>
                                  </div>
                              ) : <div className="px-6 h-8" />}

                              <div className="p-6 space-y-4 flex-1">
                                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                                      <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                              <MapPin size={16} className="text-iam-red" />
                                              <div>
                                                  <div className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none">{(op.zone || 'Secteur').toUpperCase()}</div>
                                                  <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">GÉO-DATA VALIDÉ</div>
                                              </div>
                                          </div>
                                      </div>
                                      {isEditing ? (
                                          <textarea 
                                              value={editData.comments || ''} 
                                              onChange={e => setEditData({...editData, comments: e.target.value})}
                                              className="w-full text-[10px] font-bold bg-white dark:bg-slate-900 border border-blue-500 rounded-xl p-2 mt-2 outline-none h-20"
                                              placeholder="Commentaires..."
                                          />
                                      ) : (
                                          op.comments && <p className="text-[10px] text-slate-500 line-clamp-2 italic">{op.comments}</p>
                                      )}
                                  </div>
                              </div>

                              <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20 flex gap-3">
                                  <button onClick={() => handleDownloadReport(op)} className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-colors">
                                      <Printer size={16} /> Rapport
                                  </button>
                                  <button onClick={() => handleOpenOnMap(op)} className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg group">
                                      Ouvrir SIG <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                  </button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}
      </div>

      {/* Modale de Confirmation de Suppression */}
      {deletingId && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                  <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
                      <Trash2 size={40} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2">Supprimer Rapport ?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-8">Cette action retirera définitivement ce rapport d'opération de la base de données SIG.</p>
                  <div className="flex gap-3">
                      <button onClick={() => setDeletingId(null)} className="flex-1 py-3 font-black text-xs uppercase text-slate-500">Annuler</button>
                      <button 
                        onClick={() => executeDelete(deletingId)} 
                        disabled={isProcessing}
                        className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 active:scale-95"
                      >
                          {isProcessing ? 'En cours...' : 'Supprimer'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default OperationsPage;
