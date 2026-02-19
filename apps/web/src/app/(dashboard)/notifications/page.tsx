"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Loader2, ExternalLink } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  url: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/notifications?limit=50");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data?.notifications ?? []);
        setUnreadCount(data.data?.unreadCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function handleMarkAllRead() {
    await fetch("/api/v1/notifications/mark-all-read", { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
    setUnreadCount(0);
  }

  async function handleMarkRead(id: string) {
    await fetch(`/api/v1/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  function timeAgo(date: string) {
    const seconds = Math.floor(
      (Date.now() - new Date(date).getTime()) / 1000
    );
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-1 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No notifications</p>
          <p className="text-sm mt-1">You&apos;re all caught up</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 rounded-lg px-4 py-3 transition-colors ${
                notif.isRead
                  ? "opacity-60"
                  : "bg-accent/30"
              }`}
            >
              {/* Unread indicator */}
              <div className="mt-1.5 shrink-0">
                {!notif.isRead ? (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                ) : (
                  <div className="h-2 w-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{notif.title}</p>
                {notif.body && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {notif.body}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  {timeAgo(notif.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {notif.url && (
                  <Link href={notif.url}>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
                {!notif.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMarkRead(notif.id)}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
