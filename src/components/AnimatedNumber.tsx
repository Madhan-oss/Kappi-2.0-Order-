import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  prefix?: string
  suffix?: string
  className?: string
}

/** Animated counter — smoothly tweens to new numeric values with an easing curve */
export default function AnimatedNumber({ value, prefix = '', suffix = '', className }: Props) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (prev.current === value) return
    const from = prev.current
    const to = value
    const diff = to - from
    const start = performance.now()
    const duration = 350

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + diff * eased))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(to)
        prev.current = to
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value])

  return (
    <span className={className}>
      {prefix}{display.toLocaleString('en-IN')}{suffix}
    </span>
  )
}
