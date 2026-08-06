import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-muted-foreground overflow-x-auto text-sm whitespace-nowrap">
      <ol className="flex items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRightIcon className="size-3.5 shrink-0" />}
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-foreground line-clamp-1">
                {item.name}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
