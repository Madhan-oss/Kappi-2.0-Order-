import { ReactNode } from 'react'

interface Props {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  size?: number
}

/**
 * Circular quantity stepper button — exact replica of original app's `ce` component.
 * Used both in the menu grid and in SummaryScreen inline editing.
 */
export default function QtyButton({ onClick, disabled = false, children, size = 28 }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="qty-btn"
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        border: '1.5px solid #e2d5c3',
        background: disabled ? '#f5f0e8' : '#fff',
        cursor: disabled ? 'default' : 'pointer',
        fontWeight: 700,
        fontSize: 16,
        color: disabled ? '#c4b8a4' : '#8B4513',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s ease, transform 0.1s ease, border-color 0.15s ease',
        lineHeight: 1,
        flexShrink: 0,
        fontFamily: 'inherit',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = '#8B4513'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2d5c3'
      }}
    >
      {children}
    </button>
  )
}
