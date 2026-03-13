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
        className="text-left text-gray-300 hover:text-white hover:underline decoration-dashed underline-offset-2 transition-colors"
      >
        {value || <span className="text-gray-600">—</span>}
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
      className="bg-gray-700 border border-teal-500/50 rounded px-2 py-0.5 text-sm text-white focus:outline-none w-40"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-800 animate-pulse rounded-lg ${className ?? ""}`} />;
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
        <p className="text-gray-400 text-sm mt-0.5">
          {therapists.length} total · {therapists.filter((t) => t.is_active).length} active
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {["Active", "Name", "Tier", "Rate", "Sessions", "Revenue", "Languages", "WA Number"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : therapists.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">No therapists found</td>
                </tr>
              ) : (
                therapists.map((t) => (
                  <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                    {/* Active toggle */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(t)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          t.is_active ? "bg-teal-600" : "bg-gray-700"
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
                        className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-500/40"
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
                    <td className="px-4 py-3 text-gray-300 text-center">{t.sessions_this_month}</td>

                    {/* Revenue this month */}
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {t.revenue_this_month_cents > 0 ? fmt$(t.revenue_this_month_cents) : <span className="text-gray-600">—</span>}
                    </td>

                    {/* Languages */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(t.languages ?? []).map((l) => (
                          <span key={l} className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">{l}</span>
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

      <p className="mt-3 text-xs text-gray-600">
        💡 Click any cell to edit inline. Toggle the switch to activate/deactivate a therapist.
      </p>
    </div>
  );
}
