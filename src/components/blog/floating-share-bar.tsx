"use client";

import * as React from "react";
import { motion, useScroll } from "framer-motion";
import { toast } from "sonner";
import { LinkIcon, ArrowUpIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { recordShare } from "@/features/analytics/actions";
import { withShareUtm } from "@/lib/analytics/utm-link";
import { BookmarkButton } from "@/components/blog/bookmark-button";

export function FloatingShareBar({ postId, title }: { postId: string; title: string }) {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    return scrollYProgress.on("change", (v) => setVisible(v > 0.08));
  }, [scrollYProgress]);

  function share(network: "x" | "linkedin" | "facebook") {
    const url = withShareUtm(window.location.href, network);
    const urls: Record<typeof network, string> = {
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    };
    window.open(urls[network], "_blank", "noopener,noreferrer,width=600,height=500");
    recordShare(postId, network);
  }

  function copyLink() {
    const url = withShareUtm(window.location.href, "copy");
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied");
    recordShare(postId, "copy");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
      className="bg-card fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border p-1.5 shadow-lg no-print sm:bottom-8"
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <BookmarkButton postId={postId} variant="ghost" />
      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => share("x")} aria-label="Share on X">
        𝕏
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => share("linkedin")} aria-label="Share on LinkedIn">
        in
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full" onClick={copyLink} aria-label="Copy link">
        {copied ? <CheckIcon className="size-4" /> : <LinkIcon className="size-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        <ArrowUpIcon className="size-4" />
      </Button>
    </motion.div>
  );
}
