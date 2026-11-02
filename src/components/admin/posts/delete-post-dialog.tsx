"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Trash2Icon, Loader2Icon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface DeletePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postTitle?: string;
  isPermanent?: boolean;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
}

export function DeletePostDialog({
  open,
  onOpenChange,
  postTitle,
  isPermanent = false,
  onConfirm,
  isPending = false,
}: DeletePostDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{isPermanent ? "Permanently delete post" : "Move post to trash"}</DialogTitle>
          <DialogDescription>
            {isPermanent
              ? "Confirm permanent deletion of the selected post."
              : "Confirm moving the selected post to trash."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 pt-2 pb-1 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative flex size-24 items-center justify-center"
          >
            {[
              { top: "2%", left: "8%", size: 7, delay: 0.3 },
              { top: "78%", left: "2%", size: 5, delay: 0.45 },
              { top: "-2%", left: "78%", size: 5, delay: 0.5 },
              { top: "82%", left: "82%", size: 7, delay: 0.35 },
            ].map((dot, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: dot.delay, type: "spring", stiffness: 300 }}
                className="bg-destructive/40 absolute rounded-full"
                style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size }}
              />
            ))}

            <div className="bg-destructive/15 flex size-20 items-center justify-center rounded-full">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 15 }}
              >
                <Trash2Icon className="text-destructive size-9" strokeWidth={2.2} />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-1.5"
          >
            <h2 className="text-xl font-semibold">
              {isPermanent ? "Permanently Delete Post?" : "Move Post to Trash?"}
            </h2>
            <p className="text-muted-foreground text-sm text-balance">
              {isPermanent ? (
                <>
                  This action <strong className="text-destructive font-semibold">cannot be undone</strong>.
                  {postTitle ? (
                    <>
                      {" "}Post &quot;<span className="font-medium text-foreground">{postTitle}</span>&quot; will be permanently deleted.
                    </>
                  ) : (
                    " This post will be permanently deleted."
                  )}
                </>
              ) : (
                <>
                  Are you sure you want to move
                  {postTitle ? (
                    <>
                      {" "}&quot;<span className="font-medium text-foreground">{postTitle}</span>&quot;
                    </>
                  ) : (
                    " this post"
                  )}{" "}
                  to trash? You can restore it later from the Trash tab.
                </>
              )}
            </p>
          </motion.div>
        </div>

        <div className="border-t" />

        <DialogFooter className="gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2Icon className="mr-1.5 size-4 animate-spin" />}
            {isPermanent ? "Delete Permanently" : "Move to Trash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
