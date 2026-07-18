'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ListMusic,
  Music2,
  Pause,
  Play,
  Radio,
  SkipForward,
} from 'lucide-react'
import { formatDuration } from '@/lib/music'
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

export function PanelView() {
  const { nowPlaying, queue, connected, reportEnded } = useMusic()

  const playerRef = useRef<any>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerElapsed, setPlayerElapsed] = useState(0)
  const loadedVideoIdRef = useRef<string | null>(null)

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
          onReady: () => setPlayerReady(true),
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
    // Le avisamos directo al backend que "terminó" para forzar el avance;
    // cuando llegue el nuevo nowPlaying, el efecto de arriba carga el video.
    reportEnded()
  }, [reportEnded])

  return (
    <div className="flex min-h-screen w-full flex-col bg-background lg:flex-row">
      {/* Zona principal: reproductor */}
      <section className="flex flex-1 flex-col px-6 py-6 lg:px-10 lg:py-8">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Music2 className="size-6" />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-semibold">Sintonía</p>
            </div>
          </div>
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
        </header>

        {/* Indicador Sonando ahora */}
        <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary">
          <Radio className="size-4" />
          <span>Sonando ahora</span>
          {nowPlaying ? (
            <span className="ml-1 truncate font-normal normal-case text-muted-foreground">
              · pedida por {nowPlaying.requestedBy}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-xl">
            {/* Reproductor real de YouTube */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-card">
              <div id={PLAYER_ELEMENT_ID} className="absolute inset-0" />
              {!nowPlaying ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-sm text-muted-foreground">
                  Esperando canciones en la cola…
                </div>
              ) : null}
            </div>

            <div className="mt-6 text-center">
              <h1 className="text-balance text-3xl font-bold tracking-tight lg:text-4xl">
                {nowPlaying?.song.title ?? '—'}
              </h1>
              <p className="mt-1 text-lg text-muted-foreground">
                {nowPlaying?.song.channel ?? ''}
              </p>
            </div>

            <ProgressBar
              className="mx-auto mt-6 max-w-lg"
              elapsed={playerElapsed}
              duration={nowPlaying?.song.duration ?? 0}
              barClassName="h-2"
            />

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={togglePlay}
                disabled={!nowPlaying}
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-40"
              >
                {isPlaying ? (
                  <Pause className="size-6" />
                ) : (
                  <Play className="size-6 translate-x-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={skip}
                disabled={!nowPlaying}
                aria-label="Siguiente canción"
                className="flex size-12 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
              >
                <SkipForward className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Barra lateral: cola */}
      <aside className="w-full border-t border-border bg-sidebar px-6 py-6 lg:w-96 lg:border-l lg:border-t-0 lg:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ListMusic className="size-5 text-primary" />
            En cola
          </h2>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-sm font-medium text-secondary-foreground">
            {queue.length}
          </span>
        </div>

        {queue.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            La cola está vacía. Escanea el QR para agregar canciones.
          </p>
        ) : (
          <ol className="space-y-2">
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
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  )
}
