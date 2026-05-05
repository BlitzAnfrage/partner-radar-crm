import { NextResponse } from "next/server";
import { isPermissionDeniedError, toSafeCrmError } from "@/lib/crm/errors";
import { listLeads } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const leads = await listLeads();
    return NextResponse.json({ leads }, { headers: noStoreHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: toSafeCrmError(error) },
      { status: isPermissionDeniedError(error) ? 403 : 500, headers: noStoreHeaders() }
    );
  }
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate"
  };
}
