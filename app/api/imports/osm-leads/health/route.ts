import { NextResponse } from "next/server";
import { getDataMode } from "@/lib/crm/config";
import { getImportSecret } from "@/lib/imports/import-secret";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      has_import_secret: Boolean(getImportSecret()),
      app_url_present: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
      data_mode: getDataMode()
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    }
  );
}
