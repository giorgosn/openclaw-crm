import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, success, badRequest } from "@/lib/api-utils";
import { listConversations, createConversation } from "@/services/ai-chat";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const convs = await listConversations(ctx.userId, ctx.workspaceId);
  return success(convs);
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { title, model } = body as { title?: string; model?: string };

  const conv = await createConversation(ctx.userId, ctx.workspaceId, { title, model });
  return success(conv, 201);
}
