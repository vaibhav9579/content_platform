"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { JSONContent } from "@tiptap/react";
import type { DifficultyLevel as DifficultyLevelType, PostStatus as PostStatusType } from "@prisma/client";

// Prisma's generated enum objects (`PostStatus.DRAFT`, etc.) are runtime
// values from `@prisma/client`, a server-only package — importing them for
// their *values* into this "use client" component crosses the RSC boundary
// as an opaque reference, not a plain string, which crashes Prisma's own
// argument validation when it's later sent back into a Server Action. Only
// the *type* is imported above; these mirror the enum's literal string
// values (Prisma enums are always `{ KEY: "KEY" }`) for runtime use.
const PostStatus = {
  DRAFT: "DRAFT",
  IN_REVIEW: "IN_REVIEW",
  SCHEDULED: "SCHEDULED",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const satisfies Record<string, PostStatusType>;

const DifficultyLevel = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
} as const satisfies Record<string, DifficultyLevelType>;

type PostStatus = PostStatusType;
type DifficultyLevel = DifficultyLevelType;
import {
  EyeIcon,
  PlusIcon,
  Trash2Icon,
  DownloadIcon,
  UploadIcon,
  Loader2Icon,
  CheckIcon,
  TriangleAlertIcon,
  ExternalLinkIcon,
  SparkleIcon,
} from "lucide-react";

import { TiptapEditor, type TiptapEditorHandle } from "@/components/editor/tiptap-editor";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { TagMultiselect } from "@/components/admin/posts/tag-multiselect";
import { RevisionHistoryDialog } from "@/components/admin/posts/revision-history-dialog";
import { InternalLinkSuggestions } from "@/components/admin/posts/internal-link-suggestions";
import { savePost, autosavePost, findPostWithSameTitle } from "@/features/posts/actions/post-actions";
import { exportPostAsMarkdown, importMarkdownAsHtml } from "@/features/posts/actions/markdown-actions";
import { slugifyTitle } from "@/lib/content/slug";
import { computeReadingStats } from "@/lib/content/reading-time";
import type { PostInput } from "@/lib/validations";

type FormData = {
  authors: { id: string; name: string; avatarUrl: string | null }[];
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
};

type ExistingPost = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  contentJson: unknown;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  metaRobots: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  status: PostStatus;
  scheduledAt: string | null;
  difficulty: DifficultyLevel | null;
  summary: string | null;
  keyTakeaways: string[];
  faq: { question: string; answer: string }[] | null;
  sources: { label: string; url: string }[] | null;
  isFeatured: boolean;
  isPinned: boolean;
  allowComments: boolean;
  authorId: string;
  categoryId: string | null;
  tags: { id: string }[];
};

type Revision = React.ComponentProps<typeof RevisionHistoryDialog>["revisions"];

