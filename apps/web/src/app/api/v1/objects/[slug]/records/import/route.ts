import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, badRequest, success } from "@/lib/api-utils";
import { getObjectBySlug } from "@/services/objects";
import { createRecord } from "@/services/records";

/**
 * POST /api/v1/objects/[slug]/records/import
 * Body: { rows: Array<Record<string, unknown>> }
 * Each row is keyed by attribute slug with the appropriate value.
 * Returns: { created: number, errors: Array<{ row: number, message: string }> }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { slug } = await params;
  const obj = await getObjectBySlug(ctx.workspaceId, slug);
  if (!obj) return notFound("Object not found");

  const body = await req.json();
  const { rows } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return badRequest("rows must be a non-empty array");
  }

  if (rows.length > 1000) {
    return badRequest("Maximum 1000 rows per import");
  }

  let created = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || typeof row !== "object") {
      errors.push({ row: i, message: "Invalid row data" });
      continue;
    }

    // Skip rows where all values are empty
    const hasAnyValue = Object.values(row).some(
      (v) => v !== null && v !== undefined && v !== ""
    );
    if (!hasAnyValue) continue;

    try {
      await createRecord(obj.id, row, ctx.userId);
      created++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push({ row: i, message });
    }
  }

  return success({ created, errors, total: rows.length });
}
