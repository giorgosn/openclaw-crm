import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, notFound, success } from "@/lib/api-utils";
import {
  getConversation,
  updateConversation,
  deleteConversation,
  getConversationMessages,
} from "@/services/ai-chat";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { conversationId } = await params;
  const conv = await getConversation(conversationId, ctx.userId);
  if (!conv) return notFound("Conversation not found");

  const msgs = await getConversationMessages(conversationId);

  return success({ ...conv, messages: msgs });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { conversationId } = await params;
  const body = await req.json();
  const { title, model } = body as { title?: string; model?: string };

  const updated = await updateConversation(conversationId, ctx.userId, { title, model });
  if (!updated) return notFound("Conversation not found");

  return success(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { conversationId } = await params;
  const deleted = await deleteConversation(conversationId, ctx.userId);
  if (!deleted) return notFound("Conversation not found");

  return success({ deleted: true });
}
