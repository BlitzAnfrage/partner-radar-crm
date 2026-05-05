import { NextResponse } from "next/server";
import { isPermissionDeniedError, toSafeCrmError } from "@/lib/crm/errors";
import { updateLead } from "@/lib/crm/repository";
import type { LeadPatch, LeadStatus } from "@/types/crm";
import { leadStatuses } from "@/types/crm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const editableKeys = new Set([
  "status",
  "lastContactedAt",
  "lastContactResult",
  "contactCount",
  "callNote",
  "appointmentAt",
  "appointmentNote",
  "internalNotes",
  "updatedAt"
]);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = (await request.json()) as Record<string, unknown>;
  const patch: LeadPatch = {};

  for (const [key, value] of Object.entries(body)) {
    if (!editableKeys.has(key)) continue;

    if (key === "status" && !leadStatuses.includes(value as LeadStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (key === "contactCount" && typeof value !== "number") {
      return NextResponse.json({ error: "Invalid contact count" }, { status: 400 });
    }

    Object.assign(patch, { [key]: value });
  }

  try {
    const lead = await updateLead(params.id, patch);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead }, { headers: noStoreHeaders() });
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
