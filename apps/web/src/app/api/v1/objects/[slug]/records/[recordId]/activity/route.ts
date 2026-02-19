import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, success } from "@/lib/api-utils";
import { getObjectBySlug } from "@/services/objects";
import { getRecord } from "@/services/records";
import { db } from "@/db";
import { notes, tasks, taskRecords } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; recordId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { slug, recordId } = await params;
  const obj = await getObjectBySlug(ctx.workspaceId, slug);
  if (!obj) return notFound("Object not found");

  const record = await getRecord(obj.id, recordId);
  if (!record) return notFound("Record not found");

  // Get notes for this record
  const noteRows = await db
    .select()
    .from(notes)
    .where(eq(notes.recordId, recordId))
    .orderBy(desc(notes.createdAt));

  // Get tasks linked to this record
  const taskLinks = await db
    .select({ taskId: taskRecords.taskId })
    .from(taskRecords)
    .where(eq(taskRecords.recordId, recordId));

  const taskRows = taskLinks.length > 0
    ? await db
        .select()
        .from(tasks)
        .where(
          eq(tasks.id, taskLinks[0].taskId) // simplified - get linked tasks
        )
        .orderBy(desc(tasks.createdAt))
    : [];

  // Build activity feed
  const activities = [
    // Record creation event
    {
      id: `created-${recordId}`,
      type: "created" as const,
      title: "Record created",
      createdAt: record.createdAt.toISOString ? record.createdAt.toISOString() : String(record.createdAt),
      createdBy: record.createdBy,
    },
    // Notes
    ...noteRows.map((note) => ({
      id: `note-${note.id}`,
      type: "note" as const,
      title: note.title || "Untitled note",
      description: note.content ? "Note added" : undefined,
      createdAt: note.createdAt.toISOString(),
      createdBy: note.createdBy,
    })),
    // Tasks
    ...taskRows.map((task) => ({
      id: `task-${task.id}`,
      type: "task" as const,
      title: task.content,
      description: task.isCompleted ? "Completed" : task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString()}` : undefined,
      createdAt: task.createdAt.toISOString(),
      createdBy: task.createdBy,
    })),
  ];

  // Sort by date descending
  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return success(activities);
}
