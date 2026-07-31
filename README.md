# @enfyra/sdk-react

React hooks for Enfyra. CSR-only — for SSR, use `@enfyra/next`.

```bash
yarn add @enfyra/sdk-react @enfyra/sdk-core zustand
```

## Setup

```tsx
import { EnfyraProvider } from '@enfyra/sdk-react'

function App() {
  return (
    <EnfyraProvider config={{ baseUrl: 'http://localhost:3000' }}>
      <Dashboard />
    </EnfyraProvider>
  )
}
```

## Examples

### Query data

```tsx
import { useQuery } from '@enfyra/sdk-react'

function ArticleList() {
  const { data, error, pending, status, meta, refresh } = useQuery('articles', {
    select: ['id', 'title'],
    filter: { status: { _eq: 'published' } },
    sort: '-createdAt',
    limit: 20,
    meta: ['totalCount'],
  })

  if (pending) return <p>Loading…</p>
  if (error) return <p>{error.message}</p>
  return <ul>{data?.map((a) => <li key={a.id}>{a.title}</li>)}</ul>
}
```

Queries auto-execute on mount. Use `immediate: false` to defer, then call `refresh()` manually.

### Create, update, delete records

```tsx
import { useMutation } from '@enfyra/sdk-react'

function CreateArticle() {
  const { execute, pending, error, data } = useMutation('articles', {
    operation: 'insert',
    onSuccess: () => console.log('created'),
  })

  const handleSubmit = async () => {
    await execute({ data: { title: 'Hello', status: 'draft' } })
  }

  return <button onClick={handleSubmit} disabled={pending}>Create</button>
}
```

Update and delete:

```tsx
const update = useMutation('articles', { operation: 'update' })
await update.execute({ id: 1, data: { title: 'Updated' } })

const remove = useMutation('articles', { operation: 'delete' })
await remove.execute({ id: 1 })

// Batch
await remove.execute({ ids: [1, 2, 3] })
```

### Authentication

```tsx
import { useAuth } from '@enfyra/sdk-react'

function Login() {
  const { user, isAuthenticated, pending, login, logout } = useAuth()

  if (isAuthenticated) {
    return <p>Signed in as {user?.email} <button onClick={logout}>Logout</button></p>
  }

  return (
    <button disabled={pending} onClick={() => login({ email, password })}>
      Sign in
    </button>
  )
}
```

Auth state is shared across all components via a zustand store — login in one component, every other component re-renders.

### Storage

```tsx
import { useStorage } from '@enfyra/sdk-react'

function Upload() {
  const { upload, uploading, getDownloadUrl } = useStorage()

  const handleFile = async (file: File) => {
    const record = await upload(file, { folder: 'articles' })
    if (record) console.log(getDownloadUrl(record.id))
  }

  return <input type="file" onChange={(e) => handleFile(e.target.files![0])} disabled={uploading} />
}
```

### Realtime

```tsx
import { useWebSocket } from '@enfyra/sdk-react'

function Chat() {
  const { connected, connect, disconnect, emit, on } = useWebSocket('chat', { immediate: true })

  useEffect(() => {
    if (!connected) return
    const off = on('message', (data) => console.log(data))
    return off
  }, [connected, on])

  return <button onClick={() => emit('message', { text: 'hi' })}>Send</button>
}
```

## Hooks reference

| Hook | Returns |
|---|---|
| `useQuery(table, options?)` | `{ data, error, pending, status, meta, refresh }` |
| `useMutation(table, options?)` | `{ data, error, pending, status, execute }` |
| `useAuth()` | `{ user, isAuthenticated, pending, status, error, login, logout, refresh }` |
| `useStorage()` | `{ uploading, upload, download, getDownloadUrl, getFolderTree }` |
| `useWebSocket(gateway, options?)` | `{ connected, connecting, error, connect, disconnect, emit, on }` |

## Playground

```bash
yarn workspace @enfyra/sdk-react dev
```

Opens at `http://localhost:3001`. Requires a running Enfyra instance at `http://localhost:3000`.
