import { useState } from 'react'
import { useAuth } from '@enfyra/sdk-react'

export function AuthPanel() {
  const { user, isAuthenticated, pending, status, error, login, logout, refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    await login({ email, password })
  }

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Authentication</h2>
          <p className="mt-0.5 text-xs text-ink/50">Token strategy · shared zustand store across all components</p>
        </div>
        <span className="rounded-md bg-canvas px-2 py-1 font-mono text-[11px] text-ink/60">
          status: {status ?? 'null'}
        </span>
      </div>

      {isAuthenticated ? (
        <div className="animate-fade-up">
          <div className="mb-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
            <p className="text-sm font-medium text-ink">{user?.email}</p>
            <p className="mt-0.5 font-mono text-[11px] text-ink/50">id: {user?.id}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void logout()}
              className="rounded-md border border-danger/30 px-3.5 py-1.5 text-[13px] font-medium text-danger transition-colors hover:bg-danger/5"
            >
              Logout
            </button>
            <button
              onClick={() => void refresh()}
              disabled={pending}
              className="rounded-md border border-border px-3.5 py-1.5 text-[13px] font-medium text-ink/70 transition-colors hover:bg-canvas disabled:opacity-50"
            >
              Refresh user
            </button>
          </div>
        </div>
      ) : (
        <form
          className="flex max-w-sm flex-col gap-3"
          onSubmit={(e) => { e.preventDefault(); void handleLogin() }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/60">Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-shadow placeholder:text-ink/30 focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink/60">Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-shadow placeholder:text-ink/30 focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </label>
          <button
            type="submit"
            disabled={pending || !email || !password}
            className="mt-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
          {error && (
            <p className="animate-fade-up rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
              {error.message}
            </p>
          )}
        </form>
      )}
    </section>
  )
}
