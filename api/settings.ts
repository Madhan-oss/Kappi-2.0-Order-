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

  // ── GET /api/settings?key=qr_image ──────────────────────────
  if (req.method === 'GET') {
    const key = req.query.key as string
    if (!key) return res.status(400).json({ error: 'key is required' })

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data ?? { value: null })
  }

  // ── POST /api/settings — upsert a setting ───────────────────
  if (req.method === 'POST') {
    const { key, value } = req.body as { key: string; value: string }
    if (!key) return res.status(400).json({ error: 'key is required' })

    const { data, error } = await supabase
      .from('settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
