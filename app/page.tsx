'use client'

import { useState } from 'react'
import { QrCode } from 'lucide-react'
import { MusicProvider } from '@/components/collab/music-provider'
import { PanelView } from '@/components/collab/panel-view'
import { SessionQrModal } from '@/components/collab/session-qr-modal'
import { createSession, type Session } from '@/lib/api'

export default function Page() {
  const [session, setSession] = useState<Session | null>(null)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrOpen, setQrOpen] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    try {
      const s = await createSession(name.trim() || 'Sesión sin nombre')
      setSession(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creando la sesión')
    } finally {
      setCreating(false)
    }
  }

  if (!session) {
    return (
      <div className="p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la sesión"
        />
        <button onClick={handleCreate} disabled={creating}>
          Crear sesión
        </button>
        {error ? <p>{error}</p> : null}
      </div>
    )
  }

  return (
    <MusicProvider sessionId={session.id}>
      <div className="p-4">
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary"
        >
          <QrCode className="size-4" />
          Mostrar código QR
        </button>
      </div>
      <SessionQrModal session={session} open={qrOpen} onClose={() => setQrOpen(false)} />
      <PanelView />
    </MusicProvider>
  )
}
