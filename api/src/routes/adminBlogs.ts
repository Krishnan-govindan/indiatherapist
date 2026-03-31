import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';

const router = Router();

// ── Admin auth middleware ─────────────────────────────────────

function requireAdminSecret(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

router.use(requireAdminSecret);

// ── Multer for image uploads ─────────────────────────────────

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── Helpers ──────────────────────────────────────────────────

function computeReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = text.split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

const BLOG_PATCHABLE = new Set([
  'slug', 'title', 'content', 'excerpt', 'featured_image_url',
  'author_name', 'status', 'meta_title', 'meta_description', 'tags',
]);

// ── GET / — List all posts ───────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('blog_posts')
      .select('id, slug, title, excerpt, featured_image_url, author_name, status, published_at, tags, reading_time_min, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && (status === 'draft' || status === 'published')) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ posts: data ?? [], total: count ?? 0, page, limit });
  } catch (err: unknown) {
    logger.error('Admin blog list error', { error: err instanceof Error ? err.message : err });
    res.status(500).json({ error: 'Failed to list posts' });
  }
});

// ── POST / — Create new post ─────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { slug, title, content, excerpt, featured_image_url, author_name, status, meta_title, meta_description, tags } = req.body;

    if (!slug || !title) {
      res.status(400).json({ error: 'slug and title are required' });
      return;
    }

    const reading_time_min = computeReadingTime(content || '');
    const published_at = status === 'published' ? new Date().toISOString() : null;

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        slug, title, content: content || '', excerpt, featured_image_url,
        author_name: author_name || 'India Therapist',
        status: status || 'draft', published_at,
        meta_title, meta_description,
        tags: tags || [], reading_time_min,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: unknown) {
    logger.error('Admin blog create error', { error: err instanceof Error ? err.message : err });
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// ── GET /:id — Get single post ───────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(data);
  } catch (err: unknown) {
    logger.error('Admin blog get error', { error: err instanceof Error ? err.message : err });
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// ── PATCH /:id — Update post ─────────────────────────────────

router.patch('/:id', async (req, res) => {
  try {
    const updates: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(req.body)) {
      if (BLOG_PATCHABLE.has(key)) updates[key] = val;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    // Recompute reading time if content changed
    if (typeof updates.content === 'string') {
      updates.reading_time_min = computeReadingTime(updates.content);
    }

    // Set published_at on first publish
    if (updates.status === 'published') {
      const { data: existing } = await supabaseAdmin
        .from('blog_posts')
        .select('published_at')
        .eq('id', req.params.id)
        .single();

      if (!existing?.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(data);
  } catch (err: unknown) {
    logger.error('Admin blog update error', { error: err instanceof Error ? err.message : err });
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// ── DELETE /:id — Delete post ────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    logger.error('Admin blog delete error', { error: err instanceof Error ? err.message : err });
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ── POST /upload-image — Upload image to Supabase Storage ────

router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const ext = file.originalname.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `blog/${filename}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('blog-images')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabaseAdmin.storage
      .from('blog-images')
      .getPublicUrl(path);

    res.json({ url: urlData.publicUrl });
  } catch (err: unknown) {
    logger.error('Blog image upload error', { error: err instanceof Error ? err.message : err });
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
