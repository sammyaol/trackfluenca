# Ausgeblendete Sections (aus der Sidebar entfernt, Code bleibt erhalten)

Stand 25.10.2026 – bewusst nur aus der Navigation genommen, nicht gelöscht. Seiten, API-Routen und Datenbank-Tabellen sind unverändert.

| Section | Seite | API |
|---|---|---|
| Zahlungen | `app/zahlungen/page.tsx` | – |
| Affiliate (kommt später wieder) | `app/affiliate/page.tsx` | `app/api/affiliate` |
| Kampagnen | `app/kampagnen/page.tsx` | `app/api/kampagnen` |
| Stylisten | `app/stylisten/page.tsx` | `/api/creators?type=stylist` |
| Celebs | `app/celebs/page.tsx` | `/api/creators?type=celeb` |

Wieder einblenden: den jeweiligen Eintrag (`{ href: '/zahlungen', label: 'Zahlungen', ... }`) in `app/components/Sidebar.tsx` im Array unter „Management" ergänzen. Die ursprünglichen Einträge stehen unten (Icons/Farben).

```
      { href: '/celebs', label: 'Celebs', color: '#BF5AF2', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6l-6.3 4.4L8 13.8 2 9.4h7.6z"/></svg> },
      { href: '/stylisten', label: 'Stylisten', color: '#00C7BE', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg> },
      { href: '/kampagnen', label: 'Kampagnen', color: '#FF9F0A', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg> },
      { href: '/affiliate', label: 'Affiliate', color: '#FFD60A', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg> },
      { href: '/zahlungen', label: 'Zahlungen', color: '#FFB340', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5H9a7 7 0 0 0 0 14h10"/><path d="M6 10h9"/><path d="M6 14h9"/></svg> },```
