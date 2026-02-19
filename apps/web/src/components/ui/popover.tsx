"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  align = "start",
  className,
}: PopoverProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => onOpenChange(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute top-full z-50 mt-1 rounded-lg border border-border bg-popover p-3 shadow-lg",
            align === "end" ? "right-0" : "left-0",
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
