"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Stats {
  leads_this_month: number;
  leads_last_month: number;
  leads_mom_change_pct: number;
  conversion_rate: number;
  revenue_this_month_cents: number;
  active_therapists: number;
  pending_appointments: number;
  avg_response_min: number | null;
  weekly_leads: { week: string; count: number }[];
  recent_leads: RecentLead[];
}

interface RecentLead {
  id: string;
  full_name: string;
  status: string;
  source: string;
  created_at: string;
  therapists: { full_name: string } | null;
}

// ─────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  new:          "bg-[#3E2868] text-[#E0D5FF]",
  voice_called: "bg-blue-900 text-blue-200",
  qualified:    "bg-purple-900 text-purple-200",
  matched:      "bg-orange-900 text-orange-200",
  payment_pending: "bg-yellow-900 text-yellow-200",
  converted:    "bg-green-900 text-green-200",
  lost:         "bg-red-900 text-red-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? "bg-[#3E2868] text-[#E0D5FF]"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Metric card
// ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: number;
}) {
  return (
    <div className="bg-[#2A1A4A] border border-[#3E2868] rounded-2xl p-5">
      <p className="text-xs font-medium text-[#B0A8C0] uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <div className="flex items-center gap-2">
        {trend !== undefined && (
          <span className={`text-xs font-medium ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
        {sub && <span className="text-xs text-[#8B7AA0]">{sub}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-[#3E2868] animate-pulse rounded-xl ${className ?? ""}`} />;
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    fetch(`${apiUrl}/api/admin/stats`, {
      headers: { "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "" },
      credentials: "include",
    })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setError("Could not load stats — is the API running?"));
  }, []);

  const fmt$ = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-[#B0A8C0] text-sm mt-1">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-[#3E1030] border border-[#D45050]/30 px-4 py-3 text-sm text-[#D45050]">
          {error}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {stats ? (
          <>
            <MetricCard
              label="Leads This Month"
              value={stats.leads_this_month.toString()}
              trend={stats.leads_mom_change_pct}
              sub={`vs ${stats.leads_last_month} last month`}
            />
            <MetricCard
              label="Conversion Rate"
              value={`${stats.conversion_rate}%`}
              sub="Leads → paid sessions"
            />
            <MetricCard
              label="Revenue This Month"
              value={fmt$(stats.revenue_this_month_cents)}
              sub="Platform fees"
            />
            <MetricCard
              label="Active Therapists"
              value={stats.active_therapists.toString()}
            />
            <MetricCard
              label="Pending Appointments"
              value={stats.pending_appointments.toString()}
            />
            <MetricCard
              label="Avg Response Time"
              value={stats.avg_response_min != null ? `${stats.avg_response_min} min` : "—"}
              sub="Lead → first WA message"
            />
          </>
        ) : (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))
        )}
      </div>

      {/* Weekly bar chart */}
      <div className="bg-[#2A1A4A] border border-[#3E2868] rounded-2xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-5">
          Leads by Week (last 8 weeks)
        </h2>
        {stats ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.weekly_leads} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3E2868" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: "#8B7AA0", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8B7AA0", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#2A1A4A", border: "1px solid #3E2868", borderRadius: 8 }}
                labelStyle={{ color: "#F8F5FF", fontSize: 12 }}
                itemStyle={{ color: "#A78BDE" }}
              />
              <Bar dataKey="count" fill="#7B5FB8" radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Skeleton className="h-48" />
        )}
      </div>

      {/* Recent leads table */}
      <div className="bg-[#2A1A4A] border border-[#3E2868] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3E2868]">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Recent Leads
          </h2>
          <Link
            href="/admin/leads"
            className="text-xs text-[#A78BDE] hover:text-[#C4B5F0] transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#3E2868]">
                {["Name", "Status", "Therapist", "Source", "Created", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-[#8B7AA0] uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats ? (
                stats.recent_leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#8B7AA0] text-sm">
                      No leads yet
                    </td>
                  </tr>
                ) : (
                  stats.recent_leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-[#3E2868]/50 hover:bg-[#3E2868]/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#E0D5FF] whitespace-nowrap">
                        {lead.full_name}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3 text-[#B0A8C0] whitespace-nowrap">
                        {lead.therapists?.full_name ?? <span className="text-[#6B5A8A]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[#8B7AA0] whitespace-nowrap">{lead.source ?? "—"}</td>
                      <td className="px-4 py-3 text-[#8B7AA0] whitespace-nowrap">{fmtDate(lead.created_at)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/leads?id=${lead.id}`}
                          className="text-xs text-[#A78BDE] hover:text-[#C4B5F0] transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#3E2868]/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
