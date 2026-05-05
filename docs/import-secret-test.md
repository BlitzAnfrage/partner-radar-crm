# Import Secret Test

Diese Anleitung nutzt nur ein Test-Secret. Keine echten Secrets in Chat, Logs oder Screenshots kopieren.

## Lokal mit Test-Secret prüfen

1. In `.env.local` lokal setzen:

```bash
N8N_WEBHOOK_SECRET=test-import-secret
```

2. Dev-Server neu starten.

3. Health prüfen:

```bash
curl http://localhost:3000/api/imports/osm-leads/health
```

Erwartung:

```json
{
  "ok": true,
  "has_import_secret": true
}
```

4. Unauthorized-Diagnose ohne Header prüfen:

```bash
curl -i -X POST http://localhost:3000/api/imports/osm-leads \
  -H "Content-Type: application/json" \
  -d "{\"leads\":[]}"
```

5. Erfolgreichen Header-Test prüfen:

```bash
curl -i -X POST http://localhost:3000/api/imports/osm-leads \
  -H "Content-Type: application/json" \
  -H "x-crm-import-secret: test-import-secret" \
  -d "{\"source\":\"local-test\",\"leads\":[]}"
```

Alternativ:

```bash
curl -i -X POST http://localhost:3000/api/imports/osm-leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-import-secret" \
  -d "{\"source\":\"local-test\",\"leads\":[]}"
```

Für Vercel muss `N8N_WEBHOOK_SECRET` als Environment Variable gesetzt sein. Danach neu deployen.
