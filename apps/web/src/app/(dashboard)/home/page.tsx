"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Check,
  Circle,
  Calendar,
  StickyNote,
  CheckSquare,
  ArrowRight,
  Users,
  Building2,
  Handshake,
  Plus,
  Search,
  FileText,
  ListTodo,
  Bot,
  Upload,
  UserPlus,
  Sparkles,
  X,
} from "lucide-react";

interface Task {
  id: string;
  content: string;
  deadline: string | null;
  isCompleted: boolean;
  linkedRecords: { id: string; displayName: string; objectSlug: string }[];
}

interface Note {
  id: string;
  title: string;
  content?: string;
  recordId: string;
  recordDisplayName?: string;
  objectSlug?: string;
  updatedAt: string;
}

interface RecentRecord {
  recordId: string;
  displayName: string;
  objectSlug: string;
  objectName: string;
  objectIcon: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const OBJECT_ICONS: Record<string, React.ReactNode> = {
  people: <Users className="h-4 w-4" />,
  companies: <Building2 className="h-4 w-4" />,
  deals: <Handshake className="h-4 w-4" />,
};

// Onboarding steps
const ONBOARDING_STEPS = [
  {
    id: "add-contact",
    icon: UserPlus,
    title: "Add your first contact",
    description: "Import a spreadsheet or add someone manually",
    href: "/objects/people",
    color: "text-emerald-500",
  },
  {
    id: "track-deal",
    icon: Handshake,
    title: "Track a deal",
    description: "Create a deal to follow an opportunity through your pipeline",
    href: "/objects/deals",
    color: "text-amber-500",
  },
  {
    id: "try-ai",
    icon: Bot,
    title: "Try the AI assistant",
    description: "Ask questions about your data in plain English",
    href: "/chat",
    color: "text-violet-500",
  },
  {
    id: "invite-team",
    icon: Users,
    title: "Invite your team",
    description: "Add coworkers so everyone can collaborate",
    href: "/settings/members",
    color: "text-blue-500",
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [greeting, setGreeting] = useState("");
  const [todayDate, setTodayDate] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [stats, setStats] = useState({
    tasks: 0,
    people: 0,
    companies: 0,
    deals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dismissedSteps, setDismissedSteps] = useState<string[]>([]);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  // Load dismissed onboarding steps from localStorage
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("openclaw-onboarding-dismissed");
      if (dismissed) setDismissedSteps(JSON.parse(dismissed));
      const fullyDismissed = localStorage.getItem("openclaw-onboarding-hidden");
      if (fullyDismissed === "true") setOnboardingDismissed(true);
    } catch {}
  }, []);

