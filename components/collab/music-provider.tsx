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
  removeQueueItem,
  skipCurrentTrack,
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
  addSong: (song: Song) => Promise<void>
  skipCurrent: () => Promise<void>
  removeItem: (entryId: string) => Promise<void>
  /** avisa al backend que la canción actual terminó / debe saltarse */
  reportEnded: () => void
  myRequests: MyRequest[]
}

const MusicContext = createContext<MusicContextValue | null>(null)
const MINE_IDS_KEY = 'mesamusic-mine-ids'

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

export function MusicProvider({
  sessionId,
  children,
}: {
  sessionId: string
  children: React.ReactNode
}) {
  const [rawState, setRawState] = useState<BackendQueueState>(EMPTY_STATE)
  const [connected, setConnected] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const mineIdsRef = useRef<Set<string>>(loadMineIds())
  const socketRef = useRef<WebSocket | null>(null)
  const currentEntryIdRef = useRef<string | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)

  // Carga el estado inicial por REST y abre el WebSocket para las actualizaciones en vivo.
  useEffect(() => {
    let cancelled = false

    const syncState = () => {
      fetchQueueState(sessionId)
        .then((state) => {
          if (!cancelled) setRawState(state)
        })
        .catch(() => {
          // si falla la carga por REST, el WebSocket puede traer el estado luego
        })
    }

    const scheduleReconnect = () => {
      if (cancelled || reconnectTimerRef.current) return
      const delayMs = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 10000)
      reconnectAttemptsRef.current += 1
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null
        connectSocket()
      }, delayMs)
    }

    const connectSocket = () => {
      if (cancelled) return
      const socket = connectQueueSocket(sessionId, (state) => setRawState(state))
      socketRef.current = socket

      socket.onopen = () => {
        if (cancelled) return
        reconnectAttemptsRef.current = 0
        setConnected(true)
        syncState()
      }
      socket.onclose = () => {
        if (cancelled) return
        setConnected(false)
        scheduleReconnect()
      }
      socket.onerror = () => {
        if (cancelled) return
        setConnected(false)
      }
    }

    syncState()
    connectSocket()

    return () => {
      cancelled = true
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [sessionId])

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
      requestedBy: 'la casa',
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

  const addSong = useCallback(async (song: Song) => {
    const created = await addSongToQueue(sessionId, song.id)
    mineIdsRef.current.add(created.id)
    saveMineIds(mineIdsRef.current)
    // No hace falta actualizar rawState manualmente: el backend hace
    // broadcast por WebSocket y ese mensaje trae el estado ya actualizado.
  }, [sessionId])

  const skipCurrent = useCallback(async () => {
    await skipCurrentTrack(sessionId)
    // No hace falta actualizar rawState manualmente: el estado llega por WebSocket.
  }, [sessionId])

  const removeItem = useCallback(async (entryId: string) => {
    await removeQueueItem(sessionId, entryId)
    // No hace falta actualizar rawState manualmente: el estado llega por WebSocket.
  }, [sessionId])

  const reportEnded = useCallback(() => {
    notifyEnded(socketRef.current)
  }, [])

  const value = useMemo<MusicContextValue>(
    () => ({
      nowPlaying,
      elapsed,
      queue,
      connected,
      addSong,
      skipCurrent,
      removeItem,
      reportEnded,
      myRequests,
    }),
    [
      nowPlaying,
      elapsed,
      queue,
      connected,
      addSong,
      skipCurrent,
      removeItem,
      reportEnded,
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
