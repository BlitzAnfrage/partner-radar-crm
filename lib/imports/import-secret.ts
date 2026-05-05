export type ImportSecretDiagnostics = {
  missing_env_secret: boolean;
  missing_request_secret: boolean;
  secret_length_matches: boolean;
  hint: string;
};

export function getImportSecret() {
  return process.env.N8N_WEBHOOK_SECRET?.trim() ?? "";
}

export function getRequestImportSecret(request: Request) {
  const directHeader = request.headers.get("x-crm-import-secret")?.trim() ?? "";
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  const bearerSecret = bearerMatch?.[1]?.trim() ?? "";

  return directHeader || bearerSecret;
}

export function verifyImportSecret(request: Request) {
  const expected = getImportSecret();
  const received = getRequestImportSecret(request);
  const diagnostics = getImportSecretDiagnostics(expected, received);

  return {
    authorized: Boolean(expected && received && timingSafeEqual(expected, received)),
    diagnostics
  };
}

export function getImportSecretDiagnostics(expected = getImportSecret(), received = ""): ImportSecretDiagnostics {
  const missingEnvSecret = expected.length === 0;
  const missingRequestSecret = received.length === 0;
  const secretLengthMatches = Boolean(expected && received && expected.length === received.length);

  return {
    missing_env_secret: missingEnvSecret,
    missing_request_secret: missingRequestSecret,
    secret_length_matches: secretLengthMatches,
    hint: getHint(missingEnvSecret, missingRequestSecret, secretLengthMatches)
  };
}

function getHint(missingEnvSecret: boolean, missingRequestSecret: boolean, secretLengthMatches: boolean) {
  if (missingEnvSecret) return "N8N_WEBHOOK_SECRET ist in der Server-Umgebung nicht gesetzt.";
  if (missingRequestSecret) return "Sende x-crm-import-secret oder Authorization: Bearer <secret>.";
  if (!secretLengthMatches) return "Secret wurde empfangen, passt aber nicht zur erwarteten Länge.";
  return "Secret wurde empfangen, stimmt aber nicht mit der Server-Konfiguration überein.";
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}
