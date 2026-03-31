"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import BlogEditor, { BlogPost } from "@/components/admin/BlogEditor";

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
  const headers = { "Content-Type": "application/json", "x-admin-secret": adminSecret };

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`${apiUrl}/api/admin/blogs/${id}`, { headers });
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setPost(data);
      } catch {
        alert("Post not found");
        router.push("/admin/blogs");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async (data: BlogPost) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/blogs/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update post");
      }
      router.push("/admin/blogs");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update post");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#7B5FB8] border-t-transparent" />
        <p className="mt-4 text-[#B0A8C0]">Loading post…</p>
      </div>
    );
  }

  if (!post) return null;

  return <BlogEditor initialData={post} onSave={handleSave} isSaving={isSaving} />;
}
