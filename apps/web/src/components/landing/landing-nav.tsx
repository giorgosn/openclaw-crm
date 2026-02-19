"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function LandingNav({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
        scrolled
          ? "landing-nav-scrolled border-b border-border/10"
          : "landing-nav-top"
      )}
    >
      {children}
    </nav>
  );
}
