import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface IconProps {
  className?: string
  style?: React.CSSProperties
  src: string
}

export function Icon({ className, style, src }: IconProps): ReactNode {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block size-4 bg-current', className)}
      role="img"
      style={{
        maskImage: `url(${src})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        ...style,
      }}
    />
  )
}
