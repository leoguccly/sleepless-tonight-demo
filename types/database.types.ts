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
          display_name: string | null
          avatar_url: string | null
          timezone: string
          notification_enabled: boolean
          notification_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          notification_enabled?: boolean
          notification_time?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          notification_enabled?: boolean
          notification_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      partners: {
        Row: {
          id: string
          user_id: string
          nickname: string
          notes: string | null
          color_tag: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nickname: string
          notes?: string | null
          color_tag?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nickname?: string
          notes?: string | null
          color_tag?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          activity_mode: 'partner' | 'solo'
          partner_id: string | null
          activity_date: string
          activity_time: string | null
          duration_minutes: number | null
          satisfaction_score: number
          emotion_tags: string[]
          encrypted_note: string | null
          encryption_key_id: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_mode: 'partner' | 'solo'
          partner_id?: string | null
          activity_date: string
          activity_time?: string | null
          duration_minutes?: number | null
          satisfaction_score: number
          emotion_tags?: string[]
          encrypted_note?: string | null
          encryption_key_id?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_mode?: 'partner' | 'solo'
          partner_id?: string | null
          activity_date?: string
          activity_time?: string | null
          duration_minutes?: number | null
          satisfaction_score?: number
          emotion_tags?: string[]
          encrypted_note?: string | null
          encryption_key_id?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category: 'toy' | 'lubricant' | 'wellness' | 'book' | 'other'
          price: number
          stock_quantity: number
          image_urls: string[]
          external_url: string | null
          average_rating: number
          reviews_count: number
          is_published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: 'toy' | 'lubricant' | 'wellness' | 'book' | 'other'
          price: number
          stock_quantity?: number
          image_urls?: string[]
          external_url?: string | null
          average_rating?: number
          reviews_count?: number
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: 'toy' | 'lubricant' | 'wellness' | 'book' | 'other'
          price?: number
          stock_quantity?: number
          image_urls?: string[]
          external_url?: string | null
          average_rating?: number
          reviews_count?: number
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      toy_box: {
        Row: {
          id: string
          user_id: string
          product_id: string | null
          custom_name: string
          category: 'toy' | 'lubricant' | 'wellness' | 'other'
          purchase_date: string | null
          usage_count: number
          last_used_at: string | null
          is_hidden: boolean
          notes: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id?: string | null
          custom_name: string
          category: 'toy' | 'lubricant' | 'wellness' | 'other'
          purchase_date?: string | null
          usage_count?: number
          last_used_at?: string | null
          is_hidden?: boolean
          notes?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string | null
          custom_name?: string
          category?: 'toy' | 'lubricant' | 'wellness' | 'other'
          purchase_date?: string | null
          usage_count?: number
          last_used_at?: string | null
          is_hidden?: boolean
          notes?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
