import { db } from "@/db";
import {
  tasks,
  taskRecords,
  taskAssignees,
  users,
} from "@/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { batchGetRecordDisplayNames } from "./display-names";

export interface TaskData {
  id: string;
  content: string;
  deadline: Date | null;
  isCompleted: boolean;
  completedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  linkedRecords: { id: string; displayName: string; objectSlug: string }[];
  assignees: { id: string; name: string; email: string }[];
}

/** Batch-enrich an array of task rows into TaskData[] (~3 queries total) */
async function enrichTasks(
  taskRows: (typeof tasks.$inferSelect)[]
): Promise<TaskData[]> {
  if (taskRows.length === 0) return [];

  const taskIds = taskRows.map((t) => t.id);

  // 1. Batch get all task_records + task_assignees in parallel
  const [allTaskRecords, allTaskAssignees] = await Promise.all([
    db
      .select({ taskId: taskRecords.taskId, recordId: taskRecords.recordId })
      .from(taskRecords)
      .where(inArray(taskRecords.taskId, taskIds)),
    db
      .select({
        taskId: taskAssignees.taskId,
        userId: taskAssignees.userId,
        name: users.name,
        email: users.email,
      })
      .from(taskAssignees)
      .innerJoin(users, eq(taskAssignees.userId, users.id))
      .where(inArray(taskAssignees.taskId, taskIds)),
  ]);

  // 2. Collect unique recordIds and batch-resolve display names
  const allRecordIds = [...new Set(allTaskRecords.map((tr) => tr.recordId))];
  const displayMap = await batchGetRecordDisplayNames(allRecordIds);

  // 3. Group by taskId
  const recordsByTask = new Map<string, { id: string; displayName: string; objectSlug: string }[]>();
  for (const tr of allTaskRecords) {
    const info = displayMap.get(tr.recordId);
    const arr = recordsByTask.get(tr.taskId) || [];
    arr.push({
      id: tr.recordId,
      displayName: info?.displayName || "Unknown",
      objectSlug: info?.objectSlug || "",
    });
    recordsByTask.set(tr.taskId, arr);
  }

  const assigneesByTask = new Map<string, { id: string; name: string; email: string }[]>();
  for (const ta of allTaskAssignees) {
    const arr = assigneesByTask.get(ta.taskId) || [];
    arr.push({ id: ta.userId, name: ta.name, email: ta.email });
    assigneesByTask.set(ta.taskId, arr);
  }

  return taskRows.map((t) => ({
    id: t.id,
    content: t.content,
    deadline: t.deadline,
    isCompleted: t.isCompleted,
    completedAt: t.completedAt,
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    linkedRecords: recordsByTask.get(t.id) || [],
    assignees: assigneesByTask.get(t.id) || [],
  }));
}

// ─── CRUD ────────────────────────────────────────────────────────────

export async function listTasks(
  workspaceId: string,
  _createdBy: string,
  options: { showCompleted?: boolean; limit?: number; offset?: number } = {}
) {
  const { showCompleted = false, limit = 50, offset = 0 } = options;

  let whereClause;
  if (showCompleted) {
    whereClause = eq(tasks.workspaceId, workspaceId);
  } else {
    whereClause = and(
      eq(tasks.workspaceId, workspaceId),
      eq(tasks.isCompleted, false)
    );
  }

  const [taskRows, [countResult]] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(whereClause)
      .orderBy(tasks.deadline, desc(tasks.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(whereClause),
  ]);

  return { tasks: await enrichTasks(taskRows), total: Number(countResult.count) };
}

export async function getTasksForRecord(recordId: string) {
  const trRows = await db
    .select({ taskId: taskRecords.taskId })
    .from(taskRecords)
    .where(eq(taskRecords.recordId, recordId));

  if (trRows.length === 0) return [];

  const taskIds = trRows.map((r) => r.taskId);
  const taskRows = await db
    .select()
    .from(tasks)
    .where(inArray(tasks.id, taskIds))
    .orderBy(tasks.deadline, desc(tasks.createdAt));

  return enrichTasks(taskRows);
}

export async function createTask(
  content: string,
  createdBy: string,
  workspaceId: string,
  options: {
    deadline?: string | null;
    recordIds?: string[];
    assigneeIds?: string[];
  } = {}
) {
  const [task] = await db
    .insert(tasks)
    .values({
      content,
      createdBy,
      workspaceId,
      deadline: options.deadline ? new Date(options.deadline) : null,
    })
    .returning();

  // Link records
  if (options.recordIds && options.recordIds.length > 0) {
    await db.insert(taskRecords).values(
      options.recordIds.map((recordId) => ({
        taskId: task.id,
        recordId,
      }))
    );
  }

  // Add assignees
  if (options.assigneeIds && options.assigneeIds.length > 0) {
    await db.insert(taskAssignees).values(
      options.assigneeIds.map((userId) => ({
        taskId: task.id,
        userId,
      }))
    );
  }

  return (await enrichTasks([task]))[0];
}

export async function updateTask(
  taskId: string,
  workspaceId: string,
  updates: {
    content?: string;
    deadline?: string | null;
    isCompleted?: boolean;
    recordIds?: string[];
    assigneeIds?: string[];
  }
) {
  // Verify task belongs to workspace
  const [existing] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .limit(1);

  if (!existing) return null;

  const setValues: Record<string, unknown> = {};
  if (updates.content !== undefined) setValues.content = updates.content;
  if (updates.deadline !== undefined) {
    setValues.deadline = updates.deadline ? new Date(updates.deadline) : null;
  }
  if (updates.isCompleted !== undefined) {
    setValues.isCompleted = updates.isCompleted;
    setValues.completedAt = updates.isCompleted ? new Date() : null;
  }

  if (Object.keys(setValues).length > 0) {
    const [updated] = await db
      .update(tasks)
      .set(setValues)
      .where(eq(tasks.id, taskId))
      .returning();
    if (!updated) return null;
  }

  // Replace linked records
  if (updates.recordIds !== undefined) {
    await db.delete(taskRecords).where(eq(taskRecords.taskId, taskId));
    if (updates.recordIds.length > 0) {
      await db.insert(taskRecords).values(
        updates.recordIds.map((recordId) => ({ taskId, recordId }))
      );
    }
  }

  // Replace assignees
  if (updates.assigneeIds !== undefined) {
    await db.delete(taskAssignees).where(eq(taskAssignees.taskId, taskId));
    if (updates.assigneeIds.length > 0) {
      await db.insert(taskAssignees).values(
        updates.assigneeIds.map((userId) => ({ taskId, userId }))
      );
    }
  }

  // Re-fetch the task to return enriched data
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task) return null;
  return (await enrichTasks([task]))[0];
}

export async function deleteTask(taskId: string, workspaceId: string) {
  const [task] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning();
  return task;
}

/** Get tasks that are due soon (for home page widget) */
export async function getUpcomingTasks(workspaceId: string, _createdBy: string, limit = 10) {
  const taskRows = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, workspaceId),
        eq(tasks.isCompleted, false)
      )
    )
    .orderBy(tasks.deadline, desc(tasks.createdAt))
    .limit(limit);

  return enrichTasks(taskRows);
}
