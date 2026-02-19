import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, unauthorized, notFound, success } from "@/lib/api-utils";
import { updateTask, deleteTask } from "@/services/tasks";

/** PATCH /api/v1/tasks/[taskId] */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { taskId } = await params;

  try {
    const body = await req.json();
    const task = await updateTask(taskId, ctx.workspaceId, body);
    if (!task) return notFound("Task not found");
    return success(task);
  } catch (err) {
    console.error("Failed to update task:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update task" } },
      { status: 500 }
    );
  }
}

/** DELETE /api/v1/tasks/[taskId] */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { taskId } = await params;

  try {
    const task = await deleteTask(taskId, ctx.workspaceId);
    if (!task) return notFound("Task not found");
    return success({ deleted: true });
  } catch (err) {
    console.error("Failed to delete task:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete task" } },
      { status: 500 }
    );
  }
}
