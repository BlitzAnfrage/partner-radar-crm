# Supabase Vorbereitung

Codex hat nur lokale Dateien erstellt. Es wurde kein SQL ausgeführt und keine Verbindung zu Supabase aufgebaut.

## Tabellen

- `leads`: zentrale Lead-Daten, inklusive Kontaktfeldern, Status, Score, Qualität, Region und eindeutiger `source_id`.
- `contact_logs`: Verlauf für Anrufe, E-Mails, Termine und Notizen je Lead.
- `import_runs`: spätere n8n-Importläufe mit Zählern, Status und Fehlertext.
- `app_settings`: einfache serverseitige Konfiguration als Key/Value-Tabelle.

## Migration später manuell ausführen

Die Datei `supabase/migrations/001_initial_schema.sql` ist vorbereitet. Führe sie später manuell in Supabase aus, zum Beispiel über den SQL Editor oder die Supabase CLI, nachdem das Projekt bewusst verbunden wurde.

## Environment Variablen

Diese Werte werden später benötigt:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRM_DATA_MODE=supabase`

`SUPABASE_SERVICE_ROLE_KEY` darf ausschließlich serverseitig verwendet werden. Dieser Key darf niemals in Browser-Code, Client Components, öffentliche Bundles oder `NEXT_PUBLIC_*` Variablen gelangen.

## Sicherheit

RLS ist in der Migration für alle Tabellen aktiviert. Es werden bewusst keine öffentlichen Policies angelegt. Zugriff soll später kontrolliert über serverseitige CRM-Routen oder einen privaten Admin-Gate erfolgen.
