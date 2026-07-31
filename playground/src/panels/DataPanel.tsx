import { useState } from 'react'
import { useQuery, useMutation } from '@enfyra/sdk-react'

const inputCls = 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-shadow placeholder:text-ink/30 focus:border-accent focus:ring-2 focus:ring-accent/15'
const btnPrimary = 'rounded-md bg-accent px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50'
const btnSecondary = 'rounded-md border border-border px-3.5 py-2 text-[13px] font-medium text-ink/70 transition-colors hover:bg-canvas disabled:opacity-50'

export function DataPanel() {
  const [collection, setCollection] = useState('enfyra_user')
  const [runId, setRunId] = useState(0)

  const query = useQuery(collection, {
    limit: 5,
    meta: ['filterCount', 'totalCount'],
    immediate: runId > 0,
  })

  const insert = useMutation(collection, { operation: 'insert' })
  const update = useMutation(collection, { operation: 'update' })
  const remove = useMutation(collection, { operation: 'delete' })

  const [newTitle, setNewTitle] = useState('')
  const [editId, setEditId] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [deleteId, setDeleteId] = useState('')

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Data</h2>
          <p className="mt-0.5 text-xs text-ink/50">useQuery + useMutation · insert / update / delete / batch</p>
        </div>
        <span className="rounded-md bg-canvas px-2 py-1 font-mono text-[11px] text-ink/60">
          {query.status ?? 'idle'}
        </span>
      </div>

      <div className="mb-3 flex gap-2">
        <input
          placeholder="Collection name"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className={`${inputCls} flex-1 font-mono text-[13px]`}
        />
        <button className={btnPrimary} onClick={() => setRunId((n) => n + 1)} disabled={query.pending}>
          {query.pending ? 'Querying…' : 'Query (limit 5)'}
        </button>
      </div>

      {query.meta && (
        <p className="mb-2 font-mono text-[11px] text-ink/50">
          filterCount: {query.meta.filterCount ?? '—'} · totalCount: {query.meta.totalCount ?? '—'}
        </p>
      )}
      {query.error && <p className="mb-2 rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">{query.error.message}</p>}
      {query.data && (
        <pre className="mb-4 max-h-56 overflow-auto rounded-lg bg-ink p-3 font-mono text-[11px] leading-relaxed text-emerald-200/90">
          {JSON.stringify(query.data, null, 2)}
        </pre>
      )}

      <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Insert</h3>
          <input
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className={`${inputCls} mb-2`}
          />
          <button
            className={`${btnPrimary} w-full`}
            disabled={insert.pending || !newTitle.trim()}
            onClick={async () => {
              await insert.execute({ data: { title: newTitle } })
              setNewTitle('')
              setRunId((n) => n + 1)
            }}
          >
            {insert.pending ? 'Inserting…' : 'Insert'}
          </button>
          {insert.error && <p className="mt-1.5 text-[11px] text-danger">{insert.error.message}</p>}
          {insert.data && <p className="mt-1.5 text-[11px] text-accent">Created ✓</p>}
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Update</h3>
          <input
            placeholder="ID"
            value={editId}
            onChange={(e) => setEditId(e.target.value)}
            className={`${inputCls} mb-2 font-mono text-[13px]`}
          />
          <input
            placeholder="New title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={`${inputCls} mb-2`}
          />
          <button
            className={`${btnSecondary} w-full`}
            disabled={update.pending || !editId || !editTitle.trim()}
            onClick={async () => {
              await update.execute({ id: editId, data: { title: editTitle } })
              setRunId((n) => n + 1)
            }}
          >
            {update.pending ? 'Updating…' : 'Update'}
          </button>
          {update.error && <p className="mt-1.5 text-[11px] text-danger">{update.error.message}</p>}
          {update.status === 'success' && <p className="mt-1.5 text-[11px] text-accent">Updated ✓</p>}
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Delete</h3>
          <input
            placeholder="ID"
            value={deleteId}
            onChange={(e) => setDeleteId(e.target.value)}
            className={`${inputCls} mb-2 font-mono text-[13px]`}
          />
          <button
            className="w-full rounded-md border border-danger/30 px-3.5 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger/5 disabled:opacity-50"
            disabled={remove.pending || !deleteId}
            onClick={async () => {
              await remove.execute({ id: deleteId })
              setDeleteId('')
              setRunId((n) => n + 1)
            }}
          >
            {remove.pending ? 'Deleting…' : 'Delete'}
          </button>
          {remove.error && <p className="mt-1.5 text-[11px] text-danger">{remove.error.message}</p>}
          {remove.status === 'success' && <p className="mt-1.5 text-[11px] text-accent">Deleted ✓</p>}
        </div>
      </div>
    </section>
  )
}
