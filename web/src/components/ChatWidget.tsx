"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// ─── LocalStorage helpers ─────────────────────────────────────
const CHATS_KEY = "it_chats_v1";
const ACTIVE_KEY = "it_active_v1";

function readChats(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CHATS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeChats(chats: ChatSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Markdown renderer ────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function renderMarkdown(text: string, isUser: boolean): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (!listBuffer.length) return;
    if (listType === "ul") {
      nodes.push(
        <ul key={nodes.length} className="mt-1 mb-1 space-y-1 pl-1">
          {listBuffer.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{ background: isUser ? "rgba(255,255,255,0.7)" : "#7B5FB8" }}
              />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      nodes.push(
        <ol key={nodes.length} className="mt-1 mb-1 space-y-1 pl-1 list-none">
          {listBuffer.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className="mt-0.5 flex-shrink-0 text-xs font-bold"
                style={{ color: isUser ? "rgba(255,255,255,0.7)" : "#7B5FB8" }}
              >
                {i + 1}.
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    listBuffer = [];
    listType = null;
  };

  lines.forEach((line, idx) => {
    const ulMatch = line.match(/^[-•*]\s+(.*)/);
    const olMatch = line.match(/^\d+\.\s+(.*)/);

    if (ulMatch) {
      if (listType === "ol") flushList();
      listType = "ul";
      listBuffer.push(ulMatch[1]);
    } else if (olMatch) {
      if (listType === "ul") flushList();
      listType = "ol";
      listBuffer.push(olMatch[1]);
    } else {
      flushList();
      if (line.trim() === "") {
        if (idx > 0 && idx < lines.length - 1) {
          nodes.push(<div key={nodes.length} className="h-2" />);
        }
      } else {
        nodes.push(
          <p key={nodes.length} className="leading-relaxed">
            {renderInline(line)}
          </p>
        );
      }
    }
  });
  flushList();

  return <div className="space-y-0.5 text-sm">{nodes}</div>;
}

// ─── Welcome message ──────────────────────────────────────────
const WELCOME: Message = {
  role: "assistant",
  content:
    "Namaste! 🙏 I'm the India Therapist AI assistant.\n\nI'm here to help you find the right therapist, answer questions about our platform, and support you on your journey.\n\nHow can I help you today?",
  ts: 0,
};

// ─── Main Component ───────────────────────────────────────────
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chats, setChatsLocal] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = readChats();
    setChatsLocal(saved);
    const savedId = localStorage.getItem(ACTIVE_KEY);
    if (savedId && saved.find((c) => c.id === savedId)) {
      setActiveId(savedId);
    }
  }, []);

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, streaming, isOpen]);

  useEffect(() => {
    if (isOpen && !loading) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, loading]);

  const mutateChats = useCallback(
    (fn: (prev: ChatSession[]) => ChatSession[]) => {
      setChatsLocal((prev) => {
        const next = fn(prev);
        writeChats(next);
        return next;
      });
    },
    []
  );

  const activeChat = chats.find((c) => c.id === activeId);
  const displayMessages: Message[] = activeChat
    ? [WELCOME, ...activeChat.messages]
    : [WELCOME];

  const newChat = useCallback(() => {
    const chat: ChatSession = {
      id: genId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    mutateChats((prev) => [chat, ...prev]);
    setActiveId(chat.id);
    setShowHistory(false);
  }, [mutateChats]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text, ts: Date.now() };

    let chatId = activeId;
    let prevMessages: Message[] = [];

    if (!chatId || !chats.find((c) => c.id === chatId)) {
      const chat: ChatSession = {
        id: genId(),
        title: text.length > 45 ? text.slice(0, 45) + "…" : text,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      chatId = chat.id;
      mutateChats((prev) => [chat, ...prev]);
      setActiveId(chatId);
    } else {
      const current = chats.find((c) => c.id === chatId)!;
      prevMessages = current.messages;
      if (prevMessages.length === 0) {
        mutateChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? { ...c, title: text.length > 45 ? text.slice(0, 45) + "…" : text }
              : c
          )
        );
      }
    }

    const updated = [...prevMessages, userMsg];

    mutateChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, messages: updated, updatedAt: Date.now() }
          : c
      )
    );

    setLoading(true);
    setStreaming("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") break;
            try {
              const { text: t } = JSON.parse(payload);
              if (t) { full += t; setStreaming(full); }
            } catch { /* ignore */ }
          }
        }
      }

      const aiMsg: Message = {
        role: "assistant",
        content: full || "I'm sorry, I couldn't generate a response. Please try again.",
        ts: Date.now(),
      };

      mutateChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? { ...c, messages: [...updated, aiMsg], updatedAt: Date.now() }
            : c
        )
      );
    } catch {
      mutateChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [
                  ...updated,
                  {
                    role: "assistant" as const,
                    content:
                      "I'm having trouble connecting. Please try again or reach us on WhatsApp at +1 (856) 878-2862.",
                    ts: Date.now(),
                  },
                ],
                updatedAt: Date.now(),
              }
            : c
        )
      );
    } finally {
      setLoading(false);
      setStreaming("");
    }
  }, [input, loading, activeId, chats, mutateChats]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "How does India Therapist work?",
    "What languages do you support?",
    "How much does a session cost?",
    "I'm feeling anxious and overwhelmed",
  ];

  return (
    <>
      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          className="fixed right-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
          style={{
            bottom: "calc(6rem + 4.5rem)",
            width: "min(390px, calc(100vw - 24px))",
            height: "min(620px, calc(100vh - 180px))",
          }}
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between bg-gradient-to-r from-[#7B5FB8] to-[#553888] px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
              >
                AI
              </div>
              <div>
                <p className="text-sm font-semibold leading-none" style={{ color: "white" }}>
                  India Therapist AI
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>
                  Ask me anything
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={newChat}
                title="New Chat"
                className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => setShowHistory((h) => !h)}
                title="Chat History"
                className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                style={{ color: showHistory ? "white" : "rgba(255,255,255,0.85)", background: showHistory ? "rgba(255,255,255,0.2)" : undefined }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={() => { setIsOpen(false); setShowHistory(false); }}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* History Panel */}
          {showHistory && (
            <div className="absolute inset-x-0 bottom-0 top-[57px] z-10 flex flex-col overflow-hidden bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-800">Chat History</p>
                <button
                  onClick={newChat}
                  className="flex items-center gap-1.5 rounded-lg bg-[#7B5FB8] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#6B4AA0] transition-colors"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Chat
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 py-10">
                    <svg className="h-10 w-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm">No previous chats</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => { setActiveId(chat.id); setShowHistory(false); }}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-purple-50 border-b border-gray-50 ${activeId === chat.id ? "bg-purple-50" : ""}`}
                    >
                      <p className={`truncate text-sm font-medium ${activeId === chat.id ? "text-[#7B5FB8]" : "text-gray-800"}`}>
                        {chat.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {fmtDate(chat.updatedAt)} · {chat.messages.length} message{chat.messages.length !== 1 ? "s" : ""}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
            <div className="space-y-4">
              {displayMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="mb-5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: "#7B5FB8" }}
                    >
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                      msg.role === "user"
                        ? "rounded-br-sm text-white"
                        : "rounded-bl-sm border border-gray-100 bg-white text-gray-800 shadow-sm"
                    }`}
                    style={msg.role === "user" ? { background: "#7B5FB8" } : undefined}
                  >
                    {renderMarkdown(msg.content, msg.role === "user")}
                    {msg.ts > 0 && (
                      <p
                        className="mt-1.5 text-[10px]"
                        style={{ color: msg.role === "user" ? "rgba(255,255,255,0.6)" : "#9ca3af" }}
                      >
                        {fmtTime(msg.ts)}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming / loading */}
              {loading && (
                <div className="flex items-end gap-2 justify-start">
                  <div
                    className="mb-5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: "#7B5FB8" }}
                  >
                    AI
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm">
                    {streaming ? (
                      <div className="text-sm leading-relaxed text-gray-800">
                        {renderMarkdown(streaming, false)}
                        <span
                          className="ml-0.5 inline-block h-3.5 w-1 animate-pulse rounded-sm"
                          style={{ background: "#7B5FB8" }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 py-0.5">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            className="h-2 w-2 rounded-full animate-bounce"
                            style={{ background: "rgba(123,95,184,0.5)", animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick prompts */}
              {displayMessages.length === 1 && !loading && (
                <div className="pt-2">
                  <p className="mb-2 text-center text-xs text-gray-400">Quick questions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickPrompts.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInput(q);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="rounded-xl border px-3 py-2 text-left text-xs transition-colors hover:bg-purple-50"
                        style={{ borderColor: "rgba(123,95,184,0.2)", color: "#553888" }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-gray-100 bg-white px-3 py-3">
            <div
              className="flex items-end gap-2 rounded-xl border bg-gray-50 px-3 py-2 transition-colors focus-within:border-[#7B5FB8]"
              style={{ borderColor: "#e5e7eb" }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
                }}
                onKeyDown={handleKey}
                placeholder="Ask me anything…"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none disabled:opacity-50"
                style={{ lineHeight: "1.5", maxHeight: "80px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-[#6B4AA0] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "#7B5FB8" }}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-gray-400">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* ── Floating Button ── */}
      <button
        onClick={() => { setIsOpen((o) => !o); setShowHistory(false); }}
        aria-label="Chat with India Therapist AI"
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{ background: "#7B5FB8", boxShadow: "0 4px 20px rgba(123,95,184,0.4)" }}
      >
        {isOpen ? (
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        )}
      </button>
    </>
  );
}
