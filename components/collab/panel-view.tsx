'use client'

import Image from 'next/image'
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

export function PanelView() {
  const { nowPlaying, queue, isPlaying, togglePlay, skip } = useMusic()

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
              <p className="text-sm text-muted-foreground">Bar La Terraza</p>
            </div>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            En vivo
          </span>
        </header>

        {/* Indicador Sonando ahora */}
        <div className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary">
          <Radio className="size-4" />
          <span>Sonando ahora</span>
          <span className="ml-1 truncate font-normal normal-case text-muted-foreground">
            · pedida por {nowPlaying.requestedBy}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-xl">
            {/* Placeholder para embed de YouTube */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-card">
              <Image
                src={nowPlaying.song.thumbnail || '/placeholder.svg'}
                alt=""
                fill
                sizes="(min-width: 1024px) 640px, 100vw"
                className="object-cover opacity-40"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/40">
                <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Play className="size-8 translate-x-0.5" />
                </span>
                <p className="rounded-md bg-background/70 px-3 py-1 font-mono text-xs text-muted-foreground">
                  {'{ embed de YouTube aquí }'}
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <h1 className="text-balance text-3xl font-bold tracking-tight lg:text-4xl">
                {nowPlaying.song.title}
              </h1>
              <p className="mt-1 text-lg text-muted-foreground">
                {nowPlaying.song.channel}
              </p>
            </div>

            <ProgressBar
              className="mx-auto mt-6 max-w-lg"
              elapsed={nowPlaying.elapsed}
              duration={nowPlaying.song.duration}
              barClassName="h-2"
            />

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
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
                aria-label="Siguiente canción"
                className="flex size-12 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary"
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
                <Image
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
