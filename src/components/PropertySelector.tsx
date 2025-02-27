
import { useState, useRef, useEffect } from "react";
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
  const [isOpen, setIsOpen] = useState(false);

  // Filter accounts based on search query
  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Use useEffect to focus the input when the dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Slight delay to ensure the dropdown is fully rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle search input without losing focus
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchQuery(e.target.value);
  };

  // Prevent default interactions to maintain focus
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent all key events from propagating to the dropdown
    e.stopPropagation();
    
    // Handle escape key to close dropdown
    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
      </label>
      <Select
        value={value}
        onValueChange={(val) => {
          onValueChange(val);
          setIsOpen(false);
        }}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger onClick={() => setIsOpen(true)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 pb-2">
            <Input
              ref={inputRef}
              placeholder="Search properties..."
              value={searchQuery}
              onChange={handleSearchChange}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onKeyDown={handleInputKeyDown}
              autoComplete="off"
              className="h-8"
            />
          </div>
          <ScrollArea className="h-[200px]">
            {filteredAccounts.map((account) => (
              <SelectItem 
                key={account.id} 
                value={account.id}
              >
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
