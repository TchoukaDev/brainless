import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '#/lib/supabase'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'

export const Route = createFileRoute('/login')({
    component: LoginPage,
})

function LoginPage() {
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        const { error: signInError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
        if (signInError) {
            setError(signInError.message)
        } else {
            setSent(true)
        }
        setLoading(false)
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-8">
            <div className="w-full max-w-sm flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold">Brainless</h1>
                    <p className="text-sm text-muted-foreground mt-1">Gestionnaire d'abonnements</p>
                </div>
                {sent ? (
                    <p className="text-sm text-muted-foreground">
                        Lien envoyé à <strong>{email}</strong>. Vérifie ta boîte mail.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <Input
                            type="email"
                            placeholder="ton@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Envoi…' : 'Recevoir un lien magique'}
                        </Button>
                    </form>
                )}
            </div>
        </main>
    )
}
