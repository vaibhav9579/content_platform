import Link from "next/link";
import type { Metadata } from "next";
import {
  FileTextIcon,
  EyeIcon,
  MessageSquareIcon,
  MailIcon,
  ClockIcon,
  CalendarClockIcon,
  UsersIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
} from "lucide-react";

import { redirect } from "next/navigation";

import { requireStaff, canManageAllPosts } from "@/lib/auth";
import { getDashboardStats } from "@/features/analytics/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrafficChart } from "@/components/admin/traffic-chart";
import { StatusDonut } from "@/components/admin/status-donut";
import { formatCompactNumber, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

const statCards = [
  {
    key: "pageViews30d",
    label: "Post Views (30d)",
    icon: EyeIcon,
    trendKey: "pageViews",
    tint: "from-violet-50 to-white dark:from-violet-500/10 dark:to-transparent",
    chip: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  },
  {
    key: "uniqueVisitors30d",
    label: "Unique Visitors (30d)",
    icon: UsersIcon,
    trendKey: "uniqueVisitors",
    tint: "from-emerald-50 to-white dark:from-emerald-500/10 dark:to-transparent",
    chip: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    key: "published",
    label: "Published Posts",
    icon: FileTextIcon,
    trendKey: "published",
    tint: "from-amber-50 to-white dark:from-amber-500/10 dark:to-transparent",
    chip: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  },
  {
    key: "pendingComments",
    label: "Pending Comments",
    icon: MessageSquareIcon,
    trendKey: null,
    tint: "from-rose-50 to-white dark:from-rose-500/10 dark:to-transparent",
    chip: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  },
  {
    key: "subscribers",
    label: "Subscribers",
    icon: MailIcon,
    trendKey: "subscribers",
    tint: "from-sky-50 to-white dark:from-sky-500/10 dark:to-transparent",
    chip: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  },
] as const;

export default async function AdminDashboardPage() {
  const user = await requireStaff();
  if (!user) redirect("/sign-in?redirect_url=/admin/dashboard");

  const stats = await getDashboardStats();
  if (!stats) return null;

  // Subscribers are a site-wide metric, not attributable to one author —
  // only shown to ADMIN/EDITOR, who see everyone's numbers.
  const oversight = canManageAllPosts(user.role);
  const visibleCards = oversight ? statCards : statCards.filter((c) => c.key !== "subscribers");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {oversight
              ? "An overview of your publication's performance."
              : "An overview of your posts' performance."}
          </p>
        </div>
        <Badge variant="outline" className="text-muted-foreground gap-1.5 py-1.5">
          <CalendarIcon className="size-3.5" /> Last 30 days
        </Badge>
      </div>

      <div className={cn("grid grid-cols-2 gap-4", oversight ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
        {visibleCards.map((card) => {
          const trend = card.trendKey ? stats.trends[card.trendKey] : null;
          return (
            <Card key={card.key} className={cn("overflow-hidden border-0 bg-gradient-to-b shadow-sm", card.tint)}>
              <CardContent className="pt-5 pb-5">
                <div className={cn("mb-3 flex size-9 items-center justify-center rounded-lg", card.chip)}>
                  <card.icon className="size-4" strokeWidth={2} />
                </div>
                <p className="text-muted-foreground text-xs font-medium">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatCompactNumber(stats[card.key] as number)}
                </p>
                {trend !== null && (
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1 text-xs font-medium",
                      trend > 0 ? "text-success" : trend < 0 ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {trend > 0 ? (
                      <TrendingUpIcon className="size-3.5" />
                    ) : trend < 0 ? (
                      <TrendingDownIcon className="size-3.5" />
                    ) : null}
                    {trend > 0 ? "+" : ""}
                    {trend}% <span className="text-muted-foreground font-normal">vs prior 30d</span>
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Traffic — Last 30 Days</CardTitle>
            <p className="text-muted-foreground text-xs">
              {formatCompactNumber(stats.uniqueVisitors24h)} unique visitor
              {stats.uniqueVisitors24h === 1 ? "" : "s"} in the last 24h
            </p>
          </CardHeader>
          <CardContent>
            <TrafficChart data={stats.trafficTimeline} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-5">
            <StatusDonut
              total={stats.published + stats.drafts + stats.scheduled}
              slices={[
                { label: "Published", value: stats.published, color: "var(--color-primary)" },
                { label: "Drafts", value: stats.drafts, color: "var(--color-chart-2)" },
                { label: "Scheduled", value: stats.scheduled, color: "var(--color-chart-4)" },
              ]}
            />
            <div className="space-y-2.5">
              <StatusRow icon={FileTextIcon} label="Published" value={stats.published} dot="bg-primary" />
              <StatusRow icon={ClockIcon} label="Drafts" value={stats.drafts} dot="bg-chart-2" />
              <StatusRow icon={CalendarClockIcon} label="Scheduled" value={stats.scheduled} dot="bg-chart-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Articles</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <ul className="divide-border divide-y">
            {stats.topPosts.map((post, i) => (
              <li key={post.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="bg-accent text-accent-foreground flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {post.title}
                  </Link>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-xs">
                  <Badge variant="secondary">{formatCompactNumber(post.viewCount)} views</Badge>
                  <Badge variant="outline">{formatCompactNumber(post.likeCount)} likes</Badge>
                </div>
              </li>
            ))}
            {stats.topPosts.length === 0 && (
              <p className="text-muted-foreground py-6 text-center text-sm">No published articles yet.</p>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusRow({
  icon: Icon,
  label,
  value,
  dot,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  dot: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <span className={cn("size-2 shrink-0 rounded-full", dot)} />
        <Icon className="size-4" /> {label}
      </div>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
