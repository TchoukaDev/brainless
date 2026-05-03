import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { subscriptionsQuery } from '#/lib/queries'
import { queryClient } from '../__root'

export const Route = createFileRoute('/subscriptions/$id')({
    loader: async () => {
        await queryClient.ensureQueryData(subscriptionsQuery)
    },
    component: SubscriptionDetail,
})

function SubscriptionDetail() {
    const { id } = Route.useParams()
    const { data: subscriptions } = useSuspenseQuery(subscriptionsQuery)
    const subscription = subscriptions.find(s => s.id === Number(id))

    if (!subscription) return <p className="p-8 text-muted-foreground">Abonnement introuvable.</p>

    return (
        <main className="p-8">
            <h1 className="text-2xl font-bold">{subscription.name}</h1>
        </main>
    )
}
