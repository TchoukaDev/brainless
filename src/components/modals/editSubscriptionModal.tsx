import { toast } from "react-toastify"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import type { Tables } from "#/lib/database.types"
import { accountsQuery, useUpdateSubscription } from "#/lib/queries"
import type { NewSubscriptionFormData } from "#/lib/zodSchema"
import SubscriptionForm from "#/components/forms/SubscriptionForm"
import { isPostgrestError } from "#/lib/utils"

interface EditSubscriptionModalProps {
    isOpen: boolean
    onClose: () => void
    subscription: Tables<"subscriptions">
}

export default function EditSubscriptionModal({ isOpen, onClose, subscription }: EditSubscriptionModalProps) {
    const { data: accounts } = useSuspenseQuery(accountsQuery)
    const { mutateAsync: updateSubscription } = useUpdateSubscription()

    const onSubmit = async (data: NewSubscriptionFormData) => {
        try {
            await updateSubscription({
                id: subscription.id,
                account_id: data.account_id,
                name: data.name,
                amount: data.amount,
                currency: data.currency,
                next_billing_date: data.nextBillingDate?.toISOString() ?? null,
                auto_renewal: data.autoRenewal,
                billing_cycle: data.billingCycle,
                notifications: data.notifications,
                notes: data.notes ?? null,
            })
            toast.success("Abonnement modifié")
            onClose()
        } catch (err) {
            if (isPostgrestError(err) && err.code === '23505') {
                toast.error("Un abonnement avec ce nom existe déjà pour ce compte")
            } else {
                toast.error("Erreur lors de la modification")
            }
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Modifier l'abonnement</DialogTitle>
                </DialogHeader>
                <SubscriptionForm
                    accounts={accounts}
                    defaultValues={{
                        account_id: subscription.account_id,
                        name: subscription.name,
                        amount: subscription.amount,
                        currency: subscription.currency as "EUR" | "USD" | "GBP" | "CHF",
                        nextBillingDate: subscription.next_billing_date ? new Date(subscription.next_billing_date) : undefined,
                        autoRenewal: subscription.auto_renewal,
                        billingCycle: subscription.billing_cycle ?? 1,
                        notifications: subscription.notifications,
                        notes: subscription.notes ?? "",
                    }}
                    onSubmit={onSubmit}
                    submitLabel="Modifier"
                />
            </DialogContent>
        </Dialog>
    )
}
