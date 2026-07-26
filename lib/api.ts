import type { QueueItem, Song } from './music'

// Configurables vía .env.local — ver .env.local.example
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8080'

// --- Formas crudas tal como las devuelve el backend Go (internal/models) ---

type BackendSong = {
  videoId: string
  title: string
  channel: string
  thumbnail: string
  durationSeconds: number
}

export type Session = {
  id: string
  name: string
  status: 'active' | 'ended'
  joinUrl: string
}

export type BackendQueueItem = {
  id: string
  song: BackendSong
  addedAt: string
  isBackup: boolean
}

export type BackendQueueState = {
  nowPlaying: BackendQueueItem | null
  queue: BackendQueueItem[]
  estimatedWaitSecs: number[]
}

export const EMPTY_STATE: BackendQueueState = {
  nowPlaying: null,
  queue: [],
  estimatedWaitSecs: [],
}

// --- Adaptadores: forma del backend -> forma que ya esperan los componentes ---

export function toSong(s: BackendSong): Song {
  return {
    id: s.videoId,
    title: s.title,
    channel: s.channel,
    duration: s.durationSeconds,
    thumbnail: s.thumbnail || '/placeholder.svg',
  }
}

export function toQueueItem(item: BackendQueueItem, mineIds: Set<string>): QueueItem {
  return {
    entryId: item.id,
    song: toSong(item.song),
    requestedBy: 'Alguien',
    mine: mineIds.has(item.id),
  }
}

// --- REST ---

export async function searchSongs(query: string, signal?: AbortSignal): Promise<Song[]> {
  const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`, {
    signal,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Error buscando canciones')
  }
  const data: { results: BackendSong[] } = await res.json()
  return data.results.map(toSong)
}

export async function createSession(name: string): Promise<Session> {
  const res = await fetch(`${API_BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Error creando la sesión')
  }
  return res.json()
}

export async function getSession(sessionId: string): Promise<Session> {
  const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`)
  if (!res.ok) throw new Error('Sesión no encontrada')
  return res.json()
}

export function getQrImageUrl(sessionId: string): string {
  return `${API_BASE_URL}/api/sessions/${sessionId}/qr`
}

export async function addSongToQueue(
  sessionId: string,
  videoId: string,
): Promise<BackendQueueItem> {
  const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Error agregando la canción a la cola')
  }
  return res.json()
}

export async function fetchQueueState(sessionId: string): Promise<BackendQueueState> {
  const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/queue`)
  if (!res.ok) throw new Error('Error obteniendo el estado de la cola')
  return res.json()
}

export async function skipCurrentTrack(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/skip`, {
    method: 'POST',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Error saltando la canción actual')
  }
}

export async function removeQueueItem(sessionId: string, itemId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/queue/${itemId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Error eliminando la canción de la cola')
  }
}

// --- WebSocket ---

function wsUrlFor(sessionId: string): string {
  return `${API_BASE_URL.replace(/^http/, 'ws')}/api/sessions/${sessionId}/ws`
}

/**
 * Abre la conexión de tiempo real. onState se llama con cada actualización
 * que el backend transmite cuando la cola cambia.
 */
export function connectQueueSocket(
  sessionId: string,
  onState: (state: BackendQueueState) => void,
): WebSocket {
  const socket = new WebSocket(wsUrlFor(sessionId))

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'queueState' && msg.state) {
        onState(msg.state as BackendQueueState)
      }
    } catch {
      // ignoramos mensajes que no sean JSON válido
    }
  }

  return socket
}

/** Avisa al backend que la canción actual terminó, para que avance la cola. */
export function notifyEnded(socket: WebSocket | null) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'ended' }))
  }
}
