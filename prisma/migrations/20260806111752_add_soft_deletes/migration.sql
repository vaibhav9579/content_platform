-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "comments_deletedAt_idx" ON "comments"("deletedAt");

-- CreateIndex
CREATE INDEX "media_deletedAt_idx" ON "media"("deletedAt");

-- CreateIndex
CREATE INDEX "posts_deletedAt_idx" ON "posts"("deletedAt");
