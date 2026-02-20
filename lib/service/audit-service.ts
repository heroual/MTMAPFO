import { supabase } from '../supabase';
import { EquipmentType } from '../../types';

export enum ActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LINK = 'LINK',
  UNLINK = 'UNLINK',
  ROLLBACK = 'ROLLBACK',
  IMPORT = 'IMPORT',
  SETTING_UPDATE = 'SETTING_UPDATE'
}

export interface AuditLogEntry {
  action: ActionType | string;
  entity_type: EquipmentType | string;
  entity_id: string;
  entity_path?: string;
  old_data?: any;
  new_data?: any;
  user_email?: string;
}

export const AuditService = {
  /**
   * Appends a new log entry. Fails silently if network is down.
   * Note: Settings changes are now mostly handled by DB Triggers.
   */
  async log(entry: AuditLogEntry) {
    if (!supabase) return;

    try {
      const payload = {
        user_email: entry.user_email || 'system@mtmap.ma',
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        entity_path: entry.entity_path || 'ROOT',
        old_data: entry.old_data ? JSON.parse(JSON.stringify(entry.old_data)) : null,
        new_data: entry.new_data ? JSON.parse(JSON.stringify(entry.new_data)) : null,
        created_at: new Date().toISOString()
      };

      // Fixed: Cast table reference to any to avoid 'never' error
      const { error } = await (supabase.from('audit_logs') as any).insert(payload);
      
      if (error && error.code !== 'PGRST301') {
           console.warn("Audit Logging (Supabase Error):", error.message);
      }
    } catch (err) {
      // Silence network fetch errors to prevent UI crash
    }
  },

  async fetchLogs(limit = 100) {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
          
        if (error) {
            console.error("Fetch logs error:", error);
            return [];
        }
        return data || [];
    } catch (e) {
        return [];
    }
  }
};