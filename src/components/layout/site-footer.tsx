import Link from "next/link";
import Image from "next/image";

import { siteConfig } from "@/config/site";
import { NewsletterForm } from "@/components/shared/newsletter-form";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  return (
    <footer className="border-border/60 bg-muted/20 mt-24 border-t">
      <div className="container-wide grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div>
          <Link href="/" className="inline-block rounded-md bg-white px-2 py-1.5">
            <Image src={siteConfig.logo} alt={siteConfig.name} width={1000} height={328} className="h-8 w-auto" />
          </Link>
          <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
            {siteConfig.description}
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-semibold">Explore</p>
          <ul className="text-muted-foreground space-y-2">
            <li><Link href="/blog" className="hover:text-foreground transition-colors">All Articles</Link></li>
            <li><Link href="/category" className="hover:text-foreground transition-colors">Categories</Link></li>
            <li><Link href="/author" className="hover:text-foreground transition-colors">Authors</Link></li>
          </ul>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-semibold">Company</p>
          <ul className="text-muted-foreground space-y-2">
            <li><Link href="/rss.xml" className="hover:text-foreground transition-colors">RSS Feed</Link></li>
            <li><a href={siteConfig.links.twitter} className="hover:text-foreground transition-colors">Twitter</a></li>
            <li><a href={siteConfig.links.github} className="hover:text-foreground transition-colors">GitHub</a></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">Stay in the loop</p>
          <p className="text-muted-foreground mt-1 mb-3 text-sm">
            One email a week. No spam, ever.
          </p>
          <NewsletterForm source="footer" />
        </div>
      </div>

      <Separator />

      <div className="container-wide text-muted-foreground flex flex-col items-center justify-between gap-2 py-6 text-xs sm:flex-row">
        <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
