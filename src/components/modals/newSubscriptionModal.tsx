import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import type { Tables } from "#/lib/database.types"
import NewSubscriptionForm from "#/components/forms/NewSubscriptionForm"

interface NewSubscriptionModalProps {
    isOpen: boolean
    onClose: () => void
    selectedAccountId: number | undefined
    accounts: Tables<"accounts">[]
}

export default function NewSubscriptionModal({ isOpen, onClose, selectedAccountId, accounts }: NewSubscriptionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Ajouter un abonnement</DialogTitle>
                </DialogHeader>
                <NewSubscriptionForm
                    accounts={accounts}
                    selectedAccountId={selectedAccountId}
                    onSuccess={onClose}
                />
            </DialogContent>
        </Dialog>
    )
}
