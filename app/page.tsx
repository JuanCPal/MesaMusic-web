'use client'

import { useState } from 'react'
import { MusicProvider } from '@/components/collab/music-provider'
import { ClientView } from '@/components/collab/client-view'
import { PanelView } from '@/components/collab/panel-view'
import { ViewSwitcher, type ViewMode } from '@/components/collab/view-switcher'

export default function Page() {
  const [view, setView] = useState<ViewMode>('cliente')

  return (
    <MusicProvider>
      {view === 'cliente' ? <ClientView /> : <PanelView />}
      <ViewSwitcher view={view} onChange={setView} />
    </MusicProvider>
  )
}
