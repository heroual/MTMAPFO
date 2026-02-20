
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { Server, Share2, Activity, AlertTriangle, Cable, Box, History, ShieldCheck, Zap, PlusCircle, Layout, ArrowUpRight, CheckCircle2, Search, Map as MapIcon, AlertCircle, Clock, HardHat } from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';
import { DashboardAnalytics } from '../lib/dashboard-analytics';
import { OperationalStatusEngine } from '../lib/operational-status';
import { EquipmentType, NetworkState } from '../types';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { sites, olts, msans, joints, pcos, splitters, cables, auditLogs, slots, ports, equipments, chambers } = useNetwork();

  const state: NetworkState = { sites, olts, msans, joints, pcos, splitters, cables, slots, ports, equipments, chambers };
  
  const metrics = useMemo(() => ({
      totals: DashboardAnalytics.getTotals(state),
      fiber: DashboardAnalytics.getFiberMetrics(state),
      utilization: DashboardAnalytics.getUtilization(state),
      health: DashboardAnalytics.getHealthStatus(state),
      chartData: DashboardAnalytics.getSaturationChartData(state)
  }), [state]);

  const criticalAlerts = useMemo(() => {
      // On récupère TOUS les équipements et les câbles
      const all = [...equipments, ...cables];
      return all
        .filter(e => !(e as any).isDeleted)
        .map(e => ({ 
            ...e, 
            sat: OperationalStatusEngine.computeSaturation(e) 
        }))
        // Capture à partir de 80% OU saturé
        .filter(e => e.sat.percent >= 80 || e.sat.isSaturated)
        .sort((a, b) => {
            // Priorité absolue aux saturés (100%)
            if (a.sat.isSaturated && !b.sat.isSaturated) return -1;
            if (!a.sat.isSaturated && b.sat.isSaturated) return 1;
            return b.sat.percent - a.sat.percent;
        })
        .slice(0, 15);
  }, [equipments, cables]);

  const kpis = [
    { title: t('dashboard.kpi.utilization'), value: `${metrics.utilization.globalUtilization}%`, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { title: "Saturation Critique", value: metrics.utilization.criticalRisks, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    { title: t('dashboard.kpi.fiber_infra'), value: `${metrics.fiber.totalLengthKm.toFixed(1)} km`, icon: Cable, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { title: "Indice Santé", value: `${Math.round(metrics.utilization.globalUtilization > 0 ? 100 - (metrics.utilization.criticalRisks * 2) : 100)}%`, icon: ShieldCheck, color: 'text-iam-red', bg: 'bg-red-50 dark:bg-red-500/10' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 overflow-y-auto h-full custom-scrollbar bg-slate-50 dark:bg-slate-950">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <div className="p-2 bg-iam-red rounded-xl shadow-lg shadow-red-500/20">
                <Layout size={24} className="text-white" />
             </div>
             {t('dashboard.title')}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Operational Network Telemetry</p>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                <kpi.icon size={64} />
            </div>
            <div className={`p-3 w-fit rounded-2xl mb-4 ${kpi.bg} ${kpi.color} shadow-sm`}>
              <kpi.icon size={24} />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{kpi.value}</div>
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">{kpi.title}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
            
            {/* Saturation Alerts List */}
            <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/20">
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-6 flex items-center justify-between uppercase tracking-wider">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-rose-500 rounded-full" /> Alertes Saturation
                    </div>
                    <span className="text-[9px] font-black bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-1 rounded-full uppercase tracking-tighter">{criticalAlerts.length} Points à surveiller</span>
                </h3>
                <div className="space-y-3">
                    {criticalAlerts.map(alert => (
                        <div key={alert.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-iam-red/30 transition-all hover:translate-x-1">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 ${alert.sat.percent >= 100 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'} rounded-2xl`}>
                                    {alert.type === EquipmentType.CABLE ? <Cable size={20}/> : (alert.type === EquipmentType.PCO ? <Box className="text-emerald-600" size={20}/> : <Server size={20}/>)}
                                </div>
                                <div>
                                    <div className="text-sm font-black text-slate-800 dark:text-slate-200">{alert.name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{alert.type} • {alert.id.substring(0,8)}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <div className={`text-lg font-black ${alert.sat.percent >= 100 ? 'text-rose-600' : 'text-amber-600'}`}>{alert.sat.percent}%</div>
                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Charge</div>
                                </div>
                                <div className="w-20 md:w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                    <div className={`h-full transition-all duration-1000 ${alert.sat.percent >= 100 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{width: `${alert.sat.percent}%`}} />
                                </div>
                            </div>
                        </div>
                    ))}
                    {criticalAlerts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400 opacity-40">
                            <CheckCircle2 size={48} className="mb-2 text-emerald-500" />
                            <p className="text-sm font-black uppercase tracking-widest">Capacité Réseau Optimale</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Repartition Chart */}
            <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 h-[400px] flex flex-col">
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-wider">
                    <div className="w-2 h-6 bg-blue-500 rounded-full" /> {t('dashboard.charts.pco_saturation')}
                </h3>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                            <XAxis dataKey="name" hide />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                fontSize={10} 
                                fontWeight="black"
                                tick={{ fill: '#94a3b8' }}
                            />
                            <Tooltip 
                                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                contentStyle={{ 
                                    borderRadius: '1.25rem', 
                                    border: 'none', 
                                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                                    fontWeight: 'bold',
                                    fontSize: '12px'
                                }}
                            />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={48}>
                                {metrics.chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Sidebar: Activity Logs */}
        <div className="lg:col-span-4 h-fit">
            <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] bg-slate-900 dark:bg-slate-900 border border-slate-800 shadow-2xl text-white">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    <History size={14} className="text-blue-500" /> Flux d'Activité Audit
                </h4>
                <div className="space-y-6">
                    {auditLogs.slice(0, 10).map(log => (
                        <div key={log.id} className="flex gap-4 group">
                            <div className={`w-1 h-10 rounded-full shrink-0 transition-all group-hover:w-1.5 ${
                                log.action === 'DELETE' ? 'bg-rose-500' : 
                                log.action === 'CREATE' ? 'bg-emerald-500' : 
                                log.action === 'ROLLBACK' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${
                                        log.action === 'DELETE' ? 'text-rose-400' : 
                                        log.action === 'CREATE' ? 'text-emerald-400' : 'text-blue-400'
                                    }`}>{log.action}</span>
                                    <span className="text-xs font-bold truncate text-slate-300">{log.entity_type}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                    <Clock size={10} /> {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    <span className="opacity-50">•</span>
                                    <span className="truncate flex items-center gap-1"><HardHat size={10} /> {log.user_email.split('@')[0]}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {auditLogs.length === 0 && (
                        <div className="py-10 text-center text-slate-600 text-xs italic font-bold">
                            Piste d'audit vide
                        </div>
                    )}
                </div>
                
                <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors border border-white/10">
                    Voir tous les logs
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
