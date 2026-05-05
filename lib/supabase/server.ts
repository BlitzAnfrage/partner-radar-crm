import "server-only";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server configuration");
  }

  const role = getJwtRole(serviceRoleKey);
  if (role && role !== "service_role") {
    throw new Error("Supabase server configuration is not using a service role key");
  }

  return { url, serviceRoleKey };
}

export function createSupabaseServerClient() {
  const { url, serviceRoleKey } = getSupabaseServerConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function getJwtRole(key: string) {
  const parts = key.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      role?: string;
    };
    return payload.role ?? null;
  } catch {
    return null;
  }
}
