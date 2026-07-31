'use client'

import { useMemo, useState } from 'react'
import { DynamicIcon, type IconName } from 'lucide-react/dynamic'
import dynamicIconImports from 'lucide-react/dynamicIconImports'

const ALL_ICON_NAMES = Object.keys(dynamicIconImports) as IconName[]
const MAX_VISIBLE = 180

export default function IconExplorerPage() {
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_ICON_NAMES.slice(0, MAX_VISIBLE)

    const startsWith = ALL_ICON_NAMES.filter((name) => name.startsWith(q))
    const includes = ALL_ICON_NAMES.filter(
      (name) => !name.startsWith(q) && name.includes(q),
    )

    return [...startsWith, ...includes].slice(0, MAX_VISIBLE)
  }, [query])

  const handleCopy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name)
      setCopied(name)
      window.setTimeout(() => setCopied(null), 1400)
    } catch {
      // No rompemos la UI si el navegador bloquea clipboard.
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Explorador de iconos Lucide</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Busca por nombre, haz clic para copiar, y luego usa ese nombre en tu import.
        </p>
      </header>

      <section className="mb-5 rounded-xl border border-border bg-card p-4">
        <label htmlFor="icon-search" className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Buscar icono
        </label>
        <input
          id="icon-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: play, music, qr, pause, heart"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Mostrando {results.length} de {ALL_ICON_NAMES.length} iconos
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {results.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => handleCopy(name)}
            className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-2 py-3 text-center transition hover:border-primary/70 hover:bg-accent"
            title={`Copiar nombre: ${name}`}
          >
            <DynamicIcon name={name} className="size-5 text-foreground transition group-hover:text-primary" />
            <span className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">{name}</span>
            {copied === name ? (
              <span className="text-[10px] font-medium text-primary">Copiado</span>
            ) : null}
          </button>
        ))}
      </section>
    </main>
  )
}
