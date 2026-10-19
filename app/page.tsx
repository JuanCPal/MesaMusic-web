'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Music2, QrCode, Radio, Sparkles, Store, Users } from 'lucide-react'
import { BrandLogo } from '@/components/collab/brand-logo'
import { createSession, type SessionType } from '@/lib/api'
import { cn } from '@/lib/utils'

const SESSION_TYPES: {
  value: SessionType
  label: string
  description: string
  icon: typeof Users
  disabled?: boolean
}[] = [
  { value: 'meeting', label: 'Reunión', description: 'Para familia, amigos y fiestas.', icon: Users },
  {
    value: 'business',
    label: 'Negocio',
    description: 'Para restaurantes, bares y cafés.',
    icon: Store,
    disabled: true,
  },
]

function suggestedSessionName(now = new Date()): string {
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `Sesion de las ${hh}:${mm}`
}

export default function Page() {
  const router = useRouter()
  const [name, setName] = useState(() => suggestedSessionName())
  const [type, setType] = useState<SessionType>('meeting')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    try {
      const s = await createSession(name.trim() || 'Sesión sin nombre', type)
      router.push(`/panel/${s.id}?invite=1`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creando la sesión')
      setCreating(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -right-20 top-24 h-56 w-56 rounded-full bg-secondary/70 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
            <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary-foreground">
                  <BrandLogo className="size-11" />
                </span>
                <div>
                  <div className='flex gap-1'><p className="text-sm font-medium text-primary">mesamusic<span className='text-chart-4'>.co </span></p> <div className="mb-0 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-chart-5/80">
                <Sparkles className="size-3.5 hidden text-primary" />
                 BETA
              </div></div>
                  <p className="text-xs text-muted-foreground">Sesion colaborativa en segundos</p>
                </div>
              </div>

              <h1 className="text-pretty text-2xl font-semibold tracking-tight text-card-foreground sm:text-3xl">
                Crea una sesion y deja que todos sumen canciones en vivo.
              </h1>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Crea la mesa, comparte el QR y el link, y gestiona la cola desde el panel.
              </p>

              <div className="mt-6 space-y-3">
                <label htmlFor="session-name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Nombre de la sesion
                </label>
                <input
                  id="session-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-0 transition focus:border-primary"
                />
                <div
                  role="radiogroup"
                  aria-label="Tipo de sesión"
                  className="grid grid-cols-1 gap-2 pt-1 min-[420px]:grid-cols-2"
                >
                  {SESSION_TYPES.map((opt) => {
                    const Icon = opt.icon
                    const checked = type === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        aria-disabled={opt.disabled || undefined}
                        tabIndex={opt.disabled ? -1 : checked ? 0 : -1}
                        onClick={() => {
                          if (!opt.disabled) setType(opt.value)
                        }}
                        onKeyDown={(e) => {
                          if (opt.disabled && (e.key === ' ' || e.key === 'Enter')) e.preventDefault()
                        }}
                        className={cn(
                          'flex items-start gap-3 rounded-xl border bg-card p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          checked ? 'border-primary bg-primary/10' : 'border-border',
                          opt.disabled ? 'cursor-not-allowed opacity-60' : !checked && 'hover:border-primary/50',
                        )}
                      >
                        <Icon className={cn('mt-0.5 size-5 shrink-0', checked ? 'text-primary' : 'text-muted-foreground')} />
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-card-foreground">
                            {opt.label}
                            {opt.disabled ? (
                              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Próximamente
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{opt.description}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-60"
                >
                  {creating ? 'Creando sesion...' : 'Crear sesion'}
                </button>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>
            </section>

            <aside className="rounded-2xl border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Todo listo
              </div>
              <ul className="space-y-3 text-sm text-card-foreground">
                <li className="flex items-start gap-2">
                  <Radio className="mt-0.5 size-4 text-primary" />
                  <span>La sesion empieza al instante, sin pasos extra.</span>
                </li>
                <li className="flex items-start gap-2">
                  <QrCode className="mt-0.5 size-4 text-primary" />
                  <span>Comparte QR o link para que se unan desde cualquier celular.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Music2 className="mt-0.5 size-4 text-primary" />
                  <span>Controla reproduccion, skip y cola colaborativa en tiempo real.</span>
                </li>
              </ul>
            </aside>
          </div>
        </main>
      </div>
  )
}
