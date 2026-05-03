# Brainless — Subscription Manager

## Rôle de Claude sur ce projet

- **Mode guidage par défaut** : expliquer les concepts, proposer des approches, décrire ce qu'il faudra faire — sans coder
- **Coder uniquement si demande explicite** : "code ça", "implémente", "écris le fichier", etc.
- L'utilisateur vient de Next.js et découvre TanStack Start : toujours expliquer les équivalences Next.js ↔ TanStack Start quand on aborde un nouveau concept
- Avant toute tâche complexe (> 2 fichiers) : proposer un plan et attendre validation
- Ne jamais installer une dépendance sans demande explicite (ex: `vite-plugin-pwa`, `zod`)

## What this app does
Personal subscription/recurring payment manager.  
Features: add/edit/delete subscriptions, sorting, PWA + notifications on billing due dates.

## Stack
- **Framework**: TanStack Start (`@tanstack/react-start`) + TanStack Router (file-based routing)
- **Database**: Supabase (PostgreSQL) via **Supabase JS client** (`@supabase/supabase-js`) — typed with generated `database.types.ts`
- **Data fetching / mutations**: TanStack Query (`@tanstack/react-query`) — `useSuspenseQuery`, `useMutation` avec optimistic updates
- **Forms**: React Hook Form + Zod (`@hookform/resolvers`)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Runtime**: Nitro (via Vite)
- **Auth**: out of scope for now (Better Auth scaffolded but unused)

## TanStack Start vs Next.js mental model

| Next.js (App Router) | TanStack Start |
|---|---|
| `app/page.tsx` | `src/routes/index.tsx` |
| `app/layout.tsx` | `src/routes/__root.tsx` |
| Server Actions | `createServerFn` |
| `fetch` in RSC | `loader` in route file |
| `useRouter().push()` | `useNavigate()` from `@tanstack/react-router` |
| `[id]/page.tsx` | `routes/subscriptions/$id.tsx` |
| API routes | `routes/api/foo.ts` with `server.handlers` |

A route file has 3 concerns:
1. `loader` — server-side data fetch before render
2. server functions (`createServerFn`) — mutations called from event handlers
3. `Route.useLoaderData()` — typed access to loader data on the client

**Avec TanStack Query (pattern actuel du projet)** : le `loader` appelle `queryClient.ensureQueryData(query)` pour pré-remplir le cache, puis les composants utilisent `useSuspenseQuery(query)`. Les mutations passent par `useMutation` avec `queryClient.invalidateQueries` dans `onSettled`.

After a mutation: call `router.invalidate()` to re-run the loader (equivalent to `router.refresh()` in Next.js) — **ou** `queryClient.invalidateQueries` si on utilise TanStack Query.

## Database

Client Supabase typé : `src/lib/supabase.ts` — `createClient<Database>(URL, KEY)`  
Types générés : `src/lib/database.types.ts` — régénérer avec `npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts`

Requêtes et hooks centralisés : `src/lib/queries.ts`  
- `accountsQuery`, `subscriptionsQuery` — objets `{ queryKey, queryFn }` réutilisables
- `useAddSubscription`, `useUpdateSubscription`, `useDeleteSubscription` — mutations avec optimistic updates

### Subscriptions table (implémentée)
```
id, account_id, name, amount, currency, billing_cycle, next_billing_date, auto_renewal, notifications, notes, isActive, created_at, updated_at
```

Types utilitaires Supabase :
- `Tables<"subscriptions">` → Row (lecture, cache TanStack Query)
- `TablesInsert<"subscriptions">` → Insert (sans champs auto-générés)
- `TablesUpdate<"subscriptions"> & { id: number }` → Update (tous optionnels sauf id)

## Route structure
```
src/routes/
├── __root.tsx          root layout — QueryClientProvider, Suspense, LoadingBar
├── index.tsx           Dashboard — AccountSelect, liste abonnements filtrés par compte
│                       search params : ?accountId=<number>
└── subscriptions/
    └── $id.tsx         Détail abonnement (edit/delete — à implémenter)
```

## Sorting strategy
Use URL search params via TanStack Router's `validateSearch` (with zod).  
Keeps sort state in the URL — shareable, no extra state management.

## PWA & Notifications strategy
- Start with **local notifications** (Notification API, scheduled on app open)
- Check subscriptions due in ≤7 days, fire browser notifications
- Later: upgrade to full Push API with service worker if needed
- `vite-plugin-pwa` for PWA manifest + SW registration — ask before installing

## Build order
1. ✅ Supabase connection + schema + types générés
2. ✅ Dashboard list view (TanStack Query + `useSuspenseQuery`)
3. ✅ Add form (RHF + Zod + `useAddSubscription` avec optimistic update)
4. ✅ Delete (`useDeleteSubscription` avec optimistic update)
5. ✅ Update (`useUpdateSubscription` avec optimistic update)
6. ⬜ Edit form dans `$id.tsx`
7. ⬜ Sorting via URL search params
8. ⬜ PWA + local notifications

## Dev commands
```
npm run dev          # dev server on port 3000
npm run build        # production build
```
