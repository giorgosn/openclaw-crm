import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { LandingNav } from "@/components/landing/landing-nav";
import { getAllComparisons } from "@/lib/content";
import type { Metadata } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://openclaw-crm.402box.io";

export const metadata: Metadata = {
  title: "Compare",
  description:
    "See how OpenClaw CRM compares to HubSpot, Attio, Folk, and Salesforce. Honest, side-by-side breakdowns for small teams.",
  alternates: {
    canonical: `${baseUrl}/compare`,
  },
};

export default async function CompareIndexPage() {
  const pages = await getAllComparisons();

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Subtle top gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[50vh]"
        style={{
          background:
            "linear-gradient(180deg, var(--landing-tint) 0%, transparent 100%)",
        }}
      />

      {/* Nav */}
      <LandingNav>
        <div className="mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-8 max-w-6xl">
          <Link
            href="/"
            className="text-[15px] sm:text-[16px] font-semibold tracking-[-0.015em] text-foreground transition-opacity hover:opacity-70"
          >
            OpenClaw{" "}
            <span className="font-normal text-muted-foreground/60">CRM</span>
          </Link>
          <div className="flex items-center">
            <div className="flex items-center gap-1.5 sm:gap-3 mr-3 sm:mr-6">
              <a
                href="https://github.com/giorgosn/openclaw-crm"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-2 text-muted-foreground/50 transition-all hover:text-foreground hover:bg-foreground/[0.05]"
              >
                <GitHubLogoIcon className="h-[18px] w-[18px]" />
              </a>
              <ThemeToggle className="rounded-full p-2 !text-muted-foreground/50 transition-all hover:!text-foreground hover:bg-foreground/[0.05]" />
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-full px-4 py-1.5 text-[13px] text-muted-foreground transition-all hover:text-foreground hover:bg-foreground/[0.04]"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-foreground/12 px-3.5 sm:px-4 py-1.5 text-[13px] font-medium text-foreground transition-all hover:border-foreground/25 hover:bg-foreground/[0.03]"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </LandingNav>

      {/* Header */}
      <section className="relative mx-auto max-w-5xl px-6 pt-32 pb-12 sm:pt-40 sm:pb-16">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Home
        </Link>
        <h1 className="text-4xl font-medium tracking-[-0.03em] leading-tight sm:text-5xl">
          Compare
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
          See how OpenClaw compares. The only CRM with native AI agent
          integration.
        </p>
      </section>

      {/* Comparison list */}
      <section className="relative mx-auto max-w-5xl px-6 pb-28 sm:pb-40">
        <div className="grid gap-4">
          {pages.map((page) => (
            <Link key={page.meta.slug} href={`/compare/${page.meta.slug}`}>
              <article className="group rounded-2xl border border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.015] dark:bg-white/[0.02] px-7 py-6 transition-[border-color,background-color,box-shadow,transform] duration-150 hover:border-foreground/20 dark:hover:border-white/15 hover:bg-foreground/[0.025] dark:hover:bg-white/[0.035] hover:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4)] hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="rounded-full bg-foreground/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {page.meta.competitor
                          ? `vs ${page.meta.competitor.charAt(0).toUpperCase() + page.meta.competitor.slice(1)}`
                          : page.meta.category}
                      </span>
                      <span className="text-[12px] text-muted-foreground/50">
                        {new Date(page.meta.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <h2 className="text-[17px] font-medium tracking-[-0.01em] text-foreground">
                      {page.meta.title}
                    </h2>
                    <p className="mt-1.5 text-[14px] leading-[1.6] text-muted-foreground line-clamp-2">
                      {page.meta.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-5 h-4 w-4 shrink-0 text-muted-foreground/30 transition-all group-hover:text-foreground group-hover:translate-x-0.5" />
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-5xl px-6 pb-28 sm:pb-40">
        <div className="text-center">
          <p className="text-[15px] text-muted-foreground">
            Connect your agent. Get started.
          </p>
          <div className="mt-5">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full border border-foreground/15 dark:border-white/12 px-6 py-2.5 text-[14px] font-medium text-foreground transition-[border-color,background-color] duration-150 hover:border-foreground/30 dark:hover:border-white/20 hover:bg-foreground/[0.03] dark:hover:bg-white/[0.04]"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/15">
        <div className="mx-auto flex max-w-5xl flex-col sm:flex-row items-center justify-between gap-4 px-6 py-6 sm:py-8">
          <span className="text-[12px] text-muted-foreground/60">
            OpenClaw CRM
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="/docs"
              className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              Docs
            </Link>
            <Link
              href="/blog"
              className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              Blog
            </Link>
            <Link
              href="/compare"
              className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              Compare
            </Link>
            <a
              href="https://github.com/giorgosn/openclaw-crm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              GitHub
            </a>
            <span className="text-[12px] text-muted-foreground/60">
              MIT License
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
