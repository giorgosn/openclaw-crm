"use client";

import type { AttributeType } from "@openclaw-crm/shared";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, ExternalLink } from "lucide-react";
import { extractPersonalName } from "@/lib/display-name";

interface AttributeCellProps {
  type: AttributeType;
  value: unknown;
  options?: { id: string; title: string; color: string }[];
  statuses?: { id: string; title: string; color: string; isActive: boolean }[];
}

export function AttributeCell({ type, value, options, statuses }: AttributeCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground/50">—</span>;
  }

  switch (type) {
    case "text":
    case "email_address":
    case "phone_number":
    case "domain":
      if (Array.isArray(value)) {
        return <span>{value.filter(Boolean).join(", ")}</span>;
      }
      if (type === "email_address") {
        return <span className="text-primary">{String(value)}</span>;
      }
      if (type === "domain") {
        return (
          <span className="flex items-center gap-1 text-primary">
            {String(value)}
            <ExternalLink className="h-3 w-3" />
          </span>
        );
      }
      return <span>{String(value)}</span>;

    case "number":
    case "rating": {
      const num = Number(value);
      if (type === "rating") {
        return (
          <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < num ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"}`}
              />
            ))}
          </span>
        );
      }
      return <span>{num.toLocaleString()}</span>;
    }

    case "currency": {
      const cv = value as { amount?: number; currencyCode?: string };
      if (!cv?.amount && cv?.amount !== 0) return <span className="text-muted-foreground/50">—</span>;
      return (
        <span>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: cv.currencyCode || "USD",
          }).format(cv.amount)}
        </span>
      );
    }

    case "date":
      return <span>{new Date(value as string).toLocaleDateString()}</span>;

    case "timestamp":
      return <span>{new Date(value as string).toLocaleString()}</span>;

    case "checkbox":
      return value ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground/40" />
      );

    case "select": {
      if (Array.isArray(value)) {
        return (
          <span className="flex flex-wrap gap-1">
            {value.map((v, i) => {
              const opt = options?.find((o) => o.id === v);
              return (
                <Badge key={i} variant="secondary" style={opt ? { backgroundColor: opt.color + "20", color: opt.color } : undefined}>
                  {opt?.title || String(v)}
                </Badge>
              );
            })}
          </span>
        );
      }
      const opt = options?.find((o) => o.id === value);
      return (
        <Badge variant="secondary" style={opt ? { backgroundColor: opt.color + "20", color: opt.color } : undefined}>
          {opt?.title || String(value)}
        </Badge>
      );
    }

    case "status": {
      const status = statuses?.find((s) => s.id === value);
      return (
        <Badge style={status ? { backgroundColor: status.color + "20", color: status.color, borderColor: status.color + "40" } : undefined} className="border">
          {status?.title || String(value)}
        </Badge>
      );
    }

    case "personal_name": {
      const name = extractPersonalName(value);
      return <span className="font-medium">{name || "—"}</span>;
    }

    case "location": {
      const loc = value as { city?: string; state?: string; countryCode?: string };
      const parts = [loc?.city, loc?.state, loc?.countryCode].filter(Boolean);
      return <span>{parts.join(", ") || "—"}</span>;
    }

    case "record_reference": {
      if (Array.isArray(value)) {
        const refs = value as { id: string; displayName: string }[];
        if (refs.length === 0) return <span className="text-muted-foreground/50">—</span>;
        return (
          <span className="flex flex-wrap gap-1">
            {refs.map((ref, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">
                {ref.displayName || "Unnamed"}
              </Badge>
            ))}
          </span>
        );
      }
      const ref = value as { id?: string; displayName?: string } | string;
      if (typeof ref === "object" && ref?.displayName) {
        return <Badge variant="secondary" className="text-xs font-normal">{ref.displayName}</Badge>;
      }
      // Fallback for raw UUID
      return <span className="text-muted-foreground/50">—</span>;
    }

    case "actor_reference":
      return <span>{String(value)}</span>;

    case "interaction":
      return <span className="text-muted-foreground">Interaction</span>;

    default:
      return <span>{String(value)}</span>;
  }
}
