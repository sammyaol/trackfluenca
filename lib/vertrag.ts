// Gemeinsame Vertragslogik fuer die interne Seite (/vertraege) und die
// oeffentliche Unterschriftsseite (/v/[token]). Beide rendern die Klauseln
// aus denselben Feldern, damit der Creator exakt das sieht, was intern
// angelegt wurde. Nach der Unterschrift sind die Felder gesperrt (API).

export type Sprache = 'de' | 'en' | 'fr' | 'it'
export const SPRACHEN: { code: Sprache; label: string; locale: string }[] = [
  { code: 'de', label: 'Deutsch', locale: 'de-DE' },
  { code: 'en', label: 'English', locale: 'en-GB' },
  { code: 'fr', label: 'Français', locale: 'fr-FR' },
  { code: 'it', label: 'Italiano', locale: 'it-IT' },
]
export const langOf = (v?: { sprache?: string | null } | null): Sprache => (SPRACHEN.find(x => x.code === v?.sprache)?.code || 'de')
const locOf = (l: Sprache) => SPRACHEN.find(x => x.code === l)!.locale

export type Vertrag = {
  id?: string
  created_at?: string
  token?: string
  creator_id?: string | null
  firma_name?: string | null
  firma_adresse?: string | null
  creator_name: string
  creator_handle?: string | null
  inhalte?: string | null
  plattform?: string | null
  anzahl_videos?: number | null
  posting_bis?: string | null
  online_tage?: number | null
  verguetung_art: 'produkt' | 'fee' | 'beides'
  produkte?: string | null
  produktwert?: number | null
  fee?: number | null
  versand_bis?: string | null
  zahlung_tage?: number | null
  nutzungsrechte_ads?: boolean | null
  zusatz?: string | null
  sprache?: Sprache | string | null
  status?: 'offen' | 'angesehen' | 'unterschrieben' | 'storniert'
  angesehen_am?: string | null
  unterschrieben_am?: string | null
  unterschrift_name?: string | null
  unterschrift_adresse?: string | null
  unterschrift_bild?: string | null
}

// Felder, die intern bearbeitet werden duerfen (Whitelist fuer POST/PATCH).
export const EDITABLE_FIELDS = [
  'creator_id', 'firma_name', 'firma_adresse', 'creator_name', 'creator_handle',
  'inhalte', 'plattform', 'anzahl_videos', 'posting_bis', 'online_tage',
  'verguetung_art', 'produkte', 'produktwert', 'fee', 'versand_bis',
  'zahlung_tage', 'nutzungsrechte_ads', 'zusatz', 'sprache',
] as const

export function pickEditable(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const k of EDITABLE_FIELDS) {
    if (k in body) {
      const v = body[k]
      out[k] = v === '' ? null : v
    }
  }
  return out
}

const TOKEN_CHARS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function genToken(len = 22) {
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  let s = ''
  for (const b of bytes) s += TOKEN_CHARS[b % TOKEN_CHARS.length]
  return s
}

