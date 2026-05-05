export function getN8nStatus() {
  const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim();
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  return {
    configured: Boolean(webhookUrl && webhookSecret && appUrl),
    webhookUrlPresent: Boolean(webhookUrl),
    webhookSecretPresent: Boolean(webhookSecret),
    appUrlPresent: Boolean(appUrl)
  };
}
