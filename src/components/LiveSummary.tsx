import AnimatedNumber from './AnimatedNumber'
import { MenuItem, Order, getMemberTotal, getMemberItemCount } from '../types'

interface Props {
  orders: Order[]
  menuItems: MenuItem[]
  onGenerateSummary: () => void
  onNewDay: () => void
}

export default function LiveSummary({ orders, menuItems, onGenerateSummary, onNewDay }: Props) {
  const grandTotal = orders.reduce((sum, o) => sum + getMemberTotal(o, menuItems), 0)
  const paidCount = orders.filter((o) => o.paid).length
  const pendingCount = orders.filter((o) => getMemberItemCount(o) > 0 && !o.paid).length
  const ordersPlaced = orders.filter((o) => getMemberItemCount(o) > 0).length

  // Aggregate items across all orders
  const itemTotals: Record<string, { item: MenuItem; qty: number }> = {}
  for (const order of orders) {
    for (const [itemName, qty] of Object.entries(order.items)) {
      if (qty > 0) {
        const menuItem = menuItems.find((m) => m.name === itemName)
        if (!menuItem) continue
        if (!itemTotals[itemName]) itemTotals[itemName] = { item: menuItem, qty: 0 }
        itemTotals[itemName].qty += qty
      }
    }
  }
  const aggregated = Object.values(itemTotals)

  const stats = [
    { label: 'Members', val: orders.length + (orders.length === 0 ? 0 : 0), color: '#8B4513' },
    { label: 'Paid', val: paidCount, color: '#22c55e' },
    { label: 'Pending', val: pendingCount, color: '#ef4444' },
    { label: 'Orders', val: ordersPlaced, color: '#FF9800' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>📊</span>
        <span style={{ fontWeight: 800, fontSize: 15, color: '#3d1a06' }}>Live Summary</span>
      </div>

      {/* Stat grid */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: '#fff',
              border: '1px solid #f0e6d6',
              borderRadius: 10,
              padding: '10px 12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 18, color: s.color }}>
              <AnimatedNumber value={s.val} />
            </div>
            <div style={{ fontSize: 10, color: '#9d7a5a', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Item breakdown */}
      {aggregated.length === 0 ? (
        <div
          style={{ textAlign: 'center', padding: '20px 0', color: '#c4b8a4', fontSize: 13 }}
        >
          No items yet
        </div>
      ) : (
        aggregated.map(({ item, qty }) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 0',
              borderBottom: '1px solid #f5ede0',
            }}
          >
            <span style={{ fontSize: 14 }}>
              {item.icon}{' '}
              <span style={{ fontSize: 12, fontWeight: 600, color: '#3d1a06' }}>{item.name}</span>
            </span>
            <span style={{ fontWeight: 700, color: '#8B4513', fontSize: 13 }}>×{qty}</span>
          </div>
        ))
      )}

      {/* Grand total */}
      <div
        style={{
          marginTop: 16,
          padding: '14px 16px',
          background: 'linear-gradient(135deg,#8B4513,#c0522a)',
          borderRadius: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#fde8d0', fontSize: 13, fontWeight: 600 }}>Grand Total</span>
        <span style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>
          ₹<AnimatedNumber value={grandTotal} />
        </span>
      </div>

      {/* Actions */}
      <button
        onClick={onGenerateSummary}
        style={{
          marginTop: 12,
          width: '100%',
          padding: '12px',
          borderRadius: 12,
          border: 'none',
          background: '#FF9800',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 14,
          color: '#fff',
          fontFamily: 'inherit',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
      >
        🧾 Generate Final Summary
      </button>

      <button
        onClick={onNewDay}
        style={{
          marginTop: 8,
          width: '100%',
          padding: '10px',
          borderRadius: 12,
          border: '1.5px solid #e2d5c3',
          background: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
          color: '#8B4513',
          fontFamily: 'inherit',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff7ed' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
      >
        🔄 New Day
      </button>
    </div>
  )
}
