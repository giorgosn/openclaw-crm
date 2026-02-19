"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

type TrackedLinkProps = React.ComponentProps<typeof Link> & {
  eventName?: string;
  eventProps?: Record<string, string>;
};

export function TrackedLink({
  eventName = "cta_clicked",
  eventProps,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        if (eventProps) trackEvent(eventName, eventProps);
        onClick?.(e);
      }}
    />
  );
}

type TrackedAnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventName?: string;
  eventProps?: Record<string, string>;
};

export function TrackedAnchor({
  eventName = "outbound_link_clicked",
  eventProps,
  onClick,
  ...props
}: TrackedAnchorProps) {
  return (
    <a
      {...props}
      onClick={(e) => {
        if (eventProps) trackEvent(eventName, eventProps);
        onClick?.(e);
      }}
    />
  );
}
