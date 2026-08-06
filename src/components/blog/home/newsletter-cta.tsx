import { NewsletterForm } from "@/components/shared/newsletter-form";

export function NewsletterCta() {
  return (
    <section className="container-wide py-16">
      <div className="bg-foreground text-background flex flex-col items-center gap-4 rounded-2xl px-6 py-14 text-center">
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          Get the best articles in your inbox
        </h2>
        <p className="max-w-md text-sm opacity-80">
          One thoughtful email a week. No spam, unsubscribe anytime.
        </p>
        <NewsletterForm source="homepage" className="mt-2 max-w-sm [&_input]:bg-background/10 [&_input]:text-background [&_input]:border-background/20 [&_input]:placeholder:text-background/50" />
      </div>
    </section>
  );
}
