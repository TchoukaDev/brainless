import { useNavigate } from "@tanstack/react-router"
import { supabase } from "#/lib/supabase"
import { useSession } from "#/providers/SessionProvider"
import { queryClient } from "#/routes/__root"
import { Button } from "#/components/ui/button"

export default function AuthButton() {
    const { session } = useSession()
    const navigate = useNavigate()

    if (!session) return null

    async function handleLogout() {
        await supabase.auth.signOut()
        queryClient.clear()
        navigate({ to: '/login' })
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:block">{session.user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>Se déconnecter</Button>
        </div>
    )
}
