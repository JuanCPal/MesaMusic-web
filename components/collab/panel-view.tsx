'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ListMusic,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  QrCode,
  SkipForward,
  Trash2,
} from 'lucide-react'
import { formatDuration } from '@/lib/music'
import { BrandLogo } from './brand-logo'
import { useMusic } from './music-provider'
import { ProgressBar } from './progress-bar'

// Tipos mínimos del IFrame Player API de YouTube (no hay @types instalado,
// así que declaramos solo lo que usamos).
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

const PLAYER_ELEMENT_ID = 'yt-player'

type PanelViewProps = {
  onInviteClick?: () => void
}

function loadYouTubeScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve()
      return
    }
    const existing = document.getElementById('youtube-iframe-api')
    if (!existing) {
      const script = document.createElement('script')
      script.id = 'youtube-iframe-api'
      script.src = 'https://www.youtube.com/iframe_api'
      document.body.appendChild(script)
    }
    window.onYouTubeIframeAPIReady = () => resolve()
  })
}

export function PanelView({ onInviteClick }: PanelViewProps) {
  const { nowPlaying, queue, connected, reportEnded, skipCurrent, removeItem } = useMusic()

  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playerElapsed, setPlayerElapsed] = useState(0)
  const [isQueueVisible, setIsQueueVisible] = useState(true)
  const [removingEntryIds, setRemovingEntryIds] = useState<Set<string>>(new Set())
  const loadedVideoIdRef = useRef<string | null>(null)
  const removingEntryIdsRef = useRef<Set<string>>(new Set())

  const getFullscreenElement = useCallback((): Element | null => {
    return document.fullscreenElement ?? (document as any).webkitFullscreenElement ?? null
  }, [])

  const requestElementFullscreen = useCallback(async (element: HTMLElement) => {
    if (element.requestFullscreen) {
      await element.requestFullscreen()
      return
    }
    const webkitRequestFullscreen = (element as any).webkitRequestFullscreen as
      | (() => Promise<void> | void)
      | undefined
    if (webkitRequestFullscreen) {
      await webkitRequestFullscreen.call(element)
    }
  }, [])

  const exitDocumentFullscreen = useCallback(async () => {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
      return
    }
    const webkitExitFullscreen = (document as any).webkitExitFullscreen as
      | (() => Promise<void> | void)
      | undefined
    if (webkitExitFullscreen) {
      await webkitExitFullscreen.call(document)
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const activeFullscreen = getFullscreenElement()
    if (activeFullscreen) {
      try {
        await exitDocumentFullscreen()
      } catch {
        // Ignoramos errores transitorios del navegador.
      }
      return
    }

    const iframe = playerRef.current?.getIframe?.()
    const fullscreenTarget =
      iframe instanceof HTMLElement ? iframe : playerContainerRef.current

    if (!fullscreenTarget) return

    try {
      await requestElementFullscreen(fullscreenTarget)
    } catch {
      // Algunos navegadores pueden bloquear fullscreen por políticas de usuario.
    }
  }, [exitDocumentFullscreen, getFullscreenElement, requestElementFullscreen])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(getFullscreenElement()))
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange' as any, onFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange' as any, onFullscreenChange)
    }
  }, [getFullscreenElement])

  // Inicializa el player una sola vez
  useEffect(() => {
    let cancelled = false

    loadYouTubeScript().then(() => {
      if (cancelled) return
      playerRef.current = new window.YT.Player(PLAYER_ELEMENT_ID, {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            const iframe = playerRef.current?.getIframe?.() as HTMLIFrameElement | undefined
            iframe?.setAttribute('allowfullscreen', 'true')
            iframe?.setAttribute('allow', 'autoplay; fullscreen')
            setPlayerReady(true)
          },
          onStateChange: (event: any) => {
            const YT = window.YT
            if (event.data === YT.PlayerState.PLAYING) setIsPlaying(true)
            if (event.data === YT.PlayerState.PAUSED) setIsPlaying(false)
            if (event.data === YT.PlayerState.ENDED) {
              setIsPlaying(false)
              reportEnded()
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      playerRef.current?.destroy?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Carga el video correspondiente cada vez que cambia lo que el backend dice que suena
  useEffect(() => {
    if (!playerReady || !playerRef.current || !nowPlaying) return
    if (loadedVideoIdRef.current === nowPlaying.song.id) return

    loadedVideoIdRef.current = nowPlaying.song.id
    playerRef.current.loadVideoById(nowPlaying.song.id)
  }, [playerReady, nowPlaying])

  // Poll del tiempo real del player para la barra de progreso
  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(() => {
      const t = playerRef.current?.getCurrentTime?.()
      if (typeof t === 'number') setPlayerElapsed(t)
    }, 500)
    return () => clearInterval(id)
  }, [isPlaying])

  useEffect(() => {
    setPlayerElapsed(0)
  }, [nowPlaying?.song.id])

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }, [isPlaying])

  const skip = useCallback(() => {
    void skipCurrent()
  }, [skipCurrent])

  const removeFromQueue = useCallback(async (entryId: string) => {
    if (removingEntryIdsRef.current.has(entryId)) return

    const confirmed = window.confirm('Eliminar esta canción de la cola?')
    if (!confirmed) return

    removingEntryIdsRef.current.add(entryId)
    setRemovingEntryIds(new Set(removingEntryIdsRef.current))

    try {
      await removeItem(entryId)
    } catch {
      // El estado se resincroniza por WebSocket/reconexión; evitamos romper la UI.
    } finally {
      removingEntryIdsRef.current.delete(entryId)
      setRemovingEntryIds(new Set(removingEntryIdsRef.current))
    }
  }, [removeItem])

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background lg:flex-row">
      {/* Zona principal: reproductor */}
      <section className="flex min-h-0 flex-1 flex-col px-4 py-2 lg:px-8 lg:py-6">
        <header className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary-foreground">
              <BrandLogo className="size-11" />
            </span>
            <div className="leading-tight">
              <div className='flex gap-1'><p className="text-lg font-semibold text-chart-5">mesamusic<span className='text-chart-3'>.co </span></p> <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-chart-5/80">
                BETA
              </div> </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onInviteClick ? (
              <button
                type="button"
                onClick={onInviteClick}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:brightness-95"
              >
                <QrCode className="size-4" />
                Invitar más personas
              </button>
            ) : null}
            {!isQueueVisible ? (
              <button
                type="button"
                onClick={() => setIsQueueVisible(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
                Ver lista
              </button>
            ) : null}
            <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
              <span className="relative flex size-2">
                {connected ? (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                ) : null}
                <span
                  className={`relative inline-flex size-2 rounded-full ${connected ? 'bg-primary' : 'bg-muted-foreground/50'}`}
                />
              </span>
              {connected ? 'En vivo' : 'Conectando…'}
            </span>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 items-start justify-center">
          <div className="w-full max-w-4xl">
            {/* Reproductor real de YouTube */}
            <div
              ref={playerContainerRef}
              className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div id={PLAYER_ELEMENT_ID} className="absolute inset-0" />
              {!nowPlaying ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-sm text-muted-foreground">
                  Esperando canciones en la cola…
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Barra lateral: cola */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-full max-w-sm overflow-hidden border-l border-border bg-sidebar transition-all duration-300 ease-out ${isQueueVisible ? 'translate-x-0' : 'translate-x-full'} lg:static lg:inset-auto lg:z-auto lg:max-w-none lg:translate-x-0 ${isQueueVisible ? 'lg:w-96' : 'lg:w-0 lg:border-l-0'}`}
      >
        <div className={`flex h-full min-h-0 flex-col p-6 transition-opacity duration-200 ${isQueueVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ListMusic className="size-5 text-primary" />
              En cola
            </h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-sm font-medium text-secondary-foreground">
                {queue.length}
              </span>
              <button
                type="button"
                onClick={() => setIsQueueVisible(false)}
                className="inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Ocultar cola"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {queue.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              La cola está vacía. Escanea el QR para agregar canciones.
            </p>
          ) : (
            <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {queue.map((item, index) => (
                <li
                  key={item.entryId}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5"
                >
                  <span className="w-5 flex-none text-center font-mono text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.song.thumbnail || '/placeholder.svg'}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 flex-none rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {item.song.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.song.channel} · pedida por {item.requestedBy}
                    </p>
                  </div>
                  <span className="flex-none font-mono text-xs text-muted-foreground">
                    {formatDuration(item.song.duration)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void removeFromQueue(item.entryId)}
                    disabled={removingEntryIds.has(item.entryId)}
                    aria-label="Eliminar canción de la cola"
                    className="flex size-8 flex-none items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>

      <div
        className={`fixed bottom-4 left-4 right-4 z-30 sm:left-6 sm:right-6 lg:left-8 ${isQueueVisible ? 'lg:right-104' : 'lg:right-8'}`}
      >
        <div className="mx-auto w-full max-w-4xl rounded-xl border border-border/80 bg-card/90 px-3 py-3 shadow-2xl backdrop-blur">
          <ProgressBar
            className="w-full"
            elapsed={playerElapsed}
            duration={nowPlaying?.song.duration ?? 0}
            barClassName="h-2"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-2xl font-semibold text-card-foreground lg:text-2xl">
                {nowPlaying?.song.title ?? 'Esperando reproducción'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {nowPlaying
                  ? `${nowPlaying.song.channel} · pedida por ${nowPlaying.requestedBy}`
                  : 'La cola está vacía por ahora'}
              </p>
            </div>

            <div className="flex flex-none items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                disabled={!nowPlaying}
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                className="inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPlaying ? (
                  <Pause className="size-6" />
                ) : (
                  <Play className="size-6" />
                )}
              </button>

              <button
                type="button"
                onClick={skip}
                disabled={!nowPlaying}
                aria-label="Siguiente canción"
                className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SkipForward className="size-5" />
              </button>

              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                disabled={!playerReady}
                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isFullscreen ? (
                  <Minimize2 className="size-5" />
                ) : (
                  <Maximize2 className="size-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
