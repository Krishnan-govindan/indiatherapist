"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Suspense } from "react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_name: string;
  status: "draft" | "published";
  published_at: string | null;
  tags: string[];
  reading_time_min: number | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  published: "bg-green-900 text-green-200",
  draft: "bg-[#553888] text-[#E0D5FF]",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_COLORS[status] ?? "bg-[#553888] text-[#E0D5FF]"}`}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-[#3E2868] animate-pulse rounded-lg ${className ?? ""}`} />;
}

// ─────────────────────────────────────────────────────────────
// Delete confirmation modal
// ─────────────────────────────────────────────────────────────

function DeleteModal({
  post,
  onCancel,
  onConfirm,
  deleting,
}: {
  post: BlogPost;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1A1030]/70" onClick={onCancel} />
      <div className="relative bg-[#2A1A4A] border border-[#3E2868] rounded-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-white mb-2">Delete Post</h3>
        <p className="text-sm text-[#B0A8C0] mb-6">
          Are you sure you want to delete <span className="text-white font-medium">&ldquo;{post.title}&rdquo;</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg bg-[#3E2868] hover:bg-[#553888] px-4 py-2 text-sm text-[#C4B5F0] transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2 text-sm text-white font-medium transition-colors disabled:opacity-40"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page content
// ─────────────────────────────────────────────────────────────

const STATUS_FILTERS = ["all", "published", "draft"];

function BlogsContent() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 20;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
  const headers = { "Content-Type": "application/json", "x-admin-secret": adminSecret };

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`${apiUrl}/api/admin/blogs?${params}`, {
        headers: { "x-admin-secret": adminSecret },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, adminSecret, statusFilter, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/blogs/${deleteTarget.id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setTotal((prev) => prev - 1);
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
          <p className="text-[#B0A8C0] text-sm mt-0.5">Manage your blog content</p>
        </div>
        <Link
          href="/admin/blogs/new"
          className="rounded-lg bg-[#7B5FB8] hover:bg-[#553888] px-4 py-2 text-sm text-white font-medium transition-colors"
        >
          New Post
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
              statusFilter === s
                ? "bg-[#7B5FB8] text-white"
                : "bg-[#3E2868] text-[#B0A8C0] hover:bg-[#553888]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#2A1A4A] border border-[#3E2868] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#3E2868]">
                {["Title", "Status", "Published", "Tags", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#8B7AA0] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#3E2868]/50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <p className="text-[#8B7AA0] text-base mb-3">No blog posts yet</p>
                    <Link
                      href="/admin/blogs/new"
                      className="inline-block rounded-lg bg-[#7B5FB8] hover:bg-[#553888] px-4 py-2 text-sm text-white font-medium transition-colors"
                    >
                      Create your first post
                    </Link>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-[#3E2868]/50 hover:bg-[#3E2868]/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/blogs/${post.id}/edit`}
                        className="font-medium text-white hover:text-[#C4B5F0] transition-colors"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3 text-[#8B7AA0] whitespace-nowrap">
                      {post.published_at ? fmtDate(post.published_at) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#B0A8C0]">
                      {post.tags.length > 0 ? post.tags.join(", ") : <span className="text-[#6B5A8A]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/blogs/${post.id}/edit`}
                          className="text-xs text-[#A78BDE] hover:text-white transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(post)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#3E2868]">
            <span className="text-xs text-[#8B7AA0]">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg bg-[#3E2868] hover:bg-[#553888] px-3 py-1.5 text-xs text-[#C4B5F0] disabled:opacity-40 transition-colors"
              >
                ← Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg bg-[#3E2868] hover:bg-[#553888] px-3 py-1.5 text-xs text-[#C4B5F0] disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          post={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}

export default function AdminBlogsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[#B0A8C0]">Loading...</div>}>
      <BlogsContent />
    </Suspense>
  );
}
