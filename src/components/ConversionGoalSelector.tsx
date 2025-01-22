import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Conversion Goal</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select conversion goal" />
        </SelectTrigger>
        <SelectContent>
          {goals.map((goal) => (
            <SelectItem key={goal.id} value={goal.id}>
              {formatEventName(goal.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}