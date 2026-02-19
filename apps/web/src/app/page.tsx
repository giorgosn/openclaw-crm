import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
import { ScrollReveal } from "@/components/scroll-reveal";
import { ThemeToggle } from "@/components/theme-toggle";
import { RotatingChat } from "@/components/landing/rotating-chat";
import { TerminalDemo } from "@/components/landing/terminal-demo";
import { LandingNav } from "@/components/landing/landing-nav";
import { JsonLd } from "@/components/json-ld";
import { TrackedLink, TrackedAnchor } from "@/components/analytics/tracked-link";
import type { Metadata } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://openclaw-crm.402box.io";

export const metadata: Metadata = {
  alternates: {
    canonical: baseUrl,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OpenClaw CRM",
  url: "https://openclaw-crm.402box.io",
  logo: "https://openclaw-crm.402box.io/favicon.ico",
  sameAs: ["https://github.com/giorgosn/openclaw-crm", "https://x.com/402BoxIO"],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "OpenClaw CRM",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Linux, macOS, Windows",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "The CRM your AI agent already knows how to use. Open-source, self-hosted, with native OpenClaw Bot integration.",
};

export default function LandingPage() {
  return (
    <div className="relative bg-background text-foreground">
      <JsonLd data={organizationSchema} />
      <JsonLd data={softwareSchema} />
      {/* Subtle top gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
        style={{
          background:
            "linear-gradient(180deg, var(--landing-tint) 0%, transparent 100%)",
        }}
      />

      {/* Scroll-aware nav */}
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
            {/* Utility group */}
            <div className="flex items-center gap-1.5 sm:gap-3 mr-3 sm:mr-6">
              <TrackedAnchor
                href="https://github.com/giorgosn/openclaw-crm"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-2 text-muted-foreground/50 transition-all hover:text-foreground hover:bg-foreground/[0.05]"
                eventProps={{ url: "https://github.com/giorgosn/openclaw-crm", link_text: "GitHub nav icon" }}
              >
                <GitHubLogoIcon className="h-[18px] w-[18px]" />
              </TrackedAnchor>
              <TrackedAnchor
                href="https://x.com/402BoxIO"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-2 text-muted-foreground/50 transition-all hover:text-foreground hover:bg-foreground/[0.05]"
                eventProps={{ url: "https://x.com/402BoxIO", link_text: "X nav icon" }}
              >
                <XIcon className="h-[16px] w-[16px]" />
              </TrackedAnchor>
              <ThemeToggle className="rounded-full p-2 !text-muted-foreground/50 transition-all hover:!text-foreground hover:bg-foreground/[0.05]" />
            </div>
            {/* Action group */}
            <div className="flex items-center gap-1">
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-full px-4 py-1.5 text-[13px] text-muted-foreground transition-all hover:text-foreground hover:bg-foreground/[0.04]"
              >
                Log in
              </Link>
              <TrackedLink
                href="/register"
                className="rounded-full border border-foreground/12 px-3.5 sm:px-4 py-1.5 text-[13px] font-medium text-foreground transition-all hover:border-foreground/25 hover:bg-foreground/[0.03]"
                eventProps={{ button_text: "Get started", location: "nav", destination: "register" }}
              >
                Get started
              </TrackedLink>
            </div>
          </div>
        </div>
      </LandingNav>

      {/* Hero */}
      <section className="relative mx-auto max-w-5xl px-6 pt-36 pb-12 sm:pt-48 sm:pb-20">
        <div className="text-center">
          <h1 className="brand-reveal text-5xl font-medium tracking-[-0.04em] leading-[0.92] sm:text-7xl lg:text-[6rem]">
            OpenClaw{" "}
            <span className="text-muted-foreground/50">CRM</span>
          </h1>

          <p className="landing-fade-up mt-6 text-2xl font-normal tracking-[-0.02em] leading-snug text-muted-foreground sm:text-3xl lg:text-[2.25rem]">
            The CRM your AI agent
            <br className="hidden sm:block" /> already knows how to use.
          </p>

          <p className="landing-fade-up-1 mt-6 text-[15px] leading-relaxed text-muted-foreground/70">
            Open-source. Self-hosted. Connect your OpenClaw Bot in 2 minutes.
          </p>

          <div className="landing-fade-up-2 mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <TrackedLink
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-[13px] font-medium text-background shadow-[0_1px_4px_rgba(0,0,0,0.1),0_0px_1px_rgba(0,0,0,0.06)] transition-all hover:opacity-80 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
              eventProps={{ button_text: "Get started", location: "hero", destination: "register" }}
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </TrackedLink>
            <TrackedAnchor
              href="https://github.com/giorgosn/openclaw-crm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 dark:border-white/15 px-5 py-2.5 text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-foreground/30 dark:hover:border-white/25 hover:bg-accent hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              eventProps={{ url: "https://github.com/giorgosn/openclaw-crm", link_text: "View on GitHub" }}
            >
              <GitHubLogoIcon className="h-3.5 w-3.5" />
              View on GitHub
            </TrackedAnchor>
          </div>
        </div>
      </section>

      {/* Terminal demo: agent interacting with CRM */}
      <section className="relative mx-auto max-w-5xl px-6 pb-28 sm:pb-40">
        <ScrollReveal>
          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-2xl border-2 border-white/[0.08] shadow-[0_12px_60px_-10px_rgba(0,0,0,0.5),0_4px_20px_-4px_rgba(0,0,0,0.3)] ring-1 ring-white/[0.06]">
              {/* Terminal title bar */}
              <div className="flex items-center border-b border-white/[0.05] bg-[#111113] px-6 py-3">
                <span className="text-[12px] font-medium text-white/40">
                  OpenClaw Bot
                </span>
              </div>
              {/* Terminal body */}
              <div className="bg-[#0c0c0e] px-5 py-8 sm:px-14 sm:py-14 min-h-[240px] sm:min-h-[320px] flex flex-col justify-center">
                <TerminalDemo />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Three differentiators */}
      <section className="relative mx-auto max-w-5xl px-6 pb-28 sm:pb-40">
        <ScrollReveal>
          <p className="mb-10 text-center text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground/50">
            Why OpenClaw
          </p>
        </ScrollReveal>
        <div className="grid gap-5 sm:grid-cols-3 sm:gap-5">
          <ScrollReveal delay={0} className="h-full">
            <div className="h-full rounded-2xl border border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.015] dark:bg-white/[0.02] px-7 py-7 transition-[border-color,background-color,box-shadow,transform] duration-150 hover:border-foreground/20 dark:hover:border-white/15 hover:bg-foreground/[0.025] dark:hover:bg-white/[0.035] hover:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4)] hover:-translate-y-0.5">
              <h3 className="text-[15px] font-medium tracking-[-0.01em]">
                Your agent runs your CRM
              </h3>
              <p className="mt-2 text-[14px] leading-[1.65] text-muted-foreground">
                Connect your OpenClaw Bot in 2 minutes. Manage contacts, deals,
                tasks from wherever you already talk to your agent.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1} className="h-full">
            <div className="h-full rounded-2xl border border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.015] dark:bg-white/[0.02] px-7 py-7 transition-[border-color,background-color,box-shadow,transform] duration-150 hover:border-foreground/20 dark:hover:border-white/15 hover:bg-foreground/[0.025] dark:hover:bg-white/[0.035] hover:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4)] hover:-translate-y-0.5">
              <h3 className="text-[15px] font-medium tracking-[-0.01em]">
                Built-in AI assistant
              </h3>
              <p className="mt-2 text-[14px] leading-[1.65] text-muted-foreground">
                When you're inside the CRM, an AI chat agent analyzes your data,
                looks things up, and takes actions.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} className="h-full">
            <div className="h-full rounded-2xl border border-foreground/[0.06] dark:border-white/[0.06] bg-foreground/[0.015] dark:bg-white/[0.02] px-7 py-7 transition-[border-color,background-color,box-shadow,transform] duration-150 hover:border-foreground/20 dark:hover:border-white/15 hover:bg-foreground/[0.025] dark:hover:bg-white/[0.035] hover:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4)] hover:-translate-y-0.5">
              <h3 className="text-[15px] font-medium tracking-[-0.01em]">
                Open-source, self-hosted
              </h3>
              <p className="mt-2 text-[14px] leading-[1.65] text-muted-foreground">
                MIT licensed. Your data stays on your server. Deploy with Docker
                Compose.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Secondary demo: AI inside the CRM */}
      <section className="relative mx-auto max-w-5xl px-6 pb-28 sm:pb-40">
        <ScrollReveal>
          <p className="mb-10 text-center text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground/50">
            AI inside the CRM
          </p>
        </ScrollReveal>
        <ScrollReveal>
          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-2xl border-2 border-foreground/12 dark:border-white/[0.1] shadow-[0_12px_50px_-10px_rgba(0,0,0,0.18),0_4px_16px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_60px_-10px_rgba(0,0,0,0.5),0_4px_20px_-4px_rgba(0,0,0,0.3)] dark:ring-1 dark:ring-white/[0.06]">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-foreground/8 dark:border-white/[0.06] bg-card/80 dark:bg-white/[0.03] px-6 py-3.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-foreground/10 dark:bg-white/[0.08]" />
                  <div className="h-3 w-3 rounded-full bg-foreground/10 dark:bg-white/[0.08]" />
                  <div className="h-3 w-3 rounded-full bg-foreground/10 dark:bg-white/[0.08]" />
                </div>
                <span className="ml-3 text-[12px] font-medium text-muted-foreground/50">
                  AI Chat
                </span>
              </div>
              {/* Chat area */}
              <div className="bg-background dark:bg-[#0c0c0e] px-5 py-8 sm:px-14 sm:py-14 min-h-[200px] sm:min-h-[280px] flex flex-col justify-center">
                <RotatingChat />
              </div>
              {/* Input bar */}
              <div className="border-t border-foreground/8 dark:border-white/[0.06] bg-card/50 dark:bg-white/[0.02] px-6 py-4">
                <div className="flex items-center gap-3 rounded-xl bg-background/60 dark:bg-white/[0.04] border border-foreground/8 dark:border-white/[0.06] px-5 py-3">
                  <span className="text-[13px] text-muted-foreground/40">
                    Ask your CRM anything...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Final CTA */}
      <section className="relative mx-auto max-w-5xl px-6 pb-28 sm:pb-40">
        <ScrollReveal>
          <div className="text-center">
            <p className="text-[15px] text-muted-foreground">
              Connect your agent. Get started.
            </p>
            <div className="mt-5">
              <TrackedLink
                href="/register"
                className="group inline-flex items-center gap-2 rounded-full border border-foreground/15 dark:border-white/12 px-6 py-2.5 text-[14px] font-medium text-foreground transition-[border-color,background-color] duration-150 hover:border-foreground/30 dark:hover:border-white/20 hover:bg-foreground/[0.03] dark:hover:bg-white/[0.04]"
                eventProps={{ button_text: "Get started", location: "footer_cta", destination: "register" }}
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </TrackedLink>
            </div>
          </div>
        </ScrollReveal>
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
            <TrackedAnchor
              href="https://github.com/giorgosn/openclaw-crm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              eventProps={{ url: "https://github.com/giorgosn/openclaw-crm", link_text: "GitHub footer" }}
            >
              GitHub
            </TrackedAnchor>
            <TrackedAnchor
              href="https://x.com/402BoxIO"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              eventProps={{ url: "https://x.com/402BoxIO", link_text: "X footer" }}
            >
              X
            </TrackedAnchor>
            <span className="text-[12px] text-muted-foreground/60">
              MIT License
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
