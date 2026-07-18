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
import type { QueueItem, Song } from '@/lib/music'
import {
  EMPTY_STATE,
  addSongToQueue,
  connectQueueSocket,
  fetchQueueState,
  notifyEnded,
  toQueueItem,
  toSong,
  type BackendQueueState,
} from '@/lib/api'

type NowPlaying = {
  song: Song
  requestedBy: string
  isBackup: boolean
} | null

type MyRequest = {
  entryId: string
  song: Song
  /** posición dentro de la cola (1 = siguiente) */
  position: number
  /** segundos estimados hasta que suene, calculados por el backend */
  waitSeconds: number
}

type MusicContextValue = {
  nowPlaying: NowPlaying
  /** segundos transcurridos, aproximado — el panel usa el tiempo real del player */
  elapsed: number
  queue: QueueItem[]
  /** true si el WebSocket está conectado */
  connected: boolean
  addSong: (song: Song, mesa?: string) => Promise<void>
  /** avisa al backend que la canción actual terminó / debe saltarse */
  reportEnded: () => void
  myRequests: MyRequest[]
}

const MusicContext = createContext<MusicContextValue | null>(null)
const MINE_IDS_KEY = 'sintonia-mine-ids'

function loadMineIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(MINE_IDS_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveMineIds(ids: Set<string>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MINE_IDS_KEY, JSON.stringify([...ids]))
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [rawState, setRawState] = useState<BackendQueueState>(EMPTY_STATE)
  const [connected, setConnected] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const mineIdsRef = useRef<Set<string>>(loadMineIds())
  const socketRef = useRef<WebSocket | null>(null)
  const currentEntryIdRef = useRef<string | null>(null)

  // Carga el estado inicial por REST y abre el WebSocket para las actualizaciones en vivo.
  useEffect(() => {
    let cancelled = false

    fetchQueueState()
      .then((state) => {
        if (!cancelled) setRawState(state)
      })
      .catch(() => {
        // si falla la carga inicial, el WebSocket eventualmente trae el estado igual
      })

    const socket = connectQueueSocket((state) => setRawState(state))
    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)
    socket.onerror = () => setConnected(false)
    socketRef.current = socket

    return () => {
      cancelled = true
      socket.close()
      socketRef.current = null
    }
  }, [])

  // Reloj visual local (solo para la barra de progreso del cliente): se
  // reinicia cada vez que cambia la entrada que está sonando.
  useEffect(() => {
    const entryId = rawState.nowPlaying?.id ?? null
    if (entryId !== currentEntryIdRef.current) {
      currentEntryIdRef.current = entryId
      setElapsed(0)
    }
  }, [rawState.nowPlaying?.id])

  useEffect(() => {
    const duration = rawState.nowPlaying?.song.durationSeconds
    if (!duration) return
    const timer = setInterval(() => {
      setElapsed((prev) => (prev + 1 >= duration ? duration : prev + 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [rawState.nowPlaying?.id, rawState.nowPlaying?.song.durationSeconds])

  const nowPlaying = useMemo<NowPlaying>(() => {
    if (!rawState.nowPlaying) return null
    return {
      song: toSong(rawState.nowPlaying.song),
      requestedBy:
        rawState.nowPlaying.mesa && rawState.nowPlaying.mesa.trim()
          ? rawState.nowPlaying.mesa.trim()
          : 'la casa',
      isBackup: rawState.nowPlaying.isBackup,
    }
  }, [rawState.nowPlaying])

  const queue = useMemo<QueueItem[]>(
    () => rawState.queue.map((item) => toQueueItem(item, mineIdsRef.current)),
    [rawState.queue],
  )

  const myRequests = useMemo<MyRequest[]>(() => {
    const result: MyRequest[] = []
    rawState.queue.forEach((item, index) => {
      if (mineIdsRef.current.has(item.id)) {
        result.push({
          entryId: item.id,
          song: toSong(item.song),
          position: index + 1,
          waitSeconds: rawState.estimatedWaitSecs[index] ?? 0,
        })
      }
    })
    return result
  }, [rawState.queue, rawState.estimatedWaitSecs])

  const addSong = useCallback(async (song: Song, mesa?: string) => {
    const created = await addSongToQueue(song.id, mesa)
    mineIdsRef.current.add(created.id)
    saveMineIds(mineIdsRef.current)
    // No hace falta actualizar rawState manualmente: el backend hace
    // broadcast por WebSocket y ese mensaje trae el estado ya actualizado.
  }, [])

  const reportEnded = useCallback(() => {
    notifyEnded(socketRef.current)
  }, [])

  const value = useMemo<MusicContextValue>(
    () => ({ nowPlaying, elapsed, queue, connected, addSong, reportEnded, myRequests }),
    [nowPlaying, elapsed, queue, connected, addSong, reportEnded, myRequests],
  )

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
}

export function useMusic() {
  const ctx = useContext(MusicContext)
  if (!ctx) throw new Error('useMusic debe usarse dentro de <MusicProvider>')
  return ctx
}
