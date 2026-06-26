# Kappi 2.0 — Payment Feature & Supabase Wiring

## What Changed

| Feature | Description |
|---------|-------------|
| **Full Supabase backend** | All data now persists in Postgres. Members, orders, menu items and settings survive page refreshes and redeployments. |
| **Inline Summary Editing** | In the Final Summary screen, each item row has `−`/`+` buttons. Changes update local state instantly (optimistic UI) and are debounced 400ms before persisting to Supabase via `POST /api/orders`. |
| **💳 Payment Tab** | New tab in the nav. Shows the saved QR image, a list of all members with their order total and a paid/unpaid toggle, and a sticky bottom bar with Paid / Unpaid / Collected stats. |
| **QR Image Storage** | QR images are stored as base64 in the `settings` table (key = `qr_image`). No Supabase Storage bucket is used — stays fully free-tier. |
| **+ Add Item button** | A dashed card at the end of the menu grid opens a modal to add new menu items. New items persist in Supabase and show up for all users on next load. |
| **📈 Analytics Tab** | Shows item popularity bar charts, revenue cards, and per-member breakdown. |
| **Premium animations** | Staggered card entrances, scale-in modals, animated number counters, hover lift on cards, CSS micro-interactions throughout. |

## Project Structure

```
kappi-2.0/
├── api/
│   ├── members.ts        # GET all, POST insert
│   ├── menu.ts           # GET all, POST insert
│   ├── orders.ts         # GET by date, POST upsert, PATCH paid
│   └── settings.ts       # GET by key, POST upsert
├── src/
│   ├── components/
│   │   ├── AnimatedNumber.tsx
│   │   ├── LiveSummary.tsx
│   │   ├── MemberAvatar.tsx
│   │   ├── MemberSidebar.tsx
│   │   ├── MenuGrid.tsx       ← includes "+ Add Item" card
│   │   ├── PaidToggle.tsx
│   │   ├── QtyButton.tsx
│   │   ├── StatCard.tsx
│   │   └── SummaryScreen.tsx  ← includes inline +/- editing
│   ├── lib/
│   │   └── supabaseClient.ts
│   ├── pages/
│   │   ├── AnalyticsPage.tsx
│   │   └── PaymentPage.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── supabase-migration.sql
├── vercel.json
├── .env.example
└── package.json
```

## Step 1 — Run the Database Migration

1. Open your [Supabase project](https://app.supabase.com)
2. Go to **SQL Editor** → **New Query**
3. Paste the entire contents of `supabase-migration.sql`
4. Click **Run**

> This is idempotent — safe to run multiple times.

## Step 2 — Set Environment Variables

### In Vercel Dashboard

Go to your project → **Settings** → **Environment Variables** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Found in Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | "anon public" key — safe for client reads |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | "service_role" key — **server only**, never put in client code |

### Locally (for development)

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
# then edit .env.local with your values
```

## Step 3 — Update Vercel Build Settings

In Vercel → Project → **Settings** → **Build & Development Settings**:

| Setting | Value |
|---------|-------|
| Framework Preset | **Other** |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Root Directory | `/` (repo root) |

## Step 4 — Deploy

```bash
git add -A
git commit -m "feat: Supabase wiring, Payment page, inline summary edit, Add Item"
git push origin main
```

Vercel will auto-deploy on push.

## Step 5 — Upload QR Code

1. Open the app → click **💳 Payment** tab
2. Click **📤 Upload QR**
3. Select your UPI/payment QR image (PNG or JPEG)
4. It's saved to Supabase — persists forever, survives redeployments

## Architecture Notes

- **Security**: The anon key (client-side) only has `SELECT` access via RLS. All `INSERT`/`UPDATE` goes through `/api/*` serverless functions using the service role key which is only in Vercel environment variables — never sent to the browser.
- **Free tier**: Uses Supabase Postgres only (no Storage, no Edge Functions). QR images are stored as base64 text in the `settings` table. Well within 500MB / 50k row limits.
- **Vercel**: 4 serverless functions, each under the Hobby free tier limit of 12 functions.
- **Optimistic UI**: All writes update local React state immediately, then persist in the background. No visible latency.
