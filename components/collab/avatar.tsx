import { House, User } from 'lucide-react'
import { getAvatarColor, getInitial, normalizeName } from '@/lib/participant'

type AvatarProps = {
  name: string
  /** lado del círculo en px */
  size?: number
  className?: string
}

export function Avatar({ name, size = 16, className = '' }: AvatarProps) {
  const normalized = normalizeName(name)
  const neutral = normalized === 'la casa' || normalized === 'alguien' || normalized === ''
  const base =
    'inline-flex flex-none select-none items-center justify-center rounded-full align-middle font-semibold leading-none'

  if (neutral) {
    const Icon = normalized === 'la casa' ? House : User
    return (
      <span
        aria-hidden="true"
        className={`${base} bg-muted text-muted-foreground ${className}`}
        style={{ width: size, height: size }}
      >
        <Icon style={{ width: size * 0.6, height: size * 0.6 }} />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`${base} text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        backgroundColor: getAvatarColor(name),
      }}
    >
      {getInitial(name)}
    </span>
  )
}
