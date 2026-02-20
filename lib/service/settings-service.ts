
import { supabase } from '../supabase';

export interface UserAccount {
  id: string;
  email: string;
  full_name: string;
  role: string;
  last_sign_in?: string;
  created_at: string;
  is_active: boolean;
}

export interface FeatureFlag {
  flag_key: string;
  is_enabled: boolean;
  allowed_roles: string[];
}

export interface SettingDefinition {
  key: string;
  label: string;
  category: string;
  data_type: string;
  default_value: any;
  is_public: boolean;
}

export const SettingsService = {
  /**
   * Récupère l'annuaire complet (Admin Only)
   */
  async fetchUserDirectory(): Promise<UserAccount[]> {
    const { data, error } = await supabase.rpc('get_user_directory');
    if (error) {
      console.error("[SettingsService] Erreur annuaire:", error.message);
      return [];
    }
    return data as any as UserAccount[];
  },

  /**
   * Création d'un nouvel utilisateur (Le profil est géré par le Trigger DB)
   */
  async createUser(user: any): Promise<{success: boolean, error?: string}> {
      const { data, error } = await (supabase as any).rpc('admin_create_user', {
          target_email: user.email,
          target_password: user.password,
          target_full_name: user.full_name,
          target_role: user.role.toLowerCase()
      });
      
      if (error) {
          console.error("[SettingsService] Erreur création:", error.message);
          return { success: false, error: error.message };
      }
      return { success: true };
  },

  /**
   * Mise à jour d'un agent existant
   */
  async updateUser(userId: string, updates: Partial<UserAccount>): Promise<{success: boolean, error?: string}> {
      const { error } = await (supabase.from('profiles') as any)
        .update({
            full_name: updates.full_name,
            role: updates.role?.toLowerCase(),
            is_active: updates.is_active,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) return { success: false, error: error.message };
      return { success: true };
  },

  /**
   * Suppression définitive
   */
  async deleteUser(userId: string): Promise<{success: boolean, error?: string}> {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) return { success: false, error: error.message };
      return { success: true };
  },

  /**
   * Récupère le rôle synchronisé (depuis localStorage pour performance UI)
   */
  getUserRole(): string {
    try {
      const sessionKey = 'sb-kdwkxectaycxdayqzyrf-auth-token';
      const sessionData = localStorage.getItem(sessionKey);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        const role = parsed?.user?.app_metadata?.role || parsed?.user?.user_metadata?.role || 'technician';
        return role.toUpperCase();
      }
    } catch (e) {}
    return 'TECHNICIAN';
  },

  async fetchMergedSettings(): Promise<Record<string, any>> {
    const { data, error } = await supabase.from('settings_values').select('*');
    if (error || !data) return {};
    const merged: Record<string, any> = {};
    (data as any[]).filter(v => v.scope === 'GLOBAL').forEach(v => merged[v.setting_key] = v.value);
    
    const { data: authData } = await (supabase.auth as any).getUser();
    if (authData?.user) {
      (data as any[]).filter(v => v.scope === 'USER' && v.user_id === authData.user.id).forEach(v => merged[v.setting_key] = v.value);
    }
    return merged;
  },

  async fetchFeatureFlags(): Promise<FeatureFlag[]> {
    const { data } = await supabase.from('feature_flags').select('*');
    return (data || []) as FeatureFlag[];
  },

  async fetchRegistry(): Promise<SettingDefinition[]> {
    const { data } = await supabase.from('settings_definitions').select('*');
    return (data || []) as SettingDefinition[];
  },

  async updateSetting(key: string, value: any, scope: 'GLOBAL' | 'USER'): Promise<boolean> {
    const { data } = await (supabase.auth as any).getUser();
    const payload: any = { setting_key: key, value, scope, updated_at: new Date().toISOString() };
    if (scope === 'USER' && data?.user) payload.user_id = data.user.id;
    const { error } = await supabase.from('settings_values').upsert(payload);
    return !error;
  },

  async updateFeatureFlag(key: string, isEnabled: boolean): Promise<boolean> {
    const { error } = await (supabase.from('feature_flags') as any).update({ is_enabled: isEnabled }).eq('flag_key', key);
    return !error;
  }
};
