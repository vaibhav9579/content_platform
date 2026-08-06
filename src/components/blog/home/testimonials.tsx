import { StarIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const TESTIMONIALS = [
  {
    quote:
      "The most consistently well-researched publication I subscribe to. Every article reads like it was written by someone who actually shipped the thing.",
    name: "Elena Vasquez",
    title: "VP Engineering, Northwind",
  },
  {
    quote:
      "I recommend this to every engineer on my team. The depth-to-length ratio is unmatched — no fluff, just the parts that matter.",
    name: "Marcus Chen",
    title: "Staff Engineer, Latch",
  },
  {
    quote:
      "Rare to find a blog that treats both beginners and experts with respect. The structured breakdowns save me hours every week.",
    name: "Priya Raman",
    title: "Head of Platform, Ferrovia",
  },
];

export function Testimonials() {
  return (
    <section className="container-wide py-16">
      <h2 className="mb-8 text-center font-serif text-3xl font-semibold tracking-tight">
        Trusted by builders everywhere
      </h2>
      <div className="grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <Card key={t.name}>
            <CardContent className="space-y-3 pt-6 pb-6">
              <div className="text-warning flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="size-3.5 fill-current" />
                ))}
              </div>
              <p className="text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-muted-foreground text-xs">{t.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
