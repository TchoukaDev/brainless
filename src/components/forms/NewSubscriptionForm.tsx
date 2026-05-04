import { toast } from "react-toastify"
import type { Tables } from "#/lib/database.types"
import { useAddSubscription } from "#/lib/queries"
import type { NewSubscriptionFormData } from "#/lib/zodSchema"
import SubscriptionForm from "./SubscriptionForm"

interface NewSubscriptionFormProps {
    accounts: Tables<"accounts">[]
    selectedAccountId: number | undefined
    onSuccess: () => void
}

export default function NewSubscriptionForm({ accounts, selectedAccountId, onSuccess }: NewSubscriptionFormProps) {
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
            onSuccess()
        } catch {
            toast.error("Erreur lors de l'ajout de l'abonnement")
        }
    }

    return (
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
    )
}
