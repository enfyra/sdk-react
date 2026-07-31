import { useState } from 'react'
import { useWebSocket } from '@enfyra/sdk-react'

export function WebSocketPanel() {
  const [gateway, setGateway] = useState('chat')
  const { connected, connecting, error, connect, disconnect, emit, on } = useWebSocket(gateway)
  const [log, setLog] = useState<string[]>([])

  const handleConnect = async () => {
    setLog([])
    try {
      await connect()
      setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Connected`])
      on('message', (data) => {
        setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] message: ${JSON.stringify(data)}`])
      })
    } catch (e) {
      setLog((prev) => [...prev, `Error: ${e instanceof Error ? e.message : String(e)}`])
    }
  }

  const handleEmit = () => {
    emit('message', { text: 'hello from react playground', ts: Date.now() })
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] → emitted message`])
  }

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">WebSocket</h2>
          <p className="mt-0.5 text-xs text-ink/50">useWebSocket · Socket.IO with token auth</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium">
          <span className={`size-1.5 rounded-full ${connected ? 'bg-accent' : connecting ? 'animate-pulse-dot bg-warn' : 'bg-ink/25'}`} />
          {connected ? 'Connected' : connecting ? 'Connecting' : 'Disconnected'}
        </span>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          placeholder="Gateway"
          value={gateway}
          onChange={(e) => setGateway(e.target.value)}
          disabled={connected}
          className="w-36 rounded-md border border-border bg-surface px-3 py-2 font-mono text-[13px] text-ink outline-none transition-shadow placeholder:text-ink/30 focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-50"
        />
        {!connected ? (
          <button
            className="rounded-md bg-accent px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
            onClick={() => void handleConnect()}
            disabled={connecting}
          >
            {connecting ? 'Connecting…' : 'Connect'}
          </button>
        ) : (
          <>
            <button
              className="rounded-md border border-border px-3.5 py-2 text-[13px] font-medium text-ink/70 transition-colors hover:bg-canvas"
              onClick={handleEmit}
            >
              Emit test
            </button>
            <button
              className="rounded-md border border-danger/30 px-3.5 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger/5"
              onClick={disconnect}
            >
              Disconnect
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">{error.message}</p>
      )}

      {log.length > 0 && (
        <div className="rounded-lg bg-ink p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Event log</span>
            <button className="font-mono text-[10px] text-white/40 transition-colors hover:text-white/70" onClick={() => setLog([])}>
              clear
            </button>
          </div>
          <pre className="max-h-56 overflow-auto font-mono text-[11px] leading-relaxed text-emerald-200/90">
            {log.join('\n')}
          </pre>
        </div>
      )}
    </section>
  )
}
