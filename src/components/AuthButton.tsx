import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { supabase } from "#/lib/supabase"
import { useSession } from "#/providers/SessionProvider"
import { queryClient } from "#/routes/__root"
import { Button } from "#/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "#/components/ui/dialog"
import { Input } from "#/components/ui/input"

export default function AuthButton() {
    const session = useSession()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState("")
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
        if (error) {
            setError(error.message)
        } else {
            setSent(true)
        }
        setLoading(false)
    }

    function handleOpenChange(open: boolean) {
        setOpen(open)
        if (!open) { setSent(false); setEmail(""); setError(null) }
    }

    if (session) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden md:block">{session.user.email}</span>
                <Button variant="outline" size="sm" onClick={async () => { await supabase.auth.signOut(); queryClient.clear(); navigate({ to: '/', search: {} }) }}>Se déconnecter</Button>
            </div>
        )
    }

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Se connecter</Button>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connexion</DialogTitle>
                    </DialogHeader>
                    {sent ? (
                        <p className="text-sm text-muted-foreground">Lien envoyé à <strong>{email}</strong>. Vérifie ta boîte mail.</p>
                    ) : (
                        <form onSubmit={handleLogin} className="flex flex-col gap-4">
                            <Input
                                type="email"
                                placeholder="ton@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <Button type="submit" disabled={loading}>
                                {loading ? "Envoi…" : "Recevoir un lien magique"}
                            </Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
