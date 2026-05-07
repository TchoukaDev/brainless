import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '#/lib/supabase'

const SessionContext = createContext<Session | null>(null)

export function useSession() {
    return useContext(SessionContext)
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session))
        return () => subscription.unsubscribe()
    }, [])

    return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
