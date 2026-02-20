
import React from 'react';
import { Monitor, Moon, Sun, Layout, Type, Globe } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import LanguageSwitcher from '../Layout/LanguageSwitcher';

const InterfaceSettings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-10">
      <div className="space-y-6">
          <div className="flex items-center gap-3">
              <Layout size={20} className="text-blue-500" />
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Apparence visuelle</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                          {theme === 'light' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-blue-400" />}
                      </div>
                      <div>
                          <p className="font-bold text-slate-800 dark:text-white">Mode d'affichage</p>
                          <p className="text-xs text-slate-500">Alterner entre le thème clair (IAM) et le mode nuit.</p>
                      </div>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-transform active:scale-95"
                  >
                      Passer au mode {theme === 'light' ? 'Nuit' : 'Jour'}
                  </button>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                          <Globe size={20} className="text-emerald-500" />
                      </div>
                      <div>
                          <p className="font-bold text-slate-800 dark:text-white">Langue régionale</p>
                          <p className="text-xs text-slate-500">Localisation complète de l'interface SIG.</p>
                      </div>
                  </div>
                  <div className="w-48">
                      <LanguageSwitcher />
                  </div>
              </div>
          </div>
      </div>

      <div className="space-y-6">
          <div className="flex items-center gap-3">
              <Type size={20} className="text-purple-500" />
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Accessibilité</h3>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800">
               <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                  <div>
                      <p className="font-bold text-slate-800 dark:text-white">Densité de l'interface</p>
                      <p className="text-xs text-slate-500">Ajuste l'espacement des cartes et des menus.</p>
                  </div>
                  <div className="flex gap-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
                      <button className="px-4 py-2 bg-white dark:bg-slate-700 rounded-lg text-[10px] font-black uppercase">Compact</button>
                      <button className="px-4 py-2 text-slate-500 text-[10px] font-black uppercase">Standard</button>
                  </div>
               </div>
          </div>
      </div>
    </div>
  );
};

export default InterfaceSettings;
