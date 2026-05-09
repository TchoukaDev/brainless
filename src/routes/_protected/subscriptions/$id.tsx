import { createFileRoute, notFound, Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { accountsQuery, subscriptionsQuery, useDeleteSubscription } from '#/lib/queries'
import { queryClient } from '#/routes/__root'
import { Button } from '#/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import EditSubscriptionModal from '#/components/modals/editSubscriptionModal'

export const Route = createFileRoute('/_protected/subscriptions/$id')({
    loader: async ({ params }) => {
        const [subscriptions] = await Promise.all([
            queryClient.ensureQueryData(subscriptionsQuery),
            queryClient.ensureQueryData(accountsQuery),
        ])
        if (!subscriptions.find(s => s.id === Number(params.id))) throw notFound()
    },
    notFoundComponent: () => (
        <main className="p-8">
            <p className="text-muted-foreground">Abonnement introuvable.</p>
        </main>
    ),
    component: SubscriptionDetail,
})

function SubscriptionDetail() {
    const { id } = Route.useParams()
    const { data: subscriptions } = useSuspenseQuery(subscriptionsQuery)
    const subscription = subscriptions.find(s => s.id === Number(id))!

    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const navigate = useNavigate()
    const { mutateAsync: deleteSubscription, isPending } = useDeleteSubscription()

    const handleDelete = async () => {
        navigate({ to: '/', search: { accountId: subscription.account_id } })
        try {
            await deleteSubscription(subscription.id)
            toast.success("Abonnement supprimé")
        } catch {
            toast.error("Erreur lors de la suppression")
        }
    }

    return (
        <main className="p-8 flex flex-col gap-6 max-w-2xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/" search={{ accountId: subscription.account_id }} className="text-sm text-muted-foreground hover:text-foreground">← Retour</Link>
                    <h1 className="text-2xl font-bold">{subscription.name}</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditOpen(true)}>Modifier</Button>
                    <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Supprimer</Button>
                </div>
            </div>

            <div className="rounded-md border divide-y">
                <Row label="Montant" value={`${subscription.amount} ${subscription.currency}`} />
                <Row label="Cycle" value={subscription.billing_cycle ? `${subscription.billing_cycle} mois` : "—"} />
                <Row label="Prochaine facturation" value={subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString("fr-FR") : "—"} />
                <Row label="Renouvellement automatique" value={subscription.auto_renewal ? "Oui" : "Non"} />
                <Row label="Notifications" value={subscription.notifications ? "Activées" : "Désactivées"} />
                {subscription.notes && <Row label="Notes" value={subscription.notes} />}
            </div>

            <EditSubscriptionModal isOpen={editOpen} onClose={() => setEditOpen(false)} subscription={subscription} />

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer l'abonnement</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Êtes-vous sûr de vouloir supprimer <span className="font-medium text-foreground">"{subscription.name}"</span> ? Cette action est irréversible.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>Annuler</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                            {isPending ? "Suppression..." : "Supprimer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    )
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span>{value}</span>
        </div>
    )
}
