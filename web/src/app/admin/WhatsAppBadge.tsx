"use client";

import { useEffect, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

export function WhatsAppBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${apiUrl}/api/admin/whatsapp/stats`, {
          headers: { "x-admin-secret": adminSecret },
        });
        if (res.ok) {
          const data = await res.json();
          setCount(data.unread_escalated ?? 0);
        }
      } catch {
        // ignore
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
      {count > 9 ? "9+" : count}
    </span>
  );
}
