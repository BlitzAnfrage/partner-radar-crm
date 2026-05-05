export function isPermissionDeniedError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("permission denied");
}

export function toSafeCrmError(error: unknown) {
  if (isPermissionDeniedError(error)) {
    return "Supabase-Zugriff verweigert. Prüfe, ob SUPABASE_SERVICE_ROLE_KEY wirklich der Service-Role-Key ist und nur serverseitig verwendet wird.";
  }

  if (error instanceof Error) {
    if (error.message.includes("Missing Supabase server configuration")) {
      return "Supabase ist serverseitig noch nicht vollständig konfiguriert.";
    }

    if (error.message.includes("service role")) {
      return "Supabase Server-Konfiguration verwendet keinen gültigen Service-Role-Zugriff.";
    }
  }

  return "CRM-Daten konnten nicht geladen werden.";
}
