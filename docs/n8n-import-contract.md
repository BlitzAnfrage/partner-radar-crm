# n8n Import Contract

Live-App: `https://partner-radar-crm.vercel.app`

Partner Radar CRM nutzt n8n als Lead-Suchmaschine. Die CRM-App startet später den Workflow, n8n sucht OSM/Overpass-Leads und POSTet die Ergebnisse zurück an die geschützte Import-API. Supabase bleibt die Datenbank, aber n8n braucht keinen Supabase Service Role Key.

## CRM-Seiten

- Lead-Suche: `/lead-search`
- Deutsche Alias-Route: `/lead-suche`
- CRM: `/crm`
- Settings: `/settings`

## CRM startet n8n

```http
POST /api/n8n/trigger
```

Die Route ist durch den CRM-Login geschützt. Wenn n8n vollständig konfiguriert ist, sendet die App an den n8n Webhook:

```json
{
  "importRunId": "uuid",
  "callbackUrl": "https://partner-radar-crm.vercel.app/api/imports/osm-leads",
  "source": "crm",
  "mode": "osm_supabase_import",
  "secretHeaderName": "x-crm-import-secret",
  "searchConfig": {
    "region": "Saarbrücken",
    "regionGroup": "saarland",
    "country": "DE",
    "categories": [
      {
        "id": "baeckerei",
        "label": "Bäckerei",
        "group": "Essen & Trinken",
        "osmTags": [{ "key": "shop", "value": "bakery" }],
        "priority": 1
      }
    ],
    "maxLeadsPerRun": 30,
    "maxJobsPerRun": 3,
    "onlyHighQuality": true,
    "onlyWithPhone": true,
    "enableWebsiteLookup": true,
    "enableImpressumLookup": true,
    "excludeChains": true,
    "phoneOnly": true,
    "testMode": true,
    "freeMode": true,
    "duplicateMode": "ignore_existing"
  }
}
```

`N8N_WEBHOOK_SECRET` wird nur als Header gesendet, niemals im Body:

```http
x-crm-import-secret: <N8N_WEBHOOK_SECRET>
```

## Branchenbibliothek

Die CRM-App verwaltet die Branchen zentral in `lib/crm/categories.ts`. Jede Kategorie enthält:

- `id`, `label`, `group` und kurze Beschreibung.
- passende OSM-Tags als `{ key, value }`.
- Priorität und Empfehlung für Kaltakquise.
- Presets wie `Gastro lokal`, `Handwerk & Auto`, `Beauty & Gesundheit`, `Einzelhandel` und `Top Kaltakquise`.

n8n sollte die übergebene Kategorie-Liste direkt verwenden und daraus limit-schonende Overpass-Abfragen bauen. Mehrere OSM-Tags pro Kategorie sind möglich.

## Limits

Für den kostenlosen Modus empfiehlt die App:

- 3 bis 5 Suchjobs pro Lauf.
- 30 bis 50 Leads pro Lauf.
- Testmodus zuerst aktiv lassen.
- Bestehende Leads möglichst schon im Workflow auslassen.

Mehr Suchjobs dauern länger und belasten Overpass stärker. Die CRM-App schützt zusätzlich serverseitig vor Duplikaten.

## n8n sendet Leads zurück

```http
POST /api/imports/osm-leads
```

Pflicht-Header:

```http
x-crm-import-secret: <N8N_WEBHOOK_SECRET>
```

Alternative:

```http
authorization: Bearer <N8N_WEBHOOK_SECRET>
```

Secrets dürfen nicht in sichtbare Logs, Screenshots, Debug-Ausgaben oder Payloads geschrieben werden.

## Beispiel-Payload von n8n

```json
{
  "importRunId": "optional uuid",
  "source": "n8n-osm",
  "leads": [
    {
      "place_id": "osm_node_123",
      "region_name": "Saarbrücken",
      "category_group": "Essen & Trinken",
      "category": "Bäckerei",
      "query": "shop=bakery in Saarbrücken",
      "name": "Bäckerei Beispiel",
      "address": "Beispielstraße 1, 66111 Saarbrücken",
      "phone": "+49681123456",
      "email": "info@example.test",
      "emails": ["kontakt@example.test"],
      "website": "https://example.test",
      "impressum_url": "https://example.test/impressum",
      "contact_page_url": "https://example.test/kontakt",
      "extracted_emails": ["chef@example.test"],
      "extracted_phones": ["+49681123457"],
      "decision_maker_name": "Max Beispiel",
      "decision_maker_role": "Geschäftsführer",
      "decision_maker_phone": "+49681123458",
      "decision_maker_email": "max@example.test",
      "google_rating": 4.6,
      "google_review_count": 128,
      "google_maps_url": "https://maps.google.com/?q=...",
      "business_status": "OPERATIONAL",
      "enrichment_source": "website-impressum",
      "enrichment_notes": "Telefon aus Kontaktseite gefunden",
      "lat": "49,2311746",
      "lon": "6,9969327",
      "score": 88,
      "lead_quality": "A - Sofort anrufen",
      "chain_hint": "LOKAL / UNKLAR",
      "status": "NEU",
      "raw_payload": {}
    }
  ]
}
```

