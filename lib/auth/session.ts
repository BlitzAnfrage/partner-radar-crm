export const adminSessionCookieName = "partner_radar_admin_session";
const sessionPayload = "partner-radar-crm-admin";

export function getAdminPassword() {
  const password = process.env.CRM_ADMIN_PASSWORD;
  if (!password) {
    throw new Error("Missing CRM_ADMIN_PASSWORD server configuration");
  }

  return password;
}

export async function createAdminSessionToken(password = getAdminPassword()) {
  return hmacSha256(sessionPayload, password);
}

export async function isValidAdminSession(token: string | undefined | null) {
  if (!token) return false;

  const expected = await createAdminSessionToken();
  return timingSafeEqual(token, expected);
}

async function hmacSha256(message: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}
