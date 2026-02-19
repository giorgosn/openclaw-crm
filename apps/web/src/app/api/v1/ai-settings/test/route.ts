import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, success, badRequest } from "@/lib/api-utils";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";

interface WorkspaceSettings {
  openrouterApiKey?: string;
  openrouterModel?: string;
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const body = await req.json();
  let { apiKey, model } = body as { apiKey?: string; model?: string };

  // If no key provided in request, use the stored one
  if (!apiKey) {
    const [workspace] = await db
      .select({ settings: workspaces.settings })
      .from(workspaces)
      .where(eq(workspaces.id, ctx.workspaceId))
      .limit(1);

    const settings = (workspace?.settings ?? {}) as WorkspaceSettings;
    apiKey = settings.openrouterApiKey;
    if (!model) model = settings.openrouterModel;
  }

  if (!apiKey) {
    return badRequest("No API key configured");
  }

  if (!model) model = "anthropic/claude-sonnet-4";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.BETTER_AUTH_URL || "http://localhost:3001",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Say hello in one word." }],
        max_tokens: 10,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return success({
        success: false,
        error: (err as { error?: { message?: string } }).error?.message || `HTTP ${res.status}`,
      });
    }

    return success({ success: true });
  } catch (e) {
    return success({
      success: false,
      error: e instanceof Error ? e.message : "Connection failed",
    });
  }
}
