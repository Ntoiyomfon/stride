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
      user_profiles: {
        Row: {
          id: string
          name: string | null
          email: string
          profile_picture_data: string | null
          profile_picture_updated_at: string | null
          theme: 'light' | 'dark' | 'system'
          accent_color: 'red' | 'blue' | 'green' | 'yellow' | 'gray' | 'pink'
          notifications: Json
          two_factor_enabled: boolean
          two_factor_backup_codes: string[]
          auth_providers: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          profile_picture_data?: string | null
          profile_picture_updated_at?: string | null
          theme?: 'light' | 'dark' | 'system'
          accent_color?: 'red' | 'blue' | 'green' | 'yellow' | 'gray' | 'pink'
          notifications?: Json
          two_factor_enabled?: boolean
          two_factor_backup_codes?: string[]
          auth_providers?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          profile_picture_data?: string | null
          profile_picture_updated_at?: string | null
          theme?: 'light' | 'dark' | 'system'
          accent_color?: 'red' | 'blue' | 'green' | 'yellow' | 'gray' | 'pink'
          notifications?: Json
          two_factor_enabled?: boolean
          two_factor_backup_codes?: string[]
          auth_providers?: Json
          created_at?: string
          updated_at?: string
        }
      }
      boards: {
        Row: {
          id: string
          name: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      columns: {
        Row: {
          id: string
          name: string
          board_id: string
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          board_id: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          board_id?: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      job_applications: {
        Row: {
          id: string
          company: string
          position: string
          location: string | null
          status: string | null
          column_id: string
          board_id: string
          user_id: string
          order_index: number
          notes: string | null
          salary: string | null
          job_url: string | null
          applied_date: string | null
          tags: string[]
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company: string
          position: string
          location?: string | null
          status?: string | null
          column_id: string
          board_id: string
          user_id: string
          order_index?: number
          notes?: string | null
          salary?: string | null
          job_url?: string | null
          applied_date?: string | null
          tags?: string[]
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company?: string
          position?: string
          location?: string | null
          status?: string | null
          column_id?: string
          board_id?: string
          user_id?: string
          order_index?: number
          notes?: string | null
          salary?: string | null
          job_url?: string | null
          applied_date?: string | null
          tags?: string[]
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          session_id: string
          user_id: string
          ip_address: string
          user_agent: string
          browser: string | null
          os: string | null
          device_type: string | null
          location: Json
          created_at: string
          last_active_at: string
          is_revoked: boolean
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          ip_address: string
          user_agent: string
          browser?: string | null
          os?: string | null
          device_type?: string | null
          location?: Json
          created_at?: string
          last_active_at?: string
          is_revoked?: boolean
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          ip_address?: string
          user_agent?: string
          browser?: string | null
          os?: string | null
          device_type?: string | null
          location?: Json
          created_at?: string
          last_active_at?: string
          is_revoked?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_sessions: {
        Args: {}
        Returns: number
      }
      update_session_activity: {
        Args: {
          session_id_param: string
        }
        Returns: boolean
      }
      revoke_session: {
        Args: {
          session_id_param: string
          user_id_param: string
        }
        Returns: boolean
      }
      revoke_all_other_sessions: {
        Args: {
          current_session_id: string
          user_id_param: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}