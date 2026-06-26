import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET /api/menu — return all menu items ────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('position', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // ── POST /api/menu — insert new menu item ────────────────────
  if (req.method === 'POST') {
    const { name, price, icon } = req.body as { name: string; price: number; icon?: string }
    if (!name || price == null) {
      return res.status(400).json({ error: 'name and price are required' })
    }

    // Get next position
    const { data: existing } = await supabase
      .from('menu_items')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
    const nextPosition = ((existing?.[0]?.position as number) ?? 0) + 1

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        name: name.trim(),
        price: Number(price),
        icon: icon?.trim() || '🍽️',
        position: nextPosition,
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
