import { Link } from "@tanstack/react-router"
import type { Tables } from "#/lib/database.types"

interface SubscriptionListProps {
    subscriptions: Tables<"subscriptions">[]
}

export default function SubscriptionList({ subscriptions }: SubscriptionListProps) {
    return (
        <div className="rounded-md border overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-2 bg-muted text-sm font-medium text-muted-foreground">
                <span>Nom</span>
                <span>Montant</span>
                <span>Cycle</span>
                <span>Prochaine facturation</span>
                <span>Renouvellement</span>
                <span>Notes</span>
            </div>
            {subscriptions.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">Aucun abonnement</p>
            ) : (
                subscriptions.map((s, i) => (
                    <div
                        key={s.id}
                        className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-4 py-3 text-sm items-center ${i % 2 === 0 ? "bg-background" : "bg-muted/40"}`}
                    >
                        <Link to="/subscriptions/$id" params={{ id: String(s.id) }} className="font-medium hover:underline">{s.name}</Link>
                        <span>{s.amount} {s.currency}</span>
                        <span>{s.billing_cycle ? `${s.billing_cycle} mois` : "—"}</span>
                        <span>{s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString("fr-FR") : "—"}</span>
                        <span>{s.auto_renewal ? "Oui" : "Non"}</span>
                        <span className="text-muted-foreground truncate">{s.notes || "—"}</span>
                    </div>
                ))
            )}
        </div>
    )
}
