import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSupabase() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test the connection by getting the current user
        const { error } = await supabase.auth.getUser()
        
        if (error && error.message !== 'Auth session missing!') {
          throw error
        }
        
        setIsConnected(true)
        setError(null)
      } catch (err) {
        console.error('Supabase connection error:', err)
        setError(err instanceof Error ? err.message : 'Connection failed')
        setIsConnected(false)
      }
    }

    testConnection()
  }, [])

  return { isConnected, error }
}
