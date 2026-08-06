"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSiteSettings } from "@/features/settings/actions";
import type { SiteSettingsInput } from "@/lib/validations";

export function SettingsForm({ settings }: { settings: SiteSettingsInput }) {
  const [form, setForm] = React.useState<SiteSettingsInput>(settings);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof SiteSettingsInput>(key: K, value: SiteSettingsInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateSiteSettings(form);
      if (result.success) toast.success("Settings saved");
      else toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-5">
          <Field label="Site Name">
            <Input value={form.siteName} onChange={(e) => set("siteName", e.target.value)} required />
          </Field>
          <Field label="Description">
            <Textarea
              rows={2}
              value={form.siteDescription}
              onChange={(e) => set("siteDescription", e.target.value)}
              required
            />
          </Field>
          <Field label="Site URL">
            <Input value={form.siteUrl} onChange={(e) => set("siteUrl", e.target.value)} required />
          </Field>
          <Field label="Contact Email">
            <Input value={form.contactEmail ?? ""} onChange={(e) => set("contactEmail", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-5">
          <Field label="Logo URL">
            <Input value={form.logoUrl ?? ""} onChange={(e) => set("logoUrl", e.target.value)} />
          </Field>
          <Field label="Favicon URL">
            <Input value={form.faviconUrl ?? ""} onChange={(e) => set("faviconUrl", e.target.value)} />
          </Field>
          <Field label="Default OG Image">
            <Input value={form.defaultOgImageUrl ?? ""} onChange={(e) => set("defaultOgImageUrl", e.target.value)} />
          </Field>
          <Field label="Twitter Handle">
            <Input
              placeholder="@yourhandle"
              value={form.twitterHandle ?? ""}
              onChange={(e) => set("twitterHandle", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization & Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-5">
          <Field label="Organization Name">
            <Input value={form.organizationName ?? ""} onChange={(e) => set("organizationName", e.target.value)} />
          </Field>
          <Field label="Organization Logo URL">
            <Input
              value={form.organizationLogoUrl ?? ""}
              onChange={(e) => set("organizationLogoUrl", e.target.value)}
            />
          </Field>
          <Field label="Google Search Console Verification">
            <Input
              value={form.googleSiteVerification ?? ""}
              onChange={(e) => set("googleSiteVerification", e.target.value)}
            />
          </Field>
          <Field label="Bing Webmaster Verification">
            <Input
              value={form.bingSiteVerification ?? ""}
              onChange={(e) => set("bingSiteVerification", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save Settings"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
