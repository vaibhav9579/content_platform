"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2Icon, DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteSubscriber } from "@/features/newsletter/actions";
import { formatDate } from "@/lib/utils";

type Subscriber = {
  id: string;
  email: string;
  status: string;
  source: string | null;
  createdAt: string;
};

export function SubscriberTable({ subscribers }: { subscribers: Subscriber[] }) {
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteSubscriber(id);
      if (result.success) toast.success("Subscriber removed");
      else toast.error(result.error);
    });
  }

  function exportCsv() {
    const rows = [
      ["Email", "Status", "Source", "Subscribed"],
      ...subscribers.map((s) => [s.email, s.status, s.source ?? "", s.createdAt]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <DownloadIcon /> Export CSV
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
    </div>
  );
}
