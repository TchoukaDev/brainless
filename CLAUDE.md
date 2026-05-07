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
- **Auth**: Supabase Auth — magic link (`signInWithOtp`), session gérée via `SessionProvider` (React Context)

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

## Auth

- Supabase Auth magic link via `supabase.auth.signInWithOtp({ email })`
- Session exposée via `useSession()` — React Context dans `src/providers/SessionProvider.tsx`
- `SessionProvider` wraps l'app dans `__root.tsx` (à l'intérieur de `QueryClientProvider`)
- À la déconnexion : `supabase.auth.signOut()` + `queryClient.clear()` + navigate `{ to: '/', search: {} }`
- **Piège SSR** : ne jamais conditionner le rendu (structure JSX) sur `isFetching`/`isRefetching` dans un composant SSR — TanStack Query peut avoir ces flags à `true` côté serveur (staleTime=0), causant un hydration mismatch. Utiliser uniquement `session` (null côté serveur, stable à l'hydratation).

## Database

Client Supabase typé : `src/lib/supabase.ts` — `createClient<Database>(URL, KEY)`  
Types générés : `src/lib/database.types.ts` — régénérer avec `npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts`

Requêtes et hooks centralisés : `src/lib/queries.ts`  
- `accountsQuery`, `subscriptionsQuery` — objets `{ queryKey, queryFn }` réutilisables
- `useAddSubscription`, `useUpdateSubscription`, `useDeleteSubscription` — mutations avec optimistic updates

### Tables (Supabase)

**subscriptions**
```
id, account_id, name, amount, currency, billing_cycle, next_billing_date, auto_renewal, notifications, notes, isActive, created_at, updated_at
```

**account_users** (liaison users ↔ accounts, gérée manuellement dans le dashboard)
```
user_id uuid PK (FK → auth.users), account_id int8 PK (FK → accounts), role text default 'owner'
```
PK composite `(user_id, account_id)`.

**RLS activé** sur `accounts`, `subscriptions`, `account_users`.  
Policy pattern : `account_id in (select account_id from account_users where user_id = auth.uid())`

Types utilitaires Supabase :
- `Tables<"subscriptions">` → Row (lecture, cache TanStack Query)
- `TablesInsert<"subscriptions">` → Insert (sans champs auto-générés)
- `TablesUpdate<"subscriptions"> & { id: number }` → Update (tous optionnels sauf id)

## Route structure
```
src/routes/
├── __root.tsx          root layout — QueryClientProvider, SessionProvider, Suspense, LoadingBar
├── index.tsx           Dashboard — AccountSelect, AuthButton, liste abonnements filtrés par compte
│                       search params : ?accountId=<number>
└── subscriptions/
    └── $id.tsx         Détail abonnement — vue champs, bouton Modifier (modal), bouton Supprimer (dialog confirmation)
                        notFoundComponent + throw notFound() dans le loader si id inconnu
                        navigate avant deleteSubscription pour éviter le flash d'erreur (optimistic update vide le cache avant navigation)
                        Link/navigate vers / préservent ?accountId via subscription.account_id
```

## Components
```
src/components/
├── AccountSelect.tsx
├── AuthButton.tsx          magic link login dialog + logout (queryClient.clear() + navigate /)
├── SubscriptionList.tsx
├── forms/
│   ├── NewSubscriptionForm.tsx     RHF + Zod, useAddSubscription
│   └── EditSubscriptionForm.tsx    RHF + Zod, useUpdateSubscription, defaultValues depuis Tables<"subscriptions">
└── modals/
    ├── newSubscriptionModal.tsx
    └── editSubscriptionModal.tsx

src/providers/
└── SessionProvider.tsx     SessionContext + useSession() hook + onAuthStateChange subscription
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
6. ✅ Edit form dans `$id.tsx`
7. ✅ Auth (Supabase magic link) + RLS + account_users
8. ⬜ Sorting via URL search params
9. ⬜ Auto-renewal (pg_cron)
10. ⬜ PWA + local notifications
11. ⬜ Push/email notifications (Edge Functions + Resend)

## Dev commands
```
npm run dev          # dev server on port 3000
npm run build        # production build
```
