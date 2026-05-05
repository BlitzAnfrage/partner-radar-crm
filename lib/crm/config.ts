export function getDataMode() {
  if (process.env.NODE_ENV === "production") {
    return "supabase";
  }

  return process.env.CRM_DATA_MODE === "supabase" ? "supabase" : "mock";
}

export function getPublicConfigStatus() {
  return {
    dataMode: getDataMode(),
    supabaseUrlPresent: Boolean(process.env.SUPABASE_URL),
    supabaseServiceRolePresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    n8nWebhookUrlPresent: Boolean(process.env.N8N_WEBHOOK_URL),
    n8nWebhookSecretPresent: Boolean(process.env.N8N_WEBHOOK_SECRET),
    appUrlPresent: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    adminPasswordPrepared: Boolean(process.env.CRM_ADMIN_PASSWORD)
  };
}
