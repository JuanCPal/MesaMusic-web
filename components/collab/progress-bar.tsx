import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/music'

type ProgressBarProps = {
  elapsed: number
  duration: number
  showTimes?: boolean
  className?: string
  barClassName?: string
}

export function ProgressBar({
  elapsed,
  duration,
  showTimes = true,
  className,
  barClassName,
}: ProgressBarProps) {
  const pct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0
  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative h-1.5 w-full overflow-hidden rounded-full bg-muted',
          barClassName,
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={Math.round(elapsed)}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showTimes ? (
        <div className="mt-1.5 flex justify-between font-mono text-xs text-muted-foreground">
          <span>{formatDuration(elapsed)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      ) : null}
    </div>
  )
}
