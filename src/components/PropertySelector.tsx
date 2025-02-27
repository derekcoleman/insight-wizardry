
import { useState } from "react";
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

  // Filter accounts based on search query
  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search input without losing focus
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent event bubbling
    setSearchQuery(e.target.value);
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
        <SelectContent>
          <div className="px-2 pb-2">
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={handleSearchChange}
              onClick={(e) => e.stopPropagation()} // Prevent clicking the input from closing the dropdown
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
