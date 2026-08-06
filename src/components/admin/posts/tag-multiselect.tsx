"use client";

import * as React from "react";
import { XIcon, ChevronsUpDownIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export function TagMultiselect({
  options,
  value,
  onChange,
}: {
  options: { id: string; name: string }[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.filter((o) => value.includes(o.id));

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {selected.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="gap-1">
            {tag.name}
            <button type="button" onClick={() => toggle(tag.id)} aria-label={`Remove ${tag.name}`}>
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between">
            Add tags <ChevronsUpDownIcon className="size-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags…" />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {options.map((tag) => (
                  <CommandItem key={tag.id} onSelect={() => toggle(tag.id)}>
                    <div
                      className={`mr-2 flex size-3.5 items-center justify-center rounded-sm border ${
                        value.includes(tag.id) ? "bg-primary border-primary" : ""
                      }`}
                    />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
