// TODO: Re-enable Supabase integration when dependency is properly installed
// import { createClient } from '@supabase/supabase-js'
// import { SUPABASE_CONFIG } from '../config/supabase'

// export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)

// Mock Supabase client for now
export const supabase = {
  auth: {
    getUser: () => Promise.resolve({ data: null, error: null })
  }
} as any

// Database types (we'll generate these later with Supabase CLI)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          phone: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string
          created_at?: string
          updated_at?: string
        }
      }
      shuttle_requests: {
        Row: {
          id: string
          user_id: string
          parking_location_name: string
          parking_lat: number | null
          parking_lng: number | null
          dropoff_location_name: string
          dropoff_lat: number | null
          dropoff_lng: number | null
          dropoff_day: string
          arrival_time: string
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parking_location_name: string
          parking_lat?: number | null
          parking_lng?: number | null
          dropoff_location_name: string
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_day: string
          arrival_time: string
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          parking_location_name?: string
          parking_lat?: number | null
          parking_lng?: number | null
          dropoff_location_name?: string
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_day?: string
          arrival_time?: string
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          shuttle_request_id: string
          make: string
          model: string
          year: string
          transmission: 'automatic' | 'manual'
          created_at: string
        }
        Insert: {
          id?: string
          shuttle_request_id: string
          make: string
          model: string
          year: string
          transmission: 'automatic' | 'manual'
          created_at?: string
        }
        Update: {
          id?: string
          shuttle_request_id?: string
          make?: string
          model?: string
          year?: string
          transmission?: 'automatic' | 'manual'
          created_at?: string
        }
      }
    }
  }
}