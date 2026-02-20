
import React from 'react';
import { Zap, Ruler, ShieldAlert, Sliders, MapPin, Cable, Box, GitMerge, AlertCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const NetworkSettings: React.FC = () => {
  const { settings, updateSetting } = useSettings();

  const cableTypes = settings['ftth.cable_types'] || ["FO16", "FO24", "FO48", "FO72", "FO144"];
  const splitterRatios = settings['ftth.splitter_ratios'] || ["1:2", "1:4", "1:8", "1:16", "1:32", "1:64"];

  return (
    <div className="space-y-10">
      {/* 1. SEUILS D'INGÉNIERIE */}
      <div className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-amber-600">
                <Ruler size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Paramètres de Faisabilité</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distance Max Drop Cable (m)</label>
                  <div className="flex items-center gap-4">
                      <input 
                        type="number" 
                        defaultValue={settings['network.max_drop_distance'] || 250}
                        onBlur={(e) => updateSetting('network.max_drop_distance', parseInt(e.target.value), 'GLOBAL')}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-iam-red outline-none focus:border-blue-500" 
                      />
                      <span className="text-xs font-bold text-slate-400 uppercase">Mètres</span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">Limite physique pour les raccordements abonnés standard.</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sensibilité ONT (dBm)</label>
                  <div className="flex items-center gap-4">
                      <input 
                        type="number" 
                        defaultValue={settings['ftth.min_optical_power'] || -25}
                        onBlur={(e) => updateSetting('ftth.min_optical_power', parseInt(e.target.value), 'GLOBAL')}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-blue-500 outline-none focus:border-blue-500" 
                      />
                      <span className="text-xs font-bold text-slate-400 uppercase">dBm</span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">Seuil minimal de puissance pour une activation valide.</p>
              </div>
          </div>
      </div>

      {/* 2. CATALOGUE INFRASTRUCTURE */}
      <div className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600">
                <Cable size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Standards Infrastructure</h3>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-8">
              <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Box size={16} className="text-slate-400" />
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Types de Câbles Autorisés</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {cableTypes.map((type: string) => (
                          <span key={type} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-300">
                              {type}
                          </span>
                      ))}
                      <button className="px-3 py-1.5 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-[10px] font-bold text-slate-400 hover:text-blue-500 transition-colors">+ Ajouter</button>
                  </div>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-800" />

              <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <GitMerge size={16} className="text-slate-400" />
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ratios de Splitters (PLC)</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {splitterRatios.map((ratio: string) => (
                          <span key={ratio} className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl text-[10px] font-black text-purple-600 dark:text-purple-400">
                              {ratio}
                          </span>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* 3. LOGIQUE SYSTÈME */}
      <div className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600">
                <Zap size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Règles d'Automatisation</h3>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex items-center justify-between group">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600">
                      <GitMerge size={20} />
                  </div>
                  <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">Auto-occupation des brins</p>
                      <p className="text-[10px] text-slate-500">Allocation automatique lors de la liaison Splitter ➔ PCO.</p>
                  </div>
              </div>
              <div 
                onClick={() => updateSetting('ftth.auto_provisioning', !settings['ftth.auto_provisioning'], 'GLOBAL')}
                className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${settings['ftth.auto_provisioning'] !== false ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${settings['ftth.auto_provisioning'] !== false ? 'right-1' : 'left-1'}`} />
              </div>
          </div>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 flex gap-3">
          <AlertCircle className="text-blue-500 shrink-0" size={16} />
          <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
            Les modifications apportées ici modifient le comportement des calculatrices SIG et des assistants de déploiement pour tous les agents.
          </p>
      </div>
    </div>
  );
};

export default NetworkSettings;
