export type Song = {
  id: string
  title: string
  channel: string
  /** duración en segundos */
  duration: number
  thumbnail: string
}

export type QueueItem = {
  /** id único de la entrada en cola (una canción puede repetirse) */
  entryId: string
  song: Song
  /** nombre de quien la pidió */
  requestedBy: string
  /** true si la agregó el usuario actual en este dispositivo */
  mine: boolean
}

/** Formatea segundos a m:ss */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Formatea una espera larga a un texto legible (ej. "6 min", "45 s") */
export function formatWait(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'ya casi'
  if (totalSeconds < 60) return `${Math.ceil(totalSeconds)} s`
  const m = Math.round(totalSeconds / 60)
  return `${m} min`
}
