"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/admin";
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Set cookie via API route
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(from);
    } else {
      setError("Incorrect password.");
    }
  };

  return (
    <main className="min-h-screen bg-[#1A1030] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🌿</div>
          <h1 className="text-xl font-bold text-white">India Therapist Admin</h1>
          <p className="text-[#B0A8C0] text-sm mt-1">Enter your admin password</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-[#2A1A4A] rounded-2xl p-6 border border-[#3E2868]">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            autoFocus
            className="w-full rounded-xl bg-[#3E2868] border border-[#553888] px-4 py-3 text-white placeholder-[#8B7AA0] text-sm focus:outline-none focus:ring-2 focus:ring-[#7B5FB8]/50 mb-3"
          />
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#7B5FB8] hover:bg-[#6B4AA0] text-white font-semibold py-3 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Checking…" : "Sign in →"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
