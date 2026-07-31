import { useState } from 'react'
import { useQuery, useMutation } from '@enfyra/sdk-react'

export function ApiPanel() {
  const [collection, setCollection] = useState('enfyra_user')
  const [trigger, setTrigger] = useState(0)

  const query = useQuery(collection, { limit: 5, immediate: trigger > 0 })
  const mutation = useMutation(collection, { operation: 'insert' })

  const [newTitle, setNewTitle] = useState('')

  const handleInsert = async () => {
    if (!newTitle.trim()) return
    await mutation.execute({ data: { title: newTitle } })
    setNewTitle('')
    setTrigger((t) => t + 1)
  }

  return (
    <section>
      <h2>Query & Mutation</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Collection"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={() => setTrigger((t) => t + 1)} disabled={query.pending}>
          {query.pending ? 'Loading…' : 'Query (limit 5)'}
        </button>
      </div>

      <p style={{ fontSize: 12, color: '#666' }}>
        status: {query.status ?? 'null'} · meta: {query.meta ? JSON.stringify(query.meta) : 'null'}
      </p>
      {query.error && <p style={{ color: 'red' }}>{query.error.message}</p>}
      {query.data && (
        <pre style={{ fontSize: 11, overflow: 'auto', maxHeight: 300, background: '#f5f5f5', padding: 12 }}>
          {JSON.stringify(query.data, null, 2)}
        </pre>
      )}

      <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #eee' }} />
      <h3 style={{ fontSize: 14 }}>Insert mutation</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          placeholder="Title for new record"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={() => void handleInsert()} disabled={mutation.pending}>
          {mutation.pending ? 'Inserting…' : 'Insert'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#666' }}>status: {mutation.status ?? 'null'}</p>
      {mutation.error && <p style={{ color: 'red' }}>{mutation.error.message}</p>}
      {mutation.data && (
        <pre style={{ fontSize: 11, overflow: 'auto', maxHeight: 200, background: '#f0fff0', padding: 12 }}>
          {JSON.stringify(mutation.data, null, 2)}
        </pre>
      )}
    </section>
  )
}
