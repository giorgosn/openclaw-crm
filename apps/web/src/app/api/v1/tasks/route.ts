import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorized, badRequest, success } from "@/lib/api-utils";
import { listTasks, createTask } from "@/services/tasks";

/** GET /api/v1/tasks — All tasks for current user in active workspace */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext(req);
    if (!ctx) return unauthorized();

    const { searchParams } = new URL(req.url);
    const showCompleted = searchParams.get("showCompleted") === "true";
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const offset = Number(searchParams.get("offset") || 0);

    const result = await listTasks(ctx.workspaceId, ctx.userId, { showCompleted, limit, offset });

    return success({
      tasks: result.tasks,
      pagination: { limit, offset, total: result.total },
    });
  } catch (err) {
    console.error("GET /api/v1/tasks error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: String(err) } },
      { status: 500 }
    );
  }
}

/** POST /api/v1/tasks — Create task */
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (!body.content) return badRequest("content is required");

  try {
    const task = await createTask(body.content as string, ctx.userId, ctx.workspaceId, {
      deadline: body.deadline as string | undefined,
      recordIds: body.recordIds as string[] | undefined,
      assigneeIds: body.assigneeIds as string[] | undefined,
    });

    return success(task, 201);
  } catch (err) {
    console.error("Failed to create task:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create task" } },
      { status: 500 }
    );
  }
}
