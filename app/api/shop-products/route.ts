import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const SHOP = 'https://kolure.de'
export const preferredRegion = ['fra1']

// Produktliste fuer den Postingplan: kommt direkt aus dem oeffentlichen
// Shopify-Katalog des Shops (kolure.de/products.json), braucht keinen
// zusaetzlichen Admin-Scope. Nur fuer eingeloggte Nutzer, 10 Minuten gecacht.
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const out: any[] = []
  try {
    for (let page = 1; page <= 6; page++) {
      const r = await fetch(`${SHOP}/products.json?limit=250&page=${page}`, { next: { revalidate: 600 } })
      if (!r.ok) break
      const j = await r.json()
      const list = j.products || []
      for (const p of list) {
        if (p.product_type === 'Geschenkverpackung' || (p.tags || []).includes('gift-wrap')) continue
        const v = (p.variants || [])[0] || {}
        out.push({
          id: p.id, title: p.title, handle: p.handle, type: p.product_type || '',
          image: p.images?.[0]?.src || null, price: v.price || null,
          available: (p.variants || []).some((x: any) => x.available),
          url: `${SHOP}/products/${p.handle}`,
        })
      }
      if (list.length < 250) break
    }
  } catch {
    return NextResponse.json({ error: 'Shop nicht erreichbar' }, { status: 502 })
  }
  return NextResponse.json(out)
}
