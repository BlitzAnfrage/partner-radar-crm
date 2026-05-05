export function isPermissionDeniedError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("permission denied");
}

export function toSafeCrmError(error: unknown) {
  if (isPermissionDeniedError(error)) {
    return "Supabase-Zugriff verweigert. Prüfe, ob SUPABASE_SERVICE_ROLE_KEY wirklich der Service-Role-Key ist und nur serverseitig verwendet wird.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "CRM-Daten konnten nicht geladen werden.";
}
