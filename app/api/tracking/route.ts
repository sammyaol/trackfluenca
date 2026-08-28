import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const trackingNumber = searchParams.get('number')
  
  if (!trackingNumber) {
    return NextResponse.json({ error: 'Tracking-Nummer fehlt' }, { status: 400 })
  }
  
  const apiKey = process.env.DHL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'DHL_API_KEY nicht konfiguriert' }, { status: 500 })
  }
  
  try {
    const res = await fetch(
      `https://api-eu.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(trackingNumber)}`,
      {
        headers: {
          'DHL-API-Key': apiKey,
          'Accept': 'application/json'
        }
      }
    )
    
    if (!res.ok) {
      const errText = await res.text()
      let friendly = `DHL-API-Fehler (${res.status})`
      if (res.status === 404) friendly = 'Sendung nicht gefunden – Trackingnummer prüfen (ggf. noch nicht im DHL-System erfasst)'
      else if (res.status === 429) friendly = 'Zu viele Anfragen an die DHL-API – bitte kurz warten und erneut versuchen'
      else if (res.status === 401 || res.status === 403) friendly = 'DHL-API-Zugriff verweigert – API-Key prüfen'
      else if (res.status >= 500) friendly = 'DHL-API vorübergehend nicht erreichbar'
      return NextResponse.json({ error: friendly, details: errText.slice(0, 200) }, { status: res.status })
    }
    
    const data = await res.json()
    const shipment = data.shipments?.[0]
    
    if (!shipment) {
      return NextResponse.json({ status: 'unknown', message: 'Keine Daten gefunden' })
    }
    
    // Status-Mapping
    const statusCode = shipment.status?.statusCode || 'unknown'
    const statusDescription = shipment.status?.description || shipment.status?.status || ''
    const timestamp = shipment.status?.timestamp
    
    // Mapping: DHL Status → unser Status
    let mappedStatus = 'Versendet'
    if (statusCode === 'delivered' || statusDescription.toLowerCase().includes('zugestellt') || statusDescription.toLowerCase().includes('delivered')) {
      mappedStatus = 'Angekommen'
    } else if (statusCode === 'pre-transit' || statusDescription.toLowerCase().includes('vorab')) {
      mappedStatus = 'Nicht versendet'
    }
    
    // Events
    const events = (shipment.events || []).map((e: any) => ({
      timestamp: e.timestamp,
      description: e.description || e.status,
      location: e.location?.address?.addressLocality || ''
    }))
    
    return NextResponse.json({
      status: mappedStatus,
      statusCode,
      description: statusDescription,
      lastUpdate: timestamp,
      events,
      origin: shipment.origin?.address?.addressLocality || '',
      destination: shipment.destination?.address?.addressLocality || '',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
