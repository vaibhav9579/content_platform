import Link from "next/link";
import { BadgeCheckIcon, GlobeIcon, Link2Icon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

export function AuthorBioCard({
  author,
}: {
  author: {
    name: string;
    slug: string;
    bio: string | null;
    avatarUrl: string | null;
    title: string | null;
    isVerified: boolean;
    websiteUrl: string | null;
    twitterUrl: string | null;
    linkedinUrl: string | null;
  };
}) {
  return (
    <Card className="not-prose my-10">
      <CardContent className="flex flex-col items-start gap-4 pt-5 pb-5 sm:flex-row">
        <Link href={`/author/${author.slug}`}>
          <Avatar className="size-16">
            <AvatarImage src={author.avatarUrl ?? undefined} />
            <AvatarFallback className="text-lg">{author.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Link href={`/author/${author.slug}`} className="font-semibold hover:underline">
              {author.name}
            </Link>
            {author.isVerified && <BadgeCheckIcon className="text-primary size-4" />}
          </div>
          {author.title && <p className="text-muted-foreground text-sm">{author.title}</p>}
          {author.bio && <p className="text-sm leading-relaxed">{author.bio}</p>}
          <div className="flex items-center gap-3 pt-1">
            {author.websiteUrl && (
              <a href={author.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label="Website">
                <GlobeIcon className="text-muted-foreground hover:text-foreground size-4" />
              </a>
            )}
            {author.linkedinUrl && (
              <a href={author.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Link2Icon className="text-muted-foreground hover:text-foreground size-4" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
