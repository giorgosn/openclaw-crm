import { NextRequest } from "next/server";
import { getAuthContext, unauthorized, badRequest } from "@/lib/api-utils";
import {
  getAIConfig,
  buildSystemPrompt,
  buildConversationMessages,
  saveMessage,
  getConversation,
  generateTitle,
  toolHandlers,
  toolDefinitions,
  callOpenRouter,
} from "@/services/ai-chat";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const body = await req.json();
  const { conversationId, message } = body as {
    conversationId: string;
    message: string;
  };

  if (!conversationId || !message?.trim()) {
    return badRequest("conversationId and message are required");
  }

  const conv = await getConversation(conversationId, ctx.userId);
  if (!conv) return badRequest("Conversation not found");

  const config = await getAIConfig(ctx.workspaceId);
  if (!config) {
    return badRequest("AI not configured. Set your OpenRouter API key in Settings > AI Agent.");
  }

  // Save user message
  await saveMessage(conversationId, "user", { content: message });

  // Update conversation timestamp
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  // Build messages for OpenRouter
  const systemPrompt = await buildSystemPrompt(ctx.workspaceId);
  const historyMessages = await buildConversationMessages(conversationId);
  const openRouterMessages = [
    { role: "system" as const, content: systemPrompt },
    ...historyMessages,
  ];

  // Fire-and-forget title generation on first user message
  const messageCount = historyMessages.filter((m) => m.role === "user").length;
  if (messageCount === 1) {
    generateTitle(config.apiKey, config.model, message).then((title) => {
      db.update(conversations)
        .set({ title })
        .where(eq(conversations.id, conversationId))
        .execute()
        .catch(() => {});
    });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const toolCtx = { workspaceId: ctx.workspaceId, userId: ctx.userId };

      try {
        await streamCompletion(config, openRouterMessages, conversationId, toolCtx, controller, encoder);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Stream error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`));
      } finally {
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function streamCompletion(
  config: { apiKey: string; model: string },
  openRouterMessages: Array<{ role: string; content?: string | null; tool_calls?: unknown[]; tool_call_id?: string; name?: string }>,
  conversationId: string,
  toolCtx: { workspaceId: string; userId: string },
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  depth = 0
) {
  if (depth > 10) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: "Too many tool call rounds" })}\n\n`));
    return;
  }

  const res = await callOpenRouter(config, openRouterMessages as Parameters<typeof callOpenRouter>[1], true);
  if (!res.ok) {
    const errBody = await res.text();
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: `OpenRouter error: ${res.status}` })}\n\n`));
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";
  let toolCalls: Array<{ id: string; type: string; function: { name: string; arguments: string } }> = [];
  let currentToolCallIndex = -1;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;

        // Content token
        if (delta.content) {
          fullContent += delta.content;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "token", content: delta.content })}\n\n`)
          );
        }

        // Tool calls
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (idx > currentToolCallIndex) {
              currentToolCallIndex = idx;
              toolCalls.push({
                id: tc.id || "",
                type: "function",
                function: { name: tc.function?.name || "", arguments: "" },
              });
            }
            const current = toolCalls[toolCalls.length - 1];
            if (tc.id) current.id = tc.id;
            if (tc.function?.name) current.function.name = tc.function.name;
            if (tc.function?.arguments) current.function.arguments += tc.function.arguments;
          }
        }
      } catch {
        // Skip malformed lines
      }
    }
  }

  // If we got tool calls, process them
  if (toolCalls.length > 0) {
    // Save assistant message with tool calls
    const assistantMsg = await saveMessage(conversationId, "assistant", {
      content: fullContent || null,
      toolCalls: toolCalls,
    });

    // Check if any require confirmation
    for (const tc of toolCalls) {
      const handler = toolHandlers[tc.function.name];
      if (!handler) {
        // Unknown tool - save error result
        await saveMessage(conversationId, "tool", {
          content: JSON.stringify({ error: `Unknown tool: ${tc.function.name}` }),
          toolCallId: tc.id,
          toolName: tc.function.name,
        });
        openRouterMessages.push({
          role: "assistant",
          content: fullContent || null,
          tool_calls: toolCalls as unknown[],
        });
        openRouterMessages.push({
          role: "tool",
          content: JSON.stringify({ error: `Unknown tool: ${tc.function.name}` }),
          tool_call_id: tc.id,
          name: tc.function.name,
        });
        continue;
      }

      if (handler.requiresConfirmation) {
        // Emit pending event and stop
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(tc.function.arguments);
        } catch {}

        // Save metadata marking it as pending
        await db
          .update(messages)
          .set({
            metadata: {
              pendingToolCalls: toolCalls.map((t) => ({
                id: t.id,
                name: t.function.name,
                arguments: t.function.arguments,
                status: "pending",
              })),
            },
          })
          .where(eq(messages.id, assistantMsg.id));

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "tool_call_pending",
              messageId: assistantMsg.id,
              toolCallId: tc.id,
              name: tc.function.name,
              arguments: parsedArgs,
            })}\n\n`
          )
        );
        return; // Stop streaming - wait for confirmation
      }

      // Auto-execute read tools
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(tc.function.arguments);
      } catch {}

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "tool_executing", name: tc.function.name, arguments: parsedArgs })}\n\n`
        )
      );

      try {
        const result = await handler.execute(parsedArgs, toolCtx);
        const resultStr = JSON.stringify(result);

        await saveMessage(conversationId, "tool", {
          content: resultStr,
          toolCallId: tc.id,
          toolName: tc.function.name,
        });

        openRouterMessages.push({
          role: "assistant",
          content: fullContent || null,
          tool_calls: toolCalls as unknown[],
        });
        openRouterMessages.push({
          role: "tool",
          content: resultStr,
          tool_call_id: tc.id,
          name: tc.function.name,
        });
      } catch (e) {
        const errStr = JSON.stringify({ error: e instanceof Error ? e.message : "Tool execution failed" });
        await saveMessage(conversationId, "tool", {
          content: errStr,
          toolCallId: tc.id,
          toolName: tc.function.name,
        });

        openRouterMessages.push({
          role: "assistant",
          content: fullContent || null,
          tool_calls: toolCalls as unknown[],
        });
        openRouterMessages.push({
          role: "tool",
          content: errStr,
          tool_call_id: tc.id,
          name: tc.function.name,
        });
      }
    }

    // If no pending tool calls, continue the conversation
    const hasPending = toolCalls.some((tc) => toolHandlers[tc.function.name]?.requiresConfirmation);
    if (!hasPending) {
      await streamCompletion(config, openRouterMessages, conversationId, toolCtx, controller, encoder, depth + 1);
    }
  } else {
    // No tool calls - save the final assistant message
    if (fullContent) {
      const msg = await saveMessage(conversationId, "assistant", { content: fullContent });
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done", messageId: msg.id })}\n\n`)
      );
    } else {
      // Empty response - still emit done so frontend doesn't hang
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done", messageId: null })}\n\n`)
      );
    }
  }
}
