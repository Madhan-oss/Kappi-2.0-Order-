import { useState } from 'react'
import MemberAvatar from './MemberAvatar'
import PaidToggle from './PaidToggle'
import { Member, Order, MenuItem, getMemberTotal, getMemberItemCount } from '../types'

interface Props {
  members: Member[]
  orders: Order[]
  menuItems: MenuItem[]
  selectedMemberId: string | null
  onSelectMember: (id: string) => void
  onTogglePaid: (memberId: string) => void
  onAddMember: (name: string) => void
  onRemoveMember: (id: string) => void
}

export default function MemberSidebar({
  members,
  orders,
  menuItems,
  selectedMemberId,
  onSelectMember,
  onTogglePaid,
  onAddMember,
  onRemoveMember,
}: Props) {
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const getOrder = (memberId: string): Order | null =>
    orders.find((o) => o.member_id === memberId) ?? null

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    onAddMember(name)
    setNewName('')
    setAdding(false)
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1.5px solid #f0e6d6',
        borderRadius: 18,
        overflow: 'hidden',
        position: 'sticky',
        top: 76,
      }}
    >
      {/* Search */}
      <div style={{ padding: '16px 16px 12px' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search member…"
          className="kappi-input"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 10,
            border: '1.5px solid #e2d5c3',
            fontSize: 13,
            background: '#fdf8f3',
            color: '#3d1a06',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s ease',
          }}
        />
      </div>

      {/* Member list */}
      <div style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
        {filtered.map((member, idx) => {
          const order = getOrder(member.id)
          const total = getMemberTotal(order, menuItems)
          const count = getMemberItemCount(order)
          const isSelected = selectedMemberId === member.id

          return (
            <div
              key={member.id}
              className="member-row animate-fade-in"
              onClick={() => onSelectMember(member.id)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: isSelected ? '#fff7ed' : 'transparent',
                borderLeft: `3px solid ${isSelected ? '#8B4513' : 'transparent'}`,
                borderBottom: '1px solid #f5ede0',
                animationDelay: `${idx * 30}ms`,
              }}
            >
              <MemberAvatar name={member.name} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#3d1a06',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {member.name}
                </div>
                <div style={{ fontSize: 11, color: '#9d7a5a' }}>
                  {count > 0 ? `${count} item${count === 1 ? '' : 's'} · ₹${total}` : 'No order'}
                </div>
              </div>

              {order?.paid && (
                <span style={{ fontSize: 16, color: '#22c55e' }}>✓</span>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePaid(member.id)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
                title="Toggle paid"
              >
                <PaidToggle paid={order?.paid ?? false} onChange={() => onTogglePaid(member.id)} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveMember(member.id)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#d0b0a0',
                  fontSize: 14,
                  padding: 0,
                  lineHeight: 1,
                  fontFamily: 'inherit',
                }}
                title="Remove member"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      {/* Add member */}
      <div style={{ padding: 12, borderTop: '1px solid #f0e6d6' }}>
        {adding ? (
          <div style={{ display: 'flex', gap: 6 }} className="animate-fade-in">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') setAdding(false)
              }}
              placeholder="Member name…"
              className="kappi-input"
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: 8,
                border: '1.5px solid #e2d5c3',
                fontSize: 13,
                fontFamily: 'inherit',
                background: '#fdf8f3',
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: 'none',
                background: '#8B4513',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'inherit',
                transition: 'opacity 0.15s',
              }}
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 10,
              border: '1.5px dashed #d2b48c',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: '#9d7a5a',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#8B4513'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#8B4513'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#d2b48c'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#9d7a5a'
            }}
          >
            + Add Member
          </button>
        )}
      </div>
    </div>
  )
}
