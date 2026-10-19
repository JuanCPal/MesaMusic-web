export const NAME_MAX_LENGTH = 30
export const PARTICIPANT_NAME_KEY = 'mesamusic-participant-name'

const RESERVED_NAMES = ['la casa', 'alguien']

// Todas con contraste >= 4.5:1 contra texto blanco y distintas de los colores de marca.
export const AVATAR_PALETTE = [
  '#be123c',
  '#c2410c',
  '#b45309',
  '#15803d',
  '#0f766e',
  '#0369a1',
  '#4338ca',
  '#7e22ce',
] as const

export function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

/** Minúsculas, sin tildes ni espacios sobrantes: base para comparar y colorear. */
export function normalizeName(raw: string): string {
  return cleanName(raw)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

export function isReservedName(raw: string): boolean {
  return RESERVED_NAMES.includes(normalizeName(raw))
}

/** Devuelve el mensaje de error, o null si el nombre es válido. */
export function validateName(raw: string): string | null {
  const name = cleanName(raw)
  if (!name) return 'Escribe tu nombre para continuar.'
  if (name.length > NAME_MAX_LENGTH) {
    return `El nombre no puede pasar de ${NAME_MAX_LENGTH} caracteres.`
  }
  if (isReservedName(name)) return 'Ese nombre está reservado, elige otro.'
  return null
}

export function loadParticipantName(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(PARTICIPANT_NAME_KEY)
    return stored && validateName(stored) === null ? cleanName(stored) : null
  } catch {
    return null
  }
}

export function saveParticipantName(name: string) {
  try {
    window.localStorage.setItem(PARTICIPANT_NAME_KEY, name)
  } catch {
    // sin almacenamiento disponible: el nombre vale solo para esta carga
  }
}

/** Primer carácter visible (grafema, así soporta tildes y emojis), en mayúscula. */
export function getInitial(raw: string): string {
  const name = cleanName(raw)
  if (!name) return '?'
  let first: string
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    first = segmenter.segment(name)[Symbol.iterator]().next().value?.segment ?? ''
  } else {
    first = Array.from(name)[0] ?? ''
  }
  return first ? first.toLocaleUpperCase() : '?'
}

/** Color determinista (FNV-1a sobre el nombre normalizado). */
export function getAvatarColor(raw: string): string {
  const key = normalizeName(raw)
  let hash = 2166136261
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return AVATAR_PALETTE[(hash >>> 0) % AVATAR_PALETTE.length]
}
