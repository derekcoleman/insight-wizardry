import { useState } from "react";
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

  // Filter goals based on search query
  const filteredGoals = goals.filter((goal) =>
    goal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Conversion Goal</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select conversion goal" />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 pb-2">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          </div>
          <ScrollArea className="h-[200px]">
            {filteredGoals.map((goal) => (
              <SelectItem key={goal.id} value={goal.id}>
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