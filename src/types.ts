// ============================================================
// TYPES — shared across all components and API routes
// ============================================================

export interface Member {
  id: string;
  name: string;
  is_default: boolean;
  created_at?: string;
}

export interface Order {
  id: string;
  member_id: string;
  member_name: string;
  items: Record<string, number>; // { "Tea": 2, "Egg Puff": 1 }
  paid: boolean;
  order_date: string; // YYYY-MM-DD
  updated_at?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  position: number;
  created_at?: string;
}

export interface Setting {
  id?: number;
  key: string;
  value: string | null;
  updated_at?: string;
}

// ============================================================
// LOCAL STATE TYPES (rich state for UI)
// ============================================================

/** A member enriched with their order for today */
export interface MemberWithOrder {
  member: Member;
  order: Order | null; // null if no order placed yet today
}

/** Computed totals for a member */
export function getMemberTotal(order: Order | null, menuItems: MenuItem[]): number {
  if (!order) return 0;
  return menuItems.reduce((sum, item) => {
    return sum + (order.items[item.name] || 0) * item.price;
  }, 0);
}

export function getMemberItemCount(order: Order | null): number {
  if (!order) return 0;
  return Object.values(order.items).reduce((s, q) => s + q, 0);
}

export type ActiveTab = 'orders' | 'analytics' | 'payment';
