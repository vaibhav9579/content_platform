"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { DifficultyLevel, PostStatus } from "@prisma/client";
import {
  EyeIcon,
  PlusIcon,
  Trash2Icon,
  DownloadIcon,
  UploadIcon,
  Loader2Icon,
  CheckIcon,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { TagMultiselect } from "@/components/admin/posts/tag-multiselect";
import { RevisionHistoryDialog } from "@/components/admin/posts/revision-history-dialog";
import { savePost, autosavePost } from "@/features/posts/actions/post-actions";
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

export function PostEditorShell({
  mode,
  post,
  formData,
  revisions = [],
}: {
  mode: "create" | "edit";
  post?: ExistingPost;
  formData: FormData;
  revisions?: Revision;
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

  const contentRef = React.useRef<{ json: JSONContent; html: string }>({
    json: (post?.contentJson as JSONContent) ?? {},
    html: "",
  });

  function handleEditorUpdate(payload: { json: JSONContent; html: string; words: number }) {
    contentRef.current = { json: payload.json, html: payload.html };
    const stats = computeReadingStats(payload.html);
    setStats({ words: stats.words, minutes: stats.minutes });
  }

  function buildInput(overrideStatus?: PostStatus): PostInput {
    return {
      id: postId,
      title,
      subtitle: subtitle || null,
      slug: slug || slugifyTitle(title),
      contentJson: contentRef.current.json,
      contentHtml: contentRef.current.html,
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

  function handleSave(overrideStatus?: PostStatus) {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!authorId) {
      toast.error("Select an author");
      return;
    }
    startTransition(async () => {
      const result = await savePost(buildInput(overrideStatus));
      if (result.success) {
        toast.success(overrideStatus === PostStatus.PUBLISHED ? "Published!" : "Saved");
        setLastSavedAt(new Date());
        if (mode === "create") {
          router.push(`/admin/posts/${result.data.id}/edit`);
        } else {
          setPostId(result.data.id);
          setSlug(result.data.slug);
          router.refresh();
        }
      } else {
        toast.error(result.error);
      }
    });
  }

  // Autosave every 20s once the post exists.
  React.useEffect(() => {
    if (!postId) return;
    const interval = setInterval(() => {
      if (!contentRef.current.html) return;
      autosavePost(postId, contentRef.current.json, contentRef.current.html).then((res) => {
        if (res.success) setLastSavedAt(new Date());
      });
    }, 20000);
    return () => clearInterval(interval);
  }, [postId]);

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

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      {/* Main editor column */}
      <div className="min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span>{stats.words} words</span>
            <span>·</span>
            <span>{stats.minutes} min read</span>
            {lastSavedAt && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <CheckIcon className="size-3" /> Saved {lastSavedAt.toLocaleTimeString()}
                </span>
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
                  <SelectItem value={PostStatus.SCHEDULED}>Scheduled</SelectItem>
                  <SelectItem value={PostStatus.PUBLISHED}>Published</SelectItem>
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
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button className="flex-1" disabled={pending} onClick={() => handleSave()}>
                {pending && <Loader2Icon className="animate-spin" />} Save
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={pending}
                onClick={() => handleSave(PostStatus.PUBLISHED)}
              >
                Publish
              </Button>
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

        <Card>
          <CardContent className="pt-5 pb-2">
            <Accordion type="multiple" defaultValue={[]}>
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
