import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorized, badRequest, success, notFound, requireAdmin } from "@/lib/api-utils";
import { revokeApiKey } from "@/services/api-keys";

/** DELETE /api/v1/api-keys/:keyId — Revoke an API key (admin only) */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const adminCheck = requireAdmin(ctx);
  if (adminCheck) return adminCheck;

  const { keyId } = await params;

  const revoked = await revokeApiKey(keyId, ctx.workspaceId);
  if (!revoked) {
    return notFound("API key not found or already revoked");
  }

  return success({ id: keyId, revoked: true });
}
