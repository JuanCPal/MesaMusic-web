'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { CATALOG, type QueueItem, type Song } from '@/lib/music'

type NowPlaying = {
  song: Song
  /** segundos transcurridos */
  elapsed: number
  requestedBy: string
}

type MyRequest = {
  entryId: string
  song: Song
  /** posición dentro de la cola (1 = siguiente) */
  position: number
  /** segundos estimados hasta que suene */
  waitSeconds: number
}

type MusicContextValue = {
  nowPlaying: NowPlaying
  queue: QueueItem[]
  isPlaying: boolean
  currentUser: string
  addSong: (song: Song) => string
  removeFromQueue: (entryId: string) => void
  togglePlay: () => void
  skip: () => void
  myRequests: MyRequest[]
}

const MusicContext = createContext<MusicContextValue | null>(null)

/** Estado inicial de ejemplo para que el panel se vea poblado */
function seedQueue(): QueueItem[] {
  const seeds: Array<[Song, string]> = [
    [CATALOG[2], 'Mariana'],
    [CATALOG[4], 'Diego'],
    [CATALOG[7], 'Sofía'],
    [CATALOG[1], 'Mariana'],
  ]
  return seeds.map(([song, requestedBy], i) => ({
    entryId: `seed-${i}`,
    song,
    requestedBy,
    mine: false,
  }))
}

let entryCounter = 0

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const currentUser = 'Tú'
  const [queue, setQueue] = useState<QueueItem[]>(seedQueue)
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>(() => ({
    song: CATALOG[0],
    elapsed: 42,
    requestedBy: 'Valentina',
  }))
  const [isPlaying, setIsPlaying] = useState(true)

  const advance = useCallback(() => {
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) {
        setNowPlaying((np) => ({ ...np, elapsed: 0 }))
        return prevQueue
      }
      const [next, ...rest] = prevQueue
      setNowPlaying({
        song: next.song,
        elapsed: 0,
        requestedBy: next.requestedBy,
      })
      return rest
    })
  }, [])

  // Reloj de reproducción
  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(() => {
      setNowPlaying((np) => {
        if (np.elapsed + 1 >= np.song.duration) {
          // avanzar en el siguiente tick para evitar setState anidado raro
          queueMicrotask(advance)
          return { ...np, elapsed: np.song.duration }
        }
        return { ...np, elapsed: np.elapsed + 1 }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [isPlaying, advance])

  const addSong = useCallback(
    (song: Song) => {
      const entryId = `req-${entryCounter++}`
      setQueue((prev) => [
        ...prev,
        { entryId, song, requestedBy: currentUser, mine: true },
      ])
      return entryId
    },
    [currentUser],
  )

  const removeFromQueue = useCallback((entryId: string) => {
    setQueue((prev) => prev.filter((q) => q.entryId !== entryId))
  }, [])

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), [])
  const skip = useCallback(() => advance(), [advance])

  const myRequests = useMemo<MyRequest[]>(() => {
    const remainingNow = Math.max(
      0,
      nowPlaying.song.duration - nowPlaying.elapsed,
    )
    let cumulative = remainingNow
    const result: MyRequest[] = []
    queue.forEach((item, index) => {
      if (item.mine) {
        result.push({
          entryId: item.entryId,
          song: item.song,
          position: index + 1,
          waitSeconds: cumulative,
        })
      }
      cumulative += item.song.duration
    })
    return result
  }, [queue, nowPlaying])

  const value = useMemo<MusicContextValue>(
    () => ({
      nowPlaying,
      queue,
      isPlaying,
      currentUser,
      addSong,
      removeFromQueue,
      togglePlay,
      skip,
      myRequests,
    }),
    [
      nowPlaying,
      queue,
      isPlaying,
      currentUser,
      addSong,
      removeFromQueue,
      togglePlay,
      skip,
      myRequests,
    ],
  )

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
}

export function useMusic() {
  const ctx = useContext(MusicContext)
  if (!ctx) throw new Error('useMusic debe usarse dentro de <MusicProvider>')
  return ctx
}
