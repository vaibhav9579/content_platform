import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheckIcon } from "lucide-react";

import { getPublicAuthors } from "@/features/authors/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Authors",
  description: "Meet the writers and experts behind our articles.",
  alternates: { canonical: "/author" },
};

export default async function AuthorsPage() {
  const authors = await getPublicAuthors();

  return (
    <div className="container-wide py-12">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Authors</h1>
      <p className="text-muted-foreground mt-2">Meet the writers and experts behind our articles.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((author) => (
          <Link key={author.id} href={`/author/${author.slug}`}>
            <Card className="hover:border-foreground/20 h-full transition-colors">
              <CardContent className="flex items-center gap-3 pt-5 pb-5">
                <Avatar className="size-12">
                  <AvatarImage src={author.avatarUrl ?? undefined} />
                  <AvatarFallback>{author.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate font-medium">
                    {author.name}
                    {author.isVerified && <BadgeCheckIcon className="text-primary size-3.5 shrink-0" />}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {author.title ?? `${author._count.posts} articles`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
