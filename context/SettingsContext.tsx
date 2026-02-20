
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SettingsService, FeatureFlag, SettingDefinition } from '../lib/service/settings-service';
import { supabase } from '../lib/supabase';

interface SettingsContextType {
  settings: Record<string, any>;
  flags: Record<string, boolean>;
  registry: SettingDefinition[];
  loading: boolean;
  canAccess: (category: string) => boolean;
  isFeatureEnabled: (key: string) => boolean;
  updateSetting: (key: string, value: any, scope?: 'GLOBAL' | 'USER') => Promise<void>;
  toggleFeature: (key: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [registry, setRegistry] = useState<SettingDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    const { data } = await (supabase.auth as any).getSession();
    if (!data?.session) {
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
        const role = SettingsService.getUserRole();
        
        const [rawFlags, rawRegistry, mergedVals] = await Promise.all([
          SettingsService.fetchFeatureFlags(),
          SettingsService.fetchRegistry(),
          SettingsService.fetchMergedSettings()
        ]);

        const activeFlags: Record<string, boolean> = {};
        rawFlags.forEach(f => {
          activeFlags[f.flag_key] = f.is_enabled && (f.allowed_roles.length === 0 || f.allowed_roles.includes(role));
        });

        setFlags(activeFlags);
        setRegistry(rawRegistry);
        setSettings(mergedVals);
    } catch (e) {
        console.error("Settings load error:", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { 
    loadAll();
    
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((event: string) => {
        if (event === 'SIGNED_IN') loadAll();
        if (event === 'SIGNED_OUT') {
            setSettings({});
            setFlags({});
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  const canAccess = (category: string): boolean => {
    const role = SettingsService.getUserRole();
    if (role === 'ADMIN') return true;
    if (category === 'SYSTEM') return false;
    const defs = registry.filter(r => r.category === category && r.is_public);
    return defs.length > 0;
  };

  const isFeatureEnabled = (key: string): boolean => flags[key] === true;

  const updateSetting = async (key: string, value: any, scope: 'GLOBAL' | 'USER' = 'USER') => {
    const success = await SettingsService.updateSetting(key, value, scope);
    if (success) {
        setSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  const toggleFeature = async (key: string) => {
    const currentState = flags[key];
    const success = await SettingsService.updateFeatureFlag(key, !currentState);
    if (success) {
        setFlags(prev => ({ ...prev, [key]: !currentState }));
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, flags, registry, loading, canAccess, isFeatureEnabled, 
      updateSetting, toggleFeature, refreshSettings: loadAll 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
