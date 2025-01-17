import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServiceSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ServiceSelector({ value, onValueChange }: ServiceSelectorProps) {
  const services = [
    { id: 'organic', name: 'Organic Search' },
    { id: 'paid_social', name: 'Paid Social' },
    { id: 'ppc', name: 'PPC' },
    { id: 'paid_media', name: 'Paid Media (PPC + Paid Social)' },
    { id: 'overall', name: 'Overall Growth' },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Select Primary Service Focus
      </label>
      <Select
        value={value}
        onValueChange={onValueChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select service focus" />
        </SelectTrigger>
        <SelectContent>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              {service.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}