## Mapping

- `source_id`: `source_id`, sonst `place_id`, sonst stabiler Fallback aus Name, Adresse und Region.
- `company_name`: `company_name`, sonst `name`; Leads ohne Namen werden übersprungen.
- `emails`: kombiniert `email` und `emails`, entfernt Leerwerte und Duplikate.
- `phone`: bleibt Text, ein führendes Apostroph wird entfernt.
- `lat` / `lon`: akzeptieren Zahlen und deutsche Komma-Strings.
- `score`: wird auf `0` bis `100` begrenzt.
- `lead_quality_code`: nutzt explizit `A/B/C/D`, sonst den ersten Buchstaben aus `lead_quality`.
- `lead_quality_label`: nutzt `lead_quality_label`, sonst `lead_quality`.
- `chain_hint`: `LOKAL / UNKLAR` wird `LOCAL`, `KETTE / FILIALE` wird `CHAIN`, `BRANCH` bleibt `BRANCH`.
- `status`: `NEU` wird `NEW`; englische CRM-Status werden akzeptiert.
- `raw_payload`: enthält das originale eingehende Lead-Objekt.
- `contact_person`: nutzt `contact_person`, sonst `decision_maker_name`.
- `decision_maker_phone` und `decision_maker_email`: werden in vorhandene Spalten geschrieben.
- `maps_url`: nutzt `maps_url`, sonst `google_maps_url`.
- `impressum_url`, `contact_page_url`, Google-Daten, extrahierte E-Mails/Telefone und Anreicherungsnotizen landen in `raw_payload.enrichment`.

## Bewertung

- A-Lead: Telefonnummer vorhanden, lokal oder relevant, passende Kategorie, Adresse oder Website vorhanden, hoher Score.
- B-Lead: Telefonnummer vorhanden, aber weniger Zusatzinfos, oder Website vorhanden und Kontakt realistisch auffindbar.
- C-Lead: existiert wahrscheinlich, aber ohne Telefonnummer und eher später prüfen.
- D-Lead: Kette/Filiale, wenig Daten oder unklare Relevanz.

Die Anrufliste ist standardmäßig auf A/B Leads mit Telefonnummer ausgelegt. Leads ohne Telefonnummer sollten nur importiert werden, wenn n8n über Website, Impressum oder Google eine realistische Kontaktmöglichkeit findet oder die Suche bewusst lockerer eingestellt wurde.

## Bestehende Leads

`duplicateMode` steht auf `ignore_existing`. n8n sollte bestehende Leads möglichst nicht erneut senden. Zusätzlich prüft die Next.js Import-API `source_id`s serverseitig:

- Neue `source_id`s werden eingefügt.
- Bereits bekannte `source_id`s werden übersprungen.
- Bestehende CRM-Daten, Status, Notizen, Termine und Kontaktzähler werden nicht überschrieben.
- Die API antwortet mit `inserted_count`, `skipped_existing_count`, `failed_count` und `total_received`.

## Health Check

```http
GET /api/imports/osm-leads/health
```

Die Antwort enthält nur sichere Statuswerte:

```json
{
  "ok": true,
  "has_import_secret": true,
  "app_url_present": true,
  "data_mode": "supabase"
}
```

## Erste Tests nach Deployment

1. Health Endpoint prüfen: `/api/imports/osm-leads/health`.
2. `/lead-search` öffnen und sicherstellen, dass n8n als konfiguriert angezeigt wird.
3. Im Testmodus einen kleinen Workflow auslösen.
4. n8n POSTet mit `x-crm-import-secret` an `/api/imports/osm-leads`.
5. Danach `/crm` neu laden und importierte Leads prüfen.

Wenn n8n extern läuft, muss `NEXT_PUBLIC_APP_URL` auf die öffentliche CRM-URL zeigen. Für lokale Tests braucht ein externes n8n einen Tunnel oder eine Deploy-URL.
