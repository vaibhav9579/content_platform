import type { Metadata } from "next";

import { getTopPostsBy, getReferrerBreakdown, getShareBreakdown } from "@/features/analytics/actions";
import { AnalyticsExplorer } from "@/components/admin/analytics/analytics-explorer";
import { ReferrerChart } from "@/components/admin/analytics/referrer-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const [posts, referrers, shares] = await Promise.all([
    getTopPostsBy("viewCount"),
    getReferrerBreakdown(),
    getShareBreakdown(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">Engagement breakdown across your entire catalog.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <ReferrerChart data={referrers} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shares by Channel — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            <ReferrerChart data={shares.map((s) => ({ source: s.network, count: s.count }))} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article Performance</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <AnalyticsExplorer initialPosts={posts} />
        </CardContent>
      </Card>
    </div>
  );
}
