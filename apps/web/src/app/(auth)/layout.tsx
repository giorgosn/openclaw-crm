import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      {/* Landing-tint gradient for visual continuity */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
        style={{
          background:
            "linear-gradient(180deg, var(--landing-tint) 0%, transparent 100%)",
        }}
      />

      <div className="relative w-full max-w-sm px-4">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="text-[15px] font-semibold tracking-[-0.015em] text-foreground transition-opacity hover:opacity-70"
          >
            OpenClaw{" "}
            <span className="font-normal text-muted-foreground/60">CRM</span>
          </Link>
        </div>
        {children}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
