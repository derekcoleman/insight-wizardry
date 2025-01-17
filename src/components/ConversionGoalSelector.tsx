import { Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConversionGoal {
  id: string;
  name: string;
}

interface ConversionGoalSelectorProps {
  goals: ConversionGoal[];
  value: string;
  onValueChange: (value: string) => void;
}

export function ConversionGoalSelector({
  goals,
  value,
  onValueChange,
}: ConversionGoalSelectorProps) {
  if (!goals || goals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Target className="h-4 w-4" />
        Select Conversion Metric
      </label>
      <Select
        value={value}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a conversion metric to track" />
        </SelectTrigger>
        <SelectContent>
          {goals.map((goal) => (
            <SelectItem key={goal.id} value={goal.id}>
              {goal.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}