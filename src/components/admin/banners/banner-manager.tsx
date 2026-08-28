"use client";

import * as React from "react";
import { useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { PlusIcon, PencilIcon, Trash2Icon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { saveBanner, deleteBanner, getBanners } from "@/features/banners/actions";
import type { BannerInput } from "@/lib/validations";

type Banner = Awaited<ReturnType<typeof getBanners>>[number];

const EMPTY_FORM: BannerInput = {
  title: "",
  subtitle: "",
  imageUrl: "",
  imageAlt: "",
  linkUrl: "",
  ctaLabel: "",
  order: 0,
  isActive: true,
  startAt: "",
  endAt: "",
};

function toDateTimeLocal(value: Date | string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function bannerStatus(banner: Banner): { label: string; variant: "success" | "secondary" | "warning" | "outline" } {
  if (!banner.isActive) return { label: "Inactive", variant: "secondary" };
  const now = new Date();
  if (banner.startAt && new Date(banner.startAt) > now) return { label: "Scheduled", variant: "warning" };
  if (banner.endAt && new Date(banner.endAt) < now) return { label: "Expired", variant: "outline" };
  return { label: "Live", variant: "success" };
}

export function BannerManager({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = React.useState(initialBanners);
  const [pending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<BannerInput>(EMPTY_FORM);

  function refresh() {
    startTransition(async () => {
      setBanners(await getBanners());
    });
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(banner: Banner) {
    setForm({
      id: banner.id,
      title: banner.title ?? "",
      subtitle: banner.subtitle ?? "",
      imageUrl: banner.imageUrl,
      imageAlt: banner.imageAlt ?? "",
      linkUrl: banner.linkUrl ?? "",
      ctaLabel: banner.ctaLabel ?? "",
      order: banner.order,
      isActive: banner.isActive,
      startAt: toDateTimeLocal(banner.startAt),
      endAt: toDateTimeLocal(banner.endAt),
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl) {
      toast.error("Upload a banner image first");
      return;
    }
    startTransition(async () => {
      const result = await saveBanner(form);
      if (result.success) {
        toast.success(form.id ? "Banner updated" : "Banner created");
        setDialogOpen(false);
        refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title || "this banner"}"? This can't be undone.`)) return;
    startTransition(async () => {
      const result = await deleteBanner(id);
      if (result.success) {
        toast.success("Banner deleted");
        refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Banners</h1>
          <p className="text-muted-foreground text-sm">
            Marketing and promo banners shown in the homepage hero. When none are active, the site falls back to
            your latest articles.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon /> Add banner
        </Button>
      </div>

      <Card>
        <CardContent className="pt-5 pb-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => {
                const status = bannerStatus(banner);
                return (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-md">
                          <Image src={banner.imageUrl} alt="" fill className="object-cover" unoptimized />
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-xs truncate text-sm font-medium">{banner.title || "Untitled banner"}</p>
                          {banner.linkUrl && (
                            <p className="text-muted-foreground max-w-xs truncate text-xs">{banner.linkUrl}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{banner.order}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {banner.startAt || banner.endAt ? (
                        <>
                          {banner.startAt ? new Date(banner.startAt).toLocaleDateString() : "—"}
                          {" → "}
                          {banner.endAt ? new Date(banner.endAt).toLocaleDateString() : "—"}
                        </>
                      ) : (
                        "Always"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(banner)} aria-label="Edit">
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(banner.id, banner.title ?? "")}
                        aria-label="Delete"
                      >
                        <Trash2Icon className="text-destructive size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {banners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                    No banners yet — add one to replace the homepage hero with a promo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit banner" : "Add banner"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <ImageUploadField
                label="Banner image"
                value={form.imageUrl}
                onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                folder="content-platform/banners"
                aspect="aspect-[21/9]"
              />
              <p className="text-muted-foreground text-[11px]">
                Recommended size: 1600 × 686px (21:9). Uploads are compressed automatically; any image is fine —
                it&apos;s cropped to fit.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="banner-title">Headline</Label>
              <Input
                id="banner-title"
                value={form.title ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Our biggest sale of the year"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="banner-subtitle">Subtitle</Label>
              <Input
                id="banner-subtitle"
                value={form.subtitle ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="Up to 40% off, this week only"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="banner-link">Link URL</Label>
                <Input
                  id="banner-link"
                  value={form.linkUrl ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="/category/product or https://…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="banner-cta">Button label</Label>
                <Input
                  id="banner-cta"
                  value={form.ctaLabel ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                  placeholder="Shop now"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="banner-start">Starts (optional)</Label>
                <Input
                  id="banner-start"
                  type="datetime-local"
                  value={form.startAt ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="banner-end">Ends (optional)</Label>
                <Input
                  id="banner-end"
                  type="datetime-local"
                  value={form.endAt ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Label htmlFor="banner-order">Display order</Label>
                <Input
                  id="banner-order"
                  type="number"
                  min={0}
                  className="w-24"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="banner-active">Active</Label>
                <Switch
                  id="banner-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2Icon className="animate-spin" />} {form.id ? "Save changes" : "Create banner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
