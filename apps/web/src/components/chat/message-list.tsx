"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ConfirmationCard } from "./confirmation-card";
import { Bot, User, Wrench } from "lucide-react";

interface ToolCallPending {
  id: string;
  name: string;
  arguments: string;
  status: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  toolCalls?: unknown;
  toolCallId?: string;
  toolName?: string;
  metadata?: {
    pendingToolCalls?: ToolCallPending[];
  } | null;
  createdAt: string;
}

interface PendingToolCall {
  messageId: string;
  toolCallId: string;
  name: string;
  arguments: Record<string, unknown>;
}

interface MessageListProps {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  pendingToolCall: PendingToolCall | null;
  confirmLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
}

const TOOL_LABELS: Record<string, string> = {
  search_records: "Searched records",
  list_objects: "Listed objects",
  list_records: "Listed records",
  get_record: "Fetched record",
  list_tasks: "Listed tasks",
  get_notes_for_record: "Fetched notes",
  list_lists: "Listed lists",
  list_list_entries: "Listed entries",
  create_record: "Create record",
  update_record: "Update record",
  delete_record: "Delete record",
  create_task: "Create task",
  create_note: "Create note",
};

function formatToolResult(content: string | null): { summary: string; detail: string } {
  if (!content) return { summary: "No result", detail: "No result" };
  try {
    const parsed = JSON.parse(content);
    // Handle arrays (e.g. list results)
    if (Array.isArray(parsed)) {
      const count = parsed.length;
      return {
        summary: `${count} result${count !== 1 ? "s" : ""} returned`,
        detail: JSON.stringify(parsed, null, 2),
      };
    }
    // Handle objects with data arrays
    if (parsed.data && Array.isArray(parsed.data)) {
      const count = parsed.data.length;
      return {
        summary: `${count} result${count !== 1 ? "s" : ""} returned`,
        detail: JSON.stringify(parsed, null, 2),
      };
    }
    // Handle error objects
    if (parsed.error) {
      return { summary: `Error: ${parsed.error}`, detail: JSON.stringify(parsed, null, 2) };
    }
    // Handle single record result
    if (parsed.id) {
      const name = parsed.displayName || parsed.name || parsed.content || parsed.id;
      return { summary: String(name), detail: JSON.stringify(parsed, null, 2) };
    }
    return { summary: "Result returned", detail: JSON.stringify(parsed, null, 2) };
  } catch {
    // Plain text result
    const trimmed = content.length > 80 ? content.slice(0, 80) + "..." : content;
    return { summary: trimmed, detail: content };
  }
}

export function MessageList({
  messages,
  streamingContent,
  isStreaming,
  pendingToolCall,
  confirmLoading,
  onApprove,
  onReject,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, isStreaming, pendingToolCall]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.length === 0 && !streamingContent && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">How can I help you?</p>
            <p className="text-sm mt-1">Ask me anything about your CRM data</p>
          </div>
        )}

        {messages.map((msg) => {
          // Skip system messages
          if (msg.role === "system") return null;

          // Tool results - render as collapsible result
          if (msg.role === "tool") {
            const label = TOOL_LABELS[msg.toolName || ""] || msg.toolName || "Tool";
            const resultContent = formatToolResult(msg.content);
            return (
              <div key={msg.id} className="pl-10 space-y-1">
                <details className="group">
                  <summary className="inline-flex items-center gap-1.5 cursor-pointer list-none">
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Wrench className="h-3 w-3" />
                      {label}
                    </Badge>
                    <span className="text-xs text-muted-foreground group-open:hidden">
                      {resultContent.summary}
                    </span>
                  </summary>
                  <div className="mt-1 rounded-md bg-muted/50 border border-border p-2 text-xs text-muted-foreground max-h-48 overflow-y-auto">
                    <pre className="whitespace-pre-wrap break-words">{resultContent.detail}</pre>
                  </div>
                </details>
              </div>
            );
          }

          // Check if this assistant message has pending/resolved tool calls
          const pending = msg.metadata?.pendingToolCalls;

          // Skip rendering empty assistant messages that only triggered tool calls (no visible content)
          const hasToolCalls = msg.toolCalls && Array.isArray(msg.toolCalls) && (msg.toolCalls as unknown[]).length > 0;
          if (msg.role === "assistant" && !msg.content && hasToolCalls && !pending?.length) {
            return null;
          }

          return (
            <div key={msg.id}>
              {/* Only render the message bubble if there's content */}
              {(msg.content || !hasToolCalls) && (
              <div
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {msg.content && (
                    <div className="whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none">
                      <SimpleMarkdown content={msg.content} />
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
              )}

              {/* Render confirmation cards for resolved tool calls only (pending ones are shown via pendingToolCall prop) */}
              {pending?.map((tc) => {
                if (tc.status === "approved" || tc.status === "rejected") {
                  let parsedArgs: Record<string, unknown> = {};
                  try { parsedArgs = JSON.parse(tc.arguments); } catch {}
                  return (
                    <div key={tc.id} className="pl-10 mt-2">
                      <ConfirmationCard
                        toolName={tc.name}
                        toolArgs={parsedArgs}
                        onApprove={onApprove}
                        onReject={onReject}
                        resolved={tc.status as "approved" | "rejected"}
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          );
        })}

        {/* Streaming content or typing indicator */}
        {isStreaming && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-lg px-3 py-2 text-sm bg-muted max-w-[80%]">
              {streamingContent ? (
                <div className="whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none">
                  <SimpleMarkdown content={streamingContent} />
                </div>
              ) : (
                <div className="flex items-center gap-1 py-1 px-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending tool call confirmation (from current stream) */}
        {pendingToolCall && (
          <div className="pl-10">
            <ConfirmationCard
              toolName={pendingToolCall.name}
              toolArgs={pendingToolCall.arguments}
              onApprove={onApprove}
              onReject={onReject}
              loading={confirmLoading}
            />
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}

function SimpleMarkdown({ content }: { content: string }) {
  // Simple markdown rendering: bold, italic, code blocks, inline code, links
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const code = part.slice(3, -3).replace(/^\w+\n/, "");
          return (
            <pre key={i} className="bg-background rounded-md p-2 my-2 overflow-x-auto text-xs">
              <code>{code}</code>
            </pre>
          );
        }

        // Process inline formatting
        return (
          <span key={i}>
            {part.split("\n").map((line, j, arr) => (
              <span key={j}>
                <InlineMarkdown line={line} />
                {j < arr.length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
}

function InlineMarkdown({ line }: { line: string }) {
  // Handle headers
  const headerMatch = line.match(/^(#{1,3})\s(.+)/);
  if (headerMatch) {
    const level = headerMatch[1].length;
    const text = headerMatch[2];
    if (level === 1) return <strong className="text-base block mt-2">{text}</strong>;
    if (level === 2) return <strong className="text-sm block mt-1.5">{text}</strong>;
    return <strong className="block mt-1">{text}</strong>;
  }

  // Handle bullet points
  if (line.match(/^[-*]\s/)) {
    return <span className="block pl-2">{"• "}{line.slice(2)}</span>;
  }

  // Handle numbered lists
  const numMatch = line.match(/^(\d+)\.\s(.+)/);
  if (numMatch) {
    return <span className="block pl-2">{numMatch[1]}. {numMatch[2]}</span>;
  }

  // Bold + inline code
  const formatted = line
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="bg-background rounded px-1 py-0.5 text-xs">$1</code>');

  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}
