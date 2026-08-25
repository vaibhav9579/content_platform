import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react";

import { requireStaff, canManageAllPosts } from "@/lib/auth";
import { getSeoHealthReport, type SeoIssue } from "@/features/posts/queries/get-seo-health";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "SEO Dashboard" };

const ISSUE_LABELS: Record<SeoIssue, string> = {
  "missing-meta-description": "Missing meta description",
  "meta-description-too-long": "Meta description over 160 chars",
  "missing-cover-image": "Missing cover image",
  "missing-cover-alt": "Cover image missing alt text",
  "title-too-long": "Title over 70 characters",
  "title-too-short": "Title under 15 characters",
  "missing-category": "No category assigned",
  "no-tags": "No tags assigned",
  "missing-faq": "No FAQ block (GEO)",
};

export default async function AdminSeoPage() {
  const user = await requireStaff();
  if (!user || !canManageAllPosts(user.role)) redirect("/admin/dashboard");

  const report = await getSeoHealthReport();
  const healthPercent = report.totalPosts
    ? Math.round((report.healthyCount / report.totalPosts) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SEO Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Automated audits across every published article for search & GEO readiness.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-muted-foreground text-xs font-medium">Health Score</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{healthPercent}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-muted-foreground text-xs font-medium">Fully Optimized</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {report.healthyCount}/{report.totalPosts}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-muted-foreground text-xs font-medium">Open Issues</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{report.totalIssues}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles needing attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-5">
          {report.posts.map((post) => (
            <div key={post.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href={`/admin/posts/${post.id}/edit`} className="text-sm font-medium hover:underline">
                {post.title}
              </Link>
              <div className="flex flex-wrap gap-1.5">
                {post.issues.map((issue) => (
                  <Badge key={issue} variant="warning" className="gap-1">
                    <AlertTriangleIcon className="size-3" /> {ISSUE_LABELS[issue]}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          {report.posts.length === 0 && (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-sm">
              <CheckCircle2Icon className="text-success size-8" />
              Every published article is fully optimized.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
