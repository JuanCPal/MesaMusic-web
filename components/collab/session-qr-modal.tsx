'use client'

import { useEffect, useState } from 'react'
import { QrCode, X, Copy, Check } from 'lucide-react'
import { getQrImageUrl, type Session } from '@/lib/api'

type SessionQrModalProps = {
  session: Session
  open: boolean
  onClose: () => void
}

export function SessionQrModal({ session, open, onClose }: SessionQrModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setCopied(false)
    }
  }, [open])

  if (!open) return null

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(session.joinUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Código QR de la sesión"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-base font-semibold text-card-foreground">Invitar a la sesión</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Escanea este código o comparte el link para unirte a la sesión.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-border bg-background p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getQrImageUrl(session.id)}
            alt="QR de la sesión"
            className="mx-auto h-56 w-56 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Link para compartir
          </p>
          <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground select-all break-all">
            {session.joinUrl}
          </p>
        </div>

        <div className="mt-4 flex justify-between gap-3">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copiado' : 'Copiar link'}
          </button>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <QrCode className="size-4" />
            Disponible para escanear
          </span>
        </div>
      </div>
    </div>
  )
}
