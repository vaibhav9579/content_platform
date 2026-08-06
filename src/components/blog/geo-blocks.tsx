import { CheckIcon, ExternalLinkIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function SummaryBlock({ summary }: { summary: string }) {
  return (
    <div className="border-primary/30 bg-primary/[0.04] not-prose my-8 rounded-xl border-l-2 p-5">
      <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
        Quick Answer
      </p>
      <p className="text-lg leading-relaxed font-medium text-balance">{summary}</p>
    </div>
  );
}

export function KeyTakeaways({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-muted/40 not-prose my-8 rounded-xl border p-5">
      <p className="mb-3 text-sm font-semibold">Key Takeaways</p>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
            <CheckIcon className="text-success mt-0.5 size-4 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FaqSection({ items }: { items: { question: string; answer: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="not-prose my-10" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="font-sans mb-4 text-2xl font-semibold tracking-tight">
        Frequently Asked Questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left font-medium">{item.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export function SourcesSection({ items }: { items: { label: string; url: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="not-prose my-10" aria-labelledby="sources-heading">
      <h2 id="sources-heading" className="font-sans mb-4 text-2xl font-semibold tracking-tight">
        Sources & References
      </h2>
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <span className="tabular-nums">[{i + 1}]</span> {item.label}
              <ExternalLinkIcon className="size-3" />
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