  // Compute greeting/date client-side only to avoid hydration mismatch
  useEffect(() => {
    setGreeting(getGreeting());
    setTodayDate(formatTodayDate());
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [tasksRes, notesRes, browseRes, peopleRes, companiesRes, dealsRes] =
          await Promise.all([
            fetch("/api/v1/tasks?limit=10"),
            fetch("/api/v1/notes?limit=5"),
            fetch("/api/v1/records/browse?limit=5"),
            fetch("/api/v1/objects/people/records?limit=1"),
            fetch("/api/v1/objects/companies/records?limit=1"),
            fetch("/api/v1/objects/deals/records?limit=1"),
          ]);

        if (tasksRes.ok) {
          const data = await tasksRes.json();
          setTasks(data.data.tasks);
          setStats((s) => ({ ...s, tasks: data.data.pagination?.total ?? data.data.tasks.length }));
        }
        if (notesRes.ok) {
          const data = await notesRes.json();
          setNotes(data.data.notes);
        }
        if (browseRes.ok) {
          const data = await browseRes.json();
          setRecentRecords(data.data.records ?? data.data ?? []);
        }
        if (peopleRes.ok) {
          const data = await peopleRes.json();
          setStats((s) => ({ ...s, people: data.data.pagination?.total ?? 0 }));
        }
        if (companiesRes.ok) {
          const data = await companiesRes.json();
          setStats((s) => ({ ...s, companies: data.data.pagination?.total ?? 0 }));
        }
        if (dealsRes.ok) {
          const data = await dealsRes.json();
          setStats((s) => ({ ...s, deals: data.data.pagination?.total ?? 0 }));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function toggleTask(taskId: string, isCompleted: boolean) {
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

  function openCommandPalette() {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
    );
  }

  function dismissStep(stepId: string) {
    const updated = [...dismissedSteps, stepId];
    setDismissedSteps(updated);
    try { localStorage.setItem("openclaw-onboarding-dismissed", JSON.stringify(updated)); } catch {}
  }

  function dismissOnboarding() {
    setOnboardingDismissed(true);
    try { localStorage.setItem("openclaw-onboarding-hidden", "true"); } catch {}
  }

  const firstName = session?.user?.name?.split(" ")[0] ?? "";
  const isNewUser = !loading && stats.people + stats.companies + stats.deals === 0;
  const hasData = !loading && stats.people + stats.companies + stats.deals > 0;

  // Contextual nudge for greeting
  const overdueTasks = tasks.filter(
    (t) => !t.isCompleted && t.deadline && new Date(t.deadline) < new Date()
  );
  const todayTasks = tasks.filter(
    (t) => !t.isCompleted && t.deadline && new Date(t.deadline).toDateString() === new Date().toDateString()
  );

  let nudge = "";
  if (!loading && hasData) {
    if (overdueTasks.length > 0) {
      nudge = `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}`;
    } else if (todayTasks.length > 0) {
      nudge = `${todayTasks.length} task${todayTasks.length > 1 ? "s" : ""} due today`;
    } else if (stats.tasks > 0) {
      nudge = `${stats.tasks} open task${stats.tasks > 1 ? "s" : ""} to work on`;
    } else {
      nudge = "Everything looks good today";
    }
  }

  // Onboarding steps that haven't been dismissed
  const visibleSteps = ONBOARDING_STEPS.filter((s) => !dismissedSteps.includes(s.id));
  const showOnboarding = isNewUser && !onboardingDismissed && visibleSteps.length > 0;

  return (
    <div className="p-6 max-w-5xl space-y-8">
      {/* ── Greeting ─────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold">
          {greeting}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        {todayDate && (
          <p className="text-sm text-muted-foreground mt-1">
            {todayDate}
            {nudge && <span className="ml-2">·</span>}
            {nudge && <span className="ml-2">{nudge}</span>}
          </p>
        )}
      </div>

      {/* ── Onboarding (new users only) ──────────────── */}
      {showOnboarding && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium">Get started</h2>
            </div>
            <button
              onClick={dismissOnboarding}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-1 p-2 sm:grid-cols-2">
            {visibleSteps.map((step) => (
              <div
                key={step.id}
                className="group relative flex items-start gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                <div className={cn("mt-0.5 shrink-0", step.color)}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={step.href} className="text-sm font-medium hover:underline">
                    {step.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dismissStep(step.id); }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground mt-0.5"
                  title="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Stats Cards ──────────────────────────────── */}
      {hasData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/tasks">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-200/50 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900/50 p-2">
                  <ListTodo className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.tasks}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.tasks === 1 ? "open task" : "open tasks"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/objects/people">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-emerald-200/50 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/50 p-2">
                  <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.people}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.people === 1 ? "contact" : "contacts"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/objects/companies">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-violet-200/50 bg-violet-50/30 dark:border-violet-900/50 dark:bg-violet-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-violet-100 dark:bg-violet-900/50 p-2">
                  <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.companies}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.companies === 1 ? "company" : "companies"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/objects/deals">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-amber-200/50 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 dark:bg-amber-900/50 p-2">
                  <Handshake className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.deals}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.deals === 1 ? "deal in pipeline" : "deals in pipeline"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* ── Quick Actions ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => router.push("/objects/people")}
          className="flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/50 p-2 shrink-0">
            <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium">Add a contact</p>
            <p className="text-xs text-muted-foreground">Person or lead</p>
          </div>
        </button>

        <button
          onClick={() => router.push("/objects/companies")}
          className="flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="rounded-lg bg-violet-100 dark:bg-violet-900/50 p-2 shrink-0">
            <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-medium">Add a company</p>
            <p className="text-xs text-muted-foreground">Organization</p>
          </div>
        </button>

        <button
          onClick={() => router.push("/objects/deals")}
          className="flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="rounded-lg bg-amber-100 dark:bg-amber-900/50 p-2 shrink-0">
            <Plus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium">Track a deal</p>
            <p className="text-xs text-muted-foreground">Sales opportunity</p>
          </div>
        </button>

        <button
          onClick={openCommandPalette}
          className="flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="rounded-lg bg-muted p-2 shrink-0">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Search everything</p>
            <p className="text-xs text-muted-foreground">Ctrl+K</p>
          </div>
        </button>
      </div>

      {/* ── Tasks + Notes Widgets ────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tasks widget */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-medium">My Tasks</h2>
            </div>
            <Link
              href="/tasks"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-border/50">
            {loading && tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckSquare className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-xs">Loading tasks...</p>
              </div>
            )}
            {!loading && tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckSquare className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-xs">No tasks yet</p>
                <p className="text-xs mt-1">
                  Create one from any{" "}
                  <Link href="/objects/people" className="text-primary hover:underline">
                    contact
                  </Link>
                  {" "}or{" "}
                  <Link href="/objects/deals" className="text-primary hover:underline">
                    deal
                  </Link>
                  {" "}page
                </p>
              </div>
            )}
            {tasks.map((task) => {
              const isOverdue =
                task.deadline &&
                !task.isCompleted &&
                new Date(task.deadline) < new Date();

              return (
                <div
                  key={task.id}
                  className="flex items-start gap-2 px-4 py-2.5 hover:bg-muted/40 transition-colors"
                >
                  <button
                    onClick={() => toggleTask(task.id, task.isCompleted)}
                    className="shrink-0 mt-0.5"
                  >
                    {task.isCompleted ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "text-sm block truncate",
                        task.isCompleted && "line-through text-muted-foreground"
                      )}
                    >
                      {task.content}
                    </span>
                    {task.linkedRecords?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.linkedRecords.map((rec) => (
                          <Link
                            key={rec.id}
                            href={`/objects/${rec.objectSlug}/${rec.id}`}
                            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {OBJECT_ICONS[rec.objectSlug] ?? <FileText className="h-3 w-3" />}
                            {rec.displayName}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  {task.deadline && (
                    <span
                      className={cn(
                        "text-xs flex items-center gap-1 shrink-0 mt-0.5",
                        isOverdue
                          ? "text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      <Calendar className="h-3 w-3" />
                      {new Date(task.deadline).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent notes widget */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-medium">Recent Notes</h2>
            </div>
            <Link
              href="/notes"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-border/50">
            {loading && notes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <StickyNote className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-xs">Loading notes...</p>
              </div>
            )}
            {!loading && notes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <StickyNote className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-xs">No notes yet</p>
                <p className="text-xs mt-1">
                  Open a{" "}
                  <Link href="/objects/people" className="text-primary hover:underline">
                    contact
                  </Link>
                  {" "}to write your first note
                </p>
              </div>
            )}
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/objects/${note.objectSlug}/${note.recordId}`}
                className="block px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <p className="text-sm font-medium truncate">
                  {note.title || "Untitled"}
                </p>
                {note.content && typeof note.content === "string" && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                    {note.content.replace(/<[^>]*>/g, "").slice(0, 80)}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.recordDisplayName} · {relativeTime(note.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Recent Records ───────────────────────────── */}
      {recentRecords.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Records</h2>
          <Card>
            <div className="divide-y divide-border/50">
              {recentRecords.map((rec) => (
                <Link
                  key={rec.recordId}
                  href={`/objects/${rec.objectSlug}/${rec.recordId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="shrink-0 text-muted-foreground">
                    {OBJECT_ICONS[rec.objectSlug] ?? <FileText className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{rec.displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{rec.objectName}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── AI Chat CTA ──────────────────────────────── */}
      {hasData && (
        <Link href="/chat" className="block">
          <Card className="group hover:shadow-md transition-all border-primary/10 hover:border-primary/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Ask your CRM anything</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  &quot;Show me deals closing this month&quot; or &quot;How many contacts did I add this week?&quot;
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}
