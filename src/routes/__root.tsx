import { Suspense } from 'react'
import { HeadContent, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ToastContainer } from 'react-toastify'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from '#/providers/SessionProvider'

import appCss from '../styles.css?url'
import 'react-toastify/dist/ReactToastify.css'

export const queryClient = new QueryClient()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Brainless' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

// S'affiche pendant que le loader de la route tourne (avant que le composant monte)
function LoadingBar() {
  const isLoading = useRouterState({ select: s => s.isLoading })
  return isLoading ? <div className="fixed top-0 left-0 right-0 h-1 bg-primary animate-pulse z-50" /> : null
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
          <LoadingBar />
          <Suspense fallback={<div className="p-8 text-muted-foreground text-sm">Chargement…</div>}>
            {children}
          </Suspense>
          <ToastContainer position="bottom-right" theme="dark" />
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
          />
          <Scripts />
          </SessionProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
