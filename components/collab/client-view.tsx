'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Check,
  Clock3,
  ListMusic,
  Loader2,
  Plus,
  Search,
  Volume2,
} from 'lucide-react'
import { formatDuration, formatWait, type Song } from '@/lib/music'
import { searchSongs } from '@/lib/api'
import { BrandLogo } from './brand-logo'
import { useMusic } from './music-provider'
import { ProgressBar } from './progress-bar'

export function ClientView() {
  const { nowPlaying, elapsed, addSong, myRequests, connected } = useMusic()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Song[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  function messageFromUnknown(err: unknown, fallback: string): string {
    if (err instanceof Error && err.message.trim()) return err.message
    return fallback
  }

  // Búsqueda contra el backend, con debounce para no gastar cuota de la API en cada tecla
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearchError(null)
      setSearching(false)
      return
    }

    setSearching(true)
    const timeout = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      searchSongs(q, controller.signal)
        .then((songs) => {
          setResults(songs)
          setSearchError(null)
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setSearchError(messageFromUnknown(err, 'No se pudo buscar. Intenta de nuevo.'))
          }
        })
        .finally(() => setSearching(false))
    }, 350)

    return () => clearTimeout(timeout)
  }, [query])

  async function handleAdd(song: Song) {
    try {
      await addSong(song)
      setToast(song.title)
      window.setTimeout(() => setToast(null), 2200)
    } catch (err) {
      setToast(messageFromUnknown(err, 'No se pudo agregar, intenta de nuevo'))
      window.setTimeout(() => setToast(null), 2200)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      {/* Encabezado + búsqueda */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 px-4 pb-3 pt-4 backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary-foreground">
            <BrandLogo className="size-8" />
          </span>
          <div className="leading-tight">
            <div className='flex gap-1'>
              <p className="text-sm font-semibold text-chart-5">mesamusic<span className='text-chart-3'>.co </span></p>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-chart-5/80">
                 BETA
              </div>
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className={`size-1.5 rounded-full ${connected ? 'bg-primary' : 'bg-muted-foreground/50'}`}
              />
              {connected ? 'Conectado' : 'Conectando…'}
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca una canción o artista…"
            aria-label="Buscar canciones"
            className="h-11 w-full rounded-xl border border-input bg-secondary pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {searching ? (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>
      </header>

      <main className="flex-1 space-y-5 px-4 pb-32 pt-4">
        {/* Sonando ahora */}
        {nowPlaying ? (
          <section aria-labelledby="now-playing-heading">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
              <Volume2 className="size-3.5" />
              <h2 id="now-playing-heading">Sonando ahora</h2>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <Image
                src={nowPlaying.song.thumbnail || '/placeholder.svg'}
                alt=""
                width={56}
                height={56}
                unoptimized
                className="size-14 flex-none rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-card-foreground">
                  {nowPlaying.song.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {nowPlaying.song.channel}
                </p>
                <ProgressBar
                  className="mt-2"
                  elapsed={elapsed}
                  duration={nowPlaying.song.duration}
                />
              </div>
            </div>
          </section>
        ) : (
          <section>
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Todavía no suena nada. ¡Agrega la primera canción!
            </div>
          </section>
        )}

        {/* Mi solicitud */}
        {myRequests.length > 0 ? (
          <section aria-labelledby="my-requests-heading">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <ListMusic className="size-3.5" />
              <h2 id="my-requests-heading">Mi solicitud</h2>
            </div>
            <ul className="space-y-2">
              {myRequests.map((req) => (
                <li
                  key={req.entryId}
                  className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-3"
                >
                  <div className="flex size-11 flex-none flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <span className="text-[10px] font-medium uppercase leading-none opacity-80">
                      N.º
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {req.position}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {req.song.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {req.song.channel}
                    </p>
                  </div>
                  <div className="flex flex-none flex-col items-end">
                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                      <Clock3 className="size-3.5" />
                      {formatWait(req.waitSeconds)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      restante
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Resultados de búsqueda */}
        <section aria-labelledby="results-heading">
          <h2
            id="results-heading"
            className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Resultados
          </h2>
          {!query.trim() ? (
            <p className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
              Escribe el nombre de una canción o artista para empezar.
            </p>
          ) : searchError ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">
              {searchError}
            </p>
          ) : results.length === 0 && !searching ? (
            <p className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
              Sin resultados para &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((song) => (
                <li key={song.id}>
                  <button
                    type="button"
                    onClick={() => handleAdd(song)}
                    className="group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-secondary active:bg-secondary"
                  >
                    <Image
                      src={song.thumbnail || '/placeholder.svg'}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="size-12 flex-none rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {song.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {song.channel} · {formatDuration(song.duration)}
                      </p>
                    </div>
                    <span className="flex size-9 flex-none items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                      <Plus className="size-4" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Confirmación */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4"
      >
        {toast ? (
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg">
            <Check className="size-4" />
            <span className="max-w-[70vw] truncate">
              &ldquo;{toast}&rdquo; se agregó a la cola
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
