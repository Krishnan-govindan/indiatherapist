-- 013_blog_posts.sql
-- Blog posts table for the internal CMS

CREATE TABLE IF NOT EXISTS blog_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            TEXT NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    content         TEXT NOT NULL DEFAULT '',
    excerpt         TEXT,
    featured_image_url TEXT,
    author_name     TEXT NOT NULL DEFAULT 'India Therapist',
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at    TIMESTAMPTZ,
    meta_title      TEXT,
    meta_description TEXT,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    reading_time_min INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reuse the existing set_updated_at() trigger function from 002_therapists.sql
CREATE TRIGGER blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Indexes
CREATE INDEX idx_blog_posts_published ON blog_posts (published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_slug ON blog_posts (slug);

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY blog_posts_public_read ON blog_posts
    FOR SELECT USING (status = 'published');

-- Service role can do everything (admin API uses supabaseAdmin which bypasses RLS)
