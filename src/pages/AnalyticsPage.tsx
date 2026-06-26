import StatCard from '../components/StatCard'
import AnimatedNumber from '../components/AnimatedNumber'
import MemberAvatar from '../components/MemberAvatar'
import { Order, MenuItem, Member, getMemberTotal, getMemberItemCount } from '../types'

interface Props {
  members: Member[]
  orders: Order[]
  menuItems: MenuItem[]
}

export default function AnalyticsPage({ members, orders, menuItems }: Props) {
  const grandTotal = orders.reduce((sum, o) => sum + getMemberTotal(o, menuItems), 0)
  const paidTotal = orders.filter((o) => o.paid).reduce((sum, o) => sum + getMemberTotal(o, menuItems), 0)
  const paidCount = orders.filter((o) => o.paid).length
  const ordersPlaced = orders.filter((o) => getMemberItemCount(o) > 0).length
  const pendingCount = orders.filter((o) => getMemberItemCount(o) > 0 && !o.paid).length

  // Aggregate items
  const itemAgg: Record<string, { name: string; icon: string; price: number; qty: number }> = {}
  for (const order of orders) {
    for (const [name, qty] of Object.entries(order.items)) {
      if (qty > 0) {
        const mi = menuItems.find((m) => m.name === name)
        if (!mi) continue
        if (!itemAgg[name]) itemAgg[name] = { name, icon: mi.icon, price: mi.price, qty: 0 }
        itemAgg[name].qty += qty
      }
    }
  }
  const sorted = Object.values(itemAgg).sort((a, b) => b.qty - a.qty)
  const maxQty = sorted[0]?.qty || 1

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#3d1a06', margin: '0 0 4px' }}>
          📈 Analytics
        </h1>
        <p style={{ color: '#9d7a5a', fontSize: 13, margin: 0 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div
        className="animate-fade-in-up"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))',
          gap: 12,
          marginBottom: 24,
          animationDelay: '50ms',
        }}
      >
        <StatCard label="Total Members" value={members.length} color="#8B4513" animDelay={0} />
        <StatCard label="Orders Placed" value={ordersPlaced} color="#FF9800" animDelay={60} />
        <StatCard label="Paid" value={paidCount} color="#22c55e" animDelay={120} />
        <StatCard label="Pending" value={pendingCount} color="#ef4444" animDelay={180} />
      </div>

      {/* Revenue cards */}
      <div
        className="animate-fade-in-up"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24, animationDelay: '100ms' }}
      >
        <div style={{ background: 'linear-gradient(135deg,#8B4513,#c0522a)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ color: '#fde8d0', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Grand Total</div>
          <div style={{ color: '#fff', fontSize: 26, fontWeight: 900 }}>
            ₹<AnimatedNumber value={grandTotal} />
          </div>
        </div>
        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ color: '#16a34a', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Collected</div>
          <div style={{ color: '#15803d', fontSize: 26, fontWeight: 900 }}>
            ₹<AnimatedNumber value={paidTotal} />
          </div>
        </div>
      </div>

      {/* Item popularity chart */}
      <div
        className="animate-fade-in-up"
        style={{ background: '#fff', border: '1.5px solid #f0e6d6', borderRadius: 16, padding: '20px 24px', marginBottom: 24, animationDelay: '150ms' }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#3d1a06' }}>
          🔥 Item Popularity
        </h2>
        {sorted.length === 0 ? (
          <p style={{ color: '#9d7a5a', margin: 0, fontSize: 13 }}>No orders yet today.</p>
        ) : (
          sorted.map(({ name, icon, price, qty }, idx) => (
            <div key={name} className="animate-fade-in-up" style={{ marginBottom: 12, animationDelay: `${idx * 30}ms` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#3d1a06' }}>
                  {icon} {name}
                </span>
                <span style={{ fontSize: 12, color: '#9d7a5a' }}>×{qty} · ₹{(qty * price).toLocaleString('en-IN')}</span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 8, background: '#f0e6d6', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(qty / maxQty) * 100}%`,
                    background: 'linear-gradient(90deg,#8B4513,#c0522a)',
                    borderRadius: 4,
                    transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Per-member breakdown */}
      <div
        className="animate-fade-in-up"
        style={{ background: '#fff', border: '1.5px solid #f0e6d6', borderRadius: 16, padding: '20px 24px', animationDelay: '200ms' }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#3d1a06' }}>
          👥 Per Member
        </h2>
        {orders.filter((o) => getMemberItemCount(o) > 0).map((order, idx) => {
          const total = getMemberTotal(order, menuItems)
          return (
            <div
              key={order.id}
              className="animate-fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid #f5ede0',
                animationDelay: `${idx * 30}ms`,
              }}
            >
              <MemberAvatar name={order.member_name} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#3d1a06' }}>{order.member_name}</div>
                <div style={{ fontSize: 11, color: '#9d7a5a' }}>
                  {getMemberItemCount(order)} items
                </div>
              </div>
              <span
                style={{
                  background: order.paid ? '#dcfce7' : '#fee2e2',
                  color: order.paid ? '#16a34a' : '#dc2626',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 10,
                }}
              >
                {order.paid ? '✓ Paid' : '✗ Unpaid'}
              </span>
              <span style={{ fontWeight: 700, color: '#8B4513', fontSize: 14 }}>
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
