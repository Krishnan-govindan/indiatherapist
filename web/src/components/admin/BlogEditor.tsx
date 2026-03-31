"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  featured_image_url: string | null;
  author_name: string;
  status: "draft" | "published";
  meta_title: string;
  meta_description: string;
  tags: string[];
}

interface BlogEditorProps {
  initialData?: BlogPost;
  onSave: (data: BlogPost) => Promise<void>;
  isSaving: boolean;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uploadImage(file: File): Promise<string | null> {
  const form = new FormData();
  form.append("image", file);
  try {
    const res = await fetch(`${apiUrl}/api/admin/blogs/upload-image`, {
      method: "POST",
      headers: { "x-admin-secret": adminSecret },
      body: form,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url ?? data.imageUrl ?? null;
  } catch (err) {
    console.error("Image upload error:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Toolbar Button
// ─────────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
        active
          ? "bg-[#7B5FB8] text-white"
          : "text-gray-300 hover:bg-[#3E2868] hover:text-white"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Editor Toolbar
// ─────────────────────────────────────────────────────────────

function EditorToolbar({
  editor,
}: {
  editor: ReturnType<typeof useEditor>;
}) {
  if (!editor) return null;

  const handleLink = () => {
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Enter URL:", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  };

  const handleImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = await uploadImage(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    };
    input.click();
  };

  const handleYoutube = () => {
    const url = window.prompt("Enter YouTube URL:");
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[#3E2868] bg-[#1A1030] p-2 rounded-t-lg">
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <span className="w-px h-5 bg-[#3E2868] mx-1" />

      {/* Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <s>S</s>
      </ToolbarButton>

      <span className="w-px h-5 bg-[#3E2868] mx-1" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet List"
      >
        &#8226; List
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Ordered List"
      >
        1. List
      </ToolbarButton>

      <span className="w-px h-5 bg-[#3E2868] mx-1" />

      {/* Link / Image / YouTube */}
      <ToolbarButton onClick={handleLink} active={editor.isActive("link")} title="Link">
        Link
      </ToolbarButton>
      <ToolbarButton onClick={handleImage} title="Insert Image">
        Image
      </ToolbarButton>
      <ToolbarButton onClick={handleYoutube} title="YouTube Embed">
        YouTube
      </ToolbarButton>

      <span className="w-px h-5 bg-[#3E2868] mx-1" />

      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        Undo
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        Redo
      </ToolbarButton>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function BlogEditor({
  initialData,
  onSave,
  isSaving,
}: BlogEditorProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [featuredImage, setFeaturedImage] = useState<string | null>(
    initialData?.featured_image_url ?? null
  );
  const [authorName, setAuthorName] = useState(
    initialData?.author_name ?? "India Therapist"
  );
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initialData?.meta_description ?? ""
  );
  const [tagsInput, setTagsInput] = useState(
    initialData?.tags?.join(", ") ?? ""
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [seoOpen, setSeoOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      LinkExtension.configure({ openOnClick: false }),
      Youtube.configure({ controls: true }),
      Placeholder.configure({ placeholder: "Start writing your post..." }),
    ],
    content: initialData?.content ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-headings:text-white prose-p:text-gray-100 prose-a:text-[#7B5FB8] max-w-none min-h-[400px] px-4 py-3 focus:outline-none",
      },
    },
  });

  // Auto-generate slug from title (only if slug was not manually edited)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    !!initialData?.slug
  );

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (!slugManuallyEdited) {
        setSlug(slugify(value));
      }
    },
    [slugManuallyEdited]
  );

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setSlug(value);
  };

  // Tags from comma-separated input
  const handleTagsInputChange = (value: string) => {
    setTagsInput(value);
    const parsed = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setTags(parsed);
  };

  const removeTag = (index: number) => {
    const next = tags.filter((_, i) => i !== index);
    setTags(next);
    setTagsInput(next.join(", "));
  };

  // Featured image upload
  const handleFeaturedUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    if (url) setFeaturedImage(url);
    setUploading(false);
  };

  // Save handler
  const handleSave = async (status: "draft" | "published") => {
    const data: BlogPost = {
      id: initialData?.id,
      slug,
      title,
      content: editor?.getHTML() ?? "",
      excerpt,
      featured_image_url: featuredImage,
      author_name: authorName,
      status,
      meta_title: metaTitle,
      meta_description: metaDescription,
      tags,
    };
    await onSave(data);
  };

  return (
    <div className="min-h-screen bg-[#1A1030]">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#1A1030]/95 backdrop-blur border-b border-[#3E2868]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <Link
            href="/admin/blogs"
            className="text-[#B0A8C0] hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            <span>&larr;</span> Back to Blogs
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave("draft")}
              className="px-4 py-2 rounded-lg border border-[#3E2868] text-gray-200 hover:bg-[#3E2868] transition-colors text-sm disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave("published")}
              className="px-4 py-2 rounded-lg bg-[#7B5FB8] hover:bg-[#553888] text-white transition-colors text-sm disabled:opacity-50"
            >
              {isSaving ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left Column (~70%) ──────────────────────────── */}
          <div className="flex-1 lg:w-[70%] space-y-5">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title..."
              className="w-full bg-transparent text-white text-3xl font-bold placeholder-[#5A4880] border-none outline-none focus:ring-0"
            />

            {/* Slug */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#B0A8C0] shrink-0">/blogs/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="flex-1 bg-[#2A1A4A] border border-[#3E2868] rounded px-3 py-1.5 text-gray-100 text-sm focus:outline-none focus:border-[#7B5FB8]"
              />
            </div>

            {/* Featured Image */}
            <div>
              <label className="block text-[#B0A8C0] text-sm mb-2">
                Featured Image
              </label>
              {featuredImage ? (
                <div className="relative rounded-lg overflow-hidden border border-[#3E2868]">
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-full max-h-72 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage(null)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm transition-colors"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-[#3E2868] rounded-lg py-12 text-center text-[#B0A8C0] hover:border-[#7B5FB8] hover:text-white transition-colors"
                >
                  {uploading
                    ? "Uploading..."
                    : "Click to upload featured image"}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFeaturedUpload}
              />
            </div>

            {/* TipTap Editor */}
            <div className="border border-[#3E2868] rounded-lg overflow-hidden bg-[#2A1A4A]">
              <EditorToolbar editor={editor} />
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* ── Right Sidebar (~30%) ────────────────────────── */}
          <div className="lg:w-[30%] space-y-5">
            {/* Excerpt */}
            <div className="bg-[#2A1A4A] border border-[#3E2868] rounded-lg p-4">
              <label className="block text-[#B0A8C0] text-sm mb-2">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                placeholder="Brief summary of the post..."
                className="w-full bg-[#1A1030] border border-[#3E2868] rounded px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-[#7B5FB8] resize-none"
              />
            </div>

            {/* Tags */}
            <div className="bg-[#2A1A4A] border border-[#3E2868] rounded-lg p-4">
              <label className="block text-[#B0A8C0] text-sm mb-2">
                Tags
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => handleTagsInputChange(e.target.value)}
                placeholder="e.g. anxiety, therapy, wellness"
                className="w-full bg-[#1A1030] border border-[#3E2868] rounded px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-[#7B5FB8]"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-[#3E2868] text-gray-200 text-xs px-2.5 py-1 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(i)}
                        className="text-gray-400 hover:text-white ml-0.5"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Author */}
            <div className="bg-[#2A1A4A] border border-[#3E2868] rounded-lg p-4">
              <label className="block text-[#B0A8C0] text-sm mb-2">
                Author
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-[#1A1030] border border-[#3E2868] rounded px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-[#7B5FB8]"
              />
            </div>

            {/* SEO Section */}
            <div className="bg-[#2A1A4A] border border-[#3E2868] rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setSeoOpen(!seoOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#3E2868]/30 transition-colors"
              >
                <span className="text-[#B0A8C0] text-sm font-medium">
                  SEO Settings
                </span>
                <span className="text-[#B0A8C0] text-xs">
                  {seoOpen ? "▲" : "▼"}
                </span>
              </button>

              {seoOpen && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="block text-[#B0A8C0] text-xs mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="SEO title (defaults to post title)"
                      className="w-full bg-[#1A1030] border border-[#3E2868] rounded px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-[#7B5FB8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#B0A8C0] text-xs mb-1">
                      Meta Description
                    </label>
                    <textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      rows={3}
                      placeholder="SEO description (defaults to excerpt)"
                      className="w-full bg-[#1A1030] border border-[#3E2868] rounded px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-[#7B5FB8] resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
