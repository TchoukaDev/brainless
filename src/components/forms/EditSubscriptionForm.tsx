import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { toast } from "react-toastify"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group"
import { Label } from "#/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover"
import { Calendar } from "#/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select"
import { Field, FieldLabel } from "#/components/ui/field"
import { DialogClose, DialogFooter } from "#/components/ui/dialog"
import { newSubscriptionSchema } from "#/lib/zodSchema"
import type { NewSubscriptionFormData } from "#/lib/zodSchema"
import type { Tables } from "#/lib/database.types"
import { accountsQuery, useUpdateSubscription } from "#/lib/queries"

interface EditSubscriptionFormProps {
    subscription: Tables<"subscriptions">
    onSuccess: () => void
}

export default function EditSubscriptionForm({ subscription, onSuccess }: EditSubscriptionFormProps) {
    const [calendarOpen, setCalendarOpen] = useState(false)
    const { data: accounts } = useSuspenseQuery(accountsQuery)
    const { mutateAsync: updateSubscription } = useUpdateSubscription()

    const { register, handleSubmit, control, formState: { errors } } = useForm<NewSubscriptionFormData>({
        defaultValues: {
            account_id: subscription.account_id,
            name: subscription.name,
            amount: subscription.amount,
            currency: subscription.currency as "EUR" | "USD" | "GBP" | "CHF",
            nextBillingDate: subscription.next_billing_date ? new Date(subscription.next_billing_date) : undefined,
            autoRenewal: subscription.auto_renewal,
            billingCycle: subscription.billing_cycle ?? 1,
            notifications: subscription.notifications,
            notes: subscription.notes ?? "",
        },
        resolver: zodResolver(newSubscriptionSchema),
    })

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
            onSuccess()
        } catch {
            toast.error("Erreur lors de la modification")
        }
    }

    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <Field>
                <FieldLabel htmlFor="account_id">Compte</FieldLabel>
                <Controller
                    control={control}
                    name="account_id"
                    render={({ field }) => (
                        <Select value={field.value ? String(field.value) : ""} onValueChange={v => field.onChange(Number(v))}>
                            <SelectTrigger id="account_id">
                                <SelectValue placeholder="Choisir un compte" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map(account => (
                                    <SelectItem key={account.id} value={String(account.id)}>{account.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.account_id && <p className="text-sm text-destructive">{errors.account_id.message}</p>}
            </Field>

            <Field>
                <FieldLabel htmlFor="name">Nom</FieldLabel>
                <Input id="name" {...register("name")} placeholder="Netflix, Spotify…" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </Field>

            <div className="flex gap-3">
                <Field className="flex-1">
                    <FieldLabel htmlFor="amount">Montant</FieldLabel>
                    <Input id="amount" {...register("amount", { valueAsNumber: true })} type="number" placeholder="9.99" />
                    {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                </Field>
                <Field className="w-28">
                    <FieldLabel htmlFor="currency">Devise</FieldLabel>
                    <Controller
                        control={control}
                        name="currency"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger id="currency">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                    <SelectItem value="CHF">CHF</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </Field>
            </div>

            <Field>
                <FieldLabel htmlFor="next_billing_date">Prochaine facturation</FieldLabel>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Controller
                            control={control}
                            name="nextBillingDate"
                            render={({ field }) => (
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? field.value.toLocaleDateString('fr-FR') : "Choisir une date"}
                                </Button>
                            )}
                        />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Controller
                            control={control}
                            name="nextBillingDate"
                            render={({ field }) => (
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    defaultMonth={field.value}
                                    captionLayout="dropdown"
                                    onSelect={(d) => { field.onChange(d); setCalendarOpen(false) }}
                                />
                            )}
                        />
                    </PopoverContent>
                </Popover>
                {errors.nextBillingDate && <p className="text-sm text-destructive">{errors.nextBillingDate.message}</p>}
            </Field>

            <Field>
                <FieldLabel htmlFor="billing_cycle">Cycle de facturation</FieldLabel>
                <div className="flex items-center gap-2">
                    <Input id="billing_cycle" {...register("billingCycle", { valueAsNumber: true })} type="number" min="1" placeholder="1" className="w-24" />
                    <span className="text-sm text-muted-foreground">mois</span>
                </div>
                {errors.billingCycle && <p className="text-sm text-destructive">{errors.billingCycle.message}</p>}
            </Field>

            <Field>
                <FieldLabel>Renouvellement automatique</FieldLabel>
                <Controller
                    control={control}
                    name="autoRenewal"
                    render={({ field }) => (
                        <RadioGroup value={String(field.value)} onValueChange={v => field.onChange(v === "true")} className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <RadioGroupItem id="renewal-yes" value="true" />
                                <Label htmlFor="renewal-yes">Oui</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem id="renewal-no" value="false" />
                                <Label htmlFor="renewal-no">Non</Label>
                            </div>
                        </RadioGroup>
                    )}
                />
            </Field>

            <Field>
                <FieldLabel>Notifications</FieldLabel>
                <Controller
                    control={control}
                    name="notifications"
                    render={({ field }) => (
                        <RadioGroup value={String(field.value)} onValueChange={v => field.onChange(v === "true")} className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <RadioGroupItem id="notif-yes" value="true" />
                                <Label htmlFor="notif-yes">Activées</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem id="notif-no" value="false" />
                                <Label htmlFor="notif-no">Désactivées</Label>
                            </div>
                        </RadioGroup>
                    )}
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="notes">Notes</FieldLabel>
                <Input id="notes" {...register("notes")} placeholder="Informations complémentaires" />
            </Field>

            <DialogFooter className="mt-2">
                <DialogClose asChild>
                    <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button type="submit">Modifier</Button>
            </DialogFooter>
        </form>
    )
}
