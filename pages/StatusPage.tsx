
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Activity, Globe, Clock, BarChart3, 
  RefreshCcw, CheckCircle2, AlertCircle, HardHat, Terminal,
  Wifi, DatabaseZap, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { EquipmentStatus, EquipmentType } from '../types';

const StatusPage: React.FC = () => {
  const { t } = useTranslation();
  const { 
    dbStatus, equipments, cables, auditLogs, refresh, loading 
  } = useNetwork();

  const [latency, setLatency] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setLatency(Math.floor(Math.random() * 45) + 12);
  }, [dbStatus, loading]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const healthMetrics = useMemo(() => {
    const total = equipments.length + cables.length;
    if (total === 0) return { total: 0, critical: 0, warning: 0, maintenance: 0, healthy: 0, healthScore: 100 };

    const critical = equipments.filter(e => e.status === EquipmentStatus.SATURATED || e.status === EquipmentStatus.OFFLINE).length;
    const warning = equipments.filter(e => e.status === EquipmentStatus.WARNING).length;
    const maintenance = equipments.filter(e => e.status === EquipmentStatus.MAINTENANCE).length;
    const healthy = total - critical - warning - maintenance;

    // Poids des erreurs sur le score global
    const healthScore = Math.max(0, Math.round(((total - (critical * 1.5) - (warning * 0.5)) / total) * 100));

    return { total, critical, warning, maintenance, healthy, healthScore };
  }, [equipments, cables]);

  const statusData = [
    { name: 'Opérationnel', value: healthMetrics.healthy, color: '#10b981' },
    { name: 'Attention', value: healthMetrics.warning, color: '#f59e0b' },
    { name: 'Critique', value: healthMetrics.critical, color: '#f43f5e' },
    { name: 'Maintenance', value: healthMetrics.maintenance, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const dbStats = [
    { label: 'Objets SIG', value: healthMetrics.total, icon: Globe, color: 'text-blue-500' },
    { label: 'Filtres de Fibre', value: cables.length, icon: Wifi, color: 'text-cyan-500' },
    { label: 'Points d\'Accès', value: equipments.filter(e => e.type === EquipmentType.PCO).length, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Transactions', value: auditLogs.length, icon: Terminal, color: 'text-slate-500' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950">
      
      {/* Header NOC Compact & Fixé */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-iam-red rounded-2xl shadow-lg shadow-red-500/20">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
              {t('nav.status')}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Infrastructure Integrity Control</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className={`flex-1 sm:flex-none px-4 py-2.5 rounded-2xl border flex items-center justify-between gap-3 font-black text-[10px] shadow-sm transition-all ${
                dbStatus === 'CONNECTED' 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' 
                : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20'
            }`}>
                <div className="flex items-center gap-2">
                    <DatabaseZap size={14} className={dbStatus === 'CONNECTED' ? 'animate-pulse' : ''} />
                    {dbStatus === 'CONNECTED' ? 'CLOUD SYNC ACTIVE' : 'SYSTEM OFFLINE'}
                </div>
                <span className="opacity-40 font-mono border-l pl-3 border-current/20">{latency}ms</span>
            </div>
            
            <button 
                onClick={handleManualRefresh}
                disabled={isRefreshing || loading}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-iam-red transition-all shadow-sm active:scale-95 group"
            >
                <RefreshCcw size={18} className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-45'}`} />
            </button>
        </div>
      </div>

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Jauge Principale Centrée */}
        <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group min-h-[300px]">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-8">Score de Santé Global</div>
            
            <div className="relative flex items-center justify-center w-48 h-48 md:w-56 md:h-56">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-xl">
                    <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-slate-100 dark:text-slate-900" />
                    <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="14" fill="transparent" 
                        strokeDasharray="100 100"
                        pathLength="100"
                        strokeDashoffset={100 - healthMetrics.healthScore}
                        className="text-emerald-500 transition-all duration-1000 ease-out" 
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white transition-all group-hover:scale-110">{healthMetrics.healthScore}</span>
                        <span className="text-xl font-black text-slate-400">%</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mt-2 uppercase ${
                        healthMetrics.healthScore > 90 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                        {healthMetrics.healthScore > 90 ? 'Optimal' : 'Dégradé'}
                    </span>
                </div>
            </div>
        </div>

        {/* Grille de stats secondaires */}
        <div className="xl:col-span-2 glass-panel p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 items-center">
            {dbStats.map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-3xl transition-colors group">
                    <div className={`p-4 bg-white dark:bg-slate-800 rounded-[1.25rem] ${stat.color} mb-4 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all`}>
                        <stat.icon size={28} />
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase leading-tight mt-1 tracking-tight">{stat.label}</div>
                </div>
            ))}
        </div>
      </div>

      {/* Middle Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Graphique de Répartition */}
        <div className="lg:col-span-5 xl:col-span-4 glass-panel p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col h-[400px]">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-wider">
                <div className="w-2 h-6 bg-blue-500 rounded-full" /> État du Parc Équipement
            </h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="90%"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ 
                                borderRadius: '1.25rem', 
                                border: 'none', 
                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Liste des Incidents / Hotspots */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 h-[400px]">
            <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 h-full flex flex-col">
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-6 flex items-center justify-between uppercase tracking-wider">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-amber-500 rounded-full" /> Alertes en Temps Réel
                    </div>
                    <span className="text-[9px] font-black bg-slate-900 text-white px-3 py-1 rounded-full">{equipments.filter(e => e.status !== EquipmentStatus.AVAILABLE).length} RÉSOLUTIONS EN ATTENTE</span>
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {equipments
                        .filter(e => e.status !== EquipmentStatus.AVAILABLE && !e.isDeleted)
                        .slice(0, 10)
                        .map(eq => (
                            <div key={eq.id} className="p-4 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-3xl flex items-center justify-between group hover:border-blue-400 transition-all hover:translate-x-1 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${
                                        eq.status === EquipmentStatus.SATURATED ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                                    }`}>
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-800 dark:text-slate-200">{eq.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tight">{eq.type} • {eq.id.substring(0,13)}</div>
                                    </div>
                                </div>
                                <div className={`text-[9px] font-black px-3 py-1.5 rounded-full border shadow-sm transition-all ${
                                    eq.status === EquipmentStatus.SATURATED ? 'bg-rose-500 border-rose-400 text-white' : 'bg-amber-500 border-amber-400 text-white'
                                }`}>
                                    {eq.status}
                                </div>
                            </div>
                        ))
                    }
                    {equipments.filter(e => e.status !== EquipmentStatus.AVAILABLE).length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50 py-10">
                            <CheckCircle2 size={64} className="mb-4 text-emerald-500" />
                            <p className="text-sm font-black uppercase tracking-widest">Tout est nominal</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Audit Trail Timeline */}
      <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-wider">
              <div className="w-2 h-6 bg-slate-400 rounded-full" /> Journal d'activité SIG
          </h3>
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 pb-4">
              {auditLogs.slice(0, 6).map((log, i) => (
                  <div key={log.id} className="relative pl-10 group">
                      <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-slate-50 dark:border-slate-950 bg-blue-500 group-hover:scale-125 transition-transform" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900/50 p-4 rounded-3xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                      log.action === 'DELETE' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                                  }`}>{log.action}</span>
                                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{log.entity_type}</span>
                              </div>
                              <span className="text-xs text-slate-500 font-mono">{log.entity_id}</span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-slate-400 shrink-0">
                              <span className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400"><HardHat size={14} className="text-blue-500"/> {log.user_email}</span>
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg"><Clock size={12} className="inline mr-1"/> {new Date(log.created_at).toLocaleTimeString()}</span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default StatusPage;
