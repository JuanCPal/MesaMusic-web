'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MusicProvider } from '@/components/collab/music-provider'
import { PanelView } from '@/components/collab/panel-view'
import { SessionQrModal } from '@/components/collab/session-qr-modal'
import { getSession, type Session } from '@/lib/api'

export default function PanelPage() {
  const params = useParams<{ sessionId: string }>()
  const sessionId = params.sessionId
  const router = useRouter()

  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrOpen, setQrOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    getSession(sessionId)
      .then((s) => {
        if (cancelled) return
        setSession(s)

        // Abre el QR automáticamente solo justo después de crear la sesión.
        const url = new URL(window.location.href)
        if (url.searchParams.get('invite') === '1') {
          setQrOpen(true)
          url.searchParams.delete('invite')
          router.replace(`${url.pathname}${url.search}`)
        }
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
  }, [sessionId, router])

  if (loading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
  }

  if (error || !session) {
    return <div className="p-4 text-center text-sm text-destructive">{error}</div>
  }

  return (
    <MusicProvider sessionId={session.id}>
      <SessionQrModal session={session} open={qrOpen} onClose={() => setQrOpen(false)} />
      <PanelView onInviteClick={() => setQrOpen(true)} />
    </MusicProvider>
  )
}