export const fmtDatum = (d?: string | null, loc = 'de-DE') =>
  d ? new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString(loc, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export const fmtEur = (n?: number | null, loc = 'de-DE') =>
  n == null || isNaN(Number(n)) ? '—' : Number(n).toLocaleString(loc, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

export const fmtZeit = (d?: string | null, loc = 'de-DE') =>
  d ? new Date(d).toLocaleString(loc, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + (loc === 'de-DE' ? ' Uhr' : '') : '—'

export type Klausel = { titel: string; absaetze: string[] }

export function klauseln(v: Vertrag): Klausel[] {
  const L = langOf(v)
  const loc = locOf(L)
  const D = (d?: string | null) => fmtDatum(d, loc)
  const E = (n?: number | null) => fmtEur(n, loc)
  const firma = v.firma_name || 'Koluré'
  const plattform = v.plattform || 'Instagram'
  const anzahl = v.anzahl_videos || 1
  const handle = v.creator_handle ? ` (${v.creator_handle})` : ''
  const mitProdukt = v.verguetung_art === 'produkt' || v.verguetung_art === 'beides'
  const mitFee = v.verguetung_art === 'fee' || v.verguetung_art === 'beides'
  const zahlTage = v.zahlung_tage ?? 14
  const onlineTage = v.online_tage ?? 30
  const adr = v.firma_adresse
  const list: Klausel[] = []

  if (L === 'en') {
    list.push({ titel: 'Parties', absaetze: [`This agreement is entered into between ${firma}${adr ? ', ' + adr : ''} (hereinafter “${firma}”) and ${v.creator_name}${handle} (hereinafter the “Creator”).`] })
    const inh = [`The Creator will produce ${anzahl === 1 ? 'one video' : anzahl + ' videos'} or content for ${plattform}. The type, scope and design of the content follow the arrangement the parties made in the Instagram chat. This arrangement forms part of this agreement.`]
    if (v.inhalte) inh.push(`Summary of the arrangement: ${v.inhalte}`)
    list.push({ titel: 'Content', absaetze: inh })
    list.push({ titel: 'Obligations of the Creator', absaetze: [
      `The Creator undertakes to produce the agreed content and to publish it on ${plattform} ${v.posting_bis ? `no later than ${D(v.posting_bis)}` : 'within the period agreed in the Instagram chat'}.`,
      `The published content will remain online for at least ${onlineTage} days and will not be deleted or archived during this period.`] })
    const f: string[] = []
    if (mitProdukt) f.push(`${firma} will send the Creator ${v.produkte ? 'the following products: ' + v.produkte : 'the products agreed in the Instagram chat'}${v.versand_bis ? `, shipped no later than ${D(v.versand_bis)}` : ', promptly after signature'}. The products become the Creator’s property once the content has been published.`)
    if (mitFee) f.push(`${firma} will pay the Creator a fee of ${E(v.fee)}. Payment will be made within ${zahlTage} days after publication of the agreed content and receipt of a proper invoice or payment details.`)
    list.push({ titel: `Obligations of ${firma}`, absaetze: f })
    list.push({ titel: 'Usage rights', absaetze: [
      `The Creator grants ${firma} a non-exclusive right, unlimited in time, to share and repost the content organically on ${firma}’s own channels (social media, website, newsletter), crediting the Creator.`,
      v.nutzungsrechte_ads ? `In addition, ${firma} may use the content for paid advertising (e.g. Meta/TikTok Ads, whitelisting).` : `Use for paid advertising is only permitted by separate arrangement.`] })
    list.push({ titel: 'Non-performance', absaetze: [`If the Creator does not publish the content on time, ${mitFee ? 'the entitlement to the fee lapses' : 'any further entitlement lapses'}${mitProdukt ? ' and the Creator will return the products received at their own expense' : ''}.`] })
    if (v.zusatz) list.push({ titel: 'Additional agreements', absaetze: [v.zusatz] })
    list.push({ titel: 'Final provisions', absaetze: [
      'German law applies. Amendments require text form; an Instagram message is sufficient.',
      'This agreement is signed electronically. Name, signature, time and technical data of the signing are stored for evidence purposes.'] })
    return list
  }

  if (L === 'fr') {
    list.push({ titel: 'Parties', absaetze: [`Le présent accord est conclu entre ${firma}${adr ? ', ' + adr : ''} (ci-après « ${firma} ») et ${v.creator_name}${handle} (ci-après le « Créateur »).`] })
    const inh = [`Le Créateur réalise ${anzahl === 1 ? 'une vidéo' : anzahl + ' vidéos'} ou des contenus pour ${plattform}. La nature, l’étendue et la conception des contenus sont définies par l’accord conclu entre les parties dans le chat Instagram. Cet accord fait partie intégrante du présent contrat.`]
    if (v.inhalte) inh.push(`Résumé de l’accord : ${v.inhalte}`)
    list.push({ titel: 'Contenus', absaetze: inh })
    list.push({ titel: 'Obligations du Créateur', absaetze: [
      `Le Créateur s’engage à réaliser les contenus convenus et à les publier sur ${plattform} ${v.posting_bis ? `au plus tard le ${D(v.posting_bis)}` : 'dans le délai convenu dans le chat Instagram'}.`,
      `Les contenus publiés restent en ligne pendant au moins ${onlineTage} jours et ne sont ni supprimés ni archivés durant cette période.`] })
    const f: string[] = []
    if (mitProdukt) f.push(`${firma} envoie au Créateur ${v.produkte ? 'les produits suivants : ' + v.produkte : 'les produits convenus dans le chat Instagram'}${v.versand_bis ? `, expédiés au plus tard le ${D(v.versand_bis)}` : ', rapidement après la signature'}. Les produits deviennent la propriété du Créateur après la publication des contenus.`)
    if (mitFee) f.push(`${firma} verse au Créateur une rémunération de ${E(v.fee)}. Le paiement intervient dans un délai de ${zahlTage} jours après la publication des contenus convenus et la réception d’une facture en bonne et due forme ou des coordonnées de paiement.`)
    list.push({ titel: `Obligations de ${firma}`, absaetze: f })
    list.push({ titel: 'Droits d’utilisation', absaetze: [
      `Le Créateur concède à ${firma} un droit non exclusif, sans limitation de durée, de partager et de republier les contenus de manière organique sur les canaux propres de ${firma} (réseaux sociaux, site web, newsletter), avec mention du Créateur.`,
      v.nutzungsrechte_ads ? `En outre, ${firma} peut utiliser les contenus pour de la publicité payante (p. ex. Meta/TikTok Ads, whitelisting).` : `Toute utilisation pour de la publicité payante nécessite un accord séparé.`] })
    list.push({ titel: 'Inexécution', absaetze: [`Si le Créateur ne publie pas les contenus dans les délais, ${mitFee ? 'le droit à la rémunération s’éteint' : 'tout autre droit s’éteint'}${mitProdukt ? ' et le Créateur renvoie les produits reçus à ses propres frais' : ''}.`] })
    if (v.zusatz) list.push({ titel: 'Accords complémentaires', absaetze: [v.zusatz] })
    list.push({ titel: 'Dispositions finales', absaetze: [
      'Le droit allemand est applicable. Toute modification requiert la forme écrite sous forme de texte ; un message Instagram suffit.',
      'Le présent accord est signé électroniquement. Le nom, la signature, l’horodatage et les données techniques de la signature sont conservés à titre de preuve.'] })
    return list
  }

  if (L === 'it') {
    list.push({ titel: 'Parti', absaetze: [`Il presente accordo è concluso tra ${firma}${adr ? ', ' + adr : ''} (di seguito «${firma}») e ${v.creator_name}${handle} (di seguito il «Creator»).`] })
    const inh = [`Il Creator realizza ${anzahl === 1 ? 'un video' : anzahl + ' video'} o contenuti per ${plattform}. Tipo, estensione e realizzazione dei contenuti seguono l’accordo preso tra le parti nella chat di Instagram. Tale accordo è parte integrante del presente contratto.`]
    if (v.inhalte) inh.push(`Riepilogo dell’accordo: ${v.inhalte}`)
    list.push({ titel: 'Contenuti', absaetze: inh })
    list.push({ titel: 'Obblighi del Creator', absaetze: [
      `Il Creator si impegna a realizzare i contenuti concordati e a pubblicarli su ${plattform} ${v.posting_bis ? `entro e non oltre il ${D(v.posting_bis)}` : 'entro il termine concordato nella chat di Instagram'}.`,
      `I contenuti pubblicati restano online per almeno ${onlineTage} giorni e non vengono eliminati né archiviati in questo periodo.`] })
    const f: string[] = []
    if (mitProdukt) f.push(`${firma} invia al Creator ${v.produkte ? 'i seguenti prodotti: ' + v.produkte : 'i prodotti concordati nella chat di Instagram'}${v.versand_bis ? `, con spedizione entro e non oltre il ${D(v.versand_bis)}` : ', tempestivamente dopo la firma'}. I prodotti passano in proprietà del Creator dopo la pubblicazione dei contenuti.`)
    if (mitFee) f.push(`${firma} corrisponde al Creator un compenso di ${E(v.fee)}. Il pagamento avviene entro ${zahlTage} giorni dalla pubblicazione dei contenuti concordati e dal ricevimento di una fattura regolare o dei dati di pagamento.`)
    list.push({ titel: `Obblighi di ${firma}`, absaetze: f })
    list.push({ titel: 'Diritti di utilizzo', absaetze: [
      `Il Creator concede a ${firma} il diritto non esclusivo, senza limiti di tempo, di condividere e ripubblicare i contenuti in modo organico sui canali propri di ${firma} (social media, sito web, newsletter), citando il Creator.`,
      v.nutzungsrechte_ads ? `Inoltre ${firma} può utilizzare i contenuti per inserzioni pubblicitarie a pagamento (ad es. Meta/TikTok Ads, whitelisting).` : `L’utilizzo per inserzioni pubblicitarie a pagamento è consentito solo previo accordo separato.`] })
    list.push({ titel: 'Inadempimento', absaetze: [`Se il Creator non pubblica i contenuti entro i termini, ${mitFee ? 'decade il diritto al compenso' : 'decade ogni ulteriore diritto'}${mitProdukt ? ' e il Creator restituisce i prodotti ricevuti a proprie spese' : ''}.`] })
    if (v.zusatz) list.push({ titel: 'Accordi aggiuntivi', absaetze: [v.zusatz] })
    list.push({ titel: 'Disposizioni finali', absaetze: [
      'Si applica il diritto tedesco. Le modifiche richiedono la forma testuale; è sufficiente un messaggio su Instagram.',
      'Il presente accordo è firmato elettronicamente. Nome, firma, data e ora e dati tecnici della sottoscrizione vengono conservati a fini probatori.'] })
    return list
  }

  // Deutsch (Standard)
  list.push({
    titel: 'Vertragsparteien',
    absaetze: [
      `Diese Vereinbarung wird geschlossen zwischen ${firma}${adr ? ', ' + adr : ''} (nachfolgend „${firma}") und ${v.creator_name}${handle} (nachfolgend „Creator").`,
    ],
  })

  const inhalt = [
    `Der Creator erstellt ${anzahl === 1 ? 'ein Video' : anzahl + ' Videos'} bzw. Inhalte für ${plattform}. Art, Umfang und Ausgestaltung der Inhalte richten sich nach der Absprache, die die Parteien im Instagram-Chat getroffen haben. Diese Absprache ist Bestandteil dieser Vereinbarung.`,
  ]
  if (v.inhalte) inhalt.push(`Zusammenfassung der Absprache: ${v.inhalte}`)
  list.push({ titel: 'Inhalte', absaetze: inhalt })

  const creator = [
    `Der Creator verpflichtet sich, die vereinbarten Inhalte zu erstellen und ${v.posting_bis ? `spätestens bis zum ${D(v.posting_bis)}` : 'innerhalb des im Instagram-Chat vereinbarten Zeitraums'} auf ${plattform} zu veröffentlichen.`,
    `Die veröffentlichten Inhalte bleiben mindestens ${onlineTage} Tage online und werden in diesem Zeitraum nicht gelöscht oder archiviert.`,
  ]
  list.push({ titel: 'Pflichten des Creators', absaetze: creator })

  const firmaPfl: string[] = []
  if (mitProdukt) {
    firmaPfl.push(
      `${firma} sendet dem Creator ${v.produkte ? 'folgende Produkte: ' + v.produkte : 'die im Instagram-Chat vereinbarten Produkte'}${v.versand_bis ? `, Versand spätestens bis zum ${D(v.versand_bis)}` : ', zeitnah nach Unterschrift'}. Die Produkte gehen nach Veröffentlichung der Inhalte in das Eigentum des Creators über.`
    )
  }
  if (mitFee) {
    firmaPfl.push(
      `${firma} zahlt dem Creator eine Vergütung von ${E(v.fee)}. Die Zahlung erfolgt innerhalb von ${zahlTage} Tagen nach Veröffentlichung der vereinbarten Inhalte und Zugang einer ordnungsgemäßen Rechnung bzw. Zahlungsdaten.`
    )
  }
  list.push({ titel: `Pflichten von ${firma}`, absaetze: firmaPfl })

  list.push({
    titel: 'Nutzungsrechte',
    absaetze: [
      `Der Creator räumt ${firma} das einfache, zeitlich unbegrenzte Recht ein, die Inhalte auf den eigenen Kanälen von ${firma} (Social Media, Website, Newsletter) organisch zu teilen und zu reposten, unter Nennung des Creators.`,
      v.nutzungsrechte_ads
        ? `Zusätzlich darf ${firma} die Inhalte für bezahlte Werbeanzeigen (z. B. Meta/TikTok Ads, Whitelisting) nutzen.`
        : `Eine Nutzung für bezahlte Werbeanzeigen ist nur nach gesonderter Absprache erlaubt.`,
    ],
  })

  list.push({
    titel: 'Nichterfüllung',
    absaetze: [
      `Veröffentlicht der Creator die Inhalte nicht fristgerecht, entfällt ${mitFee ? 'der Anspruch auf die Vergütung' : 'jeder weitere Anspruch'}${mitProdukt ? ` und der Creator sendet die erhaltenen Produkte auf eigene Kosten zurück` : ''}.`,
    ],
  })

  if (v.zusatz) list.push({ titel: 'Zusätzliche Vereinbarungen', absaetze: [v.zusatz] })

  list.push({
    titel: 'Schlussbestimmungen',
    absaetze: [
      'Es gilt das Recht der Bundesrepublik Deutschland. Änderungen bedürfen der Textform; eine Absprache per Instagram-Nachricht genügt.',
      'Die Vereinbarung wird elektronisch unterzeichnet. Name, Unterschrift, Zeitpunkt und technische Daten der Unterzeichnung werden zu Nachweiszwecken gespeichert.',
    ],
  })

  return list
}

// Texte der oeffentlichen Unterschriftsseite
export const UI: Record<Sprache, Record<string, string>> = {
  de: { loading: 'Lädt…', notFound: 'Link nicht gefunden', notFoundText: 'Dieser Link ist ungültig oder abgelaufen. Bitte melde dich bei uns.', title: 'Kooperationsvereinbarung', cancelled: 'Diese Vereinbarung ist nicht mehr gültig.', signed: 'Unterschrieben', thanks: 'Danke', signedAt: 'Unterzeichnet am', pdf: 'Als PDF speichern', signature: 'Unterschrift', signNow: 'Jetzt unterschreiben', fullName: 'Vollständiger Name *', address: 'Anschrift (optional)', addressPh: 'Straße, PLZ Ort', signHere: 'Mit dem Finger unterschreiben *', clear: 'Löschen', agree: 'Ich habe die Vereinbarung gelesen und bin einverstanden.', submit: 'Verbindlich unterschreiben', sending: 'Wird gespeichert…', errName: 'Bitte gib deinen vollständigen Namen ein.', errAgree: 'Bitte bestätige, dass du die Vereinbarung gelesen hast.', errSig: 'Bitte unterschreibe im Feld.', errSave: 'Speichern fehlgeschlagen.', errNet: 'Keine Verbindung. Bitte nochmal versuchen.' },
  en: { loading: 'Loading…', notFound: 'Link not found', notFoundText: 'This link is invalid or has expired. Please contact us.', title: 'Collaboration agreement', cancelled: 'This agreement is no longer valid.', signed: 'Signed', thanks: 'Thank you', signedAt: 'Signed on', pdf: 'Save as PDF', signature: 'Signature', signNow: 'Sign now', fullName: 'Full name *', address: 'Address (optional)', addressPh: 'Street, postcode, city', signHere: 'Sign with your finger *', clear: 'Clear', agree: 'I have read the agreement and agree to it.', submit: 'Sign (legally binding)', sending: 'Saving…', errName: 'Please enter your full name.', errAgree: 'Please confirm that you have read the agreement.', errSig: 'Please sign in the box.', errSave: 'Saving failed.', errNet: 'No connection. Please try again.' },
  fr: { loading: 'Chargement…', notFound: 'Lien introuvable', notFoundText: 'Ce lien est invalide ou a expiré. Merci de nous contacter.', title: 'Accord de collaboration', cancelled: 'Cet accord n’est plus valable.', signed: 'Signé', thanks: 'Merci', signedAt: 'Signé le', pdf: 'Enregistrer en PDF', signature: 'Signature', signNow: 'Signer maintenant', fullName: 'Nom complet *', address: 'Adresse (facultatif)', addressPh: 'Rue, code postal, ville', signHere: 'Signez avec le doigt *', clear: 'Effacer', agree: 'J’ai lu l’accord et j’y consens.', submit: 'Signer (engagement ferme)', sending: 'Enregistrement…', errName: 'Merci d’indiquer ton nom complet.', errAgree: 'Merci de confirmer que tu as lu l’accord.', errSig: 'Merci de signer dans le cadre.', errSave: 'Échec de l’enregistrement.', errNet: 'Pas de connexion. Merci de réessayer.' },
  it: { loading: 'Caricamento…', notFound: 'Link non trovato', notFoundText: 'Questo link non è valido o è scaduto. Contattaci.', title: 'Accordo di collaborazione', cancelled: 'Questo accordo non è più valido.', signed: 'Firmato', thanks: 'Grazie', signedAt: 'Firmato il', pdf: 'Salva come PDF', signature: 'Firma', signNow: 'Firma ora', fullName: 'Nome e cognome *', address: 'Indirizzo (facoltativo)', addressPh: 'Via, CAP, città', signHere: 'Firma con il dito *', clear: 'Cancella', agree: 'Ho letto l’accordo e sono d’accordo.', submit: 'Firma (vincolante)', sending: 'Salvataggio…', errName: 'Inserisci il tuo nome e cognome.', errAgree: 'Conferma di aver letto l’accordo.', errSig: 'Firma nel riquadro.', errSave: 'Salvataggio non riuscito.', errNet: 'Nessuna connessione. Riprova.' },
}

export function nachrichtVorlage(v: Vertrag, link: string) {
  const vorname = (v.creator_name || '').split(' ')[0] || ''
  const L = langOf(v)
  if (L === 'en') return `Hey ${vorname || 'there'}! 💛 As discussed in the chat, here is our short collaboration agreement with everything we agreed. Please read it through and sign it right on your phone, it only takes a minute:\n\n${link}\n\nThank you, we’re really looking forward to working with you! ✨`
  if (L === 'fr') return `Hey ${vorname || 'toi'} ! 💛 Comme convenu dans le chat, voici notre court accord de collaboration avec tout ce dont nous avons parlé. Merci de le lire et de le signer directement sur ton téléphone, ça ne prend qu’une minute :\n\n${link}\n\nMerci, nous sommes ravis de collaborer avec toi ! ✨`
  if (L === 'it') return `Ciao ${vorname || ''}! 💛 Come concordato in chat, ecco il nostro breve accordo di collaborazione con tutto quello di cui abbiamo parlato. Leggilo e firmalo direttamente dal telefono, ci vuole solo un minuto:\n\n${link}\n\nGrazie, non vediamo l’ora di collaborare con te! ✨`
  return `Hey ${vorname || 'du'}! 💛 Wie im Chat besprochen hier einmal unsere kurze Kooperationsvereinbarung mit allem, was wir abgesprochen haben. Bitte einmal durchlesen und direkt am Handy unterschreiben, dauert nur eine Minute:\n\n${link}\n\nDanke dir, wir freuen uns mega auf die Zusammenarbeit! ✨`
}
