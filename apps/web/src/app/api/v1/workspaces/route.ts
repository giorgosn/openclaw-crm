import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { success, badRequest } from "@/lib/api-utils";
import { createWorkspace, listUserWorkspaces } from "@/services/workspace";

/** GET /api/v1/workspaces — List workspaces the current user belongs to */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const workspaces = await listUserWorkspaces(session.user.id);
  return success(workspaces);
}

/** POST /api/v1/workspaces — Create a new workspace */
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

  const name = body.name as string;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return badRequest("name is required");
  }

  try {
    const workspace = await createWorkspace(name.trim(), session.user.id);

    // Set active-workspace-id cookie
    const response = NextResponse.json({ data: workspace }, { status: 201 });
    response.cookies.set("active-workspace-id", workspace.id, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (err) {
    console.error("Failed to create workspace:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create workspace" } },
      { status: 500 }
    );
  }
}
