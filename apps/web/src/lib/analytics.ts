// Analytics utility: fires events to Plausible, GA4, and Amplitude

import * as amplitude from "@amplitude/analytics-browser";

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number> }
    ) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  name: string,
  props?: Record<string, string | number>
) {
  if (typeof window === "undefined") return;

  // Plausible (always available, no consent needed)
  if (window.plausible) {
    window.plausible(name, props ? { props } : undefined);
  }

  // GA4 (only if consent was given and gtag loaded)
  if (window.gtag) {
    window.gtag("event", name, props);
  }

  // Amplitude (always available, no consent needed)
  amplitude.track(name, props);
}
