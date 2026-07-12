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

/** Catálogo de ejemplo simulando resultados de búsqueda */
export const CATALOG: Song[] = [
  {
    id: 's1',
    title: 'Luces de Neón',
    channel: 'Lumina Collective',
    duration: 222,
    thumbnail: '/covers/cover-1.png',
  },
  {
    id: 's2',
    title: 'Ámbar',
    channel: 'Vera Solís',
    duration: 198,
    thumbnail: '/covers/cover-2.png',
  },
  {
    id: 's3',
    title: 'Marea Líquida',
    channel: 'Nocturno',
    duration: 305,
    thumbnail: '/covers/cover-3.png',
  },
  {
    id: 's4',
    title: 'Cinta de Verano',
    channel: 'Los Analógicos',
    duration: 176,
    thumbnail: '/covers/cover-4.png',
  },
  {
    id: 's5',
    title: 'Carretera Dorada',
    channel: 'Río Abajo',
    duration: 241,
    thumbnail: '/covers/cover-5.png',
  },
  {
    id: 's6',
    title: 'Giro de Vinilo',
    channel: 'Sala 45',
    duration: 267,
    thumbnail: '/covers/cover-6.png',
  },
  {
    id: 's7',
    title: 'Formas Simples',
    channel: 'Bauhaus Sound',
    duration: 189,
    thumbnail: '/covers/cover-7.png',
  },
  {
    id: 's8',
    title: 'Calles Mojadas',
    channel: 'MC Reflejo',
    duration: 213,
    thumbnail: '/covers/cover-8.png',
  },
  {
    id: 's9',
    title: 'Horizonte Violeta',
    channel: 'Lumina Collective',
    duration: 254,
    thumbnail: '/covers/cover-1.png',
  },
  {
    id: 's10',
    title: 'Susurro',
    channel: 'Vera Solís',
    duration: 167,
    thumbnail: '/covers/cover-2.png',
  },
  {
    id: 's11',
    title: 'Corriente Profunda',
    channel: 'Nocturno',
    duration: 298,
    thumbnail: '/covers/cover-3.png',
  },
  {
    id: 's12',
    title: 'Radio Fantasma',
    channel: 'Los Analógicos',
    duration: 205,
    thumbnail: '/covers/cover-4.png',
  },
]
