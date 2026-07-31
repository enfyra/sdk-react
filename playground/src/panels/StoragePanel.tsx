import { useRef, useState } from 'react'
import { useStorage } from '@enfyra/sdk-react'

const btnSecondary = 'rounded-md border border-border px-3.5 py-2 text-[13px] font-medium text-ink/70 transition-colors hover:bg-canvas disabled:opacity-50'

export function StoragePanel() {
  const { uploading, upload, download, getDownloadUrl, getFolderTree } = useStorage()
  const [result, setResult] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setResult('')
    const record = await upload(file)
    if (record) {
      setResult(JSON.stringify(record, null, 2))
      setDownloadUrl(getDownloadUrl(record.id))
    } else {
      setResult('Upload failed')
    }
  }

  const handleDownload = async (id: string) => {
    const blob = await download(id)
    setResult(blob ? `Downloaded blob: ${blob.size} bytes (${blob.type || 'unknown type'})` : 'Download failed')
  }

  const loadTree = async () => {
    setResult('')
    setDownloadUrl('')
    const tree = await getFolderTree()
    setResult(tree ? JSON.stringify(tree, null, 2) : 'Failed to load folder tree')
  }

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-ink">Storage</h2>
        <p className="mt-0.5 text-xs text-ink/50">useStorage · upload / download / folder tree</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleUpload(file)
            e.target.value = ''
          }}
        />
        <button className="rounded-md bg-accent px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? 'Uploading…' : 'Upload file'}
        </button>
        <button className={btnSecondary} onClick={() => void loadTree()}>Load folder tree</button>
        {uploading && (
          <span className="flex items-center gap-1.5 text-xs text-ink/50">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-accent" />
            Uploading…
          </span>
        )}
      </div>

      {downloadUrl && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
          <code className="flex-1 truncate font-mono text-[11px] text-ink/70">{downloadUrl}</code>
          <button
            className="shrink-0 rounded border border-border px-2 py-1 text-[11px] font-medium text-ink/60 transition-colors hover:bg-canvas"
            onClick={() => {
              const id = downloadUrl.split('/').pop()
              if (id) void handleDownload(id)
            }}
          >
            Download
          </button>
        </div>
      )}

      {result && (
        <pre className="max-h-72 overflow-auto rounded-lg bg-ink p-3 font-mono text-[11px] leading-relaxed text-emerald-200/90">
          {result}
        </pre>
      )}
    </section>
  )
}
