interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  suffix?: string;
}

export function MetricCard({ title, value, change, suffix = '' }: MetricCardProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold">
        {suffix && suffix}{value?.toLocaleString() ?? '0'}
      </p>
      <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Traffic Acquisition: Session primary channel group (Default channel group)
      </p>
    </div>
  );
}