interface Props {
  paid: boolean
  onChange: () => void
  disabled?: boolean
}

/** Green/red slide toggle — exact visual replica of original app */
export default function PaidToggle({ paid, onChange, disabled = false }: Props) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      aria-pressed={paid}
      aria-label={paid ? 'Mark as unpaid' : 'Mark as paid'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 12,
        fontWeight: 600,
        background: paid ? '#dcfce7' : '#fee2e2',
        color: paid ? '#16a34a' : '#dc2626',
        transition: 'background 0.2s ease, color 0.2s ease',
        opacity: disabled ? 0.6 : 1,
        fontFamily: 'inherit',
      }}
    >
      {/* Track */}
      <span
        className="toggle-track"
        style={{
          width: 28,
          height: 16,
          borderRadius: 8,
          background: paid ? '#22c55e' : '#ef4444',
          position: 'relative',
          flexShrink: 0,
          display: 'inline-block',
        }}
      >
        {/* Thumb */}
        <span
          className="toggle-thumb"
          style={{
            position: 'absolute',
            top: 2,
            left: paid ? 14 : 2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </span>
      {paid ? '✓ Paid' : '✗ Unpaid'}
    </button>
  )
}
