'use client'

import { useEffect, useRef, useState } from 'react'
import { NAME_MAX_LENGTH, cleanName, validateName } from '@/lib/participant'

type NameModalProps = {
  initialName: string
  /** texto del botón de confirmar */
  confirmLabel: string
  onConfirm: (name: string) => void
  onCancel: () => void
}

export function NameModal({ initialName, confirmLabel, onConfirm, onCancel }: NameModalProps) {
  const [value, setValue] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const problem = validateName(value)
    if (problem) {
      setError(problem)
      return
    }
    onConfirm(cleanName(value))
  }

  // Alineado arriba para que quede visible con el teclado abierto en celular.
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 pb-4 pt-[12vh]"
      onClick={onCancel}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-modal-title"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-2xl"
      >
        <h2 id="name-modal-title" className="text-base font-semibold text-card-foreground">
          ¿Cómo te llamas?
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Se mostrará junto a las canciones que pidas.
        </p>
        <input
          ref={inputRef}
          type="text"
          value={value}
          maxLength={NAME_MAX_LENGTH}
          autoComplete="nickname"
          enterKeyHint="done"
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
          aria-label="Tu nombre"
          aria-invalid={error ? true : undefined}
          placeholder="Tu nombre"
          className="mt-3 h-11 w-full rounded-xl border border-input bg-secondary px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        {error ? (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-xl border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:brightness-95"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
