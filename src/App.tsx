import { useState, useEffect, useCallback } from 'react'
import { today } from './lib/supabaseClient'
import { Member, Order, MenuItem, getMemberItemCount, ActiveTab } from './types'
import MemberSidebar from './components/MemberSidebar'
import MenuGrid from './components/MenuGrid'
import LiveSummary from './components/LiveSummary'
import SummaryScreen from './components/SummaryScreen'
import PaymentPage from './pages/PaymentPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AnimatedNumber from './components/AnimatedNumber'
import MemberAvatar from './components/MemberAvatar'

// ─── Kappi logo (original base64 from compiled app) ──────────────
const LOGO_B64 = `data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/wAARCAC5AK8DASIAAhEBAxEB/8QAHQAAAgIDAQEBAAAAAAAAAAAAAAgGBwMEBQIBCf/EAEQQAAEDAwIDBQYEBAIHCQAAAAECAwQABQYHERIhMQgTQVFhFCIycYGRFUKhsRYjUmJywQkzQ3OCsuEkNURTg5Ki0uP/xAAcAQABBQEBAQAAAAAAAAAAAAAAAQIDBQYEBwj/xAA/EQABAgQBBwgHBQkAAAAAAAABAAIDBAURIQYSEzFBcbEiUWFykaGy0RQVMzSBweEHFiM1YhclMkJSU6Lw8f/aAAwDAQACEQMRAD8A`

