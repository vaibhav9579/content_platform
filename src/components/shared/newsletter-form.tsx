"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { MailIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subscribeToNewsletter } from "@/features/newsletter/actions";
import { cn } from "@/lib/utils";

export function NewsletterForm({ source, className }: { source: string; className?: string }) {
  const [email, setEmail] = React.useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await subscribeToNewsletter({ email, source });
      if (result.success) {
        setDone(true);
        toast.success("You're subscribed! Check your inbox.");
        setEmail("");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (done) {
    return <p className="text-muted-foreground text-sm">🎉 Thanks for subscribing.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex w-full max-w-xs gap-2", className)}>
      <div className="relative flex-1">
        <MailIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
        <Input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-8"
          aria-label="Email address"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Joining…" : "Subscribe"}
      </Button>
    </form>
  );
}
