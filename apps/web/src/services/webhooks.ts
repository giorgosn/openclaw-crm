import { createHmac, randomBytes } from "crypto";
import { db } from "@/db";
import { webhooks, webhookDeliveries } from "@/db/schema";
import type { WebhookEvent } from "@/db/schema/webhooks";
import { eq, and, desc } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────

export interface WebhookRow {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDeliveryRow {
  id: string;
  webhookId: string;
  event: string;
  payload: string;
  status: string;
  responseStatus: number | null;
  responseBody: string | null;
  attempts: number;
  deliveredAt: Date | null;
  createdAt: Date;
}

function parseEvents(raw: string): string[] {
  try {
    return JSON.parse(raw);
  } catch {
    return ["*"];
  }
}

function toWebhookRow(row: typeof webhooks.$inferSelect): WebhookRow {
  return {
    ...row,
    events: parseEvents(row.events),
  };
}

// ─── CRUD ────────────────────────────────────────────────────────────

export async function listWebhooks(workspaceId: string): Promise<WebhookRow[]> {
  const rows = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.workspaceId, workspaceId))
    .orderBy(desc(webhooks.createdAt));
  return rows.map(toWebhookRow);
}

export async function getWebhook(
  webhookId: string,
  workspaceId: string
): Promise<WebhookRow | null> {
  const [row] = await db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.id, webhookId), eq(webhooks.workspaceId, workspaceId)))
    .limit(1);
  return row ? toWebhookRow(row) : null;
}

export async function createWebhook(
  workspaceId: string,
  input: { name: string; url: string; events: string[] }
): Promise<WebhookRow & { secretPlaintext: string }> {
  const secret = randomBytes(32).toString("hex");

  const [row] = await db
    .insert(webhooks)
    .values({
      workspaceId,
      name: input.name,
      url: input.url,
      events: JSON.stringify(input.events),
      secret,
    })
    .returning();

  return { ...toWebhookRow(row), secretPlaintext: secret };
}

export async function updateWebhook(
  webhookId: string,
  workspaceId: string,
  updates: { name?: string; url?: string; events?: string[]; isActive?: boolean }
): Promise<WebhookRow | null> {
  const existing = await getWebhook(webhookId, workspaceId);
  if (!existing) return null;

  const setValues: Partial<typeof webhooks.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (updates.name !== undefined) setValues.name = updates.name;
  if (updates.url !== undefined) setValues.url = updates.url;
  if (updates.events !== undefined) setValues.events = JSON.stringify(updates.events);
  if (updates.isActive !== undefined) setValues.isActive = updates.isActive;

  const [row] = await db
    .update(webhooks)
    .set(setValues)
    .where(eq(webhooks.id, webhookId))
    .returning();

  return row ? toWebhookRow(row) : null;
}

export async function deleteWebhook(
  webhookId: string,
  workspaceId: string
): Promise<boolean> {
  const existing = await getWebhook(webhookId, workspaceId);
  if (!existing) return false;

  await db.delete(webhooks).where(eq(webhooks.id, webhookId));
  return true;
}

// ─── Deliveries ──────────────────────────────────────────────────────

export async function listDeliveries(
  webhookId: string,
  workspaceId: string,
  limit = 50
): Promise<WebhookDeliveryRow[]> {
  // Verify ownership
  const hook = await getWebhook(webhookId, workspaceId);
  if (!hook) return [];

  return db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.webhookId, webhookId))
    .orderBy(desc(webhookDeliveries.createdAt))
    .limit(limit) as Promise<WebhookDeliveryRow[]>;
}

// ─── Delivery ────────────────────────────────────────────────────────

function buildSignature(secret: string, body: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

async function deliverOne(
  hook: WebhookRow,
  deliveryId: string,
  event: string,
  bodyStr: string
): Promise<void> {
  const signature = buildSignature(hook.secret, bodyStr);
  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  let status = "failed";
  let deliveredAt: Date | null = null;

  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-OpenClaw-Event": event,
        "X-OpenClaw-Signature": signature,
        "X-OpenClaw-Delivery": deliveryId,
        "User-Agent": "OpenClaw-Webhook/1.0",
      },
      body: bodyStr,
      signal: AbortSignal.timeout(10_000),
    });

    responseStatus = res.status;
    responseBody = (await res.text()).slice(0, 1000);
    status = res.ok ? "success" : "failed";
    if (res.ok) deliveredAt = new Date();
  } catch {
    responseBody = "Request failed (network error or timeout)";
  }

  await db
    .update(webhookDeliveries)
    .set({ status, responseStatus, responseBody, deliveredAt })
    .where(eq(webhookDeliveries.id, deliveryId));
}

// ─── Trigger ─────────────────────────────────────────────────────────

/**
 * Fire-and-forget: find all active workspace webhooks that subscribe to
 * this event, create a delivery record, and dispatch the HTTP call.
 */
export function triggerWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): void {
  // Fire-and-forget — do not await so mutations don't block on delivery
  void (async () => {
    try {
      const hooks = await db
        .select()
        .from(webhooks)
        .where(and(eq(webhooks.workspaceId, workspaceId), eq(webhooks.isActive, true)));

      const eligible = hooks
        .map(toWebhookRow)
        .filter((h) => h.events.includes("*") || h.events.includes(event));

      if (eligible.length === 0) return;

      const payload = {
        id: `evt_${crypto.randomUUID().replace(/-/g, "")}`,
        event,
        timestamp: new Date().toISOString(),
        workspace_id: workspaceId,
        data,
      };
      const bodyStr = JSON.stringify(payload);

      await Promise.all(
        eligible.map(async (hook) => {
          const [delivery] = await db
            .insert(webhookDeliveries)
            .values({
              webhookId: hook.id,
              event,
              payload: bodyStr,
              status: "pending",
            })
            .returning();

          await deliverOne(hook, delivery.id, event, bodyStr);
        })
      );
    } catch (err) {
      console.error("[webhooks] triggerWebhooks error:", err);
    }
  })();
}

// ─── Test ping ───────────────────────────────────────────────────────

export async function sendTestPing(
  webhookId: string,
  workspaceId: string
): Promise<{ success: boolean; responseStatus: number | null; responseBody: string | null }> {
  const hook = await getWebhook(webhookId, workspaceId);
  if (!hook) return { success: false, responseStatus: null, responseBody: "Webhook not found" };

  const payload = {
    id: `evt_test_${crypto.randomUUID().replace(/-/g, "")}`,
    event: "ping",
    timestamp: new Date().toISOString(),
    workspace_id: workspaceId,
    data: { message: "This is a test delivery from OpenClaw CRM." },
  };
  const bodyStr = JSON.stringify(payload);
  const signature = buildSignature(hook.secret, bodyStr);

  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-OpenClaw-Event": "ping",
        "X-OpenClaw-Signature": signature,
        "X-OpenClaw-Delivery": `test_${Date.now()}`,
        "User-Agent": "OpenClaw-Webhook/1.0",
      },
      body: bodyStr,
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.text()).slice(0, 1000);
    return { success: res.ok, responseStatus: res.status, responseBody: body };
  } catch (err) {
    return {
      success: false,
      responseStatus: null,
      responseBody: err instanceof Error ? err.message : "Request failed",
    };
  }
}
