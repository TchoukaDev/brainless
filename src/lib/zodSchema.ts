import { z } from "zod"

export const newSubscriptionSchema = z.object({
    account_id: z.number({ error: "Veuillez choisir un compte" }).min(1, "Veuillez choisir un compte"),
    name: z.string().min(1, "Le nom est requis"),
    amount: z.number({ error: "Montant invalide" }).min(0, "Le montant doit être positif"),
    currency: z.enum(["EUR", "USD", "GBP", "CHF"]),
    nextBillingDate: z.date({ error: "Date invalide" }).optional(),
    autoRenewal: z.boolean(),
    billingCycle: z.number({ error: "Cycle invalide" }).min(1, "Minimum 1 mois"),
    notifications: z.boolean(),
    notes: z.string().optional(),
})

export type NewSubscriptionFormData = z.infer<typeof newSubscriptionSchema>
