"use client";

import { useEffect, useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Therapist {
  id: string;
  full_name: string;
  slug: string;
  tier: string;
  session_rate_cents: number;
  specialties: string[];
  languages: string[];
  experience_years: number | null;
  is_active: boolean;
  whatsapp_number: string | null;
  sessions_this_month: number;
  revenue_this_month_cents: number;
}

// ─────────────────────────────────────────────────────────────
// Inline editable cell
// ─────────────────────────────────────────────────────────────

function EditableCell({
  value,
  onSave,
  type = "text",
}: {
  value: string;
  onSave: (v: string) => void;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

  const commit = () => {
    setEditing(false);
    if (local !== value) onSave(local);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-left text-[#C4B5F0] hover:text-white hover:underline decoration-dashed underline-offset-2 transition-colors"
      >
        {value || <span className="text-[#6B5A8A]">—</span>}
      </button>
    );
  }

  return (
    <input
      autoFocus
      type={type}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
      className="bg-[#553888] border border-[#7B5FB8]/50 rounded px-2 py-0.5 text-sm text-white focus:outline-none w-40"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-[#3E2868] animate-pulse rounded-lg ${className ?? ""}`} />;
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
  const headers = { "Content-Type": "application/json", "x-admin-secret": adminSecret };

  const fetchTherapists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/therapists`, { headers: { "x-admin-secret": adminSecret } });
      if (res.ok) {
        const data = await res.json();
        setTherapists(data.therapists ?? []);
      } else {
        setError("Could not load therapists — is the API running?");
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, adminSecret]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchTherapists(); }, [fetchTherapists]);

  const patchTherapist = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch(`${apiUrl}/api/admin/therapists/${id}`, {
      method: "PATCH", headers, body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setTherapists((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated, sessions_this_month: t.sessions_this_month, revenue_this_month_cents: t.revenue_this_month_cents } : t)));
    }
  };

  const toggleActive = (t: Therapist) => patchTherapist(t.id, { is_active: !t.is_active });

  const fmt$ = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Therapists</h1>
        <p className="text-[#B0A8C0] text-sm mt-0.5">
          {therapists.length} total · {therapists.filter((t) => t.is_active).length} active
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-[#3E1030] border border-[#D45050]/30 px-4 py-3 text-sm text-[#D45050]">
          {error}
        </div>
      )}

      <div className="bg-[#2A1A4A] border border-[#3E2868] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#3E2868]">
                {["Active", "Name", "Tier", "Rate", "Sessions", "Revenue", "Languages", "WA Number"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#8B7AA0] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#3E2868]/50">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : therapists.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#8B7AA0]">No therapists found</td>
                </tr>
              ) : (
                therapists.map((t) => (
                  <tr key={t.id} className="border-b border-[#3E2868]/50 hover:bg-[#3E2868]/20 transition-colors">
                    {/* Active toggle */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(t)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          t.is_active ? "bg-[#7B5FB8]" : "bg-[#553888]"
                        }`}
                        title={t.is_active ? "Active — click to deactivate" : "Inactive — click to activate"}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            t.is_active ? "translate-x-4" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Name — inline editable */}
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      <EditableCell
                        value={t.full_name}
                        onSave={(v) => patchTherapist(t.id, { full_name: v })}
                      />
                    </td>

                    {/* Tier */}
                    <td className="px-4 py-3">
                      <select
                        value={t.tier}
                        onChange={(e) => patchTherapist(t.id, { tier: e.target.value })}
                        className="bg-[#3E2868] border border-[#553888] rounded-lg px-2 py-1 text-xs text-[#C4B5F0] focus:outline-none focus:ring-1 focus:ring-[#7B5FB8]/40"
                      >
                        <option value="premium">Premium</option>
                        <option value="elite">Elite</option>
                      </select>
                    </td>

                    {/* Rate — inline editable */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <EditableCell
                        value={(t.session_rate_cents / 100).toString()}
                        type="number"
                        onSave={(v) => patchTherapist(t.id, { session_rate_cents: Math.round(parseFloat(v) * 100) })}
                      />
                    </td>

                    {/* Sessions this month */}
                    <td className="px-4 py-3 text-[#C4B5F0] text-center">{t.sessions_this_month}</td>

                    {/* Revenue this month */}
                    <td className="px-4 py-3 text-[#C4B5F0] whitespace-nowrap">
                      {t.revenue_this_month_cents > 0 ? fmt$(t.revenue_this_month_cents) : <span className="text-[#6B5A8A]">—</span>}
                    </td>

                    {/* Languages */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(t.languages ?? []).map((l) => (
                          <span key={l} className="rounded-full bg-[#3E2868] px-2 py-0.5 text-xs text-[#B0A8C0]">{l}</span>
                        ))}
                      </div>
                    </td>

                    {/* WhatsApp number — inline editable */}
                    <td className="px-4 py-3">
                      <EditableCell
                        value={t.whatsapp_number ?? ""}
                        onSave={(v) => patchTherapist(t.id, { whatsapp_number: v || null })}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#6B5A8A]">
        💡 Click any cell to edit inline. Toggle the switch to activate/deactivate a therapist.
      </p>
    </div>
  );
}
