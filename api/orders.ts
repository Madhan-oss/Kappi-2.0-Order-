import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Service role key — bypasses RLS — NEVER exposed to client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET /api/orders?date=YYYY-MM-DD ─────────────────────────
  if (req.method === 'GET') {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_date', date)
      .order('updated_at', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // ── POST /api/orders — upsert an order row ───────────────────
  if (req.method === 'POST') {
    const { member_id, member_name, items, paid, order_date } = req.body as {
      member_id: string
      member_name: string
      items: Record<string, number>
      paid?: boolean
      order_date?: string
    }

    if (!member_id || !member_name) {
      return res.status(400).json({ error: 'member_id and member_name are required' })
    }

    const dateStr = order_date || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('orders')
      .upsert(
        {
          member_id,
          member_name,
          items: items ?? {},
          paid: paid ?? false,
          order_date: dateStr,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'member_id,order_date', ignoreDuplicates: false }
      )
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // ── PATCH /api/orders — toggle paid status ───────────────────
  if (req.method === 'PATCH') {
    const { id, paid } = req.body as { id: string; paid: boolean }
    if (!id) return res.status(400).json({ error: 'id is required' })

    const { data, error } = await supabase
      .from('orders')
      .update({ paid, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
