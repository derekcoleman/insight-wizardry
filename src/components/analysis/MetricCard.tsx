interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  suffix?: string;
  source?: string;
}

export function MetricCard({ title, value, change, suffix = '', source }: MetricCardProps) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {source && (
          <p className="text-xs text-muted-foreground">{source}</p>
        )}
      </div>
      <p className="text-2xl font-bold">
        {suffix && suffix}{value?.toLocaleString() ?? '0'}
      </p>
      <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
      </p>
    </div>
  );
}