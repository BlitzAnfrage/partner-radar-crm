import { NextResponse } from "next/server";
import { isPermissionDeniedError, toSafeCrmError } from "@/lib/crm/errors";
import { listLeads } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leads = await listLeads();
    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json(
      { error: toSafeCrmError(error) },
      { status: isPermissionDeniedError(error) ? 403 : 500 }
    );
  }
}
