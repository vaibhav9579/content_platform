"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2Icon, AlertTriangleIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "warning" | "default";
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  icon: Icon = AlertTriangleIcon,
  onConfirm,
  isPending = false,
}: ConfirmActionDialogProps) {
  const dotColor =
    variant === "destructive"
      ? "bg-destructive/40"
      : variant === "warning"
        ? "bg-amber-500/40"
        : "bg-primary/40";

  const circleBg =
    variant === "destructive"
      ? "bg-destructive/15 text-destructive"
      : variant === "warning"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : "bg-primary/15 text-primary";

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {typeof description === "string" ? description : "Action confirmation dialog"}
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
                className={cn("absolute rounded-full", dotColor)}
                style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size }}
              />
            ))}

            <div className={cn("flex size-20 items-center justify-center rounded-full", circleBg)}>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 15 }}
              >
                <Icon className="size-9" strokeWidth={2.2} />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-1.5"
          >
            <h2 className="text-xl font-semibold">{title}</h2>
            <div className="text-muted-foreground text-sm text-balance">{description}</div>
          </motion.div>
        </div>

        <div className="border-t" />

        <DialogFooter className="gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : variant === "default" ? "default" : undefined}
            className={
              variant === "warning"
                ? "bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-500"
                : undefined
            }
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2Icon className="mr-1.5 size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
