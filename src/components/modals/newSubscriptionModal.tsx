import { toast } from "react-toastify"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import type { Tables } from "#/lib/database.types"
import { useAddSubscription } from "#/lib/queries"
import type { NewSubscriptionFormData } from "#/lib/zodSchema"
import SubscriptionForm from "#/components/forms/SubscriptionForm"
import { isPostgrestError } from "#/lib/utils"

interface NewSubscriptionModalProps {
    isOpen: boolean
    onClose: () => void
    selectedAccountId: number | undefined
    accounts: Tables<"accounts">[]
}

export default function NewSubscriptionModal({ isOpen, onClose, selectedAccountId, accounts }: NewSubscriptionModalProps) {
    const { mutateAsync } = useAddSubscription()

    const onSubmit = async (data: NewSubscriptionFormData) => {
        try {
            await mutateAsync({
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
            toast.success("Abonnement ajouté")
            onClose()
        } catch (err) {
            if (isPostgrestError(err) && err.code === '23505') {
                toast.error("Un abonnement avec ce nom existe déjà pour ce compte")
            } else {
                toast.error("Erreur lors de l'ajout de l'abonnement")
            }
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Ajouter un abonnement</DialogTitle>
                </DialogHeader>
                <SubscriptionForm
                    accounts={accounts}
                    defaultValues={{
                        account_id: selectedAccountId ?? 0,
                        name: "",
                        amount: 0,
                        currency: "EUR",
                        nextBillingDate: undefined,
                        autoRenewal: false,
                        billingCycle: 1,
                        notifications: true,
                        notes: "",
                    }}
                    onSubmit={onSubmit}
                    submitLabel="Ajouter"
                />
            </DialogContent>
        </Dialog>
    )
}
