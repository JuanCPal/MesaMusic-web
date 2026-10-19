'use client'

import { useEffect, useRef, type ReactNode } from 'react'

type ConfirmDialogProps = {
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  /** acción secundaria opcional, se muestra bajo el texto */
  secondaryAction?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  secondaryAction,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  // El foco inicial va en cancelar para que Enter no confirme por accidente.
  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 pb-4 pt-[12vh]"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-2xl"
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-card-foreground">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
        {secondaryAction ? <div className="mt-3">{secondaryAction}</div> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="h-10 cursor-pointer rounded-xl border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:brightness-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
