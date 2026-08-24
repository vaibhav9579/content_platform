import type { Metadata } from "next";

import { getSubscribers } from "@/features/newsletter/actions";
import { SubscriberTable } from "@/components/admin/newsletter/subscriber-table";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Newsletter" };

export default async function AdminNewsletterPage({ searchParams }: PageProps<"/admin/newsletter">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { subscribers, totalCount, activeCount, totalPages, pageSize } = await getSubscribers(undefined, page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Newsletter</h1>
        <p className="text-muted-foreground text-sm">
          {activeCount} active subscriber{activeCount === 1 ? "" : "s"} of {totalCount} total.
        </p>
      </div>
      <Card>
        <CardContent className="pt-5 pb-5">
          <SubscriberTable
            subscribers={JSON.parse(JSON.stringify(subscribers))}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
