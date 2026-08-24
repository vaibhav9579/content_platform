"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { PencilIcon, PlusIcon, Trash2Icon, BadgeCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/ui/pagination";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { saveAuthor, deleteAuthor } from "@/features/authors/actions";
import { slugifyTitle } from "@/lib/content/slug";

type Author = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  title: string | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  isVerified: boolean;
  featured: boolean;
  _count: { posts: number };
};

const emptyForm = {
  id: undefined as string | undefined,
  name: "",
  slug: "",
  bio: "",
  avatarUrl: "",
  title: "",
  websiteUrl: "",
  twitterUrl: "",
  linkedinUrl: "",
  githubUrl: "",
  isVerified: false,
  featured: false,
};

export function AuthorManager({
  authors,
  page,
  totalPages,
  totalCount,
  pageSize,
}: {
  authors: Author[];
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = React.useState(false);

  function openCreate() {
    setForm(emptyForm);
    setSlugTouched(false);
    setOpen(true);
  }

  function openEdit(author: Author) {
    setForm({
      id: author.id,
      name: author.name,
      slug: author.slug,
      bio: author.bio ?? "",
      avatarUrl: author.avatarUrl ?? "",
      title: author.title ?? "",
      websiteUrl: author.websiteUrl ?? "",
      twitterUrl: author.twitterUrl ?? "",
      linkedinUrl: author.linkedinUrl ?? "",
      githubUrl: author.githubUrl ?? "",
      isVerified: author.isVerified,
      featured: author.featured,
    });
    setSlugTouched(true);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveAuthor({
        ...form,
        slug: form.slug || slugifyTitle(form.name),
      });
      if (result.success) {
        toast.success(`Author ${form.id ? "updated" : "created"}`);
        setOpen(false);
      } else toast.error(result.error);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAuthor(id);
      if (result.success) toast.success("Author deleted");
      else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <PlusIcon /> New Author
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{form.id ? "Edit" : "New"} Author</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <ImageUploadField
                  label="Avatar"
                  aspect="aspect-square max-w-[120px]"
                  folder="content-platform/authors"
                  value={form.avatarUrl}
                  onChange={(url) => setForm((f) => ({ ...f, avatarUrl: url }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input
                      required
                      value={form.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugifyTitle(name) }));
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Slug</Label>
                    <Input
                      required
                      value={form.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setForm((f) => ({ ...f, slug: e.target.value }));
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    placeholder="Senior Editor"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Bio</Label>
                  <Textarea
                    rows={3}
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Website</Label>
                    <Input
                      value={form.websiteUrl}
                      onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Twitter</Label>
                    <Input
                      value={form.twitterUrl}
                      onChange={(e) => setForm((f) => ({ ...f, twitterUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>LinkedIn</Label>
                    <Input
                      value={form.linkedinUrl}
                      onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>GitHub</Label>
                    <Input
                      value={form.githubUrl}
                      onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="verified">Verified author</Label>
                  <Switch
                    id="verified"
                    checked={form.isVerified}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, isVerified: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="featured">Featured on author directory</Label>
                  <Switch
                    id="featured"
                    checked={form.featured}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {authors.map((author) => (
              <TableRow key={author.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarImage src={author.avatarUrl ?? undefined} />
                      <AvatarFallback>{author.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{author.name}</span>
                    {author.isVerified && <BadgeCheckIcon className="text-primary size-4" />}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{author.title ?? "—"}</TableCell>
                <TableCell>{author._count.posts}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(author)}>
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(author.id)}>
                    <Trash2Icon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {authors.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                  No authors yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        hrefForPage={(p) => `/admin/authors?page=${p}`}
      />
    </div>
  );
}
