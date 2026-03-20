"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

const headers: Record<string, string> = { "x-admin-secret": adminSecret };
const jsonHeaders: Record<string, string> = {
  ...headers,
  "Content-Type": "application/json",
};

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  full_name: string | null;
  whatsapp_number: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  status: string;
  session_state: string;
  session_id: string | null;
  escalated_to_human: boolean;
  last_message: string | null;
  last_message_direction: string | null;
  last_message_time: string;
  last_message_ai: boolean;
  unread_count: number;
}

interface Message {
  id: string;
  direction: string;
  channel: string;
  message_body: string | null;
  media_url: string | null;
  ai_generated: boolean;
  ai_intent: string | null;
  created_at: string;
  from_number: string | null;
  to_number: string | null;
}

interface LeadDetail {
  id: string;
  full_name: string | null;
  whatsapp_number: string | null;
  email: string | null;
  country: string | null;
  status: string;
  therapy_type: string | null;
  presenting_issues: string[];
  pain_summary: string | null;
  therapists?: { full_name: string; specialties: string[]; session_rate_cents: number } | null;
}

interface SessionDetail {
  id: string;
  session_state: string;
  escalated_to_human: boolean;
  current_therapist_id: string | null;
  payment_link: string | null;
}

interface ContextSummary {
  summary: string | null;
  key_concerns: string[];
  session_count: number;
  last_therapist: string | null;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const oneDay = 86400000;

  if (diff < oneDay && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  if (diff < oneDay * 2 && d.getDate() === now.getDate() - 1) {
    return "Yesterday";
  }
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 86400000 && d.getDate() === now.getDate()) return "Today";
  if (diff < 172800000 && d.getDate() === now.getDate() - 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getAvatarColor(name: string): string {
  const colors = ["#7B5FB8", "#4A9B60", "#D97706", "#2563EB", "#DC2626", "#0891B2", "#7C3AED", "#DB2777"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getStatusBadge(state: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    greeting: { label: "New", color: "bg-gray-600" },
    intake: { label: "Intake", color: "bg-blue-800" },
    matching: { label: "Matching", color: "bg-blue-700" },
    slot_request: { label: "Matched", color: "bg-blue-600" },
    slot_relay: { label: "Scheduling", color: "bg-indigo-700" },
    payment_sent: { label: "Payment", color: "bg-yellow-700" },
    confirmed: { label: "Confirmed", color: "bg-green-700" },
    escalated: { label: "Escalated", color: "bg-red-700" },
    none: { label: "New", color: "bg-gray-600" },
  };
  return map[state] ?? { label: state, color: "bg-gray-600" };
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function WhatsAppAdminPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [contextSummary, setContextSummary] = useState<ContextSummary | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [inputMsg, setInputMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch conversations ──────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(
        `${apiUrl}/api/admin/whatsapp/conversations?filter=${filter}&search=${encodeURIComponent(search)}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  // ── Fetch messages for selected lead ─────────────────────
  const fetchMessages = useCallback(async (leadId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/whatsapp/conversations/${leadId}/messages`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
        setLead(data.lead ?? null);
        setSession(data.session ?? null);
        setContextSummary(data.context_summary ?? null);
      }
    } catch {
      // ignore
    }
  }, []);

  // ── Initial load + polling ───────────────────────────────
  useEffect(() => {
    fetchConversations();
    const poll = setInterval(() => {
      fetchConversations();
    }, 8000);
    return () => clearInterval(poll);
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
      const poll = setInterval(() => fetchMessages(selectedId), 8000);
      return () => clearInterval(poll);
    }
  }, [selectedId, fetchMessages]);

