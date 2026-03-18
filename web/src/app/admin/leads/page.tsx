"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  direction: "inbound" | "outbound";
  channel: string;
  message_body: string;
  created_at: string;
}

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  whatsapp_number: string | null;
  email: string | null;
  status: string;
  source: string | null;
  country: string | null;
  concern: string | null;
  created_at: string;
  voice_call_summary: string | null;
  therapists: { id: string; full_name: string } | null;
  conversations: Conversation[];
}

interface TherapistOption {
  id: string;
  full_name: string;
}

// ─────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  new:             "bg-gray-700 text-gray-200",
  voice_called:    "bg-blue-900 text-blue-200",
  qualified:       "bg-purple-900 text-purple-200",
  matched:         "bg-orange-900 text-orange-200",
  payment_pending: "bg-yellow-900 text-yellow-200",
  converted:       "bg-green-900 text-green-200",
  lost:            "bg-red-900 text-red-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_COLORS[status] ?? "bg-gray-700 text-gray-200"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-800 animate-pulse rounded-lg ${className ?? ""}`} />;
}

// ─────────────────────────────────────────────────────────────
// Lead detail drawer
// ─────────────────────────────────────────────────────────────

const ALL_STATUSES = ["new", "voice_called", "qualified", "matched", "payment_pending", "converted", "lost"];

function LeadDrawer({
  lead,
  therapists,
  onClose,
  onUpdated,
}: {
  lead: Lead;
  therapists: TherapistOption[];
  onClose: () => void;
  onUpdated: (updated: Lead) => void;
}) {
  const [waBody, setWaBody] = useState("");
  const [sending, setSending] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState(lead.therapists?.id ?? "");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
  const headers = { "Content-Type": "application/json", "x-admin-secret": adminSecret };

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  const patchLead = async (updates: Record<string, unknown>) => {
    const res = await fetch(`${apiUrl}/api/admin/leads/${lead.id}`, {
      method: "PATCH", headers, body: JSON.stringify(updates),
    });
    if (res.ok) onUpdated({ ...lead, ...updates });
  };

  const sendWA = async () => {
    if (!waBody.trim()) return;
    setSending(true);
    await fetch(`${apiUrl}/api/admin/leads/${lead.id}/message`, {
      method: "POST", headers, body: JSON.stringify({ body: waBody }),
    });
    setSending(false);
    setWaBody("");
  };

  const reassign = async () => {
    if (!selectedTherapist) return;
    setReassigning(true);
    await patchLead({ matched_therapist_id: selectedTherapist });
    setReassigning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-2xl bg-gray-900 border-l border-gray-800 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-lg font-bold text-white">{lead.full_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={lead.status} />
              <span className="text-xs text-gray-500">{lead.source ?? "—"}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Phone", value: lead.whatsapp_number ?? lead.phone },
              { label: "Email", value: lead.email ?? "—" },
              { label: "Country", value: lead.country ?? "—" },
              { label: "Created", value: fmtDate(lead.created_at) },
            ].map((r) => (
              <div key={r.label} className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">{r.label}</p>
                <p className="text-gray-200 font-medium">{r.value}</p>
              </div>
            ))}
          </div>

          {/* Concern */}
          {lead.concern && (
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Concern</p>
              <p className="text-sm text-gray-200">{lead.concern}</p>
            </div>
          )}

          {/* Voice call summary */}
          {lead.voice_call_summary && (
            <div className="bg-blue-950/50 border border-blue-800/40 rounded-xl p-4">
              <p className="text-xs text-blue-400 mb-1 uppercase tracking-wide">📞 Voice Call Summary</p>
              <p className="text-sm text-gray-300">{lead.voice_call_summary}</p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 gap-3">
            {/* Status */}
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Change Status</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => patchLead({ status: s })}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all border ${
                      lead.status === s
                        ? "border-teal-500 bg-teal-900/40 text-teal-300"
                        : "border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Reassign */}
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Assign Therapist</p>
              <div className="flex gap-2">
                <select
                  value={selectedTherapist}
                  onChange={(e) => setSelectedTherapist(e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                >
                  <option value="">— Select therapist —</option>
                  {therapists.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
                <button
                  onClick={reassign}
                  disabled={reassigning || !selectedTherapist}
                  className="rounded-lg bg-teal-700 hover:bg-teal-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-40 transition-colors"
                >
                  {reassigning ? "…" : "Assign"}
                </button>
              </div>
            </div>

            {/* Send WA */}
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Send WhatsApp Message</p>
              <textarea
                rows={3}
                value={waBody}
                onChange={(e) => setWaBody(e.target.value)}
                placeholder="Type a message…"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/40 mb-2"
              />
              <button
                onClick={sendWA}
                disabled={sending || !waBody.trim()}
                className="rounded-lg bg-green-700 hover:bg-green-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-40 transition-colors"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>

          {/* Conversation history */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Conversation History</p>
            {lead.conversations.length === 0 ? (
              <p className="text-sm text-gray-600">No messages yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[...lead.conversations]
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-xl p-3 text-sm ${
                        c.direction === "inbound"
                          ? "bg-gray-800 text-gray-200"
                          : "bg-teal-900/40 text-teal-100 ml-6"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-400 capitalize">{c.direction}</span>
                        <span className="text-xs text-gray-600">{c.channel}</span>
                        <span className="text-xs text-gray-600 ml-auto">{fmtDate(c.created_at)}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{c.message_body}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page content
// ─────────────────────────────────────────────────────────────

const STATUS_FILTERS = ["all", "new", "voice_called", "qualified", "matched", "payment_pending", "converted", "lost"];

function LeadsContent() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [therapists, setTherapists] = useState<TherapistOption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [page, setPage] = useState(1);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`${apiUrl}/api/admin/leads?${params}`, {
        headers: { "x-admin-secret": adminSecret },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, adminSecret, statusFilter, page]);

  const fetchTherapists = useCallback(async () => {
    const res = await fetch(`${apiUrl}/api/admin/therapists`, {
      headers: { "x-admin-secret": adminSecret },
    });
    if (res.ok) {
      const data = await res.json();
      setTherapists((data.therapists ?? []).map((t: { id: string; full_name: string }) => ({ id: t.id, full_name: t.full_name })));
    }
  }, [apiUrl, adminSecret]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchTherapists(); }, [fetchTherapists]);

  // Open lead from URL param
  useEffect(() => {
    if (focusId && leads.length) {
      const lead = leads.find((l) => l.id === focusId);
      if (lead) setSelectedLead(lead);
    }
  }, [focusId, leads]);

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(new Date(iso));

  const handleUpdated = (updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setSelectedLead(updated);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total} total</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
              statusFilter === s
                ? "bg-teal-700 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["Name", "Phone", "Status", "Source", "Therapist", "Created", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">No leads found</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-200 whitespace-nowrap">{lead.full_name}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{lead.whatsapp_number ?? lead.phone}</td>
                    <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{lead.source ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{lead.therapists?.full_name ?? <span className="text-gray-600">—</span>}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-teal-400">Open →</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <span className="text-xs text-gray-500">
              Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs text-gray-300 disabled:opacity-40 transition-colors"
              >
                ← Prev
              </button>
              <button
                disabled={page * 50 >= total}
                onClick={() => setPage(page + 1)}
                className="rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-xs text-gray-300 disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          therapists={therapists}
          onClose={() => setSelectedLead(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}

export default function AdminLeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading…</div>}>
      <LeadsContent />
    </Suspense>
  );
}
