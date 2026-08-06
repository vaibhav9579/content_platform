-- Note: `posts.searchVector` is a Postgres GENERATED ALWAYS AS ... STORED
-- column (Prisma type Unsupported("tsvector")). Prisma's migrate diff
-- can't model generated columns and re-detects one as a spurious
-- DROP INDEX / DROP DEFAULT on every unrelated migration after the one
-- that created it — intentionally omitted here so the full-text-search
-- GIN index isn't dropped. See migrations/20260806112834_add_fulltext_search.

-- AlterTable: existing rows get backfilled with a placeholder path before
-- the column is made required, since this table already had view rows
-- from before per-page tracking existed.
ALTER TABLE "views" ADD COLUMN     "isBot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "path" TEXT,
ALTER COLUMN "postId" DROP NOT NULL;

UPDATE "views" v
SET "path" = COALESCE('/blog/' || p."slug", '/unknown')
FROM "posts" p
WHERE v."postId" = p."id" AND v."path" IS NULL;

UPDATE "views" SET "path" = '/unknown' WHERE "path" IS NULL;

ALTER TABLE "views" ALTER COLUMN "path" SET NOT NULL;

-- CreateIndex
CREATE INDEX "views_visitorId_path_createdAt_idx" ON "views"("visitorId", "path", "createdAt");

-- CreateIndex
CREATE INDEX "views_isBot_createdAt_idx" ON "views"("isBot", "createdAt");
