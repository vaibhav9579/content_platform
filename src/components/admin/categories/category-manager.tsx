"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { saveCategory, deleteCategory } from "@/features/categories/actions";
import { slugifyTitle } from "@/lib/content/slug";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  _count: { posts: number; children: number };
};

const emptyForm = { id: undefined as string | undefined, name: "", slug: "", description: "", parentId: "" };

export function CategoryManager({
  categories,
  allCategoryOptions,
  page,
  totalPages,
  totalCount,
  pageSize,
}: {
  categories: Category[];
  allCategoryOptions: { id: string; name: string }[];
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

  function openEdit(category: Category) {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      parentId: category.parentId ?? "",
    });
    setSlugTouched(true);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveCategory({
        id: form.id,
        name: form.name,
        slug: form.slug || slugifyTitle(form.name),
        description: form.description || null,
        parentId: form.parentId || null,
      });
      if (result.success) {
        toast.success(`Category ${form.id ? "updated" : "created"}`);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.success) toast.success("Category deleted");
      else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <PlusIcon /> New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{form.id ? "Edit" : "New"} Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-name">Name</Label>
                  <Input
                    id="cat-name"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({
                        ...f,
                        name,
                        slug: slugTouched ? f.slug : slugifyTitle(name),
                      }));
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-slug">Slug</Label>
                  <Input
                    id="cat-slug"
                    required
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((f) => ({ ...f, slug: e.target.value }));
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-desc">Description</Label>
                  <Textarea
                    id="cat-desc"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Parent category</Label>
                  <Select
                    value={form.parentId || "none"}
                    onValueChange={(v) => setForm((f) => ({ ...f, parentId: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No parent (top-level)</SelectItem>
                      {allCategoryOptions
                        .filter((c) => c.id !== form.id)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
              <TableHead>Parent</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-muted-foreground">/{category.slug}</TableCell>
                <TableCell>
                  {category.parentId ? (
                    <Badge variant="outline">
                      {allCategoryOptions.find((c) => c.id === category.parentId)?.name ?? "—"}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{category._count.posts}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                    <Trash2Icon className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                  No categories yet. Create your first one.
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
        hrefForPage={(p) => `/admin/categories?page=${p}`}
      />
    </div>
  );
}
