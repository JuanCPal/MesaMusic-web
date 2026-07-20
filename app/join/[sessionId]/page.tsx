'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { MusicProvider } from '@/components/collab/music-provider'
import { ClientView } from '@/components/collab/client-view'
import { getSession, type Session } from '@/lib/api'

export default function JoinPage() {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params.sessionId

  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getSession(sessionId)
      .then((s) => {
        if (!cancelled) setSession(s)
      })
      .catch(() => {
        if (!cancelled) setError('Esta sesión no existe o ya no está disponible.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (loading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
  }

  if (error || !session) {
    return <div className="p-4 text-center text-sm text-destructive">{error}</div>
  }

  return (
    <MusicProvider sessionId={session.id}>
      <ClientView />
    </MusicProvider>
  )
}