function toLocalDateTimeInput(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localTimezoneLabel() {
  const offsetMin = -new Date().getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  const offset = `UTC${sign}${hours}${mins ? `:${String(mins).padStart(2, "0")}` : ""}`;
  return `${Intl.DateTimeFormat().resolvedOptions().timeZone}, ${offset}`;
}

export function PostEditorShell({
  mode,
  post,
  formData,
  revisions = [],
  allowPublish = true,
}: {
  mode: "create" | "edit";
  post?: ExistingPost;
  formData: FormData;
  revisions?: Revision;
  /** Authors/contributors can't publish directly — they submit for editorial review instead. */
  allowPublish?: boolean;
}) {
  const router = useRouter();
  const editorRef = React.useRef<TiptapEditorHandle>(null);
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = React.useState(mode === "edit");
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [stats, setStats] = React.useState({ words: 0, minutes: 0 });

  const [postId, setPostId] = React.useState<string | undefined>(post?.id);
  const [title, setTitle] = React.useState(post?.title ?? "");
  const [subtitle, setSubtitle] = React.useState(post?.subtitle ?? "");
  const [slug, setSlug] = React.useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = React.useState(post?.excerpt ?? "");
  const [metaTitle, setMetaTitle] = React.useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = React.useState(post?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = React.useState(post?.canonicalUrl ?? "");
  const [metaRobots, setMetaRobots] = React.useState(post?.metaRobots ?? "index, follow");
  const [coverImageUrl, setCoverImageUrl] = React.useState(post?.coverImageUrl ?? "");
  const [coverImageAlt, setCoverImageAlt] = React.useState(post?.coverImageAlt ?? "");
  const [status, setStatus] = React.useState<PostStatus>(post?.status ?? PostStatus.DRAFT);
  const [scheduledAt, setScheduledAt] = React.useState(toLocalDateTimeInput(post?.scheduledAt));
  const [difficulty, setDifficulty] = React.useState<DifficultyLevel>(
    post?.difficulty ?? DifficultyLevel.BEGINNER,
  );
  const [summary, setSummary] = React.useState(post?.summary ?? "");
  const [keyTakeaways, setKeyTakeaways] = React.useState<string[]>(post?.keyTakeaways ?? []);
  const [faq, setFaq] = React.useState<{ question: string; answer: string }[]>(post?.faq ?? []);
  const [sources, setSources] = React.useState<{ label: string; url: string }[]>(post?.sources ?? []);
  const [isFeatured, setIsFeatured] = React.useState(post?.isFeatured ?? false);
  const [isPinned, setIsPinned] = React.useState(post?.isPinned ?? false);
  const [allowComments, setAllowComments] = React.useState(post?.allowComments ?? true);
  const [authorId, setAuthorId] = React.useState(post?.authorId ?? formData.authors[0]?.id ?? "");
  const [categoryId, setCategoryId] = React.useState(post?.categoryId ?? "");
  const [tagIds, setTagIds] = React.useState<string[]>(post?.tags.map((t) => t.id) ?? []);

  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [autosaveFailing, setAutosaveFailing] = React.useState(false);
  const [openAccordions, setOpenAccordions] = React.useState<string[]>([]);
  const [publishConfirm, setPublishConfirm] = React.useState<{
    warnings: string[];
    duplicateOf: { title: string; slug: string } | null;
    checking: boolean;
  } | null>(null);
  const [publishSuccess, setPublishSuccess] = React.useState<{ title: string; slug: string } | null>(null);

  const contentRef = React.useRef<{ json: JSONContent; html: string }>({
    json: (post?.contentJson as JSONContent) ?? {},
    html: "",
  });

  function handleEditorUpdate(payload: { json: JSONContent; html: string; words: number }) {
    contentRef.current = { json: payload.json, html: payload.html };
    const stats = computeReadingStats(payload.html);
    setStats({ words: stats.words, minutes: stats.minutes });
  }

  // Marks the draft dirty on any change so we can warn before an
  // accidental tab close — deliberately broad (every field, plus `stats`
  // as a proxy for editor content changes) rather than wiring a dirty flag
  // into two dozen individual onChange handlers.
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setHasUnsavedChanges(true);
  }, [
    title,
    subtitle,
    slug,
    excerpt,
    metaTitle,
    metaDescription,
    canonicalUrl,
    metaRobots,
    coverImageUrl,
    coverImageAlt,
    status,
    scheduledAt,
    difficulty,
    summary,
    keyTakeaways,
    faq,
    sources,
    isFeatured,
    isPinned,
    allowComments,
    authorId,
    categoryId,
    tagIds,
    stats,
  ]);

  React.useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  function buildInput(overrideStatus?: PostStatus): PostInput {
    // Read live from the editor instead of trusting the onUpdate-cached
    // contentRef — that cache can go stale relative to the actual document
    // after certain paste operations (observed: contentJson caught up via
    // onUpdate but contentHtml stayed empty), so always resolve the
    // freshest state right before it's sent to the server.
    const liveJson = editorRef.current?.getJSON() ?? contentRef.current.json;
    const liveHtml = editorRef.current?.getHTML() ?? contentRef.current.html;
    return {
      id: postId,
      title,
      subtitle: subtitle || null,
      slug: slug || slugifyTitle(title),
      contentJson: liveJson,
      contentHtml: liveHtml,
      excerpt: excerpt || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      metaRobots,
      coverImageUrl: coverImageUrl || null,
      coverImageAlt: coverImageAlt || null,
      ogImageUrl: coverImageUrl || null,
      galleryUrls: [],
      status: overrideStatus ?? status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      difficulty,
      summary: summary || null,
      keyTakeaways: keyTakeaways.filter(Boolean),
      faq: faq.filter((f) => f.question && f.answer),
      sources: sources.filter((s) => s.label && s.url),
      isFeatured,
      isPinned,
      allowComments,
      authorId,
      categoryId: categoryId || null,
      tagIds,
    };
  }

  // Kept fresh after every render so the autosave interval (below) can
  // read current title/author/etc. without stale-closure issues, while
  // its own effect only needs to restart when `postId` itself changes.
  const buildInputRef = React.useRef(buildInput);
  React.useEffect(() => {
    buildInputRef.current = buildInput;
  });

  function handleSave(overrideStatus?: PostStatus) {
    if (title.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }
    if (!authorId) {
      toast.error("Select an author");
      return;
    }
    startTransition(async () => {
      try {
        const result = await savePost(buildInput(overrideStatus));
        if (result.success) {
          const justPublished = overrideStatus === PostStatus.PUBLISHED;
          setLastSavedAt(new Date());
          setHasUnsavedChanges(false);
          setAutosaveFailing(false);
          setStatus(overrideStatus ?? status);
          setPostId(result.data.id);
          setSlug(result.data.slug);

          if (justPublished) {
            // Show the success modal in place of a plain toast every time
            // the Publish flow completes — defer the route change (new →
            // edit URL) until the user dismisses it, since navigating now
            // would remount this component and lose that state before
            // it's ever shown.
            setPublishSuccess({ title, slug: result.data.slug });
          } else {
            toast.success("Saved");
            if (mode === "create") {
              router.push(`/admin/posts/${result.data.id}/edit`);
            } else {
              router.refresh();
            }
          }
        } else {
          toast.error(result.error);
          if (result.section) {
            setOpenAccordions((prev) => (prev.includes(result.section!) ? prev : [...prev, result.section!]));
          }
        }
      } catch {
        // A backstop for anything that reaches here unhandled — savePost
        // itself wraps its own logic, but a Server Action can still throw
        // (e.g. a dropped connection), and that should never fail silently.
        toast.error("Something went wrong while saving. Please try again.");
      }
    });
  }

  async function handlePublishClick() {
    if (title.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }
    if (!authorId) {
      toast.error("Select an author");
      return;
    }

    const html = editorRef.current?.getHTML() ?? contentRef.current.html;
    const words = computeReadingStats(html).words;

    const warnings: string[] = [];
    if (!coverImageUrl) warnings.push("No cover image set");
    if (!metaDescription.trim()) warnings.push("No meta description — one will be auto-generated from the content");
    if (!categoryId) warnings.push("No category selected");
    if (words > 0 && words < 100) warnings.push(`Very short content (${words} words)`);

    setPublishConfirm({ warnings, duplicateOf: null, checking: true });
    const duplicate = await findPostWithSameTitle(title, postId).catch(() => null);
    setPublishConfirm({
      warnings,
      duplicateOf: duplicate ? { title: duplicate.title, slug: duplicate.slug } : null,
      checking: false,
    });
  }

  function confirmPublish() {
    setPublishConfirm(null);
    handleSave(PostStatus.PUBLISHED);
  }

  // Autosave every 20s — including for a brand-new, never-manually-saved
  // post, which previously had zero protection until the first manual
  // Save (lose the tab, lose the draft). The first tick silently creates
  // it as a DRAFT regardless of whatever status is selected; the URL is
  // then replaced to point at the real post so a refresh can't create a
  // duplicate. Later ticks just update it in place.
  React.useEffect(() => {
    const interval = setInterval(async () => {
      const html = editorRef.current?.getHTML() ?? contentRef.current.html;
      const hasRealContent = computeReadingStats(html).words > 0;
      if (!hasRealContent) return;

      if (!postId) {
        const input = buildInputRef.current(PostStatus.DRAFT);
        if (input.title.trim().length < 3 || !input.authorId) return;
        const result = await savePost(input);
        if (result.success) {
          setPostId(result.data.id);
          setSlug(result.data.slug);
          setLastSavedAt(new Date());
          setHasUnsavedChanges(false);
          setAutosaveFailing(false);
          router.replace(`/admin/posts/${result.data.id}/edit`);
        } else {
          setAutosaveFailing((wasFailing) => {
            if (!wasFailing) {
              toast.error("Autosave failed — your changes aren't being saved automatically.");
            }
            return true;
          });
        }
        return;
      }

      const res = await autosavePost(postId, contentRef.current.json, contentRef.current.html);
      if (res.success) {
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
        setAutosaveFailing(false);
      } else {
        setAutosaveFailing((wasFailing) => {
          if (!wasFailing) {
            toast.error("Autosave failed — your changes aren't being saved automatically.");
          }
          return true;
        });
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [postId, router]);

  async function handleMarkdownImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = await importMarkdownAsHtml(text);
    if (result.success) {
      editorRef.current?.setContent(result.html);
      toast.success("Markdown imported");
    } else toast.error(result.error);
    e.target.value = "";
  }

  async function handleMarkdownExport() {
    const html = editorRef.current?.getHTML() ?? "";
    const result = await exportPostAsMarkdown(html, { title, slug, excerpt });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    const blob = new Blob([result.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "post"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function dismissPublishSuccess() {
    setPublishSuccess(null);
    if (mode === "create" && postId) {
      router.push(`/admin/posts/${postId}/edit`);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      {/* Main editor column */}
      <div className="min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span>{stats.words} words</span>
            <span>·</span>
            <span>{stats.minutes} min read</span>
            {autosaveFailing ? (
              <>
                <span>·</span>
                <span className="text-destructive flex items-center gap-1">
                  <TriangleAlertIcon className="size-3" /> Autosave failed — save manually
                </span>
              </>
            ) : (
              lastSavedAt && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <CheckIcon className="size-3" /> Saved {lastSavedAt.toLocaleTimeString()}
                  </span>
                </>
              )
            )}
            {hasUnsavedChanges && !autosaveFailing && (
              <>
                <span>·</span>
                <span className="text-muted-foreground">Unsaved changes</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label>
              <input type="file" accept=".md,.markdown" className="hidden" onChange={handleMarkdownImport} />
              <Button variant="outline" size="sm" asChild>
                <span>
                  <UploadIcon /> Import MD
                </span>
              </Button>
            </label>
            <Button variant="outline" size="sm" onClick={handleMarkdownExport}>
              <DownloadIcon /> Export MD
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-3 pt-5 pb-5">
            <Textarea
              value={title}
              onChange={(e) => {
                const value = e.target.value;
                setTitle(value);
                if (!slugTouched) setSlug(slugifyTitle(value));
              }}
              placeholder="Post title…"
              rows={1}
              className="resize-none border-0 p-0 font-serif text-3xl font-semibold shadow-none focus-visible:ring-0 md:text-4xl"
            />
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Add a subtitle (optional)…"
              className="text-muted-foreground border-0 p-0 text-lg shadow-none focus-visible:ring-0"
            />
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span>/blog/</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="bg-transparent underline decoration-dotted outline-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-8">
            <TiptapEditor
              ref={editorRef}
              initialContent={(post?.contentJson as JSONContent) ?? null}
              onUpdate={handleEditorUpdate}
            />
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-5">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PostStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={PostStatus.IN_REVIEW}>In Review</SelectItem>
                  <SelectItem value={PostStatus.SCHEDULED} disabled={!allowPublish}>
                    Scheduled
                  </SelectItem>
                  <SelectItem value={PostStatus.PUBLISHED} disabled={!allowPublish}>
                    Published
                  </SelectItem>
                  <SelectItem value={PostStatus.ARCHIVED}>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {status === PostStatus.SCHEDULED && (
              <div className="space-y-1.5">
                <Label>Publish at</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                <p className="text-muted-foreground text-[11px]">In your local time ({localTimezoneLabel()})</p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button className="flex-1" disabled={pending} onClick={() => handleSave()}>
                {pending && <Loader2Icon className="animate-spin" />} Save
              </Button>
              {allowPublish ? (
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={pending}
                  onClick={handlePublishClick}
                >
                  Publish
                </Button>
              ) : (
                status !== PostStatus.PUBLISHED && (
                  <Button
                    variant="secondary"
                    className="flex-1"
                    disabled={pending}
                    onClick={() => handleSave(PostStatus.IN_REVIEW)}
                  >
                    Submit for Review
                  </Button>
                )
              )}
            </div>
            {postId && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={`/blog/${slug}`} target="_blank" rel="noreferrer">
                  <EyeIcon /> Preview
                </a>
              </Button>
            )}
            {postId && <RevisionHistoryDialog revisions={revisions} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cover Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-5">
            <ImageUploadField
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              folder="content-platform/covers"
            />
            <Input
              placeholder="Alt text for accessibility & SEO"
              value={coverImageAlt}
              onChange={(e) => setCoverImageAlt(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-5">
            <div className="space-y-1.5">
              <Label>Author</Label>
              <Select value={authorId} onValueChange={setAuthorId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select author" />
                </SelectTrigger>
                <SelectContent>
                  {formData.authors.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-5">
                          <AvatarImage src={a.avatarUrl ?? undefined} />
                          <AvatarFallback>{a.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        {a.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {formData.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tags</Label>
              <TagMultiselect options={formData.tags} value={tagIds} onChange={setTagIds} />
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DifficultyLevel.BEGINNER}>Beginner</SelectItem>
                  <SelectItem value={DifficultyLevel.INTERMEDIATE}>Intermediate</SelectItem>
                  <SelectItem value={DifficultyLevel.ADVANCED}>Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Label htmlFor="featured">Featured</Label>
              <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pinned">Pinned</Label>
              <Switch id="pinned" checked={isPinned} onCheckedChange={setIsPinned} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="comments">Allow comments</Label>
              <Switch id="comments" checked={allowComments} onCheckedChange={setAllowComments} />
            </div>
          </CardContent>
        </Card>

        <InternalLinkSuggestions title={title} postId={postId} />

        <Card>
          <CardContent className="pt-5 pb-2">
            <Accordion type="multiple" value={openAccordions} onValueChange={setOpenAccordions}>
              <AccordionItem value="seo">
                <AccordionTrigger>SEO</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Meta title</Label>
                    <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={70} />
                    <p className="text-muted-foreground text-right text-[10px]">{metaTitle.length}/70</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Meta description</Label>
                    <Textarea
                      rows={3}
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      maxLength={160}
                    />
                    <p className="text-muted-foreground text-right text-[10px]">{metaDescription.length}/160</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Excerpt</Label>
                    <Textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Canonical URL</Label>
                    <Input value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Meta robots</Label>
                    <Select value={metaRobots} onValueChange={setMetaRobots}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="index, follow">Index, Follow</SelectItem>
                        <SelectItem value="noindex, follow">Noindex, Follow</SelectItem>
                        <SelectItem value="index, nofollow">Index, Nofollow</SelectItem>
                        <SelectItem value="noindex, nofollow">Noindex, Nofollow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="geo">
                <AccordionTrigger>GEO (AI Answer Optimization)</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Summary</Label>
                    <Textarea
                      rows={3}
                      placeholder="A 2-3 sentence direct answer AI engines can quote"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                    />
                  </div>

                  <ListEditor
                    label="Key Takeaways"
                    items={keyTakeaways}
                    onChange={setKeyTakeaways}
                    placeholder="A key takeaway…"
                  />

                  <div className="space-y-1.5">
                    <Label>FAQ</Label>
                    {faq.map((item, i) => (
                      <div key={i} className="space-y-1.5 rounded-lg border p-2.5">
                        <Input
                          placeholder="Question"
                          value={item.question}
                          onChange={(e) => {
                            const next = [...faq];
                            next[i] = { ...next[i], question: e.target.value };
                            setFaq(next);
                          }}
                        />
                        <Textarea
                          placeholder="Answer"
                          rows={2}
                          value={item.answer}
                          onChange={(e) => {
                            const next = [...faq];
                            next[i] = { ...next[i], answer: e.target.value };
                            setFaq(next);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFaq(faq.filter((_, idx) => idx !== i))}
                        >
                          <Trash2Icon className="size-3.5" /> Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFaq([...faq, { question: "", answer: "" }])}
                    >
                      <PlusIcon /> Add FAQ item
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Sources</Label>
                    {sources.map((source, i) => (
                      <div key={i} className="flex gap-1.5">
                        <Input
                          placeholder="Label"
                          value={source.label}
                          onChange={(e) => {
                            const next = [...sources];
                            next[i] = { ...next[i], label: e.target.value };
                            setSources(next);
                          }}
                        />
                        <Input
                          placeholder="URL"
                          value={source.url}
                          onChange={(e) => {
                            const next = [...sources];
                            next[i] = { ...next[i], url: e.target.value };
                            setSources(next);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSources(sources.filter((_, idx) => idx !== i))}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSources([...sources, { label: "", url: "" }])}
                    >
                      <PlusIcon /> Add source
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!publishConfirm} onOpenChange={(open) => !open && setPublishConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish this post?</DialogTitle>
            <DialogDescription>It will go live immediately at /blog/{slug || slugifyTitle(title)}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {publishConfirm?.checking && (
              <p className="text-muted-foreground flex items-center gap-2">
                <Loader2Icon className="size-3.5 animate-spin" /> Checking for duplicate titles…
              </p>
            )}
            {publishConfirm?.duplicateOf && (
              <p className="text-destructive flex items-start gap-2">
                <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />A post titled &quot;
                {publishConfirm.duplicateOf.title}&quot; already exists (/blog/{publishConfirm.duplicateOf.slug}).
              </p>
            )}
            {publishConfirm?.warnings.map((w) => (
              <p key={w} className="text-muted-foreground flex items-start gap-2">
                <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" /> {w}
              </p>
            ))}
            {!publishConfirm?.checking && publishConfirm?.warnings.length === 0 && !publishConfirm?.duplicateOf && (
              <p className="text-muted-foreground">Looks good — no issues found.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishConfirm(null)}>
              Cancel
            </Button>
            <Button onClick={confirmPublish} disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />} Publish now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!publishSuccess} onOpenChange={(open) => !open && dismissPublishSuccess()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Post published successfully</DialogTitle>
            <DialogDescription>Your post has been published and is now live.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 pt-2 pb-1 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative flex size-24 items-center justify-center"
            >
              {[
                { top: "2%", left: "8%", size: 7, delay: 0.3 },
                { top: "78%", left: "2%", size: 5, delay: 0.45 },
                { top: "-2%", left: "78%", size: 5, delay: 0.5 },
                { top: "82%", left: "82%", size: 7, delay: 0.35 },
              ].map((dot, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: dot.delay, type: "spring", stiffness: 300 }}
                  className="bg-success/50 absolute rounded-full"
                  style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size }}
                />
              ))}
              <SparkleIcon className="text-success/70 absolute -top-1 right-0 size-4" />
              <SparkleIcon className="text-success/50 absolute bottom-0 -left-1 size-3" />
              <div className="bg-success/15 flex size-20 items-center justify-center rounded-full">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 15 }}
                >
                  <CheckIcon className="text-success size-9" strokeWidth={3} />
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-1.5"
            >
              <h2 className="text-xl font-semibold">Post Published Successfully!</h2>
              <p className="text-muted-foreground text-sm text-balance">
                Your post &quot;
                <span className="text-success font-medium">{publishSuccess?.title}</span>
                &quot; has been published and is now live.
              </p>
            </motion.div>
          </div>
          <div className="border-t" />
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" asChild>
              <a href={`/blog/${publishSuccess?.slug}`} target="_blank" rel="noreferrer">
                View Post <ExternalLinkIcon />
              </a>
            </Button>
            <Button onClick={() => router.push("/admin/posts")}>Go to Posts</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-1.5">
          <Input
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
        <PlusIcon /> Add
      </Button>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {items.filter(Boolean).map((item, i) => (
            <Badge key={i} variant="secondary" className="max-w-full truncate">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
