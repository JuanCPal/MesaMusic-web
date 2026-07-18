'use client'

import { Monitor, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'cliente' | 'panel'

export function ViewSwitcher({
  view,
  onChange,
}: {
  view: ViewMode
  onChange: (view: ViewMode) => void
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
      <div
        role="tablist"
        aria-label="Cambiar vista"
        className="flex items-center gap-1 rounded-full border border-border bg-card/90 p-1 shadow-lg backdrop-blur-md"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === 'cliente'}
          onClick={() => onChange('cliente')}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
            view === 'cliente'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Smartphone className="size-4" />
          Cliente
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'panel'}
          onClick={() => onChange('panel')}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
            view === 'panel'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Monitor className="size-4" />
          Panel
        </button>
      </div>
    </div>
  )
}
