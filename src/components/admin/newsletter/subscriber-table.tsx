"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2Icon, DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationBar } from "@/components/ui/pagination";
import { deleteSubscriber, getAllSubscribersForExport } from "@/features/newsletter/actions";
import { formatDate } from "@/lib/utils";

type Subscriber = {
  id: string;
  email: string;
  status: string;
  source: string | null;
  createdAt: string;
};

export function SubscriberTable({
  subscribers,
  page,
  totalPages,
  totalCount,
  pageSize,
}: {
  subscribers: Subscriber[];
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}) {
  const [pending, startTransition] = useTransition();
  const [exporting, setExporting] = React.useState(false);

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteSubscriber(id);
      if (result.success) toast.success("Subscriber removed");
      else toast.error(result.error);
    });
  }

  async function exportCsv() {
    setExporting(true);
    try {
      // Every subscriber, not just the current page — export should reflect
      // the whole list regardless of where the table happens to be scrolled to.
      const all = await getAllSubscribersForExport();
      const rows = [
        ["Email", "Status", "Source", "Subscribed"],
        ...all.map((s) => [s.email, s.status, s.source ?? "", s.createdAt.toString()]),
      ];
      const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "subscribers.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
          <DownloadIcon /> {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Subscribed</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscribers.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.email}</TableCell>
              <TableCell>
                <Badge variant={s.status === "ACTIVE" ? "success" : "secondary"}>{s.status}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{s.source ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" disabled={pending} onClick={() => handleDelete(s.id)}>
                  <Trash2Icon className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {subscribers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                No subscribers yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <PaginationBar
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        hrefForPage={(p) => `/admin/newsletter?page=${p}`}
      />
    </div>
  );
}
