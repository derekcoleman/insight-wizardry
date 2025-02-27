import { useState, useRef } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Account {
  id: string;
  name: string;
}

interface PropertySelectorProps {
  label: string;
  accounts: Account[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
}

export function PropertySelector({
  label,
  accounts,
  value,
  onValueChange,
  placeholder,
}: PropertySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter accounts based on search query
  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search input without losing focus
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchQuery(e.target.value);
    // Keep focus on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Prevent default interactions to maintain focus
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent arrow keys from navigating the dropdown
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.stopPropagation();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
      </label>
      <Select
        value={value}
        onValueChange={onValueChange}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent onPointerDownOutside={(e) => e.preventDefault()}>
          <div className="px-2 pb-2">
            <Input
              ref={inputRef}
              placeholder="Search properties..."
              value={searchQuery}
              onChange={handleSearchChange}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleInputKeyDown}
              autoComplete="off"
              className="h-8"
            />
          </div>
          <ScrollArea className="h-[200px]">
            {filteredAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
            {filteredAccounts.length === 0 && (
              <div className="py-2 px-2 text-sm text-muted-foreground">
                No properties found
              </div>
            )}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}
