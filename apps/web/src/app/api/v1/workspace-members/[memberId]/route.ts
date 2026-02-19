import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, badRequest, success } from "@/lib/api-utils";
import { updateMemberRole, removeMember } from "@/services/workspace";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  if (ctx.workspaceRole !== "admin") {
    return badRequest("Only admins can change member roles");
  }

  const { memberId } = await params;
  const body = await req.json();
  const { role } = body;

  if (!role || !["admin", "member"].includes(role)) {
    return badRequest("role must be 'admin' or 'member'");
  }

  const updated = await updateMemberRole(ctx.workspaceId, memberId, role);
  if (!updated) return notFound("Member not found");

  return success(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  if (ctx.workspaceRole !== "admin") {
    return badRequest("Only admins can remove members");
  }

  const { memberId } = await params;

  try {
    const removed = await removeMember(ctx.workspaceId, memberId);
    if (!removed) return notFound("Member not found");
    return success(removed);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to remove member";
    return badRequest(message);
  }
}
