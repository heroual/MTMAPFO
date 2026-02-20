
import React from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, Network, Settings, PlusCircle, ShieldCheck, Sun, Moon, X, Database, Info, HardHat, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useTheme } from '../../context/ThemeContext';
import { useNetwork } from '../../context/NetworkContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { dbStatus } = useNetwork();
  const { settings } = useSettings();
  const { profile, signOut, checkAccess } = useAuth();
  const location = useLocation();

  // Liste complète des items avec leurs rôles minimums (sans État Système)
  const allNavItems = [
    { name: t('nav.dashboard'), icon: LayoutDashboard, path: '/', minRole: 'technician' as const },
    { name: t('nav.map'), icon: MapIcon, path: '/map', minRole: 'viewer' as const },
    { name: t('nav.install'), icon: PlusCircle, path: '/install', minRole: 'viewer' as const },
    { name: t('nav.equipments'), icon: Network, path: '/equipments', minRole: 'technician' as const },
    { name: t('nav.operations'), icon: HardHat, path: '/operations', minRole: 'technician' as const },
    { name: t('nav.governance'), icon: ShieldCheck, path: '/governance', minRole: 'supervisor' as const },
    { name: t('nav.settings'), icon: Settings, path: '/settings', minRole: 'technician' as const },
    { name: t('nav.about'), icon: Info, path: '/about', minRole: 'viewer' as const },
  ];

  // Filtrage basé sur checkAccess (Géré par AuthService.hasAccess)
  const navItems = allNavItems.filter(item => checkAccess(item.minRole));

  const handleNavigate = (path: string) => {
    window.location.hash = path;
    if (window.innerWidth < 1024) onClose();
  };

  const agentInitials = (profile?.full_name || 'Agent')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const displayRole = (role?: string) => {
      if (!role) return 'Technicien';
      const r = role.toLowerCase();
      if (r === 'admin') return 'Administrateur';
      if (r === 'supervisor') return 'Superviseur';
      if (r === 'technician') return 'Technicien';
      if (r === 'viewer') return 'Consultant';
      return 'Consultant';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[1900] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-[2000] w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 
        flex flex-col transition-transform duration-300 ease-in-out shadow-2xl dark:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:relative lg:shadow-none
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-iam-red flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0" style={{ backgroundColor: settings['branding.primary_color'] }}>
              <Network className="text-white w-6 h-6" />
            </div>
            <div>
               <span className="block text-xl font-extrabold tracking-tight text-iam-text dark:text-white leading-none">
                 {settings['platform.name'] || 'MTMAP'}
               </span>
               <span className="text-[10px] font-bold text-iam-red uppercase tracking-widest" style={{ color: settings['branding.primary_color'] }}>Gpon Intel</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-iam-red">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            // Logique de détection de l'onglet actif plus précise
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group text-left ${
                  isActive
                    ? 'bg-red-50 text-iam-red shadow-sm border border-red-100 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200 border border-transparent'
                }`}
                style={isActive ? { color: settings['branding.primary_color'], borderColor: `${settings['branding.primary_color']}33`, backgroundColor: `${settings['branding.primary_color']}11` } : {}}
              >
                <item.icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-iam-red dark:text-cyan-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                  }`}
                  style={isActive ? { color: settings['branding.primary_color'] } : {}}
                />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex gap-2">
              <div className="flex-1">
                  <LanguageSwitcher />
              </div>
              <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-iam-red dark:hover:text-cyan-400 transition-colors"
                  title={theme === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
              >
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-iam-red flex items-center justify-center border border-red-600 shadow-sm shrink-0" style={{ backgroundColor: settings['branding.primary_color'], borderColor: settings['branding.primary_color'] }}>
              <span className="text-xs font-black text-white">{agentInitials}</span>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{profile?.full_name || 'Agent'}</span>
              <span className="text-[10px] font-black text-iam-red uppercase truncate tracking-tighter" style={{ color: settings['branding.primary_color'] }}>{displayRole(profile?.role)}</span>
            </div>
            <button 
                onClick={signOut}
                className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                title="Déconnexion"
            >
                <LogOut size={18} />
            </button>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
              dbStatus === 'CONNECTED' 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' 
                : dbStatus === 'ERROR'
                ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
                : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
          }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                  dbStatus === 'CONNECTED' ? 'bg-emerald-500' : dbStatus === 'ERROR' ? 'bg-rose-500' : 'bg-amber-500'
              }`} />
              <div className="flex items-center gap-1 uppercase tracking-tighter">
                  <Database size={10} />
                  {dbStatus === 'CONNECTED' ? t('nav.status_cloud') : dbStatus === 'ERROR' ? t('nav.status_error') : t('nav.status_local')}
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
