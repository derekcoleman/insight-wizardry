
import { SearchableSelect } from "@/components/SearchableSelect";

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
  // Format event names for display
  const formattedGoals = goals.map(goal => ({
    id: goal.id,
    name: formatEventName(goal.name)
  }));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Conversion Goal</label>
      <SearchableSelect
        options={formattedGoals}
        value={value}
        onValueChange={onValueChange}
        placeholder="Select conversion goal"
      />
    </div>
  );
}
