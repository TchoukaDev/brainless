import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { Button } from '#/components/ui/button'
import NewSubscriptionModal from '#/components/modals/newSubscriptionModal'
import AccountSelect from '#/components/AccountSelect'
import AuthButton from '#/components/AuthButton'
import SubscriptionList from '#/components/SubscriptionList'
import { accountsQuery, subscriptionsQuery } from '#/lib/queries'
import { useState } from 'react'
import { queryClient } from './__root'

export const Route = createFileRoute('/')({
  validateSearch: z.object({
    accountId: z.number().optional(),
  }),
  loader: async () => {
    await Promise.all([
      queryClient.ensureQueryData(accountsQuery),
      queryClient.ensureQueryData(subscriptionsQuery),
    ])
  },
  component: App
})

function App() {
  const { data: accounts } = useSuspenseQuery(accountsQuery)
  const { data: subscriptions } = useSuspenseQuery(subscriptionsQuery)

  const { accountId } = Route.useSearch()
  const navigate = useNavigate({ from: '/' })
  const [isOpen, setIsOpen] = useState(false)

  const filtered = subscriptions.filter(s => s.account_id === accountId)
  const setAccountId = (id: number) => navigate({ search: { accountId: id } })

  return (
    <main className="p-8 flex flex-col gap-6">
      <div className="flex justify-between items-center gap-2">
        <h1 className="text-2xl font-bold">Brainless</h1>
        <div className="flex items-center gap-2">
          <NewSubscriptionModal isOpen={isOpen} onClose={() => setIsOpen(false)} selectedAccountId={accountId} accounts={accounts} />
          <Button onClick={() => setIsOpen(true)}>+ <span className="hidden md:block">Ajouter un abonnement</span></Button>
          <AccountSelect accounts={accounts} value={accountId} onChange={setAccountId} />
          <AuthButton />
        </div>
      </div>
      <SubscriptionList subscriptions={filtered} />
    </main>
  )
}
