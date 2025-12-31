'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabase, supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Check for active session
                const { data: { session } } = await getSupabase().auth.getSession()
                setSession(session)
                setUser(session?.user ?? null)
            } catch (error) {
                console.error('Error checking auth session:', error)
            } finally {
                setLoading(false)
            }

            // Listen for auth changes
            const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
                setLoading(false)
            })

            return () => subscription.unsubscribe()
        }

        initializeAuth()
    }, [])

    const signOut = async () => {
        await getSupabase().auth.signOut()
        router.push('/login')
    }

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}
