"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { trackEvent } from "@/lib/analytics";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const result = await signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Registration failed");
        return;
      }

      // Create workspace for the new user
      const wsName = workspaceName.trim() || `${name}'s Workspace`;
      const wsRes = await fetch("/api/v1/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: wsName }),
      });

      if (!wsRes.ok) {
        // User was created but workspace creation failed — send to workspace selection
        router.push("/select-workspace");
        return;
      }

      // Cookie is set by the POST /api/v1/workspaces response, redirect to home
      trackEvent("signup_completed");
      router.push("/home");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "flex h-10 w-full rounded-xl border border-foreground/8 dark:border-white/[0.06] bg-background/60 dark:bg-white/[0.04] px-4 text-[14px] text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-foreground/20 dark:focus:border-white/15 focus:ring-0";

  return (
    <div className="rounded-2xl border border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.015] dark:bg-white/[0.02] px-8 py-8">
      <div className="text-center mb-6">
        <h1 className="text-title-4">Create an account</h1>
        <p className="text-body-sm text-muted-foreground/70 mt-1.5">
          Get started with your CRM
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-destructive/10 px-4 py-2.5 text-[13px] text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-label text-muted-foreground">
            Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
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
            className={inputClass}
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
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="workspace-name"
            className="text-label text-muted-foreground"
          >
            Workspace name
          </label>
          <input
            id="workspace-name"
            type="text"
            placeholder={name ? `${name}'s Workspace` : "My Workspace"}
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className={inputClass}
          />
          <p className="text-caption">Leave blank to use your name</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-foreground py-2.5 text-[13px] font-medium text-background shadow-[0_1px_4px_rgba(0,0,0,0.1),0_0px_1px_rgba(0,0,0,0.06)] transition-all hover:opacity-80 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted-foreground/60">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-foreground transition-colors hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
