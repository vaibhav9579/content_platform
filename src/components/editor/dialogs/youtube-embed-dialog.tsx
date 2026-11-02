"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ClapperboardIcon, VideoIcon } from "lucide-react";

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

export interface YoutubeEmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmbed: (url: string) => void;
}

export function YoutubeEmbedDialog({ open, onOpenChange, onEmbed }: YoutubeEmbedDialogProps) {
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Reset when opened
  React.useEffect(() => {
    if (open) {
      setUrl("");
      setError(null);
    }
  }, [open]);

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a YouTube video URL");
      return;
    }

    // Basic YouTube validation (accepts youtube.com, youtu.be, shorts, embeds)
    const isYoutube =
      trimmed.includes("youtube.com") ||
      trimmed.includes("youtu.be") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://");

    if (!isYoutube) {
      setError("Please enter a valid YouTube link (e.g. https://www.youtube.com/watch?v=...)");
      return;
    }

    onEmbed(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Embed YouTube Video</DialogTitle>
          <DialogDescription>Paste a YouTube video URL to embed it into your post.</DialogDescription>
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
                  className="bg-red-500/40 absolute rounded-full"
                  style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size }}
                />
              ))}

              <div className="bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400 flex size-20 items-center justify-center rounded-full">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 15 }}
                >
                  <ClapperboardIcon className="size-9" strokeWidth={2.2} />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-1.5"
            >
              <h2 className="text-xl font-semibold">Embed YouTube Video</h2>
              <p className="text-muted-foreground text-sm text-balance">
                Paste a YouTube video or shorts link to embed a responsive player into your article.
              </p>
            </motion.div>
          </div>

          <div className="space-y-2">
            <Input
              type="url"
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
              className="w-full text-sm"
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>

          <div className="border-t" />

          <DialogFooter className="gap-2 sm:justify-center">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
              <VideoIcon className="mr-1.5 size-4" /> Embed Video
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
