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

// ─── Welcome message (display-only, not sent to API) ──────────
const WELCOME: Message = {
  role: "assistant",
  content:
    "Namaste! 🙏 I'm the India Therapist AI assistant.\n\nI'm here to help you find the right therapist, answer questions about our platform, and support you on your journey. How can I help you today?",
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
  const [hasUnread, setHasUnread] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Load from localStorage on mount
  useEffect(() => {
    const saved = readChats();
    setChatsLocal(saved);
    const savedId = localStorage.getItem(ACTIVE_KEY);
    if (savedId && saved.find((c) => c.id === savedId)) {
      setActiveId(savedId);
    }
    // Show unread indicator if there are existing chats
    if (saved.length > 0 && !isOpen) setHasUnread(false);
  }, []);

  // ── Persist active id
  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  // ── Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, streaming, isOpen]);

  // ── Focus input when chat opens
  useEffect(() => {
    if (isOpen && !loading) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, loading]);

  // ── Clear unread on open
  useEffect(() => {
    if (isOpen) setHasUnread(false);
  }, [isOpen]);

  // ── Mutate chats state + persist
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

  // ── Create new chat
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

  // ── Send message
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text, ts: Date.now() };

    // Ensure there's an active chat
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
      // Set title from first user message
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

    const updatedMessages = [...prevMessages, userMsg];

    mutateChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, messages: updatedMessages, updatedAt: Date.now() }
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
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
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
              const { text } = JSON.parse(payload);
              if (text) {
                full += text;
                setStreaming(full);
              }
            } catch {
              // ignore parse errors
            }
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
            ? {
                ...c,
                messages: [...updatedMessages, aiMsg],
                updatedAt: Date.now(),
              }
            : c
        )
      );
    } catch {
      const errMsg: Message = {
        role: "assistant",
        content:
          "I'm having trouble connecting right now. Please try again in a moment, or reach us on WhatsApp for immediate help.",
        ts: Date.now(),
      };
      mutateChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [...updatedMessages, errMsg],
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

  // ── Quick-start prompts
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
          className="fixed bottom-44 right-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
          style={{ width: "min(380px, calc(100vw - 32px))", height: "540px" }}
        >
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between bg-gradient-to-r from-[#7B5FB8] to-[#553888] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                AI
              </div>
              <div>
                <p className="text-sm font-semibold leading-none text-white">
                  India Therapist AI
                </p>
                <p className="mt-0.5 text-xs text-white/70">
                  Ask me anything
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* New Chat */}
              <button
                onClick={newChat}
                title="New Chat"
                className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {/* History */}
              <button
                onClick={() => setShowHistory((h) => !h)}
                title="Chat History"
                className={`rounded-lg p-1.5 transition-colors hover:bg-white/10 ${showHistory ? "bg-white/20 text-white" : "text-white/70 hover:text-white"}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {/* Close */}
              <button
                onClick={() => { setIsOpen(false); setShowHistory(false); }}
                className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* History Panel (slide in over messages) */}
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
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
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
                    <div className="mb-4 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#7B5FB8] text-[10px] font-bold text-white">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
                      msg.role === "user"
                        ? "rounded-br-sm bg-[#7B5FB8] text-white"
                        : "rounded-bl-sm border border-gray-100 bg-white text-gray-800 shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                    {msg.ts > 0 && (
                      <p className={`mt-1 text-[10px] ${msg.role === "user" ? "text-white/60" : "text-gray-400"}`}>
                        {fmtTime(msg.ts)}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming / loading bubble */}
              {loading && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="mb-4 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#7B5FB8] text-[10px] font-bold text-white">
                    AI
                  </div>
                  <div className="max-w-[78%] rounded-2xl rounded-bl-sm border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm">
                    {streaming ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                        {streaming}
                        <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse rounded-sm bg-[#7B5FB8]" />
                      </p>
                    ) : (
                      <div className="flex items-center gap-1 py-0.5">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            className="h-2 w-2 rounded-full bg-[#7B5FB8]/50 animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick prompts — shown only on empty chat */}
              {displayMessages.length === 1 && !loading && (
                <div className="pt-2">
                  <p className="mb-2 text-center text-xs text-gray-400">
                    Quick questions
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickPrompts.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInput(q);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="rounded-xl border border-[#7B5FB8]/20 bg-white px-3 py-2 text-left text-xs text-[#553888] hover:border-[#7B5FB8]/50 hover:bg-purple-50 transition-colors"
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
            <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-[#7B5FB8] transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize
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
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#7B5FB8] text-white transition-colors hover:bg-[#6B4AA0] disabled:cursor-not-allowed disabled:opacity-40"
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
        onClick={() => {
          setIsOpen((o) => !o);
          setShowHistory(false);
        }}
        aria-label="Chat with India Therapist AI"
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#7B5FB8] shadow-lg shadow-[#7B5FB8]/30 transition-all hover:bg-[#6B4AA0] hover:scale-105 active:scale-95"
      >
        {/* Unread dot */}
        {hasUnread && !isOpen && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />
        )}
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
