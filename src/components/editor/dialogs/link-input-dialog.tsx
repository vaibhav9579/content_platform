"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LinkIcon, Trash2Icon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface LinkInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl?: string;
  title?: string;
  description?: string;
  onSave: (url: string | null) => void;
}

export function LinkInputDialog({
  open,
  onOpenChange,
  initialUrl = "",
  title = "Insert Link",
  description = "Enter the destination web address for this link.",
  onSave,
}: LinkInputDialogProps) {
  const [url, setUrl] = React.useState(initialUrl);

  React.useEffect(() => {
    if (open) {
      setUrl(initialUrl);
    }
  }, [open, initialUrl]);

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      onSave(null);
    } else {
      // Prepend https:// if missing
      const finalUrl =
        trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("mailto:")
          ? trimmed
          : `https://${trimmed}`;
      onSave(finalUrl);
    }
    onOpenChange(false);
  }

  function handleRemove() {
    onSave(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="bg-primary/40 absolute rounded-full"
                  style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size }}
                />
              ))}

              <div className="bg-primary/15 text-primary flex size-20 items-center justify-center rounded-full">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 15 }}
                >
                  <LinkIcon className="size-9" strokeWidth={2.2} />
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
              <p className="text-muted-foreground text-sm text-balance">{description}</p>
            </motion.div>
          </div>

          <div className="space-y-2">
            <Input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
              className="w-full text-sm"
            />
          </div>

          <div className="border-t" />

          <DialogFooter className="gap-2 sm:justify-center">
            {initialUrl && (
              <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={handleRemove}>
                <Trash2Icon className="mr-1.5 size-4" /> Remove Link
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Apply Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
