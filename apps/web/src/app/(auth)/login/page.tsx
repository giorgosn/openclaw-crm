"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { trackEvent } from "@/lib/analytics";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/home";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePostLogin() {
    // Fetch user's workspaces to determine routing
    try {
      const res = await fetch("/api/v1/workspaces");
      if (!res.ok) {
        router.push("/select-workspace");
        return;
      }
      const data = await res.json();
      const workspaces = data.data || [];

      if (workspaces.length === 0) {
        // No workspaces — create one
        router.push("/select-workspace");
      } else if (workspaces.length === 1) {
        // Auto-select the only workspace
        const switchRes = await fetch("/api/v1/workspaces/switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: workspaces[0].id }),
        });
        if (switchRes.ok) {
          router.push(redirectTo);
        } else {
          router.push("/select-workspace");
        }
      } else {
        // Multiple workspaces — let user choose
        router.push("/select-workspace");
      }
    } catch {
      router.push(redirectTo);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Invalid email or password");
      } else {
        trackEvent("login_completed");
        await handlePostLogin();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.015] dark:bg-white/[0.02] px-8 py-8">
      <div className="text-center mb-6">
        <h1 className="text-title-4">Welcome back</h1>
        <p className="text-body-sm text-muted-foreground/70 mt-1.5">
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-destructive/10 px-4 py-2.5 text-[13px] text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-label text-muted-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex h-10 w-full rounded-xl border border-foreground/8 dark:border-white/[0.06] bg-background/60 dark:bg-white/[0.04] px-4 text-[14px] text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-foreground/20 dark:focus:border-white/15 focus:ring-0"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-label text-muted-foreground"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="flex h-10 w-full rounded-xl border border-foreground/8 dark:border-white/[0.06] bg-background/60 dark:bg-white/[0.04] px-4 text-[14px] text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-foreground/20 dark:focus:border-white/15 focus:ring-0"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-foreground py-2.5 text-[13px] font-medium text-background shadow-[0_1px_4px_rgba(0,0,0,0.1),0_0px_1px_rgba(0,0,0,0.06)] transition-all hover:opacity-80 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted-foreground/60">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-foreground transition-colors hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
