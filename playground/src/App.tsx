import { useState } from 'react'
import { useAuth } from '@enfyra/sdk-react'
import { AuthPanel } from './panels/AuthPanel'
import { DataPanel } from './panels/DataPanel'
import { StoragePanel } from './panels/StoragePanel'
import { IntegrationsPanel } from './panels/IntegrationsPanel'
import { ErrorsPanel } from './panels/ErrorsPanel'
import { WebSocketPanel } from './panels/WebSocketPanel'

const tabs = [
  { id: 'auth', label: 'Auth' },
  { id: 'data', label: 'Data' },
  { id: 'storage', label: 'Storage' },
  { id: 'integrations', label: 'Fetch & Axios' },
  { id: 'errors', label: 'Errors' },
  { id: 'websocket', label: 'WebSocket' },
] as const

type TabId = (typeof tabs)[number]['id']

export function App() {
  const [active, setActive] = useState<TabId>('auth')
  const { user, isAuthenticated, pending } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-md bg-accent font-mono text-sm font-bold text-white">E</span>
            <div className="leading-tight">
              <span className="block text-sm font-semibold text-ink">SDK Playground</span>
              <span className="block font-mono text-[11px] text-ink/50">@enfyra/sdk-react</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium">
              <span
                className={`size-1.5 rounded-full ${
                  pending ? 'animate-pulse-dot bg-warn' : isAuthenticated ? 'bg-accent' : 'bg-ink/25'
                }`}
              />
              {pending ? 'Checking…' : isAuthenticated ? user?.email : 'Anonymous'}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        <nav className="mb-6 flex gap-1 rounded-lg border border-border bg-surface p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 ${
                active === tab.id
                  ? 'bg-ink text-white shadow-sm'
                  : 'text-ink/60 hover:bg-canvas hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div key={active} className="animate-fade-up rounded-xl border border-border bg-surface p-6 shadow-sm">
          {active === 'auth' && <AuthPanel />}
          {active === 'data' && <DataPanel />}
          {active === 'storage' && <StoragePanel />}
          {active === 'integrations' && <IntegrationsPanel />}
          {active === 'errors' && <ErrorsPanel />}
          {active === 'websocket' && <WebSocketPanel />}
        </div>
      </main>
    </div>
  )
}
