import type { Metadata } from "next";

import { getSubscribers } from "@/features/newsletter/actions";
import { SubscriberTable } from "@/components/admin/newsletter/subscriber-table";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Newsletter" };

export default async function AdminNewsletterPage() {
  const subscribers = await getSubscribers();
  const active = subscribers.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Newsletter</h1>
        <p className="text-muted-foreground text-sm">
          {active} active subscriber{active === 1 ? "" : "s"} of {subscribers.length} total.
        </p>
      </div>
      <Card>
        <CardContent className="pt-5 pb-5">
          <SubscriberTable subscribers={JSON.parse(JSON.stringify(subscribers))} />
        </CardContent>
      </Card>
    </div>
  );
}
