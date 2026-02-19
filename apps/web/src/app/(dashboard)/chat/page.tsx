"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  toolCalls?: unknown;
  toolCallId?: string;
  toolName?: string;
  metadata?: {
    pendingToolCalls?: Array<{
      id: string;
      name: string;
      arguments: string;
      status: string;
    }>;
  } | null;
  createdAt: string;
}

interface PendingToolCall {
  messageId: string;
  toolCallId: string;
  name: string;
  arguments: Record<string, unknown>;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [pendingToolCall, setPendingToolCall] = useState<PendingToolCall | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  // Load conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    const res = await fetch("/api/v1/chat/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data.data || []);
    }
  }

  // Load messages when switching conversation
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    // Don't reload during streaming — the optimistic message would be wiped
    if (isStreamingRef.current) return;
    loadMessages(activeConvId);
  }, [activeConvId]);

  async function loadMessages(convId: string) {
    const res = await fetch(`/api/v1/chat/conversations/${convId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.data?.messages || []);

      // Check for any still-pending tool calls
      const msgs = data.data?.messages || [];
      for (const msg of msgs) {
        if (msg.metadata?.pendingToolCalls) {
          const pending = msg.metadata.pendingToolCalls.find(
            (tc: { status: string }) => tc.status === "pending"
          );
          if (pending) {
            let parsedArgs: Record<string, unknown> = {};
            try { parsedArgs = JSON.parse(pending.arguments); } catch {}
            setPendingToolCall({
              messageId: msg.id,
              toolCallId: pending.id,
              name: pending.name,
              arguments: parsedArgs,
            });
            return;
          }
        }
      }
      setPendingToolCall(null);
    }
  }

  async function handleNewConversation() {
    const res = await fetch("/api/v1/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const data = await res.json();
      const conv = data.data;
      setConversations((prev) => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
      setPendingToolCall(null);
    }
  }

  async function handleDeleteConversation(id: string) {
    await fetch(`/api/v1/chat/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
      setPendingToolCall(null);
    }
  }

  // Shared helper to parse SSE stream events
  function processSSELine(
    line: string,
    accumulatedRef: { current: string },
  ) {
    if (!line.startsWith("data: ")) return;
    const data = line.slice(6).trim();
    if (data === "[DONE]") return;

    try {
      const parsed = JSON.parse(data);

      switch (parsed.type) {
        case "token":
          accumulatedRef.current += parsed.content;
          setStreamingContent(accumulatedRef.current);
          break;

        case "tool_executing":
          accumulatedRef.current += `\n\u{1F527} Running **${parsed.name}**...\n`;
          setStreamingContent(accumulatedRef.current);
          break;

        case "tool_call_pending":
          setPendingToolCall({
            messageId: parsed.messageId,
            toolCallId: parsed.toolCallId,
            name: parsed.name,
            arguments: parsed.arguments,
          });
          break;

        case "done":
          break;

        case "error":
          accumulatedRef.current += `\n\nError: ${parsed.error}`;
          setStreamingContent(accumulatedRef.current);
          break;
      }
    } catch {
      // Skip malformed lines
    }
  }

  // Shared helper to consume an SSE ReadableStream
  async function consumeSSEStream(reader: ReadableStreamDefaultReader<Uint8Array>) {
    const decoder = new TextDecoder();
    let buffer = "";
    const accumulatedRef = { current: "" };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        processSSELine(line, accumulatedRef);
      }
    }
  }

  // Finish streaming: load persisted messages THEN clear streaming state (no flicker)
  async function finishStreaming(convId: string | null) {
    // First load persisted messages so they're ready before we remove the streaming bubble
    if (convId) {
      await loadMessages(convId);
    }
    // Now clear streaming state — the persisted messages are already rendered
    setStreaming(false);
    isStreamingRef.current = false;
    setStreamingContent("");
    abortRef.current = null;
    await fetchConversations();
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;

    let convId = activeConvId;

    // Auto-create conversation if none active
    if (!convId) {
      const res = await fetch("/api/v1/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      const data = await res.json();
      convId = data.data.id;
      setConversations((prev) => [data.data, ...prev]);
      setActiveConvId(convId);
    }

    const userMessage = input.trim();
    setInput("");
    setStreaming(true);
    isStreamingRef.current = true;
    setStreamingContent("");
    setPendingToolCall(null);

    // Optimistically add user message
    const tempMsg: Message = {
      id: "temp-" + Date.now(),
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch("/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, message: userMessage }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStreamingContent(
          `Error: ${(err as { error?: { message?: string } }).error?.message || "Failed to get response"}`
        );
        setStreaming(false);
        isStreamingRef.current = false;
        return;
      }

      await consumeSSEStream(res.body!.getReader());
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        // User cancelled
      } else {
        setStreamingContent("Connection error. Please try again.");
      }
    }

    // Load persisted data first, then clear streaming (prevents flicker)
    await finishStreaming(convId);
  }, [input, streaming, activeConvId]);

  async function handleApprove() {
    if (!pendingToolCall || !activeConvId) return;
    setConfirmLoading(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/v1/chat/tool-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          messageId: pendingToolCall.messageId,
          toolCallId: pendingToolCall.toolCallId,
          approved: true,
        }),
      });

      setPendingToolCall(null);

      if (!res.ok) {
        setConfirmLoading(false);
        return;
      }

      // Stream the continuation response
      setStreaming(true);
      await consumeSSEStream(res.body!.getReader());
    } catch {
      // Stream error
    }

    setConfirmLoading(false);
    await finishStreaming(activeConvId);
  }

  async function handleReject() {
    if (!pendingToolCall || !activeConvId) return;
    setConfirmLoading(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/v1/chat/tool-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          messageId: pendingToolCall.messageId,
          toolCallId: pendingToolCall.toolCallId,
          approved: false,
        }),
      });

      setPendingToolCall(null);

      if (!res.ok) {
        setConfirmLoading(false);
        return;
      }

      setStreaming(true);
      await consumeSSEStream(res.body!.getReader());
    } catch {
      // Stream error
    }

    setConfirmLoading(false);
    await finishStreaming(activeConvId);
  }

  // Filter out system messages; also deduplicate temp messages once real ones load
  const visibleMessages = messages.filter((m) => {
    if (m.role === "system") return false;
    if (m.id.startsWith("temp-") && messages.some(
      (r) => !r.id.startsWith("temp-") && r.role === "user" && r.content === m.content
    )) return false;
    return true;
  });

  return (
    <div className="flex h-full">
      {/* Conversation sidebar */}
      <div className="w-60 border-r border-border bg-muted/30 shrink-0">
        <ConversationList
          conversations={conversations}
          activeId={activeConvId}
          onSelect={setActiveConvId}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <MessageList
          messages={visibleMessages}
          streamingContent={streamingContent}
          isStreaming={streaming}
          pendingToolCall={pendingToolCall}
          confirmLoading={confirmLoading}
          onApprove={handleApprove}
          onReject={handleReject}
        />
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={streaming || !!pendingToolCall}
          streaming={streaming}
        />
      </div>
    </div>
  );
}
