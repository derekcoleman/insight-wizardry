
import { SearchableSelect } from "@/components/SearchableSelect";

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
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
      </label>
      <SearchableSelect
        options={accounts}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
      />
    </div>
  );
}
