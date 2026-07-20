'use client'

import { useState } from 'react'
import { MusicProvider } from '@/components/collab/music-provider'
import { PanelView } from '@/components/collab/panel-view'
import { createSession, getQrImageUrl, type Session } from '@/lib/api'

export default function Page() {
  const [session, setSession] = useState<Session | null>(null)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getQrImageUrl(session.id)} alt="QR de la sesión" />
        <p>{session.joinUrl}</p>
      </div>
      <PanelView />
    </MusicProvider>
  )
}
