
import React from 'react';
import { ShieldCheck, Zap, Database, Cpu, Activity, AlertTriangle, Monitor, Palette, Globe, Save, Info } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const AdminSettings: React.FC = () => {
  const { flags, settings, isFeatureEnabled, toggleFeature, updateSetting } = useSettings();

  const flagList = [
    { key: 'ai_assistant', label: 'IA Copilot Gemini', desc: 'Active l\'assistant conversationnel technique pour le réseau.', icon: Zap, color: 'text-indigo-500' },
    { key: 'advanced_splicing', label: 'Splicing V2 (Advanced)', desc: 'Moteur de brassage optique complexe multi-câbles.', icon: Cpu, color: 'text-amber-500' },
    { key: 'realtime_telemetry', label: 'Télémétrie Live', desc: 'Synchronisation des statuts équipements toutes les 5s.', icon: Activity, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-12">
      {/* 1. BRANDING & IDENTITY */}
      <section className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600">
                <Monitor size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Identité de la Plateforme</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom du Système</label>
                  <input 
                    type="text" 
                    defaultValue={settings['platform.name'] || 'MTMAP-FO'} 
                    onBlur={(e) => updateSetting('platform.name', e.target.value, 'GLOBAL')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-all"
                  />
                  <p className="text-[10px] text-slate-500 italic">Ce nom apparaîtra dans le Header et les rapports exportés.</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Couleur Primaire (Branding)</label>
                  <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-xl border-4 border-white dark:border-slate-800 shadow-lg shrink-0" style={{ backgroundColor: settings['branding.primary_color'] || '#E30613' }} />
                      <input 
                        type="text" 
                        defaultValue={settings['branding.primary_color'] || '#E30613'}
                        onBlur={(e) => updateSetting('branding.primary_color', e.target.value, 'GLOBAL')}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-mono text-xs font-bold outline-none"
                      />
                  </div>
              </div>
          </div>
      </section>

      {/* 2. SYSTEM LOCALIZATION */}
      <section className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600">
                <Globe size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Régionalisation par Défaut</h3>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                      <Globe size={20} className="text-slate-400" />
                  </div>
                  <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">Langue Système (Global)</p>
                      <p className="text-xs text-slate-500">Appliqué aux comptes n'ayant pas défini de préférence.</p>
                  </div>
              </div>
              <select 
                defaultValue={settings['app.default_language'] || 'fr'}
                onChange={(e) => updateSetting('app.default_language', e.target.value, 'GLOBAL')}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold outline-none"
              >
                  <option value="fr">Français (Défaut)</option>
                  <option value="en">English (UK)</option>
                  <option value="ar">العربية (Coming soon)</option>
              </select>
          </div>
      </section>

      {/* 3. FEATURE FLAGS */}
      <section className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-xl text-purple-600">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestion des Modules</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
              {flagList.map(flag => (
                  <div key={flag.key} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] flex items-center justify-between group hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4">
                          <div className={`p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform ${flag.color}`}>
                              <flag.icon size={20} />
                          </div>
                          <div>
                              <p className="font-bold text-slate-800 dark:text-white">{flag.label}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{flag.key}</p>
                              <p className="text-xs text-slate-500 mt-1">{flag.desc}</p>
                          </div>
                      </div>
                      <div 
                        onClick={() => toggleFeature(flag.key)}
                        className={`w-14 h-7 rounded-full cursor-pointer transition-colors p-1 flex items-center ${isFeatureEnabled(flag.key) ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                          <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all transform ${isFeatureEnabled(flag.key) ? 'translate-x-7' : 'translate-x-0'}`} />
                      </div>
                  </div>
              ))}
          </div>
      </section>

      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 rounded-3xl border border-rose-200 dark:border-rose-800 flex gap-4 items-start">
          <AlertTriangle className="text-rose-500 shrink-0" size={20} />
          <p className="text-[11px] text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
            <b>Attention :</b> Les modifications globales impactent l'ensemble des {settings['platform.name'] || 'utilisateurs'}. 
            Les changements de branding peuvent nécessiter un rechargement de la page pour certains agents.
          </p>
      </div>
    </div>
  );
};

export default AdminSettings;
