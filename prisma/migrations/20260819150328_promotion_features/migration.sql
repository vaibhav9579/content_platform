-- Note: `posts.searchVector` is a Postgres GENERATED ALWAYS AS ... STORED
-- column (Prisma type Unsupported("tsvector")). Prisma's migrate diff
-- can't model generated columns and re-detects one as a spurious
-- DROP INDEX / DROP DEFAULT on every unrelated migration — intentionally
-- omitted here so the full-text-search GIN index isn't dropped. See
-- migrations/20260806112834_add_fulltext_search.

-- AlterTable: unsubscribeToken added nullable first so existing
-- subscriber rows can be backfilled before it's made required + unique.
ALTER TABLE "newsletter_subscribers" ADD COLUMN "unsubscribeToken" TEXT;

UPDATE "newsletter_subscribers" SET "unsubscribeToken" = gen_random_uuid()::text WHERE "unsubscribeToken" IS NULL;

ALTER TABLE "newsletter_subscribers" ALTER COLUMN "unsubscribeToken" SET NOT NULL;

CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribeToken_key" ON "newsletter_subscribers"("unsubscribeToken");

-- AlterTable
ALTER TABLE "views" ADD COLUMN "utmCampaign" TEXT,
ADD COLUMN "utmMedium" TEXT,
ADD COLUMN "utmSource" TEXT;

CREATE INDEX "views_utmSource_createdAt_idx" ON "views"("utmSource", "createdAt");

-- CreateTable
CREATE TABLE "share_events" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "share_events_postId_createdAt_idx" ON "share_events"("postId", "createdAt");

CREATE INDEX "share_events_network_createdAt_idx" ON "share_events"("network", "createdAt");

ALTER TABLE "share_events" ADD CONSTRAINT "share_events_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
