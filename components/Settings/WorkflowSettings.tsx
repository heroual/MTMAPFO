
import React from 'react';
import { GitPullRequest, ShieldCheck, Camera, FileCheck, FileText, AlertCircle, HardHat, ClipboardCheck } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const WorkflowSettings: React.FC = () => {
  const { settings, updateSetting } = useSettings();

  const toggle = (key: string) => {
    updateSetting(key, !settings[key], 'GLOBAL');
  };

  const workflowItems = [
    { 
        key: 'workflow.require_manager_validation', 
        label: 'Approbation Hiérarchique', 
        desc: 'Nécessite la signature d\'un Manager pour clore une intervention.',
        icon: ShieldCheck, 
        color: 'text-blue-500'
    },
    { 
        key: 'workflow.require_photo_doe', 
        label: 'Photo Obligatoire', 
        desc: 'Bloque la clôture si aucune photo du DOE n\'est uploadée.',
        icon: Camera, 
        color: 'text-purple-500'
    },
    { 
        key: 'workflow.strict_material_check', 
        label: 'Contrôle des Stocks', 
        desc: 'Interdit la consommation de matériel non prévu au devis initial.',
        icon: ClipboardCheck, 
        color: 'text-amber-500'
    },
    { 
        key: 'workflow.auto_capture_extent', 
        label: 'Auto-Capture SIG', 
        desc: 'Génère un croquis automatique de l\'emprise des travaux.',
        icon: FileCheck, 
        color: 'text-emerald-500'
    }
  ];

  return (
    <div className="space-y-12">
      {/* 1. RÈGLES DE VALIDATION */}
      <section className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600">
                <GitPullRequest size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Cycle de Vie Opérationnel</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
              {workflowItems.map((item) => (
                  <div key={item.key} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex items-center justify-between group hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4">
                          <div className={`p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl ${item.color}`}>
                              <item.icon size={24} />
                          </div>
                          <div>
                              <p className="font-bold text-slate-800 dark:text-white text-sm">{item.label}</p>
                              <p className="text-xs text-slate-500 max-w-md mt-1">{item.desc}</p>
                          </div>
                      </div>
                      <div 
                        onClick={() => toggle(item.key)}
                        className={`w-14 h-7 rounded-full cursor-pointer transition-colors p-1 flex items-center ${settings[item.key] !== false ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                          <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all transform ${settings[item.key] !== false ? 'translate-x-7' : 'translate-x-0'}`} />
                      </div>
                  </div>
              ))}
          </div>
      </section>

      {/* 2. CONFIGURATION DES RAPPORTS */}
      <section className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-xl text-purple-600">
                <FileText size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Paramètres d'Édition</h3>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modèle de Rapport (ODT)</label>
                      <select 
                        value={settings['workflow.report_template'] || 'standard_iso'}
                        onChange={(e) => updateSetting('workflow.report_template', e.target.value, 'GLOBAL')}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                      >
                          <option value="standard_iso">Standard ISO (MTMAP Default)</option>
                          <option value="iam_legacy">Maroc Telecom Legacy</option>
                          <option value="detailed_eng">Ingénierie Détaillée</option>
                      </select>
                  </div>
                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Délai d'Archivage Auto</label>
                      <div className="flex items-center gap-3">
                        <input 
                            type="number" 
                            defaultValue={30}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Jours</span>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20 flex gap-4 items-start">
          <AlertCircle className="text-blue-500 shrink-0" size={20} />
          <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
            <b>Conformité :</b> Ces paramètres définissent la rigueur opérationnelle du réseau. Toute modification est immédiatement répercutée sur les terminaux mobiles des agents de terrain.
          </p>
      </div>
    </div>
  );
};

export default WorkflowSettings;
