import type { Metadata } from "next";

import { getTopPostsBy, getReferrerBreakdown } from "@/features/analytics/actions";
import { AnalyticsExplorer } from "@/components/admin/analytics/analytics-explorer";
import { ReferrerChart } from "@/components/admin/analytics/referrer-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const [posts, referrers] = await Promise.all([getTopPostsBy("viewCount"), getReferrerBreakdown()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">Engagement breakdown across your entire catalog.</p>
      </div>

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
          <CardTitle>Article Performance</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <AnalyticsExplorer initialPosts={posts} />
        </CardContent>
      </Card>
    </div>
  );
}
