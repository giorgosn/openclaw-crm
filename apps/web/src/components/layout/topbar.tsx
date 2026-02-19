"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Search, LogOut, Bell, Menu } from "lucide-react";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/v1/notifications?limit=1");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.data?.unreadCount ?? 0);
        }
      } catch {
        // ignore
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  function openCommandPalette() {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
    );
  }

  return (
    <header className="flex h-12 items-center justify-between border-b border-border/50 px-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onMenuClick}>
          <Menu className="h-4 w-4" />
        </Button>

        <button
          onClick={openCommandPalette}
          className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="ml-4 hidden text-[10px] font-medium text-muted-foreground/60 sm:inline">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <Link href="/notifications" className="relative">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {session?.user && (
          <span className="px-2 text-sm text-muted-foreground">{session.user.name}</span>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
