// Analytics utility: fires events to both Plausible and GA4

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
  // Plausible (always available, no consent needed)
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(name, props ? { props } : undefined);
  }

  // GA4 (only if consent was given and gtag loaded)
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", name, props);
  }
}
