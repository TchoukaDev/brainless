import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useSession } from '#/providers/SessionProvider'

export const Route = createFileRoute('/_protected')({
    component: ProtectedLayout,
})

function ProtectedLayout() {
    const { session, loading } = useSession()
    const navigate = useNavigate()

    useEffect(() => {
        if (!loading && !session) navigate({ to: '/login' })
    }, [session, loading])

    if (loading || !session) return null

    return <Outlet />
}
