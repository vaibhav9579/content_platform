"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { HistoryIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { restoreRevision } from "@/features/posts/actions/post-actions";
import { formatDate } from "@/lib/utils";

type Revision = {
  id: string;
  title: string;
  createdAt: string;
  summaryOfChange: string | null;
  editor: { name: string | null; email: string } | null;
};

export function RevisionHistoryDialog({ revisions }: { revisions: Revision[] }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = useTransition();

  function handleRestore(id: string) {
    if (!confirm("Restore this revision? Your current unsaved changes will be replaced.")) return;
    startTransition(async () => {
      const result = await restoreRevision(id);
      if (result.success) {
        toast.success("Revision restored — reloading…");
        window.location.reload();
      } else toast.error(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <HistoryIcon /> Revision History ({revisions.length})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revision History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96">
          <div className="space-y-2 pr-4">
            {revisions.map((rev) => (
              <div key={rev.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{rev.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(rev.createdAt)} · {rev.editor?.name ?? rev.editor?.email ?? "Unknown"}
                  </p>
                </div>
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => handleRestore(rev.id)}>
                  Restore
                </Button>
              </div>
            ))}
            {revisions.length === 0 && (
              <p className="text-muted-foreground py-10 text-center text-sm">
                No revisions yet — they appear after your first save.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