  // ── Auto-scroll chat ─────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send manual message ──────────────────────────────────
  async function handleSend() {
    if (!inputMsg.trim() || !selectedId || sending) return;
    setSending(true);

    try {
      const res = await fetch(`${apiUrl}/api/admin/whatsapp/send`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ leadId: selectedId, message: inputMsg.trim() }),
      });

      if (res.ok) {
        setInputMsg("");
        await fetchMessages(selectedId);
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  // ── Toggle AI ────────────────────────────────────────────
  async function toggleAI() {
    if (!session?.id) return;
    const aiEnabled = session.escalated_to_human; // currently off → turning on

    try {
      const res = await fetch(`${apiUrl}/api/admin/whatsapp/sessions/${session.id}/ai-toggle`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ aiEnabled }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session ?? null);
      }
    } catch {
      // ignore
    }
  }

  // ── Select conversation ──────────────────────────────────
  function selectConversation(id: string) {
    setSelectedId(id);
    setShowInfo(false);
  }

  // ── Group messages by date ───────────────────────────────
  function getDateKey(dateStr: string): string {
    return new Date(dateStr).toDateString();
  }

  const selectedConvo = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── LEFT PANEL: Conversation List ──────────────────── */}
      <div className="w-80 shrink-0 border-r border-[#3E2868] flex flex-col bg-[#1A1030]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#3E2868]">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-white">WhatsApp Chats</h2>
          </div>
          <input
            type="text"
            placeholder="Search by name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[#2A1A4A] border border-[#3E2868] rounded-lg text-white placeholder-[#8B7AA0] focus:outline-none focus:border-[#7B5FB8]"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex px-2 py-2 gap-1 border-b border-[#3E2868]">
          {["all", "active", "pending", "escalated"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 text-[10px] rounded-md font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-[#7B5FB8] text-white"
                  : "text-[#8B7AA0] hover:bg-[#2A1A4A]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-[#2A1A4A] animate-pulse rounded-lg" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-[#8B7AA0] text-xs">No conversations found</div>
          ) : (
            conversations.map((c) => {
              const name = c.full_name ?? c.whatsapp_number ?? "Unknown";
              const badge = getStatusBadge(c.session_state);
              const isSelected = c.id === selectedId;

              return (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full flex items-start gap-3 px-3 py-3 text-left transition-colors border-b border-[#2A1A4A] ${
                    isSelected ? "bg-[#3E2868]" : "hover:bg-[#2A1A4A]"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                    style={{ backgroundColor: getAvatarColor(name) }}
                  >
                    {name[0]?.toUpperCase() ?? "?"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white truncate">
                        {name}
                      </span>
                      <span className="text-[10px] text-[#8B7AA0] shrink-0 ml-2">
                        {formatTime(c.last_message_time)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-[#8B7AA0] truncate">
                        {c.last_message_direction === "outbound" && "✓ "}
                        {c.last_message?.slice(0, 40) ?? "No messages"}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {c.unread_count > 0 && (
                          <span className="flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-green-500 rounded-full">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] rounded text-white ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Chat Window ──────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#1A1030]">
        {!selectedId ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-[#8B7AA0]">
            <span className="text-6xl mb-4">💬</span>
            <p className="text-sm">Select a conversation to start</p>
          </div>
        ) : (
          <>
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#3E2868] bg-[#2A1A4A]">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{
                    backgroundColor: getAvatarColor(
                      selectedConvo?.full_name ?? selectedConvo?.whatsapp_number ?? "?"
                    ),
                  }}
                >
                  {(selectedConvo?.full_name ?? selectedConvo?.whatsapp_number ?? "?")[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {lead?.full_name ?? selectedConvo?.whatsapp_number ?? "Unknown"}
                    </span>
                    {session && (
                      <span
                        className={`px-1.5 py-0.5 text-[9px] rounded text-white ${
                          getStatusBadge(session.session_state).color
                        }`}
                      >
                        {getStatusBadge(session.session_state).label}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#8B7AA0]">
                    {lead?.whatsapp_number ?? selectedConvo?.whatsapp_number}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowInfo(!showInfo)}
                className="px-2 py-1 text-xs text-[#B0A8C0] hover:text-white hover:bg-[#3E2868] rounded transition-colors"
              >
                ℹ️ Lead Info
              </button>
            </div>

            {/* Chat + Info panel */}
            <div className="flex flex-1 overflow-hidden">
              {/* Chat area */}
              <div className="flex-1 flex flex-col">
                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
                  style={{ backgroundColor: "#1E1338" }}
                >
                  {(() => {
                    let lastDate = "";
                    return messages.map((msg) => {
                      const dateKey = getDateKey(msg.created_at);
                      const showDate = dateKey !== lastDate;
                      lastDate = dateKey;
                      const isOutbound = msg.direction === "outbound";

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-3">
                              <span className="px-3 py-1 text-[10px] text-[#B0A8C0] bg-[#2A1A4A] rounded-full">
                                {formatDateSeparator(msg.created_at)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isOutbound ? "justify-end" : "justify-start"} mb-1`}>
                            <div
                              className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                                isOutbound
                                  ? msg.ai_generated
                                    ? "bg-[#2D4A3E] text-[#E0FFE0]" // AI: teal/green
                                    : "bg-[#2A3A6A] text-[#E0E8FF]" // Admin: blue
                                  : "bg-[#2A1A4A] text-white" // Client: dark purple
                              }`}
                            >
                              {/* Label */}
                              <div className="text-[9px] font-medium mb-0.5 opacity-70">
                                {isOutbound
                                  ? msg.ai_generated
                                    ? "🤖 AI Agent"
                                    : "👤 Admin"
                                  : "Client"}
                              </div>

                              {/* Message body */}
                              {msg.media_url && msg.message_body?.includes("Voice") ? (
                                <div className="flex items-center gap-2">
                                  <span>🎵</span>
                                  <a
                                    href={msg.media_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline text-xs"
                                  >
                                    Voice message
                                  </a>
                                </div>
                              ) : msg.media_url && msg.message_body?.includes("Image") ? (
                                <div className="flex items-center gap-2">
                                  <span>🖼️</span>
                                  <span className="text-xs">Image</span>
                                </div>
                              ) : (
                                <div className="whitespace-pre-wrap break-words text-[13px]">
                                  {msg.message_body ?? "[No content]"}
                                </div>
                              )}

                              {/* Time + status */}
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[9px] opacity-50">
                                  {formatMessageTime(msg.created_at)}
                                </span>
                                {isOutbound && (
                                  <span className="text-[9px] opacity-50">✓✓</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                  <div ref={chatEndRef} />
                </div>

                {/* AI Toggle */}
                {session && (
                  <div className="flex items-center justify-between px-4 py-2 bg-[#2A1A4A] border-t border-[#3E2868]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">🤖 AI Agent:</span>
                      <button
                        onClick={toggleAI}
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
                          !session.escalated_to_human
                            ? "bg-green-700 text-green-200"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {session.escalated_to_human ? "OFF" : "ON"}
                      </button>
                    </div>
                    <span className="text-[10px] text-[#8B7AA0]">
                      {session.escalated_to_human
                        ? "Admin is handling this conversation"
                        : "AI is handling this conversation"}
                    </span>
                  </div>
                )}

                {/* Input bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#2A1A4A] border-t border-[#3E2868]">
                  <input
                    type="text"
                    placeholder="Type a message as Admin..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-[#1A1030] border border-[#3E2868] rounded-lg text-white placeholder-[#8B7AA0] focus:outline-none focus:border-[#7B5FB8]"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !inputMsg.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#7B5FB8] rounded-lg hover:bg-[#6B4FA8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? "..." : "Send →"}
                  </button>
                </div>
              </div>

              {/* ── Info Sidebar ──────────────────────────── */}
              {showInfo && lead && (
                <div className="w-72 shrink-0 border-l border-[#3E2868] bg-[#2A1A4A] overflow-y-auto">
                  <div className="p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-white">Lead Info</h3>

                    <div className="space-y-2 text-xs">
                      <InfoRow label="Name" value={lead.full_name} />
                      <InfoRow label="Phone" value={lead.whatsapp_number} />
                      <InfoRow label="Email" value={lead.email} />
                      <InfoRow label="Country" value={lead.country} />
                      <InfoRow label="Status" value={lead.status} />
                      <InfoRow label="Therapy" value={lead.therapy_type} />
                      {lead.therapists && (
                        <InfoRow
                          label="Matched Therapist"
                          value={lead.therapists.full_name}
                        />
                      )}
                    </div>

                    {lead.presenting_issues?.length > 0 && (
                      <div>
                        <span className="text-[10px] text-[#8B7AA0] uppercase tracking-wider">Concerns</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lead.presenting_issues.map((c, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-[10px] bg-[#3E2868] text-[#E0D5FF] rounded">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {session && (
                      <div>
                        <span className="text-[10px] text-[#8B7AA0] uppercase tracking-wider">Session</span>
                        <div className="mt-1 space-y-1 text-xs">
                          <InfoRow label="State" value={session.session_state} />
                          <InfoRow label="AI" value={session.escalated_to_human ? "OFF" : "ON"} />
                          {session.payment_link && (
                            <div>
                              <span className="text-[#8B7AA0]">Payment: </span>
                              <a
                                href={session.payment_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#7B5FB8] underline"
                              >
                                Link
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {contextSummary?.summary && (
                      <div>
                        <span className="text-[10px] text-[#8B7AA0] uppercase tracking-wider">AI Summary</span>
                        <p className="mt-1 text-xs text-[#E0D5FF]">{contextSummary.summary}</p>
                      </div>
                    )}

                    {contextSummary?.key_concerns && contextSummary.key_concerns.length > 0 && (
                      <div>
                        <span className="text-[10px] text-[#8B7AA0] uppercase tracking-wider">Key Concerns</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contextSummary.key_concerns.map((c, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-[10px] bg-[#3E2868] text-[#E0D5FF] rounded">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-[#8B7AA0]">{label}: </span>
      <span className="text-[#E0D5FF]">{value ?? "—"}</span>
    </div>
  );
}
