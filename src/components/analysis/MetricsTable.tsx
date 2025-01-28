import { formatNumber } from "@/lib/utils";
import { exportToCSV } from "@/utils/csvExport";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

interface MetricsTableProps {
  data: {
    current: any;
    previous: any;
    changes: any;
  };
  conversionGoal: string;
}

export function MetricsTable({ data, conversionGoal }: MetricsTableProps) {
  const formatMetric = (value: number, prefix: string = "") => {
    return `${prefix}${value.toLocaleString()}`;
  };

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return (value / total) * 100;
  };

  const calculateAOV = (revenue: number, conversions: number) => {
    if (conversions === 0) return 0;
    return revenue / conversions;
  };

  const metrics = [
    {
      name: "Total Active Users",
      current: data.current?.activeUsers || 0,
      previous: data.previous?.activeUsers || 0,
      change: data.changes?.activeUsers || 0,
    },
    {
      name: "Organic Users",
      current: data.current?.channelGroupings?.organic_search?.sessions || 0,
      previous: data.previous?.channelGroupings?.organic_search?.sessions || 0,
      change: calculatePercentage(
        (data.current?.channelGroupings?.organic_search?.sessions || 0) - (data.previous?.channelGroupings?.organic_search?.sessions || 0),
        data.previous?.channelGroupings?.organic_search?.sessions || 1
      ),
    },
    {
      name: "Paid Sources Users",
      current: (data.current?.channelGroupings?.paid_social?.sessions || 0) + (data.current?.channelGroupings?.paid_search?.sessions || 0),
      previous: (data.previous?.channelGroupings?.paid_social?.sessions || 0) + (data.previous?.channelGroupings?.paid_search?.sessions || 0),
      change: calculatePercentage(
        ((data.current?.channelGroupings?.paid_social?.sessions || 0) + (data.current?.channelGroupings?.paid_search?.sessions || 0)) -
        ((data.previous?.channelGroupings?.paid_social?.sessions || 0) + (data.previous?.channelGroupings?.paid_search?.sessions || 0)),
        (data.previous?.channelGroupings?.paid_social?.sessions || 0) + (data.previous?.channelGroupings?.paid_search?.sessions || 0) || 1
      ),
    },
    {
      name: `Total ${conversionGoal}`,
      current: data.current?.conversions || 0,
      previous: data.previous?.conversions || 0,
      change: data.changes?.conversions || 0,
    },
    {
      name: "Conversion Rate (CVR)",
      current: calculatePercentage(data.current?.conversions || 0, data.current?.sessions || 1),
      previous: calculatePercentage(data.previous?.conversions || 0, data.previous?.sessions || 1),
      change: data.changes?.conversionRate || 0,
      format: (value: number) => `${value.toFixed(2)}%`,
    },
    {
      name: "Revenue",
      current: data.current?.revenue || 0,
      previous: data.previous?.revenue || 0,
      change: data.changes?.revenue || 0,
      prefix: "$",
    },
    {
      name: "Average Order Value (AOV)",
      current: calculateAOV(data.current?.revenue || 0, data.current?.conversions || 1),
      previous: calculateAOV(data.previous?.revenue || 0, data.previous?.conversions || 1),
      change: calculatePercentage(
        calculateAOV(data.current?.revenue || 0, data.current?.conversions || 1) -
        calculateAOV(data.previous?.revenue || 0, data.previous?.conversions || 1),
        calculateAOV(data.previous?.revenue || 0, data.previous?.conversions || 1) || 1
      ),
      prefix: "$",
    },
  ];

  const handleExportCSV = () => {
    const csvData = metrics.map(metric => ({
      Metric: metric.name,
      Current: metric.format ? metric.format(metric.current) : formatMetric(metric.current, metric.prefix),
      Previous: metric.format ? metric.format(metric.previous) : formatMetric(metric.previous, metric.prefix),
      'Change (%)': `${metric.change >= 0 ? '+' : ''}${metric.change.toFixed(1)}%`
    }));
    
    exportToCSV(csvData, 'metrics-analysis');
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <FileDown className="h-4 w-4" />
          Export to CSV
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Metric</th>
            <th className="text-right py-2">Current</th>
            <th className="text-right py-2">Previous</th>
            <th className="text-right py-2">Change</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric, index) => (
            <tr key={index} className="border-b last:border-0">
              <td className="py-2">{metric.name}</td>
              <td className="text-right py-2">
                {metric.format 
                  ? metric.format(metric.current)
                  : formatMetric(metric.current, metric.prefix)}
              </td>
              <td className="text-right py-2">
                {metric.format
                  ? metric.format(metric.previous)
                  : formatMetric(metric.previous, metric.prefix)}
              </td>
              <td className={`text-right py-2 ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}