
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConversionFunnelProps {
  data: {
    impressions: number;
    clicks: number;
    sessions: number;
    conversions?: number;
  };
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const stages = [
    { name: "Search Impressions", value: data.impressions, color: "bg-blue-500" },
    { name: "Search Clicks", value: data.clicks, color: "bg-green-500" },
    { name: "Website Sessions", value: data.sessions, color: "bg-orange-500" },
    { name: "Conversions", value: data.conversions || 0, color: "bg-purple-500" }
  ];

  const maxValue = Math.max(...stages.map(s => s.value));

  const getConversionRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current / previous) * 100).toFixed(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const width = (stage.value / maxValue) * 100;
            const nextStage = stages[index + 1];
            const conversionRate = nextStage ? getConversionRate(nextStage.value, stage.value) : null;
            
            return (
              <div key={stage.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{stage.name}</span>
                  <div className="text-right">
                    <div className="font-bold">{stage.value.toLocaleString()}</div>
                    {conversionRate && (
                      <div className="text-sm text-muted-foreground">
                        {conversionRate}% conversion
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stage.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {data.clicks > 0 && data.impressions > 0 ? 
                ((data.clicks / data.impressions) * 100).toFixed(1) : '0.0'}%
            </div>
            <div className="text-sm text-muted-foreground">Click-Through Rate</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {data.sessions > 0 && data.clicks > 0 ? 
                ((data.sessions / data.clicks) * 100).toFixed(1) : '0.0'}%
            </div>
            <div className="text-sm text-muted-foreground">Click-to-Session Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
