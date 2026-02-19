import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workspaceMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { badRequest } from "@/lib/api-utils";

/** POST /api/v1/workspaces/switch — Switch active workspace */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const workspaceId = body.workspaceId as string;
  if (!workspaceId) {
    return badRequest("workspaceId is required");
  }

  // Verify user is a member of the workspace
  const membership = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.userId, session.user.id),
        eq(workspaceMembers.workspaceId, workspaceId)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Not a member of this workspace" } },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ data: { workspaceId } });
  response.cookies.set("active-workspace-id", workspaceId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
}
