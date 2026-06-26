import { useState, useRef, useEffect } from 'react'
import MemberAvatar from '../components/MemberAvatar'
import PaidToggle from '../components/PaidToggle'
import AnimatedNumber from '../components/AnimatedNumber'
import { Member, Order, MenuItem, getMemberTotal } from '../types'

interface Props {
  members: Member[]
  orders: Order[]
  menuItems: MenuItem[]
  onTogglePaid: (memberId: string) => void
}

export default function PaymentPage({ members, orders, menuItems, onTogglePaid }: Props) {
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(true)
  const [qrUploading, setQrUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch stored QR on mount
  useEffect(() => {
    fetch('/api/settings?key=qr_image')
      .then((r) => r.json())
      .then((data) => {
        if (data?.value) setQrImage(data.value)
      })
      .catch(() => {})
      .finally(() => setQrLoading(false))
  }, [])

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQrUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'qr_image', value: base64 }),
        })
        setQrImage(base64)
      } catch {
        alert('Failed to save QR image. Please try again.')
      } finally {
        setQrUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // Payment stats
  const getOrder = (memberId: string): Order | null =>
    orders.find((o) => o.member_id === memberId) ?? null

  const membersWithOrders = members.filter((m) => {
    const o = getOrder(m.id)
    return o && Object.values(o.items).some((q) => q > 0)
  })

  const paidCount = membersWithOrders.filter((m) => getOrder(m.id)?.paid).length
  const unpaidCount = membersWithOrders.length - paidCount
  const collectedTotal = membersWithOrders
    .filter((m) => getOrder(m.id)?.paid)
    .reduce((sum, m) => sum + getMemberTotal(getOrder(m.id), menuItems), 0)

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 120px' }}>
      {/* ── QR Section ───────────────────────────────────── */}
      <div
        className="animate-fade-in-up"
        style={{
          background: '#fff',
          border: '1.5px solid #f0e6d6',
          borderRadius: 18,
          padding: '24px',
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#3d1a06', display: 'flex', alignItems: 'center', gap: 8 }}>
          📱 Payment QR Code
        </h2>

        {qrLoading ? (
          <div className="skeleton" style={{ width: '100%', height: 220, borderRadius: 12 }} />
        ) : qrImage ? (
          <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <img
              src={qrImage}
              alt="Payment QR"
              style={{
                maxWidth: 260,
                maxHeight: 260,
                width: '100%',
                borderRadius: 12,
                border: '1.5px solid #f0e6d6',
                boxShadow: '0 8px 32px rgba(139,69,19,0.10)',
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={qrUploading}
              style={{
                padding: '8px 20px',
                borderRadius: 10,
                border: '1.5px solid #e2d5c3',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: '#8B4513',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff7ed' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
            >
              {qrUploading ? '⏳ Uploading…' : '🔄 Replace QR'}
            </button>
          </div>
        ) : (
          <div
            style={{
              border: '2px dashed #d2b48c',
              borderRadius: 16,
              padding: '48px 20px',
              textAlign: 'center',
              color: '#9d7a5a',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
            <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>No QR uploaded yet</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={qrUploading}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg,#8B4513,#c0522a)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                fontFamily: 'inherit',
              }}
            >
              {qrUploading ? '⏳ Uploading…' : '📤 Upload QR'}
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          style={{ display: 'none' }}
          onChange={handleQrUpload}
        />
      </div>

      {/* ── Member Payment List ──────────────────────────── */}
      <div
        className="animate-fade-in-up"
        style={{
          background: '#fff',
          border: '1.5px solid #f0e6d6',
          borderRadius: 18,
          overflow: 'hidden',
          marginBottom: 100,
          animationDelay: '80ms',
        }}
      >
        <div style={{ padding: '20px 24px 12px' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#3d1a06', display: 'flex', alignItems: 'center', gap: 8 }}>
            👥 Member Payments
          </h2>
        </div>

        {membersWithOrders.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: '#c4b8a4', fontSize: 14 }}>
            No orders placed today yet.
          </div>
        ) : (
          membersWithOrders.map((member, idx) => {
            const order = getOrder(member.id)!
            const total = getMemberTotal(order, menuItems)

            return (
              <div
                key={member.id}
                className="member-row animate-fade-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 24px',
                  borderBottom: '1px solid #f5ede0',
                  gap: 12,
                  animationDelay: `${idx * 40}ms`,
                }}
              >
                <MemberAvatar name={member.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#3d1a06' }}>{member.name}</div>
                  <div style={{ fontSize: 12, color: '#9d7a5a' }}>
                    {Object.entries(order.items)
                      .filter(([, q]) => q > 0)
                      .map(([name, qty]) => {
                        const mi = menuItems.find((m) => m.name === name)
                        return mi ? `${mi.icon}×${qty}` : ''
                      })
                      .filter(Boolean)
                      .join('  ')}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#8B4513', marginRight: 8 }}>
                  ₹{total.toLocaleString('en-IN')}
                </div>
                <PaidToggle
                  paid={order.paid}
                  onChange={() => onTogglePaid(member.id)}
                />
              </div>
            )
          })
        )}
      </div>

      {/* ── Sticky Bottom Summary Bar ────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 20px',
          background: 'rgba(255,253,247,0.92)',
          backdropFilter: 'blur(16px)',
          borderTop: '1.5px solid #f0e6d6',
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {/* Paid */}
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>
              <AnimatedNumber value={paidCount} />
            </div>
            <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>Paid</div>
          </div>
          {/* Unpaid */}
          <div style={{ background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>
              <AnimatedNumber value={unpaidCount} />
            </div>
            <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>Unpaid</div>
          </div>
          {/* Collected */}
          <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#8B4513' }}>
              ₹<AnimatedNumber value={collectedTotal} />
            </div>
            <div style={{ fontSize: 11, color: '#c2410c', fontWeight: 600, marginTop: 2 }}>Collected</div>
          </div>
        </div>
      </div>
    </div>
  )
}
