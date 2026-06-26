import AnimatedNumber from './AnimatedNumber'

interface Props {
  label: string
  value: number
  color: string
  prefix?: string
  subtitle?: string
  icon?: string
  animDelay?: number
}

/**
 * Analytics / summary stat card — matching the existing SummaryScreen card style.
 * Reused in Analytics tab, Payment page bottom bar, and SummaryScreen header.
 */
export default function StatCard({
  label,
  value,
  color,
  prefix = '',
  subtitle,
  icon,
  animDelay = 0,
}: Props) {
  return (
    <div
      className="animate-fade-in-up"
      style={{
        background: '#fff',
        border: '1.5px solid #f0e6d6',
        borderRadius: 14,
        padding: '16px 18px',
        textAlign: 'center',
        animationDelay: `${animDelay}ms`,
      }}
    >
      {icon && <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>}
      <div style={{ fontSize: 26, fontWeight: 800, color }}>
        <AnimatedNumber value={value} prefix={prefix} />
      </div>
      <div style={{ fontSize: 11, color: '#9d7a5a', marginTop: 2, fontWeight: 500 }}>
        {label}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: '#c4b8a4', marginTop: 2 }}>{subtitle}</div>
      )}
    </div>
  )
}
