export const WEBHOOK_EVENTS = [
  "record.created",
  "record.updated",
  "record.deleted",
  "task.created",
  "task.updated",
  "task.completed",
  "task.deleted",
  "note.created",
  "note.deleted",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/**
 * Payload shape sent to every webhook endpoint.
 *
 * Headers on each request:
 *   Content-Type:            application/json
 *   X-OpenClaw-Event:        <event>
 *   X-OpenClaw-Signature:    sha256=<hmac-sha256 of raw body using your secret>
 *   X-OpenClaw-Delivery:     <unique delivery ID>
 *
 * Signature verification (Node.js example):
 *   const sig = createHmac("sha256", secret).update(rawBody).digest("hex");
 *   const expected = "sha256=" + sig;
 *   const isValid = timingSafeEqual(Buffer.from(expected), Buffer.from(receivedHeader));
 */
export interface WebhookPayload<T = Record<string, unknown>> {
  /** Unique event ID (evt_...) */
  id: string;
  /** The event type that triggered this delivery */
  event: WebhookEvent | "ping";
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Workspace ID the event belongs to */
  workspace_id: string;
  /** Event-specific data */
  data: T;
}
