
import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface SearchableSelectProps {
  options: { id: string; name: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  emptyMessage?: string;
  className?: string;
  popoverWidth?: string;
}

export function SearchableSelect({
  options = [],
  value,
  onValueChange,
  placeholder,
  emptyMessage = "No results found.",
  className,
  popoverWidth,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  
  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  // Update selected label when value or options change
  useEffect(() => {
    const selected = safeOptions.find((option) => option.id === value);
    setSelectedLabel(selected ? selected.name : "");
  }, [value, safeOptions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={`p-0 ${popoverWidth || "w-full min-w-[300px]"}`} 
        align="start" 
        sideOffset={5}
      >
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              value={searchValue}
              onValueChange={setSearchValue}
              placeholder="Search..."
              className="h-9 flex-1"
            />
          </div>
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {safeOptions.map((option) => (
              <CommandItem
                key={option.id}
                value={option.name}
                onSelect={() => {
                  onValueChange(option.id);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
