
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  higherIsBetter?: boolean;
}

export function MetricCard({ title, value, change, higherIsBetter = true }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
      return val.toLocaleString();
    }
    return val;
  };

  const isPositive = higherIsBetter ? change >= 0 : change <= 0;
  const absChange = Math.abs(change);

  return (
    <div className="p-3 border rounded-lg">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xl font-bold">{formatValue(value)}</p>
      {change !== 0 && (
        <div className="flex items-center mt-1">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
          )}
          <span className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {absChange.toFixed(1)}%
          </span>
        </div>
      )}
      {change === 0 && (
        <div className="flex items-center mt-1">
          <Minus className="h-3 w-3 text-gray-500 mr-1" />
          <span className="text-xs text-gray-500">No change</span>
        </div>
      )}
    </div>
  );
}
