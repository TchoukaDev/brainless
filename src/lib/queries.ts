import { supabase } from "./supabase"
import type { Tables, TablesInsert, TablesUpdate } from "./database.types"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export const accountsQuery = {
    queryKey: ["accounts"],
    queryFn: async () => {
        const { data } = await supabase.from("accounts").select("*")
        return data ?? []
    },
}

export const subscriptionsQuery = {
    queryKey: ["subscriptions"],
    queryFn: async () => {
        const { data } = await supabase.from("subscriptions").select("*")
        return data ?? []
    },
}


export function useUpdateSubscription() {
    const queryClient = useQueryClient()
    return useMutation({
        // id obligatoire pour le .eq(), les autres champs sont optionnels (on peut n'en patcher qu'un)
        mutationFn: async (subscription: TablesUpdate<"subscriptions"> & { id: number }) => {
            await supabase.from("subscriptions").update(subscription).eq("id", subscription.id)
        },
        onMutate: async (subscription) => {
            await queryClient.cancelQueries({ queryKey: subscriptionsQuery.queryKey })
            const previousSubscriptions = queryClient.getQueryData<Tables<"subscriptions">[]>(subscriptionsQuery.queryKey)
            queryClient.setQueryData(subscriptionsQuery.queryKey, (old: Tables<"subscriptions">[] | undefined) => old?.map(s => s.id === subscription.id ? { ...s, ...subscription } : s) ?? [])
            return { previousSubscriptions }
        },
        onError: (_error, _subscription, context) => {
            queryClient.setQueryData(subscriptionsQuery.queryKey, context?.previousSubscriptions)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionsQuery.queryKey })
        },
    })
}

export function useDeleteSubscription() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: number) => {
            await supabase.from("subscriptions").delete().eq("id", id)
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: subscriptionsQuery.queryKey })
            const previousSubscriptions = queryClient.getQueryData<Tables<"subscriptions">[]>(subscriptionsQuery.queryKey)
            queryClient.setQueryData(subscriptionsQuery.queryKey, (old: Tables<"subscriptions">[] | undefined) => old?.filter(s => s.id !== id) ?? [])
            return { previousSubscriptions }
        },
        onError: (_error, _id, context) => {
            queryClient.setQueryData(subscriptionsQuery.queryKey, context?.previousSubscriptions)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionsQuery.queryKey })
        },
    })
}

export function useAddSubscription() {
    const queryClient = useQueryClient()
    return useMutation({
        // TablesInsert : type pour l'insertion — sans les champs générés par la DB (id, created_at, updated_at)
        mutationFn: async (subscription: TablesInsert<"subscriptions">) => {
            const { data } = await supabase.from("subscriptions").insert(subscription).select().single()
            return data
        },
        onMutate: async (subscription) => {
            // Annule les refetch en cours pour éviter qu'ils écrasent l'update optimiste
            await queryClient.cancelQueries({ queryKey: subscriptionsQuery.queryKey })
            const previousSubscriptions = queryClient.getQueryData<Tables<"subscriptions">[]>(subscriptionsQuery.queryKey)
            queryClient.setQueryData(subscriptionsQuery.queryKey, (old: Tables<"subscriptions">[] | undefined) => [
                ...(old ?? []),
                // id temporaire négatif — unique et impossible à confondre avec un vrai id DB
                // remplacé par le vrai id lors du onSettled qui invalide et refetch
                { ...subscription, id: -Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), isActive: true },
            ])
            return { previousSubscriptions }
        },
        onError: (_error, _subscription, context) => {
            // Rollback : on remet le cache dans l'état précédent si Supabase échoue
            queryClient.setQueryData(subscriptionsQuery.queryKey, context?.previousSubscriptions)
        },
        onSettled: () => {
            // Qu'il y ait eu erreur ou succès, on resync avec la DB pour avoir le vrai id
            queryClient.invalidateQueries({ queryKey: subscriptionsQuery.queryKey })
        },
    })
}
