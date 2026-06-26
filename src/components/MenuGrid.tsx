import { useState, useRef } from 'react'
import QtyButton from './QtyButton'
import { MenuItem } from '../types'

interface Props {
  menuItems: MenuItem[]
  quantities: Record<string, number> // { itemName: qty }
  onQuantityChange: (itemName: string, qty: number) => void
  memberSelected: boolean
  onAddMenuItem: (name: string, price: number, icon: string) => Promise<void>
}

export default function MenuGrid({
  menuItems,
  quantities,
  onQuantityChange,
  memberSelected,
  onAddMenuItem,
}: Props) {
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [saving, setSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    const name = newName.trim()
    const price = parseFloat(newPrice)
    if (!name || isNaN(price) || price <= 0) return
    setSaving(true)
    try {
      await onAddMenuItem(name, price, newIcon.trim() || '🍽️')
      setNewName('')
      setNewPrice('')
      setNewIcon('')
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}
        className="stagger-children"
      >
        {menuItems.map((item, idx) => {
          const qty = quantities[item.name] || 0
          const isActive = qty > 0

          return (
            <div
              key={item.id}
              className="menu-card animate-fade-in-up"
              style={{
                background: '#fff',
                border: `1.5px solid ${isActive ? '#d97706' : '#f0e6d6'}`,
                borderRadius: 14,
                padding: '14px 16px',
                boxShadow: isActive ? '0 2px 12px rgba(139,69,19,0.10)' : 'none',
                animationDelay: `${idx * 40}ms`,
              }}
            >
              {/* Item info row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#3d1a06' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#9d7a5a' }}>₹{item.price}</div>
                </div>
                {isActive && (
                  <div
                    className="animate-scale-in"
                    style={{
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: 8,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#c2410c',
                    }}
                  >
                    ₹{qty * item.price}
                  </div>
                )}
              </div>

              {/* Qty stepper */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <QtyButton
                  onClick={() => onQuantityChange(item.name, qty - 1)}
                  disabled={qty === 0 || !memberSelected}
                >
                  −
                </QtyButton>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 16,
                    color: qty > 0 ? '#8B4513' : '#c4b8a4',
                    minWidth: 24,
                    textAlign: 'center',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {qty}
                </span>
                <QtyButton
                  onClick={() => onQuantityChange(item.name, qty + 1)}
                  disabled={!memberSelected}
                >
                  +
                </QtyButton>
              </div>
            </div>
          )
        })}

        {/* "+ Add Item" card — only shown when a member is selected */}
        {memberSelected && (
          <button
            onClick={() => setShowModal(true)}
            className="menu-card animate-fade-in-up"
            style={{
              background: '#fff',
              border: '1.5px dashed #d2b48c',
              borderRadius: 14,
              padding: '14px 16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 120,
              color: '#9d7a5a',
              fontFamily: 'inherit',
              animationDelay: `${menuItems.length * 40}ms`,
              transition: 'border-color 0.2s ease, color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.borderColor = '#8B4513'
              el.style.color = '#8B4513'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.borderColor = '#d2b48c'
              el.style.color = '#9d7a5a'
            }}
          >
            <div style={{ fontSize: 28, lineHeight: 1 }}>+</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Add Item</div>
          </button>
        )}
      </div>

      {/* Add Item Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop blur */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(61,26,6,0.35)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Modal card */}
          <div
            className="animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: '#fff',
              borderRadius: 20,
              padding: '28px 28px 24px',
              width: '100%',
              maxWidth: 380,
              boxShadow: '0 24px 64px rgba(61,26,6,0.22)',
              border: '1.5px solid #f0e6d6',
            }}
          >
            <h2
              style={{
                margin: '0 0 20px',
                fontSize: 17,
                fontWeight: 800,
                color: '#3d1a06',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              🍽️ Add New Menu Item
            </h2>

            {/* Item Name */}
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9d7a5a', display: 'block', marginBottom: 4 }}>
              Item Name *
            </label>
            <input
              ref={nameRef}
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Samosa"
              className="kappi-input"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1.5px solid #e2d5c3',
                fontSize: 14,
                background: '#fdf8f3',
                color: '#3d1a06',
                fontFamily: 'inherit',
                marginBottom: 14,
                boxSizing: 'border-box',
              }}
            />

            {/* Price */}
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9d7a5a', display: 'block', marginBottom: 4 }}>
              Price (₹) *
            </label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="e.g. 25"
              className="kappi-input"
              min={1}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1.5px solid #e2d5c3',
                fontSize: 14,
                background: '#fdf8f3',
                color: '#3d1a06',
                fontFamily: 'inherit',
                marginBottom: 14,
                boxSizing: 'border-box',
              }}
            />

            {/* Icon */}
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9d7a5a', display: 'block', marginBottom: 4 }}>
              Icon (emoji, optional)
            </label>
            <input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              placeholder="🍽️"
              className="kappi-input"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: '1.5px solid #e2d5c3',
                fontSize: 20,
                background: '#fdf8f3',
                color: '#3d1a06',
                fontFamily: 'inherit',
                marginBottom: 20,
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: '1.5px solid #e2d5c3',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#8B4513',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !newName.trim() || !newPrice}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  background: saving ? '#c4b8a4' : 'linear-gradient(135deg,#8B4513,#c0522a)',
                  cursor: saving ? 'default' : 'pointer',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#fff',
                  fontFamily: 'inherit',
                  transition: 'opacity 0.15s',
                }}
              >
                {saving ? '⏳ Adding…' : '+ Add to Menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
