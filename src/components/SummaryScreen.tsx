import { useState, useCallback, useRef } from 'react'
import MemberAvatar from './MemberAvatar'
import PaidToggle from './PaidToggle'
import QtyButton from './QtyButton'
import StatCard from './StatCard'
import { Member, Order, MenuItem, getMemberTotal, getMemberItemCount } from '../types'

interface Props {
  members: Member[]
  orders: Order[]
  menuItems: MenuItem[]
  onClose: () => void
  onNewDay: () => void
  onUpdateOrderItems: (orderId: string, memberId: string, items: Record<string, number>) => Promise<void>
  onTogglePaid: (memberId: string) => void
}

export default function SummaryScreen({
  members,
  orders,
  menuItems,
  onClose,
  onNewDay,
  onUpdateOrderItems,
  onTogglePaid,
}: Props) {
  // Local optimistic items state — keyed by order ID
  const [localItems, setLocalItems] = useState<Record<string, Record<string, number>>>(() =>
    Object.fromEntries(orders.map((o) => [o.id, { ...o.items }]))
  )

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const getItems = (order: Order) => localItems[order.id] ?? order.items

  const handleQtyChange = useCallback(
    (order: Order, itemName: string, newQty: number) => {
      const qty = Math.max(0, newQty)

      // Optimistic update
      setLocalItems((prev) => ({
        ...prev,
        [order.id]: { ...prev[order.id], [itemName]: qty },
      }))

      // Debounced persist
      clearTimeout(debounceTimers.current[order.id])
      debounceTimers.current[order.id] = setTimeout(() => {
        const updatedItems = { ...localItems[order.id], [itemName]: qty }
        // Remove zero-qty items before saving
        const cleaned = Object.fromEntries(
          Object.entries(updatedItems).filter(([, v]) => v > 0)
        )
        onUpdateOrderItems(order.id, order.member_id, cleaned)
      }, 400)
    },
    [localItems, onUpdateOrderItems]
  )

  const computeTotal = (order: Order) => {
    const items = getItems(order)
    return menuItems.reduce((sum, mi) => sum + (items[mi.name] || 0) * mi.price, 0)
  }

  const grandTotal = orders.reduce((sum, o) => sum + computeTotal(o), 0)
  const paidTotal = orders.filter((o) => o.paid).reduce((sum, o) => sum + computeTotal(o), 0)
  const unpaidTotal = grandTotal - paidTotal
  const paidMembers = orders.filter((o) => o.paid)
  const unpaidMembers = orders.filter((o) => getMemberItemCount(o) > 0 && !o.paid)

  // Aggregated item breakdown
  const itemAgg: Record<string, { item: MenuItem; qty: number }> = {}
  for (const order of orders) {
    const items = getItems(order)
    for (const [name, qty] of Object.entries(items)) {
      if (qty > 0) {
        const mi = menuItems.find((m) => m.name === name)
        if (!mi) continue
        if (!itemAgg[name]) itemAgg[name] = { item: mi, qty: 0 }
        itemAgg[name].qty += qty
      }
    }
  }

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#FFFDF7',
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 100px' }}>
        {/* Header */}
        <div
          className="animate-fade-in-up"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>🧾</span>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#3d1a06', margin: 0 }}>
                Final Order Summary
              </h1>
            </div>
            <p style={{ margin: '4px 0 0 38px', color: '#9d7a5a', fontSize: 13 }}>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              border: '1.5px solid #e2d5c3',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: '#8B4513',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff7ed' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
          >
            ← Back
          </button>
        </div>

        {/* Stats */}
        <div
          className="animate-fade-in-up"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))',
            gap: 12,
            marginBottom: 28,
            animationDelay: '50ms',
          }}
        >
          <StatCard label="Total Members" value={members.length} color="#8B4513" animDelay={0} />
          <StatCard label="Orders Placed" value={orders.filter(o => getMemberItemCount(o) > 0).length} color="#FF9800" animDelay={50} />
          <StatCard label="Paid Members" value={paidMembers.length} color="#22c55e" animDelay={100} />
          <StatCard label="Pending" value={unpaidMembers.length} color="#ef4444" animDelay={150} />
        </div>

        {/* Item Breakdown */}
        <div
          className="animate-fade-in-up"
          style={{
            background: '#fff',
            border: '1.5px solid #f0e6d6',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 20,
            animationDelay: '100ms',
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#3d1a06' }}>
            🛒 Item Breakdown
          </h2>
          {Object.keys(itemAgg).length === 0 ? (
            <p style={{ color: '#9d7a5a', margin: 0 }}>No items ordered.</p>
          ) : (
            Object.values(itemAgg).map(({ item, qty }) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid #f5ede0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontWeight: 600, color: '#3d1a06', fontSize: 14 }}>
                    {item.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <span
                    style={{
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: 8,
                      padding: '3px 10px',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#c2410c',
                    }}
                  >
                    ×{qty}
                  </span>
                  <span style={{ fontWeight: 700, color: '#8B4513', fontSize: 14, minWidth: 60, textAlign: 'right' }}>
                    ₹{(qty * item.price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Collected / Pending */}
        <div
          className="animate-fade-in-up"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, animationDelay: '150ms' }}
        >
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>✓ COLLECTED</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#15803d' }}>₹{paidTotal.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>
              {paidMembers.map((o) => o.member_name).join(', ') || '—'}
            </div>
          </div>
          <div style={{ background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>✗ PENDING</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#b91c1c' }}>₹{unpaidTotal.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
              {unpaidMembers.map((o) => o.member_name).join(', ') || '—'}
            </div>
          </div>
        </div>

        {/* Grand Total banner */}
        <div
          className="animate-fade-in-up"
          style={{
            background: 'linear-gradient(135deg,#8B4513,#c0522a)',
            borderRadius: 16,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            animationDelay: '200ms',
          }}
        >
          <span style={{ color: '#fde8d0', fontWeight: 700, fontSize: 15 }}>Grand Total</span>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 28 }}>
            ₹{grandTotal.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Per Person — with inline +/- editing */}
        <div
          className="animate-fade-in-up"
          style={{
            background: '#fff',
            border: '1.5px solid #f0e6d6',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 28,
            animationDelay: '250ms',
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#3d1a06' }}>
            👥 Per Person
          </h2>
          {orders.filter((o) => getMemberItemCount(o) > 0).map((order) => {
            const items = getItems(order)
            const total = computeTotal(order)
            const activeItems = Object.entries(items).filter(([, q]) => q > 0)

            return (
              <div
                key={order.id}
                className="animate-fade-in-up"
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #f5ede0',
                }}
              >
                {/* Member header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MemberAvatar name={order.member_name} size={30} />
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#3d1a06' }}>
                      {order.member_name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PaidToggle
                      paid={order.paid}
                      onChange={() => onTogglePaid(order.member_id)}
                    />
                    <span style={{ fontWeight: 700, color: '#8B4513', fontSize: 14 }}>
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Item rows with inline +/- */}
                <div style={{ paddingLeft: 40 }}>
                  {activeItems.map(([itemName, qty]) => {
                    const menuItem = menuItems.find((m) => m.name === itemName)
                    if (!menuItem) return null
                    return (
                      <div
                        key={itemName}
                        className="animate-fade-in"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 15 }}>{menuItem.icon}</span>
                          <span style={{ fontSize: 13, color: '#3d1a06', fontWeight: 500 }}>{itemName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {/* Inline stepper */}
                          <QtyButton
                            onClick={() => handleQtyChange(order, itemName, qty - 1)}
                            disabled={qty <= 0}
                            size={24}
                          >
                            −
                          </QtyButton>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              color: '#8B4513',
                              minWidth: 20,
                              textAlign: 'center',
                            }}
                          >
                            {qty}
                          </span>
                          <QtyButton
                            onClick={() => handleQtyChange(order, itemName, qty + 1)}
                            size={24}
                          >
                            +
                          </QtyButton>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#9d7a5a',
                              minWidth: 50,
                              textAlign: 'right',
                            }}
                          >
                            ₹{(qty * menuItem.price).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => window.print()}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 12,
              border: '1.5px solid #e2d5c3',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 15,
              color: '#8B4513',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff7ed' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
          >
            🖨 Print Summary
          </button>
          <button
            onClick={onNewDay}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg,#8B4513,#c0522a)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 15,
              color: '#fff',
              fontFamily: 'inherit',
            }}
          >
            🔄 New Day
          </button>
        </div>
      </div>
    </div>
  )
}
