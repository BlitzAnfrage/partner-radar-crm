# n8n Import Contract

Partner Radar CRM nutzt n8n als Lead-Suchmaschine. n8n findet OSM/Overpass-Leads und sendet sie an die Next.js-App. Die Next.js-App normalisiert die Daten und schreibt sie serverseitig in Supabase.

## Ziel

- n8n sucht Leads.
- Next.js empfängt Leads unter `/api/imports/osm-leads`.
- Supabase speichert Leads in `public.leads`.
- n8n braucht keinen Supabase Service Role Key.

## Endpoint

```http
POST /api/imports/osm-leads
```

Pflicht-Header:

```http
x-crm-import-secret: <N8N_WEBHOOK_SECRET>
```

Alternativ:

```http
authorization: Bearer <N8N_WEBHOOK_SECRET>
```

Der Secret-Wert darf nicht in sichtbare Logs, Screenshots, Debug-Ausgaben oder Payloads geschrieben werden.

## Beispiel-Payload

```json
{
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
- `chain_hint`: `LOKAL / UNKLAR` wird `LOCAL`, `KETTE / FILIALE` wird `CHAIN`.
- `status`: `NEU` wird `NEW`; englische CRM-Status werden direkt akzeptiert.
- `raw_payload`: enthält das originale eingehende Lead-Objekt.

## Bestehende Leads

Bei bekannten `source_id`s aktualisiert die App nur Quelle/Anreicherung wie Adresse, Website, Kategorie, Score oder Koordinaten. CRM-Workflow-Felder wie Status, Notizen, Termine und Kontaktzähler werden nicht überschrieben.

## Lokal vs. Produktion

Ein extern laufendes n8n kann `localhost` nicht direkt erreichen. Für lokale Tests braucht es einen Tunnel wie ngrok oder später eine echte Produktions-URL. In Produktion sollte `NEXT_PUBLIC_APP_URL` auf die öffentliche CRM-URL zeigen.
