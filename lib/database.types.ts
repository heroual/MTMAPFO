
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      equipments: {
        Row: {
          id: string
          name: string
          type: string
          parent_id: string | null
          location: any // PostGIS Point
          status: string
          capacity_total: number
          capacity_used: number
          metadata: Json
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          parent_id?: string | null
          location?: any
          status?: string
          capacity_total?: number
          capacity_used?: number
          metadata?: Json
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['equipments']['Insert']>
      }
      cables: {
        Row: {
          id: string
          name: string
          type: string
          category: string
          start_node_id: string
          end_node_id: string
          path_geometry: any // PostGIS LineString
          fiber_count: number
          status: string
          is_deleted: boolean
          created_at: string
          updated_at: string
          length_meters: number
          metadata: Json
        }
        Insert: {
          id?: string
          name: string
          type?: string
          category: string
          start_node_id: string
          end_node_id: string
          path_geometry?: any
          fiber_count?: number
          status?: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
          length_meters?: number
          metadata?: Json
        }
        Update: Partial<Database['public']['Tables']['cables']['Insert']>
      }
      clients: {
        Row: {
          id: string
          equipment_id: string
          login: string
          name: string
          contact_info: Json
          contract_info: Json
          created_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          login: string
          name: string
          contact_info?: Json
          contract_info?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      operations: {
        Row: {
          id: string
          type: string
          status: string
          technician: string
          target_id: string
          details: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          status: string
          technician: string
          target_id: string
          details?: string
          date?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['operations']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          user_email: string
          action: string
          entity_type: string
          entity_id: string
          entity_path: string | null
          old_data: Json | null
          new_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_email: string
          action: string
          entity_type: string
          entity_id: string
          entity_path?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
      network_snapshots: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['network_snapshots']['Insert']>
      }
      snapshot_data: {
        Row: {
          id: string
          snapshot_id: string
          table_name: string
          record_id: string
          record_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          snapshot_id: string
          table_name: string
          record_id: string
          record_data: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['snapshot_data']['Insert']>
      }
      settings_values: {
        Row: {
          id: string
          setting_key: string
          value: Json
          scope: string
          user_id: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          value: Json
          scope: string
          user_id?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['settings_values']['Insert']>
      }
      settings_definitions: {
        Row: {
          key: string
          label: string
          category: string
          data_type: string
          default_value: Json
          is_public: boolean
        }
        Insert: {
          key: string
          label: string
          category: string
          data_type: string
          default_value?: Json
          is_public?: boolean
        }
        Update: Partial<Database['public']['Tables']['settings_definitions']['Insert']>
      }
      feature_flags: {
        Row: {
          flag_key: string
          is_enabled: boolean
          allowed_roles: string[]
        }
        Insert: {
          flag_key: string
          is_enabled?: boolean
          allowed_roles?: string[]
        }
        Update: Partial<Database['public']['Tables']['feature_flags']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          is_active: boolean
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: string
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
    }
    Functions: {
      get_user_directory: {
        Args: Record<string, never>
        Returns: Json[]
      }
      admin_create_user: {
        Args: {
          target_email: string
          target_password: string
          target_full_name: string
          target_role: string
        }
        Returns: Json
      }
      admin_update_user: {
        Args: {
          target_user_id: string
          target_full_name?: string
          target_role?: string
          target_is_active?: boolean
        }
        Returns: Json
      }
      admin_delete_user: {
        Args: {
          target_user_id: string
        }
        Returns: Json
      }
    }
  }
}
