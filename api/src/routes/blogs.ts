import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { logger } from '../lib/logger';

const router = Router();

// ── GET / — List published posts (public) ────────────────────

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const tag = req.query.tag as string | undefined;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('blog_posts')
      .select('id, slug, title, excerpt, featured_image_url, author_name, published_at, tags, reading_time_min', { count: 'exact' })
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ posts: data ?? [], total: count ?? 0, page, limit });
  } catch (err: unknown) {
    logger.error('Public blog list error', { error: err instanceof Error ? err.message : err });
    res.status(500).json({ error: 'Failed to list posts' });
  }
});

// ── GET /:slug — Get single published post (public) ──────────

router.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(data);
  } catch (err: unknown) {
    logger.error('Public blog get error', { error: err instanceof Error ? err.message : err });
    res.status(500).json({ error: 'Failed to get post' });
  }
});

export default router;
