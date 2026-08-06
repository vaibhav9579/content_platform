-- Full-text search: a generated, weighted tsvector column plus a GIN index.
-- Title and subtitle rank highest (A), excerpt next (B), and the article
-- body (HTML tags stripped) ranks lowest (C) — this is what powers
-- ts_rank ordering in features/search.

ALTER TABLE "posts" ADD COLUMN "searchVector" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("subtitle", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("excerpt", '')), 'B') ||
  setweight(
    to_tsvector('english', regexp_replace(coalesce("contentHtml", ''), '<[^>]*>', ' ', 'g')),
    'C'
  )
) STORED;

CREATE INDEX "posts_searchVector_idx" ON "posts" USING GIN ("searchVector");
