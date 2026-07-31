import { useState } from 'react'
import { useEnfyra } from '@enfyra/sdk-react'
import axios from 'axios'

const btnPrimary = 'rounded-md bg-accent px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50'

export function IntegrationsPanel() {
  const client = useEnfyra()
  const [fetchResult, setFetchResult] = useState('')
  const [axiosResult, setAxiosResult] = useState('')
  const [fetchPending, setFetchPending] = useState(false)
  const [axiosPending, setAxiosPending] = useState(false)

  const runFetch = async () => {
    setFetchPending(true)
    setFetchResult('')
    try {
      const response = await client.fetch('/me')
      const body = await response.json()
      setFetchResult(`HTTP ${response.status}\n${JSON.stringify(body, null, 2)}`)
    } catch (err) {
      setFetchResult(err instanceof Error ? err.message : 'Fetch failed')
    } finally {
      setFetchPending(false)
    }
  }

  const runAxios = async () => {
    setAxiosPending(true)
    setAxiosResult('')
    try {
      const api = axios.create({ baseURL: client.getHttpClient().baseUrl })
      client.attachAxios(api)
      const { data, status } = await api.get('/me')
      setAxiosResult(`HTTP ${status}\n${JSON.stringify(data, null, 2)}`)
      client.dispose()
    } catch (err) {
      setAxiosResult(err instanceof Error ? err.message : 'Axios failed')
    } finally {
      setAxiosPending(false)
    }
  }

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-ink">Fetch & Axios</h2>
        <p className="mt-0.5 text-xs text-ink/50">Raw integrations through the core client</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-1 font-mono text-[13px] font-semibold text-ink">enfyra.fetch('/me')</h3>
          <p className="mb-3 text-[11px] text-ink/50">Native fetch with auto auth injection and 401 retry.</p>
          <button className={btnPrimary} onClick={() => void runFetch()} disabled={fetchPending}>
            {fetchPending ? 'Running…' : 'Run fetch'}
          </button>
          {fetchResult && (
            <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-ink p-3 font-mono text-[11px] leading-relaxed text-emerald-200/90">
              {fetchResult}
            </pre>
          )}
        </div>

        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-1 font-mono text-[13px] font-semibold text-ink">attachAxios()</h3>
          <p className="mb-3 text-[11px] text-ink/50">Axios interceptors for auth and token refresh.</p>
          <button className={btnPrimary} onClick={() => void runAxios()} disabled={axiosPending}>
            {axiosPending ? 'Running…' : 'Run axios'}
          </button>
          {axiosResult && (
            <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-ink p-3 font-mono text-[11px] leading-relaxed text-emerald-200/90">
              {axiosResult}
            </pre>
          )}
        </div>
      </div>
    </section>
  )
}
