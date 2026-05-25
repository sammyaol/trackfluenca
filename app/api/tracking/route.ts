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
      `https://api-eu.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(trackingNumber)}&service=express,parcel-de,parcel-nl,parcel-pl,parcel-uk,dsc,dgf,ecommerce,ecommerce-europe,freight,post-de,sameday`,
      {
        headers: {
          'DHL-API-Key': apiKey,
          'Accept': 'application/json'
        }
      }
    )
    
    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: `DHL API error ${res.status}`, details: errText.slice(0, 200) }, { status: res.status })
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
