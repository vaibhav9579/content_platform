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
} from "lucide-react";

import { getDashboardStats } from "@/features/analytics/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrafficChart } from "@/components/admin/traffic-chart";
import { formatCompactNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

const statCards = [
  { key: "totalViews", label: "Total Post Views", icon: EyeIcon },
  { key: "uniqueVisitors30d", label: "Unique Visitors (30d)", icon: UsersIcon },
  { key: "published", label: "Published Posts", icon: FileTextIcon },
  { key: "pendingComments", label: "Pending Comments", icon: MessageSquareIcon },
  { key: "subscribers", label: "Subscribers", icon: MailIcon },
] as const;

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">An overview of your publication&apos;s performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {statCards.map((card) => (
          <Card key={card.key}>
            <CardContent className="flex items-center justify-between pt-5 pb-5">
              <div>
                <p className="text-muted-foreground text-xs font-medium">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatCompactNumber(stats[card.key] as number)}
                </p>
              </div>
              <card.icon className="text-muted-foreground/50 size-8" strokeWidth={1.5} />
            </CardContent>
          </Card>
        ))}
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Content Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-5">
            <StatusRow icon={FileTextIcon} label="Published" value={stats.published} />
            <StatusRow icon={ClockIcon} label="Drafts" value={stats.drafts} />
            <StatusRow icon={CalendarClockIcon} label="Scheduled" value={stats.scheduled} />
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
                  <span className="text-muted-foreground w-5 text-sm font-medium tabular-nums">{i + 1}</span>
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Icon className="size-4" /> {label}
      </div>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
