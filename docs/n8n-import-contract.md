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
    "categories": ["Bäckerei", "Café"],
    "quality": "A",
    "maxLeads": 50,
    "excludeChains": true,
    "phoneOnly": false,
    "testMode": true
  }
}
```

`N8N_WEBHOOK_SECRET` wird nur als Header gesendet, niemals im Body:

```http
x-crm-import-secret: <N8N_WEBHOOK_SECRET>
```

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

## Bestehende Leads

Bei bekannten `source_id`s aktualisiert die App nur Anreicherungsfelder wie Adresse, Website, Kategorie, Score oder Koordinaten. CRM-Workflow-Felder wie Status, Notizen, Termine, E-Mail-Entwürfe und Kontaktzähler werden nicht überschrieben.

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
