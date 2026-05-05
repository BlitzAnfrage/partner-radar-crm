import { LockKeyhole } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const missingPassword = !process.env.CRM_ADMIN_PASSWORD;
  const hasError = searchParams.error === "1";
  const next = typeof searchParams.next === "string" ? searchParams.next : "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4 py-10">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-soft">
        <div className="mb-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Partner Radar CRM</h1>
          <p className="mt-2 text-sm text-slate-500">Privater Zugang</p>
        </div>

        {missingPassword ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
            CRM_ADMIN_PASSWORD fehlt in der Server-Konfiguration.
          </div>
        ) : (
          <form action="/api/auth/login" method="post" className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Passwort</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-400"
                autoFocus
              />
            </label>
            {hasError ? <div className="text-sm font-medium text-red-600">Passwort stimmt nicht.</div> : null}
            <button
              type="submit"
              className="h-12 w-full rounded-2xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Einloggen
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
