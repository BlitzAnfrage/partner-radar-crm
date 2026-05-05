# Partner Radar CRM

Private Next.js CRM-Plattform für lokale Lead-Akquise.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Wichtige Routen:

- `/` Home Cockpit
- `/crm` Lead-Bearbeitung
- `/lead-search` Lead-Suche
- `/lead-suche` deutscher Alias
- `/settings` Systemstatus
- `/login` privater Zugang

## Environment Variables

Nur Namen, keine Werte:

- `NEXT_PUBLIC_APP_URL`
- `CRM_ADMIN_PASSWORD`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_URL`
- `N8N_WEBHOOK_SECRET`
- `CRM_DATA_MODE`

`SUPABASE_SERVICE_ROLE_KEY` darf nur serverseitig genutzt werden. Keine Client-Komponente darf diesen Key lesen oder anzeigen.

## Production-Verhalten

In Production zeigt die App ausschließlich Supabase-Daten. Mock-Daten bleiben nur für lokale Entwicklung als Fallback erhalten.

Live-Daten-Seiten und API-Routen sind dynamisch konfiguriert, damit CRM- und Importdaten nicht statisch gecacht werden.

## Supabase und Import

Supabase speichert Leads, Kontaktlogik und Importläufe. Die Import-API akzeptiert externe Leads über `/api/imports/osm-leads` mit Import-Secret. n8n benötigt keinen Supabase-Key.

Der n8n Trigger unter `/api/n8n/trigger` bleibt vorbereitet und wird nur durch Nutzeraktion gestartet.
