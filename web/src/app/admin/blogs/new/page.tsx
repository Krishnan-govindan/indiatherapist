"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BlogEditor, { BlogPost } from "@/components/admin/BlogEditor";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

  const handleSave = async (data: BlogPost) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/blogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create post");
      }
      router.push("/admin/blogs");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsSaving(false);
    }
  };

  return <BlogEditor onSave={handleSave} isSaving={isSaving} />;
}
