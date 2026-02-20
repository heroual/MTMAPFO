
import React, { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Settings, User, Palette, Zap, ShieldCheck, Save, Loader2, Users, Map, GitPullRequest } from 'lucide-react';

import ProfileSettings from '../components/Settings/ProfileSettings';
import InterfaceSettings from '../components/Settings/InterfaceSettings';
import NetworkSettings from '../components/Settings/NetworkSettings';
import GisSettings from '../components/Settings/GisSettings';
import AdminSettings from '../components/Settings/AdminSettings';
import UserManagement from '../components/Settings/UserManagement';
import WorkflowSettings from '../components/Settings/WorkflowSettings';

const SettingsPage: React.FC = () => {
  const { canAccess, loading, refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('PROFILE');
  const [isSaving, setIsSaving] = useState(false);

  const menuItems = [
    { id: 'PROFILE', label: 'Profil Agent', icon: User, category: 'USER' },
    { id: 'INTERFACE', label: 'Interface & Langue', icon: Palette, category: 'UI' },
    { id: 'GIS', label: 'Cartographie', icon: Map, category: 'UI' },
    { id: 'NETWORK', label: 'Ingénierie GPON', icon: Zap, category: 'GIS' },
    { id: 'WORKFLOW', label: 'Workflows', icon: GitPullRequest, category: 'SYSTEM' },
    { id: 'USERS', label: 'Gestion Comptes', icon: Users, category: 'SYSTEM' },
    { id: 'ADMIN', label: 'Console Système', icon: ShieldCheck, category: 'SYSTEM' },
  ];

  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => canAccess(item.category));
  }, [canAccess]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-iam-red mb-4" size={48} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Accès au noyau sécurisé...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white dark:bg-slate-950 overflow-hidden">
      <aside className="w-80 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col shrink-0">
        <div className="p-10">
            <h1 className="text-[28px] font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tighter">
                <Settings className="text-iam-red" size={24} /> Console
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-1">MTMAP-FO Intelligence</p>
        </div>

        <nav className="flex-1 px-6 space-y-1">
            {filteredMenu.map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                        activeTab === item.id 
                        ? 'bg-white dark:bg-slate-800 text-iam-red dark:text-cyan-400 shadow-md border border-slate-100 dark:border-slate-700' 
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <item.icon size={18} className={activeTab === item.id ? 'text-iam-red' : 'text-slate-400'} />
                        <span className="text-xs font-black uppercase tracking-wide">{item.label}</span>
                    </div>
                </button>
            ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-4xl">
            <header className="mb-12 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{activeTab}</h2>
                    <div className="h-1.5 w-12 bg-iam-red mt-4 rounded-full" />
                </div>
            </header>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'PROFILE' && <ProfileSettings />}
                {activeTab === 'INTERFACE' && <InterfaceSettings />}
                {activeTab === 'GIS' && <GisSettings />}
                {activeTab === 'NETWORK' && <NetworkSettings />}
                {activeTab === 'WORKFLOW' && <WorkflowSettings />}
                {activeTab === 'USERS' && <UserManagement />}
                {activeTab === 'ADMIN' && <AdminSettings />}
            </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
