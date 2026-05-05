export function getN8nStatus() {
  return {
    configured: Boolean(process.env.N8N_WEBHOOK_URL && process.env.N8N_WEBHOOK_SECRET),
    webhookUrlPresent: Boolean(process.env.N8N_WEBHOOK_URL),
    webhookSecretPresent: Boolean(process.env.N8N_WEBHOOK_SECRET)
  };
}
