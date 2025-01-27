import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon?: React.ReactNode;
}

export function MetricOverviewCard({ title, value, change, icon }: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold">{value}</p>
        <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </p>
      </div>
    </Card>
  );
}