"use client";

import { StickyNote, CheckSquare, UserPlus, Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "created" | "note" | "task";
  title: string;
  description?: string;
  createdAt: string;
  createdBy?: string;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-muted-foreground">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" />

      {activities.map((activity) => (
        <div key={activity.id} className="relative flex gap-3 px-3 py-2">
          <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background">
            <ActivityIcon type={activity.type} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm">{activity.title}</p>
            {activity.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {activity.description}
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatRelativeTime(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  switch (type) {
    case "created":
      return <UserPlus className="h-3 w-3 text-green-500" />;
    case "note":
      return <StickyNote className="h-3 w-3 text-blue-500" />;
    case "task":
      return <CheckSquare className="h-3 w-3 text-purple-500" />;
    default:
      return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
