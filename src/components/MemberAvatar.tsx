// Deterministic color palette — same colors as original compiled app
const PALETTE = [
  '#8B4513', '#c0522a', '#a0420d', '#6b3410',
  '#b8611f', '#905020', '#7a3a18', '#cd6020',
]

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function avatarColor(name: string): string {
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return PALETTE[hash % PALETTE.length]
}

interface Props {
  name: string
  size?: number
  className?: string
}

export default function MemberAvatar({ name, size = 40, className = '' }: Props) {
  const bg = avatarColor(name)
  const fontSize = Math.round(size * 0.38)

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize,
        letterSpacing: '0.02em',
      }}
    >
      {initials(name)}
    </div>
  )
}
