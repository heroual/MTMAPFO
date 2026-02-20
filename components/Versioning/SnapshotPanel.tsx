
import React, { useState, useMemo } from 'react';
import { Camera, RotateCcw, Eye, Plus, FileClock, AlertTriangle, ArrowRight, X, Filter, Search, ChevronDown, ChevronRight, UserPlus, UserCog, UserMinus, Settings } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { getSnapshotSummary } from '../../lib/versioning/snapshotService';
import { useTranslation } from 'react-i18next';
import { EquipmentType } from '../../types';

// Helper to compute deep diff
const computeChanges = (oldData: any, newData: any) => {
    const changes: { field: string, old: any, new: any }[] = [];
    if (!oldData && !newData) return changes;
    
    const flatten = (obj: any, prefix = ''): any => {
        if (!obj || typeof obj !== 'object') return { [prefix]: obj };
        return Object.keys(obj).reduce((acc, key) => {
            const val = obj[key];
            const newKey = prefix ? `${prefix}_${key}` : key;
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                Object.assign(acc, flatten(val, newKey));
            } else {
                acc[newKey] = val;
            }
            return acc;
        }, {});
    };

    const flatOld = flatten(oldData);
    const flatNew = flatten(newData);
    const allKeys = new Set([...Object.keys(flatOld), ...Object.keys(flatNew)]);
    
    allKeys.forEach(key => {
        if (['updated_at', 'updatedAt', 'created_at', 'createdAt', 'metadata', 'id'].includes(key)) return;
        const vOld = flatOld[key];
        const vNew = flatNew[key];
        if (JSON.stringify(vOld) !== JSON.stringify(vNew)) {
            changes.push({ 
                field: key.replace(/_/g, ' ').toUpperCase(), 
                old: vOld === undefined || vOld === null ? 'VIDE' : String(vOld), 
                new: vNew === undefined || vNew === null ? 'SUPPRIMÉ' : String(vNew) 
            });
        }
    });
    return changes;
}

const SnapshotPanel: React.FC = () => {
  const { t } = useTranslation();
  const { snapshots, auditLogs, createSnapshot, viewSnapshot, restoreSnapshot, isSnapshotMode, activeSnapshotId } = useNetwork();
  
  const [newSnapName, setNewSnapName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'LOGS' | 'SNAPSHOTS'>('SNAPSHOTS');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchLog, setSearchLog] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
      return auditLogs.filter(log => {
          if (filterAction !== 'ALL' && log.action !== filterAction) return false;
          if (searchLog) {
              const term = searchLog.toLowerCase();
              return log.entity_id?.toLowerCase().includes(term) || log.user_email?.toLowerCase().includes(term);
          }
          return true;
      });
  }, [auditLogs, filterAction, searchLog]);

  const getActionInfo = (log: any) => {
      if (log.action === 'SETTING_UPDATE') return { label: 'CONFIG', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: <Settings size={10} /> };
      if (log.action === 'CREATE' || log.action === 'LINK') return { label: 'CRÉATION', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <Plus size={10} /> };
      if (log.action === 'UPDATE') return { label: 'MODIF', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <ChevronRight size={10} /> };
      if (log.action === 'DELETE' || log.action === 'UNLINK') return { label: 'SUPPR', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: <X size={10} /> };
      return { label: log.action, color: 'text-slate-600 bg-slate-50 border-slate-200', icon: null };
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex justify-between items-center shrink-0">
         <div className="flex gap-4">
             <button onClick={() => setActiveTab('SNAPSHOTS')} className={`flex items-center gap-2 pb-2 px-2 border-b-2 font-bold text-sm ${activeTab === 'SNAPSHOTS' ? 'border-iam-red text-iam-red dark:text-cyan-400' : 'border-transparent text-slate-500'}`}>
                <Camera size={16} /> Instantanés
             </button>
             <button onClick={() => setActiveTab('LOGS')} className={`flex items-center gap-2 pb-2 px-2 border-b-2 font-bold text-sm ${activeTab === 'LOGS' ? 'border-iam-red text-iam-red dark:text-cyan-400' : 'border-transparent text-slate-500'}`}>
                <FileClock size={16} /> Audit
             </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white dark:bg-slate-950/30">
        {activeTab === 'LOGS' ? (
            <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input value={searchLog} onChange={e => setSearchLog(e.target.value)} placeholder="Chercher un agent ou ID..." className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg pl-8 py-2 text-xs outline-none" />
                    </div>
                </div>
                <div className="space-y-2">
                    {filteredLogs.map(log => {
                        const isExpanded = expandedLogId === log.id;
                        const info = getActionInfo(log);
                        const changes = computeChanges(log.old_data, log.new_data);
                        return (
                            <div key={log.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className={`mt-1 p-1.5 rounded-lg border ${info.color}`}>{info.icon}</div>
                                        <div>
                                            <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{log.entity_id}</div>
                                            <div className="text-[10px] text-slate-500 mt-1">{new Date(log.created_at).toLocaleString()} • Par {log.user_email}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setExpandedLogId(isExpanded ? null : log.id)} className="text-slate-400"><ChevronDown size={16} className={isExpanded ? 'rotate-180' : ''}/></button>
                                </div>
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 space-y-2">
                                        {changes.map((c, i) => (
                                            <div key={i} className="flex items-center justify-between text-[10px] bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                                <span className="font-bold text-slate-400">{c.field}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-rose-500 line-through">{c.old}</span>
                                                    <ArrowRight size={10} />
                                                    <span className="text-emerald-500 font-bold">{c.new}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        ) : (
          <div className="space-y-4">
              {/* Snapshot List (Existing Logic) */}
              <div className="text-center text-slate-400 py-10 italic">Consultez l'onglet Audit pour les changements en temps réel.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnapshotPanel;
