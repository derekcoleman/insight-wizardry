
import { useState, useRef, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConversionGoal {
  id: string;
  name: string;
}

interface ConversionGoalSelectorProps {
  goals: ConversionGoal[];
  value: string;
  onValueChange: (value: string) => void;
}

const formatEventName = (eventName: string): string => {
  if (eventName === 'Total Events') return eventName;
  return eventName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export function ConversionGoalSelector({
  goals,
  value,
  onValueChange,
}: ConversionGoalSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Filter goals based on search query
  const filteredGoals = goals.filter((goal) =>
    goal.name.toLowerCase().includes(searchQuery.toLowerCase())
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
      <label className="text-sm font-medium">Select Conversion Goal</label>
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
          <SelectValue placeholder="Select conversion goal" />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 pb-2">
            <Input
              ref={inputRef}
              placeholder="Search events..."
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
            {filteredGoals.map((goal) => (
              <SelectItem 
                key={goal.id} 
                value={goal.id}
              >
                {formatEventName(goal.name)}
              </SelectItem>
            ))}
            {filteredGoals.length === 0 && (
              <div className="py-2 px-2 text-sm text-muted-foreground">
                No events found
              </div>
            )}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}
