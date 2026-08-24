"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { saveTag, deleteTag } from "@/features/tags/actions";
import { slugifyTitle } from "@/lib/content/slug";

type Tag = { id: string; name: string; slug: string; description: string | null; _count: { posts: number } };

const emptyForm = { id: undefined as string | undefined, name: "", slug: "", description: "" };

export function TagManager({
  tags,
  page,
  totalPages,
  totalCount,
  pageSize,
}: {
  tags: Tag[];
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

  function openEdit(tag: Tag) {
    setForm({ id: tag.id, name: tag.name, slug: tag.slug, description: tag.description ?? "" });
    setSlugTouched(true);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveTag({
        id: form.id,
        name: form.name,
        slug: form.slug || slugifyTitle(form.name),
        description: form.description || null,
      });
      if (result.success) {
        toast.success(`Tag ${form.id ? "updated" : "created"}`);
        setOpen(false);
      } else toast.error(result.error);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTag(id);
      if (result.success) toast.success("Tag deleted");
      else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <PlusIcon /> New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{form.id ? "Edit" : "New"} Tag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tag-name">Name</Label>
                  <Input
                    id="tag-name"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugifyTitle(name) }));
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tag-slug">Slug</Label>
                  <Input
                    id="tag-slug"
                    required
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((f) => ({ ...f, slug: e.target.value }));
                    }}
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
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-medium">{tag.name}</TableCell>
                <TableCell className="text-muted-foreground">/{tag.slug}</TableCell>
                <TableCell>{tag._count.posts}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(tag)}>
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id)}>
                    <Trash2Icon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {tags.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                  No tags yet.
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
        hrefForPage={(p) => `/admin/tags?page=${p}`}
      />
    </div>
  );
}
