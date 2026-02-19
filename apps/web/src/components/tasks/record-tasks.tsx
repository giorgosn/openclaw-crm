"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Check, Circle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskDialog } from "./task-dialog";
import { isToday, isTomorrow, differenceInDays, format } from "date-fns";

interface Task {
  id: string;
  content: string;
  deadline: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  linkedRecords: { id: string; displayName: string; objectSlug: string }[];
  assignees: { id: string; name: string; email: string }[];
}

interface RecordTasksProps {
  objectSlug: string;
  recordId: string;
  recordDisplayName?: string;
}

function getRelativeDate(deadline: string): {
  label: string;
  color: string;
} {
  const d = new Date(deadline);
  if (isToday(d)) return { label: "Today", color: "text-orange-400" };
  if (isTomorrow(d)) return { label: "Tomorrow", color: "text-orange-400" };
  const days = differenceInDays(d, new Date());
  if (days < 0) return { label: "Overdue", color: "text-destructive" };
  if (days <= 7) return { label: format(d, "EEEE"), color: "text-muted-foreground" };
  return { label: format(d, "MMM d"), color: "text-muted-foreground" };
}

export function RecordTasks({
  objectSlug,
  recordId,
  recordDisplayName,
}: RecordTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/objects/${objectSlug}/records/${recordId}/tasks`
      );
      if (res.ok) {
        const data = await res.json();
        setTasks(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [objectSlug, recordId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetch("/api/auth/get-session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) setCurrentUserId(data.user.id);
      })
      .catch(() => {});
  }, []);

  async function toggleComplete(taskId: string, isCompleted: boolean) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, isCompleted: !isCompleted } : t
      )
    );
    await fetch(`/api/v1/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !isCompleted }),
    });
  }

  function openCreateDialog() {
    setDialogMode("create");
    setEditingTask(null);
    setDialogOpen(true);
  }

  function openEditDialog(task: Task) {
    setDialogMode("edit");
    setEditingTask(task);
    setDialogOpen(true);
  }

  async function handleSave(data: {
    content: string;
    deadline: string | null;
    recordIds: string[];
    assigneeIds: string[];
  }) {
    if (dialogMode === "create") {
      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create task");
    } else if (editingTask) {
      const res = await fetch(`/api/v1/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
    }
    fetchTasks();
  }

  async function handleDelete() {
    if (!editingTask) return;
    await fetch(`/api/v1/tasks/${editingTask.id}`, { method: "DELETE" });
    fetchTasks();
  }

  const openTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Tasks</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={openCreateDialog}
          className="text-xs"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add task
        </Button>
      </div>

      {loading && tasks.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Loading...
        </p>
      )}

      {!loading && tasks.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">
          No tasks yet
        </p>
      )}

      <div className="space-y-1">
        {openTasks.map((task) => {
          const dateInfo = task.deadline
            ? getRelativeDate(task.deadline)
            : null;
          return (
            <div
              key={task.id}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/30 cursor-pointer"
              onClick={() => openEditDialog(task)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleComplete(task.id, task.isCompleted);
                }}
                className="shrink-0"
              >
                <Circle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
              </button>
              <span className="text-sm flex-1 truncate">{task.content}</span>
              {dateInfo && (
                <span
                  className={cn(
                    "text-xs flex items-center gap-1 shrink-0",
                    dateInfo.color
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {dateInfo.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {completedTasks.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground pt-2">
            Completed ({completedTasks.length})
          </p>
          {completedTasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/30 cursor-pointer"
              onClick={() => openEditDialog(task)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleComplete(task.id, task.isCompleted);
                }}
                className="shrink-0"
              >
                <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              </button>
              <span className="text-sm flex-1 truncate line-through text-muted-foreground">
                {task.content}
              </span>
            </div>
          ))}
        </div>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        currentUserId={currentUserId}
        defaultRecordId={recordId}
        defaultRecordName={recordDisplayName}
        defaultRecordSlug={objectSlug}
        initialData={
          editingTask
            ? {
                id: editingTask.id,
                content: editingTask.content,
                deadline: editingTask.deadline
                  ? new Date(editingTask.deadline)
                  : null,
                assigneeIds: editingTask.assignees.map((a) => a.id),
                recordIds: editingTask.linkedRecords.map((r) => r.id),
                linkedRecords: editingTask.linkedRecords,
                assignees: editingTask.assignees,
              }
            : undefined
        }
        onSave={handleSave}
        onDelete={dialogMode === "edit" ? handleDelete : undefined}
      />
    </div>
  );
}
