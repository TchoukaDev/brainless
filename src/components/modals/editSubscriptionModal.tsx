import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import type { Tables } from "#/lib/database.types"
import EditSubscriptionForm from "#/components/forms/EditSubscriptionForm"

interface EditSubscriptionModalProps {
    isOpen: boolean
    onClose: () => void
    subscription: Tables<"subscriptions">
}

export default function EditSubscriptionModal({ isOpen, onClose, subscription }: EditSubscriptionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Modifier l'abonnement</DialogTitle>
                </DialogHeader>
                <EditSubscriptionForm subscription={subscription} onSuccess={onClose} />
            </DialogContent>
        </Dialog>
    )
}
