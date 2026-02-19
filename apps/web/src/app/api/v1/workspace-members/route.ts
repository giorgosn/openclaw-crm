import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, success, badRequest } from "@/lib/api-utils";
import { listMembers, addMemberByEmail } from "@/services/workspace";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const members = await listMembers(ctx.workspaceId);
  return success(members);
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  if (ctx.workspaceRole !== "admin") {
    return badRequest("Only admins can add members");
  }

  const body = await req.json();
  const { email, role } = body;

  if (!email) return badRequest("email is required");

  try {
    const member = await addMemberByEmail(
      ctx.workspaceId,
      email,
      role ?? "member"
    );
    return success(member, 201);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to add member";
    return badRequest(message);
  }
}
