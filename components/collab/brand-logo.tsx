import Image from 'next/image'

const LOGO_VARIANTS = {
  default: {
    src: '/logo-ui-v1.svg',
    alt: 'MesaMusic',
  },
} as const

export type BrandLogoVariant = keyof typeof LOGO_VARIANTS

type BrandLogoProps = {
  className?: string
  variant?: BrandLogoVariant
}

export function BrandLogo({ className = '', variant = 'default' }: BrandLogoProps) {
  const logo = LOGO_VARIANTS[variant]

  return (
    <span className={`relative inline-flex shrink-0 overflow-hidden ${className}`}>
      <Image
        src={logo.src}
        alt={logo.alt}
        fill
        unoptimized
        className="object-contain"
      />
    </span>
  )
}