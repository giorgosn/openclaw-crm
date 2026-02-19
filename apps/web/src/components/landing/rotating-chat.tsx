"use client";

import { useState, useEffect } from "react";

const examples = [
  {
    query: "Show me deals closing this month",
    answer:
      "Found 3 deals closing before Feb 28. Northwind ($89k, Negotiation), Horizon Enterprise ($156k, Negotiation), and Atlas Rebrand ($67.5k, Won).",
    highlight: "3 deals",
  },
  {
    query: "Add a follow-up note to Sarah Chen",
    answer: "Done. Added note to Sarah Chen at Meridian Health Group.",
    highlight: "Sarah Chen",
  },
  {
    query: "What's my total pipeline value?",
    answer:
      "Your active pipeline is $1.38M across 10 deals. 2 won, 2 in negotiation, 2 at proposal stage.",
    highlight: "$1.38M",
  },
  {
    query: "Who are the contacts at Sterling & Co?",
    answer:
      "2 contacts. Alex Dumont (Senior Consultant) and Omar Hassan (Principal Consultant).",
    highlight: "2 contacts",
  },
];

export function RotatingChat() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"query" | "answer" | "idle">("query");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "query") {
      timeout = setTimeout(() => setPhase("answer"), 1200);
    } else if (phase === "answer") {
      timeout = setTimeout(() => {
        setVisible(false);
        timeout = setTimeout(() => {
          setIndex((i) => (i + 1) % examples.length);
          setPhase("query");
          setVisible(true);
        }, 500);
      }, 3500);
    }

    return () => clearTimeout(timeout);
  }, [phase, index]);

  const ex = examples[index];

  return (
    <div className="w-full space-y-3">
      {/* User query — right-aligned, compact bubble */}
      <div className="flex justify-end">
        <div
          className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-br-md bg-foreground/[0.07] dark:bg-white/[0.08] px-4 py-2.5 text-[13px] leading-relaxed text-foreground/80 transition-all duration-400"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(4px)",
          }}
        >
          {ex.query}
        </div>
      </div>

      {/* AI response — left-aligned, compact bubble */}
      <div className="flex justify-start">
        <div
          className="max-w-[90%] sm:max-w-[75%] rounded-2xl rounded-bl-md border border-border/40 dark:border-white/[0.08] bg-card dark:bg-white/[0.04] px-4 py-2.5 text-[13px] leading-relaxed text-foreground/70 dark:text-white/70 transition-all duration-400"
          style={{
            opacity: phase === "answer" && visible ? 1 : 0,
            transform:
              phase === "answer" && visible
                ? "translateY(0)"
                : "translateY(4px)",
          }}
        >
          {ex.answer.split(ex.highlight).map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>
                {part}
                <span className="font-medium text-foreground dark:text-white">
                  {ex.highlight}
                </span>
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