export default function App() {
  const [members, setMembers] = useState<Member[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders')
  const [showSummary, setShowSummary] = useState(false)
  const [showMobileSummary, setShowMobileSummary] = useState(false)

  const dateStr = today()

  // ── Data fetching ────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [membersRes, menuRes, ordersRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/menu'),
        fetch(`/api/orders?date=${dateStr}`),
      ])
      const [membersData, menuData, ordersData] = await Promise.all([
        membersRes.json(),
        menuRes.json(),
        ordersRes.json(),
      ])
      setMembers(membersData ?? [])
      setMenuItems(menuData ?? [])
      setOrders(ordersData ?? [])
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoading(false)
    }
  }, [dateStr])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Helpers ──────────────────────────────────────────────────
  const getOrder = (memberId: string): Order | null =>
    orders.find((o) => o.member_id === memberId) ?? null

  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null
  const selectedOrder = selectedMemberId ? getOrder(selectedMemberId) : null
  const selectedItems: Record<string, number> = selectedOrder?.items ?? {}

  const grandTotal = orders.reduce((sum, o) => {
    return sum + menuItems.reduce((s, mi) => s + (o.items[mi.name] || 0) * mi.price, 0)
  }, 0)

  // ── Quantity change (persist via API) ─────────────────────────
  const handleQuantityChange = useCallback(async (itemName: string, qty: number) => {
    if (!selectedMemberId || !selectedMember) return
    const newQty = Math.max(0, qty)
    const existingOrder = getOrder(selectedMemberId)
    const newItems = { ...(existingOrder?.items ?? {}), [itemName]: newQty }
    // Remove zero items
    Object.keys(newItems).forEach((k) => { if (newItems[k] === 0) delete newItems[k] })

    // Optimistic update
    setOrders((prev) => {
      const exists = prev.find((o) => o.member_id === selectedMemberId)
      if (exists) {
        return prev.map((o) =>
          o.member_id === selectedMemberId ? { ...o, items: newItems } : o
        )
      }
      return [
        ...prev,
        {
          id: `temp-${selectedMemberId}`,
          member_id: selectedMemberId,
          member_name: selectedMember.name,
          items: newItems,
          paid: false,
          order_date: dateStr,
        },
      ]
    })

    // Persist
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: selectedMemberId,
        member_name: selectedMember.name,
        items: newItems,
        order_date: dateStr,
      }),
    }).catch(console.error)
  }, [selectedMemberId, selectedMember, orders, dateStr])

  // ── Toggle paid ──────────────────────────────────────────────
  const handleTogglePaid = useCallback(async (memberId: string) => {
    const order = getOrder(memberId)
    if (!order) return
    const newPaid = !order.paid
    // Optimistic
    setOrders((prev) =>
      prev.map((o) => (o.member_id === memberId ? { ...o, paid: newPaid } : o))
    )
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: order.id, paid: newPaid }),
    }).catch(console.error)
  }, [orders])

  // ── Add member ───────────────────────────────────────────────
  const handleAddMember = useCallback(async (name: string) => {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const newMember: Member = await res.json()
    setMembers((prev) => [...prev, newMember])
    setSelectedMemberId(newMember.id)
  }, [])

  // ── Remove member (local only — keeps DB row) ────────────────
  const handleRemoveMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id))
    if (selectedMemberId === id) setSelectedMemberId(null)
  }, [selectedMemberId])

  // ── Update order items from SummaryScreen inline edit ────────
  const handleUpdateOrderItems = useCallback(
    async (orderId: string, memberId: string, items: Record<string, number>) => {
      const member = members.find((m) => m.id === memberId)
      if (!member) return
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, items } : o)))
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, member_name: member.name, items, order_date: dateStr }),
      }).catch(console.error)
    },
    [members, dateStr]
  )

  // ── Add menu item ────────────────────────────────────────────
  const handleAddMenuItem = useCallback(async (name: string, price: number, icon: string) => {
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, icon }),
    })
    const newItem: MenuItem = await res.json()
    setMenuItems((prev) => [...prev, newItem])

    // Auto-set qty=1 for currently selected member
    if (selectedMemberId && selectedMember) {
      await handleQuantityChange(name, 1)
    }
  }, [selectedMemberId, selectedMember, handleQuantityChange])

  // ── New day ──────────────────────────────────────────────────
  const handleNewDay = useCallback(() => {
    setOrders([])
    setSelectedMemberId(null)
    setShowSummary(false)
  }, [])

  // ── Render: loading skeleton ─────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFDF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: 'wiggle 1s ease-in-out infinite' }}>☕</div>
          <div style={{ color: '#8B4513', fontWeight: 700, fontSize: 16 }}>Loading Kappi…</div>
        </div>
      </div>
    )
  }

  // ── Render: Summary overlay ──────────────────────────────────
  if (showSummary) {
    return (
      <SummaryScreen
        members={members}
        orders={orders}
        menuItems={menuItems}
        onClose={() => setShowSummary(false)}
        onNewDay={handleNewDay}
        onUpdateOrderItems={handleUpdateOrderItems}
        onTogglePaid={handleTogglePaid}
      />
    )
  }

  const tabStyle = (tab: ActiveTab) => ({
    padding: '0 4px',
    paddingBottom: 2,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    color: activeTab === tab ? '#8B4513' : '#9d7a5a',
    background: 'none',
    border: 'none',
    borderBottom: `2px solid ${activeTab === tab ? '#8B4513' : 'transparent'}`,
    fontFamily: 'inherit',
    transition: 'color 0.2s ease, border-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  } as React.CSSProperties)

  return (
    <div style={{ minHeight: '100vh', background: '#FFFDF7', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: '1px solid #f0e6d6',
          background: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
          }}
        >
          {/* Logo + Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#8B4513,#c0522a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                ☕
              </div>
              <span style={{ fontWeight: 900, fontSize: 17, color: '#3d1a06', letterSpacing: '-0.02em' }}>
                Kappi 2.0 Order
              </span>
            </div>

            {/* Tab nav */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 16, height: 56 }}>
              <button style={tabStyle('orders')} onClick={() => setActiveTab('orders')}>
                📦 Orders
              </button>
              <button style={tabStyle('analytics')} onClick={() => setActiveTab('analytics')}>
                📈 Analytics
              </button>
              <button style={tabStyle('payment')} onClick={() => setActiveTab('payment')}>
                💳 Payment
              </button>
            </nav>
          </div>

          {/* Right: total + mobile summary btn */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: 13,
                fontWeight: 700,
                color: '#c2410c',
              }}
            >
              ₹<AnimatedNumber value={grandTotal} />
            </div>
            <button
              onClick={() => setShowMobileSummary((v) => !v)}
              className="mobile-summary-btn"
              style={{
                padding: '6px 12px',
                borderRadius: 10,
                border: '1.5px solid #e2d5c3',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: '#8B4513',
                fontFamily: 'inherit',
              }}
            >
              📊
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px' }}>

        {/* ── ORDERS TAB ────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div
            className="main-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '260px 1fr 280px',
              gap: 20,
              alignItems: 'start',
            }}
          >
            {/* Left: Members */}
            <aside>
              <MemberSidebar
                members={members}
                orders={orders}
                menuItems={menuItems}
                selectedMemberId={selectedMemberId}
                onSelectMember={setSelectedMemberId}
                onTogglePaid={handleTogglePaid}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
              />
            </aside>

            {/* Center: Menu grid */}
            <main>
              {selectedMember ? (
                <div>
                  {/* Member header */}
                  <div
                    className="animate-scale-in"
                    style={{
                      background: '#fff',
                      border: '1.5px solid #f0e6d6',
                      borderRadius: 18,
                      padding: '20px 24px',
                      marginBottom: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <MemberAvatar name={selectedMember.name} size={48} />
                      <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#3d1a06' }}>
                          {selectedMember.name}
                        </h2>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9d7a5a' }}>
                          {getMemberItemCount(selectedOrder)} items ·{' '}
                          ₹{menuItems.reduce((s, mi) => s + (selectedItems[mi.name] || 0) * mi.price, 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu */}
                  <MenuGrid
                    menuItems={menuItems}
                    quantities={selectedItems}
                    onQuantityChange={handleQuantityChange}
                    memberSelected={!!selectedMemberId}
                    onAddMenuItem={handleAddMenuItem}
                  />

                  {/* Member total bar */}
                  {getMemberItemCount(selectedOrder) > 0 && (
                    <div
                      className="animate-fade-in-up"
                      style={{
                        marginTop: 20,
                        background: 'linear-gradient(135deg,#8B4513,#c0522a)',
                        borderRadius: 14,
                        padding: '16px 24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ color: '#fde8d0', fontSize: 12, fontWeight: 600 }}>
                          {selectedMember.name}'s Total
                        </div>
                        <div style={{ color: '#fff', fontSize: 24, fontWeight: 900 }}>
                          ₹<AnimatedNumber value={menuItems.reduce((s, mi) => s + (selectedItems[mi.name] || 0) * mi.price, 0)} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#fde8d0', fontSize: 12, marginBottom: 6 }}>
                          {getMemberItemCount(selectedOrder)} item{getMemberItemCount(selectedOrder) === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="animate-fade-in"
                  style={{ textAlign: 'center', padding: '80px 20px' }}
                >
                  <div style={{ fontSize: 64, marginBottom: 16 }}>☕</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#3d1a06', margin: '0 0 8px' }}>
                    No orders yet
                  </h2>
                  <p style={{ color: '#9d7a5a', margin: 0, fontSize: 14 }}>
                    Select a member from the list to start adding items.
                  </p>
                </div>
              )}
            </main>

            {/* Right: Live Summary */}
            <aside style={{ position: 'sticky', top: 76 }}>
              <div
                style={{
                  background: '#fff',
                  border: '1.5px solid #f0e6d6',
                  borderRadius: 18,
                  padding: '20px',
                }}
              >
                <LiveSummary
                  orders={orders}
                  menuItems={menuItems}
                  onGenerateSummary={() => setShowSummary(true)}
                  onNewDay={handleNewDay}
                />
              </div>
            </aside>
          </div>
        )}

        {/* ── ANALYTICS TAB ─────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <AnalyticsPage members={members} orders={orders} menuItems={menuItems} />
        )}

        {/* ── PAYMENT TAB ───────────────────────────────────── */}
        {activeTab === 'payment' && (
          <PaymentPage
            members={members}
            orders={orders}
            menuItems={menuItems}
            onTogglePaid={handleTogglePaid}
          />
        )}
      </div>

      {/* ── Floating member chip ──────────────────────────── */}
      {selectedMember && activeTab === 'orders' && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 24,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(139,69,19,0.08)',
            backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(139,69,19,0.15)',
            borderRadius: 40,
            padding: '6px 14px 6px 8px',
            pointerEvents: 'none',
          }}
        >
          <MemberAvatar name={selectedMember.name} size={26} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#8B4513', letterSpacing: '-0.01em' }}>
            {selectedMember.name}
          </span>
        </div>
      )}

      {/* ── Mobile Summary Drawer ─────────────────────────── */}
      {showMobileSummary && (
        <div
          className="modal-backdrop"
          style={{ position: 'fixed', inset: 0, zIndex: 80 }}
          onClick={() => setShowMobileSummary(false)}
        >
          <div
            className="modal-sheet"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#fff',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px 40px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ width: 40, height: 4, background: '#e2d5c3', borderRadius: 2, margin: '0 auto 20px', cursor: 'pointer' }}
              onClick={() => setShowMobileSummary(false)}
            />
            <LiveSummary
              orders={orders}
              menuItems={menuItems}
              onGenerateSummary={() => { setShowMobileSummary(false); setShowSummary(true) }}
              onNewDay={handleNewDay}
            />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: -1 }} />
        </div>
      )}
    </div>
  )
}
