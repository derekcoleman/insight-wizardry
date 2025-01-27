interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  suffix?: string;
  channel?: string;
}

export function MetricCard({ title, value, change, suffix = '', channel = 'Overall' }: MetricCardProps) {
  // Format the metric title based on the channel
  const getMetricTitle = () => {
    if (title === 'Sessions') {
      return `${channel} Sessions`;
    }
    if (title === 'Revenue') {
      return `${channel} Revenue`;
    }
    if (title.includes('Conversions')) {
      return `${channel} ${title}`;
    }
    return title;
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{getMetricTitle()}</p>
